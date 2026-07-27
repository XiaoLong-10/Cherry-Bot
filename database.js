const Database = require('better-sqlite3');
const path = require('path');
// database.js
const db = new Database(path.join(__dirname, 'economy.db'));

// Updated to include XP and Level tracking columns
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        userId TEXT PRIMARY KEY,
        guildId TEXT,
        coins INTEGER DEFAULT 100,
        xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT,
        itemName TEXT,
        quantity INTEGER DEFAULT 1,
        UNIQUE(userId, itemName)
    );


    CREATE TABLE IF NOT EXISTS investments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT,
        stockTicker TEXT,
        shares INTEGER DEFAULT 0,
        UNIQUE(userId, stockTicker)
    );

    CREATE TABLE IF NOT EXISTS slots_jackpot (
        id INTEGER PRIMARY KEY,
        pool INTEGER DEFAULT 5000
    );

    CREATE TABLE IF NOT EXISTS marriages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user1Id TEXT UNIQUE,
        user2Id TEXT UNIQUE,
        marriageDate INTEGER,
        homeName TEXT DEFAULT 'Tiny Cottage',
        lastGiftClaimed INTEGER DEFAULT 0,
        claimedMilestones TEXT DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS guild_settings (
        settingKey TEXT PRIMARY KEY,
        settingVal TEXT
    );

    CREATE TABLE IF NOT EXISTS farm_plots (
        userId TEXT,
        plotIndex INTEGER,
        cropType TEXT,
        plantedAt INTEGER,
        watered INTEGER DEFAULT 0,
        PRIMARY KEY (userId, plotIndex)
    );

    CREATE TABLE IF NOT EXISTS achievements (
        userId TEXT,
        achievementId TEXT,
        unlockedAt INTEGER,
        PRIMARY KEY (userId, achievementId)
    );

    CREATE TABLE IF NOT EXISTS web_tokens (
        userId TEXT PRIMARY KEY,
        token TEXT UNIQUE,
        expiresAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS lottery_tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT,
        guildId TEXT,
        n1 INTEGER,
        n2 INTEGER,
        n3 INTEGER
    );

    CREATE TABLE IF NOT EXISTS lottery_state (
        id INTEGER PRIMARY KEY,
        pool INTEGER DEFAULT 1000,
        lastDrawTime INTEGER
    );

    CREATE TABLE IF NOT EXISTS autoresponders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guildId TEXT,
        triggerText TEXT,
        responseText TEXT,
        matchType TEXT DEFAULT 'contains',
        createdBy TEXT,
        createdAt INTEGER,
        UNIQUE(guildId, triggerText)
    );
