const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    MessageFlags,
    AttachmentBuilder
} = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const db = require('../database.js');
// const db = require('../path/to/database.js'); 
// Adjust the "../path/to/" to match your folder structure
function calculateHand(hand) {
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

function getCardImageUrl(card) {
    const codeValue = card.value === '10' ? '0' : card.value;
    const suitMap = { '♠': 'S', '♥': 'H', '♦': 'D', '♣': 'C' };
    return `https://deckofcardsapi.com/static/img/${codeValue}${suitMap[card.suit]}.png`;
}

function drawCardLocal(ctx, x, y, width, height, card, hidden = false) {
    ctx.save();
    // Drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;
    
    // Card base
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 8);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 8);
    ctx.stroke();

    if (hidden) {
        // Pink back plate
        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.roundRect(x + 5, y + 5, width - 10, height - 10, 5);
        ctx.fill();

        // Pink inner border
        ctx.strokeStyle = '#fbcfe8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(x + 10, y + 10, width - 20, height - 20, 4);
        ctx.stroke();

        // Center card emblem
        ctx.fillStyle = '#ffffff';
        ctx.font = '22px "Segoe UI", "Segoe UI Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎀', x + width / 2, y + height / 2);
        return;
    }

    const isRed = ['♥', '♦'].includes(card.suit);
    ctx.fillStyle = isRed ? '#db2777' : '#831843';
    ctx.font = 'bold 18px "Segoe UI", "Segoe UI Emoji", sans-serif';

    // Top-left label
    ctx.fillText(card.value, x + 8, y + 22);

    // Center suit
    ctx.font = '34px "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(card.suit, x + width / 2, y + height / 2);
    
    // Bottom-right label
    ctx.save();
    ctx.translate(x + width - 8, y + height - 8);
    ctx.rotate(Math.PI);
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(card.value, 0, 0);
    ctx.restore();
}

async function drawHandPanel(ctx, x, y, width, height, title, totalText, hand, hideSecondCard = false) {
    // Panel glass backplate
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 16);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Title label
    ctx.fillStyle = '#be185d';
    ctx.font = 'bold 13px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.fillText(title.toUpperCase(), x + 20, y + 30);

    // Value total badge
    ctx.save();
    ctx.fillStyle = 'rgba(244, 114, 182, 0.2)';
    ctx.beginPath();
    ctx.roundRect(x + width - 130, y + 14, 110, 22, 5);
    ctx.fill();

    ctx.fillStyle = '#831843';
    ctx.font = 'bold 10px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(totalText, x + width - 75, y + 28);
    ctx.restore();

    // Draw cards side-by-side
    const cardW = 70;
    const cardH = 105;
    const padding = 12;
    const startX = x + 20;
    const startY = y + 55;

    for (let i = 0; i < hand.length; i++) {
        drawCardLocal(ctx, startX + i * (cardW + padding), startY, cardW, cardH, hand[i], hideSecondCard && i === 1);
    }
}

