const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas } = require('canvas');
const db = require('../database.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ledger')
        .setDescription('📈 View the server-wide financial stats and rich list ledger'),

    async execute(interaction) {
        await interaction.deferReply();

        const guildId = interaction.guild.id;

        try {
            // 1. Query Database Stats
            const totalPlayersRow = db.prepare("SELECT COUNT(*) as cnt FROM users").get();
            const totalCoinsRow = db.prepare("SELECT SUM(coins) as sum FROM users").get();
            const totalBankRow = db.prepare("SELECT SUM(bank_coins) as sum FROM users").get();
            const jackpot = db.getSlotsJackpot();

            const totalPlayers = totalPlayersRow ? totalPlayersRow.cnt : 0;
            const walletCoins = totalCoinsRow ? (totalCoinsRow.sum || 0) : 0;
            const bankCoins = totalBankRow ? (totalBankRow.sum || 0) : 0;
            const totalCirculation = walletCoins + bankCoins;
            const avgWealth = totalPlayers > 0 ? Math.floor(totalCirculation / totalPlayers) : 0;

            // Query Top 5 players for the rich list
            const richList = db.prepare("SELECT userId, coins, bank_coins FROM users ORDER BY (coins + bank_coins) DESC LIMIT 5").all();
            const richWithNames = await Promise.all(
                richList.map(async (row) => {
                    let username = 'Unknown User';
                    try {
                        const fetched = await interaction.client.users.fetch(row.userId);
                        username = fetched.username;
                    } catch (e) {}

                    // Net worth calculations
                    const properties = db.getUserProperties(row.userId);
                    const propertyValues = { studio: 20000, villa: 75000, office: 220000, penthouse: 500000 };
                    let realEstateWorth = 0;
                    properties.forEach(p => {
                        realEstateWorth += propertyValues[p.propertyType] || 0;
                    });

                    const businesses = db.getUserBusinesses(row.userId);
                    const businessValues = { coffee: 15000, restaurant: 50000, bank: 150000, factory: 350000, hospital: 800000 };
                    let businessWorth = 0;
                    businesses.forEach(b => {
                        businessWorth += (businessValues[b.businessType] || 0) * b.level;
                    });

                    const stocks = db.getStocks();
                    let stocksWorth = 0;
                    stocks.forEach(s => {
                        const shares = db.getShares(row.userId, s.ticker);
                        if (shares > 0) {
                            stocksWorth += shares * s.price;
                        }
                    });

                    const delivery = db.getDeliveryCompany(row.userId);
                    const vehicleValues = { Bicycle: 0, Scooter: 10000, Van: 30000, Truck: 75000, 'Cargo Jet': 250000 };
                    const fleetWorth = (vehicleValues[delivery.vehicle] || 0) + (delivery.workers * 15000);

                    const netWorth = (row.coins || 0) + (row.bank_coins || 0) + realEstateWorth + businessWorth + stocksWorth + fleetWorth;

                    return { username, netWorth };
                })
            );

            // 2. Create Canvas
            const width = 800;
            const height = 480;
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;

            // Background (Dark Tech-Slate)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'; // Slate-900
            ctx.fillRect(0, 0, width, height);

            // Thin gridlines
            ctx.strokeStyle = '#fce7f3'; // Slate-800
            ctx.lineWidth = 1;
            for (let x = 0; x < width; x += 40) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
            }
            for (let y = 0; y < height; y += 40) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
            }

            // Header Text
            ctx.fillStyle = '#831843';
            ctx.font = 'bold 22px sans-serif';
            ctx.fillText('🍒 CHERRY FINANCIAL LEDGER', 40, 50);

            ctx.fillStyle = '#9d174d';
            ctx.font = '11px sans-serif';
            ctx.fillText('Global server-wide economy statistics & rich rankings', 40, 72);

            // Left Column Stats Cards
            const leftX = 40;
            const cardW = 340;
            const cardH = 92;
            const startY = 100;
            const spacing = 106;

            const stats = [
                { title: '🍒 TOTAL CIRCULATION', value: `🍒 ${totalCirculation.toLocaleString()}`, desc: `Wallet: ${walletCoins.toLocaleString()} | Bank: ${bankCoins.toLocaleString()}`, color: '#f472b6' },
                { title: '🎰 SLOTS JACKPOT POOL', value: `🍒 ${jackpot.toLocaleString()}`, desc: 'Increments by 10% of slots losses', color: '#db2777' },
                { title: '👥 REGISTERED PLAYERS', value: `${totalPlayers.toLocaleString()} Users`, desc: `Average Net Worth: ${avgWealth.toLocaleString()} cherries`, color: '#c084fc' }
            ];

            stats.forEach((s, idx) => {
                const sy = startY + idx * spacing;

                // Stats Glass Card Box
                ctx.save();
                ctx.fillStyle = 'rgba(30, 41, 59, 0.45)';
                ctx.strokeStyle = 'rgba(255,255,255,0.06)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.roundRect(leftX, sy, cardW, cardH, 12);
                ctx.fill();
                ctx.stroke();

                // Draw left colored bar
                ctx.fillStyle = s.color;
                ctx.beginPath();
                ctx.roundRect(leftX + 2, sy + 10, 4, cardH - 20, 2);
                ctx.fill();
                ctx.restore();

                // Details Text
                ctx.fillStyle = '#9d174d';
                ctx.font = 'bold 10px "Segoe UI Emoji", sans-serif';
                ctx.fillText(s.title, leftX + 20, sy + 28);

                ctx.fillStyle = '#831843';
                ctx.font = 'bold 20px "Segoe UI Emoji", sans-serif';
                ctx.fillText(s.value, leftX + 20, sy + 54);

                ctx.fillStyle = '#9d174d';
                ctx.font = '10px "Segoe UI Emoji", sans-serif';
                ctx.fillText(s.desc, leftX + 20, sy + 76);
            });

            // Right Column Rich List
            const rightX = 420;
            const rightW = 340;
            const rightH = 304;

            ctx.save();
            ctx.fillStyle = 'rgba(30, 41, 59, 0.45)';
            ctx.strokeStyle = 'rgba(255,255,255,0.06)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(rightX, startY, rightW, rightH, 12);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // Rich List Title
            ctx.fillStyle = '#831843';
            ctx.font = 'bold 14px "Segoe UI Emoji", sans-serif';
            ctx.fillText('🏆 SERVER RICH LIST (NET WORTH)', rightX + 20, startY + 30);

            // Sort rich list by calculated net worth
            richWithNames.sort((a, b) => b.netWorth - a.netWorth);

            richWithNames.forEach((user, idx) => {
                const ry = startY + 74 + idx * 46;
                const placementText = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;

                // Draw placement icon
                ctx.fillStyle = '#831843';
                ctx.font = '16px "Segoe UI Emoji", sans-serif';
                ctx.fillText(placementText, rightX + 20, ry);

                // Username
                ctx.fillStyle = idx === 0 ? '#f472b6' : '#831843';
                ctx.font = idx === 0 ? 'bold 13px "Segoe UI Emoji", sans-serif' : '13px "Segoe UI Emoji", sans-serif';
                ctx.fillText(user.username.substring(0, 14), rightX + 50, ry);

                // Net Worth
                ctx.fillStyle = '#9d174d';
                ctx.font = 'bold 13px "Segoe UI Emoji", sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText(`🍒 ${user.netWorth.toLocaleString()}`, rightX + rightW - 20, ry);
                ctx.textAlign = 'left';

                // Underline
                if (idx < richWithNames.length - 1) {
                    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(rightX + 20, ry + 16);
                    ctx.lineTo(rightX + rightW - 20, ry + 16);
                    ctx.stroke();
                }
            });

            const buffer = canvas.toBuffer('image/png');
            const attachment = new AttachmentBuilder(buffer, { name: 'server-ledger.png' });

            const embed = new EmbedBuilder()
                .setColor('#db2777')
                .setTitle('📈 SERVER FINANCIAL REPORT')
                .setDescription('Visual economic metrics and circulation stats across this guild.')
                .setImage('attachment://server-ledger.png')
                .setTimestamp();

            await interaction.editReply({ embeds: [embed], files: [attachment] });

        } catch (err) {
            console.error('Error generating ledger:', err);
            await interaction.editReply({ content: '❌ An error occurred while generating the economy ledger.' });
        }
    }
};
