const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const { joinStandbyChannel, leaveStandbyChannel, getStandbyStatus } = require('../src/systems/voiceStandby.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('standby')
        .setDescription('🎙️ Manage 24/7 Voice Room Standby mode')
        .addSubcommand(sub =>
            sub.setName('on')
                .setDescription('🔊 Join voice channel and stay connected 24/7')
                .addChannelOption(opt =>
                    opt.setName('channel')
                        .setDescription('Voice channel to standby in')
                        .addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice)
                        .setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('off')
                .setDescription('🔇 Leave voice channel and turn off 24/7 standby'))
        .addSubcommand(sub =>
            sub.setName('status')
                .setDescription('📊 View 24/7 standby room status')),

    async execute(interaction) {
        // Delegate execution to /247 logic
        const cmd247 = require('./247.js');
        return await cmd247.execute(interaction);
    }
};
