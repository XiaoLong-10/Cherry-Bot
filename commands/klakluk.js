const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    AttachmentBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const GIFEncoder = require('gif-encoder-2'); 
const path = require('path');
const db = require('../database.js');

const SYMBOLS = {
    tiger:   { label: 'Tiger',   emoji: '🐯', path: path.join(__dirname, '../assets/klakluk/tiger.png') },
    gourd:   { label: 'Gourd',   emoji: '🪵', path: path.join(__dirname, '../assets/klakluk/gourd.png') },
    rooster: { label: 'Rooster', emoji: '🐓', path: path.join(__dirname, '../assets/klakluk/rooster.png') },
    fish:    { label: 'Fish',    emoji: '🐟', path: path.join(__dirname, '../assets/klakluk/fish.png') },
    crab:    { label: 'Crab',    emoji: '🦀', path: path.join(__dirname, '../assets/klakluk/crab.png') },
    shrimp:  { label: 'Shrimp',  emoji: '🦐', path: path.join(__dirname, '../assets/klakluk/shrimp.png') }
};

const SYMBOL_NAMES = {
    tiger:   'ខ្លា (Tiger)',
    gourd:   'ឃ្លោក (Gourd)',
    rooster: 'មាន់ (Rooster)',
    fish:    'ត្រី (Fish)',
    crab:    'ក្ដាម (Crab)',
    shrimp:  'បង្គា (Shrimp)'
};

const SYMBOL_KEYS = Object.keys(SYMBOLS);
const BOARD_PATH = path.join(__dirname, '../assets/klakluk/board.png');
const BETTING_TIME = 180000; // 3 minutes

if (!global.klaklukStats) {
    global.klaklukStats = { tiger: 15, gourd: 12, rooster: 22, fish: 19, crab: 14, shrimp: 18 };
}

async function loadTableAssets() {
    const assets = {};
    for (const key of SYMBOL_KEYS) {
        assets[key] = await loadImage(SYMBOLS[key].path);
    }
    return assets;
}

function drawFrame(ctx, dice, loadedImages, animationData = null) {
    const width = 520;
    const height = 180;
    ctx.fillStyle = '#fce7f3';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#f472b6';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(173, 0); ctx.lineTo(173, height);
    ctx.moveTo(346, 0); ctx.lineTo(346, height);
    ctx.stroke();

    const dieSize = 130;
    const positionsX = [21, 194, 368]; 
    const startY = 25;

    for (let i = 0; i < dice.length; i++) {
        const key = dice[i];
        const imgAsset = loadedImages[key];
        
        let dx = positionsX[i];
        let dy = startY;
        let rotation = 0;

        if (animationData && animationData[i]) {
            dx += animationData[i].offsetX || 0;
            dy += animationData[i].offsetY || 0;
            rotation = animationData[i].rotation || 0;
        }

        const centerX = dx + (dieSize / 2);
        const centerY = dy + (dieSize / 2);

        ctx.save();
        
        // Setup clip circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, dieSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        
        // Translate to center, rotate, and draw image
        ctx.translate(centerX, centerY);
        ctx.rotate(rotation);
        ctx.drawImage(imgAsset, -dieSize / 2, -dieSize / 2, dieSize, dieSize);
        ctx.restore();

        // Draw outline circle
        ctx.save();
        ctx.strokeStyle = '#db2777';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, dieSize / 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

async function generateAnimatedRoll(finalDice, loadedImages) {
    const encoder = new GIFEncoder(520, 180);
    const canvas = createCanvas(520, 180);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    
    encoder.setRepeat(0);
    encoder.setDelay(60); // 60ms delay per frame = ~16.6 FPS (smooth)
    encoder.start();

    const totalFrames = 18;
    for (let f = 0; f < totalFrames; f++) {
        const progress = f / totalFrames;
        const randomDice = [
            SYMBOL_KEYS[Math.floor(Math.random() * 6)],
            SYMBOL_KEYS[Math.floor(Math.random() * 6)],
            SYMBOL_KEYS[Math.floor(Math.random() * 6)]
        ];
        
        // Calculate animation data for roll (vibration + rotation with decay)
        const animData = [];
        for (let i = 0; i < 3; i++) {
            const rotSpeed = 0.8 - (progress * 0.6);
            animData.push({
                rotation: f * rotSpeed + i * 1.5,
                offsetX: (Math.random() - 0.5) * 20 * (1 - progress),
                offsetY: (Math.random() - 0.5) * 20 * (1 - progress)
            });
        }
        
        drawFrame(ctx, randomDice, loadedImages, animData);
        encoder.addFrame(ctx);
    }

    // Final static frame
    encoder.setDelay(2800); 
    drawFrame(ctx, finalDice, loadedImages, null);
    encoder.addFrame(ctx);

    encoder.finish();
    return encoder.out.getData(); 
}

function buildControlRows() {
    // Row 1: Tiger, Gourd, Rooster
    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('kk_btn_tiger').setEmoji('🐯').setLabel('Tiger').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('kk_btn_gourd').setEmoji('🪵').setLabel('Gourd').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('kk_btn_rooster').setEmoji('🐓').setLabel('Rooster').setStyle(ButtonStyle.Danger)
    );

    // Row 2: Shrimp, Crab, Fish
    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('kk_btn_shrimp').setEmoji('🦐').setLabel('Shrimp').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('kk_btn_crab').setEmoji('🦀').setLabel('Crab').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('kk_btn_fish').setEmoji('🐟').setLabel('Fish').setStyle(ButtonStyle.Primary)
    );

    // Row 3: My Bets, Clear, Roll Now!
    const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('kk_action_mybets').setEmoji('📋').setLabel('My Bets').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('kk_action_clear').setEmoji('🗑️').setLabel('Clear').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('kk_action_roll').setEmoji('🎲').setLabel('Roll Now!').setStyle(ButtonStyle.Danger)
    );

    return [row1, row2, row3];
}

