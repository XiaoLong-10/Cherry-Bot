const { createAudioPlayer, createAudioResource, AudioPlayerStatus, getVoiceConnection, VoiceConnectionStatus } = require('@discordjs/voice');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const play = require('play-dl');
const ytdl = require('@distube/ytdl-core');
const YouTubeRaw = require('youtube-sr');
const YouTube = YouTubeRaw.default || YouTubeRaw;
const db = require('../../../database.js');
const { joinStandbyChannel } = require('../voiceStandby.js');

// Global map storing active queues per guild ID
const queues = new Map();

/**
 * Guild Music Queue Class
 */
class GuildQueueManager {
    constructor(guildId) {
        this.guildId = guildId;
        this.queue = [];
        this.currentTrack = null;
        this.player = createAudioPlayer();
        this.connection = null;
        this.isPlaying = false;
        this.isPaused = false;
        this.loopMode = 'off'; // 'off' | 'track' | 'queue'
        this.autoplay = false;
        this.volume = 100;
        this.textChannel = null;
        this.nowPlayingMessage = null;
        this.idleTimer = null;
        this.progressInterval = null;
        this.playbackStartTime = 0;

        this.setupPlayerEvents();
    }

    setupPlayerEvents() {
        this.player.on(AudioPlayerStatus.Idle, () => {
            this.handleTrackEnd();
        });

        this.player.on('error', (error) => {
            console.error(`[MusicEngine] Audio player error in guild ${this.guildId}:`, error.message);
            this.handleTrackEnd();
        });
    }

    async handleTrackEnd() {
        this.stopProgressUpdater();

        if (this.loopMode === 'track' && this.currentTrack) {
            // Replay current track
            await this.playCurrentTrack();
            return;
        }

        if (this.loopMode === 'queue' && this.currentTrack) {
            // Push current track back to end of queue
            this.queue.push(this.currentTrack);
        }

        const lastTrack = this.currentTrack;
        this.currentTrack = null;
        this.isPlaying = false;

        if (this.queue.length > 0) {
            await this.playNext();
        } else if (this.autoplay && lastTrack) {
            // Autoplay mode: fetch related track automatically
            if (this.textChannel) {
                this.textChannel.send('♾️ **Autoplay enabled:** Fetching next related song...').catch(() => null);
            }
            const relatedTrack = await fetchRelatedTrack(lastTrack);
            if (relatedTrack) {
                this.queue.push(relatedTrack);
                await this.playNext();
            } else {
                this.sendQueueEndedEmbed();
                this.startIdleTimeout();
            }
        } else {
            // Queue empty
            this.sendQueueEndedEmbed();
            this.startIdleTimeout();
        }
    }

    startIdleTimeout() {
        if (this.idleTimer) clearTimeout(this.idleTimer);

        // Check if 24/7 standby mode is active for this server
        const standbyConfig = db.getVoiceStandby(this.guildId);
        if (standbyConfig && standbyConfig.enabled) {
            // In 24/7 standby mode, stay in channel quietly
            return;
        }

        // If 24/7 is disabled, leave after 2 minutes of idle time
        this.idleTimer = setTimeout(() => {
            if (!this.isPlaying && this.queue.length === 0) {
                const conn = getVoiceConnection(this.guildId);
                if (conn) {
                    try { conn.destroy(); } catch (e) {}
                }
                if (this.textChannel) {
                    this.textChannel.send('💤 **Leaving voice channel due to inactivity.**').catch(() => null);
                }
                queues.delete(this.guildId);
            }
        }, 120000); // 2 minutes
    }

