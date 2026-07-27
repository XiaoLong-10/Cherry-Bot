const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database.js');

const REWARDS_POOL = [
    // Gear (35% total)
    { type: 'gear', name: 'Shadow Dagger 🗡️', weight: 0.15 },
    { type: 'gear', name: 'Ruby Aegis 🛡️', weight: 0.10 },
    { type: 'gear', name: 'Phoenix Plate 🛡️', weight: 0.10 },
    // Materials (30% total)
    { type: 'material', name: 'Dragon scale 💎', weight: 0.10 },
    { type: 'material', name: 'Star shard ✨', weight: 0.10 },
    { type: 'material', name: 'Nebula Core 🪐', weight: 0.10 },
    // Creatures (10% total)
    { type: 'creature', name: 'Shadowraith 🔮', weight: 0.05, rarity: 'Legendary' },
    { type: 'creature', name: 'Nebula-Rex 🪐', weight: 0.05, rarity: 'Legendary' }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('open')
        .setDescription('📦 Open a Premium Mystery Box from your inventory bag'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        // Check if player has the mystery box
        const boxQty = db.getItemQuantity(userId, 'Premium Mystery Box 🎁');
        if (boxQty <= 0) {
            return await interaction.reply({ 
                content: '❌ **No boxes to open!**\nYou do not have any **Premium Mystery Box 🎁** in your inventory.\n*Earn them by reaching Day 7 on your `/streak`!*',
                ephemeral: true 
            });
        }

        // Consume 1 box
        db.removeItem(userId, 'Premium Mystery Box 🎁', 1);

        // Animated spin indicators
        await interaction.reply({ content: '📦 **Unlocking Premium Mystery Box...**\n` [ ❓ ] `  ` [ ❓ ] `  ` [ ❓ ] `' });

        await new Promise(r => setTimeout(r, 600));
        await interaction.editReply({ content: '📦 **Spinning slot rollers...**\n` [ 💎 Star shard ] `  ` [ ❓ ] `  ` [ ❓ ] `' });

        await new Promise(r => setTimeout(r, 600));
        await interaction.editReply({ content: '📦 **Decelerating gears...**\n` [ 💎 Star shard ] `  ` [ 🛡️ Ruby Aegis ] `  ` [ ❓ ] `' });

        await new Promise(r => setTimeout(r, 600));
        await interaction.editReply({ content: '📦 **Gears locked!**\n` [ 💎 Star shard ] `  ` [ 🛡️ Ruby Aegis ] `  ` [ 🪐 Nebula Core ] `' });

        await new Promise(r => setTimeout(r, 400));

        // Roll the actual reward
        const roll = Math.random();
        let wonItem = '';
        let wonDescription = '';

        if (roll < 0.25) {
            // Cherries Jackpot (25% chance)
            const coinsWon = Math.floor(Math.random() * 15001) + 10000; // 10k to 25k
            db.addCoins(userId, guildId, coinsWon);
            wonItem = `🍒 **${coinsWon.toLocaleString()} Cherries**`;
            wonDescription = `A heavy sack of cherries was deposited directly to your wallet balance!`;
        } else {
            // Roll from pool
            let poolWeightSum = 0;
            const itemsPool = REWARDS_POOL;
            const subRoll = Math.random() * 0.75; // Normalize roll across 75% remaining pool

            let selectedItem = itemsPool[0];
            let currentSum = 0;
            
            for (const item of itemsPool) {
                currentSum += item.weight;
                if (subRoll <= currentSum) {
                    selectedItem = item;
                    break;
                }
            }

            if (selectedItem.type === 'creature') {
                db.catchCreature(userId, selectedItem.name, selectedItem.rarity);
                wonItem = `🐾 **${selectedItem.name}** (${selectedItem.rarity})`;
                wonDescription = `Amazing! A legendary creature broke out of the box and entered your **Sanctuary Dex**!`;
            } else {
                db.addItem(userId, selectedItem.name, 1);
                wonItem = `🎁 **${selectedItem.name}**`;
                wonDescription = `A rare collectible item has been added to your **Inventory Bag**!`;
            }
        }

        const openEmbed = new EmbedBuilder()
            .setColor('#db2777')
            .setTitle('📦 PREMIUM MYSTERY BOX OPENED')
            .setDescription(
                `🎉 You successfully opened a **Premium Mystery Box 🎁**!\n\n` +
                `**You Discovered:**\n` +
                `${wonItem}\n\n` +
                `• *${wonDescription}*\n• **Boxes Remaining:** \` ${boxQty - 1} \` box(es)`
            )
            .setTimestamp();

        // Clear indicator text and send embed
        await interaction.editReply({ content: '', embeds: [openEmbed] });
    }
};
