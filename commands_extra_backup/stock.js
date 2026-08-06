const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas } = require('@napi-rs/canvas');
const db = require('../database.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stock')
        .setDescription('📈 Invest in the dynamic stock exchange market')
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('📋 List all stock prices, daily trends, and owned shares'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('buy')
                .setDescription('💳 Purchase shares of a stock')
                .addStringOption(option =>
                    option.setName('ticker')
                        .setDescription('The stock ticker (e.g. CHRY, AAPL)')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('shares')
                        .setDescription('Number of shares to buy')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('sell')
                .setDescription('💰 Sell shares of a stock')
                .addStringOption(option =>
                    option.setName('ticker')
                        .setDescription('The stock ticker (e.g. CHRY, AAPL)')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('shares')
                        .setDescription('Number of shares to sell')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('chart')
                .setDescription('📊 View recent price trend chart of a stock')
                .addStringOption(option =>
                    option.setName('ticker')
                        .setDescription('The stock ticker (e.g. CHRY, AAPL)')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('news')
                .setDescription('📰 Read the latest financial news press releases')),

    async execute(interaction) {
        await interaction.deferReply();

        const userId = interaction.user.id;
        const guildId = interaction.guild ? (interaction.guild ? interaction.guild.id : 'GLOBAL') : 'GLOBAL';
        const subcommand = interaction.options.getSubcommand();

        const char = db.getCharacter(userId);
        if (!char || !char.char_name) {
            return interaction.editReply({ content: '⚠️ **You must create an RPG character first!**\nUse **`/character create`** to get started.' });
        }

        // --- SUBCOMMAND: LIST ---
        if (subcommand === 'list') {
            const stocks = db.getStocks();
            const listEmbed = new EmbedBuilder()
                .setColor('#fbcfe8')
                .setTitle('📈 CHERRY STOCK EXCHANGE (CSX)')
                .setDescription('Live stock and cryptocurrency markets. Prices fluctuate every 60 seconds.')
                .setTimestamp();

            stocks.forEach(s => {
                const diff = s.price - s.prevPrice;
                const pct = s.prevPrice > 0 ? ((diff / s.prevPrice) * 100).toFixed(2) : '0.00';
                const emoji = diff >= 0 ? '📈' : '📉';
                const trendText = diff >= 0 ? `+${pct}%` : `${pct}%`;
                
                const owned = db.getShares(userId, s.ticker);
                const value = owned * s.price;

                listEmbed.addFields({
                    name: `${emoji} ${s.ticker} — ${s.companyName}`,
                    value: `• **Price:** 🍒 **${s.price.toFixed(2)}** (${trendText})\n• **Owned:** \` ${owned.toLocaleString()} \` shares (Value: 🍒 **${value.toFixed(2)}**)`
                });
            });

            await interaction.editReply({ embeds: [listEmbed] });
        }

        // --- SUBCOMMAND: BUY ---
        else if (subcommand === 'buy') {
            const ticker = interaction.options.getString('ticker').toUpperCase();
            const shares = interaction.options.getInteger('shares');

            if (shares <= 0) {
                return interaction.editReply({ content: '❌ You must buy at least 1 share!' });
            }

            const stock = db.getStock(ticker);
            if (!stock) {
                return interaction.editReply({ content: `❌ Stock ticker **${ticker}** does not exist!` });
            }

            const cost = parseFloat((shares * stock.price).toFixed(2));
            const playerCoins = db.getBalance(userId, guildId);

            if (playerCoins < cost) {
                return interaction.editReply({ 
                    content: `❌ **Insufficient funds!** Buying **${shares}** shares of **${ticker}** costs 🍒 **${cost.toLocaleString()}** cherries. (You have: 🍒 **${playerCoins.toLocaleString()}**)` 
                });
            }

            db.deductCoins(userId, guildId, cost);
            db.buyShares(userId, ticker, shares);
            db.logTransaction(userId, 'Stock Buy', `Bought ${shares.toLocaleString()} shares of ${ticker} 📈`);

            const buyEmbed = new EmbedBuilder()
                .setColor('#fbcfe8')
                .setTitle('💳 STOCK PURCHASED')
                .setDescription(
                    `Successfully purchased **${shares.toLocaleString()}** shares of **${stock.companyName} (${ticker})**!\n\n` +
                    `• **Share Price:** 🍒 **${stock.price.toFixed(2)}**\n` +
                    `• **Total Cost:** 🍒 **${cost.toLocaleString()} cherries**\n` +
                    `• **New Balance:** 🍒 **${db.getBalance(userId, guildId).toLocaleString()} cherries**`
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [buyEmbed] });
        }

        // --- SUBCOMMAND: SELL ---
        else if (subcommand === 'sell') {
            const ticker = interaction.options.getString('ticker').toUpperCase();
            const shares = interaction.options.getInteger('shares');

            if (shares <= 0) {
                return interaction.editReply({ content: '❌ You must sell at least 1 share!' });
            }

            const stock = db.getStock(ticker);
            if (!stock) {
                return interaction.editReply({ content: `❌ Stock ticker **${ticker}** does not exist!` });
            }

            const owned = db.getShares(userId, ticker);
            if (owned < shares) {
                return interaction.editReply({ 
                    content: `❌ You only own **${owned.toLocaleString()}** shares of **${ticker}**! You cannot sell **${shares.toLocaleString()}**.` 
                });
            }

            const proceeds = parseFloat((shares * stock.price).toFixed(2));
            db.sellShares(userId, ticker, shares);
            db.addCoins(userId, guildId, proceeds);
            db.logTransaction(userId, 'Stock Sell', `Sold ${shares.toLocaleString()} shares of ${ticker} 📉`);

            const sellEmbed = new EmbedBuilder()
                .setColor('#f43f5e')
                .setTitle('💰 SHARES SOLD')
                .setDescription(
                    `Successfully sold **${shares.toLocaleString()}** shares of **${stock.companyName} (${ticker})**!\n\n` +
                    `• **Share Price:** 🍒 **${stock.price.toFixed(2)}**\n` +
                    `• **Total Proceeds:** 🍒 **${proceeds.toLocaleString()} cherries**\n` +
                    `• **New Balance:** 🍒 **${db.getBalance(userId, guildId).toLocaleString()} cherries**`
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [sellEmbed] });
        }

        // --- SUBCOMMAND: CHART ---
        else if (subcommand === 'chart') {
            const ticker = interaction.options.getString('ticker').toUpperCase();
            const stock = db.getStock(ticker);

            if (!stock) {
                return interaction.editReply({ content: `❌ Stock ticker **${ticker}** does not exist!` });
            }

            let history = [];
            try {
                history = JSON.parse(stock.history || '[]');
            } catch(e) {}

            if (history.length === 0) {
                history = [stock.price];
            }

            // Draw line chart on 800x400 canvas
            const width = 800;
            const height = 400;
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext('2d');

            // Sleek Dark Grid background with Slate radial gradient
            const bgGrad = ctx.createRadialGradient(width/2, height/2, 50, width/2, height/2, width/2);
            bgGrad.addColorStop(0, 'rgba(255, 255, 255, 0.7)'); // slate-900
            bgGrad.addColorStop(1, '#fbcfe8'); // slate-950
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, width, height);

            // Watermark Logo
            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
            ctx.font = 'bold 150px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(stock.ticker, width / 2, height / 2);
            ctx.restore();

            ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
            ctx.lineWidth = 1;

            // Draw horizontal grid lines
            for (let i = 1; i <= 6; i++) {
                const y = (height / 7) * i;
                ctx.beginPath();
                ctx.moveTo(50, y);
                ctx.lineTo(width - 50, y);
                ctx.stroke();
            }

            // Price boundaries
            const minPrice = Math.min(...history) * 0.95;
            const maxPrice = Math.max(...history) * 1.05;
            const priceRange = maxPrice - minPrice;

            const diff = stock.price - stock.prevPrice;
            const color = diff >= 0 ? '#db2777' : '#be185d'; // Emerald Green or Rose Red

            // Draw Previous Close Dashed Line
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.setLineDash([6, 6]);
            const prevY = height - 50 - (((stock.prevPrice - minPrice) / priceRange) * (height - 100));
            ctx.beginPath();
            ctx.moveTo(50, prevY);
            ctx.lineTo(width - 50, prevY);
            ctx.stroke();
            ctx.restore();

            // Draw Price Trend Line
            const xStep = (width - 100) / Math.max(1, history.length - 1);
            ctx.beginPath();

            history.forEach((price, idx) => {
                const x = 50 + (idx * xStep);
                const y = height - 50 - (((price - minPrice) / priceRange) * (height - 100));
                if (idx === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });

            ctx.strokeStyle = color;
            ctx.lineWidth = 4;
            // Neon Glow
            ctx.shadowColor = color;
            ctx.shadowBlur = 10;
            ctx.stroke();
            ctx.shadowBlur = 0; // Reset shadow

            // Gradient Fill Area
            ctx.lineTo(50 + ((history.length - 1) * xStep), height - 50);
            ctx.lineTo(50, height - 50);
            ctx.closePath();
            
            const areaGrad = ctx.createLinearGradient(0, 50, 0, height - 50);
            areaGrad.addColorStop(0, diff >= 0 ? 'rgba(219, 39, 119, 0.25)' : 'rgba(190, 24, 93, 0.25)');
            areaGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
            ctx.fillStyle = areaGrad;
            ctx.fill();

            // Draw Point Markers (Dots) on data points
            ctx.fillStyle = color;
            history.forEach((price, idx) => {
                const x = 50 + (idx * xStep);
                const y = height - 50 - (((price - minPrice) / priceRange) * (height - 100));
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
            });

            // Draw legend metrics
            ctx.fillStyle = '#831843';
            ctx.font = 'bold 22px "Segoe UI Emoji", sans-serif';
            ctx.fillText(`${stock.companyName} (${stock.ticker})`, 50, 45);

            ctx.fillStyle = color;
            const pct = stock.prevPrice > 0 ? (((stock.price - stock.prevPrice) / stock.prevPrice) * 100).toFixed(2) : '0.00';
            ctx.font = 'bold 20px "Segoe UI Emoji", sans-serif';
            ctx.fillText(`🍒 ${stock.price.toFixed(2)} (${diff >= 0 ? '+' : ''}${pct}%)`, 50, 80);

            // Draw axis labels
            ctx.fillStyle = '#be185d';
            ctx.font = '11px sans-serif';
            ctx.fillText(`High: ${maxPrice.toFixed(2)}`, width - 120, 45);
            ctx.fillText(`Low: ${minPrice.toFixed(2)}`, width - 120, height - 20);

            const buffer = canvas.toBuffer('image/png');
            const attachment = new AttachmentBuilder(buffer, { name: 'stock-chart.png' });

            const chartEmbed = new EmbedBuilder()
                .setColor(color)
                .setTitle(`📊 Price Trend: ${stock.ticker}`)
                .setDescription(`Visual trends showing the last **${history.length}** price updates. Dashed line indicates previous close.`)
                .setImage('attachment://stock-chart.png')
                .setTimestamp();

            await interaction.editReply({ embeds: [chartEmbed], files: [attachment] });
        }

        // --- SUBCOMMAND: NEWS ---
        else if (subcommand === 'news') {
            const newsList = db.getStockNews(6);
            const newsEmbed = new EmbedBuilder()
                .setColor('#c084fc')
                .setTitle('📰 CHERRY EXCHANGE PRESS NETWORK (CEPN)')
                .setDescription('The latest corporate events, global press bulletins, and market updates.')
                .setTimestamp();

            if (newsList.length === 0) {
                newsEmbed.setDescription('📭 *No market news has been broadcasted recently. Keep an eye on global ticks!*');
            } else {
                newsList.forEach(n => {
                    const timeString = new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const impactEmoji = n.impact === 'Positive' ? '🚀' : n.impact === 'Negative' ? '🚨' : '📊';
                    newsEmbed.addFields({
                        name: `[${timeString}] ${impactEmoji} ${n.ticker} UPDATE`,
                        value: `${n.headline}`
                    });
                });
            }

            await interaction.editReply({ embeds: [newsEmbed] });
        }
    }
};