    clearIdleTimeout() {
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
            this.idleTimer = null;
        }
    }

    startProgressUpdater() {
        this.stopProgressUpdater();
        // Update Now Playing live progress bar every 7 seconds
        this.progressInterval = setInterval(() => {
            if (this.isPlaying && !this.isPaused && this.currentTrack && this.nowPlayingMessage) {
                this.updateNowPlayingMessage();
            }
        }, 7000);
    }

    stopProgressUpdater() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }

    async playNext() {
        if (this.queue.length === 0) {
            this.handleTrackEnd();
            return;
        }

        this.clearIdleTimeout();
        this.currentTrack = this.queue.shift();
        await this.playCurrentTrack();
    }

    async playCurrentTrack(startOffsetSec = 0) {
        if (!this.currentTrack) return;

        try {
            let resource;

            // Primary Stream Extraction: @distube/ytdl-core with Android/iOS client rotators
            try {
                const stream = ytdl(this.currentTrack.url, {
                    filter: 'audioonly',
                    highWaterMark: 1 << 25,
                    quality: 'highestaudio',
                    begin: startOffsetSec > 0 ? `${startOffsetSec}s` : undefined,
                    dlChunkSize: 0
                });
                resource = createAudioResource(stream, { inlineVolume: true });
            } catch (ytdlErr) {
                console.warn('[MusicEngine] ytdl-core stream error, trying play-dl fallback:', ytdlErr.message);
                const pdStream = await play.stream(this.currentTrack.url, { seek: startOffsetSec });
                resource = createAudioResource(pdStream.stream, { inputType: pdStream.type, inlineVolume: true });
            }

            if (resource.volume) {
                resource.volume.setVolume(this.volume / 100);
            }

            this.player.play(resource);
            if (this.connection) {
                this.connection.subscribe(this.player);
            }

            this.isPlaying = true;
            this.isPaused = false;
            this.playbackStartTime = Date.now() - (startOffsetSec * 1000);

            await this.sendNowPlayingMessage();
            this.startProgressUpdater();
        } catch (err) {
            console.error(`[MusicEngine] Error streaming track "${this.currentTrack.title}":`, err.message);
            if (this.textChannel) {
                this.textChannel.send(`⚠️ Could not play **${this.currentTrack.title}**: ${err.message}`).catch(() => null);
            }
            this.handleTrackEnd();
        }
    }

    async sendNowPlayingMessage() {
        if (!this.textChannel || !this.currentTrack) return;

        const embed = buildNowPlayingEmbed(this);
        const components = buildNowPlayingButtons(this);

        try {
            if (this.nowPlayingMessage) {
                await this.nowPlayingMessage.delete().catch(() => null);
            }
            this.nowPlayingMessage = await this.textChannel.send({ embeds: [embed], components });
        } catch (e) {
            console.error('[MusicEngine] Error sending Now Playing embed:', e.message);
        }
    }

    async updateNowPlayingMessage() {
        if (!this.nowPlayingMessage || !this.currentTrack) return;
        try {
            const embed = buildNowPlayingEmbed(this);
            const components = buildNowPlayingButtons(this);
            await this.nowPlayingMessage.edit({ embeds: [embed], components }).catch(() => null);
        } catch (e) {}
    }

    sendQueueEndedEmbed() {
        if (!this.textChannel) return;
        const embed = new EmbedBuilder()
            .setColor('#7C3AED')
            .setTitle('🎵 Queue Completed')
            .setDescription('All queued tracks have finished playing. Add more songs using `/play` or `kplay`!')
            .setTimestamp();
        this.textChannel.send({ embeds: [embed] }).catch(() => null);
    }
}

/**
 * Gets or creates a Guild Queue Manager
 */
function getOrCreateQueue(guildId) {
    if (!queues.has(guildId)) {
        queues.set(guildId, new GuildQueueManager(guildId));
    }
    return queues.get(guildId);
}

/**
 * Fetches a related track for Autoplay mode
 */
