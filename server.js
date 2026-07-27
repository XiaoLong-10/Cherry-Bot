const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database.js');
const { SHOP_ITEMS } = require('./commands/shop.js');

function startServer(client) {
    const app = express();
    const port = process.env.PORT || 3000;

    const isUserAdmin = async (userId) => {
        try {
            const guildId = process.env.DISCORD_GUILD_ID;
            if (!guildId) return false;
            const guild = client.guilds.cache.get(guildId);
            if (!guild) return false;
            const member = await guild.members.fetch(userId).catch(() => null);
            if (!member) return false;
            return member.permissions.has('Administrator');
        } catch (e) {
            console.error('Error checking admin permissions:', e);
            return false;
        }
    };

    app.use(cors());
    app.use(express.json());

    // Serve React build static files (when built)
    app.use(express.static(path.join(__dirname, 'dashboard', 'dist')));

    // ROOT LANDING PAGE
    app.get('/', (req, res) => {
        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>🌸 Cherry Bot 3.0 — Online Status & Dashboard</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        background: linear-gradient(135deg, #1e1e2e, #2d1b4e);
                        color: #ffffff;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        margin: 0;
                    }
                    .card {
                        background: rgba(255, 255, 255, 0.08);
                        backdrop-filter: blur(12px);
                        border: 1px solid rgba(255, 158, 226, 0.2);
                        padding: 40px;
                        border-radius: 20px;
                        text-align: center;
                        max-width: 500px;
                        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                    }
                    h1 { color: #ff9ee2; margin-top: 0; }
                    .badge {
                        background: #2ecc71;
                        color: #000;
                        font-weight: bold;
                        padding: 6px 16px;
                        border-radius: 20px;
                        display: inline-block;
                        margin-bottom: 20px;
                    }
                    .stats {
                        display: flex;
                        justify-content: space-around;
                        margin: 25px 0;
                        background: rgba(0,0,0,0.2);
                        padding: 15px;
                        border-radius: 12px;
                    }
                    .stat-item h3 { margin: 0; color: #f1c40f; }
                    .stat-item p { margin: 5px 0 0 0; font-size: 14px; opacity: 0.8; }
                    a.btn {
                        display: inline-block;
                        background: #7c3aed;
                        color: white;
                        text-decoration: none;
                        padding: 12px 24px;
                        border-radius: 10px;
                        font-weight: bold;
                        transition: 0.2s;
                    }
                    a.btn:hover { background: #9b59b6; }
                </style>
            </head>
            <body>
                <div class="card">
                    <span class="badge">🟢 ONLINE 24/7</span>
                    <h1>🌸 Cherry Bot 3.0</h1>
                    <p>Enterprise Discord Bot Engine & Shared Realm Tycoon</p>
                    <div class="stats">
                        <div class="stat-item">
                            <h3>${client.guilds.cache.size}</h3>
                            <p>Active Servers</p>
                        </div>
                        <div class="stat-item">
                            <h3>68</h3>
                            <p>Slash Commands</p>
                        </div>
                    </div>
                    <a href="/api/stats" class="btn">📊 View JSON REST API</a>
                </div>
            </body>
            </html>
        `);
    });

    // API ENDPOINT: stats
    app.get('/api/stats', (req, res) => {
        try {
            const totalUsersRow = db.prepare("SELECT COUNT(*) as cnt FROM users").get();
            const totalUsers = totalUsersRow ? totalUsersRow.cnt : 0;

            const totalCoinsRow = db.prepare("SELECT SUM(coins) as sum FROM users").get();
            const totalCoins = totalCoinsRow ? totalCoinsRow.sum : 0;

            const jackpot = db.getSlotsJackpot();

            const notice = db.getSetting('guild_notice', {
                title: 'Ancient Magma Dragon Sighted',
                content: 'Form a party of up to 5 members immediately. Coordinate your defenses and utilize spells. Defeating the beast yields 2,500 cherries and rare scales.'
            });

            res.json({
                totalPlayers: totalUsers,
                circulatingWealth: totalCoins,
                slotsJackpot: jackpot,
                activeGuilds: client.guilds.cache.size,
                announcement: notice
            });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // API ENDPOINT: leaderboard
    app.get('/api/leaderboard', (req, res) => {
        try {
            const { skill } = req.query;
            const validSkills = ['mining', 'fishing', 'cooking', 'crafting', 'alchemy', 'smithing', 'woodcutting', 'magic', 'combat'];

            if (skill && validSkills.includes(skill.toLowerCase())) {
                const colName = `skill_${skill.toLowerCase()}`;
                const skillLeaderboard = db.prepare(`SELECT userId, ${colName} as skillLevel, coins, level FROM users WHERE ${colName} IS NOT NULL ORDER BY ${colName} DESC, level DESC LIMIT 10`).all();
                
                const mapped = skillLeaderboard.map(u => {
                    const discordUser = client.users.cache.get(u.userId);
                    return {
                        userId: u.userId,
                        username: discordUser ? discordUser.username : `User_${u.userId.substring(0, 5)}`,
                        avatar: discordUser ? discordUser.displayAvatarURL({ extension: 'png', size: 128 }) : null,
                        skillLevel: u.skillLevel,
                        level: u.level,
                        coins: u.coins
                    };
                });
                return res.json({ success: true, list: mapped });
            }

            const coinsLeaderboard = db.prepare("SELECT userId, coins, level, xp FROM users ORDER BY coins DESC LIMIT 10").all();
            const xpLeaderboard = db.prepare("SELECT userId, level, xp, coins FROM users ORDER BY level DESC, xp DESC LIMIT 10").all();

            const mapUser = (u) => {
                const discordUser = client.users.cache.get(u.userId);
                return {
                    userId: u.userId,
                    username: discordUser ? discordUser.username : `User_${u.userId.substring(0, 5)}`,
                    avatar: discordUser ? discordUser.displayAvatarURL({ extension: 'png', size: 128 }) : null,
                    coins: u.coins,
                    level: u.level,
                    xp: u.xp
                };
            };

            res.json({
                wealth: coinsLeaderboard.map(mapUser),
                combat: xpLeaderboard.map(mapUser)
            });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // API ENDPOINT: stocks
    app.get('/api/stocks', (req, res) => {
        try {
            const stockRows = db.prepare("SELECT * FROM stock_prices").all();
            const newsRows = db.prepare("SELECT * FROM stock_news ORDER BY timestamp DESC LIMIT 10").all();

            const stocks = stockRows.map(row => {
                let history = [];
                try {
                    history = JSON.parse(row.history || '[]');
                } catch (e) {}
                return {
                    ticker: row.ticker,
                    companyName: row.companyName,
                    price: row.price,
                    prevPrice: row.prevPrice,
                    history: history
                };
            });

            res.json({
                stocks,
                news: newsRows
            });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // API ENDPOINT: players
    app.get('/api/players', (req, res) => {
        try {
            const users = db.prepare("SELECT * FROM users WHERE char_name IS NOT NULL").all();
            
            const players = users.map(u => {
                const discordUser = client.users.cache.get(u.userId);
                const pet = db.prepare("SELECT * FROM pets WHERE userId = ? LIMIT 1").get(u.userId);
                const farmPlots = db.prepare("SELECT * FROM farm_plots WHERE userId = ?").all(u.userId);

                return {
                    userId: u.userId,
                    username: discordUser ? discordUser.username : `Player_${u.userId.substring(0, 5)}`,
                    avatar: discordUser ? discordUser.displayAvatarURL({ extension: 'png', size: 128 }) : null,
                    charName: u.char_name,
                    race: u.race,
                    class: u.class,
                    level: u.level,
                    coins: u.coins,
                    hp: u.hp,
                    maxHp: u.max_hp || 100,
                    mana: u.mana,
                    maxMana: u.max_mana || 50,
                    weapon: u.equipped_weapon || 'None',
                    shield: u.equipped_shield || 'None',
                    skills: {
                        combat: u.skill_combat || 1,
                        magic: u.skill_magic || 1,
                        smithing: u.skill_smithing || 1,
                        alchemy: u.skill_alchemy || 1,
                        farming: u.skill_farming || 1
                    },
                    stats: {
                        strength: u.stat_str || 10,
                        intelligence: u.stat_int || 10,
                        dexterity: u.stat_dex || 10,
                        defense: u.stat_def || 10,
                        luck: u.stat_luc || 10
                    },
                    achievements: db.prepare("SELECT achievementId FROM achievements WHERE userId = ?").all(u.userId).map(a => a.achievementId),
                    duelStats: {
                        wins: u.duel_wins || 0,
                        losses: u.duel_losses || 0,
                        streak: u.duel_streak || 0
                    },
                    pet: pet ? { name: pet.petName, type: pet.petType, level: pet.level } : null,
                    plots: farmPlots.length
                };
            });

            res.json(players);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // API ENDPOINT: auth verify
    app.post('/api/auth', async (req, res) => {
        const { token } = req.body;
        if (!token) return res.status(400).json({ error: 'Token is required' });

        const userId = db.verifyWebToken(token);
        if (!userId) return res.status(401).json({ error: 'Invalid or expired login token' });

        const char = db.getCharacter(userId);
        const isAdmin = await isUserAdmin(userId);
        
        res.json({
            success: true,
            userId,
            charName: char ? char.char_name : 'Adventurer',
            isAdmin
        });
    });

    // API ENDPOINT: user inventory details
    app.get('/api/inventory/:userId', (req, res) => {
        const { userId } = req.params;
        try {
            const inventory = db.getInventory(userId);
            const char = db.getCharacter(userId);
            res.json({
                inventory,
                equippedWeapon: char ? char.equipped_weapon : null,
                equippedShield: char ? char.equipped_shield : null
            });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // API ENDPOINT: shop items list
    app.get('/api/shop', (req, res) => {
        res.json(Object.values(SHOP_ITEMS));
    });

    // API ENDPOINT: purchase item
    app.post('/api/shop/buy', (req, res) => {
        const { userId, itemId } = req.body;
        try {
            const item = SHOP_ITEMS[itemId];
            if (!item) return res.status(400).json({ error: 'Item not found' });

            const balance = db.getBalance(userId, 'global');
            if (balance < item.price) {
                return res.status(400).json({ error: 'Insufficient cherries in wallet' });
            }

            db.deductCoins(userId, 'global', item.price);
            db.addItem(userId, item.name, 1);
            db.logTransaction(userId, 'Shop Purchase Web', `Bought 1x ${item.name} for 🍒 ${item.price}`);

            res.json({
                success: true,
                balance: db.getBalance(userId, 'global'),
                inventory: db.getInventory(userId)
            });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // API ENDPOINT: get admin transaction logs
    app.get('/api/admin/logs', async (req, res) => {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: 'Unauthorized: Missing User ID' });
        
        const isAdmin = await isUserAdmin(authHeader);
        if (!isAdmin) return res.status(403).json({ error: 'Forbidden: Admin access only' });

        try {
            const logs = db.getRecentTransactions(50);
            res.json(logs);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // API ENDPOINT: get admin settings
    app.get('/api/admin/settings', async (req, res) => {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
        
        const isAdmin = await isUserAdmin(authHeader);
        if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

        try {
            const settings = db.getSetting('welcome', {});
            res.json(settings);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // API ENDPOINT: update admin settings
    app.post('/api/admin/settings', async (req, res) => {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
        
        const isAdmin = await isUserAdmin(authHeader);
        if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

        const { welcomeMsg, leaveMsg, autoRole } = req.body;
        try {
            const settings = db.getSetting('welcome', {});
            if (welcomeMsg !== undefined) settings.welcomeMsg = welcomeMsg;
            if (leaveMsg !== undefined) settings.leaveMsg = leaveMsg;
            if (autoRole !== undefined) settings.autoRole = autoRole;

            db.setSetting('welcome', settings);
            res.json({ success: true, settings });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // API ENDPOINT: admin modify player balance
    app.post('/api/admin/modify-balance', async (req, res) => {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
        
        const isAdmin = await isUserAdmin(authHeader);
        if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

        const { targetUserId, action, amount } = req.body;
        if (!targetUserId || !action || !amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid arguments' });
        }

        try {
            const char = db.getCharacter(targetUserId);
            if (!char || !char.char_name) {
                return res.status(400).json({ error: 'Target user does not have an RPG character' });
            }

            if (action === 'give') {
                db.addCoins(targetUserId, 'global', amount);
                db.logTransaction(targetUserId, 'Admin Web Reward', `Granted 🍒 ${amount} by admin ID ${authHeader}`);
            } else {
                db.deductCoins(targetUserId, 'global', amount);
                db.logTransaction(targetUserId, 'Admin Web Deduct', `Deducted 🍒 ${amount} by admin ID ${authHeader}`);
            }

            res.json({
                success: true,
                newBalance: db.getBalance(targetUserId, 'global')
            });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // API ENDPOINT: get homestead details
    app.get('/api/homestead/:userId', (req, res) => {
        const { userId } = req.params;
        try {
            const house = db.getHouse(userId) || { houseType: 'None', upgradeLevel: 0 };
            const properties = db.getUserProperties(userId) || [];
            const dinoPark = db.getDinoPark(userId) || { dinos: 0, securityLevel: 1 };
            const aquarium = db.getAquarium(userId) || { fishCount: 0 };
            res.json({ house, properties, dinoPark, aquarium });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // API ENDPOINT: collect estate property rent
    app.post('/api/homestead/collect-rent', (req, res) => {
        const { userId, propertyId } = req.body;
        try {
            const properties = db.getUserProperties(userId) || [];
            const prop = properties.find(p => p.id === propertyId);
            if (!prop) return res.status(404).json({ error: 'Property not found' });
            if (prop.status !== 'Rented') return res.status(400).json({ error: 'Property is vacant' });

            const now = Date.now();
            const lastCollected = prop.lastCollected || now;
            const hours = (now - lastCollected) / (3600 * 1000);
            
            if (hours < 1) {
                const minutesLeft = Math.ceil(60 - (now - lastCollected) / (60 * 1000));
                return res.status(400).json({ error: `Rent can be collected once per hour. Please wait ${minutesLeft} minutes.` });
            }

            const rentRate = prop.rentRate || 50;
            const rentEarned = Math.floor(hours * rentRate);
            if (rentEarned <= 0) return res.status(400).json({ error: 'No rent accrued yet' });

            db.collectPropertyRent(propertyId, userId, rentEarned, now, 'global');
            res.json({ success: true, rentEarned });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // API ENDPOINT: collect fish aquarium revenue
    app.post('/api/homestead/collect-aquarium', (req, res) => {
        const { userId } = req.body;
        try {
            const aq = db.getAquarium(userId);
            if (!aq || aq.fishCount <= 0) {
                return res.status(400).json({ error: 'Your aquarium is empty! Adopt some fish first in Discord using `/fish`.' });
            }

            const now = Date.now();
            const lastCollected = aq.lastCollected || now;
            const hours = (now - lastCollected) / (3600 * 1000);
            if (hours < 1) {
                const minutesLeft = Math.ceil(60 - (now - lastCollected) / (60 * 1000));
                return res.status(400).json({ error: `Aquarium income can be collected once per hour. Please wait ${minutesLeft} minutes.` });
            }

            const revenue = Math.floor(hours * aq.fishCount * 30);
            if (revenue <= 0) return res.status(400).json({ error: 'No revenue accrued yet' });

            db.collectAquariumRevenue(userId, revenue, now, 'global');
            res.json({ success: true, revenue });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // API ENDPOINT: clone dinosaur
    app.post('/api/homestead/clone-dino', (req, res) => {
        const { userId } = req.body;
        try {
            const wallet = db.getBalance(userId, 'global') || 0;
            if (wallet < 2000) {
                return res.status(400).json({ error: 'Cloning a dinosaur costs 2,000 cherries' });
            }

            db.cloneDinosaur(userId, 2000, 'global');
            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // API ENDPOINT: collect dinosaur park revenue
    app.post('/api/homestead/collect-dino', (req, res) => {
        const { userId } = req.body;
        try {
            const park = db.getDinoPark(userId);
            if (!park || park.dinos <= 0) {
                return res.status(400).json({ error: 'Your park has no dinosaurs! Clone one first.' });
            }

            const now = Date.now();
            const lastCollected = park.lastCollected || now;
            const hours = (now - lastCollected) / (3600 * 1000);
            if (hours < 1) {
                const minutesLeft = Math.ceil(60 - (now - lastCollected) / (60 * 1000));
                return res.status(400).json({ error: `Park revenue can be collected once per hour. Please wait ${minutesLeft} minutes.` });
            }

            const revenue = Math.floor(hours * park.dinos * 120);
            if (revenue <= 0) return res.status(400).json({ error: 'No revenue accrued yet' });

            db.collectParkRevenue(userId, revenue, now, 'global');
            res.json({ success: true, revenue });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // API ENDPOINT: farm status
    app.get('/api/farm/:userId', (req, res) => {
        const { userId } = req.params;
        try {
            const plots = db.getFarmPlots(userId);
            res.json(plots);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // API ENDPOINT: farm plant
    app.post('/api/farm/plant', (req, res) => {
        const { userId, plotIndex, cropType } = req.body;
        try {
            const CROPS_CONFIG = {
                Wheat: { seed: 'Wheat Seed' },
                Apple: { seed: 'Apple Seed' },
                Berry: { seed: 'Berry Seed' }
            };

            const c = CROPS_CONFIG[cropType];
            if (!c) return res.status(400).json({ error: 'Invalid crop type' });

            const inventory = db.getInventory(userId);
            const seedItem = inventory.find(i => i.itemName.toLowerCase() === c.seed.toLowerCase() && i.quantity > 0);
            if (!seedItem) return res.status(400).json({ error: `You do not own any ${c.seed}s` });

            db.removeItem(userId, c.seed, 1);
            db.plantCrop(userId, plotIndex, cropType);

            res.json({ success: true, plots: db.getFarmPlots(userId) });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // API ENDPOINT: farm water
    app.post('/api/farm/water', (req, res) => {
        const { userId, plotIndex } = req.body;
        try {
            db.waterCrop(userId, plotIndex);
            res.json({ success: true, plots: db.getFarmPlots(userId) });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // API ENDPOINT: farm harvest
    app.post('/api/farm/harvest', (req, res) => {
        const { userId, plotIndex } = req.body;
        try {
            const plots = db.getFarmPlots(userId);
            const plot = plots.find(p => p.plotIndex === plotIndex);
            if (!plot) return res.status(400).json({ error: 'Plot is empty' });

            const CROPS_CONFIG = {
                Wheat: { yieldQty: 3, yieldName: 'Wheat', skillXp: 1 },
                Apple: { yieldQty: 2, yieldName: 'Apple', skillXp: 2 },
                Berry: { yieldQty: 4, yieldName: 'Berries', skillXp: 3 }
            };

            const r = CROPS_CONFIG[plot.cropType];
            db.harvestCrop(userId, plotIndex);
            db.addItem(userId, r.yieldName, r.yieldQty);
            db.increaseSkill(userId, 'farming', r.skillXp);

            res.json({ success: true, plots: db.getFarmPlots(userId) });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // API ENDPOINT: equip item
    app.post('/api/character/equip', (req, res) => {
        const { userId, itemName, slot } = req.body;
        try {
            const inventory = db.getInventory(userId);
            const hasItem = inventory.find(i => i.itemName.toLowerCase() === itemName.toLowerCase() && i.quantity > 0);
            if (!hasItem) return res.status(400).json({ error: `You do not own a ${itemName}` });

            db.removeItem(userId, itemName, 1);
            const oldItem = db.equipItem(userId, itemName, slot);
            if (oldItem) {
                db.addItem(userId, oldItem, 1);
            }

            res.json({ success: true, oldItem });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // API ENDPOINT: spin wheel
    app.post('/api/wheel/spin', (req, res) => {
        const { userId } = req.body;
        try {
            const wallet = db.getBalance(userId, 'global') || 0;
            if (wallet < 200) return res.status(400).json({ error: 'Insufficient cherries. Spin costs 200 cherries.' });

            db.deductCoins(userId, 'global', 200);
            db.unlockAchievement(userId, 'first_spin');

            const SECTORS = [
                { label: 'CHERRY 🍒', action: () => db.addCoins(userId, 'global', 1000) },
                { label: 'CHERRY BASKET 🍒', action: () => db.addCoins(userId, 'global', 500) },
                { label: 'XP BOOST ⚡', action: () => db.addXp(userId, 'global', 150) },
                { label: 'LUCK BUFF 🍀', action: () => db.prepare("UPDATE users SET luck_buff_expiry = ? WHERE userId = ?").run(Date.now() + 30 * 60 * 1000, userId) },
                { label: 'LEMON 🍋', action: () => db.addCoins(userId, 'global', 100) },
                { label: 'RUIN 💀', action: () => db.deductCoins(userId, 'global', 200) },
                { label: 'NOTHING ❌', action: () => {} },
                { label: 'BONUS CHERRY 🍒', action: () => db.addCoins(userId, 'global', 300) }
            ];

    // API ENDPOINT: active stock wheel spin
            const winningIndex = Math.floor(Math.random() * SECTORS.length);
            const sector = SECTORS[winningIndex];
            sector.action();

            res.json({
                success: true,
                landed: sector.label,
                balance: db.getBalance(userId, 'global')
            });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // API ENDPOINT: get lottery status and tickets
    app.get('/api/lottery/:userId', (req, res) => {
        const { userId } = req.params;
        try {
            const state = db.getLotteryState();
            const pool = state ? state.pool : 1000;
            const lastDraw = state ? state.lastDrawTime : Date.now();
            const myTickets = db.getUserLotteryTickets(userId) || [];
            res.json({ pool, lastDraw, myTickets });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // API ENDPOINT: buy lottery ticket
    app.post('/api/lottery/buy', (req, res) => {
        const { userId, n1, n2, n3 } = req.body;
        try {
            const num1 = parseInt(n1);
            const num2 = parseInt(n2);
            const num3 = parseInt(n3);
            
            if (isNaN(num1) || isNaN(num2) || isNaN(num3) || num1 < 1 || num1 > 9 || num2 < 1 || num2 > 9 || num3 < 1 || num3 > 9) {
                return res.status(400).json({ error: 'Numbers must be between 1 and 9' });
            }

            const balance = db.getBalance(userId, 'global') || 0;
            if (balance < 100) {
                return res.status(400).json({ error: 'Tickets cost 100 cherries. Insufficient balance!' });
            }

            db.deductCoins(userId, 'global', 100);
            db.buyLotteryTicket(userId, 'global', num1, num2, num3);
            db.addLotteryPool(50); // Add 50 cherries to jackpot pool
            db.logTransaction(userId, 'Lottery Purchase', `Bought ticket [${num1}-${num2}-${num3}] (-100c)`);

            const myTickets = db.getUserLotteryTickets(userId) || [];
            res.json({ success: true, myTickets });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    const activeBlackjackGames = {};

    // --- Server Protection & Security States ---
    const securitySettings = {
        antiRaid: true,
        antiNuke: true,
        antiSpam: true,
        antiScam: true,
        antiLink: false,
        antiMention: true
    };

    const activePunishments = []; // { id, userId, type: 'ban'|'mute'|'jail', expiresAt, reason }
    const inviteLogs = [
        { code: 'CHERRY-RPG', creator: 'Admin', joins: 142 },
        { code: 'GUILD-WARS', creator: 'HealerLvl9', joins: 29 },
        { code: 'companion-ZOO', creator: 'FarmerBob', joins: 18 }
    ];

    function isJailed(userId) {
        const record = activePunishments.find(p => p.userId === userId && p.type === 'jail' && p.expiresAt > Date.now());
        return !!record;
    }

    // --- Community Hub States ---
    const communityPolls = [
        { id: 1, question: "Should we raise Apothecary business base revenue rates?", optionA: "Yes, definitely!", optionB: "No, keep it balanced", votesA: 18, votesB: 9 }
    ];
    const communityConfessions = [
        { id: 1, text: "I spent all my guild bank balance on blackjack and lost it all.", timestamp: Date.now() - 3600000 }
    ];
    const starboardMessages = [
        { id: 1, author: "HealerLvl9", content: "Just reached dungeon level 8 without dying once!", stars: 8 },
        { id: 2, author: "FarmerBob", content: "Cloned a Rare T-Rex dinosaur today! So lucky!", stars: 5 }
    ];
    const communityEvents = [
        { id: 1, title: "🐉 Saturday Night Dragon Boss Raid", date: "2026-07-25 20:00", attendees: ["Admin", "FarmerBob"] },
        { id: 2, title: "🎣 Sunday Pond Fishing Tournament", date: "2026-07-26 14:00", attendees: ["HealerLvl9"] }
    ];
    const communityNews = [
        { id: 1, title: "📢 Portals Expansion & Zoo Modules Released!", content: "Dino Park clones, custom aquariums, and slot machines are now live!" },
        { id: 2, title: "⚖️ Server Moderation & Jail Systems online", content: "Electrified safety toggles, temp suspensions, and jail bail centers have been deployed." }
    ];
    const communityGoals = {
        current: 18200,
        target: 50000,
        title: "🏰 Guild Castle Citadel Upgrade Expansion"
    };
    const dailyQuestion = {
        question: "What is your favorite companion companion and why?",
        answers: [
            { author: "FarmerBob", text: "Fox! It fits my woodland homestead perfectly." }
        ]
    };
    const userReputation = {}; // userId -> points
    const upcomingBirthdays = [
        { userId: '1', name: 'FarmerBob', date: 'July 20' },
        { userId: '2', name: 'HealerLvl9', date: 'July 22' }
    ];

    // --- SUPPORT TICKET SUITE STORE ---
    const ticketCategories = ['Bug Report', 'General Question', 'Business & Partnership', 'Punishment Appeal'];
    const staffMembers = ['Mod1', 'Mod2', 'Mod3', 'Admin'];
    let staffRotationIdx = 0;

    let supportTickets = [
        {
            id: 101,
            author: 'FarmerBob',
            category: 'Bug Report',
            priority: 'High',
            assignedTo: 'Mod1',
            status: 'Open',
            subject: 'Crops not rendering after planting',
            createdTime: Date.now() - 3600 * 1000 * 2,
            slaLimit: Date.now() + 3600 * 1000 * 2,
            messages: [
                { author: 'FarmerBob', text: 'My tomatoes vanished after planting in homestead plot #2.' }
            ],
            staffNotes: 'Under review by mechanics dev.',
            satisfaction: null
        },
        {
            id: 102,
            author: 'HealerLvl9',
            category: 'General Question',
            priority: 'Low',
            assignedTo: 'Mod2',
            status: 'Closed',
            subject: 'Guild size increase criteria',
            createdTime: Date.now() - 3600 * 1000 * 24,
            slaLimit: Date.now() - 3600 * 1000 * 20,
            messages: [
                { author: 'HealerLvl9', text: 'How do I raise maximum guild member slots?' },
                { author: 'Mod2', text: 'Upgrade the Castle Citadel on the Community tab!' }
            ],
            staffNotes: 'Answered successfully.',
            satisfaction: 5
        }
    ];

    // --- APPLICATIONS & RECRUITMENT STORE ---
    const appTypes = ['Staff Application', 'Partnership Application', 'Creator Application', 'Whitelist Application', 'Ban Appeal', 'Promotion Request'];
    let userApplications = [
        {
            id: 501,
            author: 'FarmerBob',
            type: 'Creator Application',
            status: 'Pending',
            createdTime: Date.now() - 3600 * 1000 * 5,
            details: {
                channelUrl: 'youtube.com/farmerbob',
                subscribers: '1500',
                description: 'Streaming Cherry RPG homestead builds twice a week.'
            },
            reviews: [
                { reviewer: 'Mod1', score: 4, comment: 'Active streamer, great community engagement.' }
            ],
            interviewTime: null,
            autoAccepted: false
        },
        {
            id: 502,
            author: 'HealerLvl9',
            type: 'Staff Application',
            status: 'Approved',
            createdTime: Date.now() - 3600 * 1000 * 48,
            details: {
                age: '21',
                experience: 'Experienced admin on 2 large RPG guild servers.',
                timezone: 'UTC+2'
            },
            reviews: [
                { reviewer: 'Admin', score: 5, comment: 'Highly qualified candidate.' }
            ],
            interviewTime: '2026-07-22T15:00',
            autoAccepted: false
        }
    ];

    // --- SERVER AUTOMATION & WORKFLOWS STORE ---
    let serverAutomations = {
        autoRoles: ['Novice Adventurer', 'Verified Inhabitant'],
        autoThreads: [
            { triggerChannel: '#market-deals', threadName: 'Price Check Discussion' }
        ],
        scheduledMessages: [
            { id: 301, time: 'Daily 00:00', channel: '#announcements', content: 'Remember to collect your Daily Question points on the Community tab!' }
        ],
        welcomeMessage: 'Welcome to Cherry valley, {user}! Grab a spade in Homestead and start farming!',
        goodbyeMessage: 'Oh no! {user} left the valley. Their crop plots withered away.',
        reactionRoles: [
            { emoji: '⚔️', role: 'Fighter Guild' },
            { emoji: '🌾', role: 'Farmer Guild' }
        ],
        buttonRoles: [
            { label: 'News Alerts Ping', role: 'Announcements Ping' }
        ],
        autoArchiveHours: 24,
        reminders: [
            { id: 401, time: '2026-07-25T18:00', content: 'Saturday Boss Raid event start' }
        ],
        customWorkflows: [
            { name: 'Double XP Weekend Rule', triggers: 'Saturday 00:00 Auto-ON', status: 'Active' }
        ]
    };

    // --- PREMIUM BOT OS CONFIGURATION STORE ---
    let botOSConfig = {
        installedPlugins: ['Economy', 'Support Tickets', 'AI Hub', 'Analytics', 'Casino', 'Dungeons', 'Music'],
        crossServerSync: true,
        dynamicAchievements: [
            { id: 901, name: 'Active Speaker', criteria: 'Message count exceeds 500 posts', reward: '🍒 250 Coins', badge: 'Speaker Badge' }
        ],
        seasonalEvent: 'Summer Beach Splash Quest',
        quizzes: [
            {
                id: 1,
                title: 'Cherry Valley Homestead Certification',
                questions: [
                    { question: 'What tool is used to adopting pets?', options: ['Spade', 'Net', 'Collar', 'Fishing Rod'], correct: 'Collar' }
                ],
                certificateBadge: 'Certified Farmer'
            }
        ],
        backups: [
            { id: 'backup_01', timestamp: Date.now() - 3600 * 1000 * 10, filename: 'database_auto_save_01.json' }
        ],
        developerApiTokens: ['token_live_dev_test_cherry_bot_os_9921']
    };

    // --- PREMIUM MUSIC STUDIO STATE STORE ---
    let botMusicState = {
        nowPlaying: {
            title: 'Lofi Chill Hop Beats - Cherry Valley Edition',
            artist: 'Cherry Studios',
            artwork: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4',
            duration: 180,
            position: 45,
            paused: false,
            volume: 75,
            loopMode: 'None',
            lyrics: "Slow down your breath...\nWelcome to the Cherry Valley Lounge...\nFarming and building through the sunset...\nSlow down and enjoy the lo-fi beats...\nRelax, you are home."
        },
        queue: [
            { id: 101, title: 'Harvest Moon Melodies', artist: 'Autumn Breeze', duration: 154, requestedBy: 'Mod1' },
            { id: 102, title: 'Dungeon Raid Synthwave', artist: 'Neon Knight', duration: 210, requestedBy: 'Mod2' },
            { id: 103, title: 'Blackjack Lounge Jazz', artist: 'Spins Trio', duration: 195, requestedBy: 'Admin' }
        ],
        queueHistory: [
            { title: 'Morning Dew Acoustic', artist: 'Cherry Studios', duration: 120 }
        ],
        filters: {
            bassBoost: false,
            nightcore: false,
            vaporwave: false,
            eightD: false,
            karaoke: false,
            reverbLevel: 0,
            speed: 1.0,
            pitch: 1.0
        },
        playlists: [
            {
                name: 'Mod Relax Mix',
                owner: 'Mod1',
                collaborative: true,
                songsCount: 4,
                songsList: [
                    { title: 'Harvest Moon Melodies', artist: 'Autumn Breeze', duration: 154 }
                ]
            }
        ],
        analytics: {
            totalHoursListened: 148,
            mostPlayedSongs: [
                { title: 'Lofi Chill Hop Beats', plays: 432 },
                { title: 'Harvest Moon Melodies', plays: 289 },
                { title: 'Dungeon Raid Synthwave', plays: 198 }
            ],
            mostActiveListeners: [
                { name: 'Mod1', hours: 42 },
                { name: 'Admin', hours: 38 },
                { name: 'Mod2', hours: 29 }
            ],
            peakListeningHours: '19:00 - 21:00'
        },
        trivia: {
            question: 'Which instrument has 88 keys?',
            options: ['Guitar', 'Violin', 'Piano', 'Flute'],
            correct: 'Piano'
        }
    };

    function createDeck() {
        const SUITS = ['♠', '♥', '♦', '♣'];
        const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const deck = [];
        for (const suit of SUITS) {
            for (const val of VALUES) {
                deck.push({ suit, value: val });
            }
        }
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    function calculateHandScore(hand) {
        let value = 0;
        let aces = 0;
        for (const card of hand) {
            if (card.value === 'A') { aces += 1; value += 11; }
            else if (['K', 'Q', 'J', '10'].includes(card.value)) { value += 10; }
            else { value += parseInt(card.value); }
        }
        while (value > 21 && aces > 0) { value -= 10; aces -= 1; }
        return value;
    }

    // API ENDPOINT: start blackjack game
    app.post('/api/blackjack/start', (req, res) => {
        const { userId, wager } = req.body;
        try {
            const bet = parseInt(wager);
            if (isNaN(bet) || bet <= 0) return res.status(400).json({ error: 'Wager must be positive' });

            const balance = db.getBalance(userId, 'global') || 0;
            if (balance < bet) return res.status(400).json({ error: 'Insufficient cherries' });

            db.deductCoins(userId, 'global', bet);

            const deck = createDeck();
            const playerHand = [deck.pop(), deck.pop()];
            const dealerHand = [deck.pop(), deck.pop()];

            const playerVal = calculateHandScore(playerHand);
            const dealerVal = calculateHandScore(dealerHand);

            if (playerVal === 21) {
                const payout = Math.floor(bet * 2.5);
                db.addCoins(userId, 'global', payout);
                db.logTransaction(userId, 'Blackjack Win', `Natural Blackjack! Bet 🍒 ${bet}, won 🍒 ${payout}`);
                
                return res.json({
                    success: true,
                    status: 'natural_blackjack',
                    playerHand,
                    dealerHand,
                    playerVal,
                    dealerVal,
                    bet,
                    balance: db.getBalance(userId, 'global')
                });
            }

            activeBlackjackGames[userId] = {
                deck,
                playerHand,
                dealerHand,
                bet
            };

            res.json({
                success: true,
                status: 'playing',
                playerHand,
                dealerHand: [dealerHand[0], { suit: '?', value: 'Hidden' }],
                playerVal,
                dealerVal: calculateHandScore([dealerHand[0]]),
                bet,
                balance: db.getBalance(userId, 'global')
            });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // API ENDPOINT: blackjack hit
    app.post('/api/blackjack/hit', (req, res) => {
        const { userId } = req.body;
        try {
            const game = activeBlackjackGames[userId];
            if (!game) return res.status(400).json({ error: 'No active Blackjack game found' });

            const newCard = game.deck.pop();
            game.playerHand.push(newCard);

            const playerVal = calculateHandScore(game.playerHand);
            if (playerVal > 21) {
                delete activeBlackjackGames[userId];
                db.logTransaction(userId, 'Blackjack Loss', `Busted with ${playerVal}! Lost 🍒 ${game.bet}`);
                return res.json({
                    success: true,
                    status: 'bust',
                    playerHand: game.playerHand,
                    playerVal,
                    balance: db.getBalance(userId, 'global')
                });
            }

            res.json({
                success: true,
                status: 'playing',
                playerHand: game.playerHand,
                playerVal
            });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // API ENDPOINT: blackjack stand
    app.post('/api/blackjack/stand', (req, res) => {
        const { userId } = req.body;
        try {
            const game = activeBlackjackGames[userId];
            if (!game) return res.status(400).json({ error: 'No active Blackjack game found' });

            delete activeBlackjackGames[userId];

            let dealerVal = calculateHandScore(game.dealerHand);
            while (dealerVal < 17) {
                game.dealerHand.push(game.deck.pop());
                dealerVal = calculateHandScore(game.dealerHand);
            }

            const playerVal = calculateHandScore(game.playerHand);
            let result = 'loss';
            let payout = 0;

            if (dealerVal > 21) {
                result = 'dealer_bust';
                payout = game.bet * 2;
            } else if (playerVal > dealerVal) {
                result = 'win';
                payout = game.bet * 2;
            } else if (playerVal < dealerVal) {
                result = 'loss';
            } else {
                result = 'push';
                payout = game.bet;
            }

            if (payout > 0) {
                db.addCoins(userId, 'global', payout);
            }

            db.logTransaction(userId, 'Blackjack Resolved', `Result: ${result}. Bet 🍒 ${game.bet}, payout: 🍒 ${payout}`);

            res.json({
                success: true,
                status: result,
                playerHand: game.playerHand,
                dealerHand: game.dealerHand,
                playerVal,
                dealerVal,
                payout,
                balance: db.getBalance(userId, 'global')
            });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // API ENDPOINT: blackjack double down
    app.post('/api/blackjack/double', (req, res) => {
        const { userId } = req.body;
        try {
            const game = activeBlackjackGames[userId];
            if (!game) return res.status(400).json({ error: 'No active Blackjack game found' });

            const balance = db.getBalance(userId, 'global') || 0;
            if (balance < game.bet) return res.status(400).json({ error: 'Insufficient cherries to double down' });

            db.deductCoins(userId, 'global', game.bet);
            game.bet *= 2;

            const newCard = game.deck.pop();
            game.playerHand.push(newCard);

            const playerVal = calculateHandScore(game.playerHand);
            if (playerVal > 21) {
                delete activeBlackjackGames[userId];
                db.logTransaction(userId, 'Blackjack Loss', `Busted on double down with ${playerVal}! Lost 🍒 ${game.bet}`);
                return res.json({
                    success: true,
                    status: 'bust',
                    playerHand: game.playerHand,
                    playerVal,
                    balance: db.getBalance(userId, 'global')
                });
            }

            delete activeBlackjackGames[userId];

            let dealerVal = calculateHandScore(game.dealerHand);
            while (dealerVal < 17) {
                game.dealerHand.push(game.deck.pop());
                dealerVal = calculateHandScore(game.dealerHand);
            }

            let result = 'loss';
            let payout = 0;

            if (dealerVal > 21) {
                result = 'dealer_bust';
                payout = game.bet * 2;
            } else if (playerVal > dealerVal) {
                result = 'win';
                payout = game.bet * 2;
            } else if (playerVal < dealerVal) {
                result = 'loss';
            } else {
                result = 'push';
                payout = game.bet;
            }

            if (payout > 0) {
                db.addCoins(userId, 'global', payout);
            }

            db.logTransaction(userId, 'Blackjack Double Resolved', `Result: ${result}. Bet 🍒 ${game.bet}, payout: 🍒 ${payout}`);

            res.json({
                success: true,
                status: result,
                playerHand: game.playerHand,
                dealerHand: game.dealerHand,
                playerVal,
                dealerVal,
                payout,
                balance: db.getBalance(userId, 'global')
            });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // API ENDPOINT: active marketplace listings
    app.get('/api/marketplace', (req, res) => {
        try {
            const listings = db.prepare("SELECT * FROM marketplace").all();
            const enriched = listings.map(l => {
                const user = client.users.cache.get(l.sellerId);
                return {
                    id: l.id,
                    sellerId: l.sellerId,
                    sellerName: user ? user.username : `User_${l.sellerId.substring(0, 5)}`,
                    itemName: l.itemName,
                    quantity: l.quantity,
                    price: l.price
                };
            });
            res.json(enriched);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // API ENDPOINT: buy listing
    app.post('/api/marketplace/buy', (req, res) => {
        const { userId, listingId } = req.body;
        try {
            const listing = db.prepare("SELECT * FROM marketplace WHERE id = ?").get(listingId);
            if (!listing) return res.status(404).json({ error: 'Listing not found' });

            const buyerBalance = db.getBalance(userId, 'global') || 0;
            if (buyerBalance < listing.price) {
                return res.status(400).json({ error: 'Insufficient cherries in wallet' });
            }

            db.deductCoins(userId, 'global', listing.price);
            db.addCoins(listing.sellerId, 'global', listing.price);
            db.addItem(userId, listing.itemName, listing.quantity);
            db.prepare("DELETE FROM marketplace WHERE id = ?").run(listingId);

            db.logTransaction(userId, 'Market Buy Web', `Bought ${listing.quantity}x ${listing.itemName} for ${listing.price}c`);
            db.logTransaction(listing.sellerId, 'Market Sell Web', `Sold ${listing.quantity}x ${listing.itemName} for ${listing.price}c`);

            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // API ENDPOINT: active raid details
    app.get('/api/raid/active', (req, res) => {
        res.json(global.activeRaid || { active: false });
    });

    // API ENDPOINT: craft items
    app.post('/api/craft', (req, res) => {
        const { userId, recipeId } = req.body;
        const RECIPES = {
            iron_sword: { name: 'Iron Sword', mats: { 'Iron Ore': 5, 'Twig': 2 }, reqSkill: 1, skill: 'smithing' },
            oak_bow: { name: 'Oak Bow', mats: { 'Oak Wood': 6, 'Twig': 4 }, reqSkill: 5, skill: 'smithing' },
            magic_staff: { name: 'Magic Staff', mats: { 'Magic Wood': 4, 'Coal': 2 }, reqSkill: 10, skill: 'smithing' },
            gold_sword: { name: 'Gold Sword', mats: { 'Gold Ore': 4, 'Twig': 2 }, reqSkill: 15, skill: 'smithing' },
            wooden_shield: { name: 'Wooden Shield', mats: { 'Pine Wood': 6, 'Twig': 2 }, reqSkill: 1, skill: 'smithing' },
            plated_shield: { name: 'Plated Shield', mats: { 'Iron Ore': 8, 'Pine Wood': 4 }, reqSkill: 8, skill: 'smithing' },
            gold_ring: { name: 'Gold Ring', mats: { 'Gold Ore': 2, 'Diamond': 1 }, reqSkill: 12, skill: 'smithing' },
            
            health_potion: { name: 'Health Potion', mats: { 'Seaweed': 3 }, reqSkill: 1, skill: 'alchemy' },
            mana_potion: { name: 'Mana Potion', mats: { 'Coal': 2, 'Seaweed': 1 }, reqSkill: 3, skill: 'alchemy' }
        };

        try {
            const r = RECIPES[recipeId];
            if (!r) return res.status(400).json({ error: 'Recipe not found' });

            const char = db.getCharacter(userId);
            const userSkillLvl = r.skill === 'smithing' ? (char.skill_smithing || 1) : (char.skill_alchemy || 1);
            if (userSkillLvl < r.reqSkill) {
                return res.status(400).json({ error: `Requires ${r.skill} Level ${r.reqSkill} (You are Level ${userSkillLvl})` });
            }

            const inventory = db.getInventory(userId);
            for (const [matName, neededQty] of Object.entries(r.mats)) {
                const heldItem = inventory.find(i => i.itemName.toLowerCase() === matName.toLowerCase());
                if (!heldItem || heldItem.quantity < neededQty) {
                    return res.status(400).json({ error: `Insufficient materials: Need ${neededQty}x ${matName}` });
                }
            }

            // Deduct materials
            for (const [matName, neededQty] of Object.entries(r.mats)) {
                db.removeItem(userId, matName, neededQty);
            }

            // Grant Item & Skill XP
            db.addItem(userId, r.name, 1);
            db.increaseSkill(userId, r.skill, 1);

            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // --- GEAR ENHANCEMENT ANVIL ENDPOINTS ---
    app.get('/api/enhance/status/:userId/:baseName', (req, res) => {
        const { userId, baseName } = req.params;
        try {
            const char = db.getCharacter(userId);
            if (!char || !char.char_name) return res.status(400).json({ error: 'RPG Character not found' });

            const inventory = db.getInventory(userId);
            let highestLevel = -1;
            let foundItemName = null;

            inventory.forEach(item => {
                if (item.quantity <= 0) return;
                if (item.itemName === baseName) {
                    if (highestLevel < 0) {
                        highestLevel = 0;
                        foundItemName = baseName;
                    }
                } else {
                    const match = item.itemName.match(new RegExp(`^${baseName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\s\\+(\\d+)$`));
                    if (match) {
                        const lvl = parseInt(match[1]);
                        if (lvl > highestLevel) {
                            highestLevel = lvl;
                            foundItemName = item.itemName;
                        }
                    }
                }
            });

            if (highestLevel === -1) {
                return res.json({ success: true, owned: false });
            }

            const nextLvl = highestLevel + 1;
            const nextItemName = `${baseName} +${nextLvl}`;

            const REQS = {
                tier1: { stones: 5, coal: 2, iron: 0, gold: 0, diamonds: 0, rate: 100 },
                tier2: { stones: 10, coal: 5, iron: 1, gold: 0, diamonds: 0, rate: 75 },
                tier3: { stones: 15, coal: 8, iron: 3, gold: 1, diamonds: 0, rate: 50 },
                tier4: { stones: 20, coal: 10, iron: 5, gold: 2, diamonds: 1, rate: 30 }
            };

            const getUpgradeReqs = (lvl) => {
                if (lvl <= 3) return REQS.tier1;
                if (lvl <= 6) return REQS.tier2;
                if (lvl <= 9) return REQS.tier3;
                return REQS.tier4;
            };

            const req = getUpgradeReqs(nextLvl);
            const currentBonus = db.getItemBonus(foundItemName);
            const nextBonus = nextLvl <= 10 ? db.getItemBonus(nextItemName) : null;

            res.json({
                success: true,
                owned: true,
                highestLevel,
                currentItem: foundItemName,
                nextItem: nextLvl <= 10 ? nextItemName : null,
                req,
                currentBonus,
                nextBonus,
                maxed: highestLevel >= 10
            });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/enhance/attempt', (req, res) => {
        const { userId, baseName } = req.body;
        try {
            const char = db.getCharacter(userId);
            if (!char || !char.char_name) return res.status(400).json({ error: 'RPG Character not found' });

            const inventory = db.getInventory(userId);
            let highestLevel = -1;
            let foundItemName = null;

            inventory.forEach(item => {
                if (item.quantity <= 0) return;
                if (item.itemName === baseName) {
                    if (highestLevel < 0) {
                        highestLevel = 0;
                        foundItemName = baseName;
                    }
                } else {
                    const match = item.itemName.match(new RegExp(`^${baseName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\s\\+(\\d+)$`));
                    if (match) {
                        const lvl = parseInt(match[1]);
                        if (lvl > highestLevel) {
                            highestLevel = lvl;
                            foundItemName = item.itemName;
                        }
                    }
                }
            });

            if (highestLevel === -1) {
                return res.status(400).json({ error: `You do not own any version of "${baseName}"` });
            }
            if (highestLevel >= 10) {
                return res.status(400).json({ error: 'Equipment already at maximum enhancement (+10).' });
            }

            const nextLvl = highestLevel + 1;
            const nextItemName = `${baseName} +${nextLvl}`;

            const REQS = {
                tier1: { stones: 5, coal: 2, iron: 0, gold: 0, diamonds: 0, rate: 100 },
                tier2: { stones: 10, coal: 5, iron: 1, gold: 0, diamonds: 0, rate: 75 },
                tier3: { stones: 15, coal: 8, iron: 3, gold: 1, diamonds: 0, rate: 50 },
                tier4: { stones: 20, coal: 10, iron: 5, gold: 2, diamonds: 1, rate: 30 }
            };

            const getUpgradeReqs = (lvl) => {
                if (lvl <= 3) return REQS.tier1;
                if (lvl <= 6) return REQS.tier2;
                if (lvl <= 9) return REQS.tier3;
                return REQS.tier4;
            };

            const req = getUpgradeReqs(nextLvl);

            // Verify materials
            const hasMaterial = (matName, reqQty) => {
                if (reqQty <= 0) return true;
                const item = inventory.find(i => i.itemName.toLowerCase() === matName.toLowerCase());
                return item && item.quantity >= reqQty;
            };

            if (
                !hasMaterial('Stone', req.stones) ||
                !hasMaterial('Coal', req.coal) ||
                !hasMaterial('Iron Ore', req.iron) ||
                !hasMaterial('Gold Ore', req.gold) ||
                !hasMaterial('Diamond', req.diamonds)
            ) {
                return res.status(400).json({ error: 'Insufficient materials for enhancement attempt.' });
            }

            // Deduct materials
            if (req.stones > 0) db.removeItem(userId, 'Stone', req.stones);
            if (req.coal > 0) db.removeItem(userId, 'Coal', req.coal);
            if (req.iron > 0) db.removeItem(userId, 'Iron Ore', req.iron);
            if (req.gold > 0) db.removeItem(userId, 'Gold Ore', req.gold);
            if (req.diamonds > 0) db.removeItem(userId, 'Diamond', req.diamonds);

            // Roll Success
            const roll = Math.random() * 100;
            const isSuccess = roll <= req.rate;

            if (isSuccess) {
                db.removeItem(userId, foundItemName, 1);
                db.addItem(userId, nextItemName, 1);
                db.logTransaction(userId, 'Gear Enhance Success', `Upgraded ${foundItemName} to +${nextLvl} (Web)`);
                res.json({
                    success: true,
                    result: 'success',
                    nextLevel: nextLvl,
                    newItem: nextItemName
                });
            } else {
                db.removeItem(userId, foundItemName, 1);
                let penaltyItem = foundItemName;
                let penaltyText = '';

                if (nextLvl <= 3) {
                    db.addItem(userId, foundItemName, 1);
                    penaltyText = 'No penalty applied.';
                } else if (nextLvl === 10) {
                    penaltyItem = `${baseName} +5`;
                    db.addItem(userId, penaltyItem, 1);
                    penaltyText = `💥 CRITICAL DOWNGRADE! The item collapsed and dropped back to Lvl +5!`;
                } else {
                    const downgradeLvl = highestLevel - 1;
                    penaltyItem = downgradeLvl === 0 ? baseName : `${baseName} +${downgradeLvl}`;
                    db.addItem(userId, penaltyItem, 1);
                    penaltyText = `⚠️ Downgraded: The item lost structural integrity and fell to ${penaltyItem}.`;
                }

                db.logTransaction(userId, 'Gear Enhance Fail', `Failed upgrading ${foundItemName} to +${nextLvl} (Web)`);
                res.json({
                    success: true,
                    result: 'fail',
                    nextLevel: nextLvl,
                    newItem: penaltyItem,
                    penaltyText
                });
            }
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // --- COOK ITEMS ENDPOINT ---

    // API ENDPOINT: cook items
    app.post('/api/cook', (req, res) => {
        const { userId, recipeId, heatLevel } = req.body;
        const COOK_RECIPES = {
            seared_steak: { name: 'Seared Steak', mats: { 'Raw Meat': 2 }, reqSkill: 1, idealHeat: 'High' },
            baked_salmon: { name: 'Baked Salmon', mats: { 'Raw Fish': 2 }, reqSkill: 3, idealHeat: 'Low' },
            gourmet_feast: { name: 'Gourmet Feast', mats: { 'Raw Meat': 1, 'Raw Fish': 1, 'Wheat': 1 }, reqSkill: 8, idealHeat: 'Medium' }
        };

        try {
            const r = COOK_RECIPES[recipeId];
            if (!r) return res.status(400).json({ error: 'Recipe not found' });

            const char = db.getCharacter(userId);
            const userCookingLvl = char.skill_cooking || 1;
            if (userCookingLvl < r.reqSkill) {
                return res.status(400).json({ error: `Requires Cooking Level ${r.reqSkill} (You are Level ${userCookingLvl})` });
            }

            const inventory = db.getInventory(userId);
            for (const [matName, neededQty] of Object.entries(r.mats)) {
                const heldItem = inventory.find(i => i.itemName.toLowerCase() === matName.toLowerCase());
                if (!heldItem || heldItem.quantity < neededQty) {
                    return res.status(400).json({ error: `Insufficient materials: Need ${neededQty}x ${matName}` });
                }
            }

            // Deduct materials
            for (const [matName, neededQty] of Object.entries(r.mats)) {
                db.removeItem(userId, matName, neededQty);
            }

            // Check heat
            if (heatLevel !== r.idealHeat) {
                db.logTransaction(userId, 'Cooking Burn Web', `Burnt ${r.name} due to incorrect heat (${heatLevel})`);
                return res.json({ success: false, burnt: true, error: `Oh no! The heat was set to ${heatLevel}, but this dish requires ${r.idealHeat} heat! The food burnt to charcoal.` });
            }

            // Success: Grant Item & Skill XP
            db.addItem(userId, r.name, 1);
            const newLvl = db.increaseSkill(userId, 'cooking', 1);
            db.logTransaction(userId, 'Cooking Success Web', `Successfully cooked ${r.name} on stove!`);

            res.json({ success: true, newLvl });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // API ENDPOINT: buy stock shares
    app.post('/api/stocks/buy', (req, res) => {
        const { userId, ticker, shares } = req.body;
        try {
            const buyShares = parseInt(shares);
            if (isNaN(buyShares) || buyShares <= 0) return res.status(400).json({ error: 'Shares must be positive' });
            const stock = db.getStock(ticker);
            if (!stock) return res.status(404).json({ error: 'Stock not found' });
            const cost = parseFloat((buyShares * stock.price).toFixed(2));
            const balance = db.getBalance(userId, 'global');
            if (balance < cost) return res.status(400).json({ error: 'Insufficient cherries' });
            db.deductCoins(userId, 'global', cost);
            db.buyShares(userId, ticker, buyShares);
            db.logTransaction(userId, 'Stock Buy Web', `Bought ${buyShares.toLocaleString()} shares of ${ticker} for 🍒 ${cost}`);
            res.json({ success: true, balance: db.getBalance(userId, 'global'), sharesOwned: db.getShares(userId, ticker) });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // API ENDPOINT: sell stock shares
    app.post('/api/stocks/sell', (req, res) => {
        const { userId, ticker, shares } = req.body;
        try {
            const sellShares = parseInt(shares);
            if (isNaN(sellShares) || sellShares <= 0) return res.status(400).json({ error: 'Shares must be positive' });
            const stock = db.getStock(ticker);
            if (!stock) return res.status(404).json({ error: 'Stock not found' });
            const owned = db.getShares(userId, ticker);
            if (owned < sellShares) return res.status(400).json({ error: `You only own ${owned} shares` });
            const revenue = parseFloat((sellShares * stock.price).toFixed(2));
            db.sellShares(userId, ticker, sellShares);
            db.addCoins(userId, 'global', revenue);
            db.logTransaction(userId, 'Stock Sell Web', `Sold ${sellShares.toLocaleString()} shares of ${ticker} for 🍒 ${revenue}`);
            res.json({ success: true, balance: db.getBalance(userId, 'global'), sharesOwned: db.getShares(userId, ticker) });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // API ENDPOINT: user stock portfolio
    app.get('/api/stocks/portfolio/:userId', (req, res) => {
        const { userId } = req.params;
        try {
            const assets = db.getPlayerAssets(userId);
            const portfolio = assets.investments.map(inv => {
                const stock = db.getStock(inv.stockTicker);
                return {
                    ticker: inv.stockTicker,
                    shares: inv.shares,
                    companyName: stock ? stock.companyName : 'Unknown',
                    price: stock ? stock.price : 0,
                    totalValue: stock ? parseFloat((inv.shares * stock.price).toFixed(2)) : 0
                };
            });
            res.json(portfolio);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    const activeDungeonSessions = new Map();

    // API ENDPOINT: enter dungeon and start visual turn-based combat session
    app.post('/api/dungeon/start', (req, res) => {
        const { userId, dungeonId } = req.body;
        try {
            if (isJailed(userId)) {
                return res.status(403).json({ error: '❌ Combat Blocked: You are currently JAILED! Release yourself by waiting or paying bail.' });
            }
            const char = db.getCharacter(userId);
            if (!char || !char.char_name) {
                return res.status(400).json({ error: 'You must create an RPG character first!' });
            }

            const dungeons = {
                goblin: { name: 'Goblin Forest', reqLevel: 1, monsterName: 'Goblin Scout', hp: 60, dmg: 8, exp: 40, loot: ['Twig', 'Seaweed', 'Coal'], lootQty: 2 },
                mines: { name: 'Deep Coal Mines', reqLevel: 3, monsterName: 'Iron Golem', hp: 120, dmg: 14, exp: 90, loot: ['Iron Ore', 'Coal', 'Seaweed'], lootQty: 3 },
                magma: { name: 'Magma Caverns', reqLevel: 6, monsterName: 'Flame Elemental', hp: 200, dmg: 22, exp: 180, loot: ['Gold Ore', 'Diamond', 'Coal'], lootQty: 3 }
            };

            const dung = dungeons[dungeonId];
            if (!dung) return res.status(404).json({ error: 'Dungeon not found' });
            if (char.level < dung.reqLevel) {
                return res.status(400).json({ error: `Requires Level ${dung.reqLevel}. You are Level ${char.level}.` });
            }
            if (char.hp <= 10) {
                return res.status(400).json({ error: 'Your HP is too low! Heal up first.' });
            }

            const session = {
                dungeonId,
                name: dung.name,
                monsterName: dung.monsterName,
                monsterMaxHp: dung.hp,
                monsterHp: dung.hp,
                monsterDmg: dung.dmg,
                playerHp: char.hp,
                playerMana: char.mana,
                playerMaxHp: char.max_hp || 100,
                playerMaxMana: char.max_mana || 50,
                round: 1,
                log: [`⚔️ Entered **${dung.name}** and encountered **${dung.monsterName}**!`],
                defending: false,
                finished: false
            };

            activeDungeonSessions.set(userId, session);
            res.json({ success: true, session });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // API ENDPOINT: run a combat turn (strike, spell, or defend)
    app.post('/api/dungeon/turn', (req, res) => {
        const { userId, action } = req.body;
        try {
            const session = activeDungeonSessions.get(userId);
            if (!session) return res.status(400).json({ error: 'No active dungeon combat session found.' });

            if (session.finished) {
                return res.status(400).json({ error: 'Dungeon combat already completed.' });
            }

            const char = db.getCharacter(userId);
            const userStr = char.stat_str || 10;
            const userDef = char.stat_def || 10;
            const userDex = char.stat_dex || 10;
            const userInt = char.stat_int || 10;
            const userLuc = char.stat_luc || 10;

            let logLines = [];
            logLines.push(`**[Round ${session.round}]**`);

            // 1. Resolve player action
            let pDmg = 0;
            if (action === 'strike') {
                const hitChance = Math.min(95, 70 + (userDex - 10) * 2);
                if (Math.random() * 100 <= hitChance) {
                    const critChance = Math.min(40, 5 + (userLuc - 10));
                    const isCrit = Math.random() * 100 <= critChance;
                    pDmg = Math.floor(5 + userStr * 0.8 + (Math.random() * 5));
                    if (char.equipped_weapon) pDmg += 5;
                    if (isCrit) {
                        pDmg = Math.floor(pDmg * 1.8);
                        logLines.push(`💥 **CRITICAL HIT!** You strike the ${session.monsterName} for **${pDmg}** damage!`);
                    } else {
                        logLines.push(`🤺 You strike the ${session.monsterName} for **${pDmg}** damage.`);
                    }
                } else {
                    logLines.push(`💨 You swung and missed the ${session.monsterName}!`);
                }
                session.monsterHp = Math.max(0, session.monsterHp - pDmg);
            } 
            else if (action === 'spell') {
                if (session.playerMana < 15) {
                    return res.status(400).json({ error: 'Not enough Mana! Spells cost 15 MP.' });
                }
                session.playerMana -= 15;
                pDmg = Math.floor(15 + userInt * 1.2 + (Math.random() * 6));
                logLines.push(`🔮 You cast Magic Bolt, dealing **${pDmg}** magic damage to the ${session.monsterName}!`);
                session.monsterHp = Math.max(0, session.monsterHp - pDmg);
                db.increaseSkill(userId, 'magic', 1);
            } 
            else if (action === 'defend') {
                session.defending = true;
                logLines.push(`🛡️ You brace yourself and raise your guard! (Blocks 50% damage next round)`);
            }

            // Check if monster died
            if (session.monsterHp <= 0) {
                session.finished = true;
                session.victory = true;
                logLines.push(`\n🏆 **VICTORY!** The ${session.monsterName} has been defeated!`);
                
                // Roll rewards
                const dungeons = {
                    goblin: { name: 'Goblin Forest', hp: 60, dmg: 8, exp: 40, loot: ['Twig', 'Seaweed', 'Coal'], lootQty: 2 },
                    mines: { name: 'Deep Coal Mines', hp: 120, dmg: 14, exp: 90, loot: ['Iron Ore', 'Coal', 'Seaweed'], lootQty: 3 },
                    magma: { name: 'Magma Caverns', hp: 200, dmg: 22, exp: 180, loot: ['Gold Ore', 'Diamond', 'Coal'], lootQty: 3 }
                };
                const dung = dungeons[session.dungeonId];
                db.increaseSkill(userId, 'combat', 1);
                const xpReward = dung.exp;
                const xpResult = db.addXp(userId, 'global', xpReward);
                logLines.push(`✨ Gained **${xpReward} XP**!`);
                if (xpResult && xpResult.leveledUp) {
                    logLines.push(`🌸 **LEVEL UP!** You blossomed to **Level ${xpResult.newLevel}**! 🍒`);
                }

                const receivedLoot = [];
                for (let i = 0; i < dung.lootQty; i++) {
                    const item = dung.loot[Math.floor(Math.random() * dung.loot.length)];
                    db.addItem(userId, item, 1);
                    receivedLoot.push(item);
                }
                logLines.push(`🎁 Found Loot: **${receivedLoot.join(', ')}**!`);

                db.prepare("UPDATE users SET hp = ?, mana = ? WHERE userId = ?").run(session.playerHp, session.playerMana, userId);
                activeDungeonSessions.delete(userId);

                session.log = [...session.log, ...logLines];
                return res.json({
                    success: true,
                    finished: true,
                    status: 'victory',
                    xpEarned: xpReward,
                    loot: receivedLoot,
                    session,
                    roundLogs: logLines.join('\n')
                });
            }

            // 2. Resolve monster counter-attack
            const blockChance = Math.min(50, 5 + (userDef - 10) * 1.5);
            if (Math.random() * 100 <= blockChance) {
                logLines.push(`🛡️ You blocked the ${session.monsterName}'s attack!`);
            } else {
                let monsterDmg = Math.floor(session.monsterDmg - (userDef * 0.3) + (Math.random() * 4));
                if (session.defending) {
                    monsterDmg = Math.floor(monsterDmg * 0.5);
                }
                if (monsterDmg < 2) monsterDmg = 2;
                logLines.push(`👹 The ${session.monsterName} hits you for **${monsterDmg}** damage.`);
                session.playerHp = Math.max(0, session.playerHp - monsterDmg);
            }

            // Reset defending status
            session.defending = false;

            // Check if player died
            if (session.playerHp <= 0) {
                session.finished = true;
                session.victory = false;
                logLines.push(`\n💀 **DEFEAT!** You were knocked out by the ${session.monsterName}...`);
                
                db.prepare("UPDATE users SET hp = 5, mana = ? WHERE userId = ?").run(session.playerMana, userId);
                activeDungeonSessions.delete(userId);

                session.log = [...session.log, ...logLines];
                return res.json({
                    success: true,
                    finished: true,
                    status: 'defeat',
                    session,
                    roundLogs: logLines.join('\n')
                });
            }

            // Increment round and return turn results
            session.round++;
            session.log = [...session.log, ...logLines];
            activeDungeonSessions.set(userId, session);

            res.json({
                success: true,
                finished: false,
                session,
                roundLogs: logLines.join('\n')
            });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.get('/api/dungeon/session/:userId', (req, res) => {
        const { userId } = req.params;
        try {
            const session = activeDungeonSessions.get(userId);
            res.json({ success: true, session: session || null });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // API ENDPOINT: consume potion to restore stats
    app.post('/api/character/heal', (req, res) => {
        const { userId, potionType } = req.body;
        try {
            const char = db.getCharacter(userId);
            if (!char || !char.char_name) return res.status(400).json({ error: 'Character not found' });
            
            let potionName = '';
            let restoreHp = 0;
            let restoreMp = 0;

            if (potionType === 'health_potion') {
                potionName = 'Health Potion';
                restoreHp = 50;
            } else if (potionType === 'mana_potion') {
                potionName = 'Mana Potion';
                restoreMp = 40;
            } else {
                return res.status(400).json({ error: 'Invalid potion type' });
            }

            const qty = db.getItemQuantity(userId, potionName);
            if (qty <= 0) return res.status(400).json({ error: `You do not own any ${potionName}s!` });

            db.removeItem(userId, potionName, 1);
            const newStats = db.restoreStats(userId, restoreHp, restoreMp);
            db.logTransaction(userId, 'Web Potion Use', `Consumed 1x ${potionName}`);

            res.json({
                success: true,
                hp: newStats.hp,
                mana: newStats.mana,
                inventory: db.getInventory(userId)
            });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // API ENDPOINT: list item for sale in marketplace
    app.post('/api/marketplace/list', (req, res) => {
        const { userId, itemName, quantity, price } = req.body;
        try {
            const qty = parseInt(quantity);
            const prc = parseInt(price);

            if (isNaN(qty) || qty <= 0) return res.status(400).json({ error: 'Quantity must be positive' });
            if (isNaN(prc) || prc <= 0) return res.status(400).json({ error: 'Price must be positive' });

            const inventory = db.getInventory(userId);
            const heldItem = inventory.find(i => i.itemName.toLowerCase() === itemName.toLowerCase());
            if (!heldItem || heldItem.quantity < qty) {
                return res.status(400).json({ error: `Insufficient inventory: You hold ${heldItem ? heldItem.quantity : 0}x ${itemName}` });
            }

            db.removeItem(userId, itemName, qty);
            db.addMarketListing(userId, itemName, qty, prc);
            db.logTransaction(userId, 'Market Sell List Web', `Listed ${qty}x ${itemName} for 🍒 ${prc}`);

            res.json({ success: true, inventory: db.getInventory(userId) });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // API ENDPOINT: spawn item for user (admin)
    app.post('/api/admin/spawn-item', async (req, res) => {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
        
        const isAdmin = await isUserAdmin(authHeader);
        if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

        const { targetUserId, itemName, quantity } = req.body;
        const qty = parseInt(quantity);

        if (!targetUserId || !itemName || isNaN(qty) || qty <= 0) {
            return res.status(400).json({ error: 'Invalid spawn parameters' });
        }

        try {
            const char = db.getCharacter(targetUserId);
            if (!char || !char.char_name) {
                return res.status(400).json({ error: 'Target user does not have an RPG character' });
            }

            db.addItem(targetUserId, itemName, qty);
            db.logTransaction(targetUserId, 'Admin Spawn Item', `Spawned ${qty}x ${itemName} by admin ID ${authHeader}`);
            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // API ENDPOINT: set guild notice announcement (admin)
    app.post('/api/admin/set-announcement', async (req, res) => {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
        
        const isAdmin = await isUserAdmin(authHeader);
        if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

        const { title, content } = req.body;
        if (!title || !content) return res.status(400).json({ error: 'Title and content are required' });

        try {
            db.setSetting('guild_notice', { title, content, timestamp: Date.now() });
            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // API ENDPOINT: get active guild details
    app.get('/api/guild/my/:userId', (req, res) => {
        const { userId } = req.params;
        try {
            const guild = db.getPlayerGuild(userId);
            if (!guild) {
                return res.json({ success: true, inGuild: false });
            }
            const members = db.getGuildMembers(guild.id);
            const resolvedMembers = members.map(m => {
                const char = db.getCharacter(m.userId);
                return {
                    userId: m.userId,
                    username: char ? char.char_name : m.userId,
                    role: m.role,
                    contribution: m.contribution,
                    joinedAt: m.joined_at
                };
            });
            res.json({
                success: true,
                inGuild: true,
                guild: {
                    id: guild.id,
                    name: guild.name,
                    ownerId: guild.ownerId,
                    bankCoins: guild.bank_coins,
                    level: guild.level,
                    xp: guild.xp,
                    perkXpBoost: guild.perk_xp_boost,
                    perkShopDiscount: guild.perk_shop_discount,
                    createdAt: guild.created_at,
                    memberRole: guild.memberRole,
                    contribution: guild.contribution
                },
                members: resolvedMembers
            });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // API ENDPOINT: deposit coins to guild treasury
    app.post('/api/guild/deposit', (req, res) => {
        const { userId, amount } = req.body;
        if (!userId || !amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid parameters' });
        }
        try {
            const guild = db.getPlayerGuild(userId);
            if (!guild) {
                return res.status(400).json({ error: 'You are not in a guild' });
            }
            
            const char = db.getCharacter(userId);
            if (!char || char.coins < amount) {
                return res.status(400).json({ error: 'Insufficient cherries in wallet' });
            }

            db.depositGuildBank(userId, amount, 'web');
            db.logTransaction(userId, 'Guild Bank Deposit', `Deposited 🍒 ${amount.toLocaleString()} into guild ${guild.name} bank`);
            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // API ENDPOINT: upgrade guild perks
    app.post('/api/guild/upgrade', (req, res) => {
        const { userId, perkType } = req.body;
        if (!userId || !perkType) {
            return res.status(400).json({ error: 'Invalid parameters' });
        }
        try {
            const guild = db.getPlayerGuild(userId);
            if (!guild) {
                return res.status(400).json({ error: 'You are not in a guild' });
            }
            if (guild.ownerId !== userId) {
                return res.status(403).json({ error: 'Only the guild leader can upgrade perks' });
            }

            const perkCol = perkType === 'xp_boost' ? 'perk_xp_boost' : perkType === 'shop_discount' ? 'perk_shop_discount' : null;
            if (!perkCol) {
                return res.status(400).json({ error: 'Invalid perk type' });
            }

            const currentVal = guild[perkCol] || 0;
            const cost = (currentVal + 1) * 2000;

            if (guild.bank_coins < cost) {
                return res.status(400).json({ error: `Insufficient guild bank balance. Upgrade requires 🍒 ${cost.toLocaleString()} cherries.` });
            }

            db.upgradeGuildPerk(guild.id, perkCol, cost);
            db.logTransaction(userId, 'Guild Perk Upgrade', `Upgraded guild perk ${perkType} to level ${currentVal + 1} for 🍒 ${cost.toLocaleString()}`);
            res.json({ success: true, newLevel: currentVal + 1 });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // API ENDPOINT: submit raid turn actions
    app.post('/api/raid/action', async (req, res) => {
        const { userId, action } = req.body;
        if (!userId || !action) {
            return res.status(400).json({ error: 'Invalid parameters' });
        }
        try {
            const activeRaid = global.activeRaid;
            const activeRaidInstance = global.activeRaidInstance;
            if (!activeRaid || !activeRaid.active || !activeRaidInstance) {
                return res.status(400).json({ error: 'No active guild raid in progress right now' });
            }

            const inParty = activeRaidInstance.party.some(p => p.userId === userId);
            if (!inParty) {
                return res.status(400).json({ error: 'You are not a participant in this boss raid party' });
            }

            const currentTurnPlayer = activeRaidInstance.party[activeRaidInstance.activeIdx];
            if (!currentTurnPlayer || currentTurnPlayer.userId !== userId) {
                return res.status(400).json({ error: 'It is not your turn in the rotation' });
            }

            const customId = action === 'attack' ? 'raid_action_attack' :
                             action === 'spell' ? 'raid_action_spell' :
                             action === 'defend' ? 'raid_action_defend' :
                             action === 'heal' ? 'raid_action_heal' : null;

            if (!customId) {
                return res.status(400).json({ error: 'Invalid combat action' });
            }

            await activeRaidInstance.resolveWebTurn(userId, customId);
            res.json({ success: true, activeRaid: global.activeRaid });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // --- PET CARE ENDPOINTS ---
    app.get('/api/pet/:userId', (req, res) => {
        const { userId } = req.params;
        try {
            const pet = db.getPet(userId);
            res.json({ success: true, pet });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/pet/adopt', (req, res) => {
        const { userId, petType, petName } = req.body;
        if (!userId || !petType || !petName) {
            return res.status(400).json({ error: 'Missing parameters' });
        }
        try {
            const existing = db.getPet(userId);
            if (existing) {
                return res.status(400).json({ error: 'You already own a pet' });
            }
            db.adoptPet(userId, petType, petName);
            db.logTransaction(userId, 'Adopt Pet Web', `Adopted a ${petType} named ${petName}`);
            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/pet/feed', (req, res) => {
        const { userId, itemName } = req.body;
        if (!userId || !itemName) {
            return res.status(400).json({ error: 'Missing parameters' });
        }
        try {
            const pet = db.getPet(userId);
            if (!pet) return res.status(400).json({ error: 'You do not own a pet' });

            const inventory = db.prepare("SELECT quantity FROM inventory WHERE userId = ? AND itemName = ?").get(userId, itemName);
            if (!inventory || inventory.quantity <= 0) {
                return res.status(400).json({ error: `You do not have any ${itemName} in your inventory` });
            }

            db.prepare("UPDATE inventory SET quantity = quantity - 1 WHERE userId = ? AND itemName = ?").run(userId, itemName);
            const hungerVal = itemName === 'Apple' ? 15 : 10;
            const affVal = itemName === 'Apple' ? 5 : 10;
            db.updatePetStats(pet.id, hungerVal, affVal);
            const xpOutcome = db.addPetXp(pet.id, 20);

            db.logTransaction(userId, 'Feed Pet Web', `Fed Apple/Berry to pet ${pet.petName}`);
            res.json({ success: true, xpOutcome });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/pet/play', (req, res) => {
        const { userId } = req.body;
        try {
            const pet = db.getPet(userId);
            if (!pet) return res.status(400).json({ error: 'You do not own a pet' });

            const char = db.getCharacter(userId);
            if (!char || char.mana < 15) {
                return res.status(400).json({ error: 'Insufficient Mana pool. Requires 15 MP.' });
            }

            db.prepare("UPDATE users SET mana = mana - 15 WHERE userId = ?").run(userId);
            db.updatePetStats(pet.id, -10, 20);
            const xpOutcome = db.addPetXp(pet.id, 15);

            res.json({ success: true, xpOutcome });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/pet/train', (req, res) => {
        const { userId } = req.body;
        try {
            const pet = db.getPet(userId);
            if (!pet) return res.status(400).json({ error: 'You do not own a pet' });

            const char = db.getCharacter(userId);
            if (!char || char.coins < 150) {
                return res.status(400).json({ error: 'Insufficient cherries in wallet. Requires 150 cherries.' });
            }

            db.deductCoins(userId, 'web', 150);
            const xpOutcome = db.addPetXp(pet.id, 50);

            db.logTransaction(userId, 'Train Pet Web', `Spent 150 cherries training pet ${pet.petName}`);
            res.json({ success: true, xpOutcome });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/pet/adventure/start', (req, res) => {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: 'Missing parameters' });
        try {
            const pet = db.getPet(userId);
            if (!pet) return res.status(400).json({ error: 'You do not own a pet' });

            if (pet.status !== 'Idle') {
                return res.status(400).json({ error: `Companion is currently busy: ${pet.status}` });
            }

            if (pet.hunger < 20) {
                return res.status(400).json({ error: `Companion is too hungry to adventure: ${pet.hunger}%` });
            }

            // Deduct 20 hunger and 10 affection
            db.updatePetStats(pet.id, -20, -10);
            db.updatePetStatus(pet.id, 'Adventure', Date.now());
            db.logTransaction(userId, 'Pet Adventure Web', `Dispatched pet ${pet.petName} on adventure`);

            const updatedPet = db.getPet(userId);
            res.json({ success: true, pet: updatedPet });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/pet/adventure/claim', (req, res) => {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: 'Missing parameters' });
        try {
            const pet = db.getPet(userId);
            if (!pet) return res.status(400).json({ error: 'You do not own a pet' });

            if (pet.status !== 'Adventure') {
                return res.status(400).json({ error: 'Companion is not on an adventure' });
            }

            const now = Date.now();
            const duration = 60 * 1000; // 1 minute
            const elapsed = now - pet.lastAction;

            if (elapsed < duration) {
                const remaining = Math.ceil((duration - elapsed) / 1000);
                return res.status(400).json({ error: `Companion is still adventuring. Remaining: ${remaining}s` });
            }

            // Resolve adventure
            db.updatePetStatus(pet.id, 'Idle', 0);
            db.incrementQuestProgress(userId, 1);

            const xpGained = Math.floor(Math.random() * 51) + 50; // 50 to 100 XP
            const xpResult = db.addPetXp(pet.id, xpGained);

            // Scavenge loot
            const possibleLoot = [
                { name: 'Raw Meat', qty: 1 },
                { name: 'Raw Fish', qty: 1 },
                { name: 'Corn Seed', qty: 1 },
                { name: 'Carrot Seed', qty: 1 },
                { name: 'Rice Seed', qty: 1 },
                { name: 'Tomato Seed', qty: 1 },
                { name: 'Wood', qty: 1 }
            ];

            const lootDrops = [];
            const dropCount = Math.floor(Math.random() * 2) + 2; // 2-3 items
            for (let k = 0; k < dropCount; k++) {
                const drop = possibleLoot[Math.floor(Math.random() * possibleLoot.length)];
                lootDrops.push(drop);
                db.addItem(userId, drop.name, drop.qty);
            }

            db.logTransaction(userId, 'Pet Adventure Return Web', `Pet ${pet.petName} returned with rewards`);
            
            const updatedPet = db.getPet(userId);
            res.json({
                success: true,
                xpGained,
                leveledUp: xpResult.leveledUp,
                newLevel: xpResult.newLevel,
                loot: lootDrops,
                pet: updatedPet
            });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // --- BUSINESS TYCOON ENDPOINTS ---
    app.get('/api/business/:userId', (req, res) => {
        const { userId } = req.params;
        try {
            const list = db.getUserBusinesses(userId);
            res.json({ success: true, list });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/business/buy', (req, res) => {
        const { userId, businessType } = req.body;
        if (!userId || !businessType) return res.status(400).json({ error: 'Missing parameters' });
        
        const COSTS = { Tavern: 5000, Blacksmith: 12000, Apothecary: 25000 };
        const cost = COSTS[businessType];
        if (!cost) return res.status(400).json({ error: 'Invalid business type' });

        try {
            const list = db.getUserBusinesses(userId);
            if (list.some(b => b.businessType === businessType)) {
                return res.status(400).json({ error: `You already own a ${businessType} business` });
            }

            const char = db.getCharacter(userId);
            if (!char || char.coins < cost) {
                return res.status(400).json({ error: `Insufficient cherries. Requires 🍒 ${cost.toLocaleString()}` });
            }

            db.deductCoins(userId, 'web', cost);
            db.buyBusiness(userId, businessType, Date.now());
            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/business/upgrade', (req, res) => {
        const { userId, businessType } = req.body;
        try {
            const list = db.getUserBusinesses(userId);
            const biz = list.find(b => b.businessType === businessType);
            if (!biz) return res.status(400).json({ error: `You do not own a ${businessType} business` });

            const cost = biz.level * 5000;
            const char = db.getCharacter(userId);
            if (!char || char.coins < cost) {
                return res.status(400).json({ error: `Insufficient cherries. Requires 🍒 ${cost.toLocaleString()}` });
            }

            db.deductCoins(userId, 'web', cost);
            db.upgradeBusiness(userId, businessType);
            db.logTransaction(userId, 'Business Upgrade Web', `Upgraded ${businessType} to Lvl ${biz.level + 1}`);
            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/business/collect', (req, res) => {
        const { userId, businessType } = req.body;
        try {
            if (isJailed(userId)) {
                return res.status(403).json({ error: '❌ Collection Blocked: You are currently JAILED! Release yourself by waiting or paying bail.' });
            }
            const list = db.getUserBusinesses(userId);
            const biz = list.find(b => b.businessType === businessType);
            if (!biz) return res.status(400).json({ error: `You do not own a ${businessType} business` });

            const now = Date.now();
            const elapsedHours = (now - biz.lastCollected) / (3600 * 1000);
            if (elapsedHours < 0.05) {
                return res.status(400).json({ error: 'Revenues accumulate hourly. Please wait a few minutes.' });
            }

            const rates = { Tavern: 150, Blacksmith: 350, Apothecary: 800 };
            const baseRate = rates[businessType] || 100;
            const totalRevenue = Math.floor(elapsedHours * baseRate * biz.level);

            if (totalRevenue <= 0) {
                return res.status(400).json({ error: 'No revenues accumulated yet.' });
            }

            db.collectBusinessRevenue(userId, businessType, totalRevenue, now, 'web');
            db.logTransaction(userId, 'Business Collect Web', `Collected 🍒 ${totalRevenue.toLocaleString()} from ${businessType}`);
            res.json({ success: true, revenueCollected: totalRevenue });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // --- DELIVERY LOGISTICS ENDPOINTS ---
    app.get('/api/delivery/:userId', (req, res) => {
        const { userId } = req.params;
        try {
            const company = db.getDeliveryCompany(userId);
            const activeJobs = db.getActiveDeliveryJobs(userId);
            res.json({ success: true, company, activeJobs });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/delivery/upgrade-vehicle', (req, res) => {
        const { userId } = req.body;
        try {
            const company = db.getDeliveryCompany(userId);
            let nextVehicle = '';
            let cost = 0;

            if (company.vehicle === 'Bicycle') {
                nextVehicle = 'Motorcycle';
                cost = 3000;
            } else if (company.vehicle === 'Motorcycle') {
                nextVehicle = 'Delivery Truck';
                cost = 10000;
            } else {
                return res.status(400).json({ error: 'Your delivery vehicle is already at maximum upgrade tier' });
            }

            const char = db.getCharacter(userId);
            if (!char || char.coins < cost) {
                return res.status(400).json({ error: `Insufficient cherries. Requires 🍒 ${cost.toLocaleString()}` });
            }

            db.upgradeVehicle(userId, nextVehicle, cost, 'web');
            db.logTransaction(userId, 'Vehicle Upgrade Web', `Upgraded logistics transport to ${nextVehicle}`);
            res.json({ success: true, vehicle: nextVehicle });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/delivery/hire-worker', (req, res) => {
        const { userId } = req.body;
        try {
            const cost = 2000;
            const char = db.getCharacter(userId);
            if (!char || char.coins < cost) {
                return res.status(400).json({ error: `Insufficient cherries. Requires 🍒 ${cost.toLocaleString()}` });
            }

            db.hireWorker(userId, cost, 'web');
            db.logTransaction(userId, 'Hire Worker Web', 'Hired a new delivery worker dispatch');
            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/delivery/collect-passive', (req, res) => {
        const { userId } = req.body;
        try {
            const company = db.getDeliveryCompany(userId);
            if (company.workers <= 0) {
                return res.status(400).json({ error: 'You do not have any hired workers' });
            }

            const now = Date.now();
            const elapsedHours = (now - company.lastAutomatedClaim) / (3600 * 1000);
            const reward = Math.floor(elapsedHours * company.workers * 50);

            if (reward <= 0) {
                return res.status(400).json({ error: 'No passive revenues accrued yet.' });
            }

            db.collectAutomatedDelivery(userId, reward, now, 'web');
            db.logTransaction(userId, 'Passive Logistics Web', `Claimed worker dispatch revenues: 🍒 ${reward.toLocaleString()}`);
            res.json({ success: true, rewardClaimed: reward });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/delivery/start-job', (req, res) => {
        const { userId, jobName } = req.body;
        if (!userId || !jobName) return res.status(400).json({ error: 'Missing parameters' });

        const JOBS = {
            'Produce Run': { duration: 120 * 1000, payout: 250 },
            'Express Run': { duration: 300 * 1000, payout: 700 },
            'Cross-Country Haul': { duration: 900 * 1000, payout: 2500 }
        };
        const jobConfig = JOBS[jobName];
        if (!jobConfig) return res.status(400).json({ error: 'Invalid delivery job' });

        try {
            const company = db.getDeliveryCompany(userId);
            const active = db.getActiveDeliveryJobs(userId);
            const maxParallel = company.vehicle === 'Bicycle' ? 1 : company.vehicle === 'Motorcycle' ? 2 : 3;

            if (active.length >= maxParallel) {
                return res.status(400).json({ error: `Maximum active runs reached for your vehicle: ${company.vehicle} allows max ${maxParallel} parallel job(s)` });
            }

            const endsAt = Date.now() + jobConfig.duration;
            db.startDeliveryJob(userId, jobName, jobConfig.payout, endsAt);
            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/delivery/claim-job', (req, res) => {
        const { userId, jobId } = req.body;
        try {
            const active = db.getActiveDeliveryJobs(userId);
            const target = active.find(j => j.id === jobId);
            if (!target) return res.status(400).json({ error: 'Job not found' });

            if (Date.now() < target.endsAt) {
                return res.status(400).json({ error: 'Delivery run is still in transit' });
            }

            db.completeDeliveryJob(jobId, userId, target.payout, 'web');
            db.logTransaction(userId, 'Delivery Job Claim Web', `Delivered cargo job '${target.jobName}' for 🍒 ${target.payout.toLocaleString()}`);
            res.json({ success: true, payout: target.payout });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // --- PREHISTORIC DINO PARK ENDPOINTS ---
    app.get('/api/dino/:userId', (req, res) => {
        const { userId } = req.params;
        try {
            const park = db.getDinoPark(userId);
            res.json({ success: true, park });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/dino/clone', (req, res) => {
        const { userId } = req.body;
        try {
            const park = db.getDinoPark(userId);
            const cost = (park.dinos + 1) * 3000;
            const char = db.getCharacter(userId);
            if (!char || char.coins < cost) {
                return res.status(400).json({ error: `Insufficient cherries. Requires 🍒 ${cost.toLocaleString()}` });
            }

            db.cloneDinosaur(userId, cost, 'web');
            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/dino/upgrade-security', (req, res) => {
        const { userId } = req.body;
        try {
            const park = db.getDinoPark(userId);
            const cost = park.securityLevel * 4000;
            const char = db.getCharacter(userId);
            if (!char || char.coins < cost) {
                return res.status(400).json({ error: `Insufficient cherries. Requires 🍒 ${cost.toLocaleString()}` });
            }

            db.upgradeSecurity(userId, cost, 'web');
            db.logTransaction(userId, 'Security Upgrade Web', `Upgraded dino park security grid to Lvl ${park.securityLevel + 1}`);
            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/dino/collect', (req, res) => {
        const { userId } = req.body;
        try {
            const park = db.getDinoPark(userId);
            const now = Date.now();
            const elapsedHours = (now - park.lastCollected) / (3600 * 1000);
            if (elapsedHours < 0.05) {
                return res.status(400).json({ error: 'Ticket revenues accumulate hourly. Please wait a few minutes.' });
            }

            const totalRevenue = Math.floor(elapsedHours * park.dinos * 250 * park.securityLevel);
            if (totalRevenue <= 0) {
                return res.status(400).json({ error: 'No ticket revenues accumulated yet.' });
            }

            db.collectParkRevenue(userId, totalRevenue, now, 'web');
            db.logTransaction(userId, 'Dino Collect Web', `Collected 🍒 ${totalRevenue.toLocaleString()} in ticket revenues from Dinosaur Zoo`);
            res.json({ success: true, revenueCollected: totalRevenue });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // --- MUSEUM AQUARIUM ENDPOINTS ---
    app.get('/api/aquarium/:userId', (req, res) => {
        const { userId } = req.params;
        try {
            const aquarium = db.getAquarium(userId);
            res.json({ success: true, aquarium });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/aquarium/buy-fish', (req, res) => {
        const { userId } = req.body;
        try {
            const aq = db.getAquarium(userId);
            const cost = (aq.fishCount + 1) * 1000;
            const char = db.getCharacter(userId);
            if (!char || char.coins < cost) {
                return res.status(400).json({ error: `Insufficient cherries. Requires 🍒 ${cost.toLocaleString()}` });
            }

            db.buyFish(userId, cost, 'web');
            db.logTransaction(userId, 'Buy Fish Web', `Stocked aquarium tank with fish #${aq.fishCount + 1}`);
            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/aquarium/collect', (req, res) => {
        const { userId } = req.body;
        try {
            const aq = db.getAquarium(userId);
            const now = Date.now();
            const elapsedHours = (now - aq.lastCollected) / (3600 * 1000);
            if (elapsedHours < 0.05) {
                return res.status(400).json({ error: 'Tourist revenues accumulate hourly. Please wait a few minutes.' });
            }

            const totalRevenue = Math.floor(elapsedHours * aq.fishCount * 60);
            if (totalRevenue <= 0) {
                return res.status(400).json({ error: 'No tourist revenues accumulated yet.' });
            }

            db.collectAquariumRevenue(userId, totalRevenue, now, 'web');
            db.logTransaction(userId, 'Aquarium Collect Web', `Collected 🍒 ${totalRevenue.toLocaleString()} in tourist fees from Aquarium Museum`);
            res.json({ success: true, revenueCollected: totalRevenue });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // --- HOMESTEAD FARM ANIMALS ENDPOINTS ---
    app.get('/api/farm-animals/:userId', (req, res) => {
        const { userId } = req.params;
        try {
            const farm = db.getFarmAnimals(userId);
            res.json({ success: true, farm });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/farm-animals/buy', (req, res) => {
        const { userId, type } = req.body;
        try {
            const costs = { chicken: 2000, cow: 6000 };
            const cost = costs[type];
            if (!cost) return res.status(400).json({ error: 'Invalid animal type' });

            const char = db.getCharacter(userId);
            if (!char || char.coins < cost) {
                return res.status(400).json({ error: `Insufficient cherries. Requires 🍒 ${cost.toLocaleString()}` });
            }

            db.buyFarmAnimal(userId, type, cost, 'web');
            db.logTransaction(userId, 'Buy Animal Web', `Purchased livestock animal: ${type}`);
            res.json({ success: true, farm: db.getFarmAnimals(userId) });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/farm-animals/collect', (req, res) => {
        const { userId } = req.body;
        try {
            const farm = db.getFarmAnimals(userId);
            const now = Date.now();
            const elapsedHours = (now - farm.lastHarvested) / (3600 * 1000);
            if (elapsedHours < 0.05) {
                return res.status(400).json({ error: 'Livestock yields accumulate hourly. Please wait a few minutes.' });
            }

            const hourlyYield = (farm.chickens * 5) + (farm.cows * 20);
            const totalRevenue = Math.floor(elapsedHours * hourlyYield);
            if (totalRevenue <= 0) {
                return res.status(400).json({ error: 'No yields ready to harvest yet.' });
            }

            db.harvestFarm(userId, totalRevenue, now, 'web');
            db.logTransaction(userId, 'Harvest Farm Web', `Harvested 🍒 ${totalRevenue.toLocaleString()} in animal yields (eggs/milk)`);
            res.json({ success: true, revenueCollected: totalRevenue, farm: db.getFarmAnimals(userId) });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // --- PROGRESSIVE SLOTS SPIN ENDPOINT ---
    app.post('/api/slots/spin', (req, res) => {
        const { userId, bet } = req.body;
        if (!userId || !bet || bet <= 0) {
            return res.status(400).json({ error: 'Invalid parameters' });
        }
        try {
            const char = db.getCharacter(userId);
            if (!char || char.coins < bet) {
                return res.status(400).json({ error: 'Insufficient cherries' });
            }

            db.deductCoins(userId, 'web', bet);
            db.addToSlotsJackpot(Math.floor(bet * 0.1));

            const symbols = ['🍒', '💎', '🍋', '🔔', '🍀', '⭐'];
            const reel1 = symbols[Math.floor(Math.random() * symbols.length)];
            const reel2 = symbols[Math.floor(Math.random() * symbols.length)];
            const reel3 = symbols[Math.floor(Math.random() * symbols.length)];

            let result = 'lose';
            let payout = 0;
            const jackpot = db.getSlotsJackpot();

            if (reel1 === reel2 && reel2 === reel3) {
                if (reel1 === '🍒') {
                    result = 'jackpot';
                    payout = jackpot;
                    db.resetSlotsJackpot();
                } else {
                    result = 'triple';
                    payout = bet * 10;
                }
            } else if (reel1 === reel2 || reel2 === reel3 || reel1 === reel3) {
                result = 'double';
                payout = Math.floor(bet * 2);
            }

            if (payout > 0) {
                db.addCoins(userId, 'web', payout);
                db.logTransaction(userId, 'Slots Win', `Won ${payout} cherries on slots reels: ${reel1} | ${reel2} | ${reel3}`);
            } else {
                db.logTransaction(userId, 'Slots Loss', `Lost slots bet of ${bet} cherries on reels: ${reel1} | ${reel2} | ${reel3}`);
            }

            res.json({
                success: true,
                reels: [reel1, reel2, reel3],
                result,
                payout,
                newJackpot: db.getSlotsJackpot(),
                coins: db.getCharacter(userId).coins
            });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // --- AI OPERATIONS ENDPOINTS ---
    app.post('/api/ai/chat', (req, res) => {
        const { query, mode } = req.body; // mode: 'faq' or 'assistant'
        if (!query) return res.status(400).json({ error: 'Query is required' });

        const q = query.toLowerCase();
        let reply = "Hello! I am your AI Server Assistant. How can I help you manage your guild RPG adventure today?";

        if (mode === 'faq') {
            if (q.includes('cherry') || q.includes('coin') || q.includes('money')) {
                reply = "💡 **Cherry FAQ**: You can earn cherries by planting and harvesting crops (Wheat/Apples/Berries) in your homestead, selling rare loot on the marketplace, collecting hourly revenues from owned businesses, or completing cargo logistics delivery contracts.";
            } else if (q.includes('business') || q.includes('tycoon')) {
                reply = "💼 **Business FAQ**: Buy commercial properties like Taverns or Apothecaries, upgrade their levels to double their hourly yield, and remember to manually collect accrued coins periodically before the grid caps.";
            } else if (q.includes('pet') || q.includes('companion')) {
                reply = "🦊 **Pet Care FAQ**: Adopt Dogs, Cats, Rabbits, or Foxes. Keep their satiety high by feeding them Apples/Berries from your inventory. Spend Mana to play with them, or spend cherries to train them to level up!";
            } else if (q.includes('dungeon') || q.includes('fight') || q.includes('combat')) {
                reply = "🛡️ **Dungeon FAQ**: Venture into dungeons using the DUNGEONS tab. Equip weapons and shields from your inventory bag to increase stats. Defeat boss monsters to level up your combat skills.";
            } else if (q.includes('delivery') || q.includes('logistics') || q.includes('vehicle')) {
                reply = "🚚 **Logistics FAQ**: Cargo delivery jobs can be dispatched based on vehicle tier (Bicycle, Motorcycle, Truck). Hire passive drivers to collect automatic hourly earnings of 50 cherries/hr.";
            } else {
                reply = "🤖 **Chatbot**: I didn't catch that specific query, but you can ask about: pets, businesses, delivery logistics, dungeon combat, or earning cherries!";
            }
        } else {
            // Assistant Mode
            if (q.includes('guild') || q.includes('raid') || q.includes('boss')) {
                reply = "🛡️ **AI Assistant**: I analyzed the active raid logs. I recommend assembling high-strength warriors equipped with Iron Swords and assigning healers to keep the party's health above 50%!";
            } else if (q.includes('optimize') || q.includes('best')) {
                reply = "📈 **AI Assistant**: To optimize your wealth, upgrade your transport vehicle to a Delivery Truck first. This unlocks 3 parallel job slots. Then, invest cargo earnings into upgrading your Apothecary business.";
            } else {
                reply = `🤖 **AI Assistant**: Processing command... 'Helper initialized'. I'm online to assist you with RPG optimization, guild logistics, and team combat alerts.`;
            }
        }

        res.json({ success: true, reply });
    });

    app.post('/api/ai/summarize', (req, res) => {
        const { text, type } = req.body; // type: 'log' or 'ticket'
        if (!text) return res.status(400).json({ error: 'Text content is required' });

        let summary = "";
        if (type === 'ticket') {
            const ticketLower = text.toLowerCase();
            let topic = "General Support";
            let suggestedAction = "Forward to human developer for log inspection.";

            if (ticketLower.includes('item') || ticketLower.includes('lost') || ticketLower.includes('weapon')) {
                topic = "Lost Item Recovery";
                suggestedAction = "Verify player transaction logs in DB and restore item to user bag if transaction is found.";
            } else if (ticketLower.includes('business') || ticketLower.includes('money') || ticketLower.includes('coin')) {
                topic = "Business Coins Accrual Discrepancy";
                suggestedAction = "Check lastCollected timestamp in businesses table. Run manual calculation check.";
            } else if (ticketLower.includes('scam') || ticketLower.includes('hack') || ticketLower.includes('steal')) {
                topic = "Account/Scam Warning Alert";
                suggestedAction = "Flag the accused userId, check chat moderation logs, and apply temporary account freeze if verified.";
            }

            summary = `📊 **AI Support Ticket Analysis**\n• **Core Issue**: User reporting concerns about: "${topic}"\n• **Severity**: Medium/High\n• **AI Resolution Advice**: ${suggestedAction}`;
        } else {
            // Log Summarizer
            const lines = text.split('\n').filter(l => l.trim().length > 0);
            summary = `📝 **AI Transaction Log Summary (${lines.length} lines analyzed)**\n`;
            
            let earns = 0;
            let spends = 0;
            let fights = 0;
            
            lines.forEach(l => {
                const low = l.toLowerCase();
                if (low.includes('won') || low.includes('earn') || low.includes('collect') || low.includes('+')) earns++;
                if (low.includes('lost') || low.includes('spend') || low.includes('deduct') || low.includes('-')) spends++;
                if (low.includes('fight') || low.includes('damage') || low.includes('boss')) fights++;
            });

            summary += `• Detected **${earns} positive yield transactions** (coins/items earned).\n`;
            summary += `• Detected **${spends} expense operations** (cherries spent/items equipped).\n`;
            summary += `• Detected **${fights} active combat engagements**.\n`;
            summary += `• **AI Verdict**: User profile is active. Health parameters indicate positive development.`;
        }

        res.json({ success: true, summary });
    });

    app.post('/api/ai/moderate', (req, res) => {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: 'Message content is required' });

        const msg = message.toLowerCase();
        let spam = false;
        let scam = false;
        let profane = false;
        const reasons = [];

        // Spam Check
        const repetitions = (message.match(/(.)\1{4,}/g) || []); // e.g. "aaaaa"
        const words = msg.split(/\s+/);
        const uniqueWords = [...new Set(words)];
        if (repetitions.length > 0 || (words.length > 5 && uniqueWords.length / words.length < 0.4)) {
            spam = true;
            reasons.push("Excessive character repetition or highly repetitive word patterns.");
        }

        // Scam Check
        if (msg.includes('free cherries') || msg.includes('free coins') || msg.includes('giveaway-now') || msg.includes('click link') || msg.includes('steal') || msg.includes('hack')) {
            scam = true;
            reasons.push("Suspicious prompts offering free assets or credentials.");
        }
        if (/(http|https|www)/.test(msg) && (msg.includes('free') || msg.includes('gift'))) {
            scam = true;
            reasons.push("Unverified link offering promotions/gifts.");
        }

        // Moderation Profanity Check
        const bannedWords = ['kill', 'hate', 'stupid', 'idiot', 'scum', 'trash', 'hack you'];
        bannedWords.forEach(w => {
            if (msg.includes(w)) {
                profane = true;
                reasons.push(`Contains offensive word: "${w}"`);
            }
        });

        res.json({
            success: true,
            originalMessage: message,
            safe: !spam && !scam && !profane,
            checks: { spam, scam, profane },
            reasons
        });
    });

    app.post('/api/ai/translate', (req, res) => {
        const { text, targetLang } = req.body; // targetLang: 'es', 'fr', 'ja'
        if (!text) return res.status(400).json({ error: 'Text content is required' });

        const lower = text.toLowerCase();
        let translated = text;
        let grammarFeedback = "No grammar errors detected. Good syntax!";

        // Simulated grammar correction
        if (lower.includes('i is') || lower.includes('he go') || lower.includes('you was')) {
            grammarFeedback = "⚠️ Grammar Alert: Corrected errors (e.g. 'I is' -> 'I am', 'he go' -> 'he goes', 'you was' -> 'you were').";
        }

        const dict = {
            es: {
                'hello': 'Hola',
                'how are you': '¿cómo estás?',
                'cherry': 'cereza',
                'business': 'negocio',
                'dungeon': 'calabozo',
                'guild': 'gremio',
                'pet': 'mascota'
            },
            fr: {
                'hello': 'Bonjour',
                'how are you': 'comment allez-vous?',
                'cherry': 'cerise',
                'business': 'entreprise',
                'dungeon': 'donjon',
                'guild': 'guilde',
                'pet': 'animal de compagnie'
            },
            ja: {
                'hello': 'こんにちは (Konnichiwa)',
                'how are you': 'お元気ですか (Ogenki desu ka?)',
                'cherry': 'さくらんぼ (Sakuranbo)',
                'business': 'ビジネス (Bijinesu)',
                'dungeon': 'ダンジョン (Danjon)',
                'guild': 'ギルド (Girudo)',
                'pet': 'ペット (Petto)'
            }
        };

        const langDict = dict[targetLang];
        if (langDict) {
            let replaced = text;
            Object.keys(langDict).forEach(key => {
                const regex = new RegExp(`\\b${key}\\b`, 'gi');
                replaced = replaced.replace(regex, langDict[key]);
            });
            translated = replaced;
        } else {
            translated = `[Simulated ${targetLang.toUpperCase()} Translation]: ` + text;
        }

        res.json({
            success: true,
            originalText: text,
            translatedText: translated,
            grammarCorrection: grammarFeedback
        });
    });

    app.post('/api/ai/starter', (req, res) => {
        const { category } = req.body; // category: RPG, Business, Companion, Guild
        
        const starters = {
            RPG: [
                "🛡️ What weapon combination are you planning to craft next for dungeon level 5?",
                "⚔️ Have you defeated the Dragon Boss yet, or are you still leveling up your attributes?",
                "🐉 Who wants to squad up for a high-intensity Dungeon raid tonight?"
            ],
            Business: [
                "💼 Is it better to upgrade the Blacksmith or save up cherries to unlock the Apothecary?",
                "📈 How often do you guys collect passive coins from your businesses?",
                "🏪 Do you think Tavern prices will increase in the next market event?"
            ],
            Companion: [
                "🦊 What animal companion companion did you adopt? Dog, Rabbit, or Fox?",
                "🍎 Do you feed your pet Apples or Berries? Which crop is easier to grow?",
                "✨ Let's compare pet levels! Who has the highest trained companion companion?"
            ],
            Guild: [
                "🤝 Are you in a guild, or are you looking to join an active guild roster?",
                "🏰 How should we distribute boss loot shares among the guild healers?",
                "🛡️ What strategy are we using for containment security systems upgrades?"
            ]
        };

        const list = starters[category] || starters['RPG'];
        res.json({ success: true, category, starters: list });
    });

    // --- SECURITY & MODERATION ENDPOINTS ---
    app.get('/api/security/settings/:userId', (req, res) => {
        try {
            res.json({
                success: true,
                settings: securitySettings,
                punishments: activePunishments.map(p => ({
                    ...p,
                    active: p.expiresAt > Date.now(),
                    timeLeft: Math.max(0, Math.ceil((p.expiresAt - Date.now()) / 1000))
                })),
                invites: inviteLogs
            });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/security/toggle', (req, res) => {
        const { key } = req.body;
        if (securitySettings[key] !== undefined) {
            securitySettings[key] = !securitySettings[key];
            res.json({ success: true, settings: securitySettings });
        } else {
            res.status(400).json({ error: 'Invalid setting key' });
        }
    });

    app.post('/api/security/punish', (req, res) => {
        const { targetUserId, type, durationMin, reason } = req.body; // type: 'ban', 'mute', 'jail'
        if (!targetUserId || !type || !durationMin) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        try {
            const minutes = parseInt(durationMin);
            if (isNaN(minutes) || minutes <= 0) {
                return res.status(400).json({ error: 'Invalid duration' });
            }

            const expiresAt = Date.now() + (minutes * 60 * 1000);
            const id = Math.random().toString(36).substr(2, 9);
            
            const newPunish = {
                id,
                userId: targetUserId,
                type,
                expiresAt,
                reason: reason || 'No reason provided'
            };

            const index = activePunishments.findIndex(p => p.userId === targetUserId && p.type === type);
            if (index !== -1) {
                activePunishments.splice(index, 1);
            }

            activePunishments.push(newPunish);
            db.logTransaction(targetUserId, `Security Punish Web`, `Issued temporary ${type.toUpperCase()} for ${minutes} min. Reason: ${newPunish.reason}`);
            res.json({ success: true, punishment: newPunish });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/security/jail/bail', (req, res) => {
        const { userId } = req.body;
        try {
            const char = db.getCharacter(userId);
            if (!char || char.coins < 5000) {
                return res.status(400).json({ error: 'Bail requires 🍒 5,000 cherries. Insufficient funds!' });
            }

            const index = activePunishments.findIndex(p => p.userId === userId && p.type === 'jail' && p.expiresAt > Date.now());
            if (index === -1) {
                return res.status(400).json({ error: 'You are not currently in jail!' });
            }

            db.deductCoins(userId, 'global', 5000);
            activePunishments.splice(index, 1); // remove jail penalty
            db.logTransaction(userId, 'Jail Bail Paid Web', 'Paid 🍒 5,000 cherries to post bail and escape jail');
            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // --- COMMUNITY ENGAGEMENT ENDPOINTS ---
    app.get('/api/community/data/:userId', (req, res) => {
        const { userId } = req.params;
        try {
            res.json({
                success: true,
                polls: communityPolls,
                confessions: communityConfessions,
                starboard: starboardMessages,
                events: communityEvents,
                news: communityNews,
                goal: communityGoals,
                dailyQuestion,
                myReputation: userReputation[userId] || 0,
                birthdays: upcomingBirthdays
            });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/community/rep', (req, res) => {
        const { targetUserId } = req.body;
        if (!targetUserId) return res.status(400).json({ error: 'Target user ID is required' });
        try {
            userReputation[targetUserId] = (userReputation[targetUserId] || 0) + 1;
            res.json({ success: true, newRep: userReputation[targetUserId] });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/community/daily-question/answer', (req, res) => {
        const { author, text } = req.body;
        if (!author || !text) return res.status(400).json({ error: 'Author and text are required' });
        try {
            dailyQuestion.answers.push({ author, text });
            res.json({ success: true, answers: dailyQuestion.answers });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/community/poll/create', (req, res) => {
        const { question, optionA, optionB } = req.body;
        if (!question || !optionA || !optionB) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        try {
            const newPoll = {
                id: communityPolls.length + 1,
                question,
                optionA,
                optionB,
                votesA: 0,
                votesB: 0
            };
            communityPolls.push(newPoll);
            res.json({ success: true, polls: communityPolls });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/community/poll/vote', (req, res) => {
        const { pollId, option } = req.body; // option: 'A' or 'B'
        try {
            const poll = communityPolls.find(p => p.id === parseInt(pollId));
            if (!poll) return res.status(404).json({ error: 'Poll not found' });

            if (option === 'A') poll.votesA++;
            else if (option === 'B') poll.votesB++;

            res.json({ success: true, polls: communityPolls });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/community/confess', (req, res) => {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: 'Confession text is required' });
        try {
            const newConf = {
                id: communityConfessions.length + 1,
                text,
                timestamp: Date.now()
            };
            communityConfessions.unshift(newConf); // latest first
            res.json({ success: true, confessions: communityConfessions });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/community/star', (req, res) => {
        const { author, content } = req.body;
        if (!author || !content) return res.status(400).json({ error: 'Author and content are required' });
        try {
            const newStar = {
                id: starboardMessages.length + 1,
                author,
                content,
                stars: 1
            };
            starboardMessages.unshift(newStar);
            res.json({ success: true, starboard: starboardMessages });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/community/birthday/wish', (req, res) => {
        const { targetUserId } = req.body;
        try {
            db.addCoins(targetUserId, 'global', 10);
            db.logTransaction(targetUserId, 'Birthday Wish Reward Web', 'Received 10 cherries reward from a birthday wish!');
            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/community/event/register', (req, res) => {
        const { eventId, userName } = req.body;
        try {
            const ev = communityEvents.find(e => e.id === parseInt(eventId));
            if (!ev) return res.status(404).json({ error: 'Event not found' });

            if (!ev.attendees.includes(userName)) {
                ev.attendees.push(userName);
            }
            res.json({ success: true, events: communityEvents });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/community/goal/contribute', (req, res) => {
        const { userId, amount } = req.body;
        try {
            const coins = parseInt(amount);
            if (isNaN(coins) || coins <= 0) return res.status(400).json({ error: 'Invalid coins amount' });

            const char = db.getCharacter(userId);
            if (!char || char.coins < coins) {
                return res.status(400).json({ error: 'Insufficient cherries balance!' });
            }

            db.deductCoins(userId, 'global', coins);
            communityGoals.current += coins;
            db.logTransaction(userId, 'Community Goal Contribution Web', `Contributed ${coins} cherries to ${communityGoals.title}`);

            res.json({ success: true, goal: communityGoals, coins: db.getCharacter(userId).coins });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // --- SERVER ANALYTICS & INSIGHTS ENDPOINTS ---
    app.get('/api/analytics/data/:userId', (req, res) => {
        try {
            const heatmap = [];
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            for (let d = 0; d < 7; d++) {
                const dayRow = [];
                for (let h = 0; h < 24; h++) {
                    let density = Math.floor(Math.random() * 2);
                    if (h >= 17 && h <= 22) density += 2;
                    if (d >= 5) density += 1;
                    dayRow.push(Math.min(4, density));
                }
                heatmap.push({ day: days[d], hours: dayRow });
            }

            res.json({
                success: true,
                healthScore: 96,
                growth: [
                    { date: '07/13', members: 100 },
                    { date: '07/14', members: 105 },
                    { date: '07/15', members: 112 },
                    { date: '07/16', members: 118 },
                    { date: '07/17', members: 124 },
                    { date: '07/18', members: 131 },
                    { date: '07/19', members: 142 }
                ],
                voiceStats: {
                    activeUsers: 14,
                    avgDuration: 42,
                    channels: [
                        { name: '🔊 General Lounge', users: 5 },
                        { name: '⚔️ Raid Squad Room A', users: 6 },
                        { name: '🎲 Casino Chill Pit', users: 3 }
                    ]
                },
                channelStats: [
                    { channel: '#general', messages: 480 },
                    { channel: '#dungeons-rpg', messages: 350 },
                    { channel: '#market-deals', messages: 190 },
                    { channel: '#pets-zoo', messages: 120 }
                ],
                inviteAnalytics: [
                    { code: 'CHERRY-RPG', joins: 142, rate: 82 },
                    { code: 'GUILD-WARS', joins: 29, rate: 65 },
                    { code: 'companion-ZOO', joins: 18, rate: 58 }
                ],
                retention: {
                    day1: 88,
                    day7: 62,
                    day30: 45
                },
                moderatorAnalytics: [
                    { name: 'Admin', actions: 15 },
                    { name: 'Mod1', actions: 8 },
                    { name: 'Mod2', actions: 4 }
                ],
                emojiUsage: [
                    { emoji: '🍒', count: 1482 },
                    { emoji: '⚔️', count: 952 },
                    { emoji: '🛡️', count: 720 },
                    { emoji: '🦊', count: 630 },
                    { emoji: '🐠', count: 420 }
                ],
                trendReports: [
                    { title: '🎰 Slots spins up 54%', type: 'up', text: 'Slots action reached dynamic highs this week after the tab overhaul.' },
                    { title: '🛡️ Dungeon level 3 completions up 22%', type: 'up', text: 'Adventurers cleared the mines boss repeatedly with iron gear.' },
                    { title: '🍅 Tomato crop harvests down 8%', type: 'down', text: 'Players favored Apples and Berries to maximize companion satiety rates.' }
                ],
                heatmap
            });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // --- SUPPORT TICKET SUITE ENDPOINTS ---
    app.get('/api/tickets/data/:userId', (req, res) => {
        const { userId } = req.params;
        try {
            const char = db.getCharacter(userId);
            const authorName = char ? char.name : 'Unknown';
            const isStaff = staffMembers.includes(authorName) || authorName.toLowerCase().includes('admin');
            const list = isStaff 
                ? supportTickets 
                : supportTickets.filter(t => t.author.toLowerCase() === authorName.toLowerCase());
            
            res.json({
                success: true,
                categories: ticketCategories,
                tickets: list,
                isStaff
            });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/tickets/create', (req, res) => {
        const { userId, author, category, priority, subject, text } = req.body;
        try {
            if (!subject || !text) {
                return res.status(400).json({ error: 'Subject and detail description are required' });
            }

            const assignedTo = staffMembers[staffRotationIdx % staffMembers.length];
            staffRotationIdx++;

            let hours = 24;
            if (priority === 'Medium') hours = 12;
            if (priority === 'High') hours = 4;
            if (priority === 'Emergency') hours = 1;
            const slaLimit = Date.now() + 3600 * 1000 * hours;

            const newTicket = {
                id: supportTickets.length > 0 ? Math.max(...supportTickets.map(t => t.id)) + 1 : 101,
                author,
                category,
                priority,
                assignedTo,
                status: 'Open',
                subject,
                createdTime: Date.now(),
                slaLimit,
                messages: [{ author, text }],
                staffNotes: '',
                satisfaction: null
            };

            supportTickets.push(newTicket);
            res.json({ success: true, ticket: newTicket });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/tickets/reply', (req, res) => {
        const { ticketId, author, text } = req.body;
        try {
            const ticket = supportTickets.find(t => t.id === parseInt(ticketId));
            if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

            ticket.messages.push({ author, text });
            res.json({ success: true, messages: ticket.messages });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/tickets/notes', (req, res) => {
        const { ticketId, staffNotes } = req.body;
        try {
            const ticket = supportTickets.find(t => t.id === parseInt(ticketId));
            if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

            ticket.staffNotes = staffNotes;
            res.json({ success: true, staffNotes: ticket.staffNotes });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/tickets/escalate', (req, res) => {
        const { ticketId } = req.body;
        try {
            const ticket = supportTickets.find(t => t.id === parseInt(ticketId));
            if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

            ticket.priority = 'Emergency';
            ticket.assignedTo = 'Admin';
            ticket.slaLimit = Date.now() + 3600 * 1000 * 1;
            res.json({ success: true, ticket });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/tickets/close', (req, res) => {
        const { ticketId, satisfaction } = req.body;
        try {
            const ticket = supportTickets.find(t => t.id === parseInt(ticketId));
            if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

            ticket.status = 'Closed';
            if (satisfaction) {
                ticket.satisfaction = parseInt(satisfaction);
            }
            res.json({ success: true, ticket });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // --- APPLICATIONS & RECRUITMENT ENDPOINTS ---
    app.get('/api/applications/data/:userId', (req, res) => {
        const { userId } = req.params;
        try {
            const char = db.getCharacter(userId);
            const authorName = char ? char.name : 'Unknown';
            const isStaff = staffMembers.includes(authorName) || authorName.toLowerCase().includes('admin');
            const list = isStaff 
                ? userApplications 
                : userApplications.filter(a => a.author.toLowerCase() === authorName.toLowerCase());
            
            res.json({
                success: true,
                appTypes,
                applications: list,
                isStaff
            });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/applications/create', (req, res) => {
        const { userId, author, type, details } = req.body;
        try {
            if (!type || !details) {
                return res.status(400).json({ error: 'Application type and details are required' });
            }

            let status = 'Pending';
            let autoAccepted = false;

            if (type === 'Creator Application') {
                const subs = parseInt(details.subscribers);
                if (!isNaN(subs) && subs >= 1000) {
                    status = 'Approved';
                    autoAccepted = true;
                }
            } else if (type === 'Whitelist Application') {
                const age = parseInt(details.age);
                if (!isNaN(age) && age >= 18 && details.agreeRules === 'Yes') {
                    status = 'Approved';
                    autoAccepted = true;
                }
            }

            const newApp = {
                id: userApplications.length > 0 ? Math.max(...userApplications.map(a => a.id)) + 1 : 501,
                author,
                type,
                status,
                createdTime: Date.now(),
                details,
                reviews: [],
                interviewTime: null,
                autoAccepted
            };

            userApplications.push(newApp);
            res.json({ success: true, application: newApp });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/applications/review', (req, res) => {
        const { appId, reviewer, score, comment } = req.body;
        try {
            const appRecord = userApplications.find(a => a.id === parseInt(appId));
            if (!appRecord) return res.status(404).json({ error: 'Application not found' });

            appRecord.reviews.push({
                reviewer,
                score: parseInt(score),
                comment
            });
            res.json({ success: true, reviews: appRecord.reviews });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/applications/schedule-interview', (req, res) => {
        const { appId, interviewTime } = req.body;
        try {
            const appRecord = userApplications.find(a => a.id === parseInt(appId));
            if (!appRecord) return res.status(404).json({ error: 'Application not found' });

            appRecord.interviewTime = interviewTime;
            res.json({ success: true, interviewTime: appRecord.interviewTime });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/applications/workflow-update', (req, res) => {
        const { appId, status } = req.body;
        try {
            const appRecord = userApplications.find(a => a.id === parseInt(appId));
            if (!appRecord) return res.status(404).json({ error: 'Application not found' });

            appRecord.status = status;
            res.json({ success: true, status: appRecord.status });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // --- SERVER AUTOMATION & WORKFLOWS ENDPOINTS ---
    app.get('/api/automation/data/:userId', (req, res) => {
        try {
            res.json({
                success: true,
                automations: serverAutomations
            });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/automation/update', (req, res) => {
        const { welcomeMessage, goodbyeMessage, autoArchiveHours, autoRoles, autoThreads, reactionRoles, buttonRoles } = req.body;
        try {
            if (welcomeMessage !== undefined) serverAutomations.welcomeMessage = welcomeMessage;
            if (goodbyeMessage !== undefined) serverAutomations.goodbyeMessage = goodbyeMessage;
            if (autoArchiveHours !== undefined) serverAutomations.autoArchiveHours = parseInt(autoArchiveHours);
            if (autoRoles !== undefined) serverAutomations.autoRoles = autoRoles;
            if (autoThreads !== undefined) serverAutomations.autoThreads = autoThreads;
            if (reactionRoles !== undefined) serverAutomations.reactionRoles = reactionRoles;
            if (buttonRoles !== undefined) serverAutomations.buttonRoles = buttonRoles;

            res.json({ success: true, automations: serverAutomations });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/automation/scheduled/create', (req, res) => {
        const { time, channel, content } = req.body;
        try {
            if (!time || !channel || !content) return res.status(400).json({ error: 'Missing parameters' });
            
            const newScheduled = {
                id: serverAutomations.scheduledMessages.length > 0 ? Math.max(...serverAutomations.scheduledMessages.map(m => m.id)) + 1 : 301,
                time,
                channel,
                content
            };
            serverAutomations.scheduledMessages.push(newScheduled);
            res.json({ success: true, scheduledMessages: serverAutomations.scheduledMessages });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/automation/scheduled/delete', (req, res) => {
        const { id } = req.body;
        try {
            serverAutomations.scheduledMessages = serverAutomations.scheduledMessages.filter(m => m.id !== parseInt(id));
            res.json({ success: true, scheduledMessages: serverAutomations.scheduledMessages });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/automation/reminder/create', (req, res) => {
        const { time, content } = req.body;
        try {
            if (!time || !content) return res.status(400).json({ error: 'Time and reminder content are required' });

            const newReminder = {
                id: serverAutomations.reminders.length > 0 ? Math.max(...serverAutomations.reminders.map(r => r.id)) + 1 : 401,
                time,
                content
            };
            serverAutomations.reminders.push(newReminder);
            res.json({ success: true, reminders: serverAutomations.reminders });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/automation/workflow/create', (req, res) => {
        const { name, triggers } = req.body;
        try {
            if (!name || !triggers) return res.status(400).json({ error: 'Name and triggers are required' });

            const newWorkflow = {
                name,
                triggers,
                status: 'Active'
            };
            serverAutomations.customWorkflows.push(newWorkflow);
            res.json({ success: true, customWorkflows: serverAutomations.customWorkflows });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // --- PROFILE CUSTOMIZATIONS ENDPOINTS ---
    const availableThemes = ['Obsidian Dark', 'Cyberpunk Neon', 'Emerald Forest', 'Sunset Spark'];
    const availableTitles = ['Novice Adventurer', 'Citadel Knight', 'Clover Master', 'Grandmaster Agriculturist', 'Mythic Beast Slayer'];
    const availableBadges = ['Beta Tester', 'Staff Member', 'Certified Influencer', 'Bug Hunter', 'Marathon Runner'];
    const themeBackgrounds = {
        'Obsidian Dark': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
        'Cyberpunk Neon': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f',
        'Emerald Forest': 'https://images.unsplash.com/photo-1448375240586-882707db888b',
        'Sunset Spark': 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1'
    };

    app.get('/api/profile/data/:userId', (req, res) => {
        const { userId } = req.params;
        try {
            const settings = db.getProfileSettings(userId);
            res.json({
                success: true,
                settings,
                availableThemes,
                availableTitles,
                availableBadges,
                themeBackgrounds
            });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/profile/update', (req, res) => {
        const { userId, theme, background, activeTitle, socialDiscord, socialTwitter, socialTwitch, socialYoutube, bio, favGames, badges } = req.body;
        try {
            if (!userId) return res.status(400).json({ error: 'User ID is required' });
            
            db.updateProfileSettings(userId, {
                theme: theme || 'Obsidian Dark',
                background: background || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809',
                activeTitle: activeTitle || 'Novice Adventurer',
                socialDiscord: socialDiscord || '',
                socialTwitter: socialTwitter || '',
                socialTwitch: socialTwitch || '',
                socialYoutube: socialYoutube || '',
                bio: bio || '',
                favGames: favGames || '',
                badges: typeof badges === 'string' ? badges : JSON.stringify(badges || [])
            });

            const settings = db.getProfileSettings(userId);
            res.json({ success: true, settings });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // --- PREMIUM BOT OS ADMIN ENDPOINTS ---
    app.get('/api/premium/data/:userId', (req, res) => {
        try {
            res.json({
                success: true,
                config: botOSConfig
            });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/premium/plugins/toggle', (req, res) => {
        const { plugin } = req.body;
        try {
            if (!plugin) return res.status(400).json({ error: 'Plugin name is required' });

            if (botOSConfig.installedPlugins.includes(plugin)) {
                botOSConfig.installedPlugins = botOSConfig.installedPlugins.filter(p => p !== plugin);
            } else {
                botOSConfig.installedPlugins.push(plugin);
            }
            res.json({ success: true, config: botOSConfig });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/premium/achievements/create', (req, res) => {
        const { name, criteria, reward, badge } = req.body;
        try {
            if (!name || !criteria) return res.status(400).json({ error: 'Name and criteria are required' });

            const newAchievement = {
                id: botOSConfig.dynamicAchievements.length > 0 ? Math.max(...botOSConfig.dynamicAchievements.map(a => a.id)) + 1 : 901,
                name,
                criteria,
                reward: reward || 'None',
                badge: badge || 'General Medal'
            };
            botOSConfig.dynamicAchievements.push(newAchievement);
            res.json({ success: true, config: botOSConfig });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/premium/event/set', (req, res) => {
        const { eventName } = req.body;
        try {
            if (!eventName) return res.status(400).json({ error: 'Event name is required' });
            botOSConfig.seasonalEvent = eventName;
            res.json({ success: true, config: botOSConfig });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/premium/quiz/create', (req, res) => {
        const { title, question, options, correct, certificateBadge } = req.body;
        try {
            if (!title || !question || !options || !correct) return res.status(400).json({ error: 'Missing parameters' });

            const newQuiz = {
                id: botOSConfig.quizzes.length > 0 ? Math.max(...botOSConfig.quizzes.map(q => q.id)) + 1 : 1,
                title,
                questions: [{ question, options, correct }],
                certificateBadge: certificateBadge || 'Certified Member'
            };
            botOSConfig.quizzes.push(newQuiz);
            res.json({ success: true, config: botOSConfig });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/premium/backup/create', (req, res) => {
        try {
            const nextIdx = botOSConfig.backups.length + 1;
            const newBackup = {
                id: `backup_0${nextIdx}`,
                timestamp: Date.now(),
                filename: `database_manual_save_0${nextIdx}.json`
            };
            botOSConfig.backups.push(newBackup);
            res.json({ success: true, config: botOSConfig });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/premium/devapi/generate', (req, res) => {
        try {
            const newToken = 'token_live_' + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
            botOSConfig.developerApiTokens.push(newToken);
            res.json({ success: true, config: botOSConfig });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // --- PREMIUM MUSIC STUDIO ENDPOINTS ---
    app.get('/api/music/state/:userId', (req, res) => {
        try {
            res.json({
                success: true,
                state: botMusicState
            });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/music/control', (req, res) => {
        const { action, value } = req.body;
        try {
            if (action === 'play') {
                botMusicState.nowPlaying.paused = false;
                if (value) {
                    botMusicState.nowPlaying.title = value;
                    botMusicState.nowPlaying.position = 0;
                }
            } else if (action === 'pause') {
                botMusicState.nowPlaying.paused = true;
            } else if (action === 'resume') {
                botMusicState.nowPlaying.paused = false;
            } else if (action === 'stop') {
                botMusicState.nowPlaying.paused = true;
                botMusicState.nowPlaying.position = 0;
            } else if (action === 'skip') {
                if (botMusicState.queue.length > 0) {
                    const nextSong = botMusicState.queue.shift();
                    botMusicState.queueHistory.unshift({
                        title: botMusicState.nowPlaying.title,
                        artist: botMusicState.nowPlaying.artist,
                        duration: botMusicState.nowPlaying.duration
                    });
                    botMusicState.nowPlaying.title = nextSong.title;
                    botMusicState.nowPlaying.artist = nextSong.artist;
                    botMusicState.nowPlaying.position = 0;
                }
            } else if (action === 'seek') {
                botMusicState.nowPlaying.position = parseInt(value || 0);
            } else if (action === 'volume') {
                botMusicState.nowPlaying.volume = parseInt(value || 75);
            } else if (action === 'loop') {
                botMusicState.nowPlaying.loopMode = value;
            }
            res.json({ success: true, state: botMusicState });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/music/queue/edit', (req, res) => {
        const { action, id, songTitle, songArtist, swapIndex1, swapIndex2 } = req.body;
        try {
            if (action === 'add') {
                const nextId = botMusicState.queue.length > 0 ? Math.max(...botMusicState.queue.map(q => q.id)) + 1 : 101;
                botMusicState.queue.push({
                    id: nextId,
                    title: songTitle || 'New Ambient Sound track',
                    artist: songArtist || 'Various Artists',
                    duration: 165,
                    requestedBy: 'Admin'
                });
            } else if (action === 'remove') {
                botMusicState.queue = botMusicState.queue.filter(q => q.id !== parseInt(id));
            } else if (action === 'swap') {
                const idx1 = parseInt(swapIndex1);
                const idx2 = parseInt(swapIndex2);
                if (botMusicState.queue[idx1] && botMusicState.queue[idx2]) {
                    const temp = botMusicState.queue[idx1];
                    botMusicState.queue[idx1] = botMusicState.queue[idx2];
                    botMusicState.queue[idx2] = temp;
                }
            } else if (action === 'clear') {
                botMusicState.queue = [];
            }
            res.json({ success: true, state: botMusicState });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/music/filters/update', (req, res) => {
        const { filterName, toggle, value } = req.body;
        try {
            if (filterName === 'bassBoost') botMusicState.filters.bassBoost = toggle;
            else if (filterName === 'nightcore') botMusicState.filters.nightcore = toggle;
            else if (filterName === 'vaporwave') botMusicState.filters.vaporwave = toggle;
            else if (filterName === 'eightD') botMusicState.filters.eightD = toggle;
            else if (filterName === 'karaoke') botMusicState.filters.karaoke = toggle;
            else if (filterName === 'speed') botMusicState.filters.speed = parseFloat(value || 1.0);
            else if (filterName === 'pitch') botMusicState.filters.pitch = parseFloat(value || 1.0);
            else if (filterName === 'reverb') botMusicState.filters.reverbLevel = parseInt(value || 0);

            res.json({ success: true, state: botMusicState });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/music/playlists/create', (req, res) => {
        const { name } = req.body;
        try {
            if (!name) return res.status(400).json({ error: 'Playlist name is required' });
            
            const newPlaylist = {
                name,
                owner: 'Admin',
                collaborative: false,
                songsCount: 1,
                songsList: [
                    { title: botMusicState.nowPlaying.title, artist: botMusicState.nowPlaying.artist, duration: botMusicState.nowPlaying.duration }
                ]
            };
            botMusicState.playlists.push(newPlaylist);
            res.json({ success: true, state: botMusicState });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // Fallback index.html for React router support
    app.get('/*splat', (req, res) => {
        res.sendFile(path.join(__dirname, 'dashboard', 'dist', 'index.html'));
    });

    app.listen(port, () => {
        console.log(`🌐 Dashboard API Server listening on port ${port}`);
    });
}

module.exports = { startServer };
