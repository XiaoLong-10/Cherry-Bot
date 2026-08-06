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
const db = require('../database.js');
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');

// Draw cute pastel potion lab
function drawBrewCard(charName, recipe, checklistText, skillReq, alchemyLvl, isSuccess = false, newLvl = null, heatLevel = 'None', failed = false) {
    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext('2d');

    // Pastel Lab Background
    const bgGrad = ctx.createRadialGradient(400, 200, 50, 400, 200, 450);
    bgGrad.addColorStop(0, '#fdf2f8'); // Pink 50
    bgGrad.addColorStop(1, '#fbcfe8'); // Pink 200
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 800, 400);

    // Magical background bubbles
    ctx.fillStyle = 'rgba(244, 114, 182, 0.2)';
    const bubbles = [[100, 300, 15], [700, 250, 25], [150, 100, 10], [650, 80, 20]];
    bubbles.forEach(b => {
        ctx.beginPath();
        ctx.arc(b[0], b[1], b[2], 0, Math.PI * 2);
        ctx.fill();
    });

    // 1. Draw Heat Flame under flask (centered around x = 400, y = 240)
    if (heatLevel !== 'None' && !isSuccess) {
        ctx.save();
        ctx.shadowBlur = 15;
        if (heatLevel === 'Low') {
            ctx.fillStyle = '#06b6d4'; // Cyan flame
            ctx.shadowColor = '#22d3ee';
            ctx.beginPath();
            ctx.moveTo(380, 260);
            ctx.quadraticCurveTo(400, 200, 400, 210);
            ctx.quadraticCurveTo(400, 200, 420, 260);
            ctx.closePath();
            ctx.fill();
        } else if (heatLevel === 'Medium') {
            ctx.fillStyle = '#f97316'; // Orange flame
            ctx.shadowColor = '#fb923c';
            ctx.beginPath();
            ctx.moveTo(370, 260);
            ctx.quadraticCurveTo(400, 180, 395, 195);
            ctx.quadraticCurveTo(400, 175, 430, 260);
            ctx.closePath();
            ctx.fill();
        } else if (heatLevel === 'High') {
            ctx.fillStyle = '#ec4899'; // Pink/Purple raging fire
            ctx.shadowColor = '#f472b6';
            ctx.beginPath();
            ctx.moveTo(360, 260);
            ctx.quadraticCurveTo(390, 150, 385, 170);
            ctx.quadraticCurveTo(400, 140, 415, 170);
            ctx.quadraticCurveTo(410, 150, 440, 260);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }

    // 2. Draw Liquid inside Beaker (x = 400, y = 180)
    if (recipe && !failed) {
        ctx.save();
        // Set liquid color based on potion
        ctx.fillStyle = recipe.id === 'health_potion' ? 'rgba(244, 63, 94, 0.7)' : 'rgba(59, 130, 246, 0.7)';
        ctx.beginPath();
        // Trapezoid fill shape representing the liquid inside flask bulb
        ctx.moveTo(350, 190);
        ctx.lineTo(335, 218);
        ctx.arcTo(330, 240, 470, 240, 10);
        ctx.lineTo(465, 218);
        ctx.lineTo(450, 190);
        ctx.closePath();
        ctx.fill();

        // Draw boiling bubbles based on heat
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        let bubbleCount = 0;
        if (heatLevel === 'Low') bubbleCount = 3;
        else if (heatLevel === 'Medium') bubbleCount = 8;
        else if (heatLevel === 'High') bubbleCount = 18;

        for (let i = 0; i < bubbleCount; i++) {
            const bx = 350 + Math.random() * 100;
            const by = 190 + Math.random() * 45;
            const br = 2 + Math.random() * 5;
            ctx.beginPath();
            ctx.arc(bx, by, br, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    // 3. Draw Alembic Glass Flask Outline
    ctx.save();
    ctx.strokeStyle = failed ? '#9f1239' : '#831843'; // Red border if failed
    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(385, 90);
    ctx.lineTo(385, 130);
    ctx.lineTo(330, 220);
    ctx.arcTo(330, 240, 470, 240, 10);
    ctx.lineTo(470, 220);
    ctx.lineTo(415, 130);
    ctx.lineTo(415, 90);
    ctx.stroke();

    // Draw rim
    ctx.beginPath();
    ctx.roundRect(380, 85, 40, 7, 3);
    ctx.stroke();
    ctx.restore();

    // 4. Handle Success / Failure graphical details
    if (isSuccess) {
        // Star bursts
        ctx.save();
        ctx.fillStyle = '#facc15'; // Gold sparkles
        ctx.font = '30px sans-serif';
        ctx.fillText('⭐', 320, 120);
        ctx.fillText('✨', 460, 100);
        ctx.fillText('⭐', 450, 180);
        ctx.fillText('✨', 310, 200);
        ctx.restore();
    } else if (failed) {
        // Cracked beaker lines
        ctx.save();
        ctx.strokeStyle = '#9f1239';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(400, 150);
        ctx.lineTo(385, 175);
        ctx.lineTo(410, 195);
        ctx.lineTo(395, 220);
        ctx.stroke();

        ctx.font = '40px "Segoe UI Emoji", sans-serif';
        ctx.fillText('💨', 310, 150);
        ctx.fillText('💥', 450, 140);
        ctx.restore();
    }

    // Bottom Info panel
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(40, 280, 720, 90, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#be185d'; // Dark pink text
    ctx.font = 'bold 18px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'left';
    
    if (isSuccess) {
        ctx.fillText(`🎉 Successfully brewed: ${recipe.name}!`, 60, 315);
        ctx.fillStyle = '#db2777';
        ctx.font = '15px "Segoe UI", "Segoe UI Emoji", sans-serif';
        ctx.fillText(`Alchemy Level is now ${newLvl} 🌸`, 60, 345);
    } else if (failed) {
        ctx.fillText(`💥 Brewing Exploded! Heat was incorrect.`, 60, 315);
        ctx.fillStyle = '#9f1239';
        ctx.font = '15px "Segoe UI", "Segoe UI Emoji", sans-serif';
        ctx.fillText(`Your ingredients evaporated into dark sludge! Try setting the correct temperature.`, 60, 345);
    } else if (recipe) {
        ctx.fillText(`Brewing: ${recipe.name} (Current Heat: ${heatLevel})`, 60, 315);
        ctx.fillStyle = '#9d174d';
        ctx.font = '14px "Segoe UI", "Segoe UI Emoji", sans-serif';
        ctx.fillText(`Requires Alchemy Lvl ${skillReq} ┃ Hint: Set correct heat before brewing!`, 60, 345);
    } else {
        ctx.fillText(`Welcome to the Cute Potion Lab, ${charName}!`, 60, 330);
    }

    return canvas.toBuffer('image/png');
}

const BREW_RECIPES = {
    health_potion: {
        id: 'health_potion',
        name: 'Health Potion',
        emoji: '🧪',
        desc: 'Restores 50 HP. Essential for staying alive in combat.',
        mats: { 'Seaweed': 3 },
        skillReq: 1,
        idealHeat: 'Medium'
    },
    mana_potion: {
        id: 'mana_potion',
        name: 'Mana Potion',
        emoji: '🌀',
        desc: 'Restores 40 Mana. Fuel for casting magic spells.',
        mats: { 'Coal': 2, 'Seaweed': 1 },
        skillReq: 3,
        idealHeat: 'Low'
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('brew')
        .setDescription('🧪 Brew magical potions at the alchemy table using gathered ingredients'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild ? (interaction.guild ? interaction.guild.id : 'GLOBAL') : 'GLOBAL';

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
            .setCustomId('brew_select_item')
            .setPlaceholder('Choose a potion to brew...')
            .addOptions(Object.values(BREW_RECIPES).map(r => ({
                label: r.name,
                value: r.id,
                description: r.desc,
                emoji: r.emoji
            })));

        const heatBtn = new ButtonBuilder()
            .setCustomId('brew_btn_heat')
            .setLabel('Adjust Flame: None')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔥');

        const brewBtn = new ButtonBuilder()
            .setCustomId('brew_btn_confirm')
            .setLabel('Brew Potion')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🧪')
            .setDisabled(true);

        const generatePayload = () => {
            const r = selectedRecipeId ? BREW_RECIPES[selectedRecipeId] : null;
            const inventory = db.getInventory(userId);
            const { text, hasAll } = r ? getChecklistText(r, inventory) : { text: '', hasAll: false };
            const alchemyLvl = char.skill_alchemy || 1;

            const buffer = drawBrewCard(char.char_name, r, text, r ? r.skillReq : 1, alchemyLvl, false, null, currentHeat, failedState);
            const attachment = new AttachmentBuilder(buffer, { name: 'brew-lab.png' });

            const embed = new EmbedBuilder()
                .setColor('#ec4899')
                .setTitle('🧪 ALCHEMY RESEARCH STATION')
                .setAuthor({ name: `${char.char_name}'s Alchemy Desk`, iconURL: interaction.user.displayAvatarURL() })
                .setDescription('Select a potion from the select menu below to view its ingredients and brew it!')
                .setImage('attachment://brew-lab.png')
                .setTimestamp();

            heatBtn.setLabel(`Adjust Flame: ${currentHeat}`);
            if (currentHeat === 'Low') heatBtn.setStyle(ButtonStyle.Primary);
            else if (currentHeat === 'Medium') heatBtn.setStyle(ButtonStyle.Success);
            else if (currentHeat === 'High') heatBtn.setStyle(ButtonStyle.Danger);
            else heatBtn.setStyle(ButtonStyle.Secondary);

            if (r) {
                embed.addFields(
                    { name: '🧪 Active Research', value: `${r.emoji} **${r.name}**` },
                    { name: '📜 Materials Checklist', value: text },
                    { name: '🔥 Level Required', value: `Alchemy Lvl **${r.skillReq}** (Your Level: Lvl **${alchemyLvl}**)` }
                );

                if (alchemyLvl < r.skillReq) {
                    embed.setDescription('⚠️ **Your Alchemy level is too low to brew this potion!** Train by brewing lower tier potions.');
                } else if (!hasAll) {
                    embed.setDescription('❌ **You do not have the required ingredients!** Go fish or mine to gather them.');
                } else {
                    embed.setDescription('✅ **Ready to brew!** Set the flame to the recipe\'s ideal temperature, then click Brew!');
                }
            }

            const rowSelect = new ActionRowBuilder().addComponents(selectMenu);
            const rowBtns = new ActionRowBuilder().addComponents(heatBtn, brewBtn);

            return { embeds: [embed], files: [attachment], components: [rowSelect, rowBtns] };
        };

        const msg = await interaction.editReply(generatePayload());

        const collector = msg.createMessageComponentCollector({
            filter: i => i.user.id === userId,
            time: 180000 // 3 minutes
        });

        collector.on('collect', async (i) => {
            const r = selectedRecipeId ? BREW_RECIPES[selectedRecipeId] : null;

            if (i.customId === 'brew_select_item') {
                selectedRecipeId = i.values[0];
                const activeRec = BREW_RECIPES[selectedRecipeId];
                const inventory = db.getInventory(userId);
                const { hasAll } = getChecklistText(activeRec, inventory);
                const alchemyLvl = char.skill_alchemy || 1;

                brewBtn.setDisabled(!hasAll || alchemyLvl < activeRec.skillReq);

                await i.update(generatePayload());
            }
            else if (i.customId === 'brew_btn_heat') {
                const stages = ['None', 'Low', 'Medium', 'High'];
                const nextIdx = (stages.indexOf(currentHeat) + 1) % stages.length;
                currentHeat = stages[nextIdx];

                await i.update(generatePayload());
            }
            else if (i.customId === 'brew_btn_confirm') {
                await i.deferUpdate();

                const inventory = db.getInventory(userId);
                const { hasAll } = getChecklistText(r, inventory);
                const alchemyLvl = char.skill_alchemy || 1;

                if (!hasAll || alchemyLvl < r.skillReq) {
                    collector.stop('failed_mats');
                    return interaction.editReply({ content: '❌ Brewing failed due to invalid materials or level. Try again!', components: [] });
                }

                // Verify heat!
                if (currentHeat !== r.idealHeat) {
                    failedState = true;
                    collector.stop('exploded');

                    // Deduct materials anyway as penalty
                    for (const matName in r.mats) {
                        db.removeItem(userId, matName, r.mats[matName]);
                    }

                    const failBuffer = drawBrewCard(char.char_name, r, '', r.skillReq, alchemyLvl, false, null, currentHeat, true);
                    const failAttachment = new AttachmentBuilder(failBuffer, { name: 'brew-exploded.png' });

                    const failEmbed = new EmbedBuilder()
                        .setColor('#ef4444')
                        .setTitle('💥 ALCHEMY EXPLOSION!')
                        .setDescription(
                            `❌ Oh no! You set the heat flame to **${currentHeat}**, but this recipe needed **${r.idealHeat}** heat!\n` +
                            `The alembic flask cracked and your ingredients evaporated into dark, smelly soot!\n\n` +
                            `• **Penalty:** Materials consumed. Pay close attention to temperature hints next time!`
                        )
                        .setImage('attachment://brew-exploded.png')
                        .setTimestamp();

                    return interaction.editReply({
                        embeds: [failEmbed],
                        files: [failAttachment],
                        components: []
                    });
                }

                collector.stop('brewed');

                // 1. Remove Materials
                for (const matName in r.mats) {
                    db.removeItem(userId, matName, r.mats[matName]);
                }

                // 2. Add Potion
                db.addItem(userId, r.name, 1);

                // 3. Level Up Alchemy
                const newLvl = db.increaseSkill(userId, 'alchemy', 1);
                db.logTransaction(userId, 'Alchemy Brewing', `Brewed a ${r.name} 🧪`);

                const successBuffer = drawBrewCard(char.char_name, r, '', r.skillReq, alchemyLvl, true, newLvl, currentHeat, false);
                const successAttachment = new AttachmentBuilder(successBuffer, { name: 'brew-success.png' });

                const successEmbed = new EmbedBuilder()
                    .setColor('#ec4899')
                    .setTitle('🎉 Potion Brewed Successfully!')
                    .setDescription(
                        `🧪 You combined the ingredients inside the beaker, distilled the liquid, and brewed a pristine **${r.name}** ${r.emoji}!\n\n` +
                        `• **Item Added:** **${r.name}** x1 (added to artifacts vault)\n` +
                        `• **Consume Command:** Use \`/character use name:${r.name}\` to restore HP/Mana.\n` +
                        `• **Alchemy Level:** Increased to **Lvl ${newLvl}**!`
                    )
                    .setImage('attachment://brew-success.png')
                    .setTimestamp();

                await interaction.editReply({
                    embeds: [successEmbed],
                    files: [successAttachment],
                    components: []
                });
            }
        });

        collector.on('end', async (_, reason) => {
            if (reason !== 'brewed' && reason !== 'exploded' && reason !== 'failed_mats') {
                const disabledSelect = StringSelectMenuBuilder.from(selectMenu).setDisabled(true);
                const disabledHeat = ButtonBuilder.from(heatBtn).setDisabled(true);
                const disabledBrew = ButtonBuilder.from(brewBtn).setDisabled(true);
                
                const finalPayload = generatePayload();
                finalPayload.components = [
                    new ActionRowBuilder().addComponents(disabledSelect),
                    new ActionRowBuilder().addComponents(disabledHeat, disabledBrew)
                ];
                await interaction.editReply(finalPayload).catch(() => null);
            }
        });
    }
};
