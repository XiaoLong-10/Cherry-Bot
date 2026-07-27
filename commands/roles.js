const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    PermissionFlagsBits 
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-roles')
        .setDescription('Spawns an interactive role picker panel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#c084fc')
            .setTitle('🎭 Server Role Selection')
            .setDescription('Click the matching buttons below to add or remove specific community roles!')
            .addFields(
                { name: '📢 Announcements', value: 'Stay updated with server alerts.', inline: true },
                { name: '🎮 Gamer', value: 'Unlock access to looking-for-group sections.', inline: true }
            );

        // Build the buttons. customId lets us catch clicks in index.js
        const announceButton = new ButtonBuilder()
            .setCustomId('role_announcements')
            .setLabel('Announcements')
            .setStyle(ButtonStyle.Primary) // Blurple button
            .setEmoji('📢');

        const gamerButton = new ButtonBuilder()
            .setCustomId('role_gamer')
            .setLabel('Gamer')
            .setStyle(ButtonStyle.Success) // Green button
            .setEmoji('🎮');

        const row = new ActionRowBuilder().addComponents(announceButton, gamerButton);

        await interaction.reply({
            embeds: [embed],
            components: [row]
        });
    },
};