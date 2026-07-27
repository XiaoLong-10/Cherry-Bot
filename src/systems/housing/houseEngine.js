const db = require('../../database/index.js');

// SQLite Schema initialization for Housing System
db.exec(`
    CREATE TABLE IF NOT EXISTS user_houses (
        userId TEXT PRIMARY KEY,
        houseType TEXT DEFAULT 'Cozy Cottage',
        furniture TEXT DEFAULT '[]',
        houseRating INTEGER DEFAULT 100
    );
`);

const HOUSE_TYPES = {
    'cottage': { name: '🛖 Cozy Cottage', price: 0, maxFurniture: 3, baseRating: 100 },
    'villa': { name: '🏡 Suburban Villa', price: 50000, maxFurniture: 6, baseRating: 300 },
    'estate': { name: '🏰 Grand Estate', price: 250000, maxFurniture: 10, baseRating: 800 },
    'palace': { name: '🏯 Royal Palace', price: 1000000, maxFurniture: 20, baseRating: 2500 }
};

const FURNITURE_CATALOG = {
    'sofa': { name: '🛋️ Velvet Sofa', price: 2500, ratingBonus: 50 },
    'bed': { name: '🛏️ King Canopy Bed', price: 5000, ratingBonus: 100 },
    'setup': { name: '🖥️ RGB Gaming Setup', price: 12000, ratingBonus: 200 },
    'painting': { name: '🎨 Renaissance Painting', price: 25000, ratingBonus: 350 },
    'piano': { name: '🎹 Grand Piano', price: 50000, ratingBonus: 600 }
};

function getUserHouse(userId) {
    db.prepare("INSERT OR IGNORE INTO user_houses (userId, houseType, furniture, houseRating) VALUES (?, 'Cozy Cottage', '[]', 100)").run(userId);
    const row = db.prepare("SELECT * FROM user_houses WHERE userId = ?").get(userId);

    return {
        ...row,
        furniture: JSON.parse(row.furniture || '[]')
    };
}

function buyHouse(userId, houseKey) {
    const info = HOUSE_TYPES[houseKey.toLowerCase()];
    if (!info) return { success: false, reason: 'Invalid house tier.' };

    const wallet = db.getBalance(userId) || 0;
    if (info.price > wallet) return { success: false, reason: `Insufficient funds! This house costs ${info.price.toLocaleString()} coins.` };

    if (info.price > 0) db.addCoins(userId, -info.price);

    const house = getUserHouse(userId);
    db.prepare("UPDATE user_houses SET houseType = ?, houseRating = ? WHERE userId = ?")
        .run(info.name, info.baseRating, userId);

    return { success: true, houseInfo: info };
}

function buyFurniture(userId, itemKey) {
    const item = FURNITURE_CATALOG[itemKey.toLowerCase()];
    if (!item) return { success: false, reason: 'Invalid furniture item.' };

    const house = getUserHouse(userId);
    const houseKey = Object.keys(HOUSE_TYPES).find(k => HOUSE_TYPES[k].name === house.houseType) || 'cottage';
    const maxAllowed = HOUSE_TYPES[houseKey].maxFurniture;

    if (house.furniture.length >= maxAllowed) {
        return { success: false, reason: `Your ${house.houseType} can only hold ${maxAllowed} furniture pieces! Upgrade your home for more space.` };
    }

    const wallet = db.getBalance(userId) || 0;
    if (item.price > wallet) return { success: false, reason: `Insufficient funds! The ${item.name} costs ${item.price.toLocaleString()} coins.` };

    db.addCoins(userId, -item.price);
    const newFurniture = [...house.furniture, item.name];
    const newRating = house.houseRating + item.ratingBonus;

    db.prepare("UPDATE user_houses SET furniture = ?, houseRating = ? WHERE userId = ?")
        .run(JSON.stringify(newFurniture), newRating, userId);

    return { success: true, item, newRating };
}

module.exports = {
    HOUSE_TYPES,
    FURNITURE_CATALOG,
    getUserHouse,
    buyHouse,
    buyFurniture
};
