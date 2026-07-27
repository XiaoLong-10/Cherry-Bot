const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas'); 
const db = require('../database.js');

async function drawCoupleCard(u1Name, u1AvatarUrl, u2Name, u2AvatarUrl, homeName, dateStr, daysMarried) {
    const width = 800;
    const height = 480;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 1. Draw Romantic Rose-Pink Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#ffe4e6'); // rose-100
    bgGrad.addColorStop(0.5, '#fecdd3'); // rose-200
    bgGrad.addColorStop(1, '#fda4af'); // rose-300
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Floating heart silhouettes
    const drawHeart = (c, x, y, size) => {
        c.save();
        c.fillStyle = 'rgba(244, 63, 94, 0.07)';
        c.beginPath();
        c.moveTo(x, y + size / 4);
        c.quadraticCurveTo(x, y, x - size / 2, y);
        c.quadraticCurveTo(x - size, y, x - size, y + size / 2);
        c.quadraticCurveTo(x - size, y + size * 0.9, x, y + size * 1.4);
        c.quadraticCurveTo(x + size, y + size * 0.9, x + size, y + size / 2);
        c.quadraticCurveTo(x + size, y, x + size / 2, y);
        c.quadraticCurveTo(x, y, x, y + size / 4);
        c.closePath();
        c.fill();
        c.restore();
    };

    drawHeart(ctx, 100, 80, 40);
    drawHeart(ctx, 700, 90, 50);
    drawHeart(ctx, 400, 220, 35);
    drawHeart(ctx, 150, 380, 60);
    drawHeart(ctx, 720, 390, 45);

    // 2. Decorative Gold Molding Borders
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 4;
    ctx.strokeRect(15, 15, width - 30, height - 30);

    ctx.strokeStyle = 'rgba(219, 39, 119, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    // 3. Title Text
    ctx.fillStyle = '#9d174d'; // pink-800
    ctx.font = 'italic bold 28px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('Matrimonial Bond Deed', width / 2, 54);

    // 4. Central Matrimonial Rings
    ctx.save();
    ctx.shadowColor = 'rgba(212, 175, 55, 0.5)';
    ctx.shadowBlur = 12;
    ctx.font = '65px "Segoe UI Emoji", sans-serif';
    ctx.fillText('💍', width / 2, 136);
    ctx.restore();

    // 5. Spouse 1 Portrait Frame & Clip
    const u1X = 170;
    const u1Y = 145;
    const radius = 60;

    if (u1AvatarUrl) {
        try {
            const img1 = await loadImage(u1AvatarUrl);
            ctx.save();
            ctx.beginPath();
            ctx.arc(u1X, u1Y, radius, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(img1, u1X - radius, u1Y - radius, radius * 2, radius * 2);
            ctx.restore();
            
            // Gold Bezel Ring
            ctx.strokeStyle = '#d4af37';
            ctx.lineWidth = 4.5;
            ctx.beginPath();
            ctx.arc(u1X, u1Y, radius + 2, 0, Math.PI * 2);
            ctx.stroke();
        } catch (e) {}
    }

    // Spouse 2 Portrait Frame & Clip
    const u2X = 630;
    const u2Y = 145;

    if (u2AvatarUrl) {
        try {
            const img2 = await loadImage(u2AvatarUrl);
            ctx.save();
            ctx.beginPath();
            ctx.arc(u2X, u2Y, radius, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(img2, u2X - radius, u2Y - radius, radius * 2, radius * 2);
            ctx.restore();
            
            // Gold Bezel Ring
            ctx.strokeStyle = '#d4af37';
            ctx.lineWidth = 4.5;
            ctx.beginPath();
            ctx.arc(u2X, u2Y, radius + 2, 0, Math.PI * 2);
            ctx.stroke();
        } catch (e) {}
    }

    // Spouses Names below avatars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(u1Name || 'Spouse 1').substring(0, 14), u1X, u1Y + radius + 24);
    ctx.fillText(String(u2Name || 'Spouse 2').substring(0, 14), u2X, u2Y + radius + 24);

    // 6. Frosted Pink Glass Stats Container
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.strokeStyle = 'rgba(219, 39, 119, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(15, 23, 42, 0.04)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(100, 260, 600, 178, 16);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Stats Details inside the container
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Left Column details (Shared home & Wedding Date)
    // House Emoji
    ctx.font = '42px "Segoe UI Emoji", sans-serif';
    ctx.fillText('🏡', 135, 308);
    // House text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`Shared Home: ${homeName}`, 195, 298);
    ctx.fillStyle = '#475569';
    ctx.font = '11px sans-serif';
    ctx.fillText('Accessible vault coordinates unlocked in Discord', 195, 318);

    // Chest Emoji
    ctx.font = '36px "Segoe UI Emoji", sans-serif';
    ctx.fillText('📦', 135, 388);
    // Wedding text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`Married Since: ${dateStr}`, 195, 378);
    ctx.fillStyle = '#475569';
    ctx.font = '11px sans-serif';
    ctx.fillText(`Matrimonial Milestone: ${daysMarried} Days Active`, 195, 398);

    // Right Column details (Couple Buff Medallion)
    ctx.textAlign = 'center';
    ctx.font = '38px "Segoe UI Emoji", sans-serif';
    ctx.fillText('🎖️', 600, 316);

    ctx.fillStyle = '#059669'; // Green-600
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('Couple Buff: Active', 600, 360);
    
    ctx.fillStyle = '#475569';
    ctx.font = '11px sans-serif';
    ctx.fillText('+20% Shared XP Boost', 600, 380);

    ctx.textBaseline = 'alphabetic'; // Reset

    return canvas.toBuffer('image/png');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('marriage')
        .setDescription('💍 Manage your matrimonial relationship')
        .addSubcommand(subcommand =>
            subcommand
                .setName('profile')
                .setDescription('📋 View your premium matrimonial profile card'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('daily')
                .setDescription('🎁 Claim your daily couple cherry gift'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('claim')
                .setDescription('🏆 Claim wedding milestone anniversary rewards'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('divorce')
                .setDescription('💔 Terminate your marriage union'))
        .addSubcommandGroup(group =>
            group
                .setName('home')
                .setDescription('🏡 Manage your shared home')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('rename')
                        .setDescription('✏️ Rename your shared home')
                        .addStringOption(option =>
                            option.setName('name')
                                .setDescription('The new name of your shared house')
                                .setRequired(true)))),

    async execute(interaction) {
        await interaction.deferReply();

        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        const group = interaction.options.getSubcommandGroup(false);
        const subcommand = interaction.options.getSubcommand();

        const marriage = db.getMarriage(userId);
        if (!marriage) {
            return interaction.editReply({ content: '⚠️ **You are not married!**\nUse **`/marry @user`** to propose to another player.' });
        }

        const spouseId = marriage.user1Id === userId ? marriage.user2Id : marriage.user1Id;

        // --- SUBCOMMAND: PROFILE ---
        if (subcommand === 'profile') {
            const user1 = await interaction.client.users.fetch(marriage.user1Id).catch(() => null);
            const user2 = await interaction.client.users.fetch(marriage.user2Id).catch(() => null);

            const u1Name = user1 ? user1.username : 'Unknown Spouse';
            const u2Name = user2 ? user2.username : 'Unknown Spouse';
            
            const u1Avatar = user1 ? user1.displayAvatarURL({ extension: 'png', size: 128 }) : '';
            const u2Avatar = user2 ? user2.displayAvatarURL({ extension: 'png', size: 128 }) : '';

            const dateStr = new Date(marriage.marriageDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const diffMs = Date.now() - marriage.marriageDate;
            const daysMarried = Math.floor(diffMs / 1000 / 60 / 60 / 24);

            try {
                const cardBuffer = await drawCoupleCard(u1Name, u1Avatar, u2Name, u2Avatar, marriage.homeName, dateStr, daysMarried);
                const attachment = new AttachmentBuilder(cardBuffer, { name: 'marriage-profile.png' });

                const profileEmbed = new EmbedBuilder()
                    .setColor('#f472b6')
                    .setTitle(`💍 Marriage Profile: ${u1Name} ❤️ ${u2Name}`)
                    .setDescription(`Shared home: **${marriage.homeName}** ┃ Married for **${daysMarried}** days!`)
                    .setImage('attachment://marriage-profile.png')
                    .setTimestamp();

                await interaction.editReply({ embeds: [profileEmbed], files: [attachment] });
            } catch (err) {
                console.error(err);
                await interaction.editReply({ content: `💍 Married to <@${spouseId}>. Home: **${marriage.homeName}**.` });
            }
        }

        // --- SUBCOMMAND: DAILY ---
        else if (subcommand === 'daily') {
            const now = Date.now();
            const cooldown = 24 * 60 * 60 * 1000; // 24 hours
            
            if (now < marriage.lastGiftClaimed + cooldown) {
                const timeLeft = (marriage.lastGiftClaimed + cooldown - now) / 1000 / 60 / 60;
                return interaction.editReply({ content: `⏳ You have already claimed your couple gift! Try again in **${timeLeft.toFixed(1)}** hours.` });
            }

            const giftCoins = Math.floor(Math.random() * 301) + 200; // 200 to 500 cherries
            
            db.claimMarriageGift(marriage.id, now);
            db.addCoins(marriage.user1Id, guildId, giftCoins);
            db.addCoins(marriage.user2Id, guildId, giftCoins);

            const dailyEmbed = new EmbedBuilder()
                .setColor('#fbcfe8')
                .setTitle('🎁 DAILY COUPLE GIFT CLAIMED!')
                .setDescription(
                    `✨ **Daily Matrimonial Package sealed!** ✨\n\n` +
                    `Both you (<@${marriage.user1Id}>) and your spouse (<@${marriage.user2Id}>) have received:\n` +
                    `🍒 **\` 🍒 ${giftCoins.toLocaleString()} \` cherries!**\n\n` +
                    `*Next gift available in 24 hours.*`
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [dailyEmbed] });
        }

        // --- SUBCOMMAND: CLAIM MILESTONES ---
        else if (subcommand === 'claim') {
            const diffMs = Date.now() - marriage.marriageDate;
            const minutesMarried = Math.floor(diffMs / 1000 / 60);
            const daysMarried = Math.floor(diffMs / 1000 / 60 / 60 / 24);

            const claimed = JSON.parse(marriage.claimedMilestones || '[]');

            const milestones = [
                { id: '1min', label: 'Paper Anniversary (1 Min)', minTime: 1, isMin: true, reward: 2000 },
                { id: '7days', label: 'Wood Anniversary (7 Days)', minTime: 7, isMin: false, reward: 10000 },
                { id: '30days', label: 'Silver Anniversary (30 Days)', minTime: 30, isMin: false, reward: 50000 }
            ];

            let rewardGiven = 0;
            const newlyClaimed = [];

            milestones.forEach(m => {
                if (!claimed.includes(m.id)) {
                    const elapsed = m.isMin ? minutesMarried : daysMarried;
                    if (elapsed >= m.minTime) {
                        rewardGiven += m.reward;
                        newlyClaimed.push(m.id);
                        claimed.push(m.id);
                    }
                }
            });

            if (rewardGiven === 0) {
                return interaction.editReply({ content: '❌ **No anniversary rewards available to claim right now.**\n*Milestones: 1 Min (2,000 cherries), 7 Days (10,000 cherries), 30 Days (50,000 cherries).* ' });
            }

            db.updateMilestones(marriage.id, JSON.stringify(claimed));
            db.addCoins(marriage.user1Id, guildId, rewardGiven);
            db.addCoins(marriage.user2Id, guildId, rewardGiven);

            const claimEmbed = new EmbedBuilder()
                .setColor('#db2777')
                .setTitle('🏆 ANNIVERSARY MILESTONES CLAIMED!')
                .setDescription(
                    `🎉 **Milestones achieved:**\n` +
                    newlyClaimed.map(id => `• **${milestones.find(m => m.id === id).label}**`).join('\n') +
                    `\n\nBoth spouses have been credited:\n` +
                    `🍒 **\` 🍒 ${rewardGiven.toLocaleString()} \` cherries!**`
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [claimEmbed] });
        }

        // --- SUBCOMMAND: DIVORCE ---
        else if (subcommand === 'divorce') {
            const acceptDivorceBtn = new ButtonBuilder()
                .setCustomId('divorce_confirm')
                .setLabel('💔 Confirm Divorce')
                .setStyle(ButtonStyle.Danger);

            const cancelDivorceBtn = new ButtonBuilder()
                .setCustomId('divorce_cancel')
                .setLabel('❤️ Cancel')
                .setStyle(ButtonStyle.Secondary);

            const divRow = new ActionRowBuilder().addComponents(acceptDivorceBtn, cancelDivorceBtn);

            const divEmbed = new EmbedBuilder()
                .setColor('#f43f5e')
                .setTitle('💔 DIVORCE CONFIRMATION')
                .setDescription(
                    `⚠️ **Are you absolutely sure you want to end your marriage?**\n` +
                    `Divorcing will delete your shared home, couple buff (+20% XP), and daily gift histories. This action is final!`
                )
                .setTimestamp();

            const divMsg = await interaction.editReply({
                embeds: [divEmbed],
                components: [divRow]
            });

            const divCollector = divMsg.createMessageComponentCollector({
                filter: i => i.user.id === userId,
                time: 30000
            });

            divCollector.on('collect', async (i) => {
                await i.deferUpdate();

                if (i.customId === 'divorce_confirm') {
                    db.divorce(userId);
                    const brokenEmbed = new EmbedBuilder()
                        .setColor('#f43f5e')
                        .setTitle('💔 MARRIAGE DISSOLVED')
                        .setDescription(`The marriage between <@${marriage.user1Id}> and <@${marriage.user2Id}> has been officially dissolved. You are both single again.`)
                        .setTimestamp();

                    await i.editReply({ content: '💔 Union broken.', embeds: [brokenEmbed], components: [] });
                } else {
                    await i.editReply({ content: '❤️ Divorce canceled.', embeds: [], components: [] });
                }
                divCollector.stop('done');
            });
        }

        // --- SUBCOMMAND GROUP: HOME RENAME ---
        else if (group === 'home' && subcommand === 'rename') {
            const newName = interaction.options.getString('name');
            if (newName.length > 32) {
                return interaction.editReply({ content: '❌ Home name cannot exceed 32 characters!' });
            }

            db.renameHome(userId, newName);

            const homeEmbed = new EmbedBuilder()
                .setColor('#f472b6')
                .setTitle('🏡 SHARED HOME RENAMED!')
                .setDescription(
                    `Your shared home with <@${spouseId}> has been upgraded!\n` +
                    `New House Name: **${newName}**`
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [homeEmbed] });
        }
    }
};