async function fetchRelatedTrack(lastTrack) {
    try {
        if (!lastTrack || !lastTrack.url) return null;
        
        // Attempt 1: Fetch related video from ytdl basic info
        const info = await ytdl.getBasicInfo(lastTrack.url).catch(() => null);
        if (info && info.related_videos && info.related_videos.length > 0) {
            const rel = info.related_videos.find(v => v.id && v.title);
            if (rel) {
                return {
                    title: rel.title,
                    url: `https://www.youtube.com/watch?v=${rel.id}`,
                    duration: formatDuration(parseInt(rel.length_seconds || '0', 10)),
                    durationSec: parseInt(rel.length_seconds || '0', 10),
                    thumbnail: rel.thumbnails && rel.thumbnails[0] ? rel.thumbnails[0].url : 'https://i.imgur.com/8Q9Z5Ym.png',
                    author: rel.author ? rel.author.name : 'YouTube Autoplay',
                    requestedBy: 'Autoplay Engine ♾️'
                };
            }
        }

        // Attempt 2: Search YouTube for related query
        const searchQuery = `${lastTrack.author || ''} ${lastTrack.title || ''} music`.trim();
        const results = await YouTube.search(searchQuery, { limit: 3, type: 'video' });
        if (results && results.length > 0) {
            const r = results.find(v => v.url !== lastTrack.url) || results[0];
            return {
                title: r.title,
                url: r.url,
                duration: r.durationFormatted || formatDuration((r.duration || 0) / 1000),
                durationSec: Math.floor((r.duration || 0) / 1000),
                thumbnail: r.thumbnail ? r.thumbnail.url : 'https://i.imgur.com/8Q9Z5Ym.png',
                author: r.channel ? r.channel.name : 'YouTube Autoplay',
                requestedBy: 'Autoplay Engine ♾️'
            };
        }
    } catch (err) {
        console.error('[MusicEngine] Autoplay fetch error:', err.message);
    }

    return null;
}

/**
 * Resolves video metadata cleanly with fallback extractors & Spotify support
 */
async function resolveVideoMetadata(query, requestedBy) {
    // 0. Spotify Link Resolution
    if (play.is_spotify_url(query)) {
        try {
            const spData = await play.spotify(query);
            if (spData.type === 'track') {
                query = `${spData.name} ${spData.artists.map(a => a.name).join(' ')}`;
            }
        } catch (e) {
            console.warn('[MusicEngine] Spotify link parse fallback:', e.message);
        }
    }

    // 1. Direct YouTube URL or ID check via @distube/ytdl-core
    if (ytdl.validateURL(query) || ytdl.validateID(query)) {
        try {
            const info = await ytdl.getBasicInfo(query);
            const details = info.videoDetails;
            return {
                title: details.title,
                url: details.video_url || query,
                duration: formatDuration(parseInt(details.lengthSeconds || '0', 10)),
                durationSec: parseInt(details.lengthSeconds || '0', 10),
                thumbnail: details.thumbnails[0]?.url || 'https://i.imgur.com/8Q9Z5Ym.png',
                author: details.author?.name || 'YouTube',
                requestedBy
            };
        } catch (err) {
            console.warn('[MusicEngine] ytdl.getBasicInfo failed, attempting play-dl:', err.message);
        }
    }

    // 2. Direct URL check via play-dl
    try {
        if (play.yt_validate(query) === 'video') {
            const info = await play.video_info(query);
            const details = info.video_details;
            return {
                title: details.title,
                url: details.url,
                duration: details.durationRaw || formatDuration(details.durationInSec),
                durationSec: details.durationInSec,
                thumbnail: details.thumbnails[0]?.url || 'https://i.imgur.com/8Q9Z5Ym.png',
                author: details.channel?.name || 'YouTube',
                requestedBy
            };
        }
    } catch (err) {
        console.warn('[MusicEngine] play.video_info failed:', err.message);
    }

    // 3. Search term resolution via youtube-sr
    try {
        const results = await YouTube.search(query, { limit: 1, type: 'video' });
        if (results && results.length > 0) {
            const r = results[0];
            return {
                title: r.title,
                url: r.url,
                duration: r.durationFormatted || formatDuration((r.duration || 0) / 1000),
                durationSec: Math.floor((r.duration || 0) / 1000),
                thumbnail: r.thumbnail ? r.thumbnail.url : 'https://i.imgur.com/8Q9Z5Ym.png',
                author: r.channel ? r.channel.name : 'YouTube',
                requestedBy
            };
        }
    } catch (err) {
        console.error('[MusicEngine] YouTube.search error:', err.message);
    }

    return null;
}

