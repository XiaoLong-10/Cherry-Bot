const db = require('../../database/index.js');

// SQLite Schema initialization for Season Pass
db.exec(`
    CREATE TABLE IF NOT EXISTS season_progress (
        userId TEXT PRIMARY KEY,
        passLevel INTEGER DEFAULT 1,
        passXP INTEGER DEFAULT 0,
        completedQuests TEXT DEFAULT '[]',
        claimedRewards TEXT DEFAULT '[]'
    );
`);

const TIER_REWARDS = {
    1: { name: '500 Coins', type: 'coins', value: 500, emoji: '🪙' },
    5: { name: '🌸 Sakura Blossom Badge', type: 'badge', value: 'Sakura Blossom', emoji: '🌸' },
    10: { name: '2,500 Coins + Health Potion x3', type: 'coins', value: 2500, emoji: '🧪' },
    20: { name: '🧋 Boba Master Title', type: 'title', value: 'Boba Master', emoji: '🧋' },
    35: { name: '10,000 High-Yield Bank Deposit', type: 'bank', value: 10000, emoji: '🏦' },
    50: { name: '👑 Cherry Royalty Title', type: 'title', value: 'Cherry Royalty', emoji: '👑' },
    75: { name: '💎 25,000 Coins', type: 'coins', value: 25000, emoji: '💎' },
    100: { name: '🌟 Mythic Season Champion Badge & 100,000 Coins', type: 'mythic', value: 100000, emoji: '🏆' }
};

const DAILY_QUESTS = [
    { id: 'q_hunt', text: 'Hunt 3 wild beasts in `/hunt`', rewardXP: 150 },
    { id: 'q_plinko', text: 'Play 1 game of `/casino plinko`', rewardXP: 100 },
    { id: 'q_realm', text: 'Contribute resources to `/realm`', rewardXP: 200 },
    { id: 'q_uwu', text: 'UwUify a sentence with `/uwu convert`', rewardXP: 80 }
];

function getSeasonProgress(userId) {
    db.prepare("INSERT OR IGNORE INTO season_progress (userId, passLevel, passXP, completedQuests, claimedRewards) VALUES (?, 1, 0, '[]', '[]')").run(userId);
    const row = db.prepare("SELECT * FROM season_progress WHERE userId = ?").get(userId);
    
    return {
        ...row,
        completedQuests: JSON.parse(row.completedQuests || '[]'),
        claimedRewards: JSON.parse(row.claimedRewards || '[]')
    };
}

function addSeasonXP(userId, amount) {
    const prog = getSeasonProgress(userId);
    let newXP = prog.passXP + amount;
    let newLevel = prog.passLevel;

    // 200 XP required per Season Pass tier level
    while (newXP >= 200 && newLevel < 100) {
        newXP -= 200;
        newLevel += 1;
    }

    db.prepare("UPDATE season_progress SET passLevel = ?, passXP = ? WHERE userId = ?").run(newLevel, newXP, userId);
    return { newLevel, newXP, leveledUp: newLevel > prog.passLevel };
}

function claimReward(userId, tier) {
    const reward = TIER_REWARDS[tier];
    if (!reward) return { success: false, reason: 'Invalid Season Pass tier reward.' };

    const prog = getSeasonProgress(userId);
    if (prog.passLevel < tier) return { success: false, reason: `You need to reach Tier ${tier} to claim this reward! (Current Tier: ${prog.passLevel})` };
    if (prog.claimedRewards.includes(tier)) return { success: false, reason: `You have already claimed the Tier ${tier} reward!` };

    // Grant reward
    if (reward.type === 'coins' || reward.type === 'mythic') {
        db.addCoins(userId, reward.value);
    } else if (reward.type === 'bank') {
        db.prepare("UPDATE bank_accounts SET bankCoins = bankCoins + ? WHERE userId = ?").run(reward.value, userId);
    }

    const updatedClaimed = [...prog.claimedRewards, tier];
    db.prepare("UPDATE season_progress SET claimedRewards = ? WHERE userId = ?").run(JSON.stringify(updatedClaimed), userId);

    return { success: true, reward };
}

module.exports = {
    TIER_REWARDS,
    DAILY_QUESTS,
    getSeasonProgress,
    addSeasonXP,
    claimReward
};
