const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    MessageFlags 
} = require('discord.js');
const db = require('../database.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('web')
        .setDescription('🔑 Request a secure access token to manage your RPG profile on the Web Dashboard'),

    async execute(interaction) {
        const userId = interaction.user.id;

        // Verify character
        const char = db.getCharacter(userId);
        if (!char || !char.char_name) {
            return interaction.reply({
                content: '⚠️ **You must create an RPG character first!** Use `/character create`.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        // Generate one-time web token
        const token = db.generateWebToken(userId);
        const url = `http://localhost:3000/?token=${token}`;

        const embed = new EmbedBuilder()
            .setColor('#c084fc')
            .setTitle('🔑 WEB DASHBOARD CLIENT PORTAL')
            .setDescription(
                `Your secure login link has been generated!\n\n` +
                `🛡️ **Security Notice:**\n` +
                `• This token is **valid for 10 minutes**.\n` +
                `• It is a **one-time use token** (wipes once verified).\n` +
                `• Never share this URL link with other members.\n\n` +
                `Click the button below to sign in and unlock interactive web controls (planting crops, upgrading gear, and spinning the wheel)!`
            )
            .setTimestamp();

        const loginBtn = new ButtonBuilder()
            .setLabel('Access Web Dashboard')
            .setStyle(ButtonStyle.Link)
            .setURL(url)
            .setEmoji('🌐');

        const row = new ActionRowBuilder().addComponents(loginBtn);

        await interaction.reply({
            embeds: [embed],
            components: [row],
            flags: [MessageFlags.Ephemeral]
        });
    }
};
