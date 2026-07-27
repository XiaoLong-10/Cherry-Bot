const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rp')
        .setDescription('🎭 Perform expressive RPG roleplay actions in chat')
        .addSubcommand(sub =>
            sub.setName('hug')
                .setDescription('💖 Give another adventurer a warm hug')
                .addUserOption(opt => opt.setName('target').setDescription('Who to hug').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('kiss')
                .setDescription('💋 Plant a sweet kiss on another adventurer')
                .addUserOption(opt => opt.setName('target').setDescription('Who to kiss').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('slap')
                .setDescription('💥 Slap another adventurer across the face!')
                .addUserOption(opt => opt.setName('target').setDescription('Who to slap').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('pat')
                .setDescription('👋 Gently pat another adventurer on the head')
                .addUserOption(opt => opt.setName('target').setDescription('Who to pat').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('highfive')
                .setDescription('🙌 Share a high-five with another adventurer')
                .addUserOption(opt => opt.setName('target').setDescription('Who to high-five').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('wave')
                .setDescription('👋 Wave hello to someone')
                .addUserOption(opt => opt.setName('target').setDescription('Who to wave to').setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('bow')
                .setDescription('🙇 Bow respectfully')
                .addUserOption(opt => opt.setName('target').setDescription('Who to bow to').setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('laugh')
                .setDescription('😆 Burst out laughing'))
        .addSubcommand(sub =>
            sub.setName('cry')
                .setDescription('😢 Weep in sorrow'))
        .addSubcommand(sub =>
            sub.setName('dance')
                .setDescription('🕺 Bust some epic dance moves'))
        .addSubcommand(sub =>
            sub.setName('sleep')
                .setDescription('😴 Curl up and fall fast asleep'))
        .addSubcommand(sub =>
            sub.setName('sit')
                .setDescription('🪑 Sit down to rest your legs'))
        .addSubcommand(sub =>
            sub.setName('cheer')
                .setDescription('🎉 Cheer loudly')
                .addUserOption(opt => opt.setName('target').setDescription('Who to cheer for').setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('boop')
                .setDescription('👉 Boop another adventurer on the nose!')
                .addUserOption(opt => opt.setName('target').setDescription('Who to boop').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('cuddle')
                .setDescription('🤗 Cuddle up closely with someone warm')
                .addUserOption(opt => opt.setName('target').setDescription('Who to cuddle').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('nuzzle')
                .setDescription('🐱 Nuzzle affectionately against someone')
                .addUserOption(opt => opt.setName('target').setDescription('Who to nuzzle').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('pout')
                .setDescription('🥺 Pout cutely when you don\'t get your way')
                .addUserOption(opt => opt.setName('target').setDescription('Who to pout at').setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('blush')
                .setDescription('😳 Blush with affection or embarrassment'))
        .addSubcommand(sub =>
            sub.setName('bite')
                .setDescription('🦷 Playfully bite another adventurer!')
                .addUserOption(opt => opt.setName('target').setDescription('Who to bite').setRequired(true))),

    async execute(interaction) {
        await interaction.deferReply();

        const user = interaction.user;
        const subcommand = interaction.options.getSubcommand();
        const target = interaction.options.getUser('target');

        let message = '';
        let color = '#FF69B4'; // Default romantic/expressive pink

        switch (subcommand) {
            case 'hug':
                message = `💖 <@${user.id}> wraps their arms around <@${target.id}> in a warm, cozy hug!`;
                color = '#FF69B4';
                break;
            case 'kiss':
                message = `💋 <@${user.id}> plants a sweet kiss on <@${target.id}>'s cheek!`;
                color = '#FF1493';
                break;
            case 'slap':
                message = `💥 *Smack!* <@${user.id}> slaps <@${target.id}> across the face! Ouch!`;
                color = '#ED4245';
                break;
            case 'pat':
                message = `👋 <@${user.id}> gently pats <@${target.id}> on the head. "There, there."`;
                color = '#FEE75C';
                break;
            case 'highfive':
                message = `🙌 *Clap!* <@${user.id}> and <@${target.id}> share an epic high-five!`;
                color = '#3498DB';
                break;
            case 'wave':
                message = target 
                    ? `👋 <@${user.id}> waves hello to <@${target.id}>!`
                    : `👋 <@${user.id}> waves hello to everyone in the room!`;
                color = '#2ECC71';
                break;
            case 'bow':
                message = target 
                    ? `🙇 <@${user.id}> bows respectfully to <@${target.id}>.`
                    : `🙇 <@${user.id}> bows deeply and respectfully.`;
                color = '#99AAB5';
                break;
            case 'laugh':
                message = `😆 <@${user.id}> bursts out laughing! "Hahaha!"`;
                color = '#F1C40F';
                break;
            case 'cry':
                message = `😢 Tears fill <@${user.id}>'s eyes as they weep in sorrow. "Sniff..."`;
                color = '#7289DA';
                break;
            case 'dance':
                message = `🕺 <@${user.id}> breaks into a spectacular, high-energy dance! *Boogie!*`;
                color = '#9B59B6';
                break;
            case 'sleep':
                message = `😴 <@${user.id}> curls up on the ground and falls fast asleep. *Zzz...*`;
                color = '#2C3E50';
                break;
            case 'sit':
                message = `🪑 <@${user.id}> sits down to rest their weary legs. Ah, comfortable!`;
                color = '#708090';
                break;
            case 'cheer':
                message = target 
                    ? `🎉 <@${user.id}> cheers loudly for <@${target.id}>! "Woohoo! Let's go!"`
                    : `🎉 <@${user.id}> cheers loudly with excitement! "Woohoo!"`;
                color = '#E67E22';
                break;
            case 'boop':
                message = `👉 *Boop!* <@${user.id}> reaches out and boops <@${target.id}> right on the nose! 💕`;
                color = '#FF9EE2';
                break;
            case 'cuddle':
                message = `🤗 <@${user.id}> snuggles up and cuddles closely with <@${target.id}>! Warm and cozy~`;
                color = '#FF69B4';
                break;
            case 'nuzzle':
                message = `🐱 <@${user.id}> nuzzles affectionately against <@${target.id}>! *Purrrr...*`;
                color = '#FFB6C1';
                break;
            case 'pout':
                message = target 
                    ? `🥺 <@${user.id}> pouts cutely at <@${target.id}>... *"Hmph!"*`
                    : `🥺 <@${user.id}> crosses their arms and pouts cutely... *"Hmph!"*`;
                color = '#FF6B6B';
                break;
            case 'blush':
                message = `😳 <@${user.id}>'s cheeks turn bright red as they blush furiously! ( >w< )`;
                color = '#FF477E';
                break;
            case 'bite':
                message = `🦷 *Nom!* <@${user.id}> gives <@${target.id}> a cute, playful little bite! 💖`;
                color = '#E63946';
                break;
        }

        const rpEmbed = new EmbedBuilder()
            .setColor(color)
            .setDescription(message)
            .setTimestamp();

        await interaction.editReply({ embeds: [rpEmbed] });
    }
};
