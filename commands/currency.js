const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('currency')
        .setDescription('🪙 Customize server currency name & symbol (Mimu-style)')
        .addSubcommand(sub =>
            sub.setName('set')
                .setDescription('⚙️ Set custom server currency name and emoji/symbol')
                .addStringOption(opt =>
                    opt.setName('name')
                        .setDescription('The currency name (e.g. boba, cookies, stars)')
                        .setRequired(true))
                .addStringOption(opt =>
                    opt.setName('symbol')
                        .setDescription('The currency emoji or symbol (e.g. 🧋, 🍪, ⭐)')
                        .setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('view')
                .setDescription('🔍 View current server currency settings'))
        .addSubcommand(sub =>
            sub.setName('reset')
                .setDescription('🔄 Reset currency settings back to default 🍒 cherries')),

    async execute(interaction) {
        await interaction.deferReply();

        const guildId = interaction.guildId;
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'set') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return await interaction.editReply({ content: '❌ You need **Manage Server** permission to change currency settings!' });
            }

            const name = interaction.options.getString('name');
            const symbol = interaction.options.getString('symbol');

            db.setCurrencySettings(guildId, name, symbol);

            const embed = new EmbedBuilder()
                .setColor('#F1C40F')
                .setTitle('✨ Server Currency Updated!')
                .setDescription(`Your server currency has been customized!`)
                .addFields(
                    { name: '📛 Currency Name', value: `\`${name}\``, inline: true },
                    { name: '🔣 Currency Symbol', value: `${symbol}`, inline: true },
                    { name: '💡 Example Display', value: `1,000 ${symbol} ${name}`, inline: false }
                )
                .setFooter({ text: 'Mimu-style Custom Server Economy' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'view') {
            const curr = db.getCurrencySettings(guildId);

            const embed = new EmbedBuilder()
                .setColor('#3498DB')
                .setTitle('🪙 Server Currency Info')
                .addFields(
                    { name: '📛 Currency Name', value: `\`${curr.name}\``, inline: true },
                    { name: '🔣 Currency Symbol', value: `${curr.symbol}`, inline: true },
                    { name: '✨ Example Balance', value: `500 ${curr.symbol} ${curr.name}`, inline: false }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'reset') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return await interaction.editReply({ content: '❌ You need **Manage Server** permission to reset currency settings!' });
            }

            db.resetCurrencySettings(guildId);

            const embed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setTitle('🔄 Currency Reset')
                .setDescription('Successfully reset server currency back to default: **🍒 cherries**.')
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
    }
};
