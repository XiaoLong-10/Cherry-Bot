const { joinVoiceChannel, getVoiceConnection, VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const db = require('../../database.js');

// Map to track ongoing reconnection timers to avoid duplicate attempts
const reconnectTimers = new Map();

/**
 * Joins a voice channel and configures 24/7 standby mode
 * @param {import('discord.js').Guild} guild 
 * @param {import('discord.js').VoiceBasedChannel} channel 
 * @param {Object} options 
 */
async function joinStandbyChannel(guild, channel, options = {}) {
    if (!guild || !channel) throw new Error('Guild and voice channel are required.');

    const selfDeaf = options.selfDeaf !== undefined ? options.selfDeaf : true;
    const selfMute = options.selfMute !== undefined ? options.selfMute : false;

    // Check permissions
    const permissions = channel.permissionsFor(guild.members.me);
    if (!permissions || !permissions.has('Connect')) {
        throw new Error(`Missing 'Connect' permission for channel #${channel.name}`);
    }

    // Save to database
    db.setVoiceStandby(guild.id, channel.id, { selfDeaf, selfMute });

    // Clear any pending reconnection timer for this guild
    if (reconnectTimers.has(guild.id)) {
        clearTimeout(reconnectTimers.get(guild.id));
        reconnectTimers.delete(guild.id);
    }

    // Create or retrieve voice connection
    const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
        selfDeaf,
        selfMute
    });

    // Attach state transition listeners
    connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
            await Promise.race([
                entersState(connection, VoiceConnectionStatus.Signalling, 5000),
                entersState(connection, VoiceConnectionStatus.Connecting, 5000)
            ]);
            // Reconnected successfully within race time window
        } catch (error) {
            // Check if 24/7 standby is still enabled for this guild
            const config = db.getVoiceStandby(guild.id);
            if (config && config.enabled) {
                console.log(`[VoiceStandby] Disconnected from ${guild.name} (${channel.name}). Scheduling reconnect...`);
                try {
                    connection.destroy();
                } catch (e) {}

                scheduleReconnect(guild.client, guild.id, channel.id);
            }
        }
    });

    connection.on(VoiceConnectionStatus.Destroyed, () => {
        const config = db.getVoiceStandby(guild.id);
        if (config && config.enabled && !reconnectTimers.has(guild.id)) {
            console.log(`[VoiceStandby] Connection destroyed in ${guild.name}. Triggering auto-reconnect...`);
            scheduleReconnect(guild.client, guild.id, channel.id);
        }
    });

    return connection;
}

/**
 * Disconnects from voice channel and disables 24/7 standby for the guild
 * @param {import('discord.js').Guild} guild 
 */
async function leaveStandbyChannel(guild) {
    if (!guild) return false;

    // Clear any pending reconnect timer
    if (reconnectTimers.has(guild.id)) {
        clearTimeout(reconnectTimers.get(guild.id));
        reconnectTimers.delete(guild.id);
    }

    // Remove from DB
    db.removeVoiceStandby(guild.id);

    // Destroy voice connection
    const connection = getVoiceConnection(guild.id);
    if (connection) {
        try {
            connection.destroy();
        } catch (e) {}
    }
    return true;
}

/**
 * Helper to schedule reconnect after a short delay
 */
function scheduleReconnect(client, guildId, channelId) {
    if (reconnectTimers.has(guildId)) return;

    const timer = setTimeout(async () => {
        reconnectTimers.delete(guildId);

        const config = db.getVoiceStandby(guildId);
        if (!config || !config.enabled) return;

        try {
            const guild = client.guilds.cache.get(guildId) || await client.guilds.fetch(guildId).catch(() => null);
            if (!guild) return;

            const channel = guild.channels.cache.get(config.channelId || channelId) || await guild.channels.fetch(config.channelId || channelId).catch(() => null);
            if (!channel || !channel.isVoiceBased()) return;

            console.log(`[VoiceStandby] Reconnecting to voice channel #${channel.name} in guild: ${guild.name}`);
            await joinStandbyChannel(guild, channel, { selfDeaf: config.selfDeaf, selfMute: config.selfMute });
        } catch (err) {
            console.error(`[VoiceStandby] Reconnection attempt failed for guild ${guildId}:`, err.message);
        }
    }, 4000);

    reconnectTimers.set(guildId, timer);
}

/**
 * Initializes voice standby for all active servers on bot startup
 * @param {import('discord.js').Client} client 
 */
async function initVoiceStandby(client) {
    console.log('[VoiceStandby] Initializing 24/7 Voice Standby module...');
    const configs = db.getAllVoiceStandbys();

    if (configs.length === 0) {
        console.log('[VoiceStandby] No 24/7 standby channels stored.');
        return;
    }

    console.log(`[VoiceStandby] Found ${configs.length} standby channel configurations. Reconnecting...`);

    for (const config of configs) {
        if (!config || !config.enabled || !config.guildId || !config.channelId) continue;

        try {
            const guild = client.guilds.cache.get(config.guildId) || await client.guilds.fetch(config.guildId).catch(() => null);
            if (!guild) continue;

            const channel = guild.channels.cache.get(config.channelId) || await guild.channels.fetch(config.channelId).catch(() => null);
            if (!channel || !channel.isVoiceBased()) continue;

            await joinStandbyChannel(guild, channel, { selfDeaf: config.selfDeaf, selfMute: config.selfMute });
            console.log(`[VoiceStandby] ✅ Connected standby in ${guild.name} -> #${channel.name}`);
        } catch (err) {
            console.error(`[VoiceStandby] Failed to auto-join ${config.guildId}/${config.channelId}:`, err.message);
        }
    }
}

/**
 * Handles voice state changes (bot kick, move, disconnect)
 */
async function handleVoiceStateUpdate(client, oldState, newState) {
    // Only care if the bot user's voice state changed
    if (oldState.id !== client.user.id && newState.id !== client.user.id) return;

    const guildId = newState.guild.id || oldState.guild.id;
    const config = db.getVoiceStandby(guildId);

    if (!config || !config.enabled) return;

    // Bot disconnected from voice channel or moved out of the target standby channel
    const currentChannelId = newState.channelId;
    if (!currentChannelId || currentChannelId !== config.channelId) {
        console.log(`[VoiceStandby] Bot voice state changed in guild ${guildId} (Target: ${config.channelId}, Current: ${currentChannelId}). Reconnecting to standby...`);
        scheduleReconnect(client, guildId, config.channelId);
    }
}

/**
 * Gets current standby details for a guild
 */
function getStandbyStatus(guildId) {
    const config = db.getVoiceStandby(guildId);
    const connection = getVoiceConnection(guildId);

    return {
        config,
        isConnected: !!connection && connection.state.status === VoiceConnectionStatus.Ready,
        connectionState: connection ? connection.state.status : 'Disconnected'
    };
}

module.exports = {
    joinStandbyChannel,
    leaveStandbyChannel,
    initVoiceStandby,
    handleVoiceStateUpdate,
    getStandbyStatus
};
