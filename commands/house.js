const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas } = require('@napi-rs/canvas');
const db = require('../database.js');

const HOUSE_TYPES = {
    Shack:   { cost: 2000,   emoji: '🛖', color: '#f472b6', desc: 'A simple rustic wooden shelter.' },
    Cottage: { cost: 8000,   emoji: '🏡', color: '#fb7185', desc: 'A cozy house with a small garden plot.' },
    Villa:   { cost: 25000,  emoji: '🏛️', color: '#c084fc', desc: 'A spacious estate featuring grand pillars.' },
    Mansion: { cost: 100000, emoji: '🏰', color: '#db2777', desc: 'A legendary castle overlooking the server.' }
};

async function drawHouseCard(houseType, upgradeLevel, storageSummary) {
    const width = 600;
    const height = 300;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const config = HOUSE_TYPES[houseType] || { emoji: '⛺', color: '#999999', desc: 'None' };

    // Deep theme background
    ctx.fillStyle = '#fce7f3';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = config.color;
    ctx.lineWidth = 6;
    ctx.strokeRect(5, 5, width - 10, height - 10);

    ctx.strokeStyle = '#fbcfe8';
    ctx.lineWidth = 2;
    ctx.strokeRect(12, 12, width - 24, height - 24);

    // Left Panel (House graphic)
    ctx.fillStyle = '#fdf4ff';
    ctx.beginPath();
    ctx.roundRect(30, 30, 200, 240, 12);
    ctx.fill();

    ctx.font = '100px "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.emoji, 130, 150);

    // Right details
    ctx.fillStyle = config.color;
    ctx.font = 'bold 24px "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${houseType} Estate`, 260, 65);

    ctx.fillStyle = '#db2777';
    ctx.font = 'italic 13px "Segoe UI Emoji", sans-serif';
    ctx.fillText(config.desc, 260, 90);

    ctx.fillStyle = '#831843';
    ctx.font = 'bold 15px "Segoe UI Emoji", sans-serif';
    ctx.fillText(`Upgrade Level: +${upgradeLevel}`, 260, 130);

    // Vault Storage Section
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.roundRect(260, 150, 300, 110, 8);
    ctx.fill();

    ctx.fillStyle = '#9d174d';
    ctx.font = 'bold 13px "Segoe UI Emoji", sans-serif';
    ctx.fillText('🔒 Vault Storage:', 275, 175);

    ctx.fillStyle = '#831843';
    ctx.font = '12px "Segoe UI Emoji", sans-serif';
    
    // Draw lines of storage summary
    const lines = storageSummary.split('\n');
    lines.forEach((line, idx) => {
        if (idx < 4) {
            ctx.fillText(line, 275, 198 + (idx * 16));
        }
    });

    return canvas.toBuffer('image/png');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('house')
        .setDescription('🏠 Manage your personal estate and storage vaults')
        .addSubcommand(subcommand =>
            subcommand
                .setName('buy')
                .setDescription('🏠 Purchase a new estate')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('The type of house to buy')
                        .setRequired(true)
                        .addChoices(
                            { name: '🛖 Shack (🍒 2,000 cherries)', value: 'Shack' },
                            { name: '🏡 Cottage (🍒 8,000 cherries)', value: 'Cottage' },
                            { name: '🏛️ Villa (🍒 25,000 cherries)', value: 'Villa' },
                            { name: '🏰 Mansion (🍒 100,000 cherries)', value: 'Mansion' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('profile')
                .setDescription('📋 View your housing profile and vaults'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('storage')
                .setDescription('🔒 Deposit or withdraw items from your house storage vault')
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('Choose deposit or withdraw')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Deposit', value: 'deposit' },
                            { name: 'Withdraw', value: 'withdraw' }
                        ))
                .addStringOption(option =>
                    option.setName('item')
                        .setDescription('The item name (e.g. Wood, Raw Meat)')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('quantity')
                        .setDescription('The quantity to transfer')
                        .setRequired(true))),

    async execute(interaction) {
        await interaction.deferReply();

        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        const subcommand = interaction.options.getSubcommand();

        const char = db.getCharacter(userId);
        if (!char || !char.char_name) {
            return interaction.editReply({ content: '⚠️ **You must create an RPG character first!**\nUse **`/character create`** to get started.' });
        }

        const house = db.getHouse(userId);

        // --- SUBCOMMAND: BUY ---
        if (subcommand === 'buy') {
            const houseType = interaction.options.getString('type');
            const config = HOUSE_TYPES[houseType];
            const currentCoins = db.getBalance(userId, guildId);

            if (currentCoins < config.cost) {
                return interaction.editReply({ content: `❌ You do not have enough cherries! A **${houseType}** costs **🍒 ${config.cost.toLocaleString()}** cherries.` });
            }

            db.deductCoins(userId, guildId, config.cost);
            db.buyHouse(userId, houseType);

            const buyEmbed = new EmbedBuilder()
                .setColor('#f472b6')
                .setTitle(`🏡 ESTATE PURCHASED! ${config.emoji}`)
                .setDescription(
                    `Congratulations! You have purchased a **${houseType}**!\n` +
                    `You now have access to a secure storage vault. Use **\`/house storage\`** to store raw items.`
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [buyEmbed] });
        }

        // --- SUBCOMMAND: PROFILE ---
        else if (subcommand === 'profile') {
            if (!house || house.houseType === 'None') {
                return interaction.editReply({ content: '⚠️ You do not own a house! Buy one using **`/house buy`**.' });
            }

            let storageMap = {};
            try {
                storageMap = JSON.parse(house.storage || '{}');
            } catch (e) {}

            const keys = Object.keys(storageMap);
            const storageText = keys.length === 0 
                ? 'No items stored.' 
                : keys.map(k => `• ${k} (x${storageMap[k]})`).join('\n');

            try {
                const buffer = await drawHouseCard(house.houseType, house.upgradeLevel, storageText);
                const attachment = new AttachmentBuilder(buffer, { name: 'house-profile.png' });

                const profileEmbed = new EmbedBuilder()
                    .setColor(HOUSE_TYPES[house.houseType].color)
                    .setTitle(`🏡 Your RPG Estate Profile`)
                    .setImage('attachment://house-profile.png')
                    .setTimestamp();

                await interaction.editReply({ embeds: [profileEmbed], files: [attachment] });
            } catch (err) {
                console.error(err);
                await interaction.editReply({ content: `🏡 House: **${house.houseType}** | Storage: ${storageText}` });
            }
        }

        // --- SUBCOMMAND: STORAGE ---
        else if (subcommand === 'storage') {
            if (!house || house.houseType === 'None') {
                return interaction.editReply({ content: '⚠️ You do not own a house! Buy one using **`/house buy`** to unlock storage.' });
            }

            const action = interaction.options.getString('action');
            const itemNameInput = interaction.options.getString('item');
            const qty = interaction.options.getInteger('quantity');

            if (qty <= 0) {
                return interaction.editReply({ content: '❌ Quantity must be greater than 0!' });
            }

            // Find item in inventory/storage case-insensitively
            const inventory = db.getInventory(userId);
            const invItem = inventory.find(i => i.itemName.toLowerCase() === itemNameInput.toLowerCase());
            const correctName = invItem ? invItem.itemName : itemNameInput;

            let storageMap = {};
            try {
                storageMap = JSON.parse(house.storage || '{}');
            } catch (e) {}

            // Handle Deposit
            if (action === 'deposit') {
                const heldQty = db.getItemQuantity(userId, correctName);
                if (heldQty < qty) {
                    return interaction.editReply({ content: `❌ You do not have enough **${correctName}** in your inventory! (Held: ${heldQty})` });
                }

                db.removeItem(userId, correctName, qty);
                storageMap[correctName] = (storageMap[correctName] || 0) + qty;
                db.updateHouseStorage(userId, JSON.stringify(storageMap));

                const depEmbed = new EmbedBuilder()
                    .setColor('#c084fc')
                    .setTitle('🔒 ITEMS DEPOSITED')
                    .setDescription(`Deposited **${qty}x ${correctName}** into your house storage vault.`)
                    .setTimestamp();

                await interaction.editReply({ embeds: [depEmbed] });
            } 
            
            // Handle Withdraw
            else if (action === 'withdraw') {
                const storedQty = storageMap[correctName] || 0;
                if (storedQty < qty) {
                    return interaction.editReply({ content: `❌ You do not have enough **${correctName}** in your storage vault! (Stored: ${storedQty})` });
                }

                storageMap[correctName] -= qty;
                if (storageMap[correctName] <= 0) {
                    delete storageMap[correctName];
                }
                db.updateHouseStorage(userId, JSON.stringify(storageMap));
                db.addItem(userId, correctName, qty);

                const witEmbed = new EmbedBuilder()
                    .setColor('#f43f5e')
                    .setTitle('🔓 ITEMS WITHDRAWN')
                    .setDescription(`Withdrew **${qty}x ${correctName}** from your house storage vault to your inventory.`)
                    .setTimestamp();

                await interaction.editReply({ embeds: [witEmbed] });
            }
        }
    }
};
