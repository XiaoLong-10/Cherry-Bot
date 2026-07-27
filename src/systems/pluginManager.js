const db = require('../database/index.js');

const DEFAULT_PLUGINS = {
    economy: true,
    uwu: true,
    roleplay: true,
    automod: true,
    tickets: true,
    ai: true,
    leveling: true,
    music: false
};

const PLUGIN_INFO = {
    economy: { name: '💰 Economy & Shop', description: 'Coins, shop, gambling, banking, farming & business' },
    uwu: { name: '🌸 UwU & Kaomoji', description: 'UwU text converter, kaomoji generator, cute speech' },
    roleplay: { name: '💖 Cute Roleplay', description: 'RP interactions (hug, kiss, boop, cuddle, pat, bite)' },
    automod: { name: '🛡️ AutoModeration', description: 'Spam protection, autoresponder, message filters' },
    tickets: { name: '🎫 Ticket System', description: 'Support panels, ticket creation, transcripts' },
    ai: { name: '🤖 AI Suite', description: 'AI chat assistant, text summaries, smart moderation' },
    leveling: { name: '⭐ Leveling & XP', description: 'Chat XP earning, level up announcements, rank cards' },
    music: { name: '🎵 Music Player', description: 'Voice channel music playback, queues, filters' }
};

function getGuildPlugins(guildId) {
    if (!guildId) return { ...DEFAULT_PLUGINS };
    const row = db.getSetting(`plugins_${guildId}`, null);
    if (row) {
        try {
            return { ...DEFAULT_PLUGINS, ...JSON.parse(row) };
        } catch (e) {}
    }
    return { ...DEFAULT_PLUGINS };
}

function isPluginEnabled(guildId, pluginName) {
    const plugins = getGuildPlugins(guildId);
    return plugins[pluginName] !== false;
}

function setPluginState(guildId, pluginName, enabled) {
    const current = getGuildPlugins(guildId);
    current[pluginName] = !!enabled;
    db.setSetting(`plugins_${guildId}`, JSON.stringify(current));
    return current;
}

module.exports = {
    DEFAULT_PLUGINS,
    PLUGIN_INFO,
    getGuildPlugins,
    isPluginEnabled,
    setPluginState
};