/**
 * Searches and enqueues tracks or playlists
 */
async function enqueueTrack(guild, voiceChannel, textChannel, query, requestedBy) {
    if (!query || typeof query !== 'string' || !query.trim()) {
        throw new Error('Please provide a song title or YouTube link! Example: `kplay Natsuki theme`');
    }
    query = query.trim();

    const queueManager = getOrCreateQueue(guild.id);
    queueManager.textChannel = textChannel;

    // Connect to voice channel (using 24/7 standby or standard connection)
    let connection = getVoiceConnection(guild.id);
    if (!connection || connection.state.status === VoiceConnectionStatus.Destroyed) {
        connection = await joinStandbyChannel(guild, voiceChannel, { selfDeaf: true, selfMute: false });
    }
    queueManager.connection = connection;

    let tracksToAdd = [];

    // Check if query is a YouTube Playlist
    if (query.includes('list=') || YouTube.isPlaylist(query)) {
        try {
            const playlist = await YouTube.getPlaylist(query, { fetchAll: false });
            if (playlist && playlist.videos && playlist.videos.length > 0) {
                tracksToAdd = playlist.videos.map(v => ({
                    title: v.title || 'Unknown Title',
                    url: v.url || `https://www.youtube.com/watch?v=${v.id}`,
                    duration: v.durationFormatted || formatDuration(v.duration / 1000),
                    durationSec: Math.floor((v.duration || 0) / 1000),
                    thumbnail: v.thumbnail ? v.thumbnail.url : 'https://i.imgur.com/8Q9Z5Ym.png',
                    author: v.channel ? v.channel.name : 'YouTube Music',
                    requestedBy
                }));
            }
        } catch (e) {
            console.error('[MusicEngine] Playlist resolve error:', e.message);
        }
    }

    // Single video or search query
    if (tracksToAdd.length === 0) {
        const video = await resolveVideoMetadata(query, requestedBy);
        if (video) {
            tracksToAdd.push(video);
        }
    }

    if (tracksToAdd.length === 0) {
        throw new Error(`No music results found for \`${query}\`. Please try a different song title or direct link.`);
    }

    // Add to queue
    const wasPlaying = queueManager.isPlaying;
    queueManager.queue.push(...tracksToAdd);

    if (!wasPlaying) {
        await queueManager.playNext();
        return {
            type: 'started',
            track: tracksToAdd[0],
            count: tracksToAdd.length
        };
    } else {
        return {
            type: 'enqueued',
            track: tracksToAdd[0],
            count: tracksToAdd.length,
            position: queueManager.queue.length
        };
    }
}

/**
 * Builds Jackiee-style Now Playing Embed
 */
