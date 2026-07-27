const db = require('../../database/index.js');

// SQLite Schema initialization for Server Shared Realm / Tycoon
db.exec(`
    CREATE TABLE IF NOT EXISTS server_realms (
        guildId TEXT PRIMARY KEY,
        realmName TEXT DEFAULT 'Cherry Kingdom',
        townHallLvl INTEGER DEFAULT 1,
        marketplaceLvl INTEGER DEFAULT 1,
        garrisonLvl INTEGER DEFAULT 1,
        distilleryLvl INTEGER DEFAULT 1,
        treasuryPool INTEGER DEFAULT 0,
        lastDividend INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS realm_contributions (
        guildId TEXT,
        userId TEXT,
        pointsContributed INTEGER DEFAULT 0,
        lastCollected INTEGER DEFAULT 0,
        PRIMARY KEY (guildId, userId)
    );
`);

function getRealm(guildId) {
    db.prepare("INSERT OR IGNORE INTO server_realms (guildId, realmName, townHallLvl, marketplaceLvl, garrisonLvl, distilleryLvl, treasuryPool, lastDividend) VALUES (?, 'Cherry Kingdom', 1, 1, 1, 1, 0, ?)").run(guildId, Date.now());
    let realm = db.prepare("SELECT * FROM server_realms WHERE guildId = ?").get(guildId);

    // Accrue passive treasury coins from Boba Distillery every 12 hours
    const now = Date.now();
    const halfDayMs = 12 * 3600 * 1000;
    if ((now - realm.lastDividend) >= halfDayMs) {
        const generatedCoins = realm.distilleryLvl * 500;
        realm.treasuryPool += generatedCoins;
        realm.lastDividend = now;
        db.prepare("UPDATE server_realms SET treasuryPool = ?, lastDividend = ? WHERE guildId = ?").run(realm.treasuryPool, now, guildId);
    }

    return realm;
}

function contributeResource(guildId, userId, resourceType, amount) {
    const realm = getRealm(guildId);
    const validResources = ['wood', 'stone', 'iron', 'wheat', 'coins', 'cherries'];
    if (!validResources.includes(resourceType.toLowerCase())) return { success: false, reason: 'Invalid resource type.' };

    const lowerRes = resourceType.toLowerCase();
    
    if (lowerRes === 'coins' || lowerRes === 'cherries') {
        const wallet = db.getBalance(userId) || 0;
        if (amount > wallet) return { success: false, reason: 'Insufficient wallet coins to contribute.' };
        db.addCoins(userId, -amount);
    } else {
        const invItem = db.prepare("SELECT quantity FROM inventory WHERE userId = ? AND LOWER(itemName) LIKE ?").get(userId, `%${lowerRes}%`);
        if (!invItem || invItem.quantity < amount) {
            return { success: false, reason: `You do not have ${amount}x ${resourceType} in your inventory!` };
        }
        db.prepare("UPDATE inventory SET quantity = quantity - ? WHERE userId = ? AND LOWER(itemName) LIKE ?").run(amount, userId, `%${lowerRes}%`);
    }

    // Points calculation: 1 coin = 1 pt, 1 raw material = 10 pts
    const points = (lowerRes === 'coins' || lowerRes === 'cherries') ? amount : amount * 10;

    // Track user contribution
    db.prepare("INSERT OR IGNORE INTO realm_contributions (guildId, userId, pointsContributed, lastCollected) VALUES (?, ?, 0, 0)").run(guildId, userId);
    db.prepare("UPDATE realm_contributions SET pointsContributed = pointsContributed + ? WHERE guildId = ? AND userId = ?").run(points, guildId, userId);

    // Level up building checks
    let upgradedBuilding = null;
    const newTotalPoints = db.prepare("SELECT SUM(pointsContributed) as sum FROM realm_contributions WHERE guildId = ?").get(guildId).sum;

    if (newTotalPoints >= realm.townHallLvl * 1000) {
        realm.townHallLvl += 1;
        realm.distilleryLvl += 1;
        realm.marketplaceLvl += 1;
        db.prepare("UPDATE server_realms SET townHallLvl = ?, distilleryLvl = ?, marketplaceLvl = ? WHERE guildId = ?")
            .run(realm.townHallLvl, realm.distilleryLvl, realm.marketplaceLvl, guildId);
        upgradedBuilding = `Town Hall & Distillery (Level ${realm.townHallLvl})`;
    }

    return {
        success: true,
        pointsEarned: points,
        totalPoints: newTotalPoints,
        upgradedBuilding
    };
}

function collectDividends(guildId, userId) {
    const realm = getRealm(guildId);
    if (realm.treasuryPool <= 0) return { success: false, reason: 'The server treasury is currently empty!' };

    const contrib = db.prepare("SELECT * FROM realm_contributions WHERE guildId = ? AND userId = ?").get(guildId, userId);
    if (!contrib || contrib.pointsContributed <= 0) {
        return { success: false, reason: 'You must contribute resources to the server realm before collecting dividends!' };
    }

    const now = Date.now();
    const cooldownMs = 24 * 3600 * 1000;
    if ((now - contrib.lastCollected) < cooldownMs) {
        const remainingHours = Math.ceil((cooldownMs - (now - contrib.lastCollected)) / (3600 * 1000));
        return { success: false, reason: `You have already collected your server dividend today! Next claim available in ${remainingHours} hours.` };
    }

    // Share calculation: User points / total server points
    const totalPoints = db.prepare("SELECT SUM(pointsContributed) as sum FROM realm_contributions WHERE guildId = ?").get(guildId).sum || 1;
    const shareRatio = Math.min(1.0, contrib.pointsContributed / totalPoints);
    const payout = Math.max(50, Math.floor(realm.treasuryPool * shareRatio));

    db.addCoins(userId, payout);
    db.prepare("UPDATE server_realms SET treasuryPool = MAX(0, treasuryPool - ?) WHERE guildId = ?").run(payout, guildId);
    db.prepare("UPDATE realm_contributions SET lastCollected = ? WHERE guildId = ? AND userId = ?").run(now, guildId, userId);

    return {
        success: true,
        payout,
        remainingTreasury: Math.max(0, realm.treasuryPool - payout)
    };
}

module.exports = {
    getRealm,
    contributeResource,
    collectDividends
};
