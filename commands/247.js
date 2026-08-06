const {SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { joinStandbyChannel, leaveStandbyChannel, getStandbyStatus } = require('../src/systems/voiceStandby.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('247')
        .setDescription('🎙️ Toggle 24/7 Voice Room Standby mode so Cherry stays in voice continuously')
        .addSubcommand(sub =>
            sub.setName('on')
                .setDescription('🔊 Enable 24/7 standby mode in your voice channel or specified channel')
                .addChannelOption(opt =>
                    opt.setName('channel')
                        .setDescription('Select target voice channel (defaults to your current voice channel)')
                        .addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice)
                        .setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('off')
                .setDescription('🔇 Leave voice channel and disable 24/7 standby mode'))
        .addSubcommand(sub =>
            sub.setName('status')
                .setDescription('📊 Check current 24/7 voice standby room status and configuration')),

    async execute(interaction) {
        if (!interaction.guild) {
            return await interaction.reply({ content: '❌ This command can only be used inside a server.', flags: MessageFlags.Ephemeral });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'on') {
            await interaction.deferReply();
            const memberVoiceChannel = interaction.member.voice?.channel;
            const targetChannel = interaction.options.getChannel('channel') || memberVoiceChannel;

            if (!targetChannel) {
                return await interaction.editReply({
                    content: '⚠️ **Voice Channel Required!** Please join a voice channel first or specify a voice channel option.'
                });
            }

            try {
                await joinStandbyChannel(interaction.guild, targetChannel, { selfDeaf: true, selfMute: false });

                const embed = new EmbedBuilder()
                    .setColor('#2ECC71')
                    .setTitle('🟢 24/7 VOICE STANDBY ACTIVATED')
                    .setDescription(` Cherry is now standing by in **${targetChannel.name}**!\n\n` +
                        `• **Channel:** <#${targetChannel.id}>\n` +
                        `• **Mode:** 24/7 Auto-Reconnect\n` +
                        `• **Self-Deafen:** Enabled (Optimized)\n\n` +
                        `*The bot will stay connected 24/7 and automatically reconnect if disconnected or restarted.*`)
                    .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                    .setTimestamp();

                return await interaction.editReply({ embeds: [embed] });
            } catch (err) {
                console.error('[Slash 247 on] Error:', err);
                return await interaction.editReply({
                    content: `❌ Failed to join voice channel: ${err.message}`
                });
            }
        } else if (subcommand === 'off') {
            await interaction.deferReply();
            try {
                await leaveStandbyChannel(interaction.guild);

                const embed = new EmbedBuilder()
                    .setColor('#E74C3C')
                    .setTitle('🔴 24/7 VOICE STANDBY DEACTIVATED')
                    .setDescription(' Cherry has disconnected from voice channel and 24/7 standby mode has been turned off.')
                    .setTimestamp();

                return await interaction.editReply({ embeds: [embed] });
            } catch (err) {
                console.error('[Slash 247 off] Error:', err);
                return await interaction.editReply({
                    content: `❌ Failed to leave voice channel: ${err.message}`
                });
            }
        } else if (subcommand === 'status') {
            const { config, isConnected, connectionState } = getStandbyStatus(interaction.guild.id);

            const embed = new EmbedBuilder()
                .setColor(isConnected ? '#2ECC71' : '#F1C40F')
                .setTitle('🎙️ 24/7 Voice Standby Status')
                .addFields(
                    { name: 'Status', value: isConnected ? '🟢 Connected & Active' : '🟡 Disconnected / Idle', inline: true },
                    { name: 'Voice Connection', value: `\`${connectionState}\``, inline: true },
                    { name: 'Target Channel', value: config?.channelId ? `<#${config.channelId}>` : '*None configured*', inline: false },
                    { name: 'Self Deafen', value: config?.selfDeaf ? '✅ Enabled' : '❌ Disabled', inline: true },
                    { name: '24/7 Mode', value: config?.enabled ? '✅ Active' : '❌ Inactive', inline: true }
                )
                .setFooter({ text: `Server: ${interaction.guild.name}` })
                .setTimestamp();

            return await interaction.reply({ embeds: [embed] });
        }
    }
};
