const {SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    AttachmentBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle, MessageFlags } = require('discord.js');
const { createCanvas } = require('canvas');
const db = require('../database.js');

const SUITS = [
    { name: 'Hearts', char: '♥', color: '#db2777' },
    { name: 'Diamonds', char: '♦', color: '#db2777' },
    { name: 'Clubs', char: '♣', color: '#831843' },
    { name: 'Spades', char: '♠', color: '#831843' }
];

const RANKS = [
    { name: '2', val: 2 },
    { name: '3', val: 3 },
    { name: '4', val: 4 },
    { name: '5', val: 5 },
    { name: '6', val: 6 },
    { name: '7', val: 7 },
    { name: '8', val: 8 },
    { name: '9', val: 9 },
    { name: '10', val: 10 },
    { name: 'J', val: 10 },
    { name: 'Q', val: 10 },
    { name: 'K', val: 10 },
    { name: 'A', val: 1 }
];

const LOBBY_TIME = 60000; // 60 seconds
const DECISION_TIME = 20000; // 20 seconds for stay/draw choices

function createDeck() {
    const deck = [];
    SUITS.forEach(suit => {
        RANKS.forEach(rank => {
            deck.push({ rank: rank.name, value: rank.val, suit: suit.name, char: suit.char, color: suit.color });
        });
    });
    return deck;
}

function shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function checkHandRank(cards) {
    const score = cards.reduce((sum, c) => sum + c.value, 0) % 10;
    
    if (cards.length === 2) {
        const isPok = score === 8 || score === 9;
        const isPair = cards[0].rank === cards[1].rank;
        const isSameSuit = cards[0].suit === cards[1].suit;
        
        let deng = 1;
        if (isPair || isSameSuit) deng = 2;
        
        return {
            score,
            deng,
            isPok,
            name: isPok ? `Pok ${score}` : `${score} Points`,
            type: isPok ? 'pok' : 'normal'
        };
    } else {
        const isTong = cards[0].rank === cards[1].rank && cards[1].rank === cards[2].rank;
        const isSamLuang = cards.every(c => ['J', 'Q', 'K'].includes(c.rank));
        
        const cardValsSorted = cards.map(c => {
            if (c.rank === 'A') return 1;
            if (c.rank === 'J') return 11;
            if (c.rank === 'Q') return 12;
            if (c.rank === 'K') return 13;
            return parseInt(c.rank);
        }).sort((a, b) => a - b);
        
        const isStraight = (cardValsSorted[1] === cardValsSorted[0] + 1 && cardValsSorted[2] === cardValsSorted[1] + 1) ||
                           (cardValsSorted[0] === 1 && cardValsSorted[1] === 12 && cardValsSorted[2] === 13);
        
        const isSameSuit = cards[0].suit === cards[1].suit && cards[1].suit === cards[2].suit;
        
        if (isTong) {
            return { score, deng: 5, name: 'Three of a Kind (Tong)', type: 'tong' };
        }
        if (isStraight && isSameSuit) {
            return { score, deng: 5, name: 'Straight Flush', type: 'straight_flush' };
        }
        if (isStraight) {
            return { score, deng: 3, name: 'Straight', type: 'straight' };
        }
        if (isSamLuang) {
            return { score, deng: 3, name: 'Three Face Cards (Sam Luang)', type: 'sam_luang' };
        }
        if (isSameSuit) {
            return { score, deng: 3, name: '3 Deng', type: 'suited' };
        }
        
        return { score, deng: 1, name: `${score} Points`, type: 'normal' };
    }
}

