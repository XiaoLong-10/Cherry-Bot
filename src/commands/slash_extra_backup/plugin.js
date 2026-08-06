const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getGuildPlugins, setPluginState, PLUGIN_INFO } = require('../../systems/pluginManager.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('plugin')
        .setDescription('🔌 Manage modular server feature plugins (Enable/Disable modules)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('📜 View status of all server feature plugins'))
        .addSubcommand(sub =>
            sub.setName('enable')
                .setDescription('🟢 Enable a server plugin')
                .addStringOption(opt =>
                    opt.setName('name')
                        .setDescription('The plugin module to enable')
                        .setRequired(true)
                        .addChoices(
                            { name: '💰 Economy & Shop', value: 'economy' },
                            { name: '🌸 UwU & Kaomoji', value: 'uwu' },
                            { name: '💖 Cute Roleplay', value: 'roleplay' },
                            { name: '🛡️ AutoModeration', value: 'automod' },
                            { name: '🎫 Ticket System', value: 'tickets' },
                            { name: '🤖 AI Suite', value: 'ai' },
                            { name: '⭐ Leveling & XP', value: 'leveling' },
                            { name: '🎵 Music Player', value: 'music' }
                        )))
        .addSubcommand(sub =>
            sub.setName('disable')
                .setDescription('🔴 Disable a server plugin')
                .addStringOption(opt =>
                    opt.setName('name')
                        .setDescription('The plugin module to disable')
                        .setRequired(true)
                        .addChoices(
                            { name: '💰 Economy & Shop', value: 'economy' },
                            { name: '🌸 UwU & Kaomoji', value: 'uwu' },
                            { name: '💖 Cute Roleplay', value: 'roleplay' },
                            { name: '🛡️ AutoModeration', value: 'automod' },
                            { name: '🎫 Ticket System', value: 'tickets' },
                            { name: '🤖 AI Suite', value: 'ai' },
                            { name: '⭐ Leveling & XP', value: 'leveling' },
                            { name: '🎵 Music Player', value: 'music' }
                        ))),

    async execute(interaction) {
        await interaction.deferReply();

        const guildId = interaction.guildId;
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'list') {
            const plugins = getGuildPlugins(guildId);

            const embed = new EmbedBuilder()
                .setColor('#7C3AED')
                .setTitle(`🔌 Server Plugin Manager — ${interaction.guild.name}`)
                .setDescription('Server administrators can enable or disable feature modules for this community.')
                .setTimestamp();

            for (const [key, info] of Object.entries(PLUGIN_INFO)) {
                const isEnabled = plugins[key] !== false;
                const statusStr = isEnabled ? '🟢 **Enabled**' : '🔴 **Disabled**';
                embed.addFields({
                    name: `${info.name} — ${statusStr}`,
                    value: info.description,
                    inline: false
                });
            }

            await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'enable') {
            const pluginName = interaction.options.getString('name');
            setPluginState(guildId, pluginName, true);

            const info = PLUGIN_INFO[pluginName];
            const embed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setTitle('🟢 Plugin Enabled!')
                .setDescription(`Successfully enabled module: **${info.name}** for this server.`)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'disable') {
            const pluginName = interaction.options.getString('name');
            setPluginState(guildId, pluginName, false);

            const info = PLUGIN_INFO[pluginName];
            const embed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle('🔴 Plugin Disabled!')
                .setDescription(`Successfully disabled module: **${info.name}** for this server.`)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
    }
};
