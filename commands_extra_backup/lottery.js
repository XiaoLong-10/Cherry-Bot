const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, PermissionFlagsBits } = require('discord.js');
const { createCanvas } = require('canvas');
const db = require('../database.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lottery')
        .setDescription('🎟️ Buy tickets and win the progressive lottery pool!')
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('📋 View current jackpot pool, draw timer, and your active tickets'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('buy')
                .setDescription('🛒 Purchase a lottery ticket (Cost: 100c)')
                .addIntegerOption(opt =>
                    opt.setName('number1')
                        .setDescription('Select your first number (1-9)')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(9))
                .addIntegerOption(opt =>
                    opt.setName('number2')
                        .setDescription('Select your second number (1-9)')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(9))
                .addIntegerOption(opt =>
                    opt.setName('number3')
                        .setDescription('Select your third number (1-9)')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(9)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('draw')
                .setDescription('⚙️ Draw the winning numbers and distribute wagers (Admin Only)')),

    async execute(interaction) {
        await interaction.deferReply();

        const userId = interaction.user.id;
        const guildId = interaction.guild ? (interaction.guild ? interaction.guild.id : 'GLOBAL') : 'GLOBAL';
        const subcommand = interaction.options.getSubcommand();

        const char = db.getCharacter(userId);
        if (!char || !char.char_name) {
            return interaction.editReply({ content: '⚠️ **You must create an RPG character first!** Use `/character create`.' });
        }

        // --- SUBCOMMAND: STATUS ---
        if (subcommand === 'status') {
            const state = db.getLotteryState();
            const pool = state ? state.pool : 1000;
            const lastDraw = state ? state.lastDrawTime : Date.now();

            const myTickets = db.getUserLotteryTickets(userId) || [];

            // Calculate draw countdown (24 hour cycles)
            const nextDraw = lastDraw + 24 * 60 * 60 * 1000;
            const remainingMs = nextDraw - Date.now();
            let timerText = 'Draw pending!';
            if (remainingMs > 0) {
                const hours = Math.floor(remainingMs / 3600000);
                const minutes = Math.floor((remainingMs % 3600000) / 60000);
                timerText = `${hours}h ${minutes}m`;
            }

            // Create Canvas
            const width = 800;
            const height = 450;
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;

            // Background
            ctx.fillStyle = '#fdf4ff';
            ctx.fillRect(0, 0, width, height);

            // Thin pink gridlines
            ctx.strokeStyle = 'rgba(244, 114, 182, 0.2)';
            ctx.lineWidth = 1;
            for (let x = 0; x < width; x += 30) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
            }
            for (let y = 0; y < height; y += 30) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
            }

            // 1. Draw Left Paper Ticket Stub
            const tX = 50;
            const tY = 50;
            const tW = 360;
            const tH = 350;

            // Ticket Shadow and Body
            ctx.save();
            ctx.shadowColor = 'rgba(219, 39, 119, 0.3)';
            ctx.shadowBlur = 15;
            ctx.fillStyle = '#831843'; // White paper
            ctx.strokeStyle = '#f472b6'; // Pink border
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(tX, tY, tW, tH, 16);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // Decorative pink border strip inside
            ctx.strokeStyle = 'rgba(244, 114, 182, 0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(tX + 10, tY + 10, tW - 20, tH - 20);

            // Ticket Header
            ctx.fillStyle = '#831843';
            ctx.font = 'bold 16px "Segoe UI", "Segoe UI Emoji", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🎀 CUTE CHERRY TICKET', tX + tW / 2, tY + 36);

            ctx.fillStyle = '#db2777';
            ctx.font = '9px "Segoe UI", "Segoe UI Emoji", sans-serif';
            ctx.fillText('Match 3 numbers for 100% Jackpot!', tX + tW / 2, tY + 54);

            // Perforated line
            ctx.strokeStyle = '#fbcfe8';
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(tX + 20, tY + 70);
            ctx.lineTo(tX + tW - 20, tY + 70);
            ctx.stroke();
            ctx.setLineDash([]); // reset

            // Wagers List
            ctx.textAlign = 'left';
            ctx.fillStyle = '#9d174d';
            ctx.font = 'bold 13px "Segoe UI", "Segoe UI Emoji", sans-serif';
            ctx.fillText('YOUR ACTIVE WAGERS:', tX + 30, tY + 100);

            if (myTickets.length === 0) {
                ctx.fillStyle = '#db2777';
                ctx.font = 'italic 12px "Segoe UI", "Segoe UI Emoji", sans-serif';
                ctx.fillText('• No active tickets in this round', tX + 30, tY + 130);
                ctx.fillText('• Purchase one using /lottery buy!', tX + 30, tY + 152);
            } else {
                ctx.fillStyle = '#831843';
                ctx.font = 'bold 13px Courier, monospace';
                
                myTickets.slice(0, 5).forEach((t, idx) => {
                    ctx.fillText(`Ticket #${idx + 1}:   [ ${t.n1} - ${t.n2} - ${t.n3} ]`, tX + 30, tY + 135 + idx * 30);
                });

                if (myTickets.length > 5) {
                    ctx.fillStyle = '#db2777';
                    ctx.font = 'italic 11px "Segoe UI", "Segoe UI Emoji", sans-serif';
                    ctx.fillText(`...and ${myTickets.length - 5} more tickets`, tX + 30, tY + 290);
                }
            }

            // Barcode lines at bottom
            const barY = tY + tH - 45;
            ctx.fillStyle = '#f472b6';
            let barX = tX + 45;
            const barHeights = [20, 20, 20, 20, 20];
            
            for (let i = 0; i < 24; i++) {
                const thickness = (i % 3 === 0) ? 4 : ((i % 5 === 0) ? 6 : 2);
                ctx.fillRect(barX, barY, thickness, 20);
                barX += thickness + 3;
            }

            // 2. Draw Right Stats Panel & Draw Tubes
            const rX = 440;
            const rY = 50;
            const rW = 310;
            const rH = 350;

            // Glass screen
            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.strokeStyle = 'rgba(244, 114, 182, 0.5)';
            ctx.lineWidth = 1.5;
            ctx.shadowColor = 'rgba(244, 114, 182, 0.3)';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.roundRect(rX, rY, rW, rH, 16);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // Jackpot Title
            ctx.fillStyle = '#be185d';
            ctx.font = 'bold 11px "Segoe UI", "Segoe UI Emoji", sans-serif';
            ctx.fillText('🎀 CURRENT JACKPOT POOL', rX + 20, rY + 36);

            // Pool Cash value
            ctx.fillStyle = '#db2777';
            ctx.font = 'bold 26px "Segoe UI", "Segoe UI Emoji", sans-serif';
            ctx.fillText(`🍒 ${pool.toLocaleString()}`, rX + 20, rY + 68);

            ctx.fillStyle = '#f472b6';
            ctx.font = 'bold 11px "Segoe UI", "Segoe UI Emoji", sans-serif';
            ctx.fillText(`⏱️ DRAW TIME: ${timerText}`, rX + 20, rY + 98);

            // Dividing line
            ctx.strokeStyle = 'rgba(244, 114, 182, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(rX + 20, rY + 120);
            ctx.lineTo(rX + rW - 20, rY + 120);
            ctx.stroke();

            // 3 Draw Tubes & Balls
            ctx.fillStyle = '#831843';
            ctx.font = 'bold 12px "Segoe UI", "Segoe UI Emoji", sans-serif';
            ctx.fillText('WINNING NUMBERS:', rX + 20, rY + 155);

            const ballRadius = 24;
            const positionsX = [rX + 60, rX + 155, rX + 250];
            const ballY = rY + 225;

            positionsX.forEach((bx) => {
                // Glass tube outline
                ctx.strokeStyle = '#fbcfe8';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(bx - 32, ballY - 45, 64, 90, 8);
                ctx.stroke();

                // Ball shape
                ctx.save();
                ctx.fillStyle = '#fce7f3'; // Soft pink
                ctx.shadowColor = '#f472b6';
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(bx, ballY, ballRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                // Inside Question mark
                ctx.fillStyle = '#db2777';
                ctx.font = 'bold 22px "Segoe UI", "Segoe UI Emoji", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('?', bx, ballY);
                ctx.textBaseline = 'alphabetic';
                ctx.textAlign = 'left';
            });

            ctx.fillStyle = '#db2777';
            ctx.font = 'italic 11px "Segoe UI", "Segoe UI Emoji", sans-serif';
            ctx.fillText('Numbers will roll during draw event', rX + 20, rY + 312);

            const buffer = canvas.toBuffer('image/png');
            const attachment = new AttachmentBuilder(buffer, { name: 'lottery-stub.png' });

            const embed = new EmbedBuilder()
                .setColor('#f472b6')
                .setTitle('🎀 CUTE LOTTERY PORTAL')
                .setDescription(
                    `Buy tickets to win the progressive pool! Wager: **100 cherries** per ticket.\n` +
                    `Each ticket requires picking 3 numbers between 1 and 9.`
                )
                .setImage('attachment://lottery-stub.png')
                .setTimestamp();

            await interaction.editReply({ embeds: [embed], files: [attachment] });
        }

        // --- SUBCOMMAND: BUY ---
        else if (subcommand === 'buy') {
            const n1 = interaction.options.getInteger('number1');
            const n2 = interaction.options.getInteger('number2');
            const n3 = interaction.options.getInteger('number3');

            const currentBalance = db.getBalance(userId, guildId);
            if (currentBalance < 100) {
                return interaction.editReply({ content: `❌ **Insufficient funds!** Buying a ticket costs **🍒 100** cherries (Your Balance: **🍒 ${currentBalance.toLocaleString()}**).` });
            }

            // Deduct ticket price
            db.deductCoins(userId, guildId, 100);
            
            // Add 80% of ticket price to the progressive pool (80 coins)
            db.addLotteryPool(80);

            // Save ticket
            db.buyLotteryTicket(userId, guildId, n1, n2, n3);
            db.logTransaction(userId, 'Lottery Buy', `Wagered 100c on ticket numbers: [ ${n1} - ${n2} - ${n3} ]`);

            const state = db.getLotteryState();
            const pool = state ? state.pool : 1000;

            const buyEmbed = new EmbedBuilder()
                .setColor('#f472b6')
                .setTitle('🎀 LOTTERY TICKET PURCHASED')
                .setDescription(
                    `You successfully purchased a lottery ticket for **100 cherries**!\n\n` +
                    `• **Selected Numbers:** \` [ ${n1} - ${n2} - ${n3} ] \`\n` +
                    `• **Progressive Pool:** \` 🍒 ${pool.toLocaleString()} \` cherries\n\n` +
                    `*Run \`/lottery status\` to view your active ticket stub.*`
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [buyEmbed] });
        }

        // --- SUBCOMMAND: DRAW ---
        else if (subcommand === 'draw') {
            // Require Admin permission
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.editReply({ content: '❌ Only guild Administrators can trigger the lottery draw!' });
            }

            const state = db.getLotteryState();
            if (!state) {
                return interaction.editReply({ content: '❌ Lottery system state not initialized.' });
            }

            const pool = state.pool;

            // Roll 3 random numbers (1-9)
            const dn1 = Math.floor(Math.random() * 9) + 1;
            const dn2 = Math.floor(Math.random() * 9) + 1;
            const dn3 = Math.floor(Math.random() * 9) + 1;

            const tickets = db.getAllLotteryTickets() || [];

            let jackpotWinners = [];
            let consolationWinners = [];

            // Evaluate tickets
            tickets.forEach(t => {
                let matches = 0;
                if (t.n1 === dn1) matches++;
                if (t.n2 === dn2) matches++;
                if (t.n3 === dn3) matches++;

                if (matches === 3) {
                    jackpotWinners.push(t.userId);
                } else if (matches === 2) {
                    consolationWinners.push(t.userId);
                }
            });

            let payoutListText = '';
            let poolReset = false;

            // 1. Resolve Jackpot Payouts
            if (jackpotWinners.length > 0) {
                poolReset = true;
                const uniqueJackpotWinners = [...new Set(jackpotWinners)];
                const share = Math.floor(pool / uniqueJackpotWinners.length);

                uniqueJackpotWinners.forEach(winnerId => {
                    db.addCoins(winnerId, guildId, share);
                    db.logTransaction(winnerId, 'Lottery Jackpot Win', `Won lottery share of ${share} cherries`);
                    payoutListText += `• 🏆 **JACKPOT MATCH 3/3:** <@${winnerId}> won \` 🍒 ${share.toLocaleString()} \` cherries!\n`;
                });
            }

            // 2. Resolve Consolation Payouts (500 coins per match 2/3)
            if (consolationWinners.length > 0) {
                const uniqueConsolationWinners = [...new Set(consolationWinners)];
                uniqueConsolationWinners.forEach(winnerId => {
                    db.addCoins(winnerId, guildId, 500);
                    db.logTransaction(winnerId, 'Lottery Consolation Win', 'Won consolation prize of 500 cherries');
                    payoutListText += `• ✨ **Consolation Match 2/3:** <@${winnerId}> won \` 🍒 500 \` cherries!\n`;
                });
            }

            // Update progressive pool
            if (poolReset) {
                db.resetLotteryPool();
            } else {
                // If no jackpot, pool rolls over (updates last draw timestamp only)
                db.prepare("UPDATE lottery_state SET lastDrawTime = ? WHERE id = 1").run(Date.now());
            }

            // Clear tickets for next round
            db.clearLotteryTickets();

            // Build result message
            let resultText = '';
            if (jackpotWinners.length === 0 && consolationWinners.length === 0) {
                resultText = `❌ **No Matches.** The entire progressive pool of **🍒 ${pool.toLocaleString()}** rolls over to the next drawing round!`;
            } else {
                resultText = `🎉 **Draw complete! Payout distribution:**\n\n${payoutListText}`;
            }

            const drawEmbed = new EmbedBuilder()
                .setColor('#f472b6')
                .setTitle('🎀 PROGRESSIVE LOTTERY DRAW EVENT')
                .setDescription(
                    `# 🎀 **THE WINNING NUMBERS ARE IN** 🎀\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                    `🎯 **Drawn Numbers:** \` [ ${dn1} - ${dn2} - ${dn3} ] \`\n` +
                    `🍒 **Jackpot Wager Pool:** \` 🍒 ${pool.toLocaleString()} \` cherries\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                    `${resultText}\n\n` +
                    `*All tickets cleared. Next pool rollover seeded at 🍒 1,000.*`
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [drawEmbed] });
        }
    }
};
