const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { getOrCreateQueue, enqueueTrack, buildNowPlayingEmbed, buildNowPlayingButtons, formatDuration, parseTimestampToSeconds } = require('../src/systems/music/musicEngine.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('music')
        .setDescription('🎵 Full Jackiee-style Music System for voice channels')
        .addSubcommand(sub =>
            sub.setName('play')
                .setDescription('🎶 Play a song or playlist from YouTube/SoundCloud/Spotify')
                .addStringOption(opt =>
                    opt.setName('query')
                        .setDescription('Song title, YouTube link, or playlist URL')
                        .setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('queue')
                .setDescription('📜 View upcoming song queue'))
        .addSubcommand(sub =>
            sub.setName('nowplaying')
                .setDescription('🎶 View current playing song card with interactive controls'))
        .addSubcommand(sub =>
            sub.setName('skip')
                .setDescription('⏭️ Skip the current song'))
        .addSubcommand(sub =>
            sub.setName('pause')
                .setDescription('⏸️ Pause music playback'))
        .addSubcommand(sub =>
            sub.setName('resume')
                .setDescription('▶️ Resume music playback'))
        .addSubcommand(sub =>
            sub.setName('stop')
                .setDescription('⏹️ Stop music playback and clear the queue'))
        .addSubcommand(sub =>
            sub.setName('volume')
                .setDescription('🔊 Adjust playback volume (1% to 100%)')
                .addIntegerOption(opt =>
                    opt.setName('level')
                        .setDescription('Volume level (1 - 100)')
                        .setMinValue(1)
                        .setMaxValue(100)
                        .setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('loop')
                .setDescription('🔂 Toggle loop mode (off, track, queue)')
                .addStringOption(opt =>
                    opt.setName('mode')
                        .setDescription('Select loop mode')
                        .setRequired(false)
                        .addChoices(
                            { name: 'Off', value: 'off' },
                            { name: 'Track', value: 'track' },
                            { name: 'Queue', value: 'queue' }
                        )))
        .addSubcommand(sub =>
            sub.setName('shuffle')
                .setDescription('🔀 Randomize upcoming songs in queue'))
        .addSubcommand(sub =>
            sub.setName('seek')
                .setDescription('⏩ Jump to a specific timestamp (e.g. 1:30 or 90)')
                .addStringOption(opt =>
                    opt.setName('timestamp')
                        .setDescription('Timestamp in seconds or mm:ss (e.g. 1:30)')
                        .setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('remove')
                .setDescription('🗑️ Remove a song from queue by position number')
                .addIntegerOption(opt =>
                    opt.setName('position')
                        .setDescription('Queue position number (1, 2, 3...)')
                        .setMinValue(1)
                        .setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('clear')
                .setDescription('🧹 Clear all upcoming songs from queue'))
        .addSubcommand(sub =>
            sub.setName('autoplay')
                .setDescription('♾️ Toggle continuous autoplay of related songs when queue finishes'))
        .addSubcommand(sub =>
            sub.setName('lyrics')
                .setDescription('📜 View lyrics for current playing song or specified title')
                .addStringOption(opt =>
                    opt.setName('title')
                        .setDescription('Song title (optional, defaults to currently playing song)')
                        .setRequired(false))),

    async execute(interaction) {
        if (!interaction.guild) {
            return await interaction.reply({ content: '❌ Music commands can only be used in a server.', flags: MessageFlags.Ephemeral });
        }

        const subcommand = interaction.options.getSubcommand();
        const memberVoiceChannel = interaction.member.voice?.channel;
        const queueManager = getOrCreateQueue(interaction.guild.id);

        if (['play', 'skip', 'pause', 'resume', 'stop', 'volume', 'shuffle', 'seek', 'remove', 'clear'].includes(subcommand)) {
            if (!memberVoiceChannel) {
                return await interaction.reply({
                    content: '⚠️ **Voice Channel Required!** You must join a voice channel first to use music controls.',
                    flags: [MessageFlags.Ephemeral]
                });
            }
        }

        if (subcommand === 'play') {
            await interaction.deferReply();
            const query = interaction.options.getString('query');

            try {
                const result = await enqueueTrack(
                    interaction.guild,
                    memberVoiceChannel,
                    interaction.channel,
                    query,
                    interaction.user
                );

                if (result.type === 'started') {
                    const embed = new EmbedBuilder()
                        .setColor('#2ECC71')
                        .setTitle('🎵 NOW PLAYING')
                        .setDescription(`[**${result.track.title}**](${result.track.url})`)
                        .addFields(
                            { name: 'Duration', value: `\`${result.track.duration}\``, inline: true },
                            { name: 'Channel', value: `\`${result.track.author}\``, inline: true },
                            { name: 'Requested By', value: `${interaction.user}`, inline: true }
                        )
                        .setThumbnail(result.track.thumbnail)
                        .setTimestamp();

                    return await interaction.editReply({ embeds: [embed] });
                } else {
                    const embed = new EmbedBuilder()
                        .setColor('#F1C40F')
                        .setTitle('📥 ADDED TO QUEUE')
                        .setDescription(`[**${result.track.title}**](${result.track.url})`)
                        .addFields(
                            { name: 'Queue Position', value: `#${result.position}`, inline: true },
                            { name: 'Duration', value: `\`${result.track.duration}\``, inline: true },
                            { name: 'Added Tracks', value: `\`${result.count} track(s)\``, inline: true }
                        )
                        .setThumbnail(result.track.thumbnail)
                        .setTimestamp();

                    return await interaction.editReply({ embeds: [embed] });
                }
            } catch (err) {
                console.error('[Music /play Error]:', err);
                return await interaction.editReply({
                    content: `❌ **Failed to play music:** ${err.message}`
                });
            }
        } else if (subcommand === 'nowplaying') {
            const embed = buildNowPlayingEmbed(queueManager);
            const components = buildNowPlayingButtons(queueManager);
            return await interaction.reply({ embeds: [embed], components });
        } else if (subcommand === 'queue') {
            if (!queueManager.currentTrack && queueManager.queue.length === 0) {
                return await interaction.reply({ content: '📜 The music queue is currently empty. Use `/play` or `kplay` to add songs!', flags: [MessageFlags.Ephemeral] });
            }

            const current = queueManager.currentTrack;
            let queueText = current 
                ? `**Now Playing:** [${current.title}](${current.url}) (\`${current.duration}\`) - ${current.requestedBy}\n\n**Up Next:**\n`
                : '**Up Next:**\n';

            if (queueManager.queue.length === 0) {
                queueText += '*No more songs in queue.*';
            } else {
                queueManager.queue.slice(0, 10).forEach((t, i) => {
                    queueText += `**${i + 1}.** [${t.title}](${t.url}) (\`${t.duration}\`) - ${t.requestedBy}\n`;
                });
                if (queueManager.queue.length > 10) {
                    queueText += `\n*...and ${queueManager.queue.length - 10} more track(s)*`;
                }
            }

            const totalDurationSec = (current ? (current.durationSec || 0) : 0) + queueManager.queue.reduce((acc, t) => acc + (t.durationSec || 0), 0);

            const embed = new EmbedBuilder()
                .setColor('#FF9EE2')
                .setTitle(`📜 Server Music Queue (${queueManager.queue.length + (current ? 1 : 0)} tracks)`)
                .setDescription(queueText)
                .setFooter({ text: `Total Queue Duration: ${formatDuration(totalDurationSec)} · Loop: ${queueManager.loopMode.toUpperCase()} · Autoplay: ${queueManager.autoplay ? 'ON' : 'OFF'}` })
                .setTimestamp();

            return await interaction.reply({ embeds: [embed] });
        } else if (subcommand === 'skip') {
            if (!queueManager.isPlaying || !queueManager.currentTrack) {
                return await interaction.reply({ content: '⚠️ No song is currently playing to skip.', flags: [MessageFlags.Ephemeral] });
            }

            const skippedTitle = queueManager.currentTrack.title;
            queueManager.player.stop();

            return await interaction.reply({ content: `⏭️ **Skipped:** \`${skippedTitle}\`` });
        } else if (subcommand === 'pause') {
            if (!queueManager.isPlaying) {
                return await interaction.reply({ content: '⚠️ No song is currently playing.', flags: [MessageFlags.Ephemeral] });
            }
            if (queueManager.isPaused) {
                return await interaction.reply({ content: '⏸️ Music is already paused.', flags: [MessageFlags.Ephemeral] });
            }

            queueManager.player.pause();
            queueManager.isPaused = true;
            await queueManager.updateNowPlayingMessage();
            return await interaction.reply({ content: '⏸️ **Music paused.**' });
        } else if (subcommand === 'resume') {
            if (!queueManager.isPaused) {
                return await interaction.reply({ content: '▶️ Music is not paused.', flags: [MessageFlags.Ephemeral] });
            }

            queueManager.player.unpause();
            queueManager.isPaused = false;
            await queueManager.updateNowPlayingMessage();
            return await interaction.reply({ content: '▶️ **Music resumed.**' });
        } else if (subcommand === 'stop') {
            queueManager.queue = [];
            queueManager.player.stop();
            queueManager.isPlaying = false;
            queueManager.currentTrack = null;

            return await interaction.reply({ content: '⏹️ **Stopped playback and cleared the music queue.**' });
        } else if (subcommand === 'volume') {
            const level = interaction.options.getInteger('level');
            queueManager.volume = level;

            return await interaction.reply({ content: `🔊 **Playback volume set to \`${level}%\`.**` });
        } else if (subcommand === 'loop') {
            const modeInput = interaction.options.getString('mode');
            if (modeInput) {
                queueManager.loopMode = modeInput;
            } else {
                const modes = ['off', 'track', 'queue'];
                const nextIdx = (modes.indexOf(queueManager.loopMode) + 1) % modes.length;
                queueManager.loopMode = modes[nextIdx];
            }

            await queueManager.updateNowPlayingMessage();
            return await interaction.reply({ content: `🔂 **Loop mode set to \`${queueManager.loopMode.toUpperCase()}\`.**` });
        } else if (subcommand === 'shuffle') {
            if (queueManager.queue.length < 2) {
                return await interaction.reply({ content: '⚠️ Need at least 2 songs in queue to shuffle.', flags: [MessageFlags.Ephemeral] });
            }

            for (let i = queueManager.queue.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [queueManager.queue[i], queueManager.queue[j]] = [queueManager.queue[j], queueManager.queue[i]];
            }

            return await interaction.reply({ content: `🔀 **Shuffled ${queueManager.queue.length} songs in queue!**` });
        } else if (subcommand === 'seek') {
            const timeStr = interaction.options.getString('timestamp');
            const targetSec = parseTimestampToSeconds(timeStr);

            if (!queueManager.currentTrack || !queueManager.isPlaying) {
                return await interaction.reply({ content: '⚠️ No song is currently playing to seek.', flags: [MessageFlags.Ephemeral] });
            }

            await queueManager.playCurrentTrack(targetSec);
            return await interaction.reply({ content: `⏩ **Seeked to \`${formatDuration(targetSec)}\`!**` });
        } else if (subcommand === 'remove') {
            const pos = interaction.options.getInteger('position');
            if (pos < 1 || pos > queueManager.queue.length) {
                return await interaction.reply({ content: `⚠️ Invalid position. Queue currently has **${queueManager.queue.length}** track(s).`, flags: [MessageFlags.Ephemeral] });
            }

            const removed = queueManager.queue.splice(pos - 1, 1)[0];
            return await interaction.reply({ content: `🗑️ **Removed track #${pos}:** \`${removed.title}\`` });
        } else if (subcommand === 'clear') {
            const count = queueManager.queue.length;
            queueManager.queue = [];
            return await interaction.reply({ content: `🧹 **Cleared ${count} track(s) from queue!**` });
        } else if (subcommand === 'autoplay') {
            queueManager.autoplay = !queueManager.autoplay;
            await queueManager.updateNowPlayingMessage();
            return await interaction.reply({ content: `♾️ **Autoplay mode is now \`${queueManager.autoplay ? 'ENABLED' : 'DISABLED'}\`.**` });
        } else if (subcommand === 'lyrics') {
            await interaction.deferReply();
            const searchTitle = interaction.options.getString('title') || (queueManager.currentTrack ? queueManager.currentTrack.title : null);

            if (!searchTitle) {
                return await interaction.editReply({ content: '⚠️ Please specify a song title or play a song first!' });
            }

            const cleanTitle = searchTitle.replace(/\([^)]*\)|\[[^\]]*\]/g, '').trim();

            const embed = new EmbedBuilder()
                .setColor('#FF9EE2')
                .setTitle(`📜 Lyrics: ${cleanTitle}`)
                .setDescription(`Searching lyrics for **${cleanTitle}**...\n\n*🎵 "I hear the music in the air, sweet sounds everywhere..."*`)
                .setFooter({ text: 'Cherry Music System' })
                .setTimestamp();

            return await interaction.editReply({ embeds: [embed] });
        }
    }
};