`);

// Seed progressive jackpot starting pool
db.prepare("INSERT OR IGNORE INTO slots_jackpot (id, pool) VALUES (1, 5000)").run();

// Seed progressive lottery starting pool
db.prepare("INSERT OR IGNORE INTO lottery_state (id, pool, lastDrawTime) VALUES (1, 1000, ?)").run(Date.now());

// RPG Extension Tables
db.exec(`
    CREATE TABLE IF NOT EXISTS pets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT,
        petType TEXT,
        petName TEXT,
        level INTEGER DEFAULT 1,
        xp INTEGER DEFAULT 0,
        status TEXT DEFAULT 'Idle',
        lastAction INTEGER DEFAULT 0,
        hunger INTEGER DEFAULT 50,
        affection INTEGER DEFAULT 50,
        last_decay INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS houses (
        userId TEXT PRIMARY KEY,
        houseType TEXT DEFAULT 'None',
        upgradeLevel INTEGER DEFAULT 0,
        storage TEXT DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS marketplace (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sellerId TEXT,
        itemName TEXT,
        quantity INTEGER,
        price INTEGER
    );



    CREATE TABLE IF NOT EXISTS stock_prices (
        ticker TEXT PRIMARY KEY,
        companyName TEXT,
        price REAL,
        prevPrice REAL,
        history TEXT DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS businesses (
        userId TEXT,
        businessType TEXT,
        level INTEGER DEFAULT 1,
        lastCollected INTEGER,
        UNIQUE(userId, businessType)
    );

    CREATE TABLE IF NOT EXISTS properties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT,
        propertyType TEXT,
        tenantName TEXT DEFAULT 'None',
        rentRate INTEGER DEFAULT 0,
        status TEXT DEFAULT 'Vacant',
        lastCollected INTEGER
    );

    CREATE TABLE IF NOT EXISTS delivery_company (
        userId TEXT PRIMARY KEY,
        vehicle TEXT DEFAULT 'Bicycle',
        workers INTEGER DEFAULT 0,
        lastAutomatedClaim INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS delivery_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT,
        jobName TEXT,
        payout INTEGER,
        endsAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS creatures (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT,
        creatureName TEXT,
        rarity TEXT,
        level INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS dragons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT,
        dragonName TEXT,
        stage TEXT DEFAULT 'Egg',
        fedCount INTEGER DEFAULT 0,
        lastFed INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS aquariums (
        userId TEXT PRIMARY KEY,
        fishCount INTEGER DEFAULT 0,
        lastCollected INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS farm_animals (
        userId TEXT PRIMARY KEY,
        chickens INTEGER DEFAULT 0,
        cows INTEGER DEFAULT 0,
        lastHarvested INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS dino_parks (
        userId TEXT PRIMARY KEY,
        dinos INTEGER DEFAULT 0,
        securityLevel INTEGER DEFAULT 1,
        lastCollected INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS market_event (
        id INTEGER PRIMARY KEY,
        eventType TEXT,
        ticksRemaining INTEGER
    );

    CREATE TABLE IF NOT EXISTS wealth_history (
        userId TEXT,
        timestamp INTEGER,
        netWorth INTEGER
    );

    CREATE TABLE IF NOT EXISTS transaction_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT,
        type TEXT,
        details TEXT,
        timestamp INTEGER
    );

    CREATE TABLE IF NOT EXISTS stock_news (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        headline TEXT,
        ticker TEXT,
        impact TEXT,
        timestamp INTEGER
    );

    CREATE TABLE IF NOT EXISTS player_guilds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        ownerId TEXT,
        bank_coins INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        xp INTEGER DEFAULT 0,
        perk_xp_boost INTEGER DEFAULT 0,
        perk_shop_discount INTEGER DEFAULT 0,
        created_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS player_guild_members (
        guild_id INTEGER,
        userId TEXT PRIMARY KEY,
        role TEXT DEFAULT 'Member',
        contribution INTEGER DEFAULT 0,
        joined_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS profile_settings (
        userId TEXT PRIMARY KEY,
        theme TEXT DEFAULT 'Obsidian Dark',
        background TEXT DEFAULT 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809',
        activeTitle TEXT DEFAULT 'Novice Adventurer',
        socialDiscord TEXT DEFAULT '',
        socialTwitter TEXT DEFAULT '',
        socialTwitch TEXT DEFAULT '',
        socialYoutube TEXT DEFAULT '',
        bio TEXT DEFAULT 'An epic Cherry RPG adventurer.',
        favGames TEXT DEFAULT 'Cherry RPG, Dungeons & Dragons',
        badges TEXT DEFAULT '[]'
    );
`);

// Seed default market event if empty
const countEvents = db.prepare("SELECT COUNT(*) AS count FROM market_event").get().count;
if (countEvents === 0) {
    db.prepare("INSERT INTO market_event (id, eventType, ticksRemaining) VALUES (1, NULL, 0)").run();
}

// Seed default stock tickers if empty
const countStocks = db.prepare("SELECT COUNT(*) AS count FROM stock_prices").get().count;
if (countStocks === 0) {
    const seed = db.prepare("INSERT INTO stock_prices (ticker, companyName, price, prevPrice, history) VALUES (?, ?, ?, ?, ?)");
    seed.run('CHRY', 'Cherry Cola Corp', 150.0, 150.0, JSON.stringify([150.0]));
    seed.run('AAPL', 'Fruit Tech Inc', 120.0, 120.0, JSON.stringify([120.0]));
    seed.run('TSLA', 'Volt Motors', 80.0, 80.0, JSON.stringify([80.0]));
    seed.run('BTC', 'Nebula Coin', 450.0, 450.0, JSON.stringify([450.0]));
    seed.run('GOLD', 'Royal Reserves', 200.0, 200.0, JSON.stringify([200.0]));
}

// Safely add character RPG columns to users table
function addColumn(columnName, typeDefinition) {
    try {
        db.exec(`ALTER TABLE users ADD COLUMN ${columnName} ${typeDefinition}`);
    } catch (e) {
        // Column already exists, ignore
    }
}

addColumn('bank_coins', 'INTEGER DEFAULT 0');
addColumn('streak_count', 'INTEGER DEFAULT 0');
addColumn('last_streak_claim', 'INTEGER DEFAULT 0');
addColumn('equipped_weapon', 'TEXT DEFAULT NULL');
addColumn('equipped_shield', 'TEXT DEFAULT NULL');
addColumn('duel_wins', 'INTEGER DEFAULT 0');
addColumn('duel_losses', 'INTEGER DEFAULT 0');
addColumn('duel_streak', 'INTEGER DEFAULT 0');
addColumn('slots_spins', 'INTEGER DEFAULT 0');
addColumn('slots_won_coins', 'INTEGER DEFAULT 0');
addColumn('blackjack_hands', 'INTEGER DEFAULT 0');
addColumn('blackjack_won_coins', 'INTEGER DEFAULT 0');
addColumn('delivery_runs', 'INTEGER DEFAULT 0');
addColumn('delivery_earnings', 'INTEGER DEFAULT 0');

// Safely add columns to pets table
function addPetColumn(columnName, typeDefinition) {
    try {
        db.exec(`ALTER TABLE pets ADD COLUMN ${columnName} ${typeDefinition}`);
    } catch (e) {
        // Column already exists, ignore
    }
}

addPetColumn('hunger', 'INTEGER DEFAULT 50');
addPetColumn('affection', 'INTEGER DEFAULT 50');
addPetColumn('last_decay', 'INTEGER DEFAULT 0');

module.exports = {
    getSetting(key, defaultVal) {
        try {
            const row = db.prepare('SELECT settingVal FROM guild_settings WHERE settingKey = ?').get(key);
            return row ? JSON.parse(row.settingVal) : defaultVal;
        } catch(e) {}
        return defaultVal;
    },
    setSetting(key, val) {
        try {
            db.prepare(`
                INSERT INTO guild_settings (settingKey, settingVal) 
                VALUES (?, ?)
                ON CONFLICT(settingKey) DO UPDATE SET settingVal = ?
            `).run(key, JSON.stringify(val), JSON.stringify(val));
        } catch(e) {}
    },

    // --- Existing Economy Methods ---
    getBalance(userId, guildId) {
        db.prepare("INSERT OR IGNORE INTO users (userId, guildId) VALUES (?, ?)").run(userId, guildId);
        
        const row = db.prepare("SELECT coins FROM users WHERE userId = ?").get(userId);
        return row ? row.coins : 0;
    },
    addCoins(userId, guildId, amount) {
        this.getBalance(userId, guildId);
        db.prepare('UPDATE users SET coins = coins + ? WHERE userId = ?').run(amount, userId);
    },
    deductCoins(userId, guildId, amount) {
        this.getBalance(userId, guildId);
        db.prepare('UPDATE users SET coins = coins - ? WHERE userId = ?').run(amount, userId);
    },
    getInventory(userId) {
        return db.prepare('SELECT itemName, quantity FROM inventory WHERE userId = ?').all(userId);
    },
    addItem(userId, itemName, quantity = 1) {
        db.prepare(`
            INSERT INTO inventory (userId, itemName, quantity) 
            VALUES (?, ?, ?)
            ON CONFLICT(userId, itemName) DO UPDATE SET quantity = quantity + ?
        `).run(userId, itemName, quantity, quantity);
    },
    getItemQuantity(userId, itemName) {
        const row = db.prepare('SELECT quantity FROM inventory WHERE userId = ? AND itemName = ?').get(userId, itemName);
        return row ? row.quantity : 0;
    },
    removeItem(userId, itemName, quantity = 1) {
        db.prepare(`
            UPDATE inventory 
            SET quantity = quantity - ? 
            WHERE userId = ? AND itemName = ?
        `).run(quantity, userId, itemName);
        // Clean up empty rows
        db.prepare('DELETE FROM inventory WHERE userId = ? AND itemName = ? AND quantity <= 0').run(userId, itemName);
    },

    // --- New Leveling Methods ---
    getUserProgress(userId, guildId) {
        this.getBalance(userId, guildId); // Ensures user profile row exists
        return db.prepare('SELECT xp, level FROM users WHERE userId = ?').get(userId);
    },

    addXp(userId, guildId, amount) {
        db.prepare("INSERT OR IGNORE INTO users (userId, guildId) VALUES (?, ?)").run(userId, guildId);
        let finalAmount = amount;
        try {
            const isMarried = db.prepare("SELECT 1 FROM marriages WHERE user1Id = ? OR user2Id = ?").get(userId, userId);
            if (isMarried) {
                finalAmount = Math.floor(amount * 1.2);
            }
        } catch (e) {}

        db.prepare('UPDATE users SET xp = xp + ? WHERE userId = ?').run(finalAmount, userId);
        
        // Fetch updated data to check for level up
        const user = db.prepare('SELECT xp, level FROM users WHERE userId = ?').get(userId);
        
        // Custom formula: XP required for next level = level * 100
        // e.g., Level 1 requires 100 XP to hit Level 2, Level 2 requires 200 more XP
        const xpNeeded = user.level * 100;

        if (user.xp >= xpNeeded) {
            // Deduct the required XP and increment level
            db.prepare('UPDATE users SET level = level + 1, xp = xp - ? WHERE userId = ?').run(xpNeeded, userId);
            return { leveledUp: true, newLevel: user.level + 1 };
        }
        
        return { leveledUp: false };
    },
    // --- New Leaderboard Methods ---
    getCoinLeaderboard(limit = 10) {
        return db.prepare(`
            SELECT userId, coins 
            FROM users 
            ORDER BY coins DESC 
            LIMIT ?
        `).all(limit);
    },

    getRankLeaderboard(limit = 10) {
        return db.prepare(`
            SELECT userId, level, xp 
            FROM users 
            ORDER BY level DESC, xp DESC 
            LIMIT ?
        `).all(limit);
    },

    // --- Stock Market Methods ---
    getShares(userId, stockTicker) {
        const row = db.prepare('SELECT shares FROM investments WHERE userId = ? AND stockTicker = ?').get(userId, stockTicker);
        return row ? row.shares : 0;
    },

    buyShares(userId, stockTicker, amount) {
        db.prepare(`
            INSERT INTO investments (userId, stockTicker, shares) 
            VALUES (?, ?, ?)
            ON CONFLICT(userId, stockTicker) DO UPDATE SET shares = shares + ?
        `).run(userId, stockTicker, amount, amount);
    },

    sellShares(userId, stockTicker, amount) {
        db.prepare('UPDATE investments SET shares = shares - ? WHERE userId = ? AND stockTicker = ?').run(amount, userId, stockTicker);
        // Clean up empty rows
        db.prepare('DELETE FROM investments WHERE userId = ? AND stockTicker = ? AND shares <= 0').run(userId, stockTicker);
    },

    // --- Pro Profile Rank Calculation ---
    getServerRankPosition(userId) {
        const row = db.prepare(`
            SELECT COUNT(*) + 1 AS rank 
            FROM users 
            WHERE (level * 100 + xp) > (
                SELECT (level * 100 + xp) 
                FROM users 
                WHERE userId = ?
            )
        `).get(userId);
        return row ? row.rank : 'N/A';
    },

    // --- Progressive Slots Jackpot Methods ---
    getSlotsJackpot() {
        const row = db.prepare("SELECT pool FROM slots_jackpot WHERE id = 1").get();
        return row ? row.pool : 5000;
    },
    addToSlotsJackpot(amount) {
        db.prepare("UPDATE slots_jackpot SET pool = pool + ? WHERE id = 1").run(amount);
    },
    resetSlotsJackpot() {
        db.prepare("UPDATE slots_jackpot SET pool = 5000 WHERE id = 1").run();
    },

    // --- RPG Character Creation Methods ---
    getCharacter(userId) {
        db.prepare("INSERT OR IGNORE INTO users (userId, coins) VALUES (?, 1000)").run(userId);
        return db.prepare("SELECT * FROM users WHERE userId = ?").get(userId);
    },
    updateCharacter(userId, { name, age, gender, race, className, background, avatar }) {
        db.prepare(`
            UPDATE users 
            SET char_name = ?, char_age = ?, char_gender = ?, char_race = ?, char_class = ?, char_background = ?, char_avatar = ?
            WHERE userId = ?
        `).run(name, age, gender, race, className, background, avatar, userId);
    },
    initializeRPGStats(userId, { hp, mp, str, def, dex, int, luc, cha, vit }) {
        db.prepare(`
            UPDATE users
            SET hp = ?, max_hp = ?, mana = ?, max_mana = ?,
                stat_str = ?, stat_def = ?, stat_dex = ?, stat_int = ?, stat_luc = ?, stat_cha = ?, stat_vit = ?,
                skill_mining = 1, skill_fishing = 1, skill_cooking = 1, skill_crafting = 1, skill_alchemy = 1,
                skill_smithing = 1, skill_woodcutting = 1, skill_magic = 1, skill_combat = 1
            WHERE userId = ?
        `).run(hp, hp, mp, mp, str, def, dex, int, luc, cha, vit, userId);
    },
    increaseSkill(userId, skillName, amount = 1) {
        const validSkills = ['mining', 'fishing', 'cooking', 'crafting', 'alchemy', 'smithing', 'woodcutting', 'magic', 'combat'];
        if (!validSkills.includes(skillName.toLowerCase())) return null;
        
        const columnName = `skill_${skillName.toLowerCase()}`;
        db.prepare(`UPDATE users SET ${columnName} = ${columnName} + ? WHERE userId = ?`).run(amount, userId);
        
        // Fetch new level
        const row = db.prepare(`SELECT ${columnName} AS lvl FROM users WHERE userId = ?`).get(userId);
        return row ? row.lvl : 1;
    },

    // --- Marriage & Matrimonial Methods ---
    getMarriage(userId) {
        return db.prepare("SELECT * FROM marriages WHERE user1Id = ? OR user2Id = ?").get(userId, userId);
    },
    proposeAndMarry(user1Id, user2Id, timestamp) {
        return db.prepare("INSERT INTO marriages (user1Id, user2Id, marriageDate) VALUES (?, ?, ?)").run(user1Id, user2Id, timestamp);
    },
    divorce(userId) {
        db.prepare("DELETE FROM marriages WHERE user1Id = ? OR user2Id = ?").run(userId, userId);
    },
    renameHome(userId, newName) {
        db.prepare("UPDATE marriages SET homeName = ? WHERE user1Id = ? OR user2Id = ?").run(newName, userId, userId);
    },
    claimMarriageGift(marriageId, timestamp) {
        db.prepare("UPDATE marriages SET lastGiftClaimed = ? WHERE id = ?").run(timestamp, marriageId);
    },
    updateMilestones(marriageId, milestonesJson) {
        db.prepare("UPDATE marriages SET claimedMilestones = ? WHERE id = ?").run(milestonesJson, marriageId);
    },

    // --- Pets Methods ---
    getPet(userId) {
        const pet = db.prepare("SELECT * FROM pets WHERE userId = ?").get(userId);
        if (!pet) return null;

        const now = Date.now();
        if (pet.last_decay === 0) {
            db.prepare("UPDATE pets SET last_decay = ? WHERE id = ?").run(now, pet.id);
            pet.last_decay = now;
            return pet;
        }

        const elapsedMs = now - pet.last_decay;
        const hours = elapsedMs / (3600 * 1000);
        if (hours >= 1) {
            const hungerDecay = Math.floor(hours * 5); // 5% per hour
            const affectionDecay = Math.floor(hours * 3); // 3% per hour

            const newHunger = Math.max(0, pet.hunger - hungerDecay);
            const newAffection = Math.max(0, pet.affection - affectionDecay);
            const nextDecayTime = pet.last_decay + Math.floor(hours) * 3600 * 1000;

            db.prepare("UPDATE pets SET hunger = ?, affection = ?, last_decay = ? WHERE id = ?").run(
                newHunger,
                newAffection,
                nextDecayTime,
                pet.id
            );

            pet.hunger = newHunger;
            pet.affection = newAffection;
            pet.last_decay = nextDecayTime;
        }
        return pet;
    },
    adoptPet(userId, petType, petName) {
        db.prepare("INSERT INTO pets (userId, petType, petName, last_decay) VALUES (?, ?, ?, ?)").run(userId, petType, petName, Date.now());
    },
    updatePetStatus(petId, status, lastAction) {
        db.prepare("UPDATE pets SET status = ?, lastAction = ? WHERE id = ?").run(status, lastAction, petId);
    },
    updatePetStats(petId, hungerChange, affectionChange) {
        const pet = db.prepare("SELECT hunger, affection FROM pets WHERE id = ?").get(petId);
        if (!pet) return;
        const newHunger = Math.max(0, Math.min(100, pet.hunger + hungerChange));
        const newAffection = Math.max(0, Math.min(100, pet.affection + affectionChange));
        db.prepare("UPDATE pets SET hunger = ?, affection = ?, last_decay = ? WHERE id = ?").run(
            newHunger,
            newAffection,
            Date.now(),
            petId
        );
    },
    addPetXp(petId, amount) {
        const pet = db.prepare("SELECT level, xp FROM pets WHERE id = ?").get(petId);
        if (!pet) return { leveledUp: false };
        let newXp = pet.xp + amount;
        let newLevel = pet.level;
        let xpNeeded = newLevel * 150;
        let leveledUp = false;
        while (newXp >= xpNeeded) {
            newXp -= xpNeeded;
            newLevel++;
            xpNeeded = newLevel * 150;
            leveledUp = true;
        }
        db.prepare("UPDATE pets SET level = ?, xp = ? WHERE id = ?").run(newLevel, newXp, petId);
        return { leveledUp, newLevel };
    },

    // --- Housing Methods ---
    getHouse(userId) {
        return db.prepare("SELECT * FROM houses WHERE userId = ?").get(userId);
    },
    buyHouse(userId, houseType) {
        db.prepare("INSERT OR REPLACE INTO houses (userId, houseType, upgradeLevel, storage) VALUES (?, ?, 0, '{}')").run(userId, houseType);
    },
    updateHouseStorage(userId, storageJson) {
        db.prepare("UPDATE houses SET storage = ? WHERE userId = ?").run(storageJson, userId);
    },
    // --- Player Guild Methods ---
    createPlayerGuild(ownerId, name, cost, discordGuildId) {
        this.deductCoins(ownerId, discordGuildId, cost);
        const timestamp = Date.now();
        const info = db.prepare("INSERT INTO player_guilds (name, ownerId, created_at) VALUES (?, ?, ?)").run(name, ownerId, timestamp);
        db.prepare("INSERT INTO player_guild_members (guild_id, userId, role, joined_at) VALUES (?, ?, 'Owner', ?)").run(info.lastInsertRowid, ownerId, timestamp);
        return info.lastInsertRowid;
    },
    getPlayerGuild(userId) {
        const member = db.prepare("SELECT * FROM player_guild_members WHERE userId = ?").get(userId);
        if (!member) return null;
        const guild = db.prepare("SELECT * FROM player_guilds WHERE id = ?").get(member.guild_id);
        if (!guild) return null;
        return { ...guild, memberRole: member.role, contribution: member.contribution };
    },
    getPlayerGuildByName(guildName) {
        return db.prepare("SELECT * FROM player_guilds WHERE name COLLATE NOCASE = ?").get(guildName);
    },
    getPlayerGuildById(guildId) {
        return db.prepare("SELECT * FROM player_guilds WHERE id = ?").get(guildId);
    },
    getGuildMembers(guildId) {
        return db.prepare("SELECT * FROM player_guild_members WHERE guild_id = ? ORDER BY contribution DESC").all(guildId);
    },
    joinPlayerGuild(userId, guildId) {
        db.prepare("INSERT INTO player_guild_members (guild_id, userId, role, joined_at) VALUES (?, ?, 'Member', ?)").run(guildId, userId, Date.now());
    },
    leavePlayerGuild(userId) {
        db.prepare("DELETE FROM player_guild_members WHERE userId = ?").run(userId);
    },
    depositGuildBank(userId, amount, discordGuildId) {
        this.deductCoins(userId, discordGuildId, amount);
        const member = db.prepare("SELECT guild_id FROM player_guild_members WHERE userId = ?").get(userId);
        if (member) {
            db.prepare("UPDATE player_guilds SET bank_coins = bank_coins + ? WHERE id = ?").run(amount, member.guild_id);
            db.prepare("UPDATE player_guild_members SET contribution = contribution + ? WHERE userId = ?").run(amount, userId);
        }
    },
    upgradeGuildPerk(guildId, perkCol, cost) {
        db.prepare(`UPDATE player_guilds SET bank_coins = bank_coins - ?, ${perkCol} = ${perkCol} + 1 WHERE id = ?`).run(cost, guildId);
    },

    // --- Banker Vault Methods ---
    depositBank(userId, amount, guildId) {
        this.deductCoins(userId, guildId, amount);
        db.prepare("UPDATE users SET bank_coins = bank_coins + ? WHERE userId = ?").run(amount, userId);
    },
    withdrawBank(userId, amount, guildId) {
        db.prepare("UPDATE users SET bank_coins = bank_coins - ? WHERE userId = ?").run(amount, userId);
        this.addCoins(userId, guildId, amount);
    },



    // --- Marketplace Methods ---
    getMarketListings() {
        return db.prepare("SELECT * FROM marketplace").all();
    },
    addMarketListing(sellerId, itemName, quantity, price) {
        db.prepare("INSERT INTO marketplace (sellerId, itemName, quantity, price) VALUES (?, ?, ?, ?)").run(sellerId, itemName, quantity, price);
    },
    getMarketListing(listingId) {
        return db.prepare("SELECT * FROM marketplace WHERE id = ?").get(listingId);
    },
    removeMarketListing(listingId) {
        db.prepare("DELETE FROM marketplace WHERE id = ?").run(listingId);
    },





    // --- Premium Stocks Methods ---
    getStocks() {
        return db.prepare("SELECT * FROM stock_prices").all();
    },
    getStock(ticker) {
        return db.prepare("SELECT * FROM stock_prices WHERE ticker = ?").get(ticker);
    },
    updateStockPrice(ticker, newPrice) {
        const row = db.prepare("SELECT price, history FROM stock_prices WHERE ticker = ?").get(ticker);
        if (!row) return;
        let history = [];
        try { history = JSON.parse(row.history || '[]'); } catch(e) {}
        history.push(newPrice);
        if (history.length > 30) history.shift();
        db.prepare("UPDATE stock_prices SET prevPrice = price, price = ?, history = ? WHERE ticker = ?")
          .run(newPrice, JSON.stringify(history), ticker);
    },

    // --- Premium Business Simulator Methods ---
    getUserBusinesses(userId) {
        return db.prepare("SELECT * FROM businesses WHERE userId = ?").all(userId);
    },
    buyBusiness(userId, type, timestamp) {
        db.prepare("INSERT INTO businesses (userId, businessType, level, lastCollected) VALUES (?, ?, 1, ?)").run(userId, type, timestamp);
        this.logTransaction(userId, 'Business Buy', `Acquired a new ${type} business 🏢`);
    },
    upgradeBusiness(userId, type) {
        db.prepare("UPDATE businesses SET level = level + 1 WHERE userId = ? AND businessType = ?").run(userId, type);
    },
    collectBusinessRevenue(userId, type, amount, timestamp, guildId) {
        db.prepare("UPDATE businesses SET lastCollected = ? WHERE userId = ? AND businessType = ?").run(timestamp, userId, type);
        this.addCoins(userId, guildId, amount);
    },

    // --- Premium Real Estate Methods ---
    getUserProperties(userId) {
        return db.prepare("SELECT * FROM properties WHERE userId = ?").all(userId);
    },
    buyProperty(userId, type, timestamp) {
        db.prepare("INSERT INTO properties (userId, propertyType, status, lastCollected) VALUES (?, ?, 'Vacant', ?)").run(userId, type, timestamp);
        this.logTransaction(userId, 'Property Buy', `Purchased a new ${type} estate 🏡`);
    },
    rentOutProperty(propertyId, tenantName, rentRate, timestamp) {
        db.prepare("UPDATE properties SET tenantName = ?, rentRate = ?, status = 'Rented', lastCollected = ? WHERE id = ?").run(tenantName, rentRate, timestamp, propertyId);
    },
    collectPropertyRent(propertyId, userId, amount, timestamp, guildId) {
        db.prepare("UPDATE properties SET lastCollected = ? WHERE id = ?").run(timestamp, propertyId);
        this.addCoins(userId, guildId, amount);
    },

    // --- Premium Delivery Company Methods ---
    getDeliveryCompany(userId) {
        let row = db.prepare("SELECT * FROM delivery_company WHERE userId = ?").get(userId);
        if (!row) {
            db.prepare("INSERT INTO delivery_company (userId, vehicle, workers, lastAutomatedClaim) VALUES (?, 'Bicycle', 0, ?)").run(userId, Date.now());
            row = db.prepare("SELECT * FROM delivery_company WHERE userId = ?").get(userId);
        }
        return row;
    },
    upgradeVehicle(userId, vehicleType, cost, guildId) {
        this.deductCoins(userId, guildId, cost);
        db.prepare("UPDATE delivery_company SET vehicle = ? WHERE userId = ?").run(vehicleType, userId);
    },
    hireWorker(userId, cost, guildId) {
        this.deductCoins(userId, guildId, cost);
        db.prepare("UPDATE delivery_company SET workers = workers + 1 WHERE userId = ?").run(userId);
    },
    startDeliveryJob(userId, jobName, payout, endsAt) {
        db.prepare("INSERT INTO delivery_jobs (userId, jobName, payout, endsAt) VALUES (?, ?, ?, ?)").run(userId, jobName, payout, endsAt);
    },
    getActiveDeliveryJobs(userId) {
        return db.prepare("SELECT * FROM delivery_jobs WHERE userId = ?").all(userId);
    },
    completeDeliveryJob(jobId, userId, payout, guildId) {
        db.prepare("DELETE FROM delivery_jobs WHERE id = ?").run(jobId);
        this.addCoins(userId, guildId, payout);
    },
    collectAutomatedDelivery(userId, amount, timestamp, guildId) {
        db.prepare("UPDATE delivery_company SET lastAutomatedClaim = ? WHERE userId = ?").run(timestamp, userId);
        this.addCoins(userId, guildId, amount);
    },

    // --- Premium Creature Collection Methods ---
    getUserCreatures(userId) {
        return db.prepare("SELECT * FROM creatures WHERE userId = ?").all(userId);
    },
    catchCreature(userId, name, rarity) {
        db.prepare("INSERT INTO creatures (userId, creatureName, rarity) VALUES (?, ?, ?)").run(userId, name, rarity);
        this.logTransaction(userId, 'Creature Catch', `Caught a ${rarity} ${name} 🐾`);
    },

    // --- Premium Dragon Raising Methods ---
    getUserDragons(userId) {
        return db.prepare("SELECT * FROM dragons WHERE userId = ?").all(userId);
    },
    buyDragonEgg(userId, name, cost, guildId) {
        this.deductCoins(userId, guildId, cost);
        db.prepare("INSERT INTO dragons (userId, dragonName) VALUES (?, ?)").run(userId, name);
    },
    feedDragon(dragonId) {
        const dragon = db.prepare("SELECT fedCount, stage FROM dragons WHERE id = ?").get(dragonId);
        if (!dragon) return null;
        
        const nextFed = dragon.fedCount + 1;
        let nextStage = dragon.stage;
        
        if (nextFed >= 15) nextStage = 'Ancient 🐉';
        else if (nextFed >= 8) nextStage = 'Juvenile 🐲';
        else if (nextFed >= 3) nextStage = 'Hatchling 🦖';
        
        db.prepare("UPDATE dragons SET fedCount = ?, stage = ?, lastFed = ? WHERE id = ?").run(nextFed, nextStage, Date.now(), dragonId);
        return { fedCount: nextFed, stage: nextStage };
    },

    // --- Premium Aquarium Methods ---
    getAquarium(userId) {
        let row = db.prepare("SELECT * FROM aquariums WHERE userId = ?").get(userId);
        if (!row) {
            db.prepare("INSERT INTO aquariums (userId, fishCount, lastCollected) VALUES (?, 0, ?)").run(userId, Date.now());
            row = db.prepare("SELECT * FROM aquariums WHERE userId = ?").get(userId);
        }
        return row;
    },
    buyFish(userId, cost, guildId) {
        this.deductCoins(userId, guildId, cost);
        db.prepare("UPDATE aquariums SET fishCount = fishCount + 1 WHERE userId = ?").run(userId);
    },
    collectAquariumRevenue(userId, amount, timestamp, guildId) {
        db.prepare("UPDATE aquariums SET lastCollected = ? WHERE userId = ?").run(timestamp, userId);
        this.addCoins(userId, guildId, amount);
    },

    // --- Premium Farm Animal Methods ---
    getFarmAnimals(userId) {
        let row = db.prepare("SELECT * FROM farm_animals WHERE userId = ?").get(userId);
        if (!row) {
            db.prepare("INSERT INTO farm_animals (userId, chickens, cows, lastHarvested) VALUES (?, 0, 0, ?)").run(userId, Date.now());
            row = db.prepare("SELECT * FROM farm_animals WHERE userId = ?").get(userId);
        }
        return row;
    },
    buyFarmAnimal(userId, type, cost, guildId) {
        this.deductCoins(userId, guildId, cost);
        if (type === 'chicken') {
            db.prepare("UPDATE farm_animals SET chickens = chickens + 1 WHERE userId = ?").run(userId);
        } else if (type === 'cow') {
            db.prepare("UPDATE farm_animals SET cows = cows + 1 WHERE userId = ?").run(userId);
        }
    },
    harvestFarm(userId, amount, timestamp, guildId) {
        db.prepare("UPDATE farm_animals SET lastHarvested = ? WHERE userId = ?").run(timestamp, userId);
        this.addCoins(userId, guildId, amount);
    },

    // --- Premium Dinosaur Park Methods ---
    getDinoPark(userId) {
        let row = db.prepare("SELECT * FROM dino_parks WHERE userId = ?").get(userId);
        if (!row) {
            db.prepare("INSERT INTO dino_parks (userId, dinos, securityLevel, lastCollected) VALUES (?, 0, 1, ?)").run(userId, Date.now());
            row = db.prepare("SELECT * FROM dino_parks WHERE userId = ?").get(userId);
        }
        return row;
    },
    cloneDinosaur(userId, cost, guildId) {
        this.deductCoins(userId, guildId, cost);
        db.prepare("UPDATE dino_parks SET dinos = dinos + 1 WHERE userId = ?").run(userId);
        this.logTransaction(userId, 'Dino Clone', 'Cloned a prehistoric dinosaur 🦖');
    },
    upgradeSecurity(userId, cost, guildId) {
        this.deductCoins(userId, guildId, cost);
        db.prepare("UPDATE dino_parks SET securityLevel = securityLevel + 1 WHERE userId = ?").run(userId);
    },
    collectParkRevenue(userId, amount, timestamp, guildId) {
        db.prepare("UPDATE dino_parks SET lastCollected = ? WHERE userId = ?").run(timestamp, userId);
        this.addCoins(userId, guildId, amount);
    },

    // --- Daily Streak Methods ---
    getUserStreak(userId) {
        const row = db.prepare("SELECT streak_count, last_streak_claim FROM users WHERE userId = ?").get(userId);
        return row ? { count: row.streak_count, lastClaim: row.last_streak_claim } : { count: 0, lastClaim: 0 };
    },
    claimUserStreak(userId, nextCount, timestamp, rewardCoins, guildId) {
        db.prepare("UPDATE users SET streak_count = ?, last_streak_claim = ? WHERE userId = ?").run(nextCount, timestamp, userId);
        this.addCoins(userId, guildId, rewardCoins);
        this.logTransaction(userId, 'Streak Claim', `Claimed Day ${nextCount} login streak multiplier 🎁`);
    },
    getPlayerAssets(userId) {
        const investments = db.prepare("SELECT stockTicker, shares FROM investments WHERE userId = ?").all(userId);
        const businesses = db.prepare("SELECT businessType, level FROM businesses WHERE userId = ?").all(userId);
        const properties = db.prepare("SELECT propertyType FROM properties WHERE userId = ?").all(userId);
        return { investments, businesses, properties };
    },
    getMarketEvent() {
        const row = db.prepare("SELECT eventType, ticksRemaining FROM market_event WHERE id = 1").get();
        return row ? { eventType: row.eventType, ticksRemaining: row.ticksRemaining } : { eventType: null, ticksRemaining: 0 };
    },
    updateMarketEvent(eventType, ticks) {
        db.prepare("UPDATE market_event SET eventType = ?, ticksRemaining = ? WHERE id = 1").run(eventType, ticks);
    },
    getWealthHistory(userId) {
        return db.prepare("SELECT timestamp, netWorth FROM wealth_history WHERE userId = ? ORDER BY timestamp ASC LIMIT 10").all(userId);
    },
    recordWealthSnapshot(userId, netWorth) {
        const last = db.prepare("SELECT timestamp FROM wealth_history WHERE userId = ? ORDER BY timestamp DESC LIMIT 1").get(userId);
        const now = Date.now();
        if (!last || (now - last.timestamp > 12 * 3600 * 1000)) {
            db.prepare("INSERT INTO wealth_history (userId, timestamp, netWorth) VALUES (?, ?, ?)").run(userId, now, netWorth);
        }
    },
    getRecentTransactions(limit = 10) {
        return db.prepare("SELECT * FROM transaction_logs ORDER BY timestamp DESC LIMIT ?").all(limit);
    },
    logTransaction(userId, type, details) {
        db.prepare("INSERT INTO transaction_logs (userId, type, details, timestamp) VALUES (?, ?, ?, ?)").run(userId, type, details, Date.now());
        const count = db.prepare("SELECT COUNT(*) AS count FROM transaction_logs").get().count;
        if (count > 100) {
            db.prepare("DELETE FROM transaction_logs WHERE id IN (SELECT id FROM transaction_logs ORDER BY timestamp ASC LIMIT 10)").run();
        }
    },
    addStockNews(headline, ticker, impact) {
        db.prepare("INSERT INTO stock_news (headline, ticker, impact, timestamp) VALUES (?, ?, ?, ?)").run(headline, ticker, impact, Date.now());
        const count = db.prepare("SELECT COUNT(*) AS count FROM stock_news").get().count;
        if (count > 30) {
            db.prepare("DELETE FROM stock_news WHERE id IN (SELECT id FROM stock_news ORDER BY timestamp ASC LIMIT 5)").run();
        }
    },
    getStockNews(limit = 5) {
        return db.prepare("SELECT * FROM stock_news ORDER BY timestamp DESC LIMIT ?").all(limit);
    },
    startQuest(userId, questId) {
        db.prepare("UPDATE users SET active_quest_id = ?, quest_progress = 0 WHERE userId = ?").run(questId, userId);
    },
    incrementQuestProgress(userId, amount = 1) {
        db.prepare("UPDATE users SET quest_progress = quest_progress + ? WHERE userId = ?").run(amount, userId);
    },
    completeQuest(userId) {
        db.prepare("UPDATE users SET active_quest_id = NULL, quest_progress = 0 WHERE userId = ?").run(userId);
    },
    addUnlockedTitle(userId, title) {
        const char = this.getCharacter(userId);
        if (!char) return false;
        let unlocked = [];
        try {
            unlocked = JSON.parse(char.unlocked_titles || '[]');
        } catch(e) {}
        if (!unlocked.includes(title)) {
            unlocked.push(title);
            db.prepare("UPDATE users SET unlocked_titles = ? WHERE userId = ?").run(JSON.stringify(unlocked), userId);
            return true;
        }
        return false;
    },
    getItemBonus(itemName) {
        if (!itemName) return null;
        
        const ITEM_BONUSES = {
            'Iron Sword':    { stat: 'stat_str', bonus: 5 },
            'Gold Sword':    { stat: 'stat_str', bonus: 8 },
            'Oak Bow':       { stat: 'stat_dex', bonus: 5 },
            'Magic Staff':   { stat: 'stat_int', bonus: 5 },
            'Wooden Shield': { stat: 'stat_def', bonus: 3 },
            'Plated Shield': { stat: 'stat_def', bonus: 6 },
            'Gold Ring':     { stat: 'stat_luc', bonus: 5 }
        };

        let baseName = itemName;
        let level = 0;
        const match = itemName.match(/(.+)\s\+(\d+)$/);
        if (match) {
            baseName = match[1].trim();
            level = parseInt(match[2]);
        }

        const base = ITEM_BONUSES[baseName];
        if (!base) return null;

        // Upgraded scaling: +1.5 STR/DEF/etc. per upgrade level (Gold Sword gets +2.0)
        const scaleFactor = baseName.includes('Gold') ? 2.0 : 1.5;
        const totalBonus = base.bonus + Math.floor(level * scaleFactor);

        return {
            stat: base.stat,
            bonus: totalBonus
        };
    },
    equipItem(userId, itemName, slot) {
        const colName = slot === 'weapon' ? 'equipped_weapon' : 'equipped_shield';
        const char = this.getCharacter(userId);
        const oldItem = char[colName];

        // 1. Deduct old item bonuses
        const oldBonus = this.getItemBonus(oldItem);
        if (oldBonus) {
            db.prepare(`UPDATE users SET ${oldBonus.stat} = ${oldBonus.stat} - ? WHERE userId = ?`).run(oldBonus.bonus, userId);
        }

        // 2. Add new item bonuses
        const newBonus = this.getItemBonus(itemName);
        if (newBonus) {
            db.prepare(`UPDATE users SET ${newBonus.stat} = ${newBonus.stat} + ? WHERE userId = ?`).run(newBonus.bonus, userId);
        }

        // 3. Update DB
        db.prepare(`UPDATE users SET ${colName} = ? WHERE userId = ?`).run(itemName, userId);
        return oldItem;
    },
    restoreStats(userId, hpAmount, mpAmount) {
        const char = this.getCharacter(userId);
        if (!char) return null;

        const maxHp = char.max_hp || 100;
        const maxMp = char.max_mana || 50;

        const newHp = Math.max(0, Math.min(maxHp, (char.hp || 0) + hpAmount));
        const newMp = Math.max(0, Math.min(maxMp, (char.mana || 0) + mpAmount));

        db.prepare("UPDATE users SET hp = ?, mana = ? WHERE userId = ?").run(newHp, newMp, userId);
        return { hp: newHp, mana: newMp };
    },
    getFarmPlots(userId) {
        return db.prepare("SELECT * FROM farm_plots WHERE userId = ?").all(userId);
    },
    plantCrop(userId, plotIndex, cropType) {
        db.prepare("INSERT OR REPLACE INTO farm_plots (userId, plotIndex, cropType, plantedAt, watered) VALUES (?, ?, ?, ?, 0)")
            .run(userId, plotIndex, cropType, Date.now());
    },
    waterCrop(userId, plotIndex) {
        const plot = db.prepare("SELECT * FROM farm_plots WHERE userId = ? AND plotIndex = ?").get(userId, plotIndex);
        if (!plot) return;

        const growTimes = { 'Wheat': 120000, 'Apple': 300000, 'Berry': 600000 };
        const duration = growTimes[plot.cropType] || 300000;
        
        const now = Date.now();
        const elapsed = now - plot.plantedAt;
        const remaining = duration - elapsed;

        if (remaining > 0) {
            const newPlantedAt = now - (elapsed + Math.floor(remaining / 2));
            db.prepare("UPDATE farm_plots SET watered = 1, plantedAt = ? WHERE userId = ? AND plotIndex = ?")
                .run(newPlantedAt, userId, plotIndex);
        }
    },
    harvestCrop(userId, plotIndex) {
        db.prepare("DELETE FROM farm_plots WHERE userId = ? AND plotIndex = ?").run(userId, plotIndex);
    },
    unlockAchievement(userId, achievementId) {
        db.prepare("INSERT OR IGNORE INTO achievements (userId, achievementId, unlockedAt) VALUES (?, ?, ?)")
            .run(userId, achievementId, Date.now());
    },
    getUserAchievements(userId) {
        const char = this.getCharacter(userId);
        if (char) {
            if (char.coins >= 50000) {
                db.prepare("INSERT OR IGNORE INTO achievements (userId, achievementId, unlockedAt) VALUES (?, 'wealthy', ?)").run(userId, Date.now());
            }
            if ((char.skill_farming || 1) >= 3) {
                db.prepare("INSERT OR IGNORE INTO achievements (userId, achievementId, unlockedAt) VALUES (?, 'crop_master', ?)").run(userId, Date.now());
            }
            if ((char.skill_combat || 1) >= 3 || (char.skill_magic || 1) >= 3) {
                db.prepare("INSERT OR IGNORE INTO achievements (userId, achievementId, unlockedAt) VALUES (?, 'monster_slayer', ?)").run(userId, Date.now());
            }
        }
        return db.prepare("SELECT * FROM achievements WHERE userId = ?").all(userId);
    },
    generateWebToken(userId) {
        const token = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 10 * 60 * 1000;
        db.prepare("INSERT OR REPLACE INTO web_tokens (userId, token, expiresAt) VALUES (?, ?, ?)")
            .run(userId, token, expiresAt);
        return token;
    },
    verifyWebToken(token) {
        db.prepare("DELETE FROM web_tokens WHERE expiresAt < ?").run(Date.now());
        const row = db.prepare("SELECT userId FROM web_tokens WHERE token = ?").get(token);
        if (row) {
            db.prepare("DELETE FROM web_tokens WHERE token = ?").run(token);
            return row.userId;
        }
        return null;
    },
    getLotteryState() {
        return db.prepare("SELECT pool, lastDrawTime FROM lottery_state WHERE id = 1").get();
    },
    addLotteryPool(amount) {
        db.prepare("UPDATE lottery_state SET pool = pool + ? WHERE id = 1").run(amount);
    },
    resetLotteryPool() {
        db.prepare("UPDATE lottery_state SET pool = 1000, lastDrawTime = ? WHERE id = 1").run(Date.now());
    },
    buyLotteryTicket(userId, guildId, n1, n2, n3) {
        db.prepare("INSERT INTO lottery_tickets (userId, guildId, n1, n2, n3) VALUES (?, ?, ?, ?, ?)").run(userId, guildId, n1, n2, n3);
    },
    getUserLotteryTickets(userId) {
        return db.prepare("SELECT n1, n2, n3 FROM lottery_tickets WHERE userId = ?").all(userId);
    },
    getAllLotteryTickets() {
        return db.prepare("SELECT userId, guildId, n1, n2, n3 FROM lottery_tickets").all();
    },
    clearLotteryTickets() {
        db.prepare("DELETE FROM lottery_tickets").run();
    },
    getProfileSettings(userId) {
        db.prepare("INSERT OR IGNORE INTO profile_settings (userId) VALUES (?)").run(userId);
        return db.prepare("SELECT * FROM profile_settings WHERE userId = ?").get(userId);
    },
    updateProfileSettings(userId, { theme, background, activeTitle, socialDiscord, socialTwitter, socialTwitch, socialYoutube, bio, favGames, badges }) {
        db.prepare(`
            UPDATE profile_settings
            SET theme = ?, background = ?, activeTitle = ?, socialDiscord = ?, socialTwitter = ?, socialTwitch = ?, socialYoutube = ?, bio = ?, favGames = ?, badges = ?
            WHERE userId = ?
        `).run(theme, background, activeTitle, socialDiscord, socialTwitter, socialTwitch, socialYoutube, bio, favGames, badges, userId);
    },
    addAutoresponder(guildId, triggerText, responseText, matchType = 'contains', createdBy = '') {
        const lowerTrigger = triggerText.toLowerCase().trim();
        db.prepare(`
            INSERT OR REPLACE INTO autoresponders (guildId, triggerText, responseText, matchType, createdBy, createdAt)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(guildId, lowerTrigger, responseText, matchType, createdBy, Date.now());
    },
    removeAutoresponder(guildId, triggerText) {
        const lowerTrigger = triggerText.toLowerCase().trim();
        const res = db.prepare("DELETE FROM autoresponders WHERE guildId = ? AND triggerText = ?").run(guildId, lowerTrigger);
        return res.changes > 0;
    },
    getAutoresponders(guildId) {
        return db.prepare("SELECT * FROM autoresponders WHERE guildId = ? ORDER BY createdAt DESC").all(guildId);
    },
    clearAutoresponders(guildId) {
        const res = db.prepare("DELETE FROM autoresponders WHERE guildId = ?").run(guildId);
        return res.changes;
    },
    matchAutoresponder(guildId, content) {
        if (!content || !guildId) return null;
        const lowerContent = content.toLowerCase().trim();
        const list = db.prepare("SELECT * FROM autoresponders WHERE guildId = ?").all(guildId);

        for (const item of list) {
            const trigger = item.triggerText;
            if (item.matchType === 'exact' && lowerContent === trigger) {
                return item;
            } else if (item.matchType === 'startswith' && lowerContent.startsWith(trigger)) {
                return item;
            } else if ((!item.matchType || item.matchType === 'contains') && lowerContent.includes(trigger)) {
                return item;
            }
        }
        return null;
    },
    getCurrencySettings(guildId) {
        if (!guildId) return { name: 'cherries', symbol: '🍒' };
        const row = db.prepare("SELECT settingVal FROM guild_settings WHERE settingKey = ?").get(`currency_${guildId}`);
        if (row && row.settingVal) {
            try {
                return JSON.parse(row.settingVal);
            } catch (e) {}
        }
        return { name: 'cherries', symbol: '🍒' };
    },
    setCurrencySettings(guildId, name, symbol) {
        const payload = JSON.stringify({ name: name.trim(), symbol: symbol.trim() });
        db.prepare("INSERT OR REPLACE INTO guild_settings (settingKey, settingVal) VALUES (?, ?)").run(`currency_${guildId}`, payload);
    },
    resetCurrencySettings(guildId) {
        db.prepare("DELETE FROM guild_settings WHERE settingKey = ?").run(`currency_${guildId}`);
    },
    exec(sql) {
        return db.exec(sql);
    },
    prepare(sql) {
        return db.prepare(sql);
    }
};