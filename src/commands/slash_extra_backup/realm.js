const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getRealm, contributeResource, collectDividends } = require('../../systems/world/sharedRealm.js');
const db = require('../../database/index.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('realm')
        .setDescription('🏰 Shared Community Realm & Server Tycoon System')
        .addSubcommand(sub =>
            sub.setName('view')
                .setDescription('🏰 View your server\'s shared virtual kingdom status'))
        .addSubcommand(sub =>
            sub.setName('contribute')
                .setDescription('🎁 Donate wood, stone, iron, crops, or coins to level up kingdom buildings')
                .addStringOption(opt =>
                    opt.setName('resource')
                        .setDescription('Type of resource to donate')
                        .setRequired(true)
                        .addChoices(
                            { name: '🪙 Coins / Cherries', value: 'coins' },
                            { name: '🪵 Wood (Pine/Oak)', value: 'wood' },
                            { name: '🪨 Stone', value: 'stone' },
                            { name: '🪨 Iron Ore', value: 'iron' },
                            { name: '🌾 Wheat Crops', value: 'wheat' }
                        ))
                .addIntegerOption(opt => opt.setName('amount').setDescription('Amount to donate').setRequired(true).setMinValue(1)))
        .addSubcommand(sub =>
            sub.setName('collect')
                .setDescription('💰 Claim your daily share of passive server kingdom dividends')),

    async execute(interaction) {
        await interaction.deferReply();

        const userId = interaction.user.id;
        const guildId = interaction.guildId;
        const subcommand = interaction.options.getSubcommand();
        const curr = db.getCurrencySettings(guildId);

        if (subcommand === 'view') {
            const realm = getRealm(guildId);
            const userContrib = db.prepare("SELECT pointsContributed FROM realm_contributions WHERE guildId = ? AND userId = ?").get(guildId, userId);
            const userPoints = userContrib ? userContrib.pointsContributed : 0;

            const embed = new EmbedBuilder()
                .setColor('#F1C40F')
                .setTitle(`🏰 ${interaction.guild.name} — Shared Realm Tycoon`)
                .setDescription('All server members work together to upgrade buildings, boost XP rates, and earn shared passive coin dividends!')
                .addFields(
                    { name: '🏰 Town Hall Level', value: `Level **${realm.townHallLvl}** (+${realm.townHallLvl * 5}% XP Boost)`, inline: true },
                    { name: '🧋 Boba Distillery Level', value: `Level **${realm.distilleryLvl}** (${(realm.distilleryLvl * 500).toLocaleString()} ${curr.symbol}/12h)`, inline: true },
                    { name: '🏪 Marketplace Guild Level', value: `Level **${realm.marketplaceLvl}** (-${realm.marketplaceLvl * 2}% Shop Discount)`, inline: true },
                    { name: '💰 Server Dividend Treasury', value: `${curr.symbol} **${realm.treasuryPool.toLocaleString()}** ${curr.name}`, inline: true },
                    { name: '🌟 Your Contribution Points', value: `**${userPoints.toLocaleString()}** Pts`, inline: true }
                )
                .setFooter({ text: 'Cherry Shared World Tycoon Engine' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'contribute') {
            const resType = interaction.options.getString('resource');
            const amount = interaction.options.getInteger('amount');

            const res = contributeResource(guildId, userId, resType, amount);

            if (!res.success) {
                return await interaction.editReply({ content: `❌ ${res.reason}` });
            }

            const embed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setTitle('🎁 Kingdom Contribution Received!')
                .setDescription(`Thank you for donating **${amount.toLocaleString()}x ${resType}** to ${interaction.guild.name}!`)
                .addFields(
                    { name: '⭐ Points Earned', value: `+**${res.pointsEarned.toLocaleString()}** Realm Pts`, inline: true },
                    { name: '📊 Total Server Realm Progress', value: `**${res.totalPoints.toLocaleString()}** Total Pts`, inline: true }
                )
                .setTimestamp();

            if (res.upgradedBuilding) {
                embed.addFields({ name: '🚀 KINGDOM UPGRADE!', value: `🎉 **${res.upgradedBuilding}** leveled up!`, inline: false });
            }

            await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'collect') {
            const res = collectDividends(guildId, userId);

            if (!res.success) {
                return await interaction.editReply({ content: `❌ ${res.reason}` });
            }

            const embed = new EmbedBuilder()
                .setColor('#9B59B6')
                .setTitle('💰 Kingdom Dividend Claimed!')
                .setDescription(`You received **${res.payout.toLocaleString()}** ${curr.symbol} ${curr.name} from the server treasury!`)
                .addFields(
                    { name: '🏦 Remaining Treasury Pool', value: `${curr.symbol} **${res.remainingTreasury.toLocaleString()}**`, inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
    }
};
