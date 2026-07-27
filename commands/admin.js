const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('👑 Guild Administration and Bot Control Settings')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('logs')
                .setDescription('📜 View latest transaction and activity logs')
                .addIntegerOption(option =>
                    option.setName('limit')
                        .setDescription('Number of logs to fetch (max 20)')
                        .setMinValue(1)
                        .setMaxValue(20)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('reward')
                .setDescription('🎁 Gift or deduct cherries from a player balance')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('The player to award or deduct')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('Choose whether to give or take')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Give', value: 'give' },
                            { name: 'Take', value: 'take' }
                        ))
                .addIntegerOption(option =>
                    option.setName('amount')
                        .setDescription('Amount of cherries')
                        .setMinValue(1)
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('settings')
                .setDescription('⚙️ Setup Welcome Message, Leave Message, or Auto Role')
                .addStringOption(option =>
                    option.setName('welcome_message')
                        .setDescription('Welcome message. Use {user} and {server} as placeholders.'))
                .addStringOption(option =>
                    option.setName('leave_message')
                        .setDescription('Leave message. Use {user} and {server} as placeholders.'))
                .addRoleOption(option =>
                    option.setName('auto_role')
                        .setDescription('Role to automatically assign to new members'))),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        if (subcommand === 'logs') {
            const limit = interaction.options.getInteger('limit') || 10;
            const logs = db.getRecentTransactions(limit);

            if (logs.length === 0) {
                return interaction.editReply({ content: '📜 No transaction logs found in database.' });
            }

            const embed = new EmbedBuilder()
                .setColor('#a855f7')
                .setTitle('📜 Recent Transaction & Activity Logs')
                .setDescription(logs.map(l => {
                    const time = new Date(l.timestamp).toLocaleTimeString();
                    return `\`[${time}]\` <@${l.userId}>: **${l.type}** - ${l.details}`;
                }).join('\n'))
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
        else if (subcommand === 'reward') {
            const target = interaction.options.getUser('target');
            const action = interaction.options.getString('action');
            const amount = interaction.options.getInteger('amount');

            if (target.bot) {
                return interaction.editReply({ content: '❌ You cannot reward or deduct coins from a bot.' });
            }

            // Verify player character exists
            const char = db.getCharacter(target.id);
            if (!char || !char.char_name) {
                return interaction.editReply({ content: `❌ **${target.username}** does not have an RPG character yet!` });
            }

            if (action === 'give') {
                db.addCoins(target.id, guildId, amount);
                db.logTransaction(target.id, 'Admin Reward', `Granted 🍒 ${amount} by admin ${interaction.user.username}`);
            } else {
                db.deductCoins(target.id, guildId, amount);
                db.logTransaction(target.id, 'Admin Deduct', `Deducted 🍒 ${amount} by admin ${interaction.user.username}`);
            }

            const newBalance = db.getBalance(target.id, guildId);
            const embed = new EmbedBuilder()
                .setColor('#10b981')
                .setTitle('👑 Balance Adjusted')
                .setDescription(
                    `Successfully adjusted **${target.username}**'s balance!\n\n` +
                    `• **Action:** ${action === 'give' ? 'Granted 🍒' : 'Deducted 🍒'} ${amount.toLocaleString()} cherries\n` +
                    `• **New Balance:** 🍒 **${newBalance.toLocaleString()} cherries**`
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
        else if (subcommand === 'settings') {
            const welcomeMsg = interaction.options.getString('welcome_message');
            const leaveMsg = interaction.options.getString('leave_message');
            const autoRole = interaction.options.getRole('auto_role');

            const currentSettings = db.getSetting('welcome', {});
            
            if (welcomeMsg !== null) currentSettings.welcomeMsg = welcomeMsg;
            if (leaveMsg !== null) currentSettings.leaveMsg = leaveMsg;
            if (autoRole !== null) currentSettings.autoRole = autoRole.name;

            db.setSetting('welcome', currentSettings);

            const embed = new EmbedBuilder()
                .setColor('#3b82f6')
                .setTitle('⚙️ Server Settings Configured')
                .setDescription(
                    `Successfully updated welcome system configuration!\n\n` +
                    `• **Welcome Msg:** ${currentSettings.welcomeMsg || '*None*'}\n` +
                    `• **Leave Msg:** ${currentSettings.leaveMsg || '*None*'}\n` +
                    `• **Auto Role:** ${currentSettings.autoRole || '*None*'}`
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
    }
};
