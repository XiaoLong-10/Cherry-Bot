const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas } = require('canvas');
const db = require('../database.js');

function drawTradeCard(senderName, targetName, isCoins, amount, itemName, quantity) {
    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;

    // 1. Draw Wooden Desktop Table
    const tableGrad = ctx.createLinearGradient(0, 0, 0, 400);
    tableGrad.addColorStop(0, '#5c2d11'); // Walnut wood
    tableGrad.addColorStop(1, '#2d1508');
    ctx.fillStyle = tableGrad;
    ctx.fillRect(0, 0, 800, 400);

    // Parchment Scroll paper backing
    const pX = 40;
    const pY = 30;
    const pW = 720;
    const pH = 340;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = '#faf0d0'; // Sepia parchment paper
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(pX, pY, pW, pH, 12);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Scroll title
    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 15px "Georgia", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🤝 GUILD TRADE AGREEMENT DEED', 400, 65);

    // Divider line
    ctx.strokeStyle = 'rgba(146, 64, 14, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, 78);
    ctx.lineTo(740, 78);
    ctx.stroke();

    // 2. Left Side (Giver)
    const ledX1 = 70;
    const ledY = 95;
    const ledW = 310;
    const ledH = 250;

    ctx.save();
    ctx.fillStyle = 'rgba(219, 39, 119, 0.4)';
    ctx.strokeStyle = 'rgba(146, 64, 14, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(ledX1, ledY, ledW, ledH, 8);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#92400e';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SOURCE ACCOUNT (SENDER)', ledX1 + ledW / 2, ledY + 25);

    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 14px "Segoe UI Emoji", sans-serif';
    ctx.fillText(`👤 ${senderName}`, ledX1 + ledW / 2, ledY + 55);

    // Large Center Icon of offered trade
    ctx.save();
    ctx.font = '65px "Segoe UI Emoji", sans-serif';
    ctx.fillText(isCoins ? '🍒' : '📦', ledX1 + ledW / 2, ledY + 130);
    ctx.restore();

    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 12px "Segoe UI Emoji", sans-serif';
    if (isCoins) {
        ctx.fillText(`Offering: 🍒 ${amount.toLocaleString()} cherries`, ledX1 + ledW / 2, ledY + 200);
    } else {
        ctx.fillText(`Offering: ${quantity}x ${itemName}`, ledX1 + ledW / 2, ledY + 200);
    }

    // 3. Right Side (Receiver)
    const ledX2 = 420;

    ctx.save();
    ctx.fillStyle = 'rgba(219, 39, 119, 0.4)';
    ctx.strokeStyle = 'rgba(146, 64, 14, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(ledX2, ledY, ledW, ledH, 8);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#92400e';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('DESTINATION ACCOUNT (RECIPIENT)', ledX2 + ledW / 2, ledY + 25);

    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 14px "Segoe UI Emoji", sans-serif';
    ctx.fillText(`👤 ${targetName}`, ledX2 + ledW / 2, ledY + 55);

    // Gold Wax Seal crest
    const sx = ledX2 + ledW / 2;
    const sy = ledY + 140;
    const sRadius = 38;

    ctx.save();
    const sealGrad = ctx.createLinearGradient(sx - sRadius, sy - sRadius, sx + sRadius, sy + sRadius);
    sealGrad.addColorStop(0, '#f43f5e');
    sealGrad.addColorStop(0.5, '#dc2626');
    sealGrad.addColorStop(1, '#7f1d1d');
    ctx.fillStyle = sealGrad;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 3;

    ctx.beginPath();
    ctx.arc(sx, sy, sRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fef3c7';
    ctx.font = 'bold 20px "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🤝', sx, sy);
    ctx.restore();

    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Guild Trade Approved', ledX2 + ledW / 2, ledY + 215);

    return canvas.toBuffer('image/png');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trade')
        .setDescription('🎲 Safely trade cherries or items directly with other adventurers')
        .addSubcommand(sub =>
            sub.setName('coins')
                .setDescription('🍒 Send cherries directly to another player')
                .addUserOption(opt => opt.setName('target').setDescription('The player to send cherries to').setRequired(true))
                .addIntegerOption(opt => opt.setName('amount').setDescription('The amount of cherries to send').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('item')
                .setDescription('📦 Send an item directly to another player')
                .addUserOption(opt => opt.setName('target').setDescription('The player to send the item to').setRequired(true))
                .addStringOption(opt => opt.setName('name').setDescription('The name of the item (e.g. Wood, Iron Ore)').setRequired(true))
                .addIntegerOption(opt => opt.setName('quantity').setDescription('The quantity to send').setRequired(true))),

    async execute(interaction) {
        await interaction.deferReply();

        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        const target = interaction.options.getUser('target');
        const subcommand = interaction.options.getSubcommand();

        if (target.bot) {
            return interaction.editReply({ content: '❌ You cannot trade with a bot!' });
        }

        if (target.id === userId) {
            return interaction.editReply({ content: '❌ You cannot trade with yourself!' });
        }

        // Verify sender character
        const char = db.getCharacter(userId);
        if (!char || !char.char_name) {
            return interaction.editReply({ content: '⚠️ **You must create an RPG character first!**\nUse **`/character create`** to get started.' });
        }

        // Verify target character
        const targetChar = db.getCharacter(target.id);
        if (!targetChar || !targetChar.char_name) {
            return interaction.editReply({ content: `❌ **${target.username}** does not have an RPG character yet! They must create one to receive trades.` });
        }

        // --- SUBCOMMAND: COINS ---
        if (subcommand === 'coins') {
            const amount = interaction.options.getInteger('amount');
            if (amount <= 0) {
                return interaction.editReply({ content: '❌ Amount must be greater than 0!' });
            }

            const freshCoins = db.getBalance(userId, guildId);
            if (freshCoins < amount) {
                return interaction.editReply({ content: `❌ Insufficient cherries! You only have **🍒 ${freshCoins.toLocaleString()}** cherries.` });
            }

            db.deductCoins(userId, guildId, amount);
            db.addCoins(target.id, guildId, amount);

            const buffer = drawTradeCard(char.char_name, targetChar.char_name, true, amount, '', 0);
            const attachment = new AttachmentBuilder(buffer, { name: 'trade-deed.png' });

            const coinEmbed = new EmbedBuilder()
                .setColor('#fbcfe8')
                .setTitle('🍒 CHERRIES TRANSFERRED')
                .setDescription(`Successfully sent **🍒 ${amount.toLocaleString()}** cherries from your wallet to <@${target.id}>!`)
                .setImage('attachment://trade-deed.png')
                .setTimestamp();

            await interaction.editReply({ embeds: [coinEmbed], files: [attachment] });
        }

        // --- SUBCOMMAND: ITEM ---
        else if (subcommand === 'item') {
            const itemNameInput = interaction.options.getString('name').trim();
            const qty = interaction.options.getInteger('quantity');

            if (qty <= 0) {
                return interaction.editReply({ content: '❌ Quantity must be greater than 0!' });
            }

            const inventory = db.getInventory(userId);
            const invItem = inventory.find(i => i.itemName.toLowerCase() === itemNameInput.toLowerCase());

            if (!invItem || invItem.quantity < qty) {
                const held = invItem ? invItem.quantity : 0;
                return interaction.editReply({ content: `❌ You do not have enough **${itemNameInput}**! (Held: ${held}, Required: ${qty})` });
            }

            const correctName = invItem.itemName;

            db.removeItem(userId, correctName, qty);
            db.addItem(target.id, correctName, qty);

            const buffer = drawTradeCard(char.char_name, targetChar.char_name, false, 0, correctName, qty);
            const attachment = new AttachmentBuilder(buffer, { name: 'trade-deed.png' });

            const itemEmbed = new EmbedBuilder()
                .setColor('#c084fc')
                .setTitle('📦 ITEMS TRANSFERRED')
                .setDescription(`Successfully transferred **${qty}x ${correctName}** to <@${target.id}>'s inventory!`)
                .setImage('attachment://trade-deed.png')
                .setTimestamp();

            await interaction.editReply({ embeds: [itemEmbed], files: [attachment] });
        }
    }
};
