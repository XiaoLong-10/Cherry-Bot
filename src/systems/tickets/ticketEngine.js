const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const db = require('../../database/index.js');

async function createTicketPanel(channel, title = '🎫 Customer Support & Help Desk', description = 'Need help? Click the button below to open a private ticket with our staff team.') {
    const embed = new EmbedBuilder()
        .setColor('#7C3AED')
        .setTitle(title)
        .setDescription(description)
        .setFooter({ text: 'Cherry Ticket Support Engine 🌸' })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('ticket_create')
            .setLabel('Create Ticket')
            .setEmoji('🎫')
            .setStyle(ButtonStyle.Primary)
    );

    return await channel.send({ embeds: [embed], components: [row] });
}

async function handleTicketButton(interaction) {
    const { guild, member, customId } = interaction;

    if (customId === 'ticket_create') {
        const ticketCount = (db.getSetting(`ticket_count_${guild.id}`, 0)) + 1;
        db.setSetting(`ticket_count_${guild.id}`, ticketCount);

        const channelName = `ticket-${String(ticketCount).padStart(4, '0')}`;

        // Create private ticket channel
        const ticketChannel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: member.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles]
                },
                {
                    id: guild.members.me.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels]
                }
            ]
        });

        const welcomeEmbed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle(`🎫 Ticket #${String(ticketCount).padStart(4, '0')}`)
            .setDescription(`Hello ${member.toString()}! Thank you for opening a support ticket. Please describe your inquiry or issue, and our staff team will assist you shortly.`)
            .setTimestamp();

        const controlRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('ticket_claim')
                .setLabel('Claim Ticket')
                .setEmoji('🙋‍♂️')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('ticket_close')
                .setLabel('Close Ticket')
                .setEmoji('🔒')
                .setStyle(ButtonStyle.Danger)
        );

        await ticketChannel.send({ content: `${member.toString()}`, embeds: [welcomeEmbed], components: [controlRow] });

        await interaction.reply({
            content: `✅ Ticket created! Head over to ${ticketChannel.toString()} to view your ticket.`,
            ephemeral: true
        });
    } else if (customId === 'ticket_claim') {
        if (!member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return await interaction.reply({ content: '❌ Only staff members can claim tickets.', ephemeral: true });
        }

        const embed = EmbedBuilder.from(interaction.message.embeds[0])
            .setColor('#F1C40F')
            .addFields({ name: '👨‍💼 Claimed By', value: member.toString(), inline: true });

        await interaction.update({ embeds: [embed] });
        await interaction.channel.send({ content: `📌 This ticket has been claimed by ${member.toString()}.` });
    } else if (customId === 'ticket_close') {
        await interaction.reply({ content: '🔒 Closing ticket in 5 seconds...' });
        setTimeout(() => {
            interaction.channel.delete().catch(() => null);
        }, 5000);
    }
}

module.exports = {
    createTicketPanel,
    handleTicketButton
};
