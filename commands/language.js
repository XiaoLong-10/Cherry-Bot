const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getGuildLanguage, setGuildLanguage, t } = require('../locales.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('language')
        .setDescription('🌐 Change or view server language (English / ភាសាខ្មែរ Khmer)')
        .addSubcommand(sub =>
            sub.setName('set')
                .setDescription('⚙️ Set preferred server language')
                .addStringOption(opt =>
                    opt.setName('lang')
                        .setDescription('Select language')
                        .setRequired(true)
                        .addChoices(
                            { name: '🇰🇭 ភាសាខ្មែរ (Khmer)', value: 'km' },
                            { name: '🇺🇸 English', value: 'en' }
                        )))
        .addSubcommand(sub =>
            sub.setName('view')
                .setDescription('🔍 View current server language settings')),

    async execute(interaction) {
        await interaction.deferReply();

        const guildId = interaction.guildId;
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'set') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return await interaction.editReply({ content: '❌ You need **Manage Server** permission to change the language settings!' });
            }

            const chosenLang = interaction.options.getString('lang');
            setGuildLanguage(guildId, chosenLang);

            const isKhmer = chosenLang === 'km';
            const embed = new EmbedBuilder()
                .setColor('#002B7F') // Khmer flag blue
                .setTitle(isKhmer ? '🇰🇭 បានប្តូរភាសាម៉ាស៊ីនបម្រើរួចរាល់' : '🌐 Server Language Updated')
                .setDescription(t(guildId, 'lang_updated'))
                .addFields(
                    { name: isKhmer ? '🌐 ភាសាបច្ចុប្បន្ន' : '🌐 Active Language', value: isKhmer ? '🇰🇭 ភាសាខ្មែរ (Khmer)' : '🇺🇸 English', inline: true }
                )
                .setFooter({ text: 'Cherry Bot Khmer Multi-language System 🇰🇭' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'view') {
            const currentLang = getGuildLanguage(guildId);
            const isKhmer = currentLang === 'km';

            const embed = new EmbedBuilder()
                .setColor('#CE1126') // Khmer flag red
                .setTitle(isKhmer ? '🇰🇭 ការកំណត់ភាសាម៉ាស៊ីនបម្រើ' : '🌐 Server Language Info')
                .addFields(
                    { name: isKhmer ? '🌐 ភាសាបច្ចុប្បន្ន' : '🌐 Active Language', value: isKhmer ? '🇰🇭 ភាសាខ្មែរ (Khmer)' : '🇺🇸 English', inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
    }
};
