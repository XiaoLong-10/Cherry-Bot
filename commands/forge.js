const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    MessageFlags,
    AttachmentBuilder
} = require('discord.js');
const { createCanvas } = require('canvas');
const db = require('../database.js');

function drawForgeCard(username, recipe, checklistText, reqLvl, currentLvl, isSuccess, newLvl = 0) {
    const canvas = createCanvas(800, 480);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;

    // 1. Soft Warm Pastel Forge Background
    const forgeGrad = ctx.createRadialGradient(400, 240, 50, 400, 240, 450);
    forgeGrad.addColorStop(0, '#ffedd5'); // Orange 100
    forgeGrad.addColorStop(1, '#fbcfe8'); // Pink 200
    ctx.fillStyle = forgeGrad;
    ctx.fillRect(0, 0, 800, 480);

    // Cute polka dots
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    for (let x = 0; x < 800; x += 40) {
        for (let y = 0; y < 480; y += 40) {
            ctx.beginPath();
            ctx.arc(x + 20, y + 20, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // 2. Left Panel (Heavy Anvil Station)
    const appX = 60;
    const appY = 60;
    const appW = 340;
    const appH = 360;

    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.strokeStyle = 'rgba(251, 146, 60, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(appX, appY, appW, appH, 12);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Center Equipment drawing
    const cx = appX + appW / 2;
    const cy = appY + appH / 2;

    ctx.save();
    if (isSuccess) {
        // Glowing orange heat aura
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 30;
        ctx.font = '110px "Segoe UI Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(recipe ? recipe.emoji : '⚔️', cx, cy - 20);
    } else {
        ctx.shadowColor = 'rgba(249, 115, 22, 0.2)';
        ctx.shadowBlur = 15;
        ctx.font = '95px "Segoe UI Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(recipe ? recipe.emoji : '🔨', cx, cy - 20);
    }
    ctx.restore();

    // Floating cute sparkles
    ctx.font = '22px "Segoe UI", "Segoe UI Emoji", sans-serif';
    const sparks = [
        { x: cx - 80, y: cy - 90, e: '🎀' },
        { x: cx + 80, y: cy - 70, e: '🌸' },
        { x: cx - 40, y: cy + 70, e: '✨' },
        { x: cx + 50, y: cy + 80, e: '✨' }
    ];
    sparks.forEach(s => {
        ctx.fillText(s.e, s.x, s.y);
    });

    ctx.fillStyle = '#9a3412';
    ctx.font = 'bold 11px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isSuccess ? 'CRAFTING COMPLETED 💖' : 'CUTE FORGE STANDBY', cx, cy + 120);

    // 3. Right Panel (Checklist / Success Ledger)
    const ledX = 420;
    const ledY = 60;
    const ledW = 320;
    const ledH = 360;

    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.strokeStyle = 'rgba(251, 146, 60, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(ledX, ledY, ledW, ledH, 16);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Title
    ctx.fillStyle = '#be123c'; // Rose 700
    ctx.font = 'bold 11px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🌸 CUTE FORGE TABLE 🌸', ledX + 20, ledY + 36);

    // Divider
    ctx.strokeStyle = 'rgba(251, 146, 60, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ledX + 20, ledY + 48);
    ctx.lineTo(ledX + ledW - 20, ledY + 48);
    ctx.stroke();

    if (isSuccess) {
        ctx.fillStyle = '#db2777';
        ctx.font = 'bold 16px "Segoe UI", "Segoe UI Emoji", sans-serif';
        ctx.fillText('💖 FORGING SUCCESSFUL', ledX + 20, ledY + 85);

        ctx.fillStyle = '#9f1239';
        ctx.font = '12px "Segoe UI", "Segoe UI Emoji", sans-serif';
        ctx.fillText('Item Crafted:', ledX + 20, ledY + 125);
        ctx.fillStyle = '#881337';
        ctx.font = 'bold 13px "Segoe UI", "Segoe UI Emoji", sans-serif';
        ctx.fillText(`1x ${recipe.name} ${recipe.emoji}`, ledX + 20, ledY + 145);

        ctx.fillStyle = '#9f1239';
        ctx.font = '12px "Segoe UI", "Segoe UI Emoji", sans-serif';
        ctx.fillText('Proficiency Advance:', ledX + 20, ledY + 195);
        ctx.fillStyle = '#be123c';
        ctx.font = 'bold 13px "Segoe UI", "Segoe UI Emoji", sans-serif';
        ctx.fillText(`Smithing Skill: Lvl ${newLvl}`, ledX + 20, ledY + 215);

        ctx.fillStyle = '#9a3412';
        ctx.font = '11px "Segoe UI", "Segoe UI Emoji", sans-serif';
        ctx.fillText('Use command: /character equip to equip gear', ledX + 20, ledY + 325);
    } else if (recipe) {
        ctx.fillStyle = '#881337';
        ctx.font = 'bold 14px "Segoe UI", "Segoe UI Emoji", sans-serif';
        ctx.fillText(recipe.name, ledX + 20, ledY + 80);

        ctx.fillStyle = '#9f1239';
        ctx.font = '11px "Segoe UI", "Segoe UI Emoji", sans-serif';
        // Wrap description
        const words = recipe.desc.split(' ');
        let line = '';
        let lineY = ledY + 100;
        for (let w = 0; w < words.length; w++) {
            const testLine = line + words[w] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > ledW - 40) {
                ctx.fillText(line, ledX + 20, lineY);
                line = words[w] + ' ';
                lineY += 15;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, ledX + 20, lineY);

        // Materials Checklist
        ctx.fillStyle = '#be123c';
        ctx.font = 'bold 11px "Segoe UI", "Segoe UI Emoji", sans-serif';
        ctx.fillText('Required Materials:', ledX + 20, ledY + 175);

        // Print raw checklist text nicely without markdown stars
        const rawChecklist = checklistText.replace(/\*\*|\*/g, '').split('\n');
        let checkY = ledY + 195;
        rawChecklist.forEach(line => {
            if (line.trim().length > 0) {
                ctx.fillStyle = line.includes('✅') ? '#db2777' : '#be185d';
                ctx.font = '11px "Segoe UI", "Segoe UI Emoji", sans-serif';
                ctx.fillText(line.trim(), ledX + 20, checkY);
                checkY += 20;
            }
        });

        // Skill Requirements
        ctx.fillStyle = '#be123c';
        ctx.font = 'bold 11px "Segoe UI", "Segoe UI Emoji", sans-serif';
        ctx.fillText('Blackboard Requirements:', ledX + 20, ledY + 280);

        ctx.fillStyle = currentLvl >= reqLvl ? '#db2777' : '#be185d';
        ctx.font = '11px "Segoe UI", "Segoe UI Emoji", sans-serif';
        ctx.fillText(`Requires Smithing Lvl ${reqLvl} (You: Lvl ${currentLvl})`, ledX + 20, ledY + 300);
    } else {
        ctx.fillStyle = '#9a3412';
        ctx.font = 'italic 12px "Segoe UI", "Segoe UI Emoji", sans-serif';
        ctx.fillText('Select a recipe to commence...', ledX + 20, ledY + 120);
    }

    return canvas.toBuffer('image/png');
}

const FORGE_RECIPES = {
    iron_sword: {
        id: 'iron_sword',
        name: 'Iron Sword',
        slot: 'weapon',
        emoji: '⚔️',
        desc: 'A sturdy physical blade. Stats: +5 STR.',
        mats: { 'Iron Ore': 5, 'Twig': 2 },
        skillReq: 1
    },
    oak_bow: {
        id: 'oak_bow',
        name: 'Oak Bow',
        slot: 'weapon',
        emoji: '🏹',
        desc: 'A flexible ranged weapon. Stats: +5 DEX.',
        mats: { 'Oak Wood': 6, 'Twig': 4 },
        skillReq: 5
    },
    magic_staff: {
        id: 'magic_staff',
        name: 'Magic Staff',
        slot: 'weapon',
        emoji: '🔮',
        desc: 'A wooden staff charged with mana. Stats: +5 INT.',
        mats: { 'Magic Wood': 4, 'Coal': 2 },
        skillReq: 10
    },
    gold_sword: {
        id: 'gold_sword',
        name: 'Gold Sword',
        slot: 'weapon',
        emoji: '🔱',
        desc: 'A precious gilded blade. Stats: +8 STR.',
        mats: { 'Gold Ore': 4, 'Twig': 2 },
        skillReq: 15
    },
    wooden_shield: {
        id: 'wooden_shield',
        name: 'Wooden Shield',
        slot: 'shield',
        emoji: '🛡️',
        desc: 'A simple barricade. Stats: +3 DEF.',
        mats: { 'Pine Wood': 6, 'Twig': 2 },
        skillReq: 1
    },
    plated_shield: {
        id: 'plated_shield',
        name: 'Plated Shield',
        slot: 'shield',
        emoji: '🧱',
        desc: 'An iron-reinforced aegis. Stats: +6 DEF.',
        mats: { 'Iron Ore': 8, 'Pine Wood': 4 },
        skillReq: 8
    },
    gold_ring: {
        id: 'gold_ring',
        name: 'Gold Ring',
        slot: 'shield',
        emoji: '💍',
        desc: 'A luck-infused ring. Stats: +5 LUC.',
        mats: { 'Gold Ore': 2, 'Diamond': 1 },
        skillReq: 12
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('forge')
        .setDescription('🔨 Forge weapons and shields at the blacksmith using raw materials'),

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

        let selectedRecipeId = null;

        const getChecklistText = (recipe, inventory) => {
            let text = '';
            let hasAll = true;
            for (const matName in recipe.mats) {
                const req = recipe.mats[matName];
                const invItem = inventory.find(i => i.itemName.toLowerCase() === matName.toLowerCase());
                const held = invItem ? invItem.quantity : 0;
                if (held >= req) {
                    text += `✅ **${matName}**: \` ${held} / ${req} \` held\n`;
                } else {
                    text += `❌ **${matName}**: \` ${held} / ${req} \` held\n`;
                    hasAll = false;
                }
            }
            return { text, hasAll };
        };

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('forge_select_item')
            .setPlaceholder('Choose a weapon or shield to forge...')
            .addOptions(Object.values(FORGE_RECIPES).map(r => ({
                label: r.name,
                value: r.id,
                description: r.desc,
                emoji: r.emoji
            })));

        const forgeBtn = new ButtonBuilder()
            .setCustomId('forge_btn_confirm')
            .setLabel('Forge Equipment')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🔨')
            .setDisabled(true);

        const rowSelect = new ActionRowBuilder().addComponents(selectMenu);
        const rowBtns = new ActionRowBuilder().addComponents(forgeBtn);

        const generatePayload = () => {
            const r = selectedRecipeId ? FORGE_RECIPES[selectedRecipeId] : null;
            const inventory = db.getInventory(userId);
            const { text, hasAll } = r ? getChecklistText(r, inventory) : { text: '', hasAll: false };
            const smithingLvl = char.skill_smithing || 1;

            const buffer = drawForgeCard(char.char_name, r, text, r ? r.skillReq : 1, smithingLvl, false);
            const attachment = new AttachmentBuilder(buffer, { name: 'forge-smith.png' });

            const embed = new EmbedBuilder()
                .setColor('#b45309')
                .setTitle('🔨 BLACKSMITH ANVIL')
                .setAuthor({ name: `${char.char_name}'s Smithing Station`, iconURL: interaction.user.displayAvatarURL() })
                .setDescription('Select a piece of equipment from the select menu below to view its ingredients and forge it!')
                .setImage('attachment://forge-smith.png')
                .setTimestamp();

            if (r) {
                embed.addFields(
                    { name: '🛠️ Active Project', value: `${r.emoji} **${r.name}**` },
                    { name: '📜 Materials Checklist', value: text },
                    { name: '🔥 Level Required', value: `Smithing Lvl **${r.skillReq}** (Your Level: Lvl **${smithingLvl}**)` }
                );

                if (smithingLvl < r.skillReq) {
                    embed.setDescription('⚠️ **Your Smithing level is too low to forge this item!** Train by crafting lower tier gear.');
                } else if (!hasAll) {
                    embed.setDescription('❌ **You do not have the required materials in your inventory!** Go mine or woodcut to gather them.');
                } else {
                    embed.setDescription('✅ **Ready to forge!** Click the confirmation button below to begin forging.');
                }
            }

            return { embeds: [embed], files: [attachment], components: [rowSelect, rowBtns] };
        };

        const msg = await interaction.editReply(generatePayload());

        const collector = msg.createMessageComponentCollector({
            filter: i => i.user.id === userId,
            time: 180000 // 3 minutes
        });

        collector.on('collect', async (i) => {
            if (i.customId === 'forge_select_item') {
                selectedRecipeId = i.values[0];
                const r = FORGE_RECIPES[selectedRecipeId];
                const inventory = db.getInventory(userId);
                const { hasAll } = getChecklistText(r, inventory);
                const smithingLvl = char.skill_smithing || 1;

                forgeBtn.setDisabled(!hasAll || smithingLvl < r.skillReq);

                await i.update(generatePayload());
            }
            else if (i.customId === 'forge_btn_confirm') {
                collector.stop('forged');
                await i.deferUpdate();

                const r = FORGE_RECIPES[selectedRecipeId];
                const inventory = db.getInventory(userId);
                const { hasAll } = getChecklistText(r, inventory);
                const smithingLvl = char.skill_smithing || 1;

                if (!hasAll || smithingLvl < r.skillReq) {
                    return interaction.editReply({ content: '❌ Forging failed due to invalid materials or level. Try again!', components: [] });
                }

                // 1. Remove Materials
                for (const matName in r.mats) {
                    db.removeItem(userId, matName, r.mats[matName]);
                }

                // 2. Add Crafted Item
                db.addItem(userId, r.name, 1);

                // 3. Level Up Smithing
                const newLvl = db.increaseSkill(userId, 'smithing', 1);
                db.logTransaction(userId, 'Smithing Forge', `Forged a ${r.name} 🔨`);

                const successBuffer = drawForgeCard(char.char_name, r, '', r.skillReq, smithingLvl, true, newLvl);
                const successAttachment = new AttachmentBuilder(successBuffer, { name: 'forge-success.png' });

                const successEmbed = new EmbedBuilder()
                    .setColor('#fbcfe8')
                    .setTitle('🎉 Equipment Forged Successfully!')
                    .setDescription(
                        `🔥 You heated the bellows, hammered the ingot, and successfully forged a brand new **${r.name}** ${r.emoji}!\n\n` +
                        `• **Item Added:** **${r.name}** x1 (added to artifacts vault)\n` +
                        `• **Equip Command:** Use \`/character equip name:${r.name}\` to wield it.\n` +
                        `• **Smithing Level:** Increased to **Lvl ${newLvl}**!`
                    )
                    .setImage('attachment://forge-success.png')
                    .setTimestamp();

                await interaction.editReply({
                    embeds: [successEmbed],
                    files: [successAttachment],
                    components: []
                });
            }
        });

        collector.on('end', async (_, reason) => {
            if (reason !== 'forged') {
                const disabledSelect = StringSelectMenuBuilder.from(selectMenu).setDisabled(true);
                const disabledForge = ButtonBuilder.from(forgeBtn).setDisabled(true);
                
                const finalPayload = generatePayload();
                finalPayload.components = [
                    new ActionRowBuilder().addComponents(disabledSelect),
                    new ActionRowBuilder().addComponents(disabledForge)
                ];
                await interaction.editReply(finalPayload).catch(() => null);
            }
        });
    }
};
