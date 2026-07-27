const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const KAOMOJI_LIST = [
    '(owo)', '(uwu)', '( >w< )', '( ^-^ )', '(⁠◕⁠ᴗ⁠◕⁠✿⁠)', '(⁠≧⁠▽⁠≦⁠)', 
    '(* ^ ω ^)', '( ` ω ´ )', '(✿◡‿◡)', '( 🥭 >w<)', '( rawr xD )',
    '(⁠•⁠ө⁠•⁠♡)', '(⁠っ⁠.⁠❛⁠ ⁠g⁠c⁠ ⁠.⁠❛⁠)⁠っ', '(#^.^#)', '(⁠/⁠^⁠-⁠^⁠(⁠^⁠^⁠*⁠)⁠/'
];

function owoifyText(text) {
    if (!text) return 'uwu';

    let converted = text
        // Replace r and l with w
        .replace(/r/g, 'w')
        .replace(/l/g, 'w')
        .replace(/R/g, 'W')
        .replace(/L/g, 'W')
        // Replace ove with uv
        .replace(/ove/g, 'uv')
        .replace(/OVE/g, 'UV')
        .replace(/Ove/g, 'Uv')
        // Replace N followed by vowel with ny
        .replace(/n([aeiou])/g, 'ny$1')
        .replace(/N([aeiou])/g, 'Ny$1')
        .replace(/N([AEIOU])/g, 'NY$1')
        // Replace th with d or f randomly
        .replace(/th/g, 'd')
        .replace(/TH/g, 'D');

    // Add stutter to random words starting with consonants
    const words = converted.split(' ');
    const stutteredWords = words.map(word => {
        if (word.length > 2 && Math.random() < 0.25 && /^[b-df-hj-np-tv-z]/i.test(word)) {
            const firstChar = word.charAt(0);
            return `${firstChar}-${word}`;
        }
        return word;
    });

    converted = stutteredWords.join(' ');

    // Add random kaomoji at the end
    const randomKaomoji = KAOMOJI_LIST[Math.floor(Math.random() * KAOMOJI_LIST.length)];

    return `${converted} ${randomKaomoji}`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uwu')
        .setDescription('💖 Cute UwU and OwO text tools and kaomojis!')
        .addSubcommand(sub =>
            sub.setName('convert')
                .setDescription('✨ Convert any text into adorable UwU speech')
                .addStringOption(opt =>
                    opt.setName('text')
                        .setDescription('The message you want to uwuify')
                        .setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('kaomoji')
                .setDescription('🌸 Get a random cute Japanese kaomoji emoticon'))
        .addSubcommand(sub =>
            sub.setName('stutter')
                .setDescription('🥺 Make your text stutter cutely')
                .addStringOption(opt =>
                    opt.setName('text')
                        .setDescription('Text to turn into cute stuttering speech')
                        .setRequired(true))),

    async execute(interaction) {
        await interaction.deferReply();

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'convert') {
            const textInput = interaction.options.getString('text');
            const uwuResult = owoifyText(textInput);

            const embed = new EmbedBuilder()
                .setColor('#FF9EE2')
                .setTitle('🌸 UwUified Text!')
                .setDescription(`\`\`\`\n${uwuResult}\n\`\`\``)
                .setFooter({ text: 'Powered by Cherry UwU Engine ✨' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'kaomoji') {
            const randomKaomoji = KAOMOJI_LIST[Math.floor(Math.random() * KAOMOJI_LIST.length)];
            
            const embed = new EmbedBuilder()
                .setColor('#FF69B4')
                .setTitle('✨ Random Cute Kaomoji')
                .setDescription(`# ${randomKaomoji}`)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'stutter') {
            const textInput = interaction.options.getString('text');
            const words = textInput.split(' ');
            const stuttered = words.map(w => {
                if (w.length > 0 && /^[a-zA-Z]/.test(w)) {
                    return `${w[0]}-${w[0]}-${w}`;
                }
                return w;
            }).join(' ');

            const embed = new EmbedBuilder()
                .setColor('#FEE75C')
                .setTitle('🥺 Stuttering Speech')
                .setDescription(`*"${stuttered}..."*`)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
    }
};
