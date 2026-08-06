const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createCanvas } = require('canvas');
const db = require('../database.js');

const cooldowns = new Map();

async function drawMiningCard(charName, success, itemName, quantity, miningLvl, lvlUpText, coinReward, questProgressText) {
    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;

    // 1. Cute Pastel Cavern Background
    const caveGrad = ctx.createRadialGradient(400, 200, 50, 400, 200, 450);
    caveGrad.addColorStop(0, '#fce7f3'); // Soft Pink
    caveGrad.addColorStop(1, '#fbcfe8'); // Outer darkness
    ctx.fillStyle = caveGrad;
    ctx.fillRect(0, 0, 800, 400);

    // Cave wall crack lines
    ctx.strokeStyle = 'rgba(219, 39, 119, 0.2)';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(100 + i * 110, 0);
        ctx.lineTo(80 + i * 110, 400);
        ctx.stroke();
    }

    // 2. Draw Crystal/Ore Veins on walls
    const drawCrystalVein = (c, x, y, color, size = 15) => {
        c.save();
        c.fillStyle = color;
        c.shadowColor = color;
        c.shadowBlur = 10;
        c.beginPath();
        c.moveTo(x, y - size);
        c.lineTo(x + size, y);
        c.lineTo(x, y + size);
        c.lineTo(x - size, y);
        c.closePath();
        c.fill();
        c.restore();
    };

    drawCrystalVein(ctx, 150, 100, '#fbbf24'); // Gold
    drawCrystalVein(ctx, 650, 120, '#38bdf8'); // Diamond
    drawCrystalVein(ctx, 220, 280, '#94a3b8'); // Iron
    drawCrystalVein(ctx, 580, 260, '#334155'); // Coal

    // 3. Pickaxe impact in center
    ctx.save();
    ctx.font = '72px "Segoe UI Emoji", sans-serif';
    ctx.fillText('⛏️', 360, 180);
    ctx.restore();

    // 4. Gathered Item Emoji
    ctx.save();
    ctx.shadowColor = 'rgba(244, 114, 182, 0.5)';
    ctx.shadowBlur = 15;
    ctx.font = '85px "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let oreEmoji = '🪨';
    if (success) {
        if (itemName === 'Diamond') oreEmoji = '💎';
        else if (itemName === 'Gold Ore') oreEmoji = '🪙';
        else if (itemName === 'Iron Ore') oreEmoji = '🔩';
        else if (itemName === 'Coal') oreEmoji = '🔥';
        else if (itemName === 'Stone') oreEmoji = '🪨';
    } else {
        oreEmoji = '💨'; // Dust cloud on fail
    }

    ctx.fillText(oreEmoji, 520, 200);
    ctx.restore();

    // Sparkle impact emoji next to pickaxe
    ctx.font = '50px "Segoe UI Emoji", sans-serif';
    ctx.fillText('💥', 430, 160);

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
    ctx.fillText(`${charName}'s Expedition`, 50, 305);

    ctx.font = 'bold 11px sans-serif';
    if (success) {
        ctx.fillStyle = '#db2777';
        ctx.fillText(`MINED: ${itemName} x${quantity}`, 50, 330);
    } else {
        ctx.fillStyle = '#be185d';
        ctx.fillText('EXPEDITION: Swings bounce off!', 50, 330);
    }

    ctx.fillStyle = '#9d174d';
    ctx.font = '10px "Segoe UI Emoji", sans-serif';
    ctx.fillText(`Skill Level: Mining Lvl ${miningLvl}`, 50, 350);

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
        .setName('mine')
        .setDescription('⛏️ Mine in the cavern to gather ores and train your Mining skill'),

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
                    content: `⏳ You are exhausted! Please rest for **${timeLeft}** more seconds before mining again.`,
                    flags: [MessageFlags.Ephemeral]
                });
            }
        }
        cooldowns.set(userId, now);

        await interaction.deferReply();

        const miningLvl = char.skill_mining || 1;

        // Choose a random sweetspot zone
        const zones = ['left', 'center', 'right'];
        const targetZone = zones[Math.floor(Math.random() * zones.length)];
        
        let indicator = '`[ ░ 🎯 ░ ]` (Center)';
        if (targetZone === 'left') indicator = '`[ 🎯 ░ ░ ]` (Left)';
        else if (targetZone === 'right') indicator = '`[ ░ ░ 🎯 ]` (Right)';

        const leftBtn = new ButtonBuilder().setCustomId('mine_swing_left').setLabel('Swing Left').setStyle(ButtonStyle.Primary).setEmoji('◀️');
        const centerBtn = new ButtonBuilder().setCustomId('mine_swing_center').setLabel('Swing Center').setStyle(ButtonStyle.Primary).setEmoji('⏺️');
        const rightBtn = new ButtonBuilder().setCustomId('mine_swing_right').setLabel('Swing Right').setStyle(ButtonStyle.Primary).setEmoji('▶️');

        const buttonRow = new ActionRowBuilder().addComponents(leftBtn, centerBtn, rightBtn);

        const promptEmbed = new EmbedBuilder()
            .setColor('#38bdf8')
            .setAuthor({ name: `${char.char_name}'s Mining Expedition`, iconURL: interaction.user.displayAvatarURL() })
            .setTitle('🎯 SWING FOCUS MINIGAME')
            .setDescription(
                `A rich vein of mineral deposits is exposed!\n` +
                `Focus your swing and click the matching button when the indicator reaches the sweetspot:\n\n` +
                `🎯 **Sweetspot Zone:** ${indicator}\n\n` +
                `*Timer: You have 10 seconds to swing! Hitting the sweetspot zone doubles your mined resources!*`
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

        const processMining = async (buttonClickedId) => {
            clickResolved = true;

            // 1. Determine Sweetspot Match
            let sweetspotHit = false;
            if (buttonClickedId) {
                if (buttonClickedId === 'mine_swing_left' && targetZone === 'left') sweetspotHit = true;
                if (buttonClickedId === 'mine_swing_center' && targetZone === 'center') sweetspotHit = true;
                if (buttonClickedId === 'mine_swing_right' && targetZone === 'right') sweetspotHit = true;
            }

            const sweetspotMultiplier = sweetspotHit ? 2 : 1;

            // 2. Roll Success Chance (Strength Bonus)
            const strBonus = (char.stat_str || 10) * 0.5; // +0.5% success per STR point
            const successChance = Math.min(95, 70 + strBonus + (miningLvl * 0.5));
            const rollSuccess = Math.random() * 100 < successChance;

            if (!rollSuccess) {
                const buffer = await drawMiningCard(char.char_name, false, '', 0, miningLvl, '', 0, '');
                const attachment = new AttachmentBuilder(buffer, { name: 'mining-trip.png' });

                const failEmbed = new EmbedBuilder()
                    .setColor('#f43f5e')
                    .setAuthor({ name: `${char.char_name}'s Mining Expedition`, iconURL: interaction.user.displayAvatarURL() })
                    .setDescription('⛏️ You swung your pickaxe repeatedly against the hard cavern walls, but only chipped away useless dirt and common stone. Better luck next time!')
                    .setImage('attachment://mining-trip.png')
                    .setTimestamp();
                return interaction.editReply({ embeds: [failEmbed], files: [attachment], components: [] });
            }

            // 3. Determine Drop Type
            const rollOre = Math.random() * 100;
            let itemName = '';
            let quantity = 1;
            let bonusMessage = '';

            if (rollOre < 2.0) { // 2% Diamond (Level 25)
                if (miningLvl >= 25) {
                    itemName = 'Diamond';
                    quantity = 1 * sweetspotMultiplier;
                } else {
                    itemName = 'Stone';
                    quantity = (Math.floor(Math.random() * 4) + 2) * sweetspotMultiplier;
                    bonusMessage = `\n✨ *You spotted a sparkling Diamond! However, your Mining level (Lvl ${miningLvl}) is too low (requires Lvl 25). The gemstone shattered, leaving you with Stone.*`;
                }
            } else if (rollOre < 10.0) { // 8% Gold Ore (Level 15)
                if (miningLvl >= 15) {
                    itemName = 'Gold Ore';
                    quantity = 1 * sweetspotMultiplier;
                } else {
                    itemName = 'Stone';
                    quantity = (Math.floor(Math.random() * 4) + 2) * sweetspotMultiplier;
                    bonusMessage = `\n🏆 *You found a glimmering vein of Gold! However, your Mining level (Lvl ${miningLvl}) is too low (requires Lvl 15) to extract it safely. You got Stone instead.*`;
                }
            } else if (rollOre < 25.0) { // 15% Iron Ore (Level 5)
                if (miningLvl >= 5) {
                    itemName = 'Iron Ore';
                    quantity = (Math.floor(Math.random() * 2) + 1) * sweetspotMultiplier;
                } else {
                    itemName = 'Stone';
                    quantity = (Math.floor(Math.random() * 4) + 2) * sweetspotMultiplier;
                    bonusMessage = `\n🛡️ *You uncovered an Iron Ore node! However, your Mining level (Lvl ${miningLvl}) is too low (requires Lvl 5) to harvest it. You got Stone instead.*`;
                }
            } else if (rollOre < 50.0) { // 25% Coal (Level 1)
                itemName = 'Coal';
                quantity = (Math.floor(Math.random() * 3) + 1) * sweetspotMultiplier;
            } else { // 50% Stone (Level 1)
                itemName = 'Stone';
                quantity = (Math.floor(Math.random() * 4) + 2) * sweetspotMultiplier;
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
            if (char.active_quest_id === 'mine_5') {
                db.incrementQuestProgress(userId, 1);
                const currentProgress = (char.quest_progress || 0) + 1;
                questProgressText = `\n📌 **Quest Progress:** Cave Excavator (${currentProgress} / 5)`;
                if (currentProgress >= 5) {
                    questProgressText += ` (Completed! Run \`/quest claim\` for rewards)`;
                }
            }

            // 7. Handle Skill Level-Up (Progressive leveling chance)
            const lvlUpChance = 100 / (miningLvl + 2); // Level 1 = 33% chance, Level 10 = 8% chance, etc.
            let lvlUpText = '';
            if (Math.random() * 100 < lvlUpChance) {
                const newLvl = db.increaseSkill(userId, 'mining', 1);
                lvlUpText = `\n🎉 **LEVEL UP!** Your Mining level has increased to **Level ${newLvl}**!`;
            }

            // 8. Build and Send Embed Response
            const buffer = await drawMiningCard(char.char_name, true, itemName, quantity, miningLvl, lvlUpText, coinReward, questProgressText);
            const attachment = new AttachmentBuilder(buffer, { name: 'mining-trip.png' });

            const sweetspotText = sweetspotHit ? `🎯 **SWEETSPOT DOUBLE YIELD HIT!** (x2 resources gained!)\n` : `💨 Missed the sweetspot zone (normal yield collected).\n`;

            const mineEmbed = new EmbedBuilder()
                .setColor(sweetspotHit ? '#10b981' : '#db2777')
                .setAuthor({ name: `${char.char_name}'s Mining Expedition`, iconURL: interaction.user.displayAvatarURL() })
                .setDescription(
                    sweetspotText +
                    `⛏️ You swung your pickaxe into a rich ore deposit and successfully mined:\n` +
                    `• **${itemName}** x${quantity} (added to inventory)${bonusMessage}` +
                    (coinReward > 0 ? `\n🍒 **Bonus:** You dug up a small pouch containing **${coinReward} cherries**!` : '') +
                    lvlUpText +
                    questProgressText
                )
                .setImage('attachment://mining-trip.png')
                .setFooter({ text: `Current Mining Level: Lvl ${lvlUpText ? miningLvl + 1 : miningLvl}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [mineEmbed], files: [attachment], components: [] });
        };

        collector.on('collect', async (i) => {
            collector.stop('clicked');
            await i.deferUpdate();
            await processMining(i.customId);
        });

        collector.on('end', async (_, reason) => {
            if (reason === 'time' && !clickResolved) {
                await processMining(null);
            }
        });
    }
};
