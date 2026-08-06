const {SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverevents')
        .setDescription('👥 UwU Server Events, Anonymous Confessions & Dating Zone')
        .addSubcommand(sub =>
            sub.setName('confession')
                .setDescription('💌 Send an anonymous confession to the server')
                .addStringOption(opt => opt.setName('message').setDescription('Your secret confession text').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('datingzone')
                .setDescription('💞 View current dating zone members & romantic status'))
        .addSubcommand(sub =>
            sub.setName('randominvitetospeak')
                .setDescription('🎙️ Randomly pick a member to speak on stage')),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'confession') {
            const secretText = interaction.options.getString('message');

            const channel = interaction.guild.channels.cache.find(c => 
                c.name.toLowerCase().includes('confession') || c.name.toLowerCase().includes('secret')
            ) || interaction.channel;

            const embed = new EmbedBuilder()
                .setColor('#FF69B4')
                .setTitle('💌 Anonymous Confession')
                .setDescription(`*"${secretText}"*`)
                .setFooter({ text: 'Submit your secret confession with /serverevents confession' })
                .setTimestamp();

            await channel.send({ embeds: [embed] }).catch(() => null);
            return interaction.editReply({ content: '✅ Your secret confession has been sent anonymously!' });
        } else if (subcommand === 'datingzone') {
            const embed = new EmbedBuilder()
                .setColor('#FF9EE2')
                .setTitle('💞 UwU Dating Zone')
                .setDescription(
                    `Welcome to the **Server Dating Zone**!\n\n` +
                    `• **Looking for Love:** Use \`/marry\` to propose or \`/uwu ship\` to calculate match compatibility!\n` +
                    `• **Romantic Roleplay:** Use \`/rp kiss\`, \`/rp cuddle\`, and \`/rp hug\` to share affection!`
                )
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'randominvitetospeak') {
            const voiceChannel = interaction.member.voice?.channel;
            if (!voiceChannel) {
                return interaction.editReply({ content: '⚠️ You must be connected to a Voice/Stage channel!' });
            }

            const members = Array.from(voiceChannel.members.values()).filter(m => !m.user.bot);
            if (members.length === 0) {
                return interaction.editReply({ content: '⚠️ No valid members found in your voice channel!' });
            }

            const chosen = members[Math.floor(Math.random() * members.length)];
            const embed = new EmbedBuilder()
                .setColor('#FF69B4')
                .setTitle('🎙️ Stage Invite')
                .setDescription(`🎉 **${chosen.user.username}** has been randomly chosen to take the stage and speak!`)
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        }
    }
};
