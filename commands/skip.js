const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('⏭️ Skip the current song'),

    async execute(interaction) {
        const musicCmd = require('./music.js');
        const origGetSubcommand = interaction.options.getSubcommand;
        interaction.options.getSubcommand = () => 'skip';
        try {
            return await musicCmd.execute(interaction);
        } finally {
            interaction.options.getSubcommand = origGetSubcommand;
        }
    }
};