function compareHands(playerHand, dealerHand) {
    const pRank = checkHandRank(playerHand);
    const dRank = checkHandRank(dealerHand);
    
    if (pRank.isPok || dRank.isPok) {
        const pVal = pRank.isPok ? pRank.score : -1;
        const dVal = dRank.isPok ? dRank.score : -1;
        if (pVal > dVal) return 'win';
        if (pVal < dVal) return 'lose';
        return 'push';
    }
    
    const rankWeights = {
        tong: 5,
        straight_flush: 4,
        straight: 3,
        sam_luang: 2,
        normal: 1
    };
    
    const pWeight = rankWeights[pRank.type] || 1;
    const dWeight = rankWeights[dRank.type] || 1;
    
    if (pWeight > dWeight) return 'win';
    if (pWeight < dWeight) return 'lose';
    if (pWeight === 1 && dWeight === 1) {
        if (pRank.score > dRank.score) return 'win';
        if (pRank.score < dRank.score) return 'lose';
        return 'push';
    }
    
    if (pRank.score > dRank.score) return 'win';
    if (pRank.score < dRank.score) return 'lose';
    return 'push';
}

function drawCard(ctx, card, x, y, isFlipped = false) {
    const w = 65;
    const h = 100;
    const r = 10;
    
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;
    
    ctx.fillStyle = isFlipped ? '#fbcfe8' : '#ffffff';
    ctx.strokeStyle = isFlipped ? '#f472b6' : '#999999';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
    ctx.stroke();
    
    ctx.restore();
    
    if (isFlipped) {
        // Pink inner border
        ctx.strokeStyle = '#f472b6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x + 5, y + 5, w - 10, h - 10, 5);
        ctx.stroke();

        // Center card emblem
        ctx.fillStyle = '#db2777';
        ctx.font = '20px "Segoe UI Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🍒', x + w / 2, y + h / 2);
        ctx.textBaseline = 'alphabetic'; // Reset
        return;
    }
    
    ctx.fillStyle = card.color;
    
    // Draw rank (top-left)
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(card.rank, x + 8, y + 24);
    
    // Draw rank (bottom-right)
    ctx.save();
    ctx.translate(x + w - 8, y + h - 24);
    ctx.rotate(Math.PI);
    ctx.fillText(card.rank, 0, 0);
    ctx.restore();
    
    // Draw suit symbol (center)
    ctx.font = 'bold 36px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(card.char, x + w / 2, y + h / 2);
}

function drawTableBuffer(playersData, dealerHand, showDealerCards = false) {
    const width = 800;
    const height = 500;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // 1. Draw Cute Pastel Table Felt
    const feltGrad = ctx.createRadialGradient(width/2, height/2, 50, width/2, height/2, width/2);
    feltGrad.addColorStop(0, '#fdf4ff'); // Fuchsia 50
    feltGrad.addColorStop(0.8, '#fce7f3'); // Pink 100
    feltGrad.addColorStop(1, '#fbcfe8'); // Pink 200
    ctx.fillStyle = feltGrad;
    ctx.fillRect(0, 0, width, height);

    // Pink oval line marking table boundary
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(width/2, height/2, 360, 210, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Watermark casino label
    ctx.save();
    ctx.fillStyle = 'rgba(219, 39, 119, 0.05)';
    ctx.font = 'bold 60px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎀 POKDENG VIP', width / 2, height / 2 - 30);
    ctx.restore();

    // Dealer Frosted Glass Panel
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(width / 2 - 120, 20, 240, 150, 12);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#be185d';
    ctx.font = 'bold 14px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎀 DEALER', width / 2, 42);
    
    if (dealerHand.length > 0) {
        dealerHand.forEach((card, idx) => {
            let cardX = 0;
            if (dealerHand.length === 2) {
                cardX = width / 2 - 70 + (idx * 75);
            } else {
                cardX = width / 2 - 105 + (idx * 75);
            }
            const cardY = 55;
            drawCard(ctx, card, cardX, cardY, !showDealerCards);
        });
    }

    const pCount = playersData.length;
    const seatsX = [];
    if (pCount === 1) seatsX.push(400);
    else if (pCount === 2) seatsX.push(260, 540);
    else if (pCount === 3) seatsX.push(160, 400, 640);
    else if (pCount === 4) seatsX.push(110, 300, 490, 690);
    else if (pCount === 5) seatsX.push(90, 245, 400, 555, 710);
    
    playersData.forEach((player, idx) => {
        const sx = seatsX[idx];
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.strokeStyle = 'rgba(244, 114, 182, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(sx - 80, 210, 160, 260, 12);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#9d174d';
        ctx.font = 'bold 15px "Segoe UI", "Segoe UI Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(player.username.substring(0, 12), sx, 232);
        
        ctx.fillStyle = '#db2777';
        ctx.font = 'bold 13px "Segoe UI", "Segoe UI Emoji", sans-serif';
        ctx.fillText(`🍒 ${player.bet.toLocaleString()}`, sx, 250);
        
        if (player.hand.length > 0) {
            player.hand.forEach((card, cIdx) => {
                let cardX = 0;
                let cardY = 270;
                if (player.hand.length <= 2) {
                    cardX = sx - 70 + (cIdx * 75);
                } else {
                    if (cIdx < 2) {
                        cardX = sx - 70 + (cIdx * 75);
                    } else {
                        cardX = sx - 32;
                        cardY = 320;
                    }
                }
                drawCard(ctx, card, cardX, cardY, false);
            });
        }
    });

    return canvas.toBuffer('image/png');
}

