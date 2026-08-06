const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('🎶 Play a song or playlist from YouTube/SoundCloud/Spotify')
        .addStringOption(opt =>
            opt.setName('query')
                .setDescription('Song title, YouTube link, or playlist URL')
                .setRequired(true)),

    async execute(interaction) {
        const musicCmd = require('./music.js');
        // Inject subcommand option getter for music command delegate
        const origGetSubcommand = interaction.options.getSubcommand;
        interaction.options.getSubcommand = () => 'play';
        try {
            return await musicCmd.execute(interaction);
        } finally {
            interaction.options.getSubcommand = origGetSubcommand;
        }
    }
};
