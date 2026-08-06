const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const db = require('../database.js');

const ITEM_EMOJIS = {
    'stone': '🪨',
    'coal': '🔥',
    'iron ore': '🪨',
    'gold ore': '🍒',
    'diamond': '💎',
    'seaweed': '🌿',
    'shrimp': '🦐',
    'salmon': '🐟',
    'tuna': '🐟',
    'shark': '🦈',
    'twig': '🥢',
    'pine wood': '🪵',
    'oak wood': '🪵',
    'mahogany': '🪵',
    'magic wood': '🪄',
    'wheat seed': '🌾',
    'apple seed': '🍎',
    'berry seed': '🍓',
    'wheat': '🌾',
    'apple': '🍎',
    'berries': '🍓',
    'health potion': '🧪',
    'mana potion': '🌀',
    'iron sword': '⚔️',
    'gold sword': '🔱',
    'oak bow': '🏹',
    'magic staff': '🔮',
    'wooden shield': '🛡️',
    'plated shield': '🧱',
    'gold ring': '💍'
};

function getEmoji(itemName) {
    if (!itemName) return '📦';
    const name = itemName.toLowerCase();
    for (const [key, value] of Object.entries(ITEM_EMOJIS)) {
        if (name.includes(key)) return value;
    }
    return '📦';
}

