const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const db = require('../database.js');
const market = require('../market.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('market')
        .setDescription('Interact with the server stock market.')
        .addSubcommand(sub =>
            sub.setName('prices')
               .setDescription('View current asset prices and your portfolio.'))
        .addSubcommand(sub =>
            sub.setName('buy')
               .setDescription('Buy shares of a stock.')
               .addStringOption(o => o.setName('ticker').setDescription('CHERRY, BTC, or LINUX').setRequired(true).addChoices(
                   { name: 'CHERRY', value: 'CHERRY' }, { name: 'BTC', value: 'BTC' }, { name: 'LINUX', value: 'LINUX' }
               ))
               .addIntegerOption(o => o.setName('shares').setDescription('Amount to buy').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('sell')
               .setDescription('Sell your shares.')
               .addStringOption(o => o.setName('ticker').setDescription('CHERRY, BTC, or LINUX').setRequired(true).addChoices(
                   { name: 'CHERRY', value: 'CHERRY' }, { name: 'BTC', value: 'BTC' }, { name: 'LINUX', value: 'LINUX' }
               ))
               .addIntegerOption(o => o.setName('shares').setDescription('Amount to sell').setRequired(true))),
               
    async execute(interaction) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        
        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;
        const guildId = interaction.guild ? (interaction.guild ? interaction.guild.id : 'GLOBAL') : 'GLOBAL';
        const prices = market.getPrices();

        if (subcommand === 'prices') {
            const embed = new EmbedBuilder()
                .setColor('#db2777')
                .setTitle('🎀 Live Server Stock Exchange 🎀')
                .setDescription('View current asset prices and your portfolio below.')
                .setTimestamp();

            for (const ticker in prices) {
                const userShares = db.getShares(userId, ticker);
                embed.addFields({ 
                    name: `📈 ${ticker}`, 
                    value: `Price: 🍒 **${prices[ticker]}** cherries\nYou Own: **${userShares}** shares (Value: 🍒 ${(userShares * prices[ticker]).toLocaleString()})`, 
                    inline: false 
                });
            }
            return interaction.editReply({ embeds: [embed] });
        }

        const ticker = interaction.options.getString('ticker');
        const shares = interaction.options.getInteger('shares');
        const pricePerShare = market.getPrice(ticker);
        const totalCost = pricePerShare * shares;

        if (shares <= 0) return interaction.editReply({ content: '❌ Amount must be greater than 0.' });

        if (subcommand === 'buy') {
            const balance = db.getBalance(userId, guildId);
            if (balance < totalCost) return interaction.editReply({ content: `❌ You need 🍒 **${totalCost.toLocaleString()}** cherries to buy this, but you only have 🍒 **${balance.toLocaleString()}**.` });

            db.deductCoins(userId, guildId, totalCost);
            db.buyShares(userId, ticker, shares);
            return interaction.editReply({ content: `✅ Successfully bought **${shares}** shares of **${ticker}** for 🍒 **${totalCost.toLocaleString()}** cherries!` });
        }

        if (subcommand === 'sell') {
            const ownedShares = db.getShares(userId, ticker);
            if (ownedShares < shares) return interaction.editReply({ content: `❌ You only own **${ownedShares}** shares of **${ticker}**.` });

            db.sellShares(userId, ticker, shares);
            db.addCoins(userId, guildId, totalCost);
            return interaction.editReply({ content: `🍒 Successfully sold **${shares}** shares of **${ticker}** for a payout of 🍒 **${totalCost.toLocaleString()}** cherries!` });
        }
    }
};