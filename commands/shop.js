const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    AttachmentBuilder,
    MessageFlags 
} = require('discord.js');
const { createCanvas } = require('canvas');
const db = require('../database.js');

const SHOP_ITEMS = {
    // Potions
    health_potion: { id: 'health_potion', name: 'Health Potion', category: 'potions', emoji: '🧪', desc: 'Restores 50 HP. Use in battle or character status.', price: 500 },
    mana_potion: { id: 'mana_potion', name: 'Mana Potion', category: 'potions', emoji: '🌀', desc: 'Restores 40 Mana. Fuel for casting magic spells.', price: 400 },
    
    // Materials
    iron_ore: { id: 'iron_ore', name: 'Iron Ore', category: 'materials', emoji: '🪨', desc: 'Raw iron ore used at the blacksmith forge.', price: 150 },
    oak_wood: { id: 'oak_wood', name: 'Oak Wood', category: 'materials', emoji: '🪵', desc: 'Sturdy wood lumber used to forge weapons & shields.', price: 120 },
    seaweed: { id: 'seaweed', name: 'Seaweed', category: 'materials', emoji: '🌿', desc: 'Distillate weed used as a base for alchemy brews.', price: 80 },
    
    // Food & Seeds
    apple: { id: 'apple', name: 'Apple', category: 'food', emoji: '🍎', desc: 'A crunchy red fruit. Restores 10 HP upon use.', price: 50 },
    wheat_seed: { id: 'wheat_seed', name: 'Wheat Seed', category: 'food', emoji: '🌾', desc: 'Plant in your plot. Grows in 2m. Yields 3x Wheat.', price: 20 },
    apple_seed: { id: 'apple_seed', name: 'Apple Seed', category: 'food', emoji: '🍎', desc: 'Plant in your plot. Grows in 5m. Yields 2x Apples.', price: 40 },
    berry_seed: { id: 'berry_seed', name: 'Berry Seed', category: 'food', emoji: '🍓', desc: 'Plant in your plot. Grows in 10m. Yields 4x Berries.', price: 30 }
};

