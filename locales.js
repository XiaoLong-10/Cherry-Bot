const db = require('./database.js');

const TRANSLATIONS = {
    en: {
        welcome_title: "🌸 Welcome to {server}!",
        welcome_msg: "✨ Welcome {user}! We are glad to have you in our community!",
        balance_title: "🎀 CHERRY BALANCE & RPG INVENTORY",
        balance_wallet: "🎀 Wallet",
        balance_plots: "🏠 Homestead",
        daily_success: "🎉 You claimed your daily reward of {amount} {symbol} {name}!",
        daily_cooldown: "⏳ You have already claimed your daily reward today! Try again in {time}.",
        uwu_converted: "🌸 UwUified Text!",
        rp_hug: "💖 {user} wraps their arms around {target} in a warm, cozy hug!",
        rp_kiss: "💋 {user} plants a sweet kiss on {target}'s cheek!",
        rp_boop: "👉 *Boop!* {user} reaches out and boops {target} right on the nose! 💕",
        rp_cuddle: "🤗 {user} snuggles up and cuddles closely with {target}! Warm and cozy~",
        lang_updated: "✅ Server language updated to English!",
        help_title: "🌸 Cherry Bot Help & Command Center"
    },
    km: { // Khmer (ភាសាខ្មែរ)
        welcome_title: "🌸 ស្វាគមន៍មកកាន់ {server}!",
        welcome_msg: "✨ ស្វាគមន៍ {user}! យើងរីករាយណាស់ដែលបានអ្នកចូលរួមក្នុងសហគមន៍របស់យើង!",
        balance_title: "🎀 តុល្យភាព CHERRY & កាតកាបូប RPG",
        balance_wallet: "🎀 កាបូបលុយ",
        balance_plots: "🏠 ដីកសិដ្ឋាន",
        daily_success: "🎉 អ្នកបានទទួលរង្វាន់ប្រចាំថ្ងៃចំនួន {amount} {symbol} {name}!",
        daily_cooldown: "⏳ អ្នកបានទទួលរង្វាន់ប្រចាំថ្ងៃរួចហើយ! សូមព្យាយាមម្តងទៀតក្នុងរយៈពេល {time}។",
        uwu_converted: "🌸 អត្ថបទ UwU!",
        rp_hug: "💖 {user} អោប {target} យ៉ាងកក់ក្តៅ!",
        rp_kiss: "💋 {user} ថើប {target} យ៉ាងផ្អែមល្ហែម!",
        rp_boop: "👉 *ប៉ះ!* {user} លូកដៃទៅប៉ះច្រមុះ {target}! 💕",
        rp_cuddle: "🤗 {user} គេងអោបយ៉ាងជិតស្និទ្ធជាមួយ {target}! កក់ក្តៅខ្លាំងណាស់~",
        lang_updated: "✅ ភាសាម៉ាស៊ីនបម្រើ (Server) ត្រូវបានប្តូរទៅជា ភាសាខ្មែរ (Khmer)! 🇰🇭",
        help_title: "🌸 មជ្ឈមណ្ឌលជំនួយ និងបញ្ជា Cherry Bot 🇰🇭"
    }
};

function getGuildLanguage(guildId) {
    if (!guildId) return 'en';
    const row = db.prepare("SELECT settingVal FROM guild_settings WHERE settingKey = ?").get(`lang_${guildId}`);
    return (row && row.settingVal) ? row.settingVal : 'en';
}

function setGuildLanguage(guildId, lang) {
    db.prepare("INSERT OR REPLACE INTO guild_settings (settingKey, settingVal) VALUES (?, ?)").run(`lang_${guildId}`, lang);
}

function t(guildId, key, variables = {}) {
    const lang = getGuildLanguage(guildId);
    const dictionary = TRANSLATIONS[lang] || TRANSLATIONS['en'];
    let text = dictionary[key] || TRANSLATIONS['en'][key] || key;

    for (const [varName, varVal] of Object.entries(variables)) {
        text = text.replace(new RegExp(`{${varName}}`, 'g'), varVal);
    }
    return text;
}

module.exports = {
    TRANSLATIONS,
    getGuildLanguage,
    setGuildLanguage,
    t
};