function formatHandText(hand) {
    return hand.map(c => `\`[ ${c.rank} ┃ ${c.char} ]\``).join(' ');
}

async function startPokdengRound(interaction, activePlayers) {
    const deck = createDeck();
    shuffle(deck);

    activePlayers.forEach(p => {
        p.hand = [deck.pop(), deck.pop()];
    });
    const dealerHand = [deck.pop(), deck.pop()];

    const dRank = checkHandRank(dealerHand);
    const showDealerInitially = dRank.isPok;

    if (showDealerInitially) {
        const initialTable = drawTableBuffer(activePlayers, dealerHand, true);
        const tableAttachment = new AttachmentBuilder(initialTable, { name: 'table.png' });

        let summary = `### 🏢 DEALER INSTANT POK: **${dRank.name}**\n` +
                      `Dealer Hand: ${formatHandText(dealerHand)}\n\n` +
                      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                      `📊 **Round Settlement:**\n`;

        activePlayers.forEach(p => {
            const pRank = checkHandRank(p.hand);
            const outcome = compareHands(p.hand, dealerHand);

            if (outcome === 'win') {
                const winProfit = p.bet * pRank.deng;
                db.addCoins(p.pId, (interaction.guild ? interaction.guild.id : 'GLOBAL'), p.bet + winProfit);
                summary += `• **${p.username}**: Win! 🍒 **+${winProfit.toLocaleString()}** (Matched **${pRank.name}** vs dealer **${dRank.name}**)\n` +
                           `  Hand: ${formatHandText(p.hand)}\n`;
            } else if (outcome === 'lose') {
                const lossMultiplier = dRank.deng;
                if (lossMultiplier > 1) {
                    const extraLoss = p.bet * (lossMultiplier - 1);
                    db.deductCoins(p.pId, (interaction.guild ? interaction.guild.id : 'GLOBAL'), extraLoss);
                    summary += `• **${p.username}**: Lose (Dealer ${dRank.deng} Deng)! 🍒 **-${(p.bet * lossMultiplier).toLocaleString()}**\n` +
                               `  Hand: ${formatHandText(p.hand)}\n`;
                } else {
                    summary += `• **${p.username}**: Lose! 🍒 **-${p.bet.toLocaleString()}**\n` +
                               `  Hand: ${formatHandText(p.hand)}\n`;
                }
            } else {
                db.addCoins(p.pId, (interaction.guild ? interaction.guild.id : 'GLOBAL'), p.bet);
                summary += `• **${p.username}**: Push (Tie)! 🍒 Returned bet.\n` +
                           `  Hand: ${formatHandText(p.hand)}\n`;
            }
            db.addXp(p.pId, (interaction.guild ? interaction.guild.id : 'GLOBAL'), 35);
        });

        const endEmbed = new EmbedBuilder()
            .setColor('#f472b6')
            .setTitle('🎀 Cute Pokdeng 🎀')
            .setDescription(summary)
            .setImage('attachment://table.png');

        return interaction.editReply({ embeds: [endEmbed], files: [tableAttachment], components: [] });
    }

    activePlayers.forEach(p => {
        const pRank = checkHandRank(p.hand);
        if (pRank.isPok) {
            p.hasDecided = true;
            p.status = `Pok ${pRank.score}`;
        }
    });

    const allDecidedInitially = activePlayers.every(p => p.hasDecided);
    if (allDecidedInitially) {
        const initialDealerRank = checkHandRank(dealerHand);
        let dealerMsg = '';
        if (initialDealerRank.score <= 5) {
            dealerHand.push(deck.pop());
            dealerMsg = '🏢 Dealer draws a 3rd card.';
        } else {
            dealerMsg = '🏢 Dealer stays.';
        }

        const finalTable = drawTableBuffer(activePlayers, dealerHand, true);
        const finalAttachment = new AttachmentBuilder(finalTable, { name: 'table.png' });

        const finalDealerRank = checkHandRank(dealerHand);
        let summary = `### 🏢 DEALER FINAL HAND: **${finalDealerRank.name}**\n` +
                      `Dealer Hand: ${formatHandText(dealerHand)}\n` +
                      `*${dealerMsg}*\n\n` +
                      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                      `📊 **Round Settlement:**\n`;

        activePlayers.forEach(p => {
            const pRank = checkHandRank(p.hand);
            const outcome = compareHands(p.hand, dealerHand);

            if (outcome === 'win') {
                const winProfit = p.bet * pRank.deng;
                db.addCoins(p.pId, (interaction.guild ? interaction.guild.id : 'GLOBAL'), p.bet + winProfit);
                summary += `• **${p.username}**: Win! 🍒 **+${winProfit.toLocaleString()}** (Matched **${pRank.name}** vs dealer **${finalDealerRank.name}**)\n` +
                           `  Hand: ${formatHandText(p.hand)}\n`;
            } else if (outcome === 'lose') {
                const lossMultiplier = finalDealerRank.deng;
                if (lossMultiplier > 1) {
                    const extraLoss = p.bet * (lossMultiplier - 1);
                    db.deductCoins(p.pId, (interaction.guild ? interaction.guild.id : 'GLOBAL'), extraLoss);
                    summary += `• **${p.username}**: Lose (Dealer ${finalDealerRank.deng} Deng)! 🍒 **-${(p.bet * lossMultiplier).toLocaleString()}**\n` +
                               `  Hand: ${formatHandText(p.hand)}\n`;
                } else {
                    summary += `• **${p.username}**: Lose! 🍒 **-${p.bet.toLocaleString()}**\n` +
                               `  Hand: ${formatHandText(p.hand)}\n`;
                }
            } else {
                db.addCoins(p.pId, (interaction.guild ? interaction.guild.id : 'GLOBAL'), p.bet);
                summary += `• **${p.username}**: Push (Tie)! 🍒 Returned bet.\n` +
                           `  Hand: ${formatHandText(p.hand)}\n`;
            }
            db.addXp(p.pId, (interaction.guild ? interaction.guild.id : 'GLOBAL'), 35);
        });

        const finalEmbed = new EmbedBuilder()
            .setColor('#f472b6')
            .setTitle('🎀 Cute Pokdeng 🎀')
            .setDescription(summary)
            .setImage('attachment://table.png');

        return interaction.editReply({
            embeds: [finalEmbed],
            files: [finalAttachment],
            components: []
        });
    }

    const getDecisionsEmbed = () => {
        const decs = activePlayers.map(p => {
            return `• **${p.username}**: Hand ${formatHandText(p.hand)} ⧪ **${p.status}**`;
        }).join('\n');

        return new EmbedBuilder()
            .setColor('#f472b6')
            .setTitle('🎀 CUTE POKDENG DECISION PHASE')
            .setDescription(
                `**Dealer is hiding their cards...**\n` +
                `Players without a Pok can draw a 3rd card or stand!\n\n` +
                `### 👥 Player Options:\n${decs}`
            )
            .setImage('attachment://table.png');
    };

    const drawBtn = new ButtonBuilder()
        .setCustomId('pd_dec_draw')
        .setLabel('🃏 Draw Card')
        .setStyle(ButtonStyle.Primary);

    const stayBtn = new ButtonBuilder()
        .setCustomId('pd_dec_stay')
        .setLabel('📥 Stay')
        .setStyle(ButtonStyle.Secondary);

    const decRow = new ActionRowBuilder().addComponents(drawBtn, stayBtn);

    let currentTable = drawTableBuffer(activePlayers, dealerHand, false);
    let attachment = new AttachmentBuilder(currentTable, { name: 'table.png' });

    const playMessage = await interaction.editReply({
        embeds: [getDecisionsEmbed()],
        files: [attachment],
        components: [decRow]
    });

    const playersDict = {};
    activePlayers.forEach(p => {
        playersDict[p.pId] = p;
    });

    const decCollector = playMessage.createMessageComponentCollector({ time: DECISION_TIME });

    decCollector.on('collect', async (i) => {
        const pId = i.user.id;
        const player = playersDict[pId];

        if (!player) {
            return i.reply({ content: '❌ You are not sitting at the table in this round!', flags: MessageFlags.Ephemeral });
        }

        if (player.hasDecided) {
            return i.reply({ content: '❌ You have already finished your turn!', flags: MessageFlags.Ephemeral });
        }

        await i.deferUpdate();

        if (i.customId === 'pd_dec_draw') {
            player.hand.push(deck.pop());
            player.hasDecided = true;
            player.status = 'Drew 3rd Card';
        } else if (i.customId === 'pd_dec_stay') {
            player.hasDecided = true;
            player.status = 'Stayed';
        }

        const allFinished = activePlayers.every(p => p.hasDecided);

        currentTable = drawTableBuffer(activePlayers, dealerHand, false);
        attachment = new AttachmentBuilder(currentTable, { name: 'table.png' });

        await interaction.editReply({
            embeds: [getDecisionsEmbed()],
            files: [attachment]
        });

        if (allFinished) {
            decCollector.stop('all_decided');
        }
    });

    decCollector.on('end', async (collected, reason) => {
        activePlayers.forEach(p => {
            if (!p.hasDecided) {
                p.hasDecided = true;
                p.status = 'Stayed (Timeout)';
            }
        });

        const initialDealerRank = checkHandRank(dealerHand);
        let dealerMsg = '';
        if (initialDealerRank.score <= 5) {
            dealerHand.push(deck.pop());
            dealerMsg = '🏢 Dealer draws a 3rd card.';
        } else {
            dealerMsg = '🏢 Dealer stays.';
        }

        const finalTable = drawTableBuffer(activePlayers, dealerHand, true);
        const finalAttachment = new AttachmentBuilder(finalTable, { name: 'table.png' });

        const finalDealerRank = checkHandRank(dealerHand);
        let summary = `### 🏢 DEALER FINAL HAND: **${finalDealerRank.name}**\n` +
                      `Dealer Hand: ${formatHandText(dealerHand)}\n` +
                      `*${dealerMsg}*\n\n` +
                      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                      `📊 **Round Settlement:**\n`;

        activePlayers.forEach(p => {
            const pRank = checkHandRank(p.hand);
            const outcome = compareHands(p.hand, dealerHand);

            if (outcome === 'win') {
                const winProfit = p.bet * pRank.deng;
                db.addCoins(p.pId, (interaction.guild ? interaction.guild.id : 'GLOBAL'), p.bet + winProfit);
                summary += `• **${p.username}**: Win! 🍒 **+${winProfit.toLocaleString()}** (Matched **${pRank.name}** vs dealer **${finalDealerRank.name}**)\n` +
                           `  Hand: ${formatHandText(p.hand)}\n`;
            } else if (outcome === 'lose') {
                const lossMultiplier = finalDealerRank.deng;
                if (lossMultiplier > 1) {
                    const extraLoss = p.bet * (lossMultiplier - 1);
                    db.deductCoins(p.pId, (interaction.guild ? interaction.guild.id : 'GLOBAL'), extraLoss);
                    summary += `• **${p.username}**: Lose (Dealer ${finalDealerRank.deng} Deng)! 🍒 **-${(p.bet * lossMultiplier).toLocaleString()}**\n` +
                               `  Hand: ${formatHandText(p.hand)}\n`;
                } else {
                    summary += `• **${p.username}**: Lose! 🍒 **-${p.bet.toLocaleString()}**\n` +
                               `  Hand: ${formatHandText(p.hand)}\n`;
                }
            } else {
                db.addCoins(p.pId, (interaction.guild ? interaction.guild.id : 'GLOBAL'), p.bet);
                summary += `• **${p.username}**: Push (Tie)! 🍒 Returned bet.\n` +
                           `  Hand: ${formatHandText(p.hand)}\n`;
            }
            db.addXp(p.pId, (interaction.guild ? interaction.guild.id : 'GLOBAL'), 35);
        });

        const finalEmbed = new EmbedBuilder()
            .setColor('#c084fc')
            .setTitle('🃏 ល្បែងបឹកក្ដាំង | Pokdeng')
            .setDescription(summary)
            .setImage('attachment://table.png');

        await interaction.editReply({
            embeds: [finalEmbed],
            files: [finalAttachment],
            components: []
        });
    });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pokdeng')
        .setDescription('🃏 Classic Khmer Pokdeng - Play solo or multiplayer against the Dealer!')
        .addIntegerOption(option =>
            option.setName('bet')
                .setDescription('Wager directly to play solo immediately (skips multiplayer lobby)')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply();

        const betOption = interaction.options.getInteger('bet');

        if (betOption !== null) {
            // --- SOLO MODE ---
            if (betOption < 10 || betOption > 100000) {
                return interaction.editReply({ content: '❌ Bet must be between **10** and **100,000** cherries.' });
            }

            const pId = interaction.user.id;
            const pUsername = interaction.user.username;

            const currentBalance = db.getBalance(pId, (interaction.guild ? interaction.guild.id : 'GLOBAL'));

            if (currentBalance < betOption) {
                return interaction.editReply({ content: `❌ You do not have enough cherries! Balance: 🍒 **${currentBalance.toLocaleString()}**` });
            }

            db.deductCoins(pId, (interaction.guild ? interaction.guild.id : 'GLOBAL'), betOption);

            const soloPlayer = { pId, username: pUsername, bet: betOption, hand: [], hasDecided: false, status: 'Playing' };
            
            return startPokdengRound(interaction, [soloPlayer]);
        }

        // --- MULTIPLAYER LOBBY MODE ---
        const lobbyPlayers = {}; // id -> { username, bet, hand: [] }
        const hostId = interaction.user.id;

        const updateLobbyEmbed = (timeLeft) => {
            const list = Object.values(lobbyPlayers);
            const joinedText = list.length === 0 
                ? '*No players have joined yet!*' 
                : list.map(p => `• **${p.username}**: wagered 🍒 **${p.bet.toLocaleString()}** cherries`).join('\n');

            return new EmbedBuilder()
                .setColor('#f472b6')
                .setTitle('🎀 ល្បែងបឹកក្ដាំង | Cute Pokdeng Lobby 🎀')
                .setDescription(
                    `🟢 **Betting Open - ${timeLeft}s left**\n` +
                    `Click the buttons below to place your wagers and join the table!\n\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                    `👥 **Table Seats:**\n${joinedText}\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━━━━━`
                )
                .setFooter({ text: 'Min: 10 • Max: 100,000 • Max 5 players per table' });
        };

        const joinBtn = new ButtonBuilder()
            .setCustomId('pd_action_join')
            .setLabel('🍒 Place Bet & Join')
            .setStyle(ButtonStyle.Success);

        const dealBtn = new ButtonBuilder()
            .setCustomId('pd_action_deal')
            .setLabel('🎲 Deal Cards')
            .setStyle(ButtonStyle.Primary);

        const controlRow = new ActionRowBuilder().addComponents(joinBtn, dealBtn);

        let secondsLeft = LOBBY_TIME / 1000;
        const lobbyMsg = await interaction.editReply({
            embeds: [updateLobbyEmbed(secondsLeft)],
            components: [controlRow]
        });

        const collector = lobbyMsg.createMessageComponentCollector({ time: LOBBY_TIME });

        const countdownInterval = setInterval(async () => {
            secondsLeft -= 5;
            if (secondsLeft > 0) {
                await interaction.editReply({ embeds: [updateLobbyEmbed(secondsLeft)] }).catch(() => {});
            }
        }, 5000);

        collector.on('collect', async (i) => {
            const pId = i.user.id;
            const pUsername = i.user.username;

            if (i.customId === 'pd_action_join') {
                if (Object.keys(lobbyPlayers).length >= 5) {
                    return i.reply({ content: '❌ The table is full! (Max 5 players per round)', flags: MessageFlags.Ephemeral });
                }

                const modal = new ModalBuilder()
                    .setCustomId(`pd_modal_${pId}`)
                    .setTitle('Place Pokdeng Bet');

                const betInput = new TextInputBuilder()
                    .setCustomId('pd_modal_input')
                    .setLabel('Min: 10 | Max: 100,000')
                    .setPlaceholder('e.g., 500, 10k, all, half')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const row = new ActionRowBuilder().addComponents(betInput);
                modal.addComponents(row);

                await i.showModal(modal);

                try {
                    const modalSubmit = await i.awaitModalSubmit({
                        filter: msInteraction => msInteraction.customId === `pd_modal_${pId}` && msInteraction.user.id === pId,
                        time: 30000
                    });

                    await modalSubmit.deferUpdate();
                    const inputVal = modalSubmit.fields.getTextInputValue('pd_modal_input');

                    const currentBalance = db.getBalance(pId, (interaction.guild ? interaction.guild.id : 'GLOBAL'));

                    const betAmount = parseBetAmount(inputVal, currentBalance);

                    if (isNaN(betAmount) || betAmount < 10 || betAmount > 100000) {
                        return modalSubmit.followUp({ content: `❌ **${pUsername}**, bet must be a number between **10** and **100,000** cherries.`, flags: MessageFlags.Ephemeral });
                    }

                    if (currentBalance < betAmount) {
                        return modalSubmit.followUp({ content: `❌ **${pUsername}**, you do not have enough cherries! Balance: 🍒 **${currentBalance.toLocaleString()}**`, flags: MessageFlags.Ephemeral });
                    }

                    db.deductCoins(pId, (interaction.guild ? interaction.guild.id : 'GLOBAL'), betAmount);

                    lobbyPlayers[pId] = { pId, username: pUsername, bet: betAmount, hand: [], hasDecided: false, status: 'Playing' };

                    await interaction.editReply({ embeds: [updateLobbyEmbed(secondsLeft)] });

                } catch (e) {
                    // Modal timeout
                }

            } else if (i.customId === 'pd_action_deal') {
                if (pId !== hostId) {
                    return i.reply({ content: `❌ Only the game host (<@${hostId}>) can deal cards early!`, flags: MessageFlags.Ephemeral });
                }
                await i.deferUpdate();
                collector.stop('deal_now');
            }
        });

        collector.on('end', async (collected, reason) => {
            clearInterval(countdownInterval);

            const activePlayers = Object.values(lobbyPlayers);
            if (activePlayers.length === 0) {
                return interaction.editReply({ content: '⏱️ Game canceled. No players joined the Pokdeng table.', embeds: [], components: [] });
            }

            return startPokdengRound(interaction, activePlayers);
        });
    }
};
