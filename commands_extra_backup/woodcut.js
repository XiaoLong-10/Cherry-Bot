const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createCanvas } = require('canvas');
const db = require('../database.js');

const cooldowns = new Map();

async function drawWoodcuttingCard(charName, success, itemName, quantity, woodcutLvl, lvlUpText, coinReward, questProgressText) {
    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;

    // 1. Forest Clearing Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 400);
    bgGrad.addColorStop(0, '#fbcfe8'); // cute pink
    bgGrad.addColorStop(0.5, '#fdf4ff'); // light fuchsia
    bgGrad.addColorStop(1, '#fce7f3'); // pale pink
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 800, 400);

    // Tree trunks in background
    ctx.fillStyle = 'rgba(219, 39, 119, 0.1)';
    for (let i = 0; i < 8; i++) {
        ctx.fillRect(60 + i * 110, 0, 30, 400);
    }

    // Ground grass
    ctx.fillStyle = '#fce7f3';
    ctx.fillRect(0, 300, 800, 100);

    // 2. Large Tree Stump in Center
    // Stump base plate
    ctx.fillStyle = '#be185d'; // Cute Brownish pink
    ctx.beginPath();
    ctx.ellipse(360, 260, 90, 35, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wood rings inside stump
    ctx.fillStyle = '#db2777'; // Pinker rings
    ctx.beginPath();
    ctx.ellipse(360, 256, 82, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#f472b6'; // Cute pink rings
    ctx.lineWidth = 2;
    for (let r = 10; r < 75; r += 16) {
        ctx.beginPath();
        ctx.ellipse(360, 256, r, r * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();
    }

    // 3. Axe in stump
    ctx.save();
    ctx.font = '65px "Segoe UI Emoji", sans-serif';
    // Draw axe tilted
    ctx.fillText('🪓', 380, 220);
    ctx.restore();

    // 4. Gathered Item Emoji
    ctx.save();
    ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
    ctx.shadowBlur = 15;
    ctx.font = '85px "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let woodEmoji = '🪵';
    if (success) {
        if (itemName === 'Magic Wood') woodEmoji = '🔮';
        else if (itemName === 'Mahogany') woodEmoji = '🪵';
        else if (itemName === 'Oak Wood') woodEmoji = '🌳';
        else if (itemName === 'Pine Wood') woodEmoji = '🌲';
        else if (itemName === 'Twig') woodEmoji = '🌿';
    } else {
        woodEmoji = '❌';
    }

    ctx.fillText(woodEmoji, 540, 220);
    ctx.restore();

    // Wood chips flying
    ctx.fillStyle = '#f472b6';
    for (let i = 0; i < 6; i++) {
        ctx.fillRect(250 + Math.random() * 220, 210 + Math.random() * 80, 8, 4);
    }

    // 5. Left Info Board (Frosted glass panel overlay)
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(30, 280, 340, 100, 12);
    ctx.fill();
    ctx.stroke();

    // Status text
    ctx.fillStyle = '#831843';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`${charName}'s Lumber Session`, 50, 305);

    ctx.font = 'bold 11px sans-serif';
    if (success) {
        ctx.fillStyle = '#db2777';
        ctx.fillText(`CHOPPED: ${itemName} x${quantity}`, 50, 330);
    } else {
        ctx.fillStyle = '#be185d';
        ctx.fillText('LUMBER: Swing bounced off trunk!', 50, 330);
    }

    ctx.fillStyle = '#9d174d';
    ctx.font = '10px "Segoe UI Emoji", sans-serif';
    ctx.fillText(`Skill Level: Woodcutting Lvl ${woodcutLvl}`, 50, 350);

    if (lvlUpText) {
        ctx.fillStyle = '#f472b6';
        ctx.fillText('🎀 LEVEL UP!', 50, 368);
    } else if (coinReward > 0) {
        ctx.fillStyle = '#f472b6';
        ctx.fillText(`🍒 +${coinReward} cherries found!`, 50, 368);
    } else if (questProgressText) {
        ctx.fillStyle = '#c084fc';
        ctx.fillText('📌 Quest Progress updated!', 50, 368);
    }
    ctx.restore();

    return canvas.toBuffer('image/png');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('woodcut')
        .setDescription('🪓 Chop trees in the forest to gather timber and train your Woodcutting skill'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild ? (interaction.guild ? interaction.guild.id : 'GLOBAL') : 'GLOBAL';

        // 1. Verify Character Exists
        const char = db.getCharacter(userId);
        if (!char || !char.char_name) {
            return interaction.reply({
                content: '⚠️ **You must create an RPG character first!**\nUse **`/character create`** to get started.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        // 2. Check Cooldown (120,000ms / 2 minutes)
        const now = Date.now();
        if (cooldowns.has(userId)) {
            const expirationTime = cooldowns.get(userId) + 120000;
            if (now < expirationTime) {
                const timeLeft = Math.ceil((expirationTime - now) / 1000);
                return interaction.reply({
                    content: `⏳ You are exhausted! Please rest for **${timeLeft}** more seconds before woodcutting again.`,
                    flags: [MessageFlags.Ephemeral]
                });
            }
        }
        cooldowns.set(userId, now);

        await interaction.deferReply();

        const woodcuttingLvl = char.skill_woodcutting || 1;

        // Choose a random sweetspot zone
        const zones = ['left', 'center', 'right'];
        const targetZone = zones[Math.floor(Math.random() * zones.length)];
        
        let indicator = '`[ ░ 🎯 ░ ]` (Center)';
        if (targetZone === 'left') indicator = '`[ 🎯 ░ ░ ]` (Left)';
        else if (targetZone === 'right') indicator = '`[ ░ ░ 🎯 ]` (Right)';

        const leftBtn = new ButtonBuilder().setCustomId('woodcut_swing_left').setLabel('Swing Left').setStyle(ButtonStyle.Primary).setEmoji('◀️');
        const centerBtn = new ButtonBuilder().setCustomId('woodcut_swing_center').setLabel('Swing Center').setStyle(ButtonStyle.Primary).setEmoji('⏺️');
        const rightBtn = new ButtonBuilder().setCustomId('woodcut_swing_right').setLabel('Swing Right').setStyle(ButtonStyle.Primary).setEmoji('▶️');

        const buttonRow = new ActionRowBuilder().addComponents(leftBtn, centerBtn, rightBtn);

        const promptEmbed = new EmbedBuilder()
            .setColor('#38bdf8')
            .setAuthor({ name: `${char.char_name}'s Woodcutting Session`, iconURL: interaction.user.displayAvatarURL() })
            .setTitle('🎯 SWING FOCUS MINIGAME')
            .setDescription(
                `You have raised your heavy iron axe in front of a giant tree!\n` +
                `Focus your swing and click the matching button when the indicator reaches the sweetspot:\n\n` +
                `🎯 **Sweetspot Zone:** ${indicator}\n\n` +
                `*Timer: You have 10 seconds to swing! Hitting the sweetspot zone doubles your wood yield!*`
            )
            .setTimestamp();

        const msg = await interaction.editReply({
            embeds: [promptEmbed],
            components: [buttonRow]
        });

        const collector = msg.createMessageComponentCollector({
            filter: i => i.user.id === userId,
            time: 10000 // 10 seconds
        });

        let clickResolved = false;

        const processWoodcutting = async (buttonClickedId) => {
            clickResolved = true;

            // 1. Determine Sweetspot Match
            let sweetspotHit = false;
            if (buttonClickedId) {
                if (buttonClickedId === 'woodcut_swing_left' && targetZone === 'left') sweetspotHit = true;
                if (buttonClickedId === 'woodcut_swing_center' && targetZone === 'center') sweetspotHit = true;
                if (buttonClickedId === 'woodcut_swing_right' && targetZone === 'right') sweetspotHit = true;
            }

            const sweetspotMultiplier = sweetspotHit ? 2 : 1;

            // 2. Roll Success Chance (Vitality Bonus)
            const vitBonus = (char.stat_vit || 10) * 0.5; // +0.5% success per VIT point
            const successChance = Math.min(95, 70 + vitBonus + (woodcuttingLvl * 0.5));
            const rollSuccess = Math.random() * 100 < successChance;

            if (!rollSuccess) {
                const buffer = await drawWoodcuttingCard(char.char_name, false, '', 0, woodcuttingLvl, '', 0, '');
                const attachment = new AttachmentBuilder(buffer, { name: 'woodcutting-trip.png' });

                const failEmbed = new EmbedBuilder()
                    .setColor('#f43f5e')
                    .setAuthor({ name: `${char.char_name}'s Woodcutting Session`, iconURL: interaction.user.displayAvatarURL() })
                    .setDescription('🪓 You swung your iron axe at the trees, but your swings were sloppy, and you only dulled the blade without making any real progress. Try again!')
                    .setImage('attachment://woodcutting-trip.png')
                    .setTimestamp();
                return interaction.editReply({ embeds: [failEmbed], files: [attachment], components: [] });
            }

            // 3. Determine Drop Type
            const rollWood = Math.random() * 100;
            let itemName = '';
            let quantity = 1;
            let bonusMessage = '';

            if (rollWood < 2.0) { // 2% Magic Wood (Level 25)
                if (woodcuttingLvl >= 25) {
                    itemName = 'Magic Wood';
                    quantity = 1 * sweetspotMultiplier;
                } else {
                    itemName = 'Twig';
                    quantity = (Math.floor(Math.random() * 3) + 2) * sweetspotMultiplier;
                    bonusMessage = `\n🔮 *You struck a mystical, glowing Magic Tree! However, your Woodcutting level (Lvl ${woodcuttingLvl}) is too low (requires Lvl 25). The wood vaporized, and you only salvaged some Twigs.*`;
                }
            } else if (rollWood < 10.0) { // 8% Mahogany (Level 15)
                if (woodcuttingLvl >= 15) {
                    itemName = 'Mahogany';
                    quantity = 1 * sweetspotMultiplier;
                } else {
                    itemName = 'Twig';
                    quantity = (Math.floor(Math.random() * 3) + 2) * sweetspotMultiplier;
                    bonusMessage = `\n🪵 *You chopped a fine Mahogany tree! However, your Woodcutting level (Lvl ${woodcuttingLvl}) is too low (requires Lvl 15) to harvest it safely. You got Twigs instead.*`;
                }
            } else if (rollWood < 25.0) { // 15% Oak Wood (Level 5)
                if (woodcuttingLvl >= 5) {
                    itemName = 'Oak Wood';
                    quantity = (Math.floor(Math.random() * 2) + 1) * sweetspotMultiplier;
                } else {
                    itemName = 'Twig';
                    quantity = (Math.floor(Math.random() * 3) + 2) * sweetspotMultiplier;
                    bonusMessage = `\n🌳 *You chopped a sturdy Oak tree! However, your Woodcutting level (Lvl ${woodcuttingLvl}) is too low (requires Lvl 5) to harvest it. You got Twigs instead.*`;
                }
            } else if (rollWood < 50.0) { // 25% Pine Wood (Level 1)
                itemName = 'Pine Wood';
                quantity = (Math.floor(Math.random() * 3) + 1) * sweetspotMultiplier;
            } else { // 50% Twig (Level 1)
                itemName = 'Twig';
                quantity = (Math.floor(Math.random() * 3) + 2) * sweetspotMultiplier;
            }

            // 4. Grant Loot Items to Inventory
            db.addItem(userId, itemName, quantity);

            // 5. Roll for Bonus Coins (20% chance)
            let coinReward = 0;
            if (Math.random() < 0.20) {
                coinReward = Math.floor(Math.random() * 41) + 10; // 10 to 50 coins
                db.addCoins(userId, guildId, coinReward);
            }

            // 6. Track Quest Progress
            let questProgressText = '';
            if (char.active_quest_id === 'chop_5') {
                db.incrementQuestProgress(userId, 1);
                const currentProgress = (char.quest_progress || 0) + 1;
                questProgressText = `\n📌 **Quest Progress:** Forest Clearer (${currentProgress} / 5)`;
                if (currentProgress >= 5) {
                    questProgressText += ` (Completed! Run \`/quest claim\` for rewards)`;
                }
            }

            // 7. Handle Skill Level-Up (Progressive leveling chance)
            const lvlUpChance = 100 / (woodcuttingLvl + 2); // Level 1 = 33% chance, Level 10 = 8% chance, etc.
            let lvlUpText = '';
            if (Math.random() * 100 < lvlUpChance) {
                const newLvl = db.increaseSkill(userId, 'woodcutting', 1);
                lvlUpText = `\n🎉 **LEVEL UP!** Your Woodcutting level has increased to **Level ${newLvl}**!`;
            }

            // 8. Build and Send Embed Response
            const buffer = await drawWoodcuttingCard(char.char_name, true, itemName, quantity, woodcuttingLvl, lvlUpText, coinReward, questProgressText);
            const attachment = new AttachmentBuilder(buffer, { name: 'woodcutting-trip.png' });

            const sweetspotText = sweetspotHit ? `🎯 **SWEETSPOT DOUBLE YIELD HIT!** (x2 resources gained!)\n` : `💨 Missed the sweetspot zone (normal yield collected).\n`;

            const woodEmbed = new EmbedBuilder()
                .setColor(sweetspotHit ? '#10b981' : '#db2777')
                .setAuthor({ name: `${char.char_name}'s Woodcutting Session`, iconURL: interaction.user.displayAvatarURL() })
                .setDescription(
                    sweetspotText +
                    `🪓 You chopped down a tree and successfully gathered:\n` +
                    `• **${itemName}** x${quantity} (added to inventory)${bonusMessage}` +
                    (coinReward > 0 ? `\n🍒 **Bonus:** You found a small purse containing **${coinReward} cherries**!` : '') +
                    lvlUpText +
                    questProgressText
                )
                .setImage('attachment://woodcutting-trip.png')
                .setFooter({ text: `Current Woodcutting Level: Lvl ${lvlUpText ? woodcuttingLvl + 1 : woodcuttingLvl}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [woodEmbed], files: [attachment], components: [] });
        };

        collector.on('collect', async (i) => {
            collector.stop('clicked');
            await i.deferUpdate();
            await processWoodcutting(i.customId);
        });

        collector.on('end', async (_, reason) => {
            if (reason === 'time' && !clickResolved) {
                await processWoodcutting(null);
            }
        });
    }
};
