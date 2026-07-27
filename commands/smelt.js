const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    MessageFlags,
    AttachmentBuilder
} = require('discord.js');
const { createCanvas } = require('canvas');
const db = require('../database.js');

function drawSmeltCard(charName, oreType, needlePos, progress, turn, isPreClick = true, outcome = 'none') {
    const width = 800;
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 1. Dark glowing furnace background
    const bgGrad = ctx.createRadialGradient(400, 200, 40, 400, 200, 420);
    bgGrad.addColorStop(0, '#292524'); // stone 800
    bgGrad.addColorStop(1, '#0c0a09'); // stone 950
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Glowing forge texture lines in background
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.08)';
    ctx.lineWidth = 3;
    for (let i = 0; i < width; i += 80) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
    }

    // 2. Draw Thermometer Heat Needle scale
    // Base gauge bar outline
    const barX = 200;
    const barY = 160;
    const barW = 400;
    const barH = 26;

    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 8);
    ctx.fill();

    // Draw target green sweetspot [40%, 60%] -> pixels: X = 200 + 400*0.4 = 360 to 200 + 400*0.6 = 440
    ctx.fillStyle = '#22c55e'; // emerald green
    ctx.fillRect(barX + (barW * 0.40), barY + 2, barW * 0.20, barH - 4);

    // Draw warnings [0%-20%] and [80%-100%] -> red overheating/freezing
    ctx.fillStyle = '#ef4444'; // red warning left
    ctx.fillRect(barX + 2, barY + 2, barW * 0.15, barH - 4);
    ctx.fillRect(barX + (barW * 0.85) - 2, barY + 2, barW * 0.15, barH - 4);

    // Draw pointer needle indicator
    const needleX = barX + (needlePos / 100) * barW;
    ctx.fillStyle = '#f59e0b'; // amber needle
    ctx.beginPath();
    ctx.moveTo(needleX, barY - 12);
    ctx.lineTo(needleX - 8, barY - 2);
    ctx.lineTo(needleX + 8, barY - 2);
    ctx.closePath();
    ctx.fill();

    // Draw needle stem down the dial
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(needleX, barY - 2);
    ctx.lineTo(needleX, barY + barH + 2);
    ctx.stroke();

    // 3. Render Smelting Pot Crucible (centered below dial)
    const potX = 400;
    const potY = 270;
    
    // Pot rim
    ctx.fillStyle = '#44403c';
    ctx.beginPath();
    ctx.ellipse(potX, potY, 60, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Liquid metal color inside pot
    ctx.fillStyle = outcome === 'melted' ? '#ef4444' : (oreType === 'Gold Ore' ? '#fbbf24' : '#94a3b8');
    ctx.beginPath();
    ctx.ellipse(potX, potY + 4, 54, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Heat waves rising from pot
    if (outcome !== 'frozen' && outcome !== 'melted') {
        ctx.fillStyle = 'rgba(249, 115, 22, 0.4)';
        for (let i = 0; i < 4; i++) {
            const hx = potX - 30 + (i * 20) + (Math.sin(turn + i) * 6);
            const hy = potY - 15 - Math.random() * 20;
            ctx.beginPath();
            ctx.arc(hx, hy, 2 + Math.random() * 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // 4. Progress bubbles on the left
    for (let p = 1; p <= 3; p++) {
        const cx = 100;
        const cy = 100 + (p * 50);
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#78716c';
        ctx.lineWidth = 2;
        if (progress >= p) {
            ctx.fillStyle = '#22c55e'; // Success green bulb
            ctx.shadowColor = '#4ade80';
        } else {
            ctx.fillStyle = 'rgba(28,25,23,0.8)';
            ctx.shadowColor = 'transparent';
        }
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = '#e7e5e4';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.toString(), cx, cy + 4);
    }
    
    ctx.fillStyle = '#a8a29e';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('STABILITY', 100, 120);

    // 5. Outcome overlays
    if (outcome === 'success') {
        ctx.save();
        ctx.font = '75px "Segoe UI Emoji", sans-serif';
        ctx.fillText('🔱', potX, potY - 80);
        ctx.restore();
    } else if (outcome === 'melted') {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 32px sans-serif';
        ctx.fillText('CRITICAL OVERHEAT! 💥', potX, potY - 80);
    } else if (outcome === 'frozen') {
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 32px sans-serif';
        ctx.fillText('FURNACE COOLED DOWN! ❄️', potX, potY - 80);
    }

    // 6. Frosted status bar at bottom
    ctx.save();
    ctx.fillStyle = 'rgba(28, 25, 23, 0.9)';
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(40, 310, 720, 70, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f5f5f4';
    ctx.font = 'bold 14px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Smelting Station: ${oreType} ➡️ ${oreType === 'Gold Ore' ? 'Gold Bar' : 'Iron Bar'}`, 60, 335);

    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#d6d3d1';
    if (outcome === 'success') {
        ctx.fillStyle = '#4ade80';
        ctx.fillText(`SUCCESS! Smelted bar cooled down cleanly! (+1 ${oreType === 'Gold Ore' ? 'Gold Bar' : 'Iron Bar'})`, 60, 360);
    } else if (outcome === 'melted') {
        ctx.fillStyle = '#f87171';
        ctx.fillText('Crucible structure collapsed! Raw materials dissolved into gaseous slag.', 60, 360);
    } else if (outcome === 'frozen') {
        ctx.fillStyle = '#60a5fa';
        ctx.fillText('Furnace fire faded! Raw materials solidified inside the clay and cracked.', 60, 360);
    } else {
        ctx.fillText(`Stability Ticks: ${progress} / 3 ┃ Turn: ${turn} / 5 ┃ Maintain temperature inside green zone!`, 60, 360);
    }
    ctx.restore();

    return canvas.toBuffer();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('smelt')
        .setDescription('🔥 Smelt raw ores into metal bars using active furnace balancing')
        .addStringOption(option =>
            option.setName('ore')
                .setDescription('Select the ore type to smelt')
                .setRequired(true)
                .addChoices(
                    { name: '🧱 Iron Bar (Needs 3x Iron Ore + 1x Coal)', value: 'iron' },
                    { name: '🔱 Gold Bar (Needs 3x Gold Ore + 1x Coal)', value: 'gold' }
                )),

    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        const choice = interaction.options.getString('ore');

        // Verify character
        const char = db.getCharacter(userId);
        if (!char || !char.char_name) {
            return interaction.reply({
                content: '⚠️ **You must create an RPG character first!** Use `/character create`.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        await interaction.deferReply();

        const reqOreName = choice === 'gold' ? 'Gold Ore' : 'Iron Ore';
        const targetBarName = choice === 'gold' ? 'Gold Bar' : 'Iron Bar';

        // Check materials
        const inventory = db.getInventory(userId);
        const oreItem = inventory.find(i => i.itemName.toLowerCase() === reqOreName.toLowerCase());
        const coalItem = inventory.find(i => i.itemName.toLowerCase() === 'coal');

        const oreQty = oreItem ? oreItem.quantity : 0;
        const coalQty = coalItem ? coalItem.quantity : 0;

        if (oreQty < 3 || coalQty < 1) {
            return interaction.editReply({
                content: `❌ **Insufficient materials!** You need at least **3x ${reqOreName}** and **1x Coal** to smelt a bar.\n` +
                         `• You hold: **${oreQty}** ${reqOreName} ┃ **${coalQty}** Coal.`
            });
        }

        // Deduct materials upfront
        db.removeItem(userId, reqOreName, 3);
        db.removeItem(userId, 'Coal', 1);

        // Minigame variables
        let needlePos = 30 + Math.floor(Math.random() * 40); // 30 to 70 range
        let progress = 0;
        let turn = 1;
        let isResolved = false;

        const heatUpBtn = new ButtonBuilder().setCustomId('smelt_heat_up').setLabel('Stash Coal (+15 Heat)').setStyle(ButtonStyle.Danger).setEmoji('➕');
        const heatDownBtn = new ButtonBuilder().setCustomId('smelt_heat_down').setLabel('Open Vent (-15 Heat)').setStyle(ButtonStyle.Primary).setEmoji('➖');
        const heatHoldBtn = new ButtonBuilder().setCustomId('smelt_heat_hold').setLabel('Blow Bellows (Stable)').setStyle(ButtonStyle.Success).setEmoji('🔥');

        const row = new ActionRowBuilder().addComponents(heatUpBtn, heatDownBtn, heatHoldBtn);

        const generatePayload = (outcome = 'none') => {
            const buffer = drawSmeltCard(char.char_name, reqOreName, needlePos, progress, turn, true, outcome);
            const attachment = new AttachmentBuilder(buffer, { name: 'smelter-stage.png' });

            const embed = new EmbedBuilder()
                .setColor('#f97316')
                .setTitle(`🔥 SMELTING FURNACE: ${targetBarName}`)
                .setDescription(
                    `Balance the furnace flame to refine your ores!\n` +
                    `Click buttons to increase or decrease heat. Keep the needle inside the **green zone** at the end of each turn.\n\n` +
                    `• **Goal:** Reach **3 Stability Ticks** (need to stay inside green zone)\n` +
                    `• **Limit:** Max **5 Turns** before crucible melts/freezes!`
                )
                .setImage('attachment://smelter-stage.png')
                .setTimestamp();

            if (outcome === 'success') {
                embed.setColor('#22c55e')
                     .setTitle('🎉 SMELTING COMPLETE!')
                     .setDescription(`✨ Success! You successfully smelted and refined 1x **${targetBarName}**! It was added to your inventory.`);
            } else if (outcome === 'melted') {
                embed.setColor('#ef4444')
                     .setTitle('💥 FURNACE METLDOWN!')
                     .setDescription('❌ Overheated! The crucible dissolved into a slag puddle and raw ingredients evaporated.');
            } else if (outcome === 'frozen') {
                embed.setColor('#60a5fa')
                     .setTitle('❄️ FURNACE COOLED DOWN!')
                     .setDescription('❌ The temperature dropped too low! The metal hardened prematurely and cracked into pieces.');
            }

            return { embeds: [embed], files: [attachment], components: outcome === 'none' ? [row] : [] };
        };

        const msg = await interaction.editReply(generatePayload('none'));

        const collector = msg.createMessageComponentCollector({
            filter: i => i.user.id === userId,
            time: 90000 // 90 seconds
        });

        const processTurn = async (clickedId) => {
            // Apply heat adjustment
            if (clickedId === 'smelt_heat_up') needlePos += 15;
            else if (clickedId === 'smelt_heat_down') needlePos -= 15;

            // Apply random drift (-10 to +10)
            const drift = Math.floor(Math.random() * 21) - 10;
            needlePos += drift;

            // Constrain
            if (needlePos < 0) needlePos = 0;
            if (needlePos > 100) needlePos = 100;

            // Check if inside sweetspot [40, 60]
            const inSweetspot = needlePos >= 40 && needlePos <= 60;
            if (inSweetspot) {
                progress += 1;
            }

            // Check boundaries for instant fail
            let outcome = 'none';
            if (needlePos >= 90) {
                outcome = 'melted';
            } else if (needlePos <= 10) {
                outcome = 'frozen';
            }

            // Check wins/losses
            if (outcome === 'none') {
                if (progress >= 3) {
                    outcome = 'success';
                } else if (turn >= 5) {
                    outcome = needlePos > 60 ? 'melted' : 'frozen';
                }
            }

            if (outcome === 'success') {
                isResolved = true;
                collector.stop('completed');
                db.addItem(userId, targetBarName, 1);
                db.increaseSkill(userId, 'smithing', 2);
                db.logTransaction(userId, 'Smelt Success', `Refined 1x ${targetBarName} 🔥`);
                return interaction.editReply(generatePayload('success'));
            } else if (outcome === 'melted' || outcome === 'frozen') {
                isResolved = true;
                collector.stop('failed');
                db.logTransaction(userId, 'Smelt Failed', `Failed smelting ${targetBarName} (${outcome})`);
                return interaction.editReply(generatePayload(outcome));
            }

            // Advance turn
            turn += 1;
            await interaction.editReply(generatePayload('none'));
        };

        collector.on('collect', async (i) => {
            await i.deferUpdate();
            await processTurn(i.customId);
        });

        collector.on('end', async (_, reason) => {
            if (reason === 'time' && !isResolved) {
                // If timed out, materials are lost (meltdown due to neglect)
                db.logTransaction(userId, 'Smelt Timeout', `Failed smelting ${targetBarName} due to idle timeout`);
                await interaction.editReply({ content: '❌ Smelting session timed out! The furnace overheated and blew up.', components: [] });
            }
        });
    }
};