async function generatePremiumTable(playerHand, dealerHand, hideDealer = true) {
    const canvas = createCanvas(800, 480);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;

    // 1. Draw Cute Pastel Casino Table Felt
    const feltGrad = ctx.createRadialGradient(400, 240, 50, 400, 240, 450);
    feltGrad.addColorStop(0, '#fdf4ff'); // Fuchsia 50
    feltGrad.addColorStop(0.8, '#fce7f3'); // Pink 100
    feltGrad.addColorStop(1, '#fbcfe8'); // Pink 200
    ctx.fillStyle = feltGrad;
    ctx.fillRect(0, 0, 800, 480);

    // Pink oval line marking table boundary
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(400, 240, 360, 200, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Watermark casino label
    ctx.fillStyle = 'rgba(219, 39, 119, 0.05)';
    ctx.font = 'bold 24px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎀 CUTE VIP CASINO', 400, 180);

    ctx.fillStyle = 'rgba(219, 39, 119, 0.1)';
    ctx.font = 'bold 11px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.fillText('PAYS 3 TO 2 ┃ DEALER MUST STAND ON 17', 400, 210);

    const pValue = calculateHand(playerHand);
    const dValue = hideDealer ? calculateHand([dealerHand[0]]) : calculateHand(dealerHand);

    // 2. Draw Dealer Hand Panel (Top half)
    await drawHandPanel(
        ctx, 60, 40, 680, 180,
        "Dealer's Hand",
        hideDealer ? `SHOWING: ${dValue}` : `TOTAL: ${dValue}`,
        dealerHand,
        hideDealer
    );

    // 3. Draw Player Hand Panel (Bottom half)
    await drawHandPanel(
        ctx, 60, 260, 680, 180,
        "Your Hand",
        `TOTAL: ${pValue}`,
        playerHand,
        false
    );

    return canvas.toBuffer('image/png');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blackjack')
        .setDescription('🎰 Premium Live Casino Blackjack')
        .addIntegerOption(option =>
            option.setName('bet')
                .setDescription('The amount of cherries to wager')
                .setRequired(true)),
    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        let bet = interaction.options.getInteger('bet');

        if (bet <= 0) {
            return interaction.reply({ content: '❌ Wager must be greater than 0!', flags: [MessageFlags.Ephemeral] });
        }

        const currentBalance = db.getBalance(userId, guildId);
        if (currentBalance < bet) {
            return interaction.reply({ content: `❌ Insufficient funds. Balance: 🍒 **${currentBalance}**`, flags: [MessageFlags.Ephemeral] });
        }

        await interaction.deferReply();

        // Deck Generation & Shuffle
        const suits = ['♠', '♥', '♦', '♣'];
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        const deck = [];
        for (const suit of suits) {
            for (const value of values) { deck.push({ suit, value }); }
        }
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }

        const playerHand = [deck.pop(), deck.pop()];
        const dealerHand = [deck.pop(), deck.pop()];
        let pValue = calculateHand(playerHand);

        // Build Initial UI Components
        const embed = new EmbedBuilder()
            .setColor('#f472b6')
            .setTitle('🎀 CUTE VIP BLACKJACK TABLE')
            .setDescription(`Current Wager: 🍒 **${bet}** cherries\nUse the interaction controls below to manage your hand sequence.`)
            .setImage('attachment://premium-table.png');

        const hitBtn = new ButtonBuilder().setCustomId('bj_hit').setLabel('Hit').setStyle(ButtonStyle.Primary);
        const standBtn = new ButtonBuilder().setCustomId('bj_stand').setLabel('Stand').setStyle(ButtonStyle.Secondary);
        let row = new ActionRowBuilder().addComponents(hitBtn, standBtn);

        let imageBuffer = await generatePremiumTable(playerHand, dealerHand, true);
        let attachment = new AttachmentBuilder(imageBuffer, { name: 'premium-table.png' });

        const gameMessage = await interaction.editReply({ embeds: [embed], files: [attachment], components: [row] });

        const collector = gameMessage.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            time: 60000
        });

        let gameData = { playerHand, dealerHand, deck, bet, pValue };

        collector.on('collect', async (i) => {
            await i.deferUpdate();

            if (i.customId === 'bj_hit') {
                gameData.playerHand.push(gameData.deck.pop());
                gameData.pValue = calculateHand(gameData.playerHand);

                if (gameData.pValue > 21) {
                    collector.stop('busted');
                } else {
                    imageBuffer = await generatePremiumTable(gameData.playerHand, gameData.dealerHand, true);
                    attachment = new AttachmentBuilder(imageBuffer, { name: 'premium-table.png' });
                    await interaction.editReply({ files: [attachment] });
                }
            }

            if (i.customId === 'bj_stand') {
                collector.stop('stand');
            }
        });

        collector.on('end', async (collected, reason) => {
            let finalPScore = calculateHand(gameData.playerHand);
            let finalDScore = calculateHand(gameData.dealerHand);

            if (reason === 'stand' && finalPScore <= 21) {
                while (finalDScore < 17) {
                    gameData.dealerHand.push(gameData.deck.pop());
                    finalDScore = calculateHand(gameData.dealerHand);
                }
            }

            let title = '🃏 Round Ended';
            let description = '';
            let finalColor = '#f472b6';
            let winCoins = 0;

            if (reason === 'busted' || finalPScore > 21) {
                db.deductCoins(userId, guildId, gameData.bet);
                title = '💥 YOU BUSTED';
                description = `House takes your wager. Lose: 🍒 **${gameData.bet}** cherries.`;
                finalColor = '#fb7185';
            } else if (finalDScore > 21) {
                db.addCoins(userId, guildId, gameData.bet);
                title = '🎉 DEALER BUSTED';
                description = `Excellent hand! Payout: 🍒 **${gameData.bet}** cherries.`;
                finalColor = '#f472b6';
                winCoins = gameData.bet;
            } else if (finalPScore > finalDScore) {
                db.addCoins(userId, guildId, gameData.bet);
                title = '🎉 YOU WIN';
                description = `You outscored the dealer! Payout: 🍒 **${gameData.bet}** cherries.`;
                finalColor = '#f472b6';
                winCoins = gameData.bet;
            } else if (finalPScore < finalDScore) {
                db.deductCoins(userId, guildId, gameData.bet);
                title = '❌ HOUSE WINS';
                description = `Dealer wins this round. Lose: 🍒 **${gameData.bet}** cherries.`;
                finalColor = '#fb7185';
            } else {
                title = '🤝 TABLE PUSH';
                description = 'Stakes returned to your ledger.';
                finalColor = '#fbcfe8';
            }

            db.prepare("UPDATE users SET blackjack_hands = blackjack_hands + 1, blackjack_won_coins = blackjack_won_coins + ? WHERE userId = ?").run(winCoins, userId);

            // Render final image with the dealer's face-down card fully revealed
            const finalBuffer = await generatePremiumTable(gameData.playerHand, gameData.dealerHand, false);
            const finalAttachment = new AttachmentBuilder(finalBuffer, { name: 'premium-table.png' });

            let questProgressText = '';
            const freshChar = db.getCharacter(userId);
            if (freshChar && freshChar.active_quest_id === 'bj_3') {
                db.incrementQuestProgress(userId, 1);
                const currentProgress = (freshChar.quest_progress || 0) + 1;
                questProgressText = `\n\n📌 **Quest Progress:** Blackjack Shark (${currentProgress} / 3)`;
                if (currentProgress >= 3) {
                    questProgressText += ` (Completed! Run \`/quest claim\` for rewards)`;
                }
            }

            const finalEmbed = new EmbedBuilder()
                .setColor(finalColor)
                .setTitle(title)
                .setDescription(`${description}\n\n**Final Scores:**\n👤 You: \`${finalPScore}\` | 🏢 Dealer: \`${finalDScore}\`` + questProgressText)
                .setImage('attachment://premium-table.png');

            await interaction.editReply({ embeds: [finalEmbed], files: [finalAttachment], components: [] });
        });
    },
};