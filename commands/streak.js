const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('streak')
        .setDescription('🔥 Claim your daily login streak and unlock premium mystery box rewards'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        // Fetch user streak from database
        const streak = db.getUserStreak(userId);
        const lastClaim = streak.lastClaim;
        const now = Date.now();

        // Time calculations
        const elapsedMs = now - lastClaim;
        const elapsedHours = elapsedMs / 1000 / 60 / 60;

        // If claimed within 24 hours
        if (elapsedHours < 24) {
            const remainingMs = (24 * 60 * 60 * 1000) - elapsedMs;
            const h = Math.floor(remainingMs / 1000 / 60 / 60);
            const m = Math.floor((remainingMs / 1000 / 60) % 60);

            const failEmbed = new EmbedBuilder()
                .setColor('#f43f5e')
                .setTitle('⏳ STREAK LOCKED')
                .setDescription(`⚠️ You already claimed your daily reward today!\n\n🕒 **Next claim available in:** **${h}h ${m}m**`)
                .setTimestamp();

            return await interaction.reply({ embeds: [failEmbed] });
        }

        // Animated progress bar loader
        await interaction.reply({ content: '⚙️ **Synchronizing daily calendar...**\n[░░░░░░░░░░] 0%' });

        await new Promise(r => setTimeout(r, 600));
        await interaction.editReply({ content: '⚙️ **Authenticating login signature...**\n[████░░░░░░] 40%' });

        await new Promise(r => setTimeout(r, 600));
        await interaction.editReply({ content: '⚙️ **Verifying active streak...**\n[████████░░] 80%' });

        await new Promise(r => setTimeout(r, 500));
        await interaction.editReply({ content: '✨ **Calendar Synchronized! Processing rewards...**\n[██████████] 100%' });

        // Calculate next count
        let nextCount = streak.count + 1;

        // If more than 48 hours have elapsed, reset streak back to Day 1
        if (elapsedHours >= 48) {
            nextCount = 1;
        }

        // Cap streak at 7, then loop back to 1
        if (nextCount > 7) {
            nextCount = 1;
        }

        // Multiplier rewards mapping
        const multipliers = { 1: 1.0, 2: 1.5, 3: 2.0, 4: 2.5, 5: 3.0, 6: 3.5, 7: 5.0 };
        const baseReward = 1000;
        const rewardCoins = Math.floor(baseReward * multipliers[nextCount]);

        db.claimUserStreak(userId, nextCount, now, rewardCoins, guildId);

        // Grid builder representing 7 days of the week
        const gridItems = [];
        for (let i = 1; i <= 7; i++) {
            if (i < nextCount) {
                gridItems.push(`\` Day ${i}: ✅ \``);
            } else if (i === nextCount) {
                gridItems.push(`\` Day ${i}: 🔥 \``);
            } else if (i === 7) {
                gridItems.push(`\` Day ${i}: 🎁 \``);
            } else {
                gridItems.push(`\` Day ${i}: 🔒 \``);
            }
        }

        const gridText = gridItems.join('  ');
        let bonusMessage = '';

        // Day 7 Jackpot reward
        if (nextCount === 7) {
            db.addItem(userId, 'Premium Mystery Box 🎁', 1);
            bonusMessage = '\n🏆 **JACKPOT DAY 7 REACHED!**\nUnlocked: **Premium Mystery Box 🎁** added to your inventory bag!';
        }

        const successEmbed = new EmbedBuilder()
            .setColor('#db2777')
            .setTitle('🔥 DAILY LOGIN STREAK CLAIMED')
            .setDescription(
                `🎉 You claimed your consecutive Day **${nextCount}** reward!\n\n` +
                `• **Multiplier Applied:** **${multipliers[nextCount]}x**\n` +
                `• **Credited:** 🍒 **+${rewardCoins.toLocaleString()} cherries**${bonusMessage}\n\n` +
                `**Streak Progress Tracker Grid:**\n` +
                `${gridText}\n\n` +
                `*Log in tomorrow within 24-48 hours to increment your streak and reach the Day 7 jackpot!*`
            )
            .setTimestamp();

        // Clear text indicator and send card
        await interaction.editReply({ content: '', embeds: [successEmbed] });
    }
};
