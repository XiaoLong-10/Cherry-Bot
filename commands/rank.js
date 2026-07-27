const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Displays your current profile level and XP progress.'),
    async execute(interaction) {
        const progress = db.getUserProgress(interaction.user.id, interaction.guild.id);
        const xpNeeded = progress.level * 100;

        // Simple text-based progress bar loader visualization
        const progressBarLength = 10;
        const filledBlocks = Math.round((progress.xp / xpNeeded) * progressBarLength);
        const emptyBlocks = progressBarLength - filledBlocks;
        const progressBar = '🟩'.repeat(Math.max(0, filledBlocks)) + '⬜'.repeat(Math.max(0, emptyBlocks));

        const embed = new EmbedBuilder()
            .setColor('#c084fc')
            .setTitle(`🏆 ${interaction.user.username}'s Rank Status`)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Current Level', value: `✨ **Level ${progress.level}**`, inline: true },
                { name: 'Experience', value: `📈 **${progress.xp}** / **${xpNeeded}** XP`, inline: true },
                { name: 'Progress Bar', value: `${progressBar} (${Math.round((progress.xp / xpNeeded) * 100)}%)`, inline: false }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};