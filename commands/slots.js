const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const GIFEncoder = require('gif-encoder-2');
const db = require('../database.js');

const SYMBOLS = {
    diamond:    { label: 'Diamond',    weight: 2,  payoutMultiplier: 100, url: 'https://i.pinimg.com/originals/20/cf/ee/20cfee0febb5569ab158efb22de375f0.gif' },
    cherry:     { label: 'Cherry',     weight: 4,  payoutMultiplier: 30,  url: 'https://cdn3.emoji.gg/emojis/154914-simplecherries.png' },
    peach:      { label: 'Peach',      weight: 5,  payoutMultiplier: 20,  url: 'https://cdn3.emoji.gg/emojis/3080-peach-blob-bite.png' },
    strawberry: { label: 'Strawberry', weight: 5,  payoutMultiplier: 15,  url: 'https://cdn3.emoji.gg/emojis/229660-strawberry.gif' },
    lemon:      { label: 'Lemon',      weight: 6,  payoutMultiplier: 10,  url: 'https://cdn3.emoji.gg/emojis/54802-happy-cute-lemon.png' },
    grape:      { label: 'Grape',      weight: 6,  payoutMultiplier: 5,   url: 'https://cdn3.emoji.gg/emojis/10435-fruitygrapes.png' }
};

const SYMBOL_KEYS = Object.keys(SYMBOLS);
const WEIGHTED_LIST = [];
SYMBOL_KEYS.forEach(key => {
    for (let i = 0; i < SYMBOLS[key].weight; i++) {
        WEIGHTED_LIST.push(key);
    }
});

let loadedImagesCache = null;
async function loadSymbolAssets() {
    if (loadedImagesCache) return loadedImagesCache;
    const assets = {};
    for (const key of SYMBOL_KEYS) {
        assets[key] = await loadImage(SYMBOLS[key].url);
    }
    loadedImagesCache = assets;
    return assets;
}

