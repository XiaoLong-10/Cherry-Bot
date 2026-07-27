// Advanced Casino & Arcade Game Engine for Cherry Bot 2.0

function playPlinko(betAmount) {
    const multipliers = [0.2, 0.5, 1.2, 2.0, 5.0, 10.0, 5.0, 2.0, 1.2, 0.5, 0.2];
    const pinRows = 8;
    let position = 5;

    let path = [];
    for (let r = 0; r < pinRows; r++) {
        const step = Math.random() < 0.5 ? -1 : 1;
        position = Math.max(0, Math.min(multipliers.length - 1, position + step));
        path.push(step > 0 ? '👉' : '👈');
    }

    const mult = multipliers[position];
    const payout = Math.floor(betAmount * mult);
    const netProfit = payout - betAmount;

    return {
        path: path.join(' '),
        multiplier: mult,
        payout,
        netProfit,
        isWin: mult > 1.0
    };
}

function playCrash(betAmount, targetMultiplier) {
    // Generate exponential crash point (E.g. 1.0x to 50.0x)
    const e = 2.718;
    const rand = Math.random();
    const crashMultiplier = parseFloat(Math.max(1.01, (1.0 / (1.0 - rand * 0.96))).toFixed(2));

    const isWin = targetMultiplier <= crashMultiplier;
    const payout = isWin ? Math.floor(betAmount * targetMultiplier) : 0;
    const netProfit = payout - betAmount;

    return {
        crashMultiplier,
        targetMultiplier,
        isWin,
        payout,
        netProfit
    };
}

function playMines(betAmount, mineCount = 3, picksCount = 3) {
    const totalSlots = 25;
    const safeSlots = totalSlots - mineCount;

    let hitMine = false;
    for (let p = 0; p < picksCount; p++) {
        if (Math.random() < (mineCount / totalSlots)) {
            hitMine = true;
            break;
        }
    }

    let multiplier = 1.0;
    if (!hitMine) {
        multiplier = parseFloat((1.0 + (picksCount * 0.45 * (mineCount / 3))).toFixed(2));
    }

    const payout = hitMine ? 0 : Math.floor(betAmount * multiplier);

    return {
        hitMine,
        picksCount,
        mineCount,
        multiplier,
        payout,
        netProfit: payout - betAmount
    };
}

module.exports = {
    playPlinko,
    playCrash,
    playMines
};
