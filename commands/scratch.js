const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    MessageFlags,
    AttachmentBuilder
} = require('discord.js');
const { createCanvas } = require('canvas');
const db = require('../database.js');

function drawScratchCard(username, board, revealed, clicks, maxClicks, statusMessage, winColor) {
    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;

    // 1. Draw Pink Pastel Background
    const feltGrad = ctx.createRadialGradient(400, 200, 50, 400, 200, 450);
    feltGrad.addColorStop(0, '#fbcfe8'); // Pink 200
    feltGrad.addColorStop(1, '#fdf4ff'); // Fuchsia 50
    ctx.fillStyle = feltGrad;
    ctx.fillRect(0, 0, 800, 400);

    // 2. Left Side (Cute Pink Scratch Ticket)
    const ticketX = 60;
    const ticketY = 50;
    const ticketW = 340;
    const ticketH = 300;

    ctx.save();
    // Ticket pink shadow
    ctx.shadowColor = 'rgba(244, 114, 182, 0.4)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 6;

    // Pink border gradient
    const goldGrad = ctx.createLinearGradient(ticketX, ticketY, ticketX + ticketW, ticketY + ticketH);
    goldGrad.addColorStop(0, '#fbcfe8');
    goldGrad.addColorStop(0.5, '#f472b6');
    goldGrad.addColorStop(1, '#db2777');
    ctx.fillStyle = goldGrad;
    ctx.beginPath();
    ctx.roundRect(ticketX, ticketY, ticketW, ticketH, 16);
    ctx.fill();
    ctx.restore();

    // Inner cute ticket felt
    ctx.fillStyle = '#fce7f3'; // Pink 100
    ctx.beginPath();
    ctx.roundRect(ticketX + 8, ticketY + 8, ticketW - 16, ticketH - 16, 12);
    ctx.fill();

    // Draw 3x3 Grid Cells
    const startX = ticketX + 22;
    const startY = ticketY + 22;
    const cellSize = 80;
    const cellGap = 18;

    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            const idx = r * 3 + c;
            const cx = startX + c * (cellSize + cellGap) + cellSize / 2;
            const cy = startY + r * (cellSize + cellGap) + cellSize / 2;

            if (!revealed[idx]) {
                // Shiny Pearl Foil Circle (Unscratched)
                ctx.save();
                ctx.shadowColor = 'rgba(244, 114, 182, 0.3)';
                ctx.shadowBlur = 4;
                ctx.shadowOffsetY = 2;

                const silverGrad = ctx.createRadialGradient(cx - 10, cy - 10, 5, cx, cy, cellSize / 2);
                silverGrad.addColorStop(0, '#ffffff');
                silverGrad.addColorStop(0.5, '#fce7f3');
                silverGrad.addColorStop(1, '#fbcfe8');
                ctx.fillStyle = silverGrad;

                ctx.beginPath();
                ctx.arc(cx, cy, cellSize / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                // Shiny pink star outline inside unscratched
                ctx.strokeStyle = 'rgba(219, 39, 119, 0.4)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize / 2 - 4, 0, Math.PI * 2);
                ctx.stroke();

                // Question mark
                ctx.fillStyle = '#be185d';
                ctx.font = 'bold 26px "Segoe UI", "Segoe UI Emoji", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('?', cx, cy);
            } else {
                // Scratched / Revealed cell
                ctx.fillStyle = 'rgba(244, 114, 182, 0.1)';
                ctx.strokeStyle = 'rgba(219, 39, 119, 0.2)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                // Draw Revealed Emoji
                ctx.font = '36px "Segoe UI", "Segoe UI Emoji", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(board[idx], cx, cy);
            }
        }
    }

    // 3. Right Side Status Ledger (Frosted Glass Panel)
    const ledX = 430;
    const ledY = 50;
    const ledW = 310;
    const ledH = 300;

    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(ledX, ledY, ledW, ledH, 16);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Title
    ctx.fillStyle = '#be185d';
    ctx.font = 'bold 11px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🎰 CUTE CASINO SCRATCHER 🎀', ledX + 20, ledY + 36);

    // Divider
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ledX + 20, ledY + 48);
    ctx.lineTo(ledX + ledW - 20, ledY + 48);
    ctx.stroke();

    // Scratches count
    ctx.fillStyle = '#9d174d';
    ctx.font = '12px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.fillText('Scratches Used:', ledX + 20, ledY + 80);
    ctx.fillStyle = '#831843';
    ctx.font = 'bold 13px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.fillText(`${clicks} / ${maxClicks} clicks`, ledX + 180, ledY + 80);

    // Status Board Title
    ctx.fillStyle = '#db2777';
    ctx.font = 'bold 10px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.fillText('LOBBY DEALER LOG:', ledX + 20, ledY + 120);

    // Dynamic Dealer Text Wrap
    ctx.fillStyle = '#9d174d';
    ctx.font = 'italic 12px "Segoe UI", "Segoe UI Emoji", sans-serif';
    
    // Simple text wrapping for statusMessage
    const words = statusMessage.replace(/\*\*|\*/g, '').split(' ');
    let line = '';
    let lineY = ledY + 142;
    for (let w = 0; w < words.length; w++) {
        const testLine = line + words[w] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > ledW - 40) {
            ctx.fillText(line, ledX + 20, lineY);
            line = words[w] + ' ';
            lineY += 18;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, ledX + 20, lineY);

    // Prize Ledger details
    ctx.fillStyle = '#be185d';
    ctx.font = '9px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.fillText('Prizes: 🍒 500 ┃ 🍋 1K ┃ 🎀 2.5K ┃ ✨ 10K', ledX + 20, ledY + 272);

    return canvas.toBuffer('image/png');
}

