const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const db = require('../database.js');

function drawRoundCard(ctx, x, y, w, h, radius, fillColor, strokeColor, strokeWidth = 1) {
    ctx.save();
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fill();
    if (strokeColor) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.stroke();
    }
    ctx.restore();
}

function drawCircularAvatar(ctx, x, y, radius, img, fallbackText, fallbackBgColor) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    if (img) {
        ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
    } else {
        ctx.fillStyle = fallbackBgColor;
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.round(radius * 0.9)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(fallbackText.substring(0, 1).toUpperCase(), x, y);
    }
    ctx.restore();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('🏆 View the server\'s top 10 players on a premium visual podium board')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Choose between Wealth (Cherries) or Rank (Levels)')
                .setRequired(true)
                .addChoices(
                    { name: '🍒 Wealth (Cherries)', value: 'coins' },
                    { name: '🏆 Rank (Levels)', value: 'levels' }
                )),

    async execute(interaction) {
        await interaction.deferReply();

        const type = interaction.options.getString('type');
        const isWealth = type === 'coins';

        // 1. Fetch raw leaderboard data
        const rawData = isWealth ? db.getCoinLeaderboard(10) : db.getRankLeaderboard(10);
        if (rawData.length === 0) {
            return interaction.editReply('⚠️ **No users found in the database yet.** Go chat or mine to start your journey!');
        }

        // 2. Fetch User Object metadata and Avatars asynchronously
        const topUsers = [];
        for (let i = 0; i < Math.min(10, rawData.length); i++) {
            const row = rawData[i];
            let userObj = null;
            let avatarImg = null;
            let username = 'Unknown User';
            
            try {
                userObj = await interaction.client.users.fetch(row.userId);
                if (userObj) {
                    username = userObj.username;
                    const avatarUrl = userObj.displayAvatarURL({ extension: 'png', size: 128 });
                    avatarImg = await loadImage(avatarUrl);
                }
            } catch (err) {}

            topUsers.push({
                row,
                username,
                avatarImg
            });
        }

        try {
            // 3. Canvas setup
            const width = 800;
            const height = 750;
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;

            const themeColor = isWealth ? '#f472b6' : '#c084fc'; // Pink or Purple

            // Draw radial cute background
            const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width / 2);
            bgGrad.addColorStop(0, '#fdf4ff'); // Fuchsia 50
            bgGrad.addColorStop(1, '#fce7f3'); // Pink 100
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, width, height);

            // Draw header panel
            drawRoundCard(ctx, 40, 20, 720, 70, 12, 'rgba(255, 255, 255, 0.7)', 'rgba(244, 114, 182, 0.5)', 2);

            ctx.fillStyle = '#be185d'; // Pink 700
            ctx.font = 'bold 24px "Segoe UI", "Segoe UI Emoji", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(
                isWealth ? '🎀 CHERRY WEALTH LEADERBOARD 🎀' : '🌸 CHERRY ADVENTURER LEVEL RANKINGS 🌸',
                width / 2,
                62
            );

            // 4. DRAW TOP 3 PODIUMS (Y: 100 to 440)
            // 2nd Place (Left)
            if (topUsers[1]) {
                const u = topUsers[1];
                const px = 220; // center X of 2nd column
                const py = 250; // top Y of 2nd podium column
                const pw = 120;
                const ph = 150;

                // Draw Avatar
                drawCircularAvatar(ctx, px, py - 45, 36, u.avatarImg, u.username, '#f472b6');
                // Pink Ring
                ctx.strokeStyle = '#db2777';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(px, py - 45, 36, 0, Math.PI * 2);
                ctx.stroke();

                // Draw Username
                ctx.fillStyle = '#9d174d';
                ctx.font = 'bold 12px "Segoe UI", "Segoe UI Emoji", sans-serif';
                ctx.fillText(u.username, px, py - 9);

                // Draw Score
                ctx.fillStyle = '#831843';
                ctx.font = '12px "Segoe UI", "Segoe UI Emoji", sans-serif';
                const scoreText = isWealth ? `🍒 ${u.row.coins.toLocaleString()}` : `Lvl ${u.row.level}`;
                ctx.fillText(scoreText, px, py + 9);

                // Draw Podium Column
                drawRoundCard(ctx, px - pw/2, py + 22, pw, ph, 8, '#fbcfe8', '#db2777', 2);
                ctx.fillStyle = '#f472b6';
                ctx.font = 'bold 46px "Segoe UI", "Segoe UI Emoji", sans-serif';
                ctx.fillText('2', px, py + 106);
            }

            // 1st Place (Center)
            if (topUsers[0]) {
                const u = topUsers[0];
                const px = 400; // center X of 1st column
                const py = 190; // top Y of 1st podium column
                const pw = 140;
                const ph = 210;

                // Draw Avatar
                drawCircularAvatar(ctx, px, py - 50, 44, u.avatarImg, u.username, '#db2777');
                // Bold Pink Ring with glowing shadow
                ctx.save();
                ctx.strokeStyle = '#be185d';
                ctx.shadowColor = '#be185d';
                ctx.shadowBlur = 10;
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(px, py - 50, 44, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();

                // Draw Username
                ctx.fillStyle = '#831843';
                ctx.font = 'bold 14px "Segoe UI", "Segoe UI Emoji", sans-serif';
                ctx.fillText(u.username, px, py - 9);

                // Draw Score
                ctx.fillStyle = '#4c0519';
                ctx.font = 'bold 13px "Segoe UI", "Segoe UI Emoji", sans-serif';
                const scoreText = isWealth ? `🍒 ${u.row.coins.toLocaleString()}` : `Lvl ${u.row.level}`;
                ctx.fillText(scoreText, px, py + 11);

                // Draw Podium Column
                drawRoundCard(ctx, px - pw/2, py + 26, pw, ph, 8, '#f472b6', '#be185d', 2);
                ctx.fillStyle = '#be185d';
                ctx.font = 'bold 54px "Segoe UI", "Segoe UI Emoji", sans-serif';
                ctx.fillText('1', px, py + 138);
            }

            // 3rd Place (Right)
            if (topUsers[2]) {
                const u = topUsers[2];
                const px = 580; // center X of 3rd column
                const py = 280; // top Y of 3rd podium column
                const pw = 120;
                const ph = 120;

                // Draw Avatar
                drawCircularAvatar(ctx, px, py - 40, 32, u.avatarImg, u.username, '#fce7f3');
                // Soft Pink Ring
                ctx.strokeStyle = '#f472b6';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(px, py - 40, 32, 0, Math.PI * 2);
                ctx.stroke();

                // Draw Username
                ctx.fillStyle = '#9d174d';
                ctx.font = 'bold 11px "Segoe UI", "Segoe UI Emoji", sans-serif';
                ctx.fillText(u.username, px, py - 9);

                // Draw Score
                ctx.fillStyle = '#831843';
                ctx.font = '11px "Segoe UI", "Segoe UI Emoji", sans-serif';
                const scoreText = isWealth ? `🍒 ${u.row.coins.toLocaleString()}` : `Lvl ${u.row.level}`;
                ctx.fillText(scoreText, px, py + 8);

                // Draw Podium Column
                drawRoundCard(ctx, px - pw/2, py + 18, pw, ph, 8, '#fdf4ff', '#f472b6', 2);
                ctx.fillStyle = '#f472b6';
                ctx.font = 'bold 38px "Segoe UI", "Segoe UI Emoji", sans-serif';
                ctx.fillText('3', px, py + 86);
            }

            // 5. DRAW RUNNERS-UP (4th to 10th Place)
            ctx.textAlign = 'left'; // Reset

            const listStartY = 450;
            const rowHeight = 36;

            for (let i = 3; i < 10; i++) {
                if (!topUsers[i]) break;
                const u = topUsers[i];
                const y = listStartY + (i - 3) * 40;

                // Row background box
                drawRoundCard(ctx, 40, y, 720, rowHeight, 6, 'rgba(255, 255, 255, 0.5)', 'rgba(244, 114, 182, 0.3)', 1);

                // Position Number
                ctx.fillStyle = '#be185d';
                ctx.font = 'bold 13px "Segoe UI", "Segoe UI Emoji", sans-serif';
                ctx.fillText(`#${i + 1}`, 60, y + rowHeight / 2 + 4);

                // Small Avatar
                drawCircularAvatar(ctx, 110, y + rowHeight / 2, 13, u.avatarImg, u.username, '#fbcfe8');

                // Username
                ctx.fillStyle = '#831843';
                ctx.font = 'bold 13px "Segoe UI", "Segoe UI Emoji", sans-serif';
                ctx.fillText(u.username, 140, y + rowHeight / 2 + 4);

                // Score (Right aligned)
                ctx.textAlign = 'right';
                ctx.fillStyle = '#db2777';
                ctx.font = 'bold 13px "Segoe UI", "Segoe UI Emoji", sans-serif';
                const scoreText = isWealth ? `🍒 ${u.row.coins.toLocaleString()} cherries` : `Level ${u.row.level} (${u.row.xp} XP)`;
                ctx.fillText(scoreText, 740, y + rowHeight / 2 + 4);
                ctx.textAlign = 'left'; // reset
            }

            // 6. Build Attachment and Send Reply
            const buffer = canvas.toBuffer('image/png');
            const attachment = new AttachmentBuilder(buffer, { name: 'leaderboard-podium.png' });

            const boardEmbed = new EmbedBuilder()
                .setColor(themeColor)
                .setTitle(`🏆 Server Ranking: ${isWealth ? 'Wealth Ledger' : 'Level Rankings'}`)
                .setDescription(`Top 10 players standing on the server rankings. Fluctuation ledger updated dynamically.`)
                .setImage('attachment://leaderboard-podium.png')
                .setTimestamp();

            await interaction.editReply({ embeds: [boardEmbed], files: [attachment] });

        } catch (err) {
            console.error('Error drawing leaderboard podium:', err);
            await interaction.editReply('❌ There was an error while rendering the visual leaderboard podium.');
        }
    }
};