function drawSlotsFrame(ctx, reels, loadedImages, frameIndex = 0, jackpotPool = 5000, resultText = '') {
    const width = 800;
    const height = 450;

    ctx.save();

    // 1. Draw glowing pastel background grid
    ctx.fillStyle = '#fdf4ff';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(244, 114, 182, 0.2)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    for (let y = 0; y < height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    // 2. Draw outer cabinet drop shadow and chassis
    ctx.save();
    ctx.shadowColor = 'rgba(219, 39, 119, 0.4)';
    ctx.shadowBlur = 20;

    const bezelGrad = ctx.createLinearGradient(110, 20, 690, 430);
    bezelGrad.addColorStop(0, '#fbcfe8');
    bezelGrad.addColorStop(0.3, '#f472b6');
    bezelGrad.addColorStop(0.7, '#db2777');
    bezelGrad.addColorStop(1, '#9d174d');
    ctx.fillStyle = bezelGrad;
    ctx.beginPath();
    ctx.roundRect(110, 20, 580, 410, 24);
    ctx.fill();
    ctx.restore();

    const bodyGrad = ctx.createLinearGradient(120, 30, 680, 420);
    bodyGrad.addColorStop(0, '#fdf4ff');
    bodyGrad.addColorStop(0.5, '#fce7f3');
    bodyGrad.addColorStop(1, '#fdf4ff');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(120, 30, 560, 390, 20);
    ctx.fill();

    // 3. Draw cabinet marquee lights
    const bulbs = [];
    for (let x = 135; x <= 665; x += 53) bulbs.push({ x, y: 24 });
    for (let x = 665; x >= 135; x -= 53) bulbs.push({ x, y: 426 });
    for (let y = 91; y <= 359; y += 89) bulbs.push({ x: 114, y });
    for (let y = 91; y <= 359; y += 89) bulbs.push({ x: 686, y });

    bulbs.forEach((bulb, idx) => {
        const lightState = (idx + frameIndex) % 2 === 0;
        ctx.save();
        ctx.fillStyle = lightState ? '#fdf4ff' : '#f472b6';
        ctx.shadowColor = lightState ? '#ffffff' : '#db2777';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(bulb.x, bulb.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    // 4. Progressive Jackpot Display Panel
    ctx.save();
    ctx.fillStyle = '#fce7f3';
    ctx.strokeStyle = '#f472b6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(220, 48, 360, 58, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#be185d';
    ctx.font = 'bold 20px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#db2777';
    ctx.shadowBlur = 8;
    ctx.fillText(`🎰 JACKPOT: 🍒${jackpotPool.toLocaleString()}`, 400, 77);
    ctx.restore();

    // 5. Reels Panel Frame
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#f472b6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(160, 126, 480, 210, 12);
    ctx.fill();
    ctx.stroke();

    // 6. Draw 3 Reels Columns
    const reelW = 120;
    const reelH = 178;
    const positionsX = [185, 340, 495];
    const startY = 142;
    const centerY = startY + reelH / 2;
    const spacing = 110;
    const symSize = 84;

    for (let i = 0; i < 3; i++) {
        const rx = positionsX[i];

        const reelGrad = ctx.createLinearGradient(rx, startY, rx, startY + reelH);
        reelGrad.addColorStop(0, '#fdf4ff');
        reelGrad.addColorStop(0.3, '#fce7f3');
        reelGrad.addColorStop(0.7, '#fce7f3');
        reelGrad.addColorStop(1, '#fdf4ff');
        ctx.fillStyle = reelGrad;
        ctx.beginPath();
        ctx.roundRect(rx, startY, reelW, reelH, 6);
        ctx.fill();

        ctx.strokeStyle = 'rgba(244, 114, 182, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(rx, startY, reelW, reelH);

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(rx, startY, reelW, reelH, 6);
        ctx.clip();

        const reelData = reels[i];
        if (typeof reelData === 'string') {
            const img = loadedImages[reelData];
            if (img) {
                ctx.save();
                ctx.shadowColor = 'rgba(219, 39, 119, 0.3)';
                ctx.shadowBlur = 6;
                ctx.drawImage(img, rx + (reelW - symSize) / 2, centerY - symSize / 2, symSize, symSize);
                ctx.restore();
            }
        } else if (reelData && typeof reelData === 'object') {
            const { seq, distanceToStop, speed } = reelData;
            
            if (distanceToStop <= 0) {
                const finalSymbol = seq[seq.length - 1];
                const img = loadedImages[finalSymbol];
                if (img) {
                    ctx.save();
                    ctx.shadowColor = 'rgba(219, 39, 119, 0.3)';
                    ctx.shadowBlur = 6;
                    ctx.drawImage(img, rx + (reelW - symSize) / 2, centerY - symSize / 2, symSize, symSize);
                    ctx.restore();
                }
            } else {
                const finalOffset = -distanceToStop * speed;
                const shift = Math.round(finalOffset / spacing);
                const centerIdx = seq.length - 1 - distanceToStop - shift;
                const centerOffset = finalOffset - shift * spacing;

                const offsets = [
                    { idx: centerIdx - 1, y: centerY + centerOffset - spacing },
                    { idx: centerIdx, y: centerY + centerOffset },
                    { idx: centerIdx + 1, y: centerY + centerOffset + spacing }
                ];

                for (const offsetInfo of offsets) {
                    const len = seq.length;
                    const wrappedIndex = ((offsetInfo.idx % len) + len) % len;
                    const symKey = seq[wrappedIndex];
                    const img = loadedImages[symKey];
                    if (img) {
                        ctx.save();
                        ctx.shadowColor = 'rgba(219, 39, 119, 0.3)';
                        ctx.shadowBlur = 6;
                        ctx.drawImage(img, rx + (reelW - symSize) / 2, offsetInfo.y - symSize / 2, symSize, symSize);
                        ctx.restore();
                    }
                }
            }
        }
        ctx.restore();
    }

    // 7. Payline center pink neon line
    ctx.save();
    ctx.strokeStyle = '#f472b6';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#f472b6';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(165, 231);
    ctx.lineTo(635, 231);
    ctx.stroke();

    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.moveTo(150, 231 - 10);
    ctx.lineTo(164, 231);
    ctx.lineTo(150, 231 + 10);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(650, 231 - 10);
    ctx.lineTo(636, 231);
    ctx.lineTo(650, 231 + 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 8. HIGH-VISIBILITY Result Status Panel (VERY EASY TO KNOW WIN OR LOSS)
    if (resultText) {
        ctx.save();
        const isWin = resultText.includes('WON') || resultText.includes('WIN') || resultText.includes('JACKPOT');
        const isSpinning = resultText.includes('SPINNING');

        const boxColor = isSpinning ? '#fdf4ff' : (isWin ? '#dcfce7' : '#fee2e2');
        const strokeColor = isSpinning ? '#f472b6' : (isWin ? '#22c55e' : '#ef4444');
        const textColor = isSpinning ? '#db2777' : (isWin ? '#15803d' : '#b91c1c');

        ctx.fillStyle = boxColor;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3.5;
        ctx.shadowColor = strokeColor;
        ctx.shadowBlur = 14;

        ctx.beginPath();
        ctx.roundRect(180, 354, 440, 48, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = textColor;
        ctx.font = 'bold 18px "Segoe UI", "Segoe UI Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(resultText, 400, 378);
        ctx.restore();
    }

    // 9. Side Mechanical Lever
    const leverPull = frameIndex < 5;
    const shaftStartX = 680;
    const shaftStartY = 240;
    
    ctx.fillStyle = '#fbcfe8';
    ctx.beginPath();
    ctx.arc(shaftStartX, shaftStartY, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.strokeStyle = '#db2777';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    
    const shaftEndX = shaftStartX + 45;
    const shaftEndY = leverPull ? shaftStartY + 50 : shaftStartY - 50;

    ctx.beginPath();
    ctx.moveTo(shaftStartX, shaftStartY);
    ctx.lineTo(shaftEndX, shaftEndY);
    ctx.stroke();
    
    ctx.fillStyle = '#f472b6';
    ctx.shadowColor = '#db2777';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(shaftEndX, shaftEndY, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 10. Glass glare reflections overlay
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.moveTo(125, 35);
    ctx.lineTo(380, 35);
    ctx.lineTo(250, 415);
    ctx.lineTo(125, 415);
    ctx.closePath();
    ctx.fill();

    // 11. Side Panels: Paytable & Rules
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(10, 30, 95, 190, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#be185d';
    ctx.font = 'bold 10px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAYTABLE', 57, 48);

    ctx.strokeStyle = 'rgba(244, 114, 182, 0.3)';
    ctx.beginPath();
    ctx.moveTo(20, 56);
    ctx.lineTo(95, 56);
    ctx.stroke();

    const miniPaytable = [
        { emoji: '💎', mult: 'x100' },
        { emoji: '🍒', mult: 'x30' },
        { emoji: '🍑', mult: 'x20' },
        { emoji: '🍓', mult: 'x15' },
        { emoji: '🍋', mult: 'x10' },
        { emoji: '🍇', mult: 'x5' }
    ];

    miniPaytable.forEach((item, idx) => {
        const itemY = 74 + idx * 22;
        ctx.font = '15px "Segoe UI", "Segoe UI Emoji", sans-serif';
        ctx.fillText(item.emoji, 32, itemY);
        ctx.fillStyle = '#831843';
        ctx.font = 'bold 10px "Segoe UI", "Segoe UI Emoji", sans-serif';
        ctx.fillText(item.mult, 70, itemY - 3);
    });
    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(10, 230, 95, 190, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#be185d';
    ctx.font = 'bold 10px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('WIN RULES', 57, 248);

    ctx.strokeStyle = 'rgba(244, 114, 182, 0.3)';
    ctx.beginPath();
    ctx.moveTo(20, 256);
    ctx.lineTo(95, 256);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#831843';
    
    ctx.font = 'bold 9px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.fillText('3x 💎', 57, 276);
    ctx.fillStyle = '#db2777';
    ctx.font = '8px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.fillText('+JACKPOT', 57, 288);

    ctx.fillStyle = '#831843';
    ctx.font = 'bold 9px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.fillText('3x 🍋', 57, 310);
    ctx.fillStyle = '#db2777';
    ctx.font = '8px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.fillText('+5 SPINS', 57, 322);

    ctx.fillStyle = '#831843';
    ctx.font = 'bold 9px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.fillText('2x MATCH', 57, 344);
    ctx.fillStyle = '#db2777';
    ctx.font = '8px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.fillText('x2.5 payout', 57, 356);

    ctx.fillStyle = '#831843';
    ctx.font = 'bold 9px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.fillText('ANY 🍒', 57, 378);
    ctx.fillStyle = '#db2777';
    ctx.font = '8px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.fillText('x1.2 mini win', 57, 390);

    ctx.restore();
    ctx.restore();
}

async function generateAnimatedSlots(finalReels, loadedImages, jackpotPool = 5000, resultText = '') {
    const encoder = new GIFEncoder(800, 450);
    const canvas = createCanvas(800, 450);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;

    encoder.setRepeat(0);
    encoder.setDelay(60);
    encoder.start();

    const totalFrames = 20;
    const speed = 40;

    const seqs = [];
    for (let i = 0; i < 3; i++) {
        const seq = [];
        for (let j = 0; j < 30; j++) {
            seq.push(SYMBOL_KEYS[Math.floor(Math.random() * SYMBOL_KEYS.length)]);
        }
        seq.push(finalReels[i]);
        seqs.push(seq);
    }

    const stopFrames = [10, 14, 18];

    for (let f = 0; f < totalFrames; f++) {
        const currentReels = [];
        for (let i = 0; i < 3; i++) {
            const distanceToStop = stopFrames[i] - f;
            currentReels.push({
                seq: seqs[i],
                distanceToStop: distanceToStop,
                speed: speed
            });
        }

        drawSlotsFrame(ctx, currentReels, loadedImages, f, jackpotPool, 'SPINNING...');
        encoder.addFrame(ctx);
    }

    encoder.setDelay(3000);
    drawSlotsFrame(ctx, finalReels, loadedImages, 1, jackpotPool, resultText);
    encoder.addFrame(ctx);

    encoder.finish();
    return encoder.out.getData();
}

function generateStaticSlots(finalReels, loadedImages, jackpotPool = 5000, resultText = '') {
    const canvas = createCanvas(800, 450);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    drawSlotsFrame(ctx, finalReels, loadedImages, 1, jackpotPool, resultText);
    return canvas.toBuffer('image/png');
}

function buildControlRows(baseBet, multiplier, payout = 0, isWin = false) {
    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`slots_spin_${baseBet}_${multiplier}_normal`)
            .setLabel('🎰 Spin Again')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId(`slots_spin_${baseBet}_${multiplier}_fast`)
            .setLabel('⚡ Fast Spin')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(`slots_spin_${baseBet}_${multiplier}_multi5`)
            .setLabel('🔁 Auto Spin 5x')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(`slots_betdouble_${baseBet}_${multiplier}`)
            .setLabel('➕ 2x Bet')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(`slots_bethalf_${baseBet}_${multiplier}`)
            .setLabel('➖ 0.5x Bet')
            .setStyle(ButtonStyle.Secondary)
    );

    const rows = [row1];

    if (isWin && payout > 0) {
        const totalWager = baseBet * multiplier;
        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`slots_gamble_${payout}_${totalWager}_${baseBet}_${multiplier}`)
                .setLabel('🃏 Gamble (Double or Nothing)')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId(`slots_cashout_${payout}`)
                .setLabel('💰 Cash Out Winnings')
                .setStyle(ButtonStyle.Success)
        );
        rows.push(row2);
    }

    return rows;
}

function getSymbolEmoji(symbolKey) {
    switch(symbolKey) {
        case 'diamond': return '💎';
        case 'cherry': return '🍒';
        case 'peach': return '🍑';
        case 'strawberry': return '🍓';
        case 'lemon': return '🍋';
        case 'grape': return '🍇';
        default: return '❓';
    }
}

function resolveSpinOutcome(baseBet, multiplier, userId, guildId) {
    const totalWager = Math.max(1, baseBet * multiplier);

    let reel1 = WEIGHTED_LIST[Math.floor(Math.random() * WEIGHTED_LIST.length)];
    let reel2 = WEIGHTED_LIST[Math.floor(Math.random() * WEIGHTED_LIST.length)];
    let reel3 = WEIGHTED_LIST[Math.floor(Math.random() * WEIGHTED_LIST.length)];

    const char = db.getCharacter(userId);
    const hasLuckBuff = char && char.luck_buff_expiry > Date.now();

    // Easy Playing: Luck buff or random 20% boost to turn near-misses into winning 3-matches
    if ((hasLuckBuff || Math.random() < 0.20) && !(reel1 === reel2 && reel2 === reel3)) {
        const winningSymbols = ['cherry', 'peach', 'strawberry', 'lemon', 'grape'];
        const chosen = winningSymbols[Math.floor(Math.random() * winningSymbols.length)];
        reel1 = chosen;
        reel2 = chosen;
        reel3 = chosen;
    }

    const finalReels = [reel1, reel2, reel3];
    const reelEmojisStr = `\` [ ${getSymbolEmoji(reel1)}  |  ${getSymbolEmoji(reel2)}  |  ${getSymbolEmoji(reel3)} ] \``;

    let questProgressText = '';
    if (char && char.active_quest_id === 'slots_3') {
        db.incrementQuestProgress(userId, 1);
        const currentProgress = (char.quest_progress || 0) + 1;
        questProgressText = `\n• Quest Progress: \` Jackpot Chaser (${currentProgress}/3) \``;
        if (currentProgress >= 3) {
            questProgressText += ` (Completed! Run \`/quest claim\` for rewards)`;
        }
    }

    let isWin = false;
    let isJackpot = false;
    let isFreeSpins = false;
    let payout = 0;
    let resultMsg = '';
    let statusHeader = '';
    let canvasStatusText = '';
    let finalColor = '#E74C3C'; // Bright Red for Loss

    const currentJackpot = db.getSlotsJackpot();

    // 1. 3-of-a-kind Win
    if (reel1 === reel2 && reel2 === reel3) {
        isWin = true;
        if (reel1 === 'diamond') {
            isJackpot = true;
            payout = (totalWager * 100) + currentJackpot;
            statusHeader = `🏆 **JACKPOT WINNER!** (+🍒 ${payout.toLocaleString()})`;
            canvasStatusText = `🏆 JACKPOT! +🍒${payout.toLocaleString()} 🏆`;
            resultMsg = `🏆 **PROGRESSIVE JACKPOT!** You matched 3x **Diamonds**!\nAwarded standard payout (🍒 **${(totalWager * 100).toLocaleString()}**) + progressive jackpot pool of 🍒 **${currentJackpot.toLocaleString()}** cherries!`;
            finalColor = '#FFD700'; // Gold
            db.resetSlotsJackpot();
        } else if (reel1 === 'lemon') {
            isFreeSpins = true;
            payout = totalWager * 10;
            statusHeader = `🟢 **YOU WON!** (+🍒 ${payout.toLocaleString()})`;
            canvasStatusText = `🟢 WON +🍒${payout.toLocaleString()} (LEMON BONUS) 🟢`;
            resultMsg = `🍋 **LEMON TWIST BONUS!** You matched 3x **Lemons**!\nWins: 🍒 **${payout.toLocaleString()}** cherries AND triggers **5 Free Spins** with doubled payouts!`;
            finalColor = '#2ECC71'; // Bright Green
        } else {
            const mult = SYMBOLS[reel1].payoutMultiplier;
            payout = totalWager * mult;
            statusHeader = `🟢 **YOU WON!** (+🍒 ${payout.toLocaleString()})`;
            canvasStatusText = `🟢 WON +🍒${payout.toLocaleString()} CHERRIES 🟢`;
            resultMsg = `🎉 **3-OF-A-KIND!** You matched 3x **${SYMBOLS[reel1].label}**! Payout multiplier: \`x${mult}\`. You won 🍒 **${payout.toLocaleString()}** cherries!`;
            finalColor = '#2ECC71'; // Bright Green
        }
    } 
    // 2. Adjacent 2-Match Win
    else if (reel1 === reel2 || reel2 === reel3) {
        isWin = true;
        payout = Math.floor(totalWager * 2.5);
        statusHeader = `🟢 **YOU WON!** (+🍒 ${payout.toLocaleString()})`;
        canvasStatusText = `🟢 WON +🍒${payout.toLocaleString()} (2-MATCH) 🟢`;
        resultMsg = `✨ **Adjacent Match!** You matched 2 adjacent reels! Payout multiplier: \`x2.5\`. You won 🍒 **${payout.toLocaleString()}** cherries!`;
        finalColor = '#2ECC71'; // Bright Green
    }
    // 3. Split 2-Match Win
    else if (reel1 === reel3) {
        isWin = true;
        payout = Math.floor(totalWager * 2.0);
        statusHeader = `🟢 **YOU WON!** (+🍒 ${payout.toLocaleString()})`;
        canvasStatusText = `🟢 WON +🍒${payout.toLocaleString()} (SPLIT PAIR) 🟢`;
        resultMsg = `✨ **Split Pair Match!** You matched outer reels! Payout multiplier: \`x2.0\`. You won 🍒 **${payout.toLocaleString()}** cherries!`;
        finalColor = '#2ECC71'; // Bright Green
    }
    // 4. Wild Cherry Mini Win (Any Cherry symbol)
    else if (reel1 === 'cherry' || reel2 === 'cherry' || reel3 === 'cherry') {
        isWin = true;
        payout = Math.floor(totalWager * 1.2);
        statusHeader = `🟢 **YOU WON!** (+🍒 ${payout.toLocaleString()})`;
        canvasStatusText = `🟢 MINI WIN +🍒${payout.toLocaleString()} 🟢`;
        resultMsg = `🍒 **Wild Cherry Bonus!** Cherry on the reels returned 🍒 **${payout.toLocaleString()}** cherries! (\`x1.2\`)`;
        finalColor = '#2ECC71'; // Bright Green
    }
    // 5. No Match (Loss)
    else {
        payout = 0;
        statusHeader = `🔴 **YOU LOST!** (-🍒 ${totalWager.toLocaleString()})`;
        canvasStatusText = `🔴 NO MATCH - YOU LOST 🔴`;
        const poolAddition = Math.max(1, Math.floor(totalWager * 0.1));
        db.addToSlotsJackpot(poolAddition);
        resultMsg = `❌ **No Matches.** You lost 🍒 **${totalWager.toLocaleString()}** cherries.\n*(🍒 ${poolAddition.toLocaleString()} added to jackpot pool!)*`;
        finalColor = '#E74C3C'; // Bold Crimson Red
    }

    db.deductCoins(userId, guildId, totalWager);
    if (payout > 0) {
        db.addCoins(userId, guildId, payout);
    }
    db.prepare("UPDATE users SET slots_spins = slots_spins + 1, slots_won_coins = slots_won_coins + ? WHERE userId = ?").run(payout, userId);

    const xpReward = isWin ? 30 : 15;
    const levelResult = db.addXp(userId, guildId, xpReward);

    return {
        finalReels,
        reelEmojisStr,
        totalWager,
        isWin,
        isJackpot,
        isFreeSpins,
        payout,
        statusHeader,
        canvasStatusText,
        resultMsg,
        finalColor,
        currentJackpot,
        xpReward,
        levelResult,
        questProgressText
    };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slots')
        .setDescription('🎰 Wager your cherries on an easy-to-win multi Slot Machine!')
        .addIntegerOption(option =>
            option.setName('bet')
                .setDescription('Base bet amount of cherries')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('multiplier')
                .setDescription('Bet multiplier (1x, 2x, 3x, 5x, 10x, 25x, 50x, 100x)')
                .setRequired(false)
                .addChoices(
                    { name: '1x', value: 1 },
                    { name: '2x', value: 2 },
                    { name: '3x', value: 3 },
                    { name: '5x', value: 5 },
                    { name: '10x', value: 10 },
                    { name: '25x', value: 25 },
                    { name: '50x', value: 50 },
                    { name: '100x', value: 100 }
                ))
        .addIntegerOption(option =>
            option.setName('spins')
                .setDescription('Number of auto-spins (1 to 10)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(10)),

    async execute(interaction) {
        await interaction.deferReply();

        const userId = interaction.user.id;
        const guildId = interaction.guild ? interaction.guild.id : 'GLOBAL';
        
        let baseBet = interaction.options.getInteger('bet');
        let multiplier = interaction.options.getInteger('multiplier') || 1;
        let spinsCount = interaction.options.getInteger('spins') || 1;

        if (baseBet <= 0) {
            return interaction.editReply({ content: '❌ Wager must be greater than 0!' });
        }

        const totalWagerNeeded = baseBet * multiplier * spinsCount;
        const currentBalance = db.getBalance(userId, guildId);

        if (currentBalance < totalWagerNeeded) {
            return interaction.editReply({ 
                content: `❌ Insufficient funds! Wager needed: 🍒 **${totalWagerNeeded.toLocaleString()}** (${spinsCount}x spin @ 🍒${(baseBet * multiplier).toLocaleString()}/spin). Current Balance: 🍒 **${currentBalance.toLocaleString()}** cherries.` 
            });
        }

        const loadedImages = await loadSymbolAssets();

        if (spinsCount > 1) {
            return await runMultiSpinSession(interaction, userId, guildId, baseBet, multiplier, spinsCount, loadedImages);
        }

        await executeSingleSpin(interaction, userId, guildId, baseBet, multiplier, false, loadedImages);
    }
};

async function runMultiSpinSession(interaction, userId, guildId, baseBet, multiplier, spinsCount, loadedImages) {
    const singleWager = baseBet * multiplier;
    let totalWagered = 0;
    let totalWon = 0;
    let winCount = 0;
    let jackpotHits = 0;
    const spinSummaries = [];

    let lastReels = ['cherry', 'cherry', 'cherry'];

    for (let i = 1; i <= spinsCount; i++) {
        const balanceNow = db.getBalance(userId, guildId);
        if (balanceNow < singleWager) {
            spinSummaries.push(`• **Spin #${i}**: ⚠️ Stopped (Insufficient funds)`);
            break;
        }

        const res = resolveSpinOutcome(baseBet, multiplier, userId, guildId);
        lastReels = res.finalReels;
        totalWagered += res.totalWager;
        totalWon += res.payout;

        if (res.isWin) winCount++;
        if (res.isJackpot) jackpotHits++;

        const reelEmojis = res.finalReels.map(r => getSymbolEmoji(r)).join(' ');

        if (res.isJackpot) {
            spinSummaries.push(`• **Spin #${i}**: \`[ ${reelEmojis} ]\` 🏆 **JACKPOT!** (+🍒 **${res.payout.toLocaleString()}**)`);
        } else if (res.isWin) {
            spinSummaries.push(`• **Spin #${i}**: \`[ ${reelEmojis} ]\` 🟢 **WON** (+🍒 **${res.payout.toLocaleString()}**)`);
        } else {
            spinSummaries.push(`• **Spin #${i}**: \`[ ${reelEmojis} ]\` 🔴 **LOST** (-🍒 **${res.totalWager.toLocaleString()}**)`);
        }
    }

    const netProfit = totalWon - totalWagered;
    const finalJackpot = db.getSlotsJackpot();
    const finalBalance = db.getBalance(userId, guildId);

    const isMultiWin = netProfit >= 0;
    const multiCanvasText = isMultiWin ? `🟢 MULTI WIN: +🍒${totalWon.toLocaleString()} 🟢` : `🔴 MULTI SPIN LOSS 🔴`;
    const staticPng = generateStaticSlots(lastReels, loadedImages, finalJackpot, multiCanvasText);
    const attachment = new AttachmentBuilder(staticPng, { name: 'multi-slots.png' });

    const multiEmbed = new EmbedBuilder()
        .setColor(isMultiWin ? '#2ECC71' : '#E74C3C')
        .setTitle(isMultiWin ? `🟢 MULTI-SPIN PROFIT: +🍒 ${netProfit.toLocaleString()}` : `🔴 MULTI-SPIN LOSS: -🍒 ${Math.abs(netProfit).toLocaleString()}`)
        .setDescription(
            (isMultiWin ? `# 🟢 **MULTI-SPIN WINNER!** 🟢\n` : `# 🔴 **MULTI-SPIN SESSION ENDED** 🔴\n`) +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `👤 **Player:** <@${userId}>\n` +
            `🎰 **Spins Executed:** \` ${spinSummaries.length} \` | **Bet Multiplier:** \` ${multiplier}x \`\n` +
            `💰 **Total Wagered:** \` 🍒 ${totalWagered.toLocaleString()} \` cherries\n` +
            `🎉 **Total Payout:** \` 🍒 ${totalWon.toLocaleString()} \` cherries\n` +
            `📈 **Net Profit/Loss:** \` ${netProfit >= 0 ? '+🍒 ' : '-🍒 '}${Math.abs(netProfit).toLocaleString()} \` cherries\n` +
            `💎 **Jackpot Pool:** \` 🍒 ${finalJackpot.toLocaleString()} \` cherries\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `📋 **Spin Outcomes:**\n` +
            spinSummaries.join('\n') + `\n\n` +
            `📈 **Ledger Update:**\n` +
            `• New Balance: \` 🍒 ${finalBalance.toLocaleString()} \` cherries`
        )
        .setImage('attachment://multi-slots.png')
        .setFooter({ text: 'Multi Slots Auto Engine ┃ Win/Loss Clear Indicator' })
        .setTimestamp();

    const controlRows = buildControlRows(baseBet, multiplier, totalWon, totalWon > 0);

    const replyMsg = await interaction.editReply({ embeds: [multiEmbed], files: [attachment], components: controlRows });
    setupButtonCollector(replyMsg, interaction, userId, guildId, baseBet, multiplier, loadedImages);
}

async function executeSingleSpin(interaction, userId, guildId, baseBet, multiplier, isFast = false, loadedImages) {
    try {
        const totalWager = baseBet * multiplier;
        const currentBalance = db.getBalance(userId, guildId);

        if (currentBalance < totalWager) {
            const errContent = `❌ Insufficient funds for wager 🍒 **${totalWager.toLocaleString()}** (Bet: ${baseBet} x ${multiplier}x). Current Balance: 🍒 **${currentBalance.toLocaleString()}** cherries.`;
            if (interaction.deferred || interaction.replied) {
                return await interaction.editReply({ content: errContent, embeds: [], files: [], components: [] });
            } else {
                return await interaction.reply({ content: errContent, flags: [1 << 6] });
            }
        }

        const res = resolveSpinOutcome(baseBet, multiplier, userId, guildId);
        const updatedJackpot = db.getSlotsJackpot();
        const newBalance = db.getBalance(userId, guildId);

        let attachment;
        if (isFast) {
            const pngBuffer = generateStaticSlots(res.finalReels, loadedImages, updatedJackpot, res.canvasStatusText);
            attachment = new AttachmentBuilder(pngBuffer, { name: 'fast-slots.png' });
        } else {
            const gifBuffer = await generateAnimatedSlots(res.finalReels, loadedImages, updatedJackpot, res.canvasStatusText);
            attachment = new AttachmentBuilder(gifBuffer, { name: 'slots.gif' });
        }

        const imageName = isFast ? 'fast-slots.png' : 'slots.gif';

        const netProfit = res.payout - res.totalWager;
        const bannerLine = res.isWin 
            ? `# 🟢 **YOU WON +🍒 ${res.payout.toLocaleString()}** 🟢` 
            : `# 🔴 **YOU LOST -🍒 ${res.totalWager.toLocaleString()}** 🔴`;

        const embed = new EmbedBuilder()
            .setColor(res.finalColor)
            .setTitle(res.statusHeader)
            .setDescription(
                `${bannerLine}\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                `🎰 **Reels Result:** ${res.reelEmojisStr}\n` +
                `👤 **Player:** <@${userId}>\n` +
                `🍒 **Base Bet:** \` ${baseBet.toLocaleString()} \` | **Multiplier:** \` ${multiplier}x \`\n` +
                `💰 **Total Wager:** \` 🍒 ${res.totalWager.toLocaleString()} \` cherries\n` +
                `🎉 **Payout Winnings:** \` 🍒 ${res.payout.toLocaleString()} \` cherries\n` +
                `📈 **Net Outcome:** \` ${netProfit >= 0 ? '+🍒 ' : '-🍒 '}${Math.abs(netProfit).toLocaleString()} \` cherries\n` +
                `💎 **Jackpot Pool:** \` 🍒 ${updatedJackpot.toLocaleString()} \` cherries\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                `${res.resultMsg}\n\n` +
                `📈 **Ledger Update:**\n` +
                `• New Balance: \` 🍒 ${newBalance.toLocaleString()} \` cherries\n` +
                `• Experience: \` +${res.xpReward} XP \`` +
                res.questProgressText
            )
            .setImage(`attachment://${imageName}`)
            .setFooter({ text: res.isWin ? '🟢 WIN RESULT — Click buttons below to spin again or cashout' : '🔴 LOSS RESULT — Click Spin Again or 2x Bet to retry' })
            .setTimestamp();

        if (res.levelResult && res.levelResult.leveledUp) {
            embed.addFields({ name: '🚀 RANK ADVANCEMENT!', value: `You leveled up to **Level ${res.levelResult.newLevel}**!`, inline: false });
        }

        // Handle Lemon Twist Free Spins
        if (res.isFreeSpins) {
            await interaction.editReply({ embeds: [embed], files: [attachment], components: [] });

            let totalFreeSpinsWon = 0;
            const freeSpinsCount = 5;

            for (let i = 1; i <= freeSpinsCount; i++) {
                await new Promise(resolve => setTimeout(resolve, 2500));

                const fsReel1 = WEIGHTED_LIST[Math.floor(Math.random() * WEIGHTED_LIST.length)];
                const fsReel2 = WEIGHTED_LIST[Math.floor(Math.random() * WEIGHTED_LIST.length)];
                const fsReel3 = WEIGHTED_LIST[Math.floor(Math.random() * WEIGHTED_LIST.length)];

                let fsPayout = 0;
                let fsMsg = '';
                if (fsReel1 === fsReel2 && fsReel2 === fsReel3) {
                    const mult = SYMBOLS[fsReel1].payoutMultiplier;
                    fsPayout = (totalWager * mult) * 2;
                    fsMsg = ` matched 3x **${SYMBOLS[fsReel1].label}**! (Doubled: +🍒 **${fsPayout.toLocaleString()}**)`;
                } else if (fsReel1 === fsReel2 || fsReel2 === fsReel3 || fsReel1 === fsReel3) {
                    fsPayout = Math.floor(totalWager * 2.5) * 2;
                    fsMsg = ` matched 2 reels! (Doubled: +🍒 **${fsPayout.toLocaleString()}**)`;
                } else if (fsReel1 === 'cherry' || fsReel2 === 'cherry' || fsReel3 === 'cherry') {
                    fsPayout = Math.floor(totalWager * 1.2) * 2;
                    fsMsg = ` matched Wild Cherry! (Doubled: +🍒 **${fsPayout.toLocaleString()}**)`;
                } else {
                    fsMsg = ` did not match (0 cherries)`;
                }

                totalFreeSpinsWon += fsPayout;

                const fsJackpot = db.getSlotsJackpot();
                const fsCanvasText = fsPayout > 0 ? `🟢 FREE WIN: +🍒${fsPayout.toLocaleString()} 🟢` : '🔴 NO MATCH 🔴';
                const fsGifBuffer = await generateAnimatedSlots([fsReel1, fsReel2, fsReel3], loadedImages, fsJackpot, fsCanvasText);
                const fsAttachment = new AttachmentBuilder(fsGifBuffer, { name: `fs-${i}.gif` });

                const fsEmbed = new EmbedBuilder()
                    .setColor(fsPayout > 0 ? '#2ECC71' : '#E74C3C')
                    .setTitle(`🍋 LEMON TWIST: FREE SPIN ${i}/${freeSpinsCount}`)
                    .setDescription(
                        `🎀 **Free Spins Active!** (No cherries wagered, payouts doubled!)\n\n` +
                        `• Reels Result: \`[ ${getSymbolEmoji(fsReel1)} | ${getSymbolEmoji(fsReel2)} | ${getSymbolEmoji(fsReel3)} ]\`\n` +
                        `• Spin Result: ${fsMsg}\n` +
                        `• Accumulated Bonus Winnings: 🟢 🍒 **${totalFreeSpinsWon.toLocaleString()}** cherries`
                    )
                    .setImage(`attachment://fs-${i}.gif`)
                    .setTimestamp();

                await interaction.editReply({ embeds: [fsEmbed], files: [fsAttachment] });
            }

            if (totalFreeSpinsWon > 0) {
                db.addCoins(userId, guildId, totalFreeSpinsWon);
            }

            const finalFreeSpinsEmbed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setTitle('🍋 LEMON TWIST: BONUS CONCLUDED!')
                .setDescription(
                    `# 🟢 **BONUS ROUND FINISHED** 🟢\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                    `You successfully accumulated:\n` +
                    `💰 **\` 🍒 ${totalFreeSpinsWon.toLocaleString()} \` cherries!**\n` +
                    `Your total wallet payout has been credited.\n\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━━━━━`
                );

            const controlRows = buildControlRows(baseBet, multiplier, totalFreeSpinsWon, false);
            const fsMsgObj = await interaction.editReply({ embeds: [finalFreeSpinsEmbed], files: [], components: controlRows });
            return setupButtonCollector(fsMsgObj, interaction, userId, guildId, baseBet, multiplier, loadedImages);
        }

        const controlRows = buildControlRows(baseBet, multiplier, res.payout, res.isWin && !res.isJackpot);
        const replyMsg = await interaction.editReply({ embeds: [embed], files: [attachment], components: controlRows });
        setupButtonCollector(replyMsg, interaction, userId, guildId, baseBet, multiplier, loadedImages);

    } catch (error) {
        console.error('Slots game execution error:', error);
        await interaction.editReply({ content: '❌ An error occurred while spinning the reels.', embeds: [], files: [], components: [] });
    }
}

function setupButtonCollector(replyMsg, interaction, userId, guildId, baseBet, multiplier, loadedImages) {
    if (!replyMsg) return;

    const collector = replyMsg.createMessageComponentCollector({
        filter: i => i.user.id === userId,
        time: 120000
    });

    collector.on('collect', async (i) => {
        try {
            await i.deferUpdate();

            const customId = i.customId;

            if (customId.startsWith('slots_spin_') && customId.endsWith('_normal')) {
                const parts = customId.split('_');
                const b = parseInt(parts[2]);
                const m = parseInt(parts[3]);
                collector.stop();
                await executeSingleSpin(interaction, userId, guildId, b, m, false, loadedImages);
            }
            else if (customId.startsWith('slots_spin_') && customId.endsWith('_fast')) {
                const parts = customId.split('_');
                const b = parseInt(parts[2]);
                const m = parseInt(parts[3]);
                collector.stop();
                await executeSingleSpin(interaction, userId, guildId, b, m, true, loadedImages);
            }
            else if (customId.startsWith('slots_spin_') && customId.endsWith('_multi5')) {
                const parts = customId.split('_');
                const b = parseInt(parts[2]);
                const m = parseInt(parts[3]);
                collector.stop();
                await runMultiSpinSession(interaction, userId, guildId, b, m, 5, loadedImages);
            }
            else if (customId.startsWith('slots_betdouble_')) {
                const parts = customId.split('_');
                const b = parseInt(parts[2]);
                const m = parseInt(parts[3]) * 2;
                collector.stop();
                await executeSingleSpin(interaction, userId, guildId, b, m, true, loadedImages);
            }
            else if (customId.startsWith('slots_bethalf_')) {
                const parts = customId.split('_');
                const b = parseInt(parts[2]);
                const m = Math.max(1, Math.floor(parseInt(parts[3]) / 2));
                collector.stop();
                await executeSingleSpin(interaction, userId, guildId, b, m, true, loadedImages);
            }
            else if (customId.startsWith('slots_gamble_')) {
                const parts = customId.split('_');
                const currentWinnings = parseInt(parts[2]);
                const totalWager = parseInt(parts[3]);
                const b = parseInt(parts[4]);
                const m = parseInt(parts[5]);

                const gambleWin = Math.random() < 0.5;

                if (gambleWin) {
                    const doubledWinnings = currentWinnings * 2;
                    db.addCoins(userId, guildId, currentWinnings);

                    const winEmbed = new EmbedBuilder()
                        .setColor('#2ECC71')
                        .setTitle('🃏 GAMBLE: WON!')
                        .setDescription(
                            `# 🟢 **GAMBLE SUCCESSFUL!** 🟢\n` +
                            `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                            `✨ **The coin landed on HEADS!** ✨\n\n` +
                            `Your winnings doubled to:\n` +
                            `💰 **\` 🍒 ${doubledWinnings.toLocaleString()} \` cherries!**\n\n` +
                            `━━━━━━━━━━━━━━━━━━━━━━━━━━`
                        )
                        .setTimestamp();

                    const nextRows = buildControlRows(b, m, doubledWinnings, true);
                    await i.editReply({ embeds: [winEmbed], components: nextRows, files: [] });
                } else {
                    db.deductCoins(userId, guildId, currentWinnings);

                    const loseEmbed = new EmbedBuilder()
                        .setColor('#E74C3C')
                        .setTitle('🃏 GAMBLE: LOST...')
                        .setDescription(
                            `# 🔴 **GAMBLE FAILED** 🔴\n` +
                            `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                            `❌ **The coin landed on TAILS.** ❌\n` +
                            `You lost all winnings from this round.\n\n` +
                            `━━━━━━━━━━━━━━━━━━━━━━━━━━`
                        )
                        .setTimestamp();

                    const nextRows = buildControlRows(b, m, 0, false);
                    await i.editReply({ embeds: [loseEmbed], components: nextRows, files: [] });
                }
            }
            else if (customId.startsWith('slots_cashout_')) {
                const parts = customId.split('_');
                const finalWinnings = parseInt(parts[2]);

                const cashoutEmbed = new EmbedBuilder()
                    .setColor('#2ECC71')
                    .setTitle('💰 CASHOUT SUCCESSFUL')
                    .setDescription(
                        `# 💵 **CASHOUT SECURED** 💵\n` +
                        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                        `You successfully cashed out:\n` +
                        `💰 **\` 🍒 ${finalWinnings.toLocaleString()} \` cherries!**\n\n` +
                        `━━━━━━━━━━━━━━━━━━━━━━━━━━`
                    )
                    .setTimestamp();

                const nextRows = buildControlRows(baseBet, multiplier, 0, false);
                await i.editReply({ embeds: [cashoutEmbed], components: nextRows, files: [] });
            }
        } catch (err) {
            console.error('Error handling slots button:', err);
        }
    });

    collector.on('end', async (collected, reason) => {
        if (reason === 'time') {
            await interaction.editReply({ components: [] }).catch(() => {});
        }
    });
}
