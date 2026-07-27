const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');

const SOUNDS = {
    jackpot: 'https://www.soundjay.com/misc/sounds/cash-register-purchase-1.mp3',
    levelup: 'https://www.soundjay.com/button/sounds/button-10.mp3',
    breakout: 'https://www.soundjay.com/mechanical/sounds/siren-1.mp3',
    ring: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3'
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('soundboard')
        .setDescription('🔊 Play a game event sound effect directly in your current voice channel')
        .addStringOption(option =>
            option.setName('sound')
                .setDescription('Select the retro sound effect to trigger')
                .setRequired(true)
                .addChoices(
                    { name: '🎰 Jackpot Cascade', value: 'jackpot' },
                    { name: '🎉 Level Up Chime', value: 'levelup' },
                    { name: '🦖 Dinosaur Breakout Siren', value: 'breakout' },
                    { name: '🍒 Register Cash Ring', value: 'ring' }
                )),

    async execute(interaction) {
        const member = interaction.member;
        const voiceChannel = member.voice.channel;

        if (!voiceChannel) {
            return await interaction.reply({ 
                content: '❌ **Voice Channel Required!**\nYou must be in a voice channel first to summon the soundboard bot.',
                ephemeral: true 
            });
        }

        const soundKey = interaction.options.getString('sound');
        const soundUrl = SOUNDS[soundKey];

        const joinEmbed = new EmbedBuilder()
            .setColor('#db2777')
            .setTitle('🔊 SOUNDBOARD TRIGGERED')
            .setDescription(`🎵 Joining channel **${voiceChannel.name}** to play sound...`)
            .setTimestamp();

        await interaction.reply({ embeds: [joinEmbed] });

        try {
            // Join voice channel
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator
            });

            const player = createAudioPlayer();
            const resource = createAudioResource(soundUrl);

            player.play(resource);
            connection.subscribe(player);

            // Auto-disconnect when audio player goes idle
            player.on(AudioPlayerStatus.Idle, () => {
                try {
                    connection.destroy();
                } catch(e) {}
            });

            // Ultimate fallback safety cleanup after 5 seconds
            setTimeout(() => {
                try {
                    connection.destroy();
                } catch(e) {}
            }, 5000);

        } catch (err) {
            console.error('Soundboard voice connection error:', err);
            const errorEmbed = new EmbedBuilder()
                .setColor('#f43f5e')
                .setTitle('❌ SOUNDBOARD FAILURE')
                .setDescription(`An error occurred while attempting to join the voice channel:\n\`${err.message}\``)
                .setTimestamp();

            await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        }
    }
};
