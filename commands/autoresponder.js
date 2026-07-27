const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autoresponder')
        .setDescription('🤖 Manage aesthetic Mimu-style autoresponder triggers for your server')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(sub =>
            sub.setName('add')
                .setDescription('➕ Add a new autoresponder trigger')
                .addStringOption(opt =>
                    opt.setName('trigger')
                        .setDescription('The word or phrase that triggers the bot')
                        .setRequired(true))
                .addStringOption(opt =>
                    opt.setName('response')
                        .setDescription('The bot response (supports {user}, {server}, {channel})')
                        .setRequired(true))
                .addStringOption(opt =>
                    opt.setName('match')
                        .setDescription('How the trigger should be matched')
                        .setRequired(false)
                        .addChoices(
                            { name: 'Contains (Default)', value: 'contains' },
                            { name: 'Exact Match', value: 'exact' },
                            { name: 'Starts With', value: 'startswith' }
                        )))
        .addSubcommand(sub =>
            sub.setName('remove')
                .setDescription('➖ Delete an existing autoresponder trigger')
                .addStringOption(opt =>
                    opt.setName('trigger')
                        .setDescription('The trigger word or phrase to remove')
                        .setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('📜 List all active autoresponders in this server'))
        .addSubcommand(sub =>
            sub.setName('clear')
                .setDescription('🗑️ Clear all autoresponders for this server')),

    async execute(interaction) {
        await interaction.deferReply();

        const guildId = interaction.guildId;
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'add') {
            const trigger = interaction.options.getString('trigger');
            const response = interaction.options.getString('response');
            const matchType = interaction.options.getString('match') || 'contains';

            db.addAutoresponder(guildId, trigger, response, matchType, interaction.user.id);

            const embed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setTitle('✅ Autoresponder Added!')
                .addFields(
                    { name: '💬 Trigger', value: `\`${trigger}\``, inline: true },
                    { name: '🔍 Match Type', value: `\`${matchType}\``, inline: true },
                    { name: '📢 Response', value: response }
                )
                .setFooter({ text: 'Supports variables: {user}, {server}, {channel}' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'remove') {
            const trigger = interaction.options.getString('trigger');
            const success = db.removeAutoresponder(guildId, trigger);

            if (success) {
                const embed = new EmbedBuilder()
                    .setColor('#E74C3C')
                    .setTitle('🗑️ Autoresponder Removed')
                    .setDescription(`Successfully deleted trigger: \`${trigger}\``)
                    .setTimestamp();
                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.editReply({ content: `❌ No autoresponder found matching trigger: \`${trigger}\`` });
            }
        } else if (subcommand === 'list') {
            const list = db.getAutoresponders(guildId);

            if (list.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor('#F1C40F')
                    .setTitle('📜 Server Autoresponders')
                    .setDescription('No custom autoresponders configured yet. Use `/autoresponder add` to create one!')
                    .setTimestamp();
                return await interaction.editReply({ embeds: [embed] });
            }

            const embed = new EmbedBuilder()
                .setColor('#9B59B6')
                .setTitle(`📜 Active Autoresponders (${list.length})`)
                .setDescription(
                    list.slice(0, 15).map((item, idx) => 
                        `**${idx + 1}.** \`${item.triggerText}\` (*${item.matchType}*)\n↳ ${item.responseText.length > 60 ? item.responseText.substring(0, 57) + '...' : item.responseText}`
                    ).join('\n\n')
                )
                .setFooter({ text: list.length > 15 ? `Showing first 15 of ${list.length} autoresponders` : 'Mimu-style Autoresponder System' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'clear') {
            const count = db.clearAutoresponders(guildId);

            const embed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle('🗑️ Autoresponders Cleared')
                .setDescription(`Successfully removed all **${count}** autoresponders for this server.`)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
    }
};