module.exports = {
    SHOP_ITEMS,
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('🛒 Purchase potions, raw materials, and food directly using cherries'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        // Verify Character
        const char = db.getCharacter(userId);
        if (!char || !char.char_name) {
            return interaction.reply({
                content: '⚠️ **You must create an RPG character first!**\nUse **`/character create`** to get started.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        await interaction.deferReply();

        let selectedCategory = null;
        let selectedItemId = null;

        const getCategoryItems = (cat) => {
            return Object.values(SHOP_ITEMS).filter(item => item.category === cat);
        };

        const generateShopPayload = () => {
            const balance = db.getBalance(userId, guildId);
            const canvas = createCanvas(800, 450);
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;

            // 1. Draw Cute Boutique Pastel background
            const counterGrad = ctx.createLinearGradient(0, 0, 0, 450);
            counterGrad.addColorStop(0, '#fbcfe8'); // Soft pink
            counterGrad.addColorStop(1, '#fdf4ff'); // Light fuchsia
            ctx.fillStyle = counterGrad;
            ctx.fillRect(0, 0, 800, 450);

            // Draw shop cute striped awning at the top
            ctx.fillStyle = '#f472b6'; // Pink 400 stripes
            ctx.fillRect(0, 0, 800, 50);
            ctx.fillStyle = '#831843'; // White stripes
            for (let i = 0; i < 800; i += 80) {
                ctx.fillRect(i, 0, 40, 50);
            }
            // Awning bottom fringe waves
            ctx.fillStyle = '#ec4899'; // Pink 500
            for (let i = 0; i < 800; i += 40) {
                ctx.beginPath();
                ctx.arc(i + 20, 50, 20, 0, Math.PI);
                ctx.fill();
            }

            // 2. Left Counter Shelf Panel (Items list)
            const shelfX = 40;
            const shelfY = 90;
            const shelfW = 440;
            const shelfH = 320;

            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.strokeStyle = 'rgba(244, 114, 182, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(shelfX, shelfY, shelfW, shelfH, 12);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            ctx.fillStyle = '#be185d';
            ctx.font = 'bold 14px "Segoe UI", "Segoe UI Emoji", sans-serif';
            ctx.fillText('🎀 BOUTIQUE CATALOG', shelfX + 20, shelfY + 30);

            // Divider line
            ctx.strokeStyle = 'rgba(219, 39, 119, 0.2)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(shelfX + 20, shelfY + 42);
            ctx.lineTo(shelfX + shelfW - 20, shelfY + 42);
            ctx.stroke();

            if (!selectedCategory) {
                ctx.fillStyle = '#9d174d';
                ctx.font = 'italic 13px "Segoe UI", "Segoe UI Emoji", sans-serif';
                ctx.fillText('Choose a category dropdown below to browse catalog...', shelfX + 20, shelfY + 160);
            } else {
                const catItems = getCategoryItems(selectedCategory);
                catItems.forEach((item, idx) => {
                    const itemY = shelfY + 60 + idx * 56;
                    
                    // Draw item shelf line card
                    ctx.fillStyle = selectedItemId === item.id ? 'rgba(244, 114, 182, 0.3)' : 'rgba(255, 255, 255, 0.4)';
                    ctx.strokeStyle = selectedItemId === item.id ? 'rgba(219, 39, 119, 0.6)' : 'rgba(244, 114, 182, 0.2)';
                    ctx.beginPath();
                    ctx.roundRect(shelfX + 15, itemY, shelfW - 30, 48, 6);
                    ctx.fill();
                    ctx.stroke();

                    // Emoji / Name
                    ctx.font = '24px "Segoe UI", "Segoe UI Emoji", sans-serif';
                    ctx.fillText(item.emoji, shelfX + 30, itemY + 32);

                    ctx.fillStyle = '#831843';
                    ctx.font = 'bold 12px "Segoe UI", "Segoe UI Emoji", sans-serif';
                    ctx.fillText(item.name, shelfX + 75, itemY + 28);

                    // Price tag badge
                    ctx.fillStyle = '#db2777';
                    ctx.font = 'bold 11px "Segoe UI", "Segoe UI Emoji", sans-serif';
                    ctx.fillText(`🍒 ${item.price}`, shelfX + shelfW - 90, itemY + 28);
                });
            }

            // 3. Right Purchase Counter Panel
            const buyX = 500;
            const buyY = 90;
            const buyW = 260;
            const buyH = 320;

            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.strokeStyle = 'rgba(244, 114, 182, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(buyX, buyY, buyW, buyH, 12);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // Purse Gold Total
            ctx.fillStyle = '#9d174d';
            ctx.font = 'bold 10px "Segoe UI", "Segoe UI Emoji", sans-serif';
            ctx.fillText('YOUR Purse Balance', buyX + 20, buyY + 30);

            ctx.fillStyle = '#be185d';
            ctx.font = 'bold 20px "Segoe UI", "Segoe UI Emoji", sans-serif';
            ctx.fillText(`🍒 ${balance.toLocaleString()}`, buyX + 20, buyY + 56);

            // Selected Item details
            if (selectedItemId && SHOP_ITEMS[selectedItemId]) {
                const item = SHOP_ITEMS[selectedItemId];

                // Draw item preview card
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.beginPath();
                ctx.roundRect(buyX + 20, buyY + 80, buyW - 40, 220, 8);
                ctx.fill();

                ctx.font = '72px "Segoe UI", "Segoe UI Emoji", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(item.emoji, buyX + buyW / 2, buyY + 160);

                ctx.fillStyle = '#831843';
                ctx.font = 'bold 14px "Segoe UI", "Segoe UI Emoji", sans-serif';
                ctx.fillText(item.name, buyX + buyW / 2, buyY + 205);

                ctx.fillStyle = '#9d174d';
                ctx.font = 'italic 11px "Segoe UI", "Segoe UI Emoji", sans-serif';
                // Wrap description
                const desc = item.desc;
                const words = desc.split(' ');
                let line = '';
                let lineY = buyY + 230;
                for (let w = 0; w < words.length; w++) {
                    const testLine = line + words[w] + ' ';
                    const metrics = ctx.measureText(testLine);
                    if (metrics.width > buyW - 80) {
                        ctx.fillText(line, buyX + buyW / 2, lineY);
                        line = words[w] + ' ';
                        lineY += 15;
                    } else {
                        line = testLine;
                    }
                }
                ctx.fillText(line, buyX + buyW / 2, lineY);
                ctx.textAlign = 'left';
            } else {
                ctx.fillStyle = '#db2777';
                ctx.font = 'bold 11px "Segoe UI", "Segoe UI Emoji", sans-serif';
                ctx.fillText('NO ITEM SELECTED', buyX + 20, buyY + 120);
            }

            const buffer = canvas.toBuffer('image/png');
            const attachment = new AttachmentBuilder(buffer, { name: 'shop-board.png' });

            const embed = new EmbedBuilder()
                .setColor('#fbcfe8')
                .setTitle('🎀 CHERRY BOUTIQUE 🎀')
                .setAuthor({ name: `${char.char_name}'s Boutique Visit`, iconURL: interaction.user.displayAvatarURL() })
                .setDescription(
                    `Welcome to the cute local boutique! Select a category from the dropdown to browse items.\n\n` +
                    `🍒 **Your Purse Balance:** \` 🍒 ${balance.toLocaleString()} \` cherries`
                )
                .setImage('attachment://shop-board.png')
                .setTimestamp();

            if (selectedItemId && SHOP_ITEMS[selectedItemId]) {
                const item = SHOP_ITEMS[selectedItemId];
                embed.addFields({ 
                    name: '🛍️ Selected Item', 
                    value: `You selected **${item.name}** ${item.emoji}.\n` +
                           `• **Price:** 🍒 **${item.price}** cherries\n` +
                           `• **Purchase:** Click the button below to buy this item.`
                });
            }

            return { embeds: [embed], files: [attachment] };
        };

        // Category dropdown menu
        const categoryMenu = new StringSelectMenuBuilder()
            .setCustomId('shop_select_category')
            .setPlaceholder('Step 1: Choose a category...')
            .addOptions(
                { label: 'Potions & Consumables', value: 'potions', description: 'Distilled potions to restore HP/Mana.', emoji: '🧪' },
                { label: 'Crafting Materials', value: 'materials', description: 'Raw iron, woods, and weeds for smithing.', emoji: '🪵' },
                { label: 'Food & Farming Seeds', value: 'food', description: 'Snacks and growable crop seeds.', emoji: '🍎' }
            );

        // Item dropdown menu (starts empty/disabled)
        const itemMenu = new StringSelectMenuBuilder()
            .setCustomId('shop_select_item')
            .setPlaceholder('Step 2: Choose an item...')
            .setDisabled(true)
            .addOptions({ label: 'Placeholder', value: 'placeholder' }); // Discord requires at least one option

        // Purchase button (starts disabled)
        const buyBtn = new ButtonBuilder()
            .setCustomId('shop_btn_buy')
            .setLabel('Buy Item')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🛒')
            .setDisabled(true);

        const rowCat = new ActionRowBuilder().addComponents(categoryMenu);
        const rowItem = new ActionRowBuilder().addComponents(itemMenu);
        const rowBtns = new ActionRowBuilder().addComponents(buyBtn);

        const initialPayload = generateShopPayload();
        const msg = await interaction.editReply({
            embeds: initialPayload.embeds,
            files: initialPayload.files,
            components: [rowCat, rowItem, rowBtns]
        });

        const collector = msg.createMessageComponentCollector({
            filter: i => i.user.id === userId,
            time: 180000 // 3 minutes
        });

        collector.on('collect', async (i) => {
            if (i.customId === 'shop_select_category') {
                selectedCategory = i.values[0];
                selectedItemId = null; // reset selected item

                const categoryItems = getCategoryItems(selectedCategory);

                itemMenu
                    .setDisabled(false)
                    .setPlaceholder('Step 2: Select item to purchase...')
                    .setOptions(categoryItems.map(item => ({
                        label: item.name,
                        value: item.id,
                        description: `Price: 🍒 ${item.price} cherries`,
                        emoji: item.emoji
                    })));

                buyBtn.setDisabled(true);

                const catPayload = generateShopPayload();
                await i.update({
                    embeds: catPayload.embeds,
                    files: catPayload.files,
                    components: [rowCat, rowItem, rowBtns]
                });
            }
            else if (i.customId === 'shop_select_item') {
                selectedItemId = i.values[0];
                const item = SHOP_ITEMS[selectedItemId];
                const balance = db.getBalance(userId, guildId);

                buyBtn.setDisabled(balance < item.price);

                const itemPayload = generateShopPayload();
                await i.update({
                    embeds: itemPayload.embeds,
                    files: itemPayload.files,
                    components: [rowCat, rowItem, rowBtns]
                });
            }
            else if (i.customId === 'shop_btn_buy') {
                collector.stop('bought');
                await i.deferUpdate();

                const item = SHOP_ITEMS[selectedItemId];
                const balance = db.getBalance(userId, guildId);

                if (balance < item.price) {
                    return interaction.editReply({ content: '❌ **Insufficient funds!** Purchase canceled.', components: [] });
                }

                // 1. Deduct coins
                db.deductCoins(userId, guildId, item.price);

                // 2. Add item to inventory
                db.addItem(userId, item.name, 1);
                
                db.logTransaction(userId, 'Shop Purchase', `Purchased 1x ${item.name} for 🍒 ${item.price}`);

                const newBalance = db.getBalance(userId, guildId);

                const successEmbed = new EmbedBuilder()
                    .setColor('#fbcfe8')
                    .setTitle('🎉 Purchase Successful!')
                    .setDescription(
                        `🎀 You purchased **${item.name}** ${item.emoji} from the boutique!\n\n` +
                        `• **Item Added:** **${item.name}** x1 (added to your inventory)\n` +
                        `• **Purse Update:** \`-🍒 ${item.price.toLocaleString()}\` cherries\n` +
                        `• **Remaining Balance:** \`🍒 ${newBalance.toLocaleString()}\` cherries`
                    )
                    .setTimestamp();

                await interaction.editReply({
                    embeds: [successEmbed],
                    components: []
                });
            }
        });

        collector.on('end', async (_, reason) => {
            if (reason !== 'bought') {
                const disabledCat = StringSelectMenuBuilder.from(categoryMenu).setDisabled(true);
                const disabledItem = StringSelectMenuBuilder.from(itemMenu).setDisabled(true);
                const disabledBuy = ButtonBuilder.from(buyBtn).setDisabled(true);
                await interaction.editReply({
                    components: [
                        new ActionRowBuilder().addComponents(disabledCat),
                        new ActionRowBuilder().addComponents(disabledItem),
                        new ActionRowBuilder().addComponents(disabledBuy)
                    ]
                }).catch(() => null);
            }
        });
    }
};
