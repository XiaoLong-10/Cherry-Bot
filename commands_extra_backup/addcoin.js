const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addcoin')
        .setDescription('👑 Grant cherries to another player (Administrator only)')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The player to grant cherries to')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('The amount of cherries to add')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply();

        const target = interaction.options.getUser('target');
        const amount = interaction.options.getInteger('amount');
        const guildId = interaction.guild ? (interaction.guild ? interaction.guild.id : 'GLOBAL') : 'GLOBAL';

        if (target.bot) {
            return interaction.editReply({ content: '❌ You cannot add cherries to a bot!' });
        }

        if (amount <= 0) {
            return interaction.editReply({ content: '❌ Amount must be greater than 0!' });
        }

        // Verify target character exists
        const char = db.getCharacter(target.id);
        if (!char || !char.char_name) {
            return interaction.editReply({ content: `❌ **${target.username}** does not have an RPG character yet! They must create one using \`/character create\`.` });
        }

        db.addCoins(target.id, guildId, amount);

        const freshBalance = db.getBalance(target.id, guildId);

        const addEmbed = new EmbedBuilder()
            .setColor('#fbcfe8')
            .setTitle('🍒 CHERRIES GRANTED')
            .setDescription(
                `Successfully granted **🍒 ${amount.toLocaleString()} cherries** to <@${target.id}>!\n\n` +
                `• **New Balance:** 🍒 **${freshBalance.toLocaleString()} cherries**`
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [addEmbed] });
    }
};
