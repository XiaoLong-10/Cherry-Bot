const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { TIER_REWARDS, DAILY_QUESTS, getSeasonProgress, claimReward } = require('../../systems/season/seasonPass.js');
const db = require('../../database/index.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('seasonpass')
        .setDescription('🏆 100-Tier Season Pass & Daily Quests')
        .addSubcommand(sub =>
            sub.setName('view')
                .setDescription('📜 View your Season Pass progression, tier level, and XP'))
        .addSubcommand(sub =>
            sub.setName('quests')
                .setDescription('📋 View active Season Pass daily quests'))
        .addSubcommand(sub =>
            sub.setName('claim')
                .setDescription('🎁 Claim unlocked Season Pass tier rewards')
                .addIntegerOption(opt => opt.setName('tier').setDescription('Tier level to claim (1 to 100)').setRequired(true).setMinValue(1).setMaxValue(100))),

    async execute(interaction) {
        await interaction.deferReply();

        const userId = interaction.user.id;
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'view') {
            const prog = getSeasonProgress(userId);
            const xpNeeded = 200;
            const progressPct = Math.floor((prog.passXP / xpNeeded) * 100);

            // Build progress bar
            const filledBlocks = Math.floor(progressPct / 10);
            const progressBar = '🌸'.repeat(filledBlocks) + '⚪'.repeat(10 - filledBlocks);

            // Unclaimed highlights
            const unclaimed = Object.keys(TIER_REWARDS)
                .map(Number)
                .filter(t => t <= prog.passLevel && !prog.claimedRewards.includes(t));

            const embed = new EmbedBuilder()
                .setColor('#FF9EE2')
                .setTitle(`🏆 CHERRY SEASON PASS — SEASON 1`)
                .setDescription(`**Player:** ${interaction.user.username}\n**Current Tier:** Tier **${prog.passLevel}** / 100\n\n\`[${progressBar}]\` ${prog.passXP} / 200 XP (${progressPct}%)`)
                .addFields(
                    { name: '🎁 Next Milestone Reward', value: `Tier 5: 🌸 Sakura Blossom Badge\nTier 10: 🧪 2,500 Coins + Potions\nTier 50: 👑 Cherry Royalty Title\nTier 100: 🌟 Mythic Champion Badge & 100,000 Coins`, inline: false },
                    { name: '✨ Unclaimed Milestone Rewards', value: unclaimed.length > 0 ? unclaimed.map(t => `• **Tier ${t}:** ${TIER_REWARDS[t].name}`).join('\n') : '✅ All unlocked rewards claimed!', inline: false }
                )
                .setFooter({ text: 'Use /seasonpass claim tier:<level> to claim rewards' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'quests') {
            const embed = new EmbedBuilder()
                .setColor('#3498DB')
                .setTitle('📋 SEASON PASS DAILY QUEST BOARD')
                .setDescription('Complete daily quests to earn Season Pass XP and unlock milestone tiers!')
                .setTimestamp();

            DAILY_QUESTS.forEach((q, idx) => {
                embed.addFields({
                    name: `Quest ${idx + 1}: ${q.text}`,
                    value: `⭐ Reward: **+${q.rewardXP} Season XP**`,
                    inline: false
                });
            });

            await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'claim') {
            const tier = interaction.options.getInteger('tier');
            const res = claimReward(userId, tier);

            if (!res.success) {
                return await interaction.editReply({ content: `❌ ${res.reason}` });
            }

            const embed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setTitle(`🎁 Tier ${tier} Reward Claimed!`)
                .setDescription(`Congratulations! You claimed: **${res.reward.emoji} ${res.reward.name}**!`)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
    }
};
