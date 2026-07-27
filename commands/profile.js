const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas'); 
const db = require('../database.js');

function drawProgressBar(ctx, x, y, width, height, value, max, colorOrGradient, bgColor = '#1e293b') {
    ctx.save();
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, height / 2);
    ctx.fill();
    
    const filledWidth = Math.max(0, Math.min(width, (value / max) * width));
    if (filledWidth > 0) {
        ctx.fillStyle = colorOrGradient;
        ctx.beginPath();
        ctx.roundRect(x, y, filledWidth, height, height / 2);
        ctx.fill();
    }
    ctx.restore();
}

function drawRoundCard(ctx, x, y, w, h, radius, fillColor, strokeColor, strokeWidth = 1) {
    ctx.save();
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fill();
    if (strokeColor) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.stroke();
    }
    ctx.restore();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('✨ View your premium financial wealth dashboard and assets card.')
        .addBooleanOption(option =>
            option.setName('balance_only')
                .setDescription('Set to True to only display your cherry balance')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply();

        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        const balanceOnly = interaction.options.getBoolean('balance_only') || false;

        const coins = db.getBalance(userId, guildId);
        const char = db.getCharacter(userId); // Seeded automatically if missing

        // --- CONDITION A: BALANCE ONLY ---
        if (balanceOnly) {
            const balanceEmbed = new EmbedBuilder()
                .setColor('#db2777') 
                .setAuthor({ 
                    name: `${interaction.user.username}'s Wallet`, 
                    iconURL: interaction.user.displayAvatarURL({ extension: 'png' }) 
                })
                .setDescription(`🍒 You currently hold **${coins.toLocaleString()}** cherries.`)
                .setTimestamp();

            return await interaction.editReply({ embeds: [balanceEmbed] });
        }

        // --- CONDITION B: FINANCIAL PROFILE CARD ---
        const bankVault = char.bank_coins || 0;

        // 1. Calculate Real Estate Valuation
        const properties = db.getUserProperties(userId);
        const propertyValues = { studio: 20000, villa: 75000, office: 220000, penthouse: 500000 };
        let realEstateWorth = 0;
        properties.forEach(p => {
            realEstateWorth += propertyValues[p.propertyType] || 0;
        });

        // 2. Calculate Business Valuation
        const businesses = db.getUserBusinesses(userId);
        const businessValues = { coffee: 15000, restaurant: 50000, bank: 150000, factory: 350000, hospital: 800000 };
        let businessWorth = 0;
        businesses.forEach(b => {
            const baseVal = businessValues[b.businessType] || 0;
            // Value scale with level
            businessWorth += baseVal * b.level;
        });

        // 3. Calculate Stock Portfolio Valuation
        const stocks = db.getStocks();
        let stocksWorth = 0;
        let stockSharesCount = 0;
        stocks.forEach(s => {
            const shares = db.getShares(userId, s.ticker);
            if (shares > 0) {
                stocksWorth += shares * s.price;
                stockSharesCount += shares;
            }
        });

        // 4. Calculate Delivery Fleet Valuation
        const delivery = db.getDeliveryCompany(userId);
        const vehicleValues = { Bicycle: 0, Scooter: 10000, Van: 30000, Truck: 75000, 'Cargo Jet': 250000 };
        const fleetWorth = (vehicleValues[delivery.vehicle] || 0) + (delivery.workers * 15000);

        // 5. Total Net Worth
        const netWorth = coins + bankVault + realEstateWorth + businessWorth + stocksWorth + fleetWorth;

        try {
            const canvas = createCanvas(800, 600);
            const ctx = canvas.getContext('2d');

            // 1. Draw a beautiful pastel pink gradient background
            const bgGrad = ctx.createLinearGradient(0, 0, 800, 600);
            bgGrad.addColorStop(0, '#fbcfe8'); // soft pink
            bgGrad.addColorStop(1, '#fdf4ff'); // light fuchsia
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Subtle white gridlines in background
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 2;
            for (let i = 0; i < canvas.width; i += 40) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, canvas.height);
                ctx.stroke();
            }
            for (let j = 0; j < canvas.height; j += 40) {
                ctx.beginPath();
                ctx.moveTo(0, j);
                ctx.lineTo(canvas.width, j);
                ctx.stroke();
            }

            // Glow circle behind avatar
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            const glowGrad = ctx.createRadialGradient(160, 140, 0, 160, 140, 160);
            glowGrad.addColorStop(0, 'rgba(244, 114, 182, 0.6)'); // Pink glow
            glowGrad.addColorStop(1, 'rgba(244, 114, 182, 0)');
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(160, 140, 160, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // 2. Draw Left Panel (Avatar + Level Info)
            drawRoundCard(ctx, 25, 25, 270, 550, 16, 'rgba(255, 255, 255, 0.6)', 'rgba(244, 114, 182, 0.5)', 2);

            // Load and draw User Avatar
            let avatarImg;
            try {
                const avatarUrl = interaction.user.displayAvatarURL({ extension: 'png', size: 256 });
                avatarImg = await loadImage(avatarUrl);
            } catch (err) {}

            if (avatarImg) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(160, 130, 75, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(avatarImg, 85, 55, 150, 150);
                ctx.restore();

                // Pink glow ring around avatar
                ctx.strokeStyle = '#db2777';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(160, 130, 75, 0, Math.PI * 2);
                ctx.stroke();
            }

            // User Name
            ctx.fillStyle = '#831843';
            ctx.font = 'bold 24px "Segoe UI", "Segoe UI Emoji", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(interaction.user.username, 160, 250);

            // Rank Badge
            const serverRank = db.getServerRankPosition(userId);
            drawRoundCard(ctx, 85, 290, 150, 22, 11, 'rgba(251, 113, 133, 0.2)', 'rgba(251, 113, 133, 0.5)', 1);
            ctx.fillStyle = '#be185d';
            ctx.font = 'bold 12px "Segoe UI", "Segoe UI Emoji", sans-serif';
            ctx.fillText(`🌸 RANK #${serverRank}`, 160, 305);

            // RPG Level info
            ctx.fillStyle = '#db2777';
            ctx.font = 'bold 14px "Segoe UI", "Segoe UI Emoji", sans-serif';
            ctx.fillText(`Level ${char.level}`, 160, 345);

            const xpNeeded = char.level * 100;
            ctx.fillStyle = '#9d174d';
            ctx.font = '11px "Segoe UI", "Segoe UI Emoji", sans-serif';
            ctx.fillText(`XP: ${char.xp} / ${xpNeeded} (${Math.floor((char.xp / xpNeeded) * 100)}%)`, 160, 365);

            // XP Progress Bar
            const xpGrad = ctx.createLinearGradient(50, 0, 270, 0);
            xpGrad.addColorStop(0, '#f9a8d4'); // Light pink
            xpGrad.addColorStop(1, '#be185d'); // Dark pink
            drawProgressBar(ctx, 40, 375, 240, 12, char.xp, xpNeeded, xpGrad, 'rgba(255, 255, 255, 0.8)');

            // Quick Stats details on Left Panel
            ctx.fillStyle = '#831843';
            ctx.font = '11px "Segoe UI", "Segoe UI Emoji", sans-serif';
            ctx.fillText('🎀 CHERRY ID CARD 🎀', 160, 550);

            // 3. Right Panel Header
            ctx.textAlign = 'left';
            ctx.fillStyle = '#be185d';
            ctx.font = 'bold 11px "Segoe UI", "Segoe UI Emoji", sans-serif';
            ctx.fillText('💖 ESTIMATED TOTAL WEALTH 💖', 330, 45);

            // Big Net Worth Number
            ctx.fillStyle = '#db2777'; 
            ctx.font = 'bold 42px "Segoe UI", "Segoe UI Emoji", sans-serif';
            ctx.fillText(`🍒 ${netWorth.toLocaleString()}`, 330, 95);

            // Divider line
            ctx.strokeStyle = 'rgba(219, 39, 119, 0.2)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(330, 120);
            ctx.lineTo(760, 120);
            ctx.stroke();

            // 4. Asset Grid (2 cols x 3 rows of premium rounded cards)
            const gridItems = [
                { title: 'Liquid Wallet', value: coins, icon: '🍒', color: '#db2777' },
                { title: 'Bank Vault', value: bankVault, icon: '🎀', color: '#ec4899' },
                { title: 'Stock Shares', value: stocksWorth, icon: '✨', color: '#f43f5e' },
                { title: 'Businesses', value: businessWorth, icon: '🍰', color: '#d946ef' },
                { title: 'Properties', value: realEstateWorth, icon: '🏡', color: '#a855f7' },
                { title: 'Logistics Fleet', value: fleetWorth, icon: '🐾', color: '#8b5cf6' }
            ];

            gridItems.forEach((item, index) => {
                const col = index % 2;
                const row = Math.floor(index / 2);
                const x = 330 + col * 225;
                const y = 140 + row * 90;
                const w = 205;
                const h = 75;

                // Card base
                drawRoundCard(ctx, x, y, w, h, 10, 'rgba(255, 255, 255, 0.6)', 'rgba(244, 114, 182, 0.4)', 2);

                // Accent colored border on left edge
                ctx.fillStyle = item.color;
                ctx.beginPath();
                ctx.roundRect(x, y, 4, h, 4);
                ctx.fill();

                // Title
                ctx.fillStyle = '#9d174d';
                ctx.font = 'bold 11px "Segoe UI", "Segoe UI Emoji", sans-serif';
                ctx.fillText(item.title.toUpperCase(), x + 16, y + 25);

                // Value Text
                ctx.fillStyle = '#831843';
                ctx.font = 'bold 16px "Segoe UI", "Segoe UI Emoji", sans-serif';
                ctx.fillText(`${item.icon} ${item.value.toLocaleString()}`, x + 16, y + 54);
            });

            // 5. Bottom Info Card (Logistics & Property Report)
            drawRoundCard(ctx, 330, 420, 430, 155, 12, 'rgba(255, 255, 255, 0.6)', 'rgba(244, 114, 182, 0.4)', 2);

            ctx.fillStyle = '#db2777'; 
            ctx.font = 'bold 12px "Segoe UI", "Segoe UI Emoji", sans-serif';
            ctx.fillText('💌 REGISTRY LEDGER REPORT', 350, 448);

            ctx.fillStyle = '#9d174d';
            ctx.font = '12px "Segoe UI", "Segoe UI Emoji", sans-serif';
            ctx.fillText(`• Active Fleet Vehicle:`, 350, 480);
            ctx.fillStyle = '#831843';
            ctx.fillText(delivery.vehicle || 'None', 520, 480);

            ctx.fillStyle = '#9d174d';
            ctx.fillText(`• Hired Personnel:`, 350, 510);
            ctx.fillStyle = '#831843';
            ctx.fillText(`${delivery.workers || 0} active couriers`, 520, 510);

            ctx.fillStyle = '#9d174d';
            ctx.fillText(`• Owned Property:`, 350, 540);
            const activeProps = properties.map(p => p.propertyType).join(', ') || 'None';
            const propText = activeProps.length > 25 ? activeProps.substring(0, 25) + '...' : activeProps;
            ctx.fillStyle = '#831843';
            ctx.fillText(propText, 520, 540);

            const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'financial-profile.png' });

            const profileEmbed = new EmbedBuilder()
                .setColor('#fbcfe8') // Soft pink embed color
                .setTitle(`🌸 ${interaction.user.username}'s Cherry ID Card`)
                .setDescription(`Official Cherry Profile for **${interaction.user.username}**`)
                .setImage('attachment://financial-profile.png')
                .setTimestamp();

            await interaction.editReply({ embeds: [profileEmbed], files: [attachment] });

        } catch (error) {
            console.error("Error drawing financial profile card: ", error);
            await interaction.editReply("Something went wrong while rendering your premium financial profile statement.");
        }
    },
};