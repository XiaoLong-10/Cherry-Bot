const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Purges a specified number of messages from this channel.')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to clear (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        // 1. MUST BE FIRST: Secure the interaction immediately!
        // We use deferReply so Discord knows the bot is working on deleting messages.
        await interaction.deferReply({ ephemeral: true });

        try {
            const amount = interaction.options.getInteger('amount');
            
            // 2. Your bulk deletion logic happens here
            const messages = await interaction.channel.bulkDelete(amount, true);

            // 3. FINALLY: Update the deferred message safely with editReply
            await interaction.editReply({ 
                content: `✨ Successfully cleared **${messages.size}** messages!` 
            });

        } catch (error) {
            console.error(error);
            // If something breaks during deletion, safely update the user
            await interaction.editReply({ 
                content: '❌ There was an error trying to clear messages in this channel (Messages older than 14 days cannot be bulk deleted).' 
            });
        }
    },
};