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
    const name = itemName.toLowerCase();
    for (const [key, value] of Object.entries(ITEM_EMOJIS)) {
        if (name.includes(key)) return value;
    }
    return '📦';
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('✨ View your premium wallet balance and visual inventory item grid'),

    async execute(interaction) {
        await interaction.deferReply(); 

        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        try {
            const coins = db.getBalance(userId, guildId) || 0;
            const inventory = db.getInventory(userId) || [];
            const activePlots = db.getFarmPlots(userId).length;
            const curr = db.getCurrencySettings(guildId);

            // Setup Canvas
            const width = 800;
            const height = 500;
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;

            // 1. Dark Slate-Pink Gradient Background
            const bgGrad = ctx.createRadialGradient(width/2, height/2, 50, width/2, height/2, width/2);
            bgGrad.addColorStop(0, '#fce7f3'); // Cute pink
            bgGrad.addColorStop(1, '#fbcfe8');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, width, height);

            // 2. Double Frame Borders
            const frameColor = '#db2777'; // pink-600
            ctx.save();
            ctx.fillStyle = '#fdf4ff'; // inner box
            ctx.strokeStyle = frameColor;
            ctx.lineWidth = 4;
            ctx.shadowColor = 'rgba(219, 39, 119, 0.4)';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.roundRect(40, 30, 720, 440, 16);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // Inner double border
            ctx.strokeStyle = '#fbcfe8';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(48, 38, 704, 424, 12);
            ctx.stroke();

            // 3. Left Balance Box
            ctx.save();
            ctx.fillStyle = '#fce7f3';
            ctx.strokeStyle = '#f472b6';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(70, 75, 230, 350, 12);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // Load User Avatar
            let avatarImg = null;
            try {
                const avatarUrl = interaction.user.displayAvatarURL({ extension: 'png', size: 128 });
                avatarImg = await loadImage(avatarUrl);
            } catch (e) {}

            ctx.save();
            ctx.beginPath();
            ctx.arc(185, 155, 45, 0, Math.PI * 2);
            ctx.clip();
            if (avatarImg) {
                ctx.drawImage(avatarImg, 140, 110, 90, 90);
            } else {
                ctx.fillStyle = '#fbcfe8';
                ctx.fill();
            }
            ctx.restore();

            // Avatar Ring
            ctx.strokeStyle = frameColor;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(185, 155, 45, 0, Math.PI * 2);
            ctx.stroke();

            // Username
            ctx.fillStyle = '#831843';
            ctx.font = 'bold 18px "Segoe UI Emoji", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(interaction.user.username, 185, 230);

            // Balances
            ctx.fillStyle = '#9d174d';
            ctx.font = 'bold 11px sans-serif';
            ctx.fillText('FINANCIAL ACCOUNTS', 185, 265);

            ctx.fillStyle = '#831843';
            ctx.font = 'bold 15px sans-serif';
            ctx.fillText(`🎀 Wallet: ${curr.symbol} ${coins.toLocaleString()} ${curr.name}`, 185, 295);
            ctx.fillText(`🏠 Homestead: ${activePlots}/3 plots`, 185, 325);

            // 4. Right Inventory Grid Box
            ctx.fillStyle = '#9d174d';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('🎒 GRAPHICAL ITEM GRID (MAX 12 SLOTS)', 330, 95);

            // Draw Item slots: 3 rows, 4 columns
            const gridCols = 4;
            const gridRows = 3;
            const slotSize = 85;
            const spacing = 16;
            const startX = 330;
            const startY = 115;

            for (let r = 0; r < gridRows; r++) {
                for (let c = 0; c < gridCols; c++) {
                    const idx = r * gridCols + c;
                    const sx = startX + c * (slotSize + spacing);
                    const sy = startY + r * (slotSize + spacing);

                    // Draw Slot Square
                    ctx.save();
                    ctx.fillStyle = '#ffffff';
                    ctx.strokeStyle = 'rgba(244, 114, 182, 0.5)';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.roundRect(sx, sy, slotSize, slotSize, 8);
                    ctx.fill();
                    ctx.stroke();
                    ctx.restore();

                    // If item exists in inventory
                    if (idx < inventory.length) {
                        const item = inventory[idx];
                        const emoji = getEmoji(item.itemName);

                        // Draw Emoji Centered
                        ctx.font = '36px "Segoe UI Emoji", sans-serif';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(emoji, sx + slotSize/2, sy + slotSize/2 - 2);

                        // Draw Quantity Pill (bottom right)
                        ctx.save();
                        ctx.fillStyle = 'rgba(244, 114, 182, 0.85)';
                        ctx.beginPath();
                        ctx.roundRect(sx + slotSize - 35, sy + slotSize - 20, 30, 16, 4);
                        ctx.fill();

                        ctx.fillStyle = '#831843';
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
                ctx.fillText('Your inventory bag is currently empty.', 530, 260);
            }

            const buffer = canvas.toBuffer('image/png');
            const attachment = new AttachmentBuilder(buffer, { name: 'inventory-card.png' });

            const embed = new EmbedBuilder()
                .setColor('#db2777')
                .setTitle('🎀 CHERRY BALANCE & RPG INVENTORY')
                .setDescription(`Inspect your pocket ${curr.name} and raw item resources below.`)
                .setImage('attachment://inventory-card.png')
                .setFooter({ text: `Requested By ${interaction.user.username} 🌟`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed], files: [attachment] });
            
        } catch (error) {
            console.error('Balance command error:', error);
            await interaction.editReply({ 
                content: '⚠️ *An error occurred while compiling your visual item bag ledger.*' 
            });
        }
    }
};