function fitText(ctx, text, maxWidth) {
    if (!text) return '';
    if (ctx.measureText(text).width <= maxWidth) return text;
    let truncated = text;
    while (truncated.length > 3 && ctx.measureText(truncated + '...').width > maxWidth) {
        truncated = truncated.slice(0, -1);
    }
    return truncated + '...';
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('✨ View wallet balance, bank savings, and visual inventory item grid')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to check balance for')
                .setRequired(false)),

    async execute(interaction) {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply().catch(() => {});
        }

        const targetUser = interaction.options.getUser('user') || interaction.user;
        const userId = targetUser.id;
        const guildId = interaction.guild ? interaction.guild.id : 'GLOBAL';

        try {
            const coins = db.getBalance(userId, guildId) || 0;
            const char = db.getCharacter(userId) || {};
            const bankCoins = char.bank_coins || 0;
            const streakCount = char.streak_count || 0;
            const inventory = db.getInventory(userId) || [];
            const activePlots = (db.getFarmPlots(userId) || []).length;
            const curr = db.getCurrencySettings(guildId);

            // Canvas Setup
            const width = 850;
            const height = 520;
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;

            // 1. Soft Gradient Background
            const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width / 2);
            bgGrad.addColorStop(0, '#fce7f3');
            bgGrad.addColorStop(1, '#fbcfe8');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, width, height);

            // 2. Double Frame Borders
            const frameColor = '#db2777';
            ctx.save();
            ctx.fillStyle = '#fdf4ff';
            ctx.strokeStyle = frameColor;
            ctx.lineWidth = 4;
            ctx.shadowColor = 'rgba(219, 39, 119, 0.4)';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.roundRect(35, 25, 780, 470, 16);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // Inner Accent Border
            ctx.strokeStyle = '#fbcfe8';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(43, 33, 764, 454, 12);
            ctx.stroke();

            // 3. Left Financial Account Box
            ctx.save();
            ctx.fillStyle = '#fce7f3';
            ctx.strokeStyle = '#f472b6';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(65, 60, 250, 400, 14);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // User Avatar
            let avatarImg = null;
            try {
                const avatarUrl = targetUser.displayAvatarURL({ extension: 'png', size: 128 });
                avatarImg = await loadImage(avatarUrl);
            } catch (e) {}

            ctx.save();
            ctx.beginPath();
            ctx.arc(190, 135, 48, 0, Math.PI * 2);
            ctx.clip();
            if (avatarImg) {
                ctx.drawImage(avatarImg, 142, 87, 96, 96);
            } else {
                ctx.fillStyle = '#fbcfe8';
                ctx.fill();
            }
            ctx.restore();

            // Avatar Outer Ring
            ctx.strokeStyle = frameColor;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(190, 135, 48, 0, Math.PI * 2);
            ctx.stroke();

            // Username
            ctx.fillStyle = '#831843';
            ctx.font = 'bold 20px "Segoe UI Emoji", sans-serif';
            ctx.textAlign = 'center';
            const displayUser = fitText(ctx, targetUser.username, 220);
            ctx.fillText(displayUser, 190, 212);

            // Financial Accounts Title
            ctx.fillStyle = '#9d174d';
            ctx.font = 'bold 11px sans-serif';
            ctx.fillText('FINANCIAL ACCOUNTS', 190, 245);

            // Detailed Balances
            ctx.fillStyle = '#831843';
            ctx.font = 'bold 14px "Segoe UI Emoji", sans-serif';
            ctx.fillText(`👛 Wallet: ${curr.symbol} ${coins.toLocaleString()}`, 190, 275);
            ctx.fillText(`🏦 Bank: ${curr.symbol} ${bankCoins.toLocaleString()}`, 190, 310);
            ctx.fillText(`✨ Net Liquid: ${curr.symbol} ${(coins + bankCoins).toLocaleString()}`, 190, 345);
            ctx.fillText(`🏡 Homestead: ${activePlots}/3 plots`, 190, 380);
            ctx.fillText(`🔥 Daily Streak: ${streakCount} days`, 190, 415);

            // 4. Right Graphical Item Grid Box
            ctx.fillStyle = '#9d174d';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'left';
            const invHeader = `🎒 RPG ITEM BAG (${inventory.length} STACKS)`;
            ctx.fillText(invHeader, 345, 80);

            const gridCols = 4;
            const gridRows = 3;
            const slotSize = 90;
            const spacing = 16;
            const startX = 345;
            const startY = 100;

            for (let r = 0; r < gridRows; r++) {
                for (let c = 0; c < gridCols; c++) {
                    const idx = r * gridCols + c;
                    const sx = startX + c * (slotSize + spacing);
                    const sy = startY + r * (slotSize + spacing);

                    // Draw Slot Box
                    ctx.save();
                    ctx.fillStyle = '#ffffff';
                    ctx.strokeStyle = 'rgba(244, 114, 182, 0.5)';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.roundRect(sx, sy, slotSize, slotSize, 10);
                    ctx.fill();
                    ctx.stroke();
                    ctx.restore();

                    // Render Item inside slot if exists
                    if (idx < inventory.length) {
                        const item = inventory[idx];
                        const emoji = getEmoji(item.itemName);

                        // Draw Emoji Centered
                        ctx.font = '36px "Segoe UI Emoji", sans-serif';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(emoji, sx + slotSize / 2, sy + slotSize / 2 - 8);

                        // Draw Item Name at bottom left of slot
                        ctx.fillStyle = '#9d174d';
                        ctx.font = 'bold 9px sans-serif';
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'alphabetic';
                        const itemNameTrunc = fitText(ctx, item.itemName, slotSize - 32);
                        ctx.fillText(itemNameTrunc, sx + 6, sy + slotSize - 8);

                        // Draw Quantity Pill (bottom right)
                        ctx.save();
                        ctx.fillStyle = '#db2777';
                        ctx.beginPath();
                        ctx.roundRect(sx + slotSize - 34, sy + slotSize - 20, 28, 15, 5);
                        ctx.fill();

                        ctx.fillStyle = '#ffffff';
                        ctx.font = 'bold 9px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(`x${item.quantity}`, sx + slotSize - 20, sy + slotSize - 12);
                        ctx.restore();
                    }
                }
            }

            if (inventory.length === 0) {
                ctx.fillStyle = '#be185d';
                ctx.font = 'italic 13px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Your item bag is currently empty.', 550, 260);
                ctx.font = '11px sans-serif';
                ctx.fillText('Use /work, /fish, or /mine to gather resources!', 550, 285);
            } else if (inventory.length > 12) {
                ctx.fillStyle = '#be185d';
                ctx.font = 'bold 11px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`+ ${inventory.length - 12} more items in bag`, 550, 435);
            }

            const buffer = typeof canvas.encode === 'function' ? await canvas.encode('png') : canvas.toBuffer('image/png');
            const attachment = new AttachmentBuilder(buffer, { name: 'inventory-card.png' });

            const embed = new EmbedBuilder()
                .setColor('#db2777')
                .setTitle(`🎀 ${targetUser.username}'s Cherry Balance & Inventory`)
                .setDescription(`Inspect ${targetUser.username}'s liquid balance and RPG item resources below.`)
                .setImage('attachment://inventory-card.png')
                .setFooter({ text: `Requested By ${interaction.user.username} 🌟`, iconURL: interaction.user.displayAvatarURL({ extension: 'png' }) })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed], files: [attachment] });

        } catch (error) {
            console.error('Balance command error:', error);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({
                    content: '⚠️ *An error occurred while compiling your visual item bag ledger.*'
                }).catch(() => {});
            } else {
                await interaction.reply({
                    content: '⚠️ *An error occurred while compiling your visual item bag ledger.*'
                }).catch(() => {});
            }
        }
    }
};