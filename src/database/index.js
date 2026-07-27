const db = require('../../database.js');

// Helper setting accessors
db.getSetting = function(key, defaultValue = null) {
    try {
        const row = db.prepare("SELECT settingVal FROM guild_settings WHERE settingKey = ?").get(key);
        if (row && row.settingVal !== undefined) {
            try {
                return JSON.parse(row.settingVal);
            } catch (e) {
                return row.settingVal;
            }
        }
    } catch (err) {
        console.error(`Error reading setting key "${key}":`, err.message);
    }
    return defaultValue;
};

db.setSetting = function(key, value) {
    try {
        const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
        db.prepare("INSERT OR REPLACE INTO guild_settings (settingKey, settingVal) VALUES (?, ?)").run(key, valStr);
        return true;
    } catch (err) {
        console.error(`Error setting key "${key}":`, err.message);
        return false;
    }
};

module.exports = db;