const SYMBOL_PAYOUTS = {
    '🍒': { label: 'Cherry', payout: 500 },
    '🍋': { label: 'Lemon', payout: 1000 },
    '🎀': { label: 'Ribbon', payout: 2500 },
    '✨': { label: 'Sparkle', payout: 10000 },
    '🥀': { label: 'Wilted Rose', payout: 0 },
    '🤍': { label: 'Blank', payout: 0 }
};

// Weighted pool to construct the 3x3 card
const POOL = [
    '🍒', '🍒', '🍒', '🍒',
    '🍋', '🍋', '🍋',
    '🎀', '🎀',
    '✨',
    '🥀', '🥀',
    '🤍', '🤍', '🤍'
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('scratch')
        .setDescription('🎰 Purchase and scratch an interactive Pink Scratch Card for 200 cherries!'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild ? (interaction.guild ? interaction.guild.id : 'GLOBAL') : 'GLOBAL';

        // 1. Verify Character
        const char = db.getCharacter(userId);
        if (!char || !char.char_name) {
            return interaction.reply({
                content: '⚠️ **You must create an RPG character first!**\nUse **`/character create`** to get started.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        // 2. Verify Balance
        const balance = db.getBalance(userId, guildId);
        const buyIn = 200;
        if (balance < buyIn) {
            return interaction.reply({
                content: `❌ **Insufficient funds!** Pink Scratch Cards cost 🍒 **${buyIn} cherries**. (Your Balance: 🍒 ${balance.toLocaleString()})`,
                flags: [MessageFlags.Ephemeral]
            });
        }

        await interaction.deferReply();

        try {
            // Deduct buy-in
            db.deductCoins(userId, guildId, buyIn);

            // Generate 3x3 board
            const board = [];
            for (let i = 0; i < 9; i++) {
                board.push(POOL[Math.floor(Math.random() * POOL.length)]);
            }

            // Game state variables
            let clicks = 0;
            const maxClicks = 4;
            const revealed = Array(9).fill(false);
            let gameEnded = false;
            let statusMessage = 'Click up to **4 boxes** below to scratch off the pink coating! Match 3 symbols to win. Hit a Wilted Rose 🥀 and you lose instantly!';
            let winColor = '#fbcfe8'; // default pink

            const getRows = () => {
                const rows = [];
                for (let r = 0; r < 3; r++) {
                    const row = new ActionRowBuilder();
                    for (let c = 0; c < 3; c++) {
                        const idx = r * 3 + c;
                        const btn = new ButtonBuilder()
                            .setCustomId(`scratch_cell_${idx}`)
                            .setLabel(revealed[idx] ? '' : '?')
                            .setEmoji(revealed[idx] ? board[idx] : '❓')
                            .setStyle(revealed[idx] ? ButtonStyle.Secondary : ButtonStyle.Primary)
                            .setDisabled(revealed[idx] || gameEnded);
                        row.addComponents(btn);
                    }
                    rows.push(row);
                }
                return rows;
            };

            const generatePayload = () => {
                const buffer = drawScratchCard(char.char_name, board, revealed, clicks, maxClicks, statusMessage, winColor);
                const attachment = new AttachmentBuilder(buffer, { name: 'scratch-card.png' });

                const embed = new EmbedBuilder()
                    .setColor(winColor)
                    .setTitle('🎀 PINK SCRATCH CARD 🎀')
                    .setAuthor({ name: `${char.char_name}'s Scratch Card`, iconURL: interaction.user.displayAvatarURL() })
                    .setDescription(
                        `# 🍒 **Cherry Casino Scratch-Off** 🍒\n` +
                        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                        `• **Scratches Used:** \` ${clicks} / ${maxClicks} \` clicks\n` +
                        `• **Buy-in:** \` -🍒 ${buyIn} \` cherries\n` +
                        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                        `📣 **Lobby Dealer:**\n` +
                        `*${statusMessage}*`
                    )
                    .setImage('attachment://scratch-card.png')
                    .setFooter({ text: 'Prize Ledger: 🍒 (🍒 500) ┃ 🍋 (🍒 1,000) ┃ 🎀 (🍒 2,500) ┃ ✨ (🍒 10,000)' })
                    .setTimestamp();

                return { embeds: [embed], files: [attachment], components: getRows() };
            };

            const replyMsg = await interaction.editReply(generatePayload());

            const collector = replyMsg.createMessageComponentCollector({
                filter: i => i.user.id === userId,
                time: 120000 // 2 minutes
            });

            collector.on('collect', async (i) => {
                if (gameEnded) return i.deferUpdate();

                const cellIdx = parseInt(i.customId.split('_')[2]);
                if (revealed[cellIdx]) return i.deferUpdate();

                clicks++;
                revealed[cellIdx] = true;
                const rolledSymbol = board[cellIdx];

                await i.deferUpdate();

                // Check Skull Loss
                if (rolledSymbol === '🥀') {
                    gameEnded = true;
                    statusMessage = '🥀 Ouch! A Wilted Rose! The card wilted away. You won nothing!';
                    winColor = '#fb7185'; // rose
                    db.logTransaction(userId, 'Scratch Card', 'Lost - hit a Wilted Rose 🥀');
                    collector.stop('skull');
                } else {
                    // Check Match 3 Winning Conditions
                    const counts = {};
                    revealed.forEach((rev, idx) => {
                        if (rev) {
                            const sym = board[idx];
                            counts[sym] = (counts[sym] || 0) + 1;
                        }
                    });

                    let matchedSymbol = null;
                    for (const sym in counts) {
                        if (counts[sym] >= 3 && sym !== '🤍') {
                            matchedSymbol = sym;
                            break;
                        }
                    }

                    if (matchedSymbol) {
                        gameEnded = true;
                        const payout = SYMBOL_PAYOUTS[matchedSymbol].payout;
                        db.addCoins(userId, guildId, payout);
                        db.logTransaction(userId, 'Scratch Card', `Won 🍒 ${payout} with 3x ${matchedSymbol} 🎉`);

                        statusMessage = `🎉 JACKPOT! 3x MATCH! You successfully scratched 3x ${SYMBOL_PAYOUTS[matchedSymbol].label} ${matchedSymbol}! Awarded payout: 🍒 ${payout.toLocaleString()} cherries!`;
                        winColor = '#f472b6'; // pink
                        collector.stop('win');
                    } else if (clicks >= maxClicks) {
                        gameEnded = true;
                        statusMessage = '❌ No scratches left! You did not match 3 symbols. Try again!';
                        winColor = '#be185d'; // dark pink
                        db.logTransaction(userId, 'Scratch Card', 'Lost - out of clicks');
                        collector.stop('out_of_clicks');
                    } else {
                        statusMessage = `You scratched a ${SYMBOL_PAYOUTS[rolledSymbol].label} ${rolledSymbol}. Click another box!`;
                    }
                }

                // Update Embed and buttons
                await interaction.editReply(generatePayload());
            });

            collector.on('end', async (_, reason) => {
                if (!gameEnded) {
                    gameEnded = true;
                    statusMessage = '⏳ Scratch Card Expired! Game timed out.';
                    winColor = '#cbd5e1'; // soft grey
                }

                // Final update with disabled buttons
                await interaction.editReply(generatePayload()).catch(() => null);
            });

        } catch (err) {
            console.error('Error in scratch card command:', err);
            await interaction.editReply('❌ There was an error while buying your Pink Scratch Card.');
        }
    }
};
