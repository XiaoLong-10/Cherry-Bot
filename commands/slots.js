const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const GIFEncoder = require('gif-encoder-2');
const db = require('../database.js');

const SYMBOLS = {
    diamond:    { label: 'Diamond',    weight: 1,  payoutMultiplier: 50,  url: 'https://i.pinimg.com/originals/20/cf/ee/20cfee0febb5569ab158efb22de375f0.gif' },
    cherry:     { label: 'Cherry',     weight: 2,  payoutMultiplier: 15,  url: 'https://cdn3.emoji.gg/emojis/154914-simplecherries.png' },
    peach:      { label: 'Peach',      weight: 3,  payoutMultiplier: 10,  url: 'https://cdn3.emoji.gg/emojis/3080-peach-blob-bite.png' },
    strawberry: { label: 'Strawberry', weight: 4,  payoutMultiplier: 5,   url: 'https://cdn3.emoji.gg/emojis/229660-strawberry.gif' },
    lemon:      { label: 'Lemon',      weight: 5,  payoutMultiplier: 3,   url: 'https://cdn3.emoji.gg/emojis/54802-happy-cute-lemon.png' },
    grape:      { label: 'Grape',      weight: 5,  payoutMultiplier: 2,   url: 'https://cdn3.emoji.gg/emojis/10435-fruitygrapes.png' }
};

const SYMBOL_KEYS = Object.keys(SYMBOLS);
const WEIGHTED_LIST = [];
SYMBOL_KEYS.forEach(key => {
    for (let i = 0; i < SYMBOLS[key].weight; i++) {
        WEIGHTED_LIST.push(key);
    }
});

async function loadSymbolAssets() {
    const assets = {};
    for (const key of SYMBOL_KEYS) {
        assets[key] = await loadImage(SYMBOLS[key].url);
    }
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

    // Cabinet Outer Bezel (Pink/Rose Gradient)
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

    // Cabinet Inner Body Panel (Soft Pastel Pink)
    const bodyGrad = ctx.createLinearGradient(120, 30, 680, 420);
    bodyGrad.addColorStop(0, '#fdf4ff');
    bodyGrad.addColorStop(0.5, '#fce7f3');
    bodyGrad.addColorStop(1, '#fdf4ff');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(120, 30, 560, 390, 20);
    ctx.fill();

    // 3. Draw cabinet marquee lights (alternating color bulbs)
    const bulbs = [];
    // Top row bulbs (11 bulbs)
    for (let x = 135; x <= 665; x += 53) bulbs.push({ x, y: 24 });
    // Bottom row bulbs (11 bulbs)
    for (let x = 665; x >= 135; x -= 53) bulbs.push({ x, y: 426 });
    // Left column bulbs (3 bulbs)
    for (let y = 91; y <= 359; y += 89) bulbs.push({ x: 114, y });
    // Right column bulbs (3 bulbs)
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

    // Led lights glow
    ctx.fillStyle = '#be185d';
    ctx.font = 'bold 20px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#db2777';
    ctx.shadowBlur = 8;
    ctx.fillText(`🎰 JACKPOT: 🍒${jackpotPool.toLocaleString()}`, 400, 77);
    ctx.restore();

    // 5. Reels Panel Frame (White and Pink)
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
    const centerY = startY + reelH / 2; // 231
    const spacing = 110;
    const symSize = 84;

    for (let i = 0; i < 3; i++) {
        const rx = positionsX[i];

        // Reel column vertical shadow gradient
        const reelGrad = ctx.createLinearGradient(rx, startY, rx, startY + reelH);
        reelGrad.addColorStop(0, '#fdf4ff');
        reelGrad.addColorStop(0.3, '#fce7f3');
        reelGrad.addColorStop(0.7, '#fce7f3');
        reelGrad.addColorStop(1, '#fdf4ff');
        ctx.fillStyle = reelGrad;
        ctx.beginPath();
        ctx.roundRect(rx, startY, reelW, reelH, 6);
        ctx.fill();

        // Inner frame stroke
        ctx.strokeStyle = 'rgba(244, 114, 182, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(rx, startY, reelW, reelH);

        // Draw symbol(s) with clipping to the reel viewport
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(rx, startY, reelW, reelH, 6);
        ctx.clip();

        const reelData = reels[i];
        if (typeof reelData === 'string') {
            // Stopped state - draw single centered symbol
            const img = loadedImages[reelData];
            if (img) {
                ctx.save();
                ctx.shadowColor = 'rgba(219, 39, 119, 0.3)';
                ctx.shadowBlur = 6;
                ctx.drawImage(img, rx + (reelW - symSize) / 2, centerY - symSize / 2, symSize, symSize);
                ctx.restore();
            }
        } else if (reelData && typeof reelData === 'object') {
            // Spinning state
            const { seq, distanceToStop, speed } = reelData;
            
            if (distanceToStop <= 0) {
                // Stopped
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

                // Draw 3 symbols: center, above, and below
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

    // Arrow markers
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

    // 8. Result Status Panel (Bottom center)
    if (resultText) {
        ctx.save();
        ctx.fillStyle = '#fdf4ff';
        ctx.beginPath();
        ctx.roundRect(240, 354, 320, 48, 8);
        ctx.fill();

        const isWin = resultText.includes('WIN') || resultText.includes('JACKPOT');
        ctx.fillStyle = isWin ? '#db2777' : (resultText.includes('SPINNING') ? '#f472b6' : '#9d174d');
        ctx.font = 'bold 16px "Segoe UI", "Segoe UI Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(resultText, 400, 378);
        ctx.restore();
    }

    // 9. Side Mechanical Lever (Animated pull/release)
    const leverPull = frameIndex < 5; // Pulled down in early spin frames
    const shaftStartX = 680;
    const shaftStartY = 240;
    
    // Draw base plate of the lever
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
    
    // Draw red handle ball
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

    // 11. Side Panels on Left: Paytable & Rules (stacked to avoid lever collision on right)
    // Paytable Box (Top Left)
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
        { emoji: '💎', mult: 'x50' },
        { emoji: '🍒', mult: 'x15' },
        { emoji: '🍑', mult: 'x10' },
        { emoji: '🍓', mult: 'x5' },
        { emoji: '🍋', mult: 'x3' },
        { emoji: '🍇', mult: 'x2' }
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

    // Rules Box (Bottom Left)
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
    
    // Rule 1
    ctx.font = 'bold 9px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.fillText('3x 💎', 57, 276);
    ctx.fillStyle = '#db2777';
    ctx.font = '8px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.fillText('+JACKPOT', 57, 288);

    // Rule 2
    ctx.fillStyle = '#831843';
    ctx.font = 'bold 9px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.fillText('3x 🍋', 57, 310);
    ctx.fillStyle = '#db2777';
    ctx.font = '8px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.fillText('+5 SPINS', 57, 322);

    // Rule 3
    ctx.fillStyle = '#831843';
    ctx.font = 'bold 9px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.fillText('2x MATCH', 57, 344);
    ctx.fillStyle = '#db2777';
    ctx.font = '8px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.fillText('x1.5 payout', 57, 356);

    // Rule 4
    ctx.fillStyle = '#831843';
    ctx.font = 'bold 9px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.fillText('NO MATCH', 57, 378);
    ctx.fillStyle = '#db2777';
    ctx.font = '8px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.fillText('10% roll-in', 57, 390);

    ctx.restore();

    ctx.restore();
}

async function generateAnimatedSlots(finalReels, loadedImages, jackpotPool = 5000, resultText = '') {
    const encoder = new GIFEncoder(800, 450);
    const canvas = createCanvas(800, 450);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;

    encoder.setRepeat(0);
    encoder.setDelay(60); // 60ms delay per frame = ~16.6 FPS (smooth)
    encoder.start();

    const totalFrames = 20; // 20 frames total animation
    const speed = 40; // Pixels per frame

    // Build unique spin sequences for each reel to make it look organic
    const seqs = [];
    for (let i = 0; i < 3; i++) {
        const seq = [];
        // Add 30 random symbols
        for (let j = 0; j < 30; j++) {
            seq.push(SYMBOL_KEYS[Math.floor(Math.random() * SYMBOL_KEYS.length)]);
        }
        // Ensure final symbol is at the end
        seq.push(finalReels[i]);
        seqs.push(seq);
    }

    // Stop frames for each reel (cascade stop)
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

        // Draw slots frame
        drawSlotsFrame(ctx, currentReels, loadedImages, f, jackpotPool, 'SPINNING...');
        encoder.addFrame(ctx);
    }

    // Final static frame
    encoder.setDelay(3000);
    drawSlotsFrame(ctx, finalReels, loadedImages, 1, jackpotPool, resultText);
    encoder.addFrame(ctx);

    encoder.finish();
    return encoder.out.getData();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slots')
        .setDescription('🎰 Wager your cherries on a premium progressive Slot Machine!')
        .addIntegerOption(option =>
            option.setName('bet')
                .setDescription('The amount of cherries to wager')
                .setRequired(true)),

    async execute(interaction) {
        // Acknowledge the command immediately to stop Discord's 3-second timeout timer
        await interaction.deferReply();

        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        const bet = interaction.options.getInteger('bet');

        if (bet <= 0) {
            return interaction.editReply({ content: '❌ Wager must be greater than 0!' });
        }

        const currentBalance = db.getBalance(userId, guildId);
        if (currentBalance < bet) {
            return interaction.editReply({ content: `❌ Insufficient funds! Current Balance: 🍒 **${currentBalance.toLocaleString()}** cherries.` });
        }

        try {
            // Roll the reels (weighted random selection)
            let reel1 = WEIGHTED_LIST[Math.floor(Math.random() * WEIGHTED_LIST.length)];
            let reel2 = WEIGHTED_LIST[Math.floor(Math.random() * WEIGHTED_LIST.length)];
            let reel3 = WEIGHTED_LIST[Math.floor(Math.random() * WEIGHTED_LIST.length)];

            const char = db.getCharacter(userId);
            const hasLuckBuff = char && char.luck_buff_expiry > Date.now();

            if (hasLuckBuff && !(reel1 === reel2 && reel2 === reel3)) {
                if (Math.random() < 0.15) {
                    const winningSymbols = ['cherry', 'peach', 'strawberry', 'lemon', 'grape'];
                    const chosen = winningSymbols[Math.floor(Math.random() * winningSymbols.length)];
                    reel1 = chosen;
                    reel2 = chosen;
                    reel3 = chosen;
                }
            }

            const finalReels = [reel1, reel2, reel3];

            let questProgressText = '';
            if (char && char.active_quest_id === 'slots_3') {
                db.incrementQuestProgress(userId, 1);
                const currentProgress = (char.quest_progress || 0) + 1;
                questProgressText = `\n• Quest Progress: \` Jackpot Chaser (${currentProgress}/3) \``;
                if (currentProgress >= 3) {
                    questProgressText += ` (Completed! Run \`/quest claim\` for rewards)`;
                }
            }

            // Resolve winning / payouts
            let isWin = false;
            let isJackpot = false;
            let isFreeSpins = false;
            let payout = 0;
            let resultMsg = '';
            let finalColor = '#ED4245'; // Red for loss

            const currentJackpot = db.getSlotsJackpot();

            if (reel1 === reel2 && reel2 === reel3) {
                isWin = true;
                if (reel1 === 'diamond') {
                    isJackpot = true;
                    payout = (bet * 50) + currentJackpot;
                    resultMsg = `🏆 **PROGRESSIVE JACKPOT!** You matched 3x **Diamonds**!\nAwarded standard payout (🍒 **${(bet * 50).toLocaleString()}**) + the entire progressive jackpot pool of 🍒 **${currentJackpot.toLocaleString()}** cherries!`;
                    finalColor = '#f472b6'; // Pink
                    db.resetSlotsJackpot();
                } else if (reel1 === 'lemon') {
                    isFreeSpins = true;
                    payout = bet * 3;
                    resultMsg = `🍋 **LEMON TWIST BONUS!** You matched 3x **Lemons**!\nWins: 🍒 **${payout.toLocaleString()}** cherries AND triggers **5 Free Spins** with doubled payouts!`;
                    finalColor = '#f472b6'; // Pink
                } else {
                    const multiplier = SYMBOLS[reel1].payoutMultiplier;
                    payout = bet * multiplier;
                    resultMsg = `🎉 **3-OF-A-KIND!** You matched 3x **${SYMBOLS[reel1].label}**! Payout multiplier: \`x${multiplier}\`. You won 🍒 **${payout.toLocaleString()}** cherries!`;
                    finalColor = '#f472b6'; // Pink
                }
            } else if (reel1 === reel2 || reel2 === reel3) {
                isWin = true;
                payout = Math.floor(bet * 1.5);
                resultMsg = `✨ **Adjacent Match!** You matched adjacent Reels. Payout multiplier: \`x1.5\`. You won 🍒 **${payout.toLocaleString()}** cherries!`;
                finalColor = '#f472b6'; // Pink
            } else {
                payout = 0;
                const poolAddition = Math.max(1, Math.floor(bet * 0.1));
                db.addToSlotsJackpot(poolAddition);
                resultMsg = `❌ **No Matches.** The house takes your wager. Lose: 🍒 **${bet.toLocaleString()}** cherries.\n*(🍒 ${poolAddition.toLocaleString()} cherries added to the progressive jackpot pool!)*`;
            }

            // Deduct wager and credit initial winnings
            db.deductCoins(userId, guildId, bet);
            if (payout > 0) {
                db.addCoins(userId, guildId, payout);
            }
            db.prepare("UPDATE users SET slots_spins = slots_spins + 1, slots_won_coins = slots_won_coins + ? WHERE userId = ?").run(payout, userId);

            const xpReward = isWin ? 25 : 10;
            const levelResult = db.addXp(userId, guildId, xpReward);

            // Load Twemoji assets
            const loadedImages = await loadSymbolAssets();
            const resultText = isWin ? (isJackpot ? 'JACKPOT WIN!' : `WIN: +${payout.toLocaleString()}c`) : 'TRY AGAIN!';
            const gifBuffer = await generateAnimatedSlots(finalReels, loadedImages, currentJackpot, resultText);
            const attachment = new AttachmentBuilder(gifBuffer, { name: 'premium-slots.gif' });

            const updatedJackpot = db.getSlotsJackpot();
            const newBalance = db.getBalance(userId, guildId);

            const embed = new EmbedBuilder()
                .setColor(finalColor)
                .setTitle('🎰 CASINO SLOTS')
                .setDescription(
                    `# 🎀 **CUTE CHERRY SLOTS** 🎀\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                    `👤 **Player:** <@${userId}>\n` +
                    `🍒 **Wager:** \` ${bet.toLocaleString()} \` cherries\n` +
                    `💎 **Progressive Jackpot:** \` 🍒 ${updatedJackpot.toLocaleString()} \` cherries\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                    `${resultMsg}\n\n` +
                    `📈 **Ledger Update:**\n` +
                    `• New Balance: \` 🍒 ${newBalance.toLocaleString()} \` cherries\n` +
                    `• Experience: \` +${xpReward} XP \`` +
                    questProgressText
                )
                .setImage('attachment://premium-slots.gif')
                .setFooter({ text: 'Reels: Diamond (Jackpot) ┃ Cherry ┃ Peach ┃ Strawberry ┃ Lemon (Free Spins) ┃ Grape' })
                .setTimestamp();

            if (levelResult && levelResult.leveledUp) {
                embed.addFields({ name: '🚀 RANK ADVANCEMENT!', value: `You leveled up to **Level ${levelResult.newLevel}**!`, inline: false });
            }

            // A. --- IF LEMON TWIST FREE SPINS TRIGGERED ---
            if (isFreeSpins) {
                await interaction.editReply({ embeds: [embed], files: [attachment] });

                let totalFreeSpinsWon = 0;
                const freeSpinsCount = 5;

                for (let i = 1; i <= freeSpinsCount; i++) {
                    await new Promise(resolve => setTimeout(resolve, 3500));

                    const fsReel1 = WEIGHTED_LIST[Math.floor(Math.random() * WEIGHTED_LIST.length)];
                    const fsReel2 = WEIGHTED_LIST[Math.floor(Math.random() * WEIGHTED_LIST.length)];
                    const fsReel3 = WEIGHTED_LIST[Math.floor(Math.random() * WEIGHTED_LIST.length)];

                    let fsPayout = 0;
                    let fsMsg = '';
                    if (fsReel1 === fsReel2 && fsReel2 === fsReel3) {
                        const multiplier = SYMBOLS[fsReel1].payoutMultiplier;
                        fsPayout = (bet * multiplier) * 2; // Doubled!
                        fsMsg = ` matched 3x **${SYMBOLS[fsReel1].label}**! (Doubled: +🍒 **${fsPayout.toLocaleString()}**)`;
                    } else if (fsReel1 === fsReel2 || fsReel2 === fsReel3) {
                        fsPayout = Math.floor(bet * 1.5) * 2; // Doubled!
                        fsMsg = ` matched adjacent reels! (Doubled: +🍒 **${fsPayout.toLocaleString()}**)`;
                    } else {
                        fsMsg = ` did not match (0 cherries)`;
                    }

                    totalFreeSpinsWon += fsPayout;

                    const fsJackpot = db.getSlotsJackpot();
                    const fsResultText = fsPayout > 0 ? `FREE WIN: +${fsPayout.toLocaleString()}c` : 'NO MATCH';
                    const fsGifBuffer = await generateAnimatedSlots([fsReel1, fsReel2, fsReel3], loadedImages, fsJackpot, fsResultText);
                    const fsAttachment = new AttachmentBuilder(fsGifBuffer, { name: `fs-${i}.gif` });

                    const fsEmbed = new EmbedBuilder()
                        .setColor('#c084fc')
                        .setTitle(`🍋 LEMON TWIST: FREE SPIN ${i}/${freeSpinsCount} 🍋`)
                        .setDescription(
                            `🎀 **Free Spins Active!** (No cherries wagered, payouts doubled!)\n\n` +
                            `• Spin Result: ${fsMsg}\n` +
                            `• Accumulated Bonus Winnings: 🍒 **${totalFreeSpinsWon.toLocaleString()}** cherries`
                        )
                        .setImage(`attachment://fs-${i}.gif`)
                        .setTimestamp();

                    await interaction.editReply({ embeds: [fsEmbed], files: [fsAttachment] });
                }

                if (totalFreeSpinsWon > 0) {
                    db.addCoins(userId, guildId, totalFreeSpinsWon);
                }

                const finalFreeSpinsEmbed = new EmbedBuilder()
                    .setColor('#db2777')
                    .setTitle('🍋 LEMON TWIST: BONUS CONCLUDED!')
                    .setDescription(
                        `# 🏆 **BONUS ROUND FINISHED** 🏆\n` +
                        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                        `You successfully accumulated:\n` +
                        `💰 **\` 🍒 ${totalFreeSpinsWon.toLocaleString()} \` cherries!**\n` +
                        `Your total wallet payout has been credited.\n\n` +
                        `━━━━━━━━━━━━━━━━━━━━━━━━━━`
                    );

                return await interaction.editReply({ embeds: [finalFreeSpinsEmbed], files: [], components: [] });
            }

            // B. --- IF STANDARD WIN: OFFER DOUBLE OR NOTHING GAMBLE ---
            if (isWin && !isJackpot) {
                const gambleBtn = new ButtonBuilder()
                    .setCustomId(`slots_gamble_${payout}_${bet}`)
                    .setLabel('🃏 Gamble (Double or Nothing)')
                    .setStyle(ButtonStyle.Primary);

                const cashoutBtn = new ButtonBuilder()
                    .setCustomId(`slots_cashout_${payout}`)
                    .setLabel('💰 Cash Out')
                    .setStyle(ButtonStyle.Success);

                const row = new ActionRowBuilder().addComponents(gambleBtn, cashoutBtn);

                let response = await interaction.editReply({ embeds: [embed], files: [attachment], components: [row] });

                const collector = response.createMessageComponentCollector({
                    filter: i => i.user.id === interaction.user.id,
                    time: 30000
                });

                collector.on('collect', async (i) => {
                    await i.deferUpdate();

                    if (i.customId.startsWith('slots_gamble_')) {
                        const parts = i.customId.split('_');
                        const currentWinnings = parseInt(parts[2]);
                        const originalBet = parseInt(parts[3]);

                        const gambleWin = Math.random() < 0.5;

                        if (gambleWin) {
                            const doubledWinnings = currentWinnings * 2;
                            db.addCoins(userId, guildId, currentWinnings);

                            const winEmbed = new EmbedBuilder()
                                .setColor('#fbcfe8')
                                .setTitle('🃏 GAMBLE: WON!')
                                .setDescription(
                                    `# 🍒 **GAMBLE SUCCESSFUL** 🍒\n` +
                                    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                                    `✨ **The coin landed on HEADS!** ✨\n\n` +
                                    `Your current winnings have doubled to:\n` +
                                    `💰 **\` 🍒 ${doubledWinnings.toLocaleString()} \` cherries!**\n\n` +
                                    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                                    `Would you like to double it again or cash out now?`
                                )
                                .setTimestamp();

                            const nextGambleBtn = new ButtonBuilder()
                                .setCustomId(`slots_gamble_${doubledWinnings}_${originalBet}`)
                                .setLabel('🃏 Gamble Again')
                                .setStyle(ButtonStyle.Primary);

                            const nextCashoutBtn = new ButtonBuilder()
                                .setCustomId(`slots_cashout_${doubledWinnings}`)
                                .setLabel('💰 Cash Out')
                                .setStyle(ButtonStyle.Success);

                            const nextRow = new ActionRowBuilder().addComponents(nextGambleBtn, nextCashoutBtn);

                            await i.editReply({ embeds: [winEmbed], components: [nextRow], files: [] });
                        } else {
                            db.deductCoins(userId, guildId, currentWinnings);

                            const loseEmbed = new EmbedBuilder()
                                .setColor('#f43f5e')
                                .setTitle('🃏 GAMBLE: LOST...')
                                .setDescription(
                                    `# 💥 **GAMBLE FAILED** 💥\n` +
                                    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                                    `❌ **The coin landed on TAILS.** ❌\n` +
                                    `You lost all your winnings from this round.\n\n` +
                                    `━━━━━━━━━━━━━━━━━━━━━━━━━━`
                                )
                                .setTimestamp();

                            await i.editReply({ embeds: [loseEmbed], components: [], files: [] });
                            collector.stop();
                        }
                    }

                    else if (i.customId.startsWith('slots_cashout_')) {
                        const parts = i.customId.split('_');
                        const finalWinnings = parseInt(parts[2]);

                        const cashoutEmbed = new EmbedBuilder()
                            .setColor('#fbcfe8')
                            .setTitle('💰 CASHOUT SUCCESSFUL')
                            .setDescription(
                                `# 💵 **CASHOUT SECURED** 💵\n` +
                                `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                                    `You successfully cashed out:\n` +
                                    `💰 **\` 🍒 ${finalWinnings.toLocaleString()} \` cherries!**\n\n` +
                                `━━━━━━━━━━━━━━━━━━━━━━━━━━`
                            )
                            .setTimestamp();

                        await i.editReply({ embeds: [cashoutEmbed], components: [], files: [] });
                        collector.stop();
                    }
                });

                collector.on('end', async (collected, reason) => {
                    if (reason === 'time') {
                        await interaction.editReply({ components: [] }).catch(() => {});
                    }
                });

            } else {
                await interaction.editReply({ embeds: [embed], files: [attachment] });
            }

        } catch (error) {
            console.error('Slots game execution error:', error);
            try {
                const currentBalanceAfter = db.getBalance(userId, guildId);
                if (currentBalanceAfter < currentBalance) {
                    db.addCoins(userId, guildId, bet);
                }
            } catch (e) {}

            await interaction.editReply({ content: '❌ An error occurred while spinning the reels.' });
        }
    }
};
