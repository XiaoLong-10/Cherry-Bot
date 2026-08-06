const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { HOUSE_TYPES, FURNITURE_CATALOG, getUserHouse, buyHouse, buyFurniture } = require('../../systems/housing/houseEngine.js');
const db = require('../../database/index.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('housing')
        .setDescription('🏡 Player Housing & Furniture Decoration System')
        .addSubcommand(sub =>
            sub.setName('profile')
                .setDescription('🏠 View your home, equipped furniture, and house rating'))
        .addSubcommand(sub =>
            sub.setName('buy')
                .setDescription('🏡 Purchase a new house tier')
                .addStringOption(opt =>
                    opt.setName('tier')
                        .setDescription('Select house tier')
                        .setRequired(true)
                        .addChoices(
                            { name: '🏡 Suburban Villa (50,000 Coins)', value: 'villa' },
                            { name: '🏰 Grand Estate (250,000 Coins)', value: 'estate' },
                            { name: '🏯 Royal Palace (1,000,000 Coins)', value: 'palace' }
                        )))
        .addSubcommand(sub =>
            sub.setName('decorate')
                .setDescription('🛋️ Purchase furniture to decorate your home')
                .addStringOption(opt =>
                    opt.setName('item')
                        .setDescription('Select furniture item')
                        .setRequired(true)
                        .addChoices(
                            { name: '🛋️ Velvet Sofa (2,500 Coins / +50 Rating)', value: 'sofa' },
                            { name: '🛏️ King Canopy Bed (5,000 Coins / +100 Rating)', value: 'bed' },
                            { name: '🖥️ RGB Gaming Setup (12,000 Coins / +200 Rating)', value: 'setup' },
                            { name: '🎨 Renaissance Painting (25,000 Coins / +350 Rating)', value: 'painting' },
                            { name: '🎹 Grand Piano (50,000 Coins / +600 Rating)', value: 'piano' }
                        ))),

    async execute(interaction) {
        await interaction.deferReply();

        const userId = interaction.user.id;
        const guildId = interaction.guildId;
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'profile') {
            const house = getUserHouse(userId);

            const embed = new EmbedBuilder()
                .setColor('#F1C40F')
                .setTitle(`🏡 Home Profile — ${interaction.user.username}`)
                .addFields(
                    { name: '🏠 House Residence', value: `**${house.houseType}**`, inline: true },
                    { name: '⭐ House Prestige Rating', value: `**${house.houseRating.toLocaleString()}** Pts`, inline: true },
                    { name: '🛋️ Furniture Count', value: `**${house.furniture.length}** items equipped`, inline: true },
                    { name: '🖼️ Decorated Interior', value: house.furniture.length > 0 ? house.furniture.map(f => `• ${f}`).join('\n') : 'Empty interior. Use `/housing decorate` to add furniture!', inline: false }
                )
                .setFooter({ text: 'Cherry Housing & Furniture System' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'buy') {
            const tierKey = interaction.options.getString('tier');
            const res = buyHouse(userId, tierKey);

            if (!res.success) {
                return await interaction.editReply({ content: `❌ ${res.reason}` });
            }

            const embed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setTitle('🏡 House Upgrade Purchased!')
                .setDescription(`Congratulations! You are now the proud owner of a **${res.houseInfo.name}**!`)
                .addFields(
                    { name: '⭐ New Base Rating', value: `**${res.houseInfo.baseRating.toLocaleString()}** Pts`, inline: true },
                    { name: '🛋️ Max Furniture Capacity', value: `Up to **${res.houseInfo.maxFurniture}** items`, inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'decorate') {
            const itemKey = interaction.options.getString('item');
            const res = buyFurniture(userId, itemKey);

            if (!res.success) {
                return await interaction.editReply({ content: `❌ ${res.reason}` });
            }

            const embed = new EmbedBuilder()
                .setColor('#9B59B6')
                .setTitle('🛋️ Furniture Added!')
                .setDescription(`Added **${res.item.name}** to your home interior!`)
                .addFields(
                    { name: '⭐ Rating Boost', value: `+**${res.item.ratingBonus}** Pts`, inline: true },
                    { name: '📊 Total House Rating', value: `**${res.newRating.toLocaleString()}** Pts`, inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
    }
};
