const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    MessageFlags,
    AttachmentBuilder
} = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const db = require('../database.js');

function drawCoinflipCard(username, bet, isWin, newBalance, xpReward = 0) {
    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;

    // 1. Draw Pink Pastel Casino Felt Background
    const feltGrad = ctx.createRadialGradient(400, 200, 50, 400, 200, 450);
    feltGrad.addColorStop(0, '#fbcfe8'); // Pink 200
    feltGrad.addColorStop(1, '#fdf4ff'); // Fuchsia 50
    ctx.fillStyle = feltGrad;
    ctx.fillRect(0, 0, 800, 400);

    // Pink oval margin boundary
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.4)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(400, 200, 360, 160, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Left Panel (The Coin)
    const coinX = 60;
    const coinY = 60;
    const coinW = 320;
    const coinH = 280;

    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(coinX, coinY, coinW, coinH, 12);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Draw Gold/Silver coin in center of panel
    const cx = coinX + coinW / 2;
    const cy = coinY + coinH / 2;
    const radius = 75;

    ctx.save();
    // Coin 3D Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 8;

    // Metallic Gradient
    const coinGrad = ctx.createRadialGradient(cx - 20, cy - 20, 10, cx, cy, radius);
    if (isWin) {
        // Pink Coin (Cherry)
        coinGrad.addColorStop(0, '#fce7f3');
        coinGrad.addColorStop(0.5, '#f472b6');
        coinGrad.addColorStop(1, '#db2777');
    } else {
        // Silver Coin (Blank)
        coinGrad.addColorStop(0, '#831843');
        coinGrad.addColorStop(0.5, '#e2e8f0');
        coinGrad.addColorStop(1, '#9d174d');
    }
    ctx.fillStyle = coinGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Coin Ridges / Border Ring
    ctx.strokeStyle = isWin ? '#be185d' : '#be185d';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 4, 0, Math.PI * 2);
    ctx.stroke();

    // Coin Center Emblem
    ctx.fillStyle = isWin ? '#831843' : '#334155';
    ctx.font = '54px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isWin ? '🍒' : '🤍', cx, cy - 10);

    // Coin Label
    ctx.font = 'bold 12px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.fillStyle = isWin ? '#831843' : '#334155';
    ctx.fillText(isWin ? 'CHERRY' : 'BLANK', cx, cy + 36);

    // 3. Right Panel (The Ledger)
    const ledX = 420;
    const ledY = 60;
    const ledW = 320;
    const ledH = 280;

    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(ledX, ledY, ledW, ledH, 12);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Ledger title
    ctx.fillStyle = '#be185d';
    ctx.font = 'bold 10px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.fillText('🎀 CASINO COIN FLIP LEDGER', ledX + 20, ledY + 30);

    // Divider
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ledX + 20, ledY + 42);
    ctx.lineTo(ledX + ledW - 20, ledY + 42);
    ctx.stroke();

    // Wager Info
    ctx.fillStyle = '#9d174d';
    ctx.font = '12px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.fillText(`Wagered Stake:`, ledX + 20, ledY + 75);
    ctx.fillStyle = '#831843';
    ctx.font = 'bold 13px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.fillText(`🍒 ${bet.toLocaleString()} cherries`, ledX + 160, ledY + 75);

    // Outcome Badge
    ctx.fillStyle = isWin ? '#db2777' : '#9ca3af';
    ctx.font = 'bold 16px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.fillText(isWin ? '🏆 DOUBLE PAYOUT' : '🤍 LOST BET', ledX + 20, ledY + 125);

    ctx.fillStyle = '#9d174d';
    ctx.font = '11px "Segoe UI", "Segoe UI Emoji", sans-serif';
    if (isWin) {
        ctx.fillText(`Wallet Profit: +🍒 ${bet.toLocaleString()} cherries`, ledX + 20, ledY + 155);
        if (xpReward > 0) {
            ctx.fillText(`Bonus Experience: +✨ ${xpReward} XP`, ledX + 20, ledY + 175);
        }
    } else {
        ctx.fillText(`Wallet Loss: -🍒 ${bet.toLocaleString()} cherries`, ledX + 20, ledY + 155);
    }

    // Divider
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.2)';
    ctx.beginPath();
    ctx.moveTo(ledX + 20, ledY + 205);
    ctx.lineTo(ledX + ledW - 20, ledY + 205);
    ctx.stroke();

    // Purse update
    ctx.fillStyle = '#9d174d';
    ctx.font = 'bold 9px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.fillText('NEW WALLET BALANCE', ledX + 20, ledY + 230);

    ctx.fillStyle = '#be185d';
    ctx.font = 'bold 18px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.fillText(`🍒 ${newBalance.toLocaleString()} cherries`, ledX + 20, ledY + 252);

    return canvas.toBuffer('image/png');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gamble')
        .setDescription('🎰 Wager your cherries or view your VIP gambling license stats')
        .addSubcommand(sub =>
            sub.setName('flip')
                .setDescription('🍒 Wager your cherries on a high-stakes coin flip!')
                .addIntegerOption(option =>
                    option.setName('bet')
                        .setDescription('The amount of cherries you want to wager')
                        .setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('stats')
                .setDescription('📊 View your visual Casino VIP Membership card')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to view')
                        .setRequired(false))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        if (subcommand === 'flip') {
            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

            try {
                const bet = interaction.options.getInteger('bet');
                const userId = interaction.user.id;

                if (bet <= 0) {
                    return interaction.editReply({ 
                        content: '❌ Your wager must be a positive integer greater than 0!' 
                    });
                }

                const currentBalance = db.getBalance(userId, guildId);
                if (currentBalance < bet) {
                    return interaction.editReply({ 
                        content: `❌ Overdraft! You are trying to bet **${bet}** cherries, but your wallet only holds **${currentBalance}**.`
                    });
                }

                const isWin = Math.random() < 0.5;
                const embed = new EmbedBuilder().setTimestamp();
                let xpReward = 0;
                let levelResult = null;

                if (isWin) {
                    xpReward = Math.floor(bet * 0.2) + 10;
                    db.addCoins(userId, guildId, bet);
                    levelResult = db.addXp(userId, guildId, xpReward);

                    embed
                        .setColor('#f472b6')
                        .setTitle('🍒 COIN FLIP: WINNER! 🎀')
                        .setDescription(`The coin landed on **Cherry**! You doubled your wager.\n\n📈 **Earnings Ledger:**`)
                        .addFields(
                            { name: 'Wallet Profit', value: `+🍒 **${bet}** cherries`, inline: true },
                            { name: 'Bonus Experience', value: `+✨ **${xpReward}** XP`, inline: true }
                        );

                    if (levelResult && levelResult.leveledUp) {
                        embed.addFields({ name: '🚀 RANK ADVANCEMENT!', value: `Your massive win pushed you up to **Level ${levelResult.newLevel}**!`, inline: false });
                    }

                } else {
                    db.deductCoins(userId, guildId, bet);
                    embed
                        .setColor('#9ca3af')
                        .setTitle('🤍 COIN FLIP: LOST... 🤍')
                        .setDescription(`The coin landed on **Blank**... Better luck next time.`)
                        .addFields(
                            { name: 'Wallet Loss', value: `-🍒 **${bet}** cherries`, inline: false }
                        );
                }

                const newBalance = db.getBalance(userId, guildId);
                const buffer = drawCoinflipCard(interaction.user.username, bet, isWin, newBalance, xpReward);
                const attachment = new AttachmentBuilder(buffer, { name: 'coin-flip.png' });

                embed.setImage('attachment://coin-flip.png');
                await interaction.editReply({ embeds: [embed], files: [attachment] });

            } catch (error) {
                console.error('Gamble command error:', error);
                await interaction.editReply({ content: '❌ An error occurred while processing your wager.' });
            }
        } 
        
        else if (subcommand === 'stats') {
            await interaction.deferReply();

            const targetUser = interaction.options.getUser('user') || interaction.user;
            const char = db.getCharacter(targetUser.id);

            if (!char || !char.char_name) {
                return interaction.editReply({
                    content: `❌ **This player does not have an RPG character yet!**`
                });
            }

            try {
                // Fetch stats from DB
                const sSpins = char.slots_spins || 0;
                const sWinnings = char.slots_won_coins || 0;
                const bjHands = char.blackjack_hands || 0;
                const bjWinnings = char.blackjack_won_coins || 0;
                const totalActivity = sSpins + bjHands;

                // Determine VIP Title
                let vipTitle = 'Guest Passerby';
                let titleColor = '#9d174d'; // Slate
                if (totalActivity >= 50) {
                    vipTitle = '🎀 Royal Cherry VIP';
                    titleColor = '#db2777'; // Pink 600
                } else if (totalActivity >= 20) {
                    vipTitle = '✨ Diamond Cute Roller';
                    titleColor = '#f472b6'; // Pink 400
                } else if (totalActivity >= 10) {
                    vipTitle = '🌸 Pastel Club Member';
                    titleColor = '#fbcfe8'; // Pink 200
                } else if (totalActivity >= 1) {
                    vipTitle = '🎟️ Active Gambler';
                    titleColor = '#c084fc'; // Purple
                }

                // Setup Canvas
                const width = 800;
                const height = 450;
                const canvas = createCanvas(width, height);
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;

                // 1. Cute Pastel Radial Background
                const bgGrad = ctx.createRadialGradient(width/2, height/2, 50, width/2, height/2, width/2);
                bgGrad.addColorStop(0, '#fdf4ff'); // Fuchsia 50
                bgGrad.addColorStop(1, '#fce7f3'); // Pink 100
                ctx.fillStyle = bgGrad;
                ctx.fillRect(0, 0, width, height);

                // 2. Pink Border Frame
                const frameColor = '#db2777'; // Pink 600
                ctx.save();
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'; // Frosted inner
                ctx.strokeStyle = frameColor;
                ctx.lineWidth = 4;
                ctx.shadowColor = 'rgba(244, 114, 182, 0.4)';
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.roundRect(40, 30, 720, 390, 16);
                ctx.fill();
                ctx.stroke();
                ctx.restore();

                // Decorative double border
                ctx.strokeStyle = 'rgba(244, 114, 182, 0.3)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(48, 38, 704, 374, 12);
                ctx.stroke();

                // 3. Left Avatar Frame
                ctx.save();
                ctx.fillStyle = 'rgba(251, 207, 232, 0.4)'; // Pink 200 translucent
                ctx.strokeStyle = 'rgba(244, 114, 182, 0.5)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(70, 90, 200, 270, 12);
                ctx.fill();
                ctx.stroke();
                ctx.restore();

                // Load and Draw Avatar
                let avatarImg = null;
                try {
                    const avatarUrl = targetUser.displayAvatarURL({ extension: 'png', size: 128 });
                    avatarImg = await loadImage(avatarUrl);
                } catch (e) {}

                ctx.save();
                ctx.beginPath();
                ctx.arc(170, 220, 55, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();

                if (avatarImg) {
                    ctx.drawImage(avatarImg, 115, 165, 110, 110);
                } else {
                    ctx.fillStyle = '#4b5563';
                    ctx.fill();
                }
                ctx.restore();

                // Draw Avatar Gold Ring
                ctx.save();
                ctx.strokeStyle = frameColor;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(170, 220, 55, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();

                // 4. Right Side Text Details
                ctx.fillStyle = '#db2777'; // Pink 600
                ctx.font = 'bold 12px "Segoe UI", "Segoe UI Emoji", sans-serif';
                ctx.fillText('🎀 CUTE CASINO VIP MEMBERSHIP CARD', 300, 95);

                ctx.fillStyle = '#831843';
                ctx.font = 'bold 28px "Segoe UI", "Segoe UI Emoji", sans-serif';
                ctx.fillText(char.char_name, 300, 135);

                ctx.fillStyle = titleColor;
                ctx.font = 'bold 14px "Segoe UI", "Segoe UI Emoji", sans-serif';
                ctx.fillText(vipTitle, 300, 162);

                // Divider line
                ctx.strokeStyle = 'rgba(244, 114, 182, 0.2)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(300, 185);
                ctx.lineTo(710, 185);
                ctx.stroke();

                // Details Grid
                ctx.fillStyle = '#be185d';
                ctx.font = '12px "Segoe UI", "Segoe UI Emoji", sans-serif';
                ctx.fillText('Account ID / Holder:', 300, 215);
                ctx.fillStyle = '#831843';
                ctx.font = 'bold 13px "Segoe UI", "Segoe UI Emoji", sans-serif';
                ctx.fillText(`<@${targetUser.id}>`, 440, 215);

                ctx.fillStyle = '#be185d';
                ctx.font = '12px "Segoe UI", "Segoe UI Emoji", sans-serif';
                ctx.fillText('Progressive Slots:', 300, 255);
                ctx.fillStyle = '#831843';
                ctx.font = 'bold 13px "Segoe UI", "Segoe UI Emoji", sans-serif';
                ctx.fillText(`${sSpins} spins (Won: 🍒 ${sWinnings.toLocaleString()})`, 440, 255);

                ctx.fillStyle = '#be185d';
                ctx.font = '12px "Segoe UI", "Segoe UI Emoji", sans-serif';
                ctx.fillText('Blackjack Hands:', 300, 295);
                ctx.fillStyle = '#831843';
                ctx.font = 'bold 13px "Segoe UI", "Segoe UI Emoji", sans-serif';
                ctx.fillText(`${bjHands} hands (Won: 🍒 ${bjWinnings.toLocaleString()})`, 440, 295);

                ctx.fillStyle = '#be185d';
                ctx.font = '12px "Segoe UI", "Segoe UI Emoji", sans-serif';
                ctx.fillText('Casino Profit Ledger:', 300, 335);
                ctx.fillStyle = '#db2777'; // Pink 600
                ctx.font = 'bold 14px "Segoe UI", "Segoe UI Emoji", sans-serif';
                ctx.fillText(`🍒 ${(sWinnings + bjWinnings).toLocaleString()} total won`, 440, 335);

                // 5. Official Cute Casino Seal (bottom right)
                const sx = 660;
                const sy = 330;
                const sRadius = 45;
                ctx.save();
                const sealGrad = ctx.createLinearGradient(sx - sRadius, sy - sRadius, sx + sRadius, sy + sRadius);
                sealGrad.addColorStop(0, '#fbcfe8');
                sealGrad.addColorStop(0.5, '#f472b6');
                sealGrad.addColorStop(1, '#db2777');
                ctx.fillStyle = sealGrad;
                
                ctx.shadowColor = 'rgba(244, 114, 182, 0.4)';
                ctx.shadowBlur = 8;
                ctx.shadowOffsetY = 4;

                ctx.beginPath();
                ctx.arc(sx, sy, sRadius, 0, Math.PI * 2);
                ctx.fill();

                // Seal border
                ctx.strokeStyle = '#831843';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(sx, sy, sRadius - 5, 0, Math.PI * 2);
                ctx.stroke();

                // Seal Icon
                ctx.fillStyle = '#831843';
                ctx.font = 'bold 24px "Segoe UI", "Segoe UI Emoji", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🎀', sx, sy);
                ctx.restore();

                const buffer = canvas.toBuffer('image/png');
                const attachment = new AttachmentBuilder(buffer, { name: 'vip-card.png' });

                const vipEmbed = new EmbedBuilder()
                    .setColor('#f472b6')
                    .setTitle(`🎀 Casino VIP License Card`)
                    .setDescription(`Official high-roller gambling operating permit details for **${char.char_name}**.`)
                    .setImage('attachment://vip-card.png')
                    .setTimestamp();

                await interaction.editReply({ embeds: [vipEmbed], files: [attachment] });

            } catch (err) {
                console.error('Error drawing VIP card:', err);
                await interaction.editReply('❌ There was an error while generating your visual VIP Card.');
            }
        }
    },
};