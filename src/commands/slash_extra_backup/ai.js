const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { generateAIResponse, summarizeText, translateText } = require('../../systems/ai/aiSuite.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ai')
        .setDescription('🤖 Cherry AI Assistant Suite')
        .addSubcommand(sub =>
            sub.setName('chat')
                .setDescription('💬 Chat with Cherry AI assistant')
                .addStringOption(opt =>
                    opt.setName('prompt')
                        .setDescription('Ask AI anything')
                        .setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('summarize')
                .setDescription('📝 Summarize long text or announcements')
                .addStringOption(opt =>
                    opt.setName('text')
                        .setDescription('Text to summarize')
                        .setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('translate')
                .setDescription('🌐 Translate text into another language')
                .addStringOption(opt =>
                    opt.setName('text')
                        .setDescription('Text to translate')
                        .setRequired(true))
                .addStringOption(opt =>
                    opt.setName('language')
                        .setDescription('Target language')
                        .setRequired(true)
                        .addChoices(
                            { name: '🇰🇭 ភាសាខ្មែរ (Khmer)', value: 'km' },
                            { name: '🇺🇸 English', value: 'en' },
                            { name: '🇯🇵 Japanese', value: 'ja' },
                            { name: '🇫🇷 French', value: 'fr' },
                            { name: '🇪🇸 Spanish', value: 'es' }
                        ))),

    async execute(interaction) {
        await interaction.deferReply();

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'chat') {
            const prompt = interaction.options.getString('prompt');
            const aiAnswer = generateAIResponse(prompt);

            const embed = new EmbedBuilder()
                .setColor('#9B59B6')
                .setTitle('🤖 Cherry AI 2.0')
                .addFields(
                    { name: '❓ Question', value: prompt },
                    { name: '💡 AI Response', value: aiAnswer }
                )
                .setFooter({ text: 'Powered by Cherry AI Engine' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'summarize') {
            const text = interaction.options.getString('text');
            const summary = summarizeText(text);

            const embed = new EmbedBuilder()
                .setColor('#3498DB')
                .setTitle('📝 AI Text Summarizer')
                .setDescription(summary)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'translate') {
            const text = interaction.options.getString('text');
            const targetLang = interaction.options.getString('language');
            const translated = translateText(text, targetLang);

            const embed = new EmbedBuilder()
                .setColor('#002B7F')
                .setTitle('🌐 AI Translator')
                .setDescription(translated)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
    }
};
