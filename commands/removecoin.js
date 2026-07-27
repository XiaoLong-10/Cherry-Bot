const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removecoin')
        .setDescription('👑 Deduct cherries from another player (Administrator only)')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The player to deduct cherries from')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('The amount of cherries to remove')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply();

        const target = interaction.options.getUser('target');
        const amount = interaction.options.getInteger('amount');
        const guildId = interaction.guild.id;

        if (target.bot) {
            return interaction.editReply({ content: '❌ You cannot deduct cherries from a bot!' });
        }

        if (amount <= 0) {
            return interaction.editReply({ content: '❌ Amount must be greater than 0!' });
        }

        // Verify target character exists
        const char = db.getCharacter(target.id);
        if (!char || !char.char_name) {
            return interaction.editReply({ content: `❌ **${target.username}** does not have an RPG character yet! They must create one using \`/character create\`.` });
        }

        const freshCoins = db.getBalance(target.id, guildId);
        const actualDeduct = Math.min(freshCoins, amount);

        db.deductCoins(target.id, guildId, actualDeduct);

        const freshBalance = db.getBalance(target.id, guildId);

        const removeEmbed = new EmbedBuilder()
            .setColor('#f43f5e')
            .setTitle('🍒 CHERRIES DEDUCTED')
            .setDescription(
                `Successfully deducted **🍒 ${actualDeduct.toLocaleString()} cherries** from <@${target.id}>!\n\n` +
                `• **New Balance:** 🍒 **${freshBalance.toLocaleString()} cherries**`
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [removeEmbed] });
    }
};