function parseBetAmount(inputText, userBalance, currentSymbolBet, currentPlayerTotalBet) {
    const text = inputText.toLowerCase().trim();
    
    // Limits
    const maxPerAnimal = 500000;
    const maxTotalBet = 10000000;
    
    const maxAllowedByAnimalLimit = maxPerAnimal - currentSymbolBet;
    const maxAllowedByTotalLimit = maxTotalBet - currentPlayerTotalBet;
    let maxPlayable = Math.min(userBalance, maxAllowedByAnimalLimit, maxAllowedByTotalLimit);
    if (maxPlayable < 0) maxPlayable = 0;

    if (text === 'all' || text === 'max') {
        return maxPlayable;
    }
    
    if (text === 'half') {
        return Math.max(1, Math.floor(maxPlayable / 2));
    }

    // Parse shorthand numbers: e.g. 50k, 1.5m
    const suffixRegex = /^([0-9.]+)\s*([km])?$/;
    const match = text.match(suffixRegex);
    if (!match) return NaN;

    let num = parseFloat(match[1]);
    if (isNaN(num) || num <= 0) return NaN;

    const suffix = match[2];
    if (suffix === 'k') {
        num *= 1000;
    } else if (suffix === 'm') {
        num *= 1000000;
    }

    return Math.floor(num);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('klakluk')
        .setDescription('🎰 Play Klah Klok (Multiplayer) - Place bets on animal symbols!'),

    async execute(interaction) {
        await interaction.deferReply();

        const playerBets = {};
        const totalTableBets = { tiger: 0, gourd: 0, rooster: 0, fish: 0, crab: 0, shrimp: 0 };

        const updateEmbed = (timeLeft) => {
            const joinedCount = Object.keys(playerBets).length;
            let totalPot = 0;
            let currentBetsText = '';

            if (joinedCount === 0) {
                currentBetsText = '*No bets yet - be the first!*';
            } else {
                for (const [pId, bets] of Object.entries(playerBets)) {
                    const betSummary = [];
                    let playerTotal = 0;
                    
                    SYMBOL_KEYS.forEach(key => {
                        const cost = bets[key];
                        if (cost > 0) {
                            betSummary.push(`${SYMBOLS[key].emoji} ${cost.toLocaleString()}`);
                            playerTotal += cost;
                        }
                    });
                    
                    if (playerTotal > 0) {
                        currentBetsText += `• **${bets.username}**: ${betSummary.join(' | ')} (Total: ${playerTotal.toLocaleString()} cherries)\n`;
                        totalPot += playerTotal;
                    }
                }
            }

            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            const timeLeftText = minutes > 0 ? `${minutes} min ${seconds}s left` : `${seconds}s left`;

            return new EmbedBuilder()
                .setColor('#f472b6')
                .setTitle('🎀 ខ្លាឃ្លោក | Cute Klah Klok 🎀')
                .setDescription(
                    `🟢 **Betting Open - ${timeLeftText}**\n` +
                    `🎯 **Click an animal button to place your bet!**\n\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                    `💰 **Total Pot:** ${totalPot.toLocaleString()} cherries\n` +
                    `👥 **Players:** ${joinedCount}\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                    `📋 **Current Bets:**\n` +
                    `${currentBetsText}`
                )
                .setImage('attachment://board.png')
                .setFooter({ text: 'Max/animal: 500,000 • Max total: 10,000,000 • Min: 1' });
        };

        const boardAttachment = new AttachmentBuilder(BOARD_PATH, { name: 'board.png' });
        let secondsLeft = BETTING_TIME / 1000;

        const gameMessage = await interaction.editReply({ 
            embeds: [updateEmbed(secondsLeft)], 
            files: [boardAttachment],
            components: buildControlRows()
        });

        const collector = gameMessage.createMessageComponentCollector({ time: BETTING_TIME });

        const countdownInterval = setInterval(async () => {
            secondsLeft -= 5;
            if (secondsLeft > 0) {
                await interaction.editReply({ embeds: [updateEmbed(secondsLeft)] }).catch(() => {});
            }
        }, 5000);

        collector.on('collect', async (i) => {
            const pId = i.user.id;
            const pUsername = i.user.username;

            // 1. ANIMAL BUTTONS
            if (i.customId.startsWith('kk_btn_')) {
                const targetAnimal = i.customId.replace('kk_btn_', '');
                
                // Show modal popup for betting
                const modal = new ModalBuilder()
                    .setCustomId(`kk_modal_${targetAnimal}`)
                    .setTitle(`Bet on ${SYMBOL_NAMES[targetAnimal]}`);

                const betInput = new TextInputBuilder()
                    .setCustomId('kk_modal_input')
                    .setLabel('Min: 1 | Max: 500,000')
                    .setPlaceholder('e.g., 10000, 50k, all, half')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const row = new ActionRowBuilder().addComponents(betInput);
                modal.addComponents(row);

                await i.showModal(modal);

                // Wait for the modal submit response
                try {
                    const modalSubmit = await i.awaitModalSubmit({
                        filter: msInteraction => msInteraction.customId === `kk_modal_${targetAnimal}` && msInteraction.user.id === i.user.id,
                        time: 60000 // 1 minute limit to enter bet
                    });

                    await modalSubmit.deferUpdate();

                    const inputVal = modalSubmit.fields.getTextInputValue('kk_modal_input');
                    
                    const currentBalance = db.getBalance(pId, interaction.guild.id);

                    if (!playerBets[pId]) {
                        playerBets[pId] = { username: pUsername, tiger: 0, gourd: 0, rooster: 0, fish: 0, crab: 0, shrimp: 0 };
                    }

                    const totalPlayerStaked = Object.entries(playerBets[pId])
                        .reduce((a, [k, v]) => typeof v === 'number' ? a + v : a, 0);

                    const currentSymbolBet = playerBets[pId][targetAnimal] || 0;
                    const betAmount = parseBetAmount(inputVal, currentBalance, currentSymbolBet, totalPlayerStaked);

                    if (isNaN(betAmount) || betAmount <= 0) {
                        return modalSubmit.followUp({ content: `❌ **${pUsername}**, invalid bet amount entered! Enter a positive number (e.g. 1000, 50k) or 'all'/'half'.`, ephemeral: true });
                    }

                    // Balance check
                    if (currentBalance < totalPlayerStaked + betAmount) {
                        return modalSubmit.followUp({ content: `❌ **${pUsername}**, you don't have enough cherries in your wallet to place this bet! Balance: 🍒 **${currentBalance.toLocaleString()}**`, ephemeral: true });
                    }

                    // Symbol limit check
                    if (currentSymbolBet + betAmount > 500000) {
                        return modalSubmit.followUp({ content: `❌ **${pUsername}**, maximum bet limit per animal is **500,000** cherries! You can add at most **${(500000 - currentSymbolBet).toLocaleString()}** more.`, ephemeral: true });
                    }

                    // Total limit check
                    if (totalPlayerStaked + betAmount > 10000000) {
                        return modalSubmit.followUp({ content: `❌ **${pUsername}**, maximum total bet limit is **10,000,000** cherries! You can add at most **${(10000000 - totalPlayerStaked).toLocaleString()}** more.`, ephemeral: true });
                    }

                    playerBets[pId][targetAnimal] += betAmount;
                    totalTableBets[targetAnimal] += betAmount;

                    // Update lobby embed with new wagers
                    await interaction.editReply({ embeds: [updateEmbed(secondsLeft)] });

                } catch (error) {
                    // Closed or timed out modal, do nothing
                }
            }

            // 2. MY BETS BUTTON
            else if (i.customId === 'kk_action_mybets') {
                const bets = playerBets[pId];
                if (!bets) {
                    return i.reply({ content: `📋 **${pUsername}**, you have not placed any bets in this round yet!`, ephemeral: true });
                }

                const betSummary = [];
                let playerTotal = 0;
                SYMBOL_KEYS.forEach(key => {
                    const cost = bets[key];
                    if (cost > 0) {
                        betSummary.push(`${SYMBOLS[key].emoji} ${SYMBOLS[key].label}: **${cost.toLocaleString()}** cherries`);
                        playerTotal += cost;
                    }
                });

                if (playerTotal === 0) {
                    return i.reply({ content: `📋 **${pUsername}**, you have not placed any bets in this round yet!`, ephemeral: true });
                }

                return i.reply({
                    content: `📋 **Your current wagers on the table:**\n${betSummary.join('\n')}\nTotal Staked: 🍒 **${playerTotal.toLocaleString()}** cherries`,
                    ephemeral: true
                });
            }

            // 3. CLEAR BUTTON
            else if (i.customId === 'kk_action_clear') {
                const bets = playerBets[pId];
                if (!bets) {
                    return i.reply({ content: `❌ **${pUsername}**, you don't have any wagers to clear!`, ephemeral: true });
                }

                let playerTotal = 0;
                SYMBOL_KEYS.forEach(key => {
                    const cost = bets[key];
                    if (cost > 0) {
                        playerTotal += cost;
                        totalTableBets[key] -= cost;
                        bets[key] = 0;
                    }
                });

                if (playerTotal === 0) {
                    return i.reply({ content: `❌ **${pUsername}**, you don't have any wagers to clear!`, ephemeral: true });
                }

                // Update lobby embed
                await i.reply({ content: `🗑️ Your wagers have been cleared and returned to your wallet.`, ephemeral: true });
                await interaction.editReply({ embeds: [updateEmbed(secondsLeft)] });
            }

            // 4. ROLL NOW BUTTON (HOST ONLY)
            else if (i.customId === 'kk_action_roll') {
                if (pId !== interaction.user.id) {
                    return i.reply({ content: `❌ Only the game host (<@${interaction.user.id}>) can start the roll early!`, ephemeral: true });
                }
                
                await i.deferUpdate();
                collector.stop('roll_now');
            }
        });

        collector.on('end', async (collected, reason) => {
            clearInterval(countdownInterval);

            // Calculate total table pot wagers
            let totalTablePot = 0;
            Object.values(totalTableBets).forEach(v => totalTablePot += v);

            if (totalTablePot === 0) {
                return interaction.editReply({ content: '⏱️ Game closed. No active bets were placed on the table.', embeds: [], files: [], components: [] });
            }

            const finalDice = [
                SYMBOL_KEYS[Math.floor(Math.random() * 6)],
                SYMBOL_KEYS[Math.floor(Math.random() * 6)],
                SYMBOL_KEYS[Math.floor(Math.random() * 6)]
            ];

            finalDice.forEach(d => global.klaklukStats[d] += 1);

            const loadingEmbed = new EmbedBuilder()
                .setColor('#f472b6')
                .setTitle('🎀 SHAKING THE CUTE BOWL...')
                .setDescription('Compiling layout scores and distributing player Level XP...');
            await interaction.editReply({ embeds: [loadingEmbed], files: [], components: [] });

            try {
                const loadedImages = await loadTableAssets();
                const gifBuffer = await generateAnimatedRoll(finalDice, loadedImages);
                const attachment = new AttachmentBuilder(gifBuffer, { name: 'premium-roll.gif' });

                const dealerResultRow = finalDice.map(d => `${SYMBOLS[d].emoji}`).join(' ┃ ');
                let scoreboardText = '';

                for (const [pId, bets] of Object.entries(playerBets)) {
                    let playerBetTotal = 0;
                    let playerWonTotal = 0;

                    SYMBOL_KEYS.forEach(key => {
                        const cost = bets[key];
                        if (cost > 0) {
                            playerBetTotal += cost;
                            const matches = finalDice.filter(d => d === key).length;
                            if (matches > 0) {
                                playerWonTotal += cost + (cost * matches);
                            }
                        }
                    });

                    const playerNet = playerWonTotal - playerBetTotal;
                    if (playerNet > 0) {
                        db.addCoins(pId, interaction.guild.id, playerNet);
                    } else if (playerNet < 0) {
                        db.deductCoins(pId, interaction.guild.id, Math.abs(playerNet));
                    }

                    // Reward Active Play Experience points inside your profile handler database
                    db.addXp(pId, interaction.guild.id, 35); 

                    const sign = playerNet >= 0 ? '🟢 +' : '🔴 ';
                    scoreboardText += `• **${bets.username}**: Staked \`${playerBetTotal.toLocaleString()}\` | Result: ${sign}\`${playerNet.toLocaleString()}\` 🍒 *(+35 XP)*\n`;
                }

                const outcomeEmbed = new EmbedBuilder()
                    .setColor('#f472b6')
                    .setTitle('🎀 CUTE KLA KLOUK SETTLEMENT 🎀')
                    .setDescription(
                        `**Dealer Result**\n\n${dealerResultRow}\n\n` +
                        `### 📊 Global Table Ledger\n${scoreboardText}`
                    )
                    .setImage('attachment://premium-roll.gif');

                await interaction.editReply({ embeds: [outcomeEmbed], files: [attachment] });

            } catch (err) {
                console.error(err);
                await interaction.editReply({ content: '❌ Core processing frame failure.', embeds: [], files: [], components: [] });
            }
        });
    }
};