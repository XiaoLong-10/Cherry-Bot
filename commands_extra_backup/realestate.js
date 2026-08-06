const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas } = require('@napi-rs/canvas');
const db = require('../database.js');

const REAL_ESTATE_CATALOG = {
    studio: {
        name: 'Studio Apartment',
        emoji: '🏢',
        cost: 20000,
        baseRent: 40,
        desc: 'Compact residential apartment in the city center.'
    },
    villa: {
        name: 'Suburban Villa',
        emoji: '🏡',
        cost: 75000,
        baseRent: 160,
        desc: 'Beautiful family villa with green gardens.'
    },
    office: {
        name: 'Office Building',
        emoji: '🏢',
        cost: 220000,
        baseRent: 550,
        desc: 'Commercial high-rise rented by top startups.'
    },
    penthouse: {
        name: 'Penthouse Suite',
        emoji: '💎',
        cost: 500000,
        baseRent: 1500,
        desc: 'High luxury suite at the peak of the skyline.'
    }
};

const NPC_TENANTS = [
    'Farmer Aria', 'Scribe Barnaby', 'Chef Thorin', 'Knight Alistair', 
    'Merchant Thorin', 'Scholar Vaelen', 'Miner Barnaby', 'Healer Aria'
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('realestate')
        .setDescription('🏡 Real estate property investment and rentals')
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('📋 View property investment market catalog and owned properties'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('buy')
                .setDescription('🛒 Purchase an investment rental property')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Select the property style to purchase')
                        .setRequired(true)
                        .addChoices(
                            { name: '🏢 Studio Apartment (🍒 20,000)', value: 'studio' },
                            { name: '🏡 Suburban Villa (🍒 75,000)', value: 'villa' },
                            { name: '🏢 Office Building (🍒 220,000)', value: 'office' },
                            { name: '💎 Penthouse Suite (🍒 500,000)', value: 'penthouse' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('rentout')
                .setDescription('📝 Sign a rental lease agreement with a tenant')
                .addIntegerOption(option =>
                    option.setName('property_id')
                        .setDescription('The ID of your vacant property')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('collect')
                .setDescription('💰 Collect rental income from your properties'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('deed')
                .setDescription('📜 View the visual Deed of Ownership for a specific property')
                .addIntegerOption(option =>
                    option.setName('property_id')
                        .setDescription('The ID of your owned property')
                        .setRequired(true))),

    async execute(interaction) {
        await interaction.deferReply();

        const userId = interaction.user.id;
        const guildId = interaction.guild ? (interaction.guild ? interaction.guild.id : 'GLOBAL') : 'GLOBAL';
        const subcommand = interaction.options.getSubcommand();

        const char = db.getCharacter(userId);
        if (!char || !char.char_name) {
            return interaction.editReply({ content: '⚠️ **You must create an RPG character first!**\nUse **`/character create`** to get started.' });
        }

        const ownedProperties = db.getUserProperties(userId);

        // --- SUBCOMMAND: LIST ---
        if (subcommand === 'list') {
            const marketEmbed = new EmbedBuilder()
                .setColor('#fbcfe8')
                .setTitle('🏢 ROYAL REAL ESTATE AGENCY')
                .setDescription('Buy premium properties, rent them out to NPC tenants, and harvest passive rent flows.')
                .setTimestamp();

            // Properties for sale
            let catalogText = '';
            Object.keys(REAL_ESTATE_CATALOG).forEach(key => {
                const p = REAL_ESTATE_CATALOG[key];
                catalogText += `${p.emoji} **${p.name}**\n• Cost: 🍒 **${p.cost.toLocaleString()}** | Base Rent: 🍒 **${p.baseRent}**/hr\n*${p.desc}*\n\n`;
            });
            marketEmbed.addFields({ name: '🏠 PROPERTIES FOR SALE', value: catalogText });

            // Owned Properties
            if (ownedProperties.length > 0) {
                let ownedText = '';
                ownedProperties.forEach(p => {
                    const config = REAL_ESTATE_CATALOG[p.propertyType];
                    if (p.status === 'Rented') {
                        const hoursElapsed = (Date.now() - p.lastCollected) / 1000 / 60 / 60;
                        const accrued = Math.floor(hoursElapsed * p.rentRate);
                        ownedText += `• **[ID: ${p.id}]** ${config.emoji} ${config.name} (Rented to **${p.tenantName}**)\n  Rent Rate: 🍒 **${p.rentRate}**/hr | Accrued: 🍒 **${accrued}**\n`;
                    } else {
                        ownedText += `• **[ID: ${p.id}]** ${config.emoji} ${config.name} (🔴 **Vacant**)\n  Run **\`/realestate rentout property_id: ${p.id}\`** to find a tenant!\n`;
                    }
                });
                marketEmbed.addFields({ name: '🔑 YOUR OWNED PORTFOLIO', value: ownedText });
            } else {
                marketEmbed.addFields({ name: '🔑 YOUR OWNED PORTFOLIO', value: '*You do not own any real estate properties yet.*' });
            }

            await interaction.editReply({ embeds: [marketEmbed] });
        }

        // --- SUBCOMMAND: BUY ---
        else if (subcommand === 'buy') {
            const type = interaction.options.getString('type');
            const p = REAL_ESTATE_CATALOG[type];

            const wallet = db.getBalance(userId, guildId);
            if (wallet < p.cost) {
                return interaction.editReply({ 
                    content: `❌ **Insufficient funds!** Purchasing this property costs 🍒 **${p.cost.toLocaleString()}** cherries. (You have: 🍒 **${wallet.toLocaleString()}**)` 
                });
            }

            db.deductCoins(userId, guildId, p.cost);
            db.buyProperty(userId, type, Date.now());

            const buyEmbed = new EmbedBuilder()
                .setColor('#fbcfe8')
                .setTitle('🏠 PROPERTY PURCHASED')
                .setDescription(
                    `🎉 You successfully acquired a **${p.name}**!\n` +
                    `It is currently **Vacant**. Run **\`/realestate list\`** to find its ID, then list it for rent!\n\n` +
                    `• **Purchase Price:** 🍒 **${p.cost.toLocaleString()} cherries**\n` +
                    `• **Wallet Balance:** 🍒 **${db.getBalance(userId, guildId).toLocaleString()} cherries**`
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [buyEmbed] });
        }

        // --- SUBCOMMAND: RENTOUT ---
        else if (subcommand === 'rentout') {
            const propId = interaction.options.getInteger('property_id');
            const property = ownedProperties.find(p => p.id === propId);

            if (!property) {
                return interaction.editReply({ content: `❌ You do not own any property matching ID **${propId}**!` });
            }

            if (property.status === 'Rented') {
                return interaction.editReply({ content: `❌ Property ID **${propId}** is already occupied by tenant **${property.tenantName}**!` });
            }

            // Assign NPC Tenant and rent rate
            const tenant = NPC_TENANTS[Math.floor(Math.random() * NPC_TENANTS.length)];
            const config = REAL_ESTATE_CATALOG[property.propertyType];
            
            // Random modifier between 90% and 110% of base rate
            const rateMod = (Math.random() * 0.2) + 0.9;
            const finalRate = Math.floor(config.baseRent * rateMod);

            db.rentOutProperty(propId, tenant, finalRate, Date.now());

            const rentEmbed = new EmbedBuilder()
                .setColor('#c084fc')
                .setTitle('📝 LEASE AGREEMENT SIGNED')
                .setDescription(
                    `🤝 You signed a rent contract for Property ID **${propId}**!\n\n` +
                    `👤 **Tenant:** ${tenant}\n` +
                    `🏢 **Property Type:** ${config.name}\n` +
                    `💰 **Rent Rate:** 🍒 **${finalRate}** cherries/hour\n\n` +
                    `*Rent accumulates passively over time. Run \`/realestate collect\` to transfer rent payments to your wallet.*`
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [rentEmbed] });
        }

        // --- SUBCOMMAND: COLLECT ---
        else if (subcommand === 'collect') {
            const rentedProps = ownedProperties.filter(p => p.status === 'Rented');
            if (rentedProps.length === 0) {
                return interaction.editReply({ content: '❌ You do not have any rented properties collecting income!' });
            }

            let totalCollected = 0;
            const details = [];

            rentedProps.forEach(p => {
                const config = REAL_ESTATE_CATALOG[p.propertyType];
                const hours = (Date.now() - p.lastCollected) / 1000 / 60 / 60;
                const rent = Math.floor(hours * p.rentRate);

                if (rent > 0) {
                    totalCollected += rent;
                    db.collectPropertyRent(p.id, userId, rent, Date.now(), guildId);
                    details.push(`• **[ID: ${p.id}]** ${config.name} (Tenant: ${p.tenantName}): Collected 🍒 **${rent.toLocaleString()}**`);
                }
            });

            if (totalCollected <= 0) {
                return interaction.editReply({ content: '⏳ Rent payouts accrue hourly. Wait a bit longer to collect rent!' });
            }

            const collectEmbed = new EmbedBuilder()
                .setColor('#fbcfe8')
                .setTitle('💰 RENTAL CASH COLLECTED')
                .setDescription(
                    `Rent checks gathered from tenants:\n\n` +
                    details.join('\n') + `\n\n` +
                    `🍒 **Total Collected:** 🍒 **+${totalCollected.toLocaleString()} cherries**\n` +
                    `🏦 **Wallet Balance:** 🍒 **${db.getBalance(userId, guildId).toLocaleString()} cherries**`
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [collectEmbed] });
        }

        // --- SUBCOMMAND: DEED ---
        else if (subcommand === 'deed') {
            const propId = interaction.options.getInteger('property_id');
            const prop = ownedProperties.find(p => p.id === propId);

            if (!prop) {
                return interaction.editReply({
                    content: `❌ **You do not own any property with ID ${propId}!**\nCheck your active property list using \`/realestate list\`.`
                });
            }

            const config = REAL_ESTATE_CATALOG[prop.propertyType];

            try {
                // Calculate accrued rent
                let accrued = 0;
                if (prop.status === 'Rented') {
                    const hours = (Date.now() - prop.lastCollected) / 1000 / 60 / 60;
                    accrued = Math.floor(hours * prop.rentRate);
                }

                // Setup Canvas
                const width = 800;
                const height = 450;
                const canvas = createCanvas(width, height);
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;

                // 1. Parchment-style Background Radial Gradient
                const bgGrad = ctx.createRadialGradient(width/2, height/2, 50, width/2, height/2, width/2);
                bgGrad.addColorStop(0, '#fefbf3'); // Cream white
                bgGrad.addColorStop(1, '#f3e8c9'); // Warm parchment tan
                ctx.fillStyle = bgGrad;
                ctx.fillRect(0, 0, width, height);

                // 2. Vintage Double Frame Border
                ctx.save();
                ctx.strokeStyle = '#5c3d2e'; // Dark sepia brown
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.roundRect(40, 30, 720, 390, 16);
                ctx.stroke();

                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(48, 38, 704, 374, 12);
                ctx.stroke();
                ctx.restore();

                // 3. Left Shield Emblem Box
                ctx.save();
                ctx.fillStyle = 'rgba(92, 61, 46, 0.05)';
                ctx.strokeStyle = '#5c3d2e';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(70, 90, 200, 270, 12);
                ctx.fill();
                ctx.stroke();

                // Large property emoji
                ctx.font = '100px "Segoe UI Emoji", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(config.emoji, 170, 220);
                ctx.restore();

                // 4. Deed Details
                ctx.fillStyle = '#5c3d2e'; // Dark sepia
                ctx.font = 'bold 12px "Segoe UI Emoji", sans-serif';
                ctx.fillText('LAND TITLE DEED & PROPERTY CONVEYANCE', 300, 95);

                ctx.font = 'bold 28px "Segoe UI Emoji", sans-serif';
                ctx.fillText(config.name, 300, 135);

                ctx.fillStyle = '#7c2d12'; // Red-orange detail
                ctx.font = 'bold 13px sans-serif';
                ctx.fillText(`Registry Deed ID: CR-RE-00${prop.id}`, 300, 162);

                // Sepia divider line
                ctx.strokeStyle = 'rgba(92, 61, 46, 0.2)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(300, 185);
                ctx.lineTo(710, 185);
                ctx.stroke();

                // Grid stats details
                ctx.fillStyle = '#7c2d12';
                ctx.font = 'bold 12px sans-serif';
                ctx.fillText('Registered Owner:', 300, 215);
                ctx.fillStyle = '#831843';
                ctx.font = 'bold 13px sans-serif';
                ctx.fillText(`${char.char_name}`, 440, 215);

                ctx.fillStyle = '#7c2d12';
                ctx.font = 'bold 12px sans-serif';
                ctx.fillText('Lease Status:', 300, 255);
                ctx.fillStyle = '#831843';
                ctx.font = 'bold 13px sans-serif';
                ctx.fillText(prop.status === 'Rented' ? 'Leased' : 'Vacant', 440, 255);

                ctx.fillStyle = '#7c2d12';
                ctx.font = 'bold 12px sans-serif';
                ctx.fillText('Active Tenant:', 300, 295);
                ctx.fillStyle = '#831843';
                ctx.font = 'bold 13px sans-serif';
                ctx.fillText(prop.status === 'Rented' ? `${prop.tenantName}` : 'None', 440, 295);

                ctx.fillStyle = '#7c2d12';
                ctx.font = 'bold 12px sans-serif';
                ctx.fillText('Rent Speed & Treasury:', 300, 335);
                ctx.fillStyle = '#0f766e'; // Teal
                ctx.font = 'bold 13px "Segoe UI Emoji", sans-serif';
                const rateText = prop.status === 'Rented' 
                    ? `🍒 ${prop.rentRate}/hr (Accrued: 🍒 ${accrued.toLocaleString()})`
                    : 'Unleased (0 cherries/hour)';
                ctx.fillText(rateText, 440, 335);

                // 5. Official Wax Seal (Red)
                const sx = 660;
                const sy = 330;
                const sRadius = 45;
                ctx.save();
                const sealGrad = ctx.createLinearGradient(sx - sRadius, sy - sRadius, sx + sRadius, sy + sRadius);
                sealGrad.addColorStop(0, '#f43f5e'); // red-400
                sealGrad.addColorStop(0.5, '#dc2626'); // red-600
                sealGrad.addColorStop(1, '#7f1d1d'); // red-900
                ctx.fillStyle = sealGrad;

                ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                ctx.shadowBlur = 8;
                ctx.shadowOffsetY = 4;

                ctx.beginPath();
                ctx.arc(sx, sy, sRadius, 0, Math.PI * 2);
                ctx.fill();

                // Seal inner star
                ctx.fillStyle = '#fef3c7'; // yellow-100
                ctx.font = 'bold 24px "Segoe UI Emoji", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('👑', sx, sy);
                ctx.restore();

                const buffer = canvas.toBuffer('image/png');
                const attachment = new AttachmentBuilder(buffer, { name: 'realestate-deed.png' });

                const deedEmbed = new EmbedBuilder()
                    .setColor('#9d174d')
                    .setTitle(`🏡 Real Estate Title Deed: ID ${prop.id}`)
                    .setDescription(`Official royal land deed issued to **${char.char_name}** confirming deed ownership.`)
                    .setImage('attachment://realestate-deed.png')
                    .setTimestamp();

                await interaction.editReply({ embeds: [deedEmbed], files: [attachment] });

            } catch (err) {
                console.error('Error drawing realestate deed:', err);
                await interaction.editReply('❌ There was an error while generating your visual Title Deed.');
            }
        }
    }
};
