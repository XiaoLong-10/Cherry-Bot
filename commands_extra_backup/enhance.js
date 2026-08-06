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

const REQS = {
    tier1: { stones: 5, coal: 2, iron: 0, gold: 0, diamonds: 0, rate: 100 },
    tier2: { stones: 10, coal: 5, iron: 1, gold: 0, diamonds: 0, rate: 75 },
    tier3: { stones: 15, coal: 8, iron: 3, gold: 1, diamonds: 0, rate: 50 },
    tier4: { stones: 20, coal: 10, iron: 5, gold: 2, diamonds: 1, rate: 30 }
};

function getUpgradeReqs(nextLvl) {
    if (nextLvl <= 3) return REQS.tier1;
    if (nextLvl <= 6) return REQS.tier2;
    if (nextLvl <= 9) return REQS.tier3;
    return REQS.tier4;
}

function drawEnhanceCard(itemName, success, nextLevel, rate, isPreAttempt = true, failedShatter = false) {
    const width = 800;
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 1. Blacksmith Forge Dark Background Glow
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#1e293b'); // Dark Slate
    bgGrad.addColorStop(0.5, '#0f172a'); // Near Black
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Forge furnace glowing coals in bottom-right corner
    const fireGrad = ctx.createRadialGradient(720, 360, 20, 720, 360, 180);
    fireGrad.addColorStop(0, 'rgba(239, 68, 68, 0.8)'); // Orange-red center
    fireGrad.addColorStop(0.5, 'rgba(249, 115, 22, 0.3)');
    fireGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = fireGrad;
    ctx.fillRect(500, 180, 300, 220);

    // Spark particles rising from forge coals
    ctx.fillStyle = 'rgba(253, 186, 116, 0.7)';
    for (let i = 0; i < 8; i++) {
        const sx = 620 + Math.random() * 120;
        const sy = 220 + Math.random() * 120;
        const sr = 1 + Math.random() * 3;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
    }

    // 2. Draw Blacksmith Anvil
    // Base block
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect(320, 240, 160, 70, 10);
    ctx.fill();

    // Anvil Horn (Left pointed horn)
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(320, 248);
    ctx.lineTo(260, 230);
    ctx.lineTo(320, 275);
    ctx.closePath();
    ctx.fill();

    // Anvil Body
    ctx.fillRect(345, 175, 110, 65);

    // Top Face Plate
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.roundRect(310, 165, 180, 15, 4);
    ctx.fill();

    // 3. Draw Equipment Icon and Glow Circle
    let equipEmoji = '⚔️';
    if (itemName.includes('Bow')) equipEmoji = '🏹';
    else if (itemName.includes('Staff')) equipEmoji = '🔮';
    else if (itemName.includes('Shield')) equipEmoji = '🛡️';
    else if (itemName.includes('Ring')) equipEmoji = '💍';

    const cx = 400;
    const cy = 110;

    // Glowing circle behind the item based on enhancement level
    ctx.save();
    ctx.shadowBlur = 25;
    if (nextLevel <= 3) {
        ctx.strokeStyle = '#38bdf8'; // Soft sky blue
        ctx.shadowColor = '#0ea5e9';
    } else if (nextLevel <= 6) {
        ctx.strokeStyle = '#a855f7'; // Purple magic
        ctx.shadowColor = '#d946ef';
    } else if (nextLevel <= 9) {
        ctx.strokeStyle = '#f43f5e'; // Hot neon pink
        ctx.shadowColor = '#e11d48';
    } else {
        ctx.strokeStyle = '#fbbf24'; // Radiant gold starburst
        ctx.shadowColor = '#f59e0b';
    }
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, 45, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Draw equipment emoji
    ctx.save();
    ctx.font = '55px "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(equipEmoji, cx, cy);
    ctx.restore();

    // 4. Draw sparkles or shattering overlays
    if (!isPreAttempt) {
        if (success) {
            // Success green spark showers
            ctx.fillStyle = '#34d399';
            ctx.font = '24px sans-serif';
            ctx.fillText('✨', cx - 75, cy - 20);
            ctx.fillText('⚡', cx + 60, cy - 40);
            ctx.fillText('✨', cx + 70, cy + 30);
            ctx.fillText('⚡', cx - 60, cy + 40);
        } else {
            // Shatter crack lines on the anvil top plate
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(cx - 20, cy + 30);
            ctx.lineTo(cx - 5, cy + 55);
            ctx.lineTo(cx + 10, cy + 45);
            ctx.stroke();

            ctx.font = '45px "Segoe UI Emoji", sans-serif';
            ctx.fillText(failedShatter ? '💥' : '💨', cx, cy + 10);
        }
    }

    // 5. Left Info Board (Frosted Slate Panel)
    ctx.save();
    ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(30, 260, 320, 110, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('Anvil Enhancement Station', 45, 285);

    ctx.font = 'bold 11px sans-serif';
    if (isPreAttempt) {
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`Target: ${itemName} +${nextLevel}`, 45, 312);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText(`Success Rate: ${rate}%`, 45, 332);
        ctx.fillText('Ready for hammer hit!', 45, 352);
    } else if (success) {
        ctx.fillStyle = '#34d399';
        ctx.fillText(`SUCCESS: ${itemName} +${nextLevel}! 🎉`, 45, 312);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText('Structural integrity reinforced!', 45, 332);
    } else {
        ctx.fillStyle = '#f43f5e';
        ctx.fillText('ATTEMPT FAILED! 💥', 45, 312);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText(failedShatter ? 'Item shattered / downgraded!' : 'Item structural integrity degraded.', 45, 332);
    }
    ctx.restore();

    return canvas.toBuffer();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('enhance')
        .setDescription('💎 Upgrade your weapons and shields at the anvil to boost stat modifiers')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The base equipment name to enhance')
                .setRequired(true)
                .addChoices(
                    { name: '⚔️ Iron Sword (+5 STR)', value: 'Iron Sword' },
                    { name: '🏹 Oak Bow (+5 DEX)', value: 'Oak Bow' },
                    { name: '🔮 Magic Staff (+5 INT)', value: 'Magic Staff' },
                    { name: '🔱 Gold Sword (+8 STR)', value: 'Gold Sword' },
                    { name: '🛡️ Wooden Shield (+3 DEF)', value: 'Wooden Shield' },
                    { name: '🧱 Plated Shield (+6 DEF)', value: 'Plated Shield' },
                    { name: '💍 Gold Ring (+5 LUC)', value: 'Gold Ring' }
                )),

    async execute(interaction) {
        const userId = interaction.user.id;
        const baseName = interaction.options.getString('name');

        // Verify Character
        const char = db.getCharacter(userId);
        if (!char || !char.char_name) {
            return interaction.reply({
                content: '⚠️ **You must create an RPG character first!** Use `/character create`.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        await interaction.deferReply();

        const inventory = db.getInventory(userId);

        // Find highest owned level of this base item
        let highestLevel = -1;
        let foundItemName = null;

        inventory.forEach(item => {
            if (item.quantity <= 0) return;
            if (item.itemName === baseName) {
                if (highestLevel < 0) {
                    highestLevel = 0;
                    foundItemName = baseName;
                }
            } else {
                const match = item.itemName.match(new RegExp(`^${baseName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\s\\+(\\d+)$`));
                if (match) {
                    const lvl = parseInt(match[1]);
                    if (lvl > highestLevel) {
                        highestLevel = lvl;
                        foundItemName = item.itemName;
                    }
                }
            }
        });

        if (highestLevel === -1) {
            return interaction.editReply(`❌ **You do not own any level of "${baseName}" in your inventory!** Forge it first using \`/forge\`.`);
        }

        if (highestLevel >= 10) {
            return interaction.editReply(`✨ **Your "${foundItemName}" is already at the maximum enhancement level (+10)!**`);
        }

        const nextLvl = highestLevel + 1;
        const nextItemName = `${baseName} +${nextLvl}`;
        const req = getUpgradeReqs(nextLvl);

        const checkMaterial = (matName, reqQty) => {
            if (reqQty <= 0) return { text: '', met: true };
            const invItem = inventory.find(i => i.itemName.toLowerCase() === matName.toLowerCase());
            const held = invItem ? invItem.quantity : 0;
            const met = held >= reqQty;
            return {
                text: `${met ? '✅' : '❌'} **${matName}**: \` ${held} / ${reqQty} \` held\n`,
                met
            };
        };

        const m1 = checkMaterial('Stone', req.stones);
        const m2 = checkMaterial('Coal', req.coal);
        const m3 = checkMaterial('Iron Ore', req.iron);
        const m4 = checkMaterial('Gold Ore', req.gold);
        const m5 = checkMaterial('Diamond', req.diamonds);

        const checklistText = m1.text + m2.text + m3.text + m4.text + m5.text;
        const allMatsMet = m1.met && m2.met && m3.met && m4.met && m5.met;

        const currentBonus = db.getItemBonus(foundItemName);
        const nextBonus = db.getItemBonus(nextItemName);

        const enhanceBtn = new ButtonBuilder()
            .setCustomId('enhance_btn_confirm')
            .setLabel(`Attempt +${nextLvl} Enhance`)
            .setStyle(ButtonStyle.Primary)
            .setEmoji('💎')
            .setDisabled(!allMatsMet);

        const row = new ActionRowBuilder().addComponents(enhanceBtn);

        const generatePayload = () => {
            const buffer = drawEnhanceCard(baseName, false, nextLvl, req.rate, true, false);
            const attachment = new AttachmentBuilder(buffer, { name: 'anvil-preview.png' });

            const embed = new EmbedBuilder()
                .setColor('#6366f1')
                .setTitle('💎 BLACKSMITH ENHANCEMENT ANVIL')
                .setDescription(
                    `Upgrade your gear to boost its combat attributes!\n\n` +
                    `⚒️ **Target Item:** **${foundItemName}** ➡️ **${nextItemName}**\n` +
                    `📈 **Bonus Scale:** \`${currentBonus.stat.replace('stat_', '').toUpperCase()} +${currentBonus.bonus}\` ➡️ \`${nextBonus.stat.replace('stat_', '').toUpperCase()} +${nextBonus.bonus}\`\n` +
                    `🎯 **Success Chance:** \` ${req.rate}% \` probability\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                    `📜 **Required Resources:**\n` +
                    `${checklistText}\n` +
                    (allMatsMet ? '✅ **Ready to enhance!** Click the button below to forge.' : '❌ **Insufficient resources in your bag.**')
                )
                .setImage('attachment://anvil-preview.png')
                .setFooter({ text: 'Warning: Upgrades beyond +3 can drop in level on failure. Going for +10 drops to +5!' })
                .setTimestamp();

            return { embeds: [embed], files: [attachment], components: [row] };
        };

        const msg = await interaction.editReply(generatePayload());

        const collector = msg.createMessageComponentCollector({
            filter: i => i.user.id === userId,
            time: 90000
        });

        collector.on('collect', async (i) => {
            if (i.customId === 'enhance_btn_confirm') {
                collector.stop('completed');
                await i.deferUpdate();

                // Double check materials
                const freshInventory = db.getInventory(userId);
                const check1 = checkMaterial('Stone', req.stones);
                const check2 = checkMaterial('Coal', req.coal);
                const check3 = checkMaterial('Iron Ore', req.iron);
                const check4 = checkMaterial('Gold Ore', req.gold);
                const check5 = checkMaterial('Diamond', req.diamonds);

                if (!check1.met || !check2.met || !check3.met || !check4.met || !check5.met) {
                    return interaction.editReply({ content: '❌ Upgrade failed. You no longer have the required resources.', components: [] });
                }

                // 1. Deduct materials
                if (req.stones > 0) db.removeItem(userId, 'Stone', req.stones);
                if (req.coal > 0) db.removeItem(userId, 'Coal', req.coal);
                if (req.iron > 0) db.removeItem(userId, 'Iron Ore', req.iron);
                if (req.gold > 0) db.removeItem(userId, 'Gold Ore', req.gold);
                if (req.diamonds > 0) db.removeItem(userId, 'Diamond', req.diamonds);

                // 2. Roll Success
                const roll = Math.random() * 100;
                const isSuccess = roll <= req.rate;

                if (isSuccess) {
                    // Remove old item, add new item
                    db.removeItem(userId, foundItemName, 1);
                    db.addItem(userId, nextItemName, 1);

                    db.logTransaction(userId, 'Gear Enhance Success', `Upgraded ${foundItemName} to +${nextLvl} 🎉`);

                    const successBuffer = drawEnhanceCard(baseName, true, nextLvl, req.rate, false, false);
                    const successAttachment = new AttachmentBuilder(successBuffer, { name: 'enhance-success.png' });

                    const successEmbed = new EmbedBuilder()
                        .setColor('#34d399')
                        .setTitle('🎉 SUCCESS! ITEM ENHANCED')
                        .setDescription(
                            `✨ **Anvil sparks fly!** You successfully reinforced the molecular bond of your gear!\n\n` +
                            `• **Old Item:** ~~${foundItemName}~~\n` +
                            `• **New Item:** **${nextItemName}** 🌟\n` +
                            `• **Stat Update:** \`${nextBonus.stat.replace('stat_', '').toUpperCase()} +${nextBonus.bonus}\` modifiers applied!\n\n` +
                            `*Note: If equipped, the bonuses are active instantly.*`
                        )
                        .setImage('attachment://enhance-success.png')
                        .setTimestamp();

                    await interaction.editReply({ embeds: [successEmbed], files: [successAttachment], components: [] });
                } else {
                    // Remove old item
                    db.removeItem(userId, foundItemName, 1);

                    // Determine Penalty
                    let penaltyText = '';
                    let isShattered = false;
                    if (nextLvl <= 3) {
                        // no fail possible, but logic safety:
                        db.addItem(userId, foundItemName, 1);
                        penaltyText = 'No penalty applied.';
                    } else if (nextLvl === 10) {
                        // Drops to +5
                        const resetName = `${baseName} +5`;
                        db.addItem(userId, resetName, 1);
                        penaltyText = `💥 **CRITICAL DOWNGRADE!** The item collapsed and dropped to **${resetName}**!`;
                        isShattered = true;
                    } else {
                        // Drops by 1 level
                        const downgradeLvl = highestLevel - 1;
                        const downgradeName = downgradeLvl === 0 ? baseName : `${baseName} +${downgradeLvl}`;
                        db.addItem(userId, downgradeName, 1);
                        penaltyText = `⚠️ **Downgraded:** The item lost structural integrity and fell to **${downgradeName}**.`;
                    }

                    db.logTransaction(userId, 'Gear Enhance Fail', `Failed upgrading ${foundItemName} to +${nextLvl}`);

                    const failBuffer = drawEnhanceCard(baseName, false, nextLvl, req.rate, false, isShattered);
                    const failAttachment = new AttachmentBuilder(failBuffer, { name: 'enhance-fail.png' });

                    const failEmbed = new EmbedBuilder()
                        .setColor('#f43f5e')
                        .setTitle('💥 FAILED! ENHANCEMENT FAILED')
                        .setDescription(
                            `🔥 **The metal crackled and snapped!** The upgrade attempt failed.\n\n` +
                            `• **Result:** ${penaltyText}\n\n` +
                            `*Gather more resources and try again!*`
                        )
                        .setImage('attachment://enhance-fail.png')
                        .setTimestamp();

                    await interaction.editReply({ embeds: [failEmbed], files: [failAttachment], components: [] });
                }
            }
        });

        collector.on('end', async (_, reason) => {
            if (reason !== 'completed') {
                const disabledBtn = ButtonBuilder.from(enhanceBtn).setDisabled(true);
                await interaction.editReply({ components: [new ActionRowBuilder().addComponents(disabledBtn)] }).catch(() => null);
            }
        });
    }
};
