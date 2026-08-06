const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas } = require('@napi-rs/canvas');
const db = require('../database.js');

const BUSINESS_CATALOG = {
    coffee: {
        name: 'Coffee Shop',
        emoji: '☕',
        cost: 15000,
        hourlyRevenue: 20,
        desc: 'Serve premium espresso blends. Stable, easy starter business.'
    },
    restaurant: {
        name: 'Restaurant',
        emoji: '🍔',
        cost: 50000,
        hourlyRevenue: 80,
        desc: 'High demand culinary dining. Moderate passive income.'
    },
    bank: {
        name: 'Bank',
        emoji: '🏛️',
        cost: 150000,
        hourlyRevenue: 300,
        desc: 'Finance other players. High income, requires substantial investment.'
    },
    factory: {
        name: 'Factory',
        emoji: '🏭',
        cost: 350000,
        hourlyRevenue: 900,
        desc: 'Automated manufacturing lines. Extremely high revenue.'
    },
    hospital: {
        name: 'Hospital',
        emoji: '🏥',
        cost: 800000,
        hourlyRevenue: 2500,
        desc: 'Royal healthcare complex. The peak of passive business empires.'
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('business')
        .setDescription('💼 Run passive commercial business operations')
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('📋 List all business catalogs and your owned properties'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('buy')
                .setDescription('🛒 Purchase a new business corporation')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Select the business to purchase')
                        .setRequired(true)
                        .addChoices(
                            { name: '☕ Coffee Shop (🪙 15,000)', value: 'coffee' },
                            { name: '🍔 Restaurant (🪙 50,000)', value: 'restaurant' },
                            { name: '🏛️ Bank (🪙 150,000)', value: 'bank' },
                            { name: '🏭 Factory (🪙 350,000)', value: 'factory' },
                            { name: '🏥 Hospital (🪙 800,000)', value: 'hospital' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('upgrade')
                .setDescription('📈 Upgrade an owned business to increase passive payouts')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Select the business to upgrade')
                        .setRequired(true)
                        .addChoices(
                            { name: '☕ Coffee Shop', value: 'coffee' },
                            { name: '🍔 Restaurant', value: 'restaurant' },
                            { name: '🏛️ Bank', value: 'bank' },
                            { name: '🏭 Factory', value: 'factory' },
                            { name: '🏥 Hospital', value: 'hospital' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('collect')
                .setDescription('💰 Collect accumulated passive revenues from your businesses'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('profile')
                .setDescription('📜 View the visual certificate of ownership for a business')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Select the business to view')
                        .setRequired(true)
                        .addChoices(
                            { name: '☕ Coffee Shop', value: 'coffee' },
                            { name: '🍔 Restaurant', value: 'restaurant' },
                            { name: '🏛️ Bank', value: 'bank' },
                            { name: '🏭 Factory', value: 'factory' },
                            { name: '🏥 Hospital', value: 'hospital' }
                        ))),

    async execute(interaction) {
        await interaction.deferReply();

        const userId = interaction.user.id;
        const guildId = interaction.guild ? (interaction.guild ? interaction.guild.id : 'GLOBAL') : 'GLOBAL';
        const subcommand = interaction.options.getSubcommand();

        const char = db.getCharacter(userId);
        if (!char || !char.char_name) {
            return interaction.editReply({ content: '⚠️ **You must create an RPG character first!**\nUse **`/character create`** to get started.' });
        }

        const ownedBusinesses = db.getUserBusinesses(userId);

        // --- SUBCOMMAND: LIST ---
        if (subcommand === 'list') {
            const listEmbed = new EmbedBuilder()
                .setColor('#c084fc')
                .setTitle('💼 COMMERCIAL BUSINESS SYNDICATE')
                .setDescription('Acquire corporations and upgrade them to collect passive cherry revenues every hour.')
                .setTimestamp();

            Object.keys(BUSINESS_CATALOG).forEach(key => {
                const b = BUSINESS_CATALOG[key];
                const owned = ownedBusinesses.find(ob => ob.businessType === key);

                if (owned) {
                    const upgradeCost = Math.floor(b.cost * 0.6 * owned.level);
                    const currentHourly = b.hourlyRevenue * owned.level;
                    const hoursElapsed = (Date.now() - owned.lastCollected) / 1000 / 60 / 60;
                    const accrued = Math.floor(hoursElapsed * currentHourly);

                    listEmbed.addFields({
                        name: `✅ ${b.emoji} ${b.name} (Lvl ${owned.level})`,
                        value: `• **Current Revenue:** 🍒 **${currentHourly}**/hr\n• **Accrued Cash:** 🍒 **${accrued}**\n• **Upgrade Cost:** 🍒 **${upgradeCost.toLocaleString()}** (/business upgrade)`
                    });
                } else {
                    listEmbed.addFields({
                        name: `❌ ${b.emoji} ${b.name} (Unowned)`,
                        value: `• **Purchase Cost:** 🍒 **${b.cost.toLocaleString()}**\n• **Starting Revenue:** 🍒 **${b.hourlyRevenue}**/hr\n• *${b.desc}*`
                    });
                }
            });

            await interaction.editReply({ embeds: [listEmbed] });
        }

        // --- SUBCOMMAND: BUY ---
        else if (subcommand === 'buy') {
            const type = interaction.options.getString('type');
            const b = BUSINESS_CATALOG[type];

            const alreadyOwned = ownedBusinesses.some(ob => ob.businessType === type);
            if (alreadyOwned) {
                return interaction.editReply({ content: `❌ You already own a **${b.name}**! Upgrade it instead via \`/business upgrade\`.` });
            }

            const wallet = db.getBalance(userId, guildId);
            if (wallet < b.cost) {
                return interaction.editReply({ 
                    content: `❌ **Insufficient funds!** Purchasing a **${b.name}** costs 🍒 **${b.cost.toLocaleString()}** cherries. (You have: 🍒 **${wallet.toLocaleString()}**)` 
                });
            }

            db.deductCoins(userId, guildId, b.cost);
            db.buyBusiness(userId, type, Date.now());

            const buyEmbed = new EmbedBuilder()
                .setColor('#fbcfe8')
                .setTitle('💼 BUSINESS ACQUIRED')
                .setDescription(
                    `🎉 **Congratulations!** You purchased a **${b.name}**!\n` +
                    `It has begun generating 🍒 **${b.hourlyRevenue}** cherries/hour in passive revenue.\n\n` +
                    `• **Purchase Price:** 🍒 **${b.cost.toLocaleString()} cherries**\n` +
                    `• **Wallet Balance:** 🍒 **${db.getBalance(userId, guildId).toLocaleString()} cherries**`
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [buyEmbed] });
        }

        // --- SUBCOMMAND: UPGRADE ---
        else if (subcommand === 'upgrade') {
            const type = interaction.options.getString('type');
            const b = BUSINESS_CATALOG[type];

            const owned = ownedBusinesses.find(ob => ob.businessType === type);
            if (!owned) {
                return interaction.editReply({ content: `❌ You do not own a **${b.name}**! Purchase it first via \`/business buy\`.` });
            }

            const upgradeCost = Math.floor(b.cost * 0.6 * owned.level);
            const wallet = db.getBalance(userId, guildId);

            if (wallet < upgradeCost) {
                return interaction.editReply({ 
                    content: `❌ **Insufficient funds!** Upgrading your **${b.name}** costs 🍒 **${upgradeCost.toLocaleString()}** cherries. (You have: 🍒 **${wallet.toLocaleString()}**)` 
                });
            }

            db.deductCoins(userId, guildId, upgradeCost);
            db.upgradeBusiness(userId, type);

            const nextLevel = owned.level + 1;
            const newHourly = b.hourlyRevenue * nextLevel;

            const upgradeEmbed = new EmbedBuilder()
                .setColor('#F1C40F')
                .setTitle('📈 BUSINESS UPGRADED')
                .setDescription(
                    `🚀 You upgraded your **${b.name}** to **Level ${nextLevel}**!\n` +
                    `Passive revenue increased to 🍒 **${newHourly}** cherries/hour!\n\n` +
                    `• **Upgrade Cost:** 🍒 **${upgradeCost.toLocaleString()} cherries**\n` +
                    `• **Wallet Balance:** 🍒 **${db.getBalance(userId, guildId).toLocaleString()} cherries**`
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [upgradeEmbed] });
        }

        // --- SUBCOMMAND: COLLECT ---
        else if (subcommand === 'collect') {
            if (ownedBusinesses.length === 0) {
                return interaction.editReply({ content: '❌ You do not own any businesses to collect revenue from!' });
            }

            let totalAccrued = 0;
            const collectDetails = [];

            ownedBusinesses.forEach(ob => {
                const b = BUSINESS_CATALOG[ob.businessType];
                const currentHourly = b.hourlyRevenue * ob.level;
                const hoursElapsed = (Date.now() - ob.lastCollected) / 1000 / 60 / 60;
                const accrued = Math.floor(hoursElapsed * currentHourly);

                if (accrued > 0) {
                    totalAccrued += accrued;
                    db.collectBusinessRevenue(userId, ob.businessType, accrued, Date.now(), guildId);
                    collectDetails.push(`• ${b.emoji} **${b.name}** (Lvl ${ob.level}): Collected 🍒 **${accrued.toLocaleString()}**`);
                }
            });

            if (totalAccrued <= 0) {
                return interaction.editReply({ content: '⏳ No revenue has accrued yet. Passive income accumulates hourly!' });
            }

            const collectEmbed = new EmbedBuilder()
                .setColor('#fbcfe8')
                .setTitle('🍒 BUSINESS REVENUE COLLECTED')
                .setDescription(
                    `Payouts successfully gathered from corporate coffers:\n\n` +
                    collectDetails.join('\n') + `\n\n` +
                    `🍒 **Total Credited:** 🍒 **+${totalAccrued.toLocaleString()} cherries**\n` +
                    `🏦 **Wallet Balance:** 🍒 **${db.getBalance(userId, guildId).toLocaleString()} cherries**`
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [collectEmbed] });
        }

        // --- SUBCOMMAND: PROFILE ---
        else if (subcommand === 'profile') {
            const type = interaction.options.getString('type');
            const b = BUSINESS_CATALOG[type];
            const owned = ownedBusinesses.find(ob => ob.businessType === type);

            if (!owned) {
                return interaction.editReply({
                    content: `❌ **You do not own a ${b.name} business!**\nPurchase it first using \`/business buy type:${type}\`.`
                });
            }

            try {
                // Calculate accrued profits
                const currentHourly = b.hourlyRevenue * owned.level;
                const hoursElapsed = (Date.now() - owned.lastCollected) / 1000 / 60 / 60;
                const accrued = Math.floor(hoursElapsed * currentHourly);

                // Setup Canvas
                const width = 800;
                const height = 450;
                const canvas = createCanvas(width, height);
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;

                // 1. Dark Slate Gradient Background
                const bgGrad = ctx.createRadialGradient(width/2, height/2, 50, width/2, height/2, width/2);
                bgGrad.addColorStop(0, '#fce7f3'); // slate-800
                bgGrad.addColorStop(1, '#fbcfe8'); // slate-950
                ctx.fillStyle = bgGrad;
                ctx.fillRect(0, 0, width, height);

                // 2. Certificate Frame
                const frameColor = '#f472b6'; // Gold
                ctx.save();
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'; // slate-900 inner box
                ctx.strokeStyle = frameColor;
                ctx.lineWidth = 4;
                ctx.shadowColor = 'rgba(251, 191, 36, 0.4)';
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.roundRect(40, 30, 720, 390, 16);
                ctx.fill();
                ctx.stroke();
                ctx.restore();

                // Decorative double border
                ctx.strokeStyle = '#334155';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(48, 38, 704, 374, 12);
                ctx.stroke();

                // 3. Left Graphic Frame (The Emblem)
                ctx.save();
                ctx.fillStyle = '#fce7f3'; // slate-800 background
                ctx.strokeStyle = '#475569';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(70, 90, 200, 270, 12);
                ctx.fill();
                ctx.stroke();

                // Large Emoji
                ctx.font = '100px "Segoe UI Emoji", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(b.emoji, 170, 220);
                ctx.restore();

                // 4. Right Side Text Details
                ctx.fillStyle = '#fef08a'; // light gold
                ctx.font = 'bold 12px "Segoe UI Emoji", sans-serif';
                ctx.fillText('OFFICIAL COMMERCIAL LICENSE', 300, 95);

                ctx.fillStyle = '#831843';
                ctx.font = 'bold 28px "Segoe UI Emoji", sans-serif';
                ctx.fillText(b.name, 300, 135);

                ctx.fillStyle = '#9d174d';
                ctx.font = 'bold 13px sans-serif';
                ctx.fillText(`Registry Tier: Level ${owned.level} Corporation`, 300, 162);

                // Divider line
                ctx.strokeStyle = 'rgba(244, 114, 182, 0.3)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(300, 185);
                ctx.lineTo(710, 185);
                ctx.stroke();

                // Details Grid
                ctx.fillStyle = '#9d174d';
                ctx.font = '12px sans-serif';
                ctx.fillText('Corporate Holder:', 300, 215);
                ctx.fillStyle = '#831843';
                ctx.font = 'bold 13px sans-serif';
                ctx.fillText(`${char.char_name}`, 440, 215);

                ctx.fillStyle = '#9d174d';
                ctx.font = '12px sans-serif';
                ctx.fillText('Hourly Earnings Speed:', 300, 255);
                ctx.fillStyle = '#db2777'; 
                ctx.font = 'bold 14px "Segoe UI Emoji", sans-serif';
                ctx.fillText(`🍒 ${currentHourly.toLocaleString()} cherries/hour`, 440, 255);

                ctx.fillStyle = '#9d174d';
                ctx.font = '12px sans-serif';
                ctx.fillText('Accrued Treasury:', 300, 295);
                ctx.fillStyle = '#f472b6'; 
                ctx.font = 'bold 14px "Segoe UI Emoji", sans-serif';
                ctx.fillText(`🍒 ${accrued.toLocaleString()} cherries`, 440, 295);

                ctx.fillStyle = '#9d174d';
                ctx.font = '12px sans-serif';
                ctx.fillText('Upgrade Payout:', 300, 335);
                ctx.fillStyle = '#c084fc'; 
                ctx.font = 'bold 13px "Segoe UI Emoji", sans-serif';
                ctx.fillText(`Lvl ${owned.level + 1} ➡️ 🍒 ${(b.hourlyRevenue * (owned.level + 1)).toLocaleString()}/hr`, 440, 335);

                // 5. Official Golden Seal (bottom right)
                const sx = 660;
                const sy = 330;
                const sRadius = 45;
                ctx.save();
                const sealGrad = ctx.createLinearGradient(sx - sRadius, sy - sRadius, sx + sRadius, sy + sRadius);
                sealGrad.addColorStop(0, '#fef08a');
                sealGrad.addColorStop(0.5, '#f472b6');
                sealGrad.addColorStop(1, '#854d0e');
                ctx.fillStyle = sealGrad;
                
                ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
                ctx.shadowBlur = 8;
                ctx.shadowOffsetY = 4;

                ctx.beginPath();
                ctx.arc(sx, sy, sRadius, 0, Math.PI * 2);
                ctx.fill();

                // Seal border
                ctx.strokeStyle = '#831843';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(sx, sy, sRadius - 5, 0, Math.PI * 2);
                ctx.stroke();

                // Seal Star
                ctx.fillStyle = '#713f12';
                ctx.font = 'bold 24px "Segoe UI Emoji", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('⭐️', sx, sy);
                ctx.restore();

                const buffer = canvas.toBuffer('image/png');
                const attachment = new AttachmentBuilder(buffer, { name: 'business-license.png' });

                const profileEmbed = new EmbedBuilder()
                    .setColor('#f472b6')
                    .setTitle(`🏢 Corporate Registry: ${b.name}`)
                    .setDescription(`Official commercial operating deed issued to **${char.char_name}** for passive server earnings.`)
                    .setImage('attachment://business-license.png')
                    .setTimestamp();

                await interaction.editReply({ embeds: [profileEmbed], files: [attachment] });

            } catch (err) {
                console.error('Error drawing business license:', err);
                await interaction.editReply('❌ There was an error while generating your visual Business License.');
            }
        }
    }
};
