const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

if (!global.activeGiveaways) {
    global.activeGiveaways = new Map();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('🎉 Create and manage server giveaways')
        .addSubcommand(sub =>
            sub.setName('start')
                .setDescription('🎉 Start a new giveaway')
                .addStringOption(opt => opt.setName('prize').setDescription('Giveaway prize').setRequired(true))
                .addIntegerOption(opt => opt.setName('duration').setDescription('Duration in minutes').setRequired(true))
                .addIntegerOption(opt => opt.setName('winners').setDescription('Number of winners').setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('end')
                .setDescription('🏁 End an active giveaway immediately and pick winners')
                .addStringOption(opt => opt.setName('message_id').setDescription('Message ID of the giveaway').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('📜 List all active giveaways in this server')),

    async execute(interaction) {
        await interaction.deferReply();
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'start') {
            const prize = interaction.options.getString('prize');
            const durationMins = interaction.options.getInteger('duration');
            const winnerCount = interaction.options.getInteger('winners') || 1;

            const endTimestamp = Math.floor(Date.now() / 1000) + (durationMins * 60);

            const embed = new EmbedBuilder()
                .setColor('#FF69B4')
                .setTitle(`🎉 GIVEAWAY: ${prize}`)
                .setDescription(
                    `Click the 🎉 **Enter Giveaway** button below to participate!\n\n` +
                    `• **Winners:** \`${winnerCount}\`\n` +
                    `• **Hosted By:** ${interaction.user}\n` +
                    `• **Ends:** <t:${endTimestamp}:R> (<t:${endTimestamp}:f>)`
                )
                .setFooter({ text: 'UwU Giveaways ✨' })
                .setTimestamp(Date.now() + durationMins * 60000);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`gw_enter_${Date.now()}`)
                    .setLabel('🎉 Enter Giveaway')
                    .setStyle(ButtonStyle.Success)
            );

            const msg = await interaction.editReply({ embeds: [embed], components: [row] });

            global.activeGiveaways.set(msg.id, {
                prize,
                winnerCount,
                hostId: interaction.user.id,
                participants: new Set(),
                endTime: Date.now() + durationMins * 60000
            });
        } else if (subcommand === 'end') {
            const msgId = interaction.options.getString('message_id');
            const gw = global.activeGiveaways.get(msgId);

            if (!gw) {
                return interaction.editReply({ content: '⚠️ Active giveaway not found for that message ID!' });
            }

            const participantsArr = Array.from(gw.participants);
            if (participantsArr.length === 0) {
                return interaction.editReply({ content: 'ℹ️ Giveaway ended but no valid participants entered!' });
            }

            const winners = [];
            for (let i = 0; i < Math.min(gw.winnerCount, participantsArr.length); i++) {
                const randIndex = Math.floor(Math.random() * participantsArr.length);
                winners.push(participantsArr.splice(randIndex, 1)[0]);
            }

            global.activeGiveaways.delete(msgId);

            const winnersStr = winners.map(id => `<@${id}>`).join(', ');
            return interaction.editReply({
                content: `🎉 **GIVEAWAY ENDED!**\nCongratulations to ${winnersStr} for winning **${gw.prize}**!`
            });
        } else if (subcommand === 'list') {
            const gws = Array.from(global.activeGiveaways.entries());
            if (gws.length === 0) {
                return interaction.editReply('ℹ️ There are no active giveaways right now.');
            }

            const lines = gws.map(([id, g]) => `• **${g.prize}** (ID: \`${id}\`) — ${g.participants.size} entries`);
            const embed = new EmbedBuilder()
                .setColor('#FF9EE2')
                .setTitle('🎉 Active Server Giveaways')
                .setDescription(lines.join('\n'))
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        }
    }
};