function buildNowPlayingEmbed(queueManager) {
    const track = queueManager.currentTrack;
    if (!track) {
        return new EmbedBuilder()
            .setColor('#7C3AED')
            .setTitle('🎵 No Track Playing')
            .setDescription('Use `/play` or `kplay` to start listening!');
    }

    const elapsedSec = queueManager.playbackStartTime 
        ? Math.floor((Date.now() - queueManager.playbackStartTime) / 1000)
        : 0;
    const totalSec = track.durationSec || 1;
    const progressBar = createProgressBar(elapsedSec, totalSec);

    const embed = new EmbedBuilder()
        .setColor('#FF9EE2')
        .setTitle(`🎶 NOW PLAYING`)
        .setDescription(`[**${track.title}**](${track.url})\n\n` +
            `\`${progressBar}\`\n` +
            `\`⏱️ ${formatDuration(elapsedSec)} / ${track.duration || formatDuration(totalSec)}\`\n\n` +
            `👤 **Artist/Channel:** ${track.author || 'Unknown'}\n` +
            `🙋 **Requested By:** ${track.requestedBy ? track.requestedBy.toString() : 'User'}\n` +
            `🔊 **Volume:** \`${queueManager.volume}%\` | 🔂 **Loop:** \`${queueManager.loopMode.toUpperCase()}\` | ♾️ **Autoplay:** \`${queueManager.autoplay ? 'ON' : 'OFF'}\` | 📜 **Queue:** \`${queueManager.queue.length} track(s)\``)
        .setThumbnail(track.thumbnail)
        .setFooter({ text: `Cherry Music Player · Status: ${queueManager.isPaused ? '⏸️ PAUSED' : '▶️ PLAYING'}` })
        .setTimestamp();

    return embed;
}

/**
 * Builds Jackiee-style Interactive Control Buttons (2 Action Rows)
 */
function buildNowPlayingButtons(queueManager) {
    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('music_pause')
            .setEmoji(queueManager.isPaused ? '▶️' : '⏸️')
            .setLabel(queueManager.isPaused ? 'Resume' : 'Pause')
            .setStyle(queueManager.isPaused ? ButtonStyle.Success : ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('music_skip')
            .setEmoji('⏭️')
            .setLabel('Skip')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('music_stop')
            .setEmoji('⏹️')
            .setLabel('Stop')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId('music_loop')
            .setEmoji('🔂')
            .setLabel(`Loop: ${queueManager.loopMode.toUpperCase()}`)
            .setStyle(queueManager.loopMode !== 'off' ? ButtonStyle.Success : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('music_shuffle')
            .setEmoji('🔀')
            .setLabel('Shuffle')
            .setStyle(ButtonStyle.Secondary)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('music_autoplay')
            .setEmoji('♾️')
            .setLabel(`Autoplay: ${queueManager.autoplay ? 'ON' : 'OFF'}`)
            .setStyle(queueManager.autoplay ? ButtonStyle.Success : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('music_voldown')
            .setEmoji('🔉')
            .setLabel('Vol -')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('music_volup')
            .setEmoji('🔊')
            .setLabel('Vol +')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('music_queue')
            .setEmoji('📜')
            .setLabel('Queue')
            .setStyle(ButtonStyle.Primary)
    );

    return [row1, row2];
}

/**
 * Creates visual audio progress bar
 */
function createProgressBar(current, total, length = 14) {
    if (total <= 0) total = 1;
    const progress = Math.min(Math.max(current / total, 0), 1);
    const filledLength = Math.round(length * progress);
    const emptyLength = length - filledLength;

    const filledBar = '━'.repeat(Math.max(0, filledLength - 1));
    const emptyBar = '─'.repeat(Math.max(0, emptyLength));

    return `${filledBar}🔘${emptyBar}`;
}

/**
 * Formats seconds to mm:ss or hh:mm:ss
 */
function formatDuration(seconds) {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const pad = (n) => String(n).padStart(2, '0');
    if (hrs > 0) {
        return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Parses timestamp string (e.g. "1:30" or "90" or "01:15:30") to total seconds
 */
function parseTimestampToSeconds(timestamp) {
    if (!timestamp) return 0;
    if (typeof timestamp === 'number') return Math.max(0, Math.floor(timestamp));
    
    const parts = timestamp.trim().split(':').map(p => parseInt(p, 10));
    if (parts.some(isNaN)) return 0;

    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return (parts[0] * 60) + parts[1];
    if (parts.length === 3) return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    return 0;
}

module.exports = {
    queues,
    getOrCreateQueue,
    enqueueTrack,
    buildNowPlayingEmbed,
    buildNowPlayingButtons,
    formatDuration,
    parseTimestampToSeconds
};
