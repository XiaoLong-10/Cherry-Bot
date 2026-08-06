const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    MessageFlags,
    AttachmentBuilder,
    StringSelectMenuBuilder
} = require('discord.js');
const { createCanvas } = require('canvas');
const db = require('../database.js');

function drawCookCard(charName, recipe, heatLevel = 'None', isSuccess = false, newLvl = null, failed = false) {
    const width = 800;
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 1. Cozy amber/peach kitchen stove background
    const bgGrad = ctx.createRadialGradient(400, 200, 50, 400, 200, 450);
    bgGrad.addColorStop(0, '#fffbeb'); // Amber 50
    bgGrad.addColorStop(1, '#fde68a'); // Amber 200
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Decorative wall grid tile lines
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.2)';
    ctx.lineWidth = 2;
    for (let x = 0; x < width; x += 60) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 60) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // 2. Draw Cook Stove Flame under skillet (centered around x = 400, y = 220)
    if (heatLevel !== 'None' && !isSuccess) {
        ctx.save();
        ctx.shadowBlur = 15;
        if (heatLevel === 'Low') {
            ctx.fillStyle = '#06b6d4'; // blue simmer
            ctx.shadowColor = '#22d3ee';
            ctx.beginPath();
            ctx.moveTo(370, 230);
            ctx.quadraticCurveTo(400, 185, 400, 195);
            ctx.quadraticCurveTo(400, 185, 430, 230);
            ctx.fill();
        } else if (heatLevel === 'Medium') {
            ctx.fillStyle = '#f97316'; // orange flame
            ctx.shadowColor = '#fb923c';
            ctx.beginPath();
            ctx.moveTo(360, 230);
            ctx.quadraticCurveTo(400, 165, 395, 180);
            ctx.quadraticCurveTo(400, 160, 440, 230);
            ctx.fill();
        } else if (heatLevel === 'High') {
            ctx.fillStyle = '#ec4899'; // pink grease fire
            ctx.shadowColor = '#f472b6';
            ctx.beginPath();
            ctx.moveTo(350, 230);
            ctx.quadraticCurveTo(390, 140, 385, 160);
            ctx.quadraticCurveTo(400, 130, 415, 160);
            ctx.quadraticCurveTo(410, 140, 450, 230);
            ctx.fill();
        }
        ctx.restore();
    }

    // 3. Draw Skillet/Pan (x = 400, y = 210)
    // Pan Handle
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(200, 205, 100, 10);

    // Pan Outer Body
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(280, 190, 240, 40, 15);
    ctx.fill();

    // Pan Inside
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(285, 195, 230, 30, 12);
    ctx.fill();

    // 4. Draw Food inside pan
    if (recipe && !failed) {
        ctx.save();
        ctx.font = '35px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(recipe.emoji, 400, 210);
        ctx.restore();

        // Sizzle particles based on heat
        ctx.fillStyle = '#fef08a';
        let sparks = 0;
        if (heatLevel === 'Low') sparks = 2;
        else if (heatLevel === 'Medium') sparks = 5;
        else if (heatLevel === 'High') sparks = 12;

        for (let i = 0; i < sparks; i++) {
            const sx = 300 + Math.random() * 200;
            const sy = 185 + Math.random() * 15;
            const sr = 1 + Math.random() * 2;
            ctx.beginPath();
            ctx.arc(sx, sy, sr, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // 5. Success / Failure overlays
    if (isSuccess) {
        ctx.save();
        ctx.font = '70px "Segoe UI Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🍽️', 400, 110);
        ctx.restore();

        // Sparkle indicators
        ctx.fillStyle = '#fbbf24';
        ctx.font = '22px sans-serif';
        ctx.fillText('✨', 320, 90);
        ctx.fillText('✨', 480, 100);
    } else if (failed) {
        ctx.save();
        ctx.font = '45px "Segoe UI Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('💨', 330, 140);
        ctx.fillText('🌑', 400, 130); // Charcoal lump
        ctx.fillText('💨', 470, 145);
        ctx.restore();
    }

    // 6. Bottom Info board (Cozy plate panel)
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(40, 280, 720, 90, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#b45309'; // Warm brown text
    ctx.font = 'bold 18px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';

    if (isSuccess) {
        ctx.fillText(`🎉 Cooked successfully: ${recipe.name}!`, 60, 315);
        ctx.fillStyle = '#d97706';
        ctx.font = '15px sans-serif';
        ctx.fillText(`Cooking Level is now Level ${newLvl} 🌾`, 60, 345);
    } else if (failed) {
        ctx.fillText(`💥 Cooking Burnt to a Crisp!`, 60, 315);
        ctx.fillStyle = '#ef4444';
        ctx.font = '15px sans-serif';
        ctx.fillText('Heat level was too high or low! Ingredients evaporated into gray ash.', 60, 345);
    } else if (recipe) {
        ctx.fillText(`Cooking: ${recipe.name} (Current Heat: ${heatLevel})`, 60, 315);
        ctx.fillStyle = '#d97706';
        ctx.font = '14px sans-serif';
        ctx.fillText(`Requires Cooking Lvl ${recipe.skillReq} ┃ Set correct heat temperature before starting!`, 60, 345);
    } else {
        ctx.fillText(`Welcome to the Gourmet Kitchen, ${charName}!`, 60, 330);
    }
    ctx.restore();

    return canvas.toBuffer();
}

const COOK_RECIPES = {
    seared_steak: {
        id: 'seared_steak',
        name: 'Seared Steak',
        emoji: '🥩',
        desc: 'Restores 60 HP. Thick cuts of raw meat pan-seared to perfection.',
        mats: { 'Raw Meat': 2 },
        skillReq: 1,
        idealHeat: 'High'
    },
    baked_salmon: {
        id: 'baked_salmon',
        name: 'Baked Salmon',
        emoji: '🐟',
        desc: 'Restores 50 HP and 10 Mana. Baked fresh water salmon fish.',
        mats: { 'Raw Fish': 2 },
        skillReq: 3,
        idealHeat: 'Low'
    },
    gourmet_feast: {
        id: 'gourmet_feast',
        name: 'Gourmet Feast',
        emoji: '🍱',
        desc: 'Restores 100 HP and 30 Mana. A luxurious combination of seasoned meat, fish, and wheat.',
        mats: { 'Raw Meat': 1, 'Raw Fish': 1, 'Wheat': 1 },
        skillReq: 8,
        idealHeat: 'Medium'
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cook')
        .setDescription('🍳 Cook raw ingredients into stats-restoring culinary dishes')
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('📜 View all cooking recipes and heat requirements'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('make')
                .setDescription('🍳 Start the interactive stove and cook a dish')),

    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild ? (interaction.guild ? interaction.guild.id : 'GLOBAL') : 'GLOBAL';
        const subcommand = interaction.options.getSubcommand();

        // Verify Character
        const char = db.getCharacter(userId);
        if (!char || !char.char_name) {
            return interaction.reply({
                content: '⚠️ **You must create an RPG character first!** Use `/character create`.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        await interaction.deferReply();

        if (subcommand === 'list') {
            const listEmbed = new EmbedBuilder()
                .setColor('#f59e0b')
                .setTitle('📜 GOURMET COOKING RECIPES BOOK')
                .setDescription('Gather materials, set the stove heat correctly, and cook items!')
                .setTimestamp();

            for (const r of Object.values(COOK_RECIPES)) {
                let matsText = '';
                for (const m in r.mats) {
                    matsText += `• **${m}** (x${r.mats[m]})\n`;
                }
                listEmbed.addFields({
                    name: `${r.emoji} ${r.name} (Lvl ${r.skillReq} Req)`,
                    value: `${r.desc}\n**Ingredients Needed:**\n${matsText}**Ideal Stove Flame:** \` ${r.idealHeat} \` heat`
                });
            }

            return interaction.editReply({ embeds: [listEmbed] });
        }

        // --- SUBCOMMAND: MAKE ---
        let selectedRecipeId = null;
        let currentHeat = 'None';
        let failedState = false;

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
            .setCustomId('cook_select_item')
            .setPlaceholder('Choose a dish to cook...')
            .addOptions(Object.values(COOK_RECIPES).map(r => ({
                label: r.name,
                value: r.id,
                description: r.desc,
                emoji: r.emoji
            })));

        const heatBtn = new ButtonBuilder()
            .setCustomId('cook_btn_heat')
            .setLabel('Adjust Flame: None')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔥');

        const cookBtn = new ButtonBuilder()
            .setCustomId('cook_btn_confirm')
            .setLabel('Cook Dish')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🍳')
            .setDisabled(true);

        const generatePayload = () => {
            const r = selectedRecipeId ? COOK_RECIPES[selectedRecipeId] : null;
            const inventory = db.getInventory(userId);
            const { text, hasAll } = r ? getChecklistText(r, inventory) : { text: '', hasAll: false };
            const cookingLvl = char.skill_cooking || 1;

            const buffer = drawCookCard(char.char_name, r, currentHeat, false, null, failedState);
            const attachment = new AttachmentBuilder(buffer, { name: 'kitchen-stove.png' });

            const embed = new EmbedBuilder()
                .setColor('#f59e0b')
                .setTitle('🍳 GOURMET KITCHEN STOVE')
                .setAuthor({ name: `${char.char_name}'s Cooking Station`, iconURL: interaction.user.displayAvatarURL() })
                .setDescription('Select a dish from the select menu below to view its ingredients and start cooking!')
                .setImage('attachment://kitchen-stove.png')
                .setTimestamp();

            heatBtn.setLabel(`Adjust Flame: ${currentHeat}`);
            if (currentHeat === 'Low') heatBtn.setStyle(ButtonStyle.Primary);
            else if (currentHeat === 'Medium') heatBtn.setStyle(ButtonStyle.Success);
            else if (currentHeat === 'High') heatBtn.setStyle(ButtonStyle.Danger);
            else heatBtn.setStyle(ButtonStyle.Secondary);

            if (r) {
                embed.addFields(
                    { name: '🍳 Active Dish', value: `${r.emoji} **${r.name}**` },
                    { name: '📜 Ingredients Checklist', value: text },
                    { name: '🔥 Level Required', value: `Cooking Lvl **${r.skillReq}** (Your Level: Lvl **${cookingLvl}**)` }
                );

                if (cookingLvl < r.skillReq) {
                    embed.setDescription('⚠️ **Your Cooking level is too low to prepare this dish!**');
                } else if (!hasAll) {
                    embed.setDescription('❌ **You do not have the required ingredients!** Gather them first.');
                } else {
                    embed.setDescription('✅ **Ready to cook!** Adjust the stove fire, then click Cook!');
                }
            }

            const rowSelect = new ActionRowBuilder().addComponents(selectMenu);
            const rowBtns = new ActionRowBuilder().addComponents(heatBtn, cookBtn);

            return { embeds: [embed], files: [attachment], components: [rowSelect, rowBtns] };
        };

        const msg = await interaction.editReply(generatePayload());

        const collector = msg.createMessageComponentCollector({
            filter: i => i.user.id === userId,
            time: 180000 // 3 minutes
        });

        collector.on('collect', async (i) => {
            const r = selectedRecipeId ? COOK_RECIPES[selectedRecipeId] : null;

            if (i.customId === 'cook_select_item') {
                selectedRecipeId = i.values[0];
                const activeRec = COOK_RECIPES[selectedRecipeId];
                const inventory = db.getInventory(userId);
                const { hasAll } = getChecklistText(activeRec, inventory);
                const cookingLvl = char.skill_cooking || 1;

                cookBtn.setDisabled(!hasAll || cookingLvl < activeRec.skillReq);

                await i.update(generatePayload());
            }
            else if (i.customId === 'cook_btn_heat') {
                const stages = ['None', 'Low', 'Medium', 'High'];
                const nextIdx = (stages.indexOf(currentHeat) + 1) % stages.length;
                currentHeat = stages[nextIdx];

                await i.update(generatePayload());
            }
            else if (i.customId === 'cook_btn_confirm') {
                await i.deferUpdate();

                const inventory = db.getInventory(userId);
                const { hasAll } = getChecklistText(r, inventory);
                const cookingLvl = char.skill_cooking || 1;

                if (!hasAll || cookingLvl < r.skillReq) {
                    collector.stop('failed_mats');
                    return interaction.editReply({ content: '❌ Cooking failed due to missing ingredients or level. Try again!', components: [] });
                }

                // Verify heat level
                if (currentHeat !== r.idealHeat) {
                    failedState = true;
                    collector.stop('burnt');

                    // Deduct ingredients as penalty
                    for (const matName in r.mats) {
                        db.removeItem(userId, matName, r.mats[matName]);
                    }

                    const failBuffer = drawCookCard(char.char_name, r, currentHeat, false, null, true);
                    const failAttachment = new AttachmentBuilder(failBuffer, { name: 'cooking-burnt.png' });

                    const failEmbed = new EmbedBuilder()
                        .setColor('#ef4444')
                        .setTitle('🔥 COOKING DISASTER! MEAL BURNT')
                        .setDescription(
                            `❌ Oh no! You set the stove heat to **${currentHeat}**, but this recipe needed **${r.idealHeat}** heat!\n` +
                            `The skillet overheated and your food burnt to a crisp lump of charcoal!\n\n` +
                            `• **Penalty:** Ingredients consumed. Pay closer attention to heat levels next time!`
                        )
                        .setImage('attachment://cooking-burnt.png')
                        .setTimestamp();

                    return interaction.editReply({
                        embeds: [failEmbed],
                        files: [failAttachment],
                        components: []
                    });
                }

                collector.stop('cooked');

                // 1. Remove Materials
                for (const matName in r.mats) {
                    db.removeItem(userId, matName, r.mats[matName]);
                }

                // 2. Add Potion/Food to inventory
                db.addItem(userId, r.name, 1);

                // 3. Level Up Cooking Skill
                const newLvl = db.increaseSkill(userId, 'cooking', 1);
                db.logTransaction(userId, 'Cooking Meal', `Prepared a ${r.name} 🍳`);

                const successBuffer = drawCookCard(char.char_name, r, currentHeat, true, newLvl, false);
                const successAttachment = new AttachmentBuilder(successBuffer, { name: 'cooking-success.png' });

                const successEmbed = new EmbedBuilder()
                    .setColor('#10b981')
                    .setTitle('🎉 MEAL PREPARED SUCCESSFULLY!')
                    .setDescription(
                        `🍳 You combined the ingredients inside the skillet, adjusted the fire, and prepared a gourmet **${r.name}** ${r.emoji}!\n\n` +
                        `• **Item Added:** **${r.name}** x1 (added to inventory)\n` +
                        `• **Consume Command:** Use \`/character use name:${r.name}\` to restore HP/Mana.\n` +
                        `• **Cooking Level:** Increased to **Lvl ${newLvl}**!`
                    )
                    .setImage('attachment://cooking-success.png')
                    .setTimestamp();

                await interaction.editReply({
                    embeds: [successEmbed],
                    files: [successAttachment],
                    components: []
                });
            }
        });

        collector.on('end', async (_, reason) => {
            if (reason !== 'cooked' && reason !== 'burnt' && reason !== 'failed_mats') {
                const disabledSelect = StringSelectMenuBuilder.from(selectMenu).setDisabled(true);
                const disabledHeat = ButtonBuilder.from(heatBtn).setDisabled(true);
                const disabledCook = ButtonBuilder.from(cookBtn).setDisabled(true);
                
                const finalPayload = generatePayload();
                finalPayload.components = [
                    new ActionRowBuilder().addComponents(disabledSelect),
                    new ActionRowBuilder().addComponents(disabledHeat, disabledCook)
                ];
                await interaction.editReply(finalPayload).catch(() => null);
            }
        });
    }
};
