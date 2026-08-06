const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { createTicketPanel } = require('../../systems/tickets/ticketEngine.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('🎫 Support Ticket Management Engine')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(sub =>
            sub.setName('panel')
                .setDescription('📌 Post interactive support ticket panel')
                .addChannelOption(opt =>
                    opt.setName('channel')
                        .setDescription('Channel to post panel into')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false))
                .addStringOption(opt =>
                    opt.setName('title')
                        .setDescription('Custom panel header title')
                        .setRequired(false))
                .addStringOption(opt =>
                    opt.setName('description')
                        .setDescription('Custom panel instructions')
                        .setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('close')
                .setDescription('🔒 Close the current ticket channel')),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'panel') {
            await interaction.deferReply({ ephemeral: true });
            const channel = interaction.options.getChannel('channel') || interaction.channel;
            const title = interaction.options.getString('title') || undefined;
            const desc = interaction.options.getString('description') || undefined;

            await createTicketPanel(channel, title, desc);
            await interaction.editReply({ content: `✅ Ticket panel posted in ${channel.toString()}!` });
        } else if (subcommand === 'close') {
            if (!interaction.channel.name.startsWith('ticket-')) {
                return await interaction.reply({ content: '❌ This command can only be used inside a ticket channel!', ephemeral: true });
            }
            await interaction.reply({ content: '🔒 Closing ticket in 5 seconds...' });
            setTimeout(() => {
                interaction.channel.delete().catch(() => null);
            }, 5000);
        }
    }
};
