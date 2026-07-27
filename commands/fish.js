const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, MessageFlags } = require('discord.js');
const { createCanvas } = require('canvas');
const db = require('../database.js');

const cooldowns = new Map();

async function drawFishingCard(charName, success, itemName, quantity, fishingLvl, lvlUpText, coinReward, questProgressText) {
    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;

    // 1. Sunset Lake Background
    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 200);
    skyGrad.addColorStop(0, '#fbcfe8'); // Soft pink
    skyGrad.addColorStop(0.5, '#fce7f3'); // Lighter pink
    skyGrad.addColorStop(1, '#fdf4ff'); // Warm peach/white
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 800, 200);

    // Sunset Sun
    ctx.fillStyle = '#fbcfe8';
    ctx.beginPath();
    ctx.arc(400, 180, 50, 0, Math.PI, true); // half circle sun setting
    ctx.fill();

    // Purple Mountains silhouettes
    ctx.fillStyle = '#f472b6'; // pastel pink
    ctx.beginPath();
    ctx.moveTo(0, 200);
    ctx.lineTo(120, 140);
    ctx.lineTo(280, 200);
    ctx.lineTo(390, 160);
    ctx.lineTo(540, 200);
    ctx.lineTo(680, 130);
    ctx.lineTo(800, 200);
    ctx.closePath();
    ctx.fill();

    // Water gradient
    const waterGrad = ctx.createLinearGradient(0, 200, 0, 400);
    waterGrad.addColorStop(0, '#f9a8d4');
    waterGrad.addColorStop(1, '#f472b6');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, 200, 800, 200);

    // Water reflection lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    for (let y = 210; y < 400; y += 15) {
        const offset = Math.sin(y * 0.05) * 20;
        ctx.beginPath();
        ctx.moveTo(350 + offset, y);
        ctx.lineTo(450 - offset, y);
        ctx.stroke();
    }

    // 2. Pier/Dock (Left side)
    ctx.fillStyle = '#db2777'; // Pink wood
    ctx.fillRect(0, 190, 220, 30);
    // Pier posts
    ctx.fillRect(40, 190, 20, 100);
    ctx.fillRect(180, 190, 20, 100);

    // 3. Fishing Line & Rod
    ctx.strokeStyle = '#831843';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(210, 180); // Rod tip
    ctx.quadraticCurveTo(350, 230, 520, 270); // Line hanging to water
    ctx.stroke();

    // Water ripple around the hook
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(520, 270, 35, 12, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(520, 270, 60, 20, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 4. Draw Caught Item / Emoji
    ctx.save();
    ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
    ctx.shadowBlur = 15;
    ctx.font = '85px "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let catchEmoji = '🪝';
    if (success) {
        if (itemName === 'Shark') catchEmoji = '🦈';
        else if (itemName === 'Tuna') catchEmoji = '🐟';
        else if (itemName === 'Salmon') catchEmoji = '🍣';
        else if (itemName === 'Shrimp') catchEmoji = '🍤';
        else if (itemName === 'Seaweed') catchEmoji = '🌿';
    } else {
        catchEmoji = '💨'; // Water splash on escape
    }

    ctx.fillText(catchEmoji, 520, 250);
    ctx.restore();

    // 5. Left Info Board (Frosted glass panel overlay)
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(30, 280, 340, 100, 12);
    ctx.fill();
    ctx.stroke();

    // Status / Details text
    ctx.fillStyle = '#be185d';
    ctx.font = 'bold 13px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.fillText(`🎀 ${charName}'s Trip 🎀`, 50, 305);

    ctx.font = 'bold 11px "Segoe UI", "Segoe UI Emoji", sans-serif';
    if (success) {
        ctx.fillStyle = '#db2777';
        ctx.fillText(`CATCH: ${itemName} x${quantity}`, 50, 330);
    } else {
        ctx.fillStyle = '#fb7185';
        ctx.fillText('ESCAPE: Fish got away!', 50, 330);
    }

    ctx.fillStyle = '#db2777';
    ctx.font = '10px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.fillText(`Skill Level: Fishing Lvl ${fishingLvl}`, 50, 350);

    if (lvlUpText) {
        ctx.fillStyle = '#f472b6';
        ctx.fillText('🎉 LEVEL UP!', 50, 368);
    } else if (coinReward > 0) {
        ctx.fillStyle = '#f472b6';
        ctx.fillText(`🍒 +${coinReward} cherries found!`, 50, 368);
    } else if (questProgressText) {
        ctx.fillStyle = '#db2777';
        ctx.fillText('📌 Quest Progress updated!', 50, 368);
    }
    ctx.restore();

    return canvas.toBuffer('image/png');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fish')
        .setDescription('🎣 Cast your rod to catch fish and train your Fishing skill'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

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
                    content: `⏳ You are exhausted! Please rest for **${timeLeft}** more seconds before fishing again.`,
                    flags: [MessageFlags.Ephemeral]
                });
            }
        }
        cooldowns.set(userId, now);

        await interaction.deferReply();

        // 3. Roll Success Chance (Dexterity Bonus)
        const fishingLvl = char.skill_fishing || 1;
        const dexBonus = (char.stat_dex || 10) * 0.5; // +0.5% success per DEX point
        const successChance = Math.min(95, 70 + dexBonus + (fishingLvl * 0.5));
        const rollSuccess = Math.random() * 100 < successChance;

        if (!rollSuccess) {
            const buffer = await drawFishingCard(char.char_name, false, '', 0, fishingLvl, '', 0, '');
            const attachment = new AttachmentBuilder(buffer, { name: 'fishing-trip.png' });

            const failEmbed = new EmbedBuilder()
                .setColor('#f472b6')
                .setAuthor({ name: `🎀 ${char.char_name}'s Fishing Trip 🎀`, iconURL: interaction.user.displayAvatarURL() })
                .setDescription('🎣 You sat by the water for a long time. You felt a quick nibble, but pulled too early and the fish got away! Try again.')
                .setImage('attachment://fishing-trip.png')
                .setTimestamp();
            return interaction.editReply({ embeds: [failEmbed], files: [attachment] });
        }

        // 4. Determine Drop Type
        const rollFish = Math.random() * 100;
        let itemName = '';
        let quantity = 1;
        let bonusMessage = '';

        if (rollFish < 2.0) { // 2% Shark (Level 25)
            if (fishingLvl >= 25) {
                itemName = 'Shark';
                quantity = 1;
            } else {
                itemName = 'Seaweed';
                quantity = 1;
                bonusMessage = `\n🦈 *You hooked a massive, thrashing Shark! However, your Fishing level (Lvl ${fishingLvl}) is too low (requires Lvl 25). The line snapped, and you only reeled in some Seaweed.*`;
            }
        } else if (rollFish < 10.0) { // 8% Tuna (Level 15)
            if (fishingLvl >= 15) {
                itemName = 'Tuna';
                quantity = 1;
            } else {
                itemName = 'Seaweed';
                quantity = 1;
                bonusMessage = `\n🐟 *You caught a heavy bluefin Tuna! But your Fishing level (Lvl ${fishingLvl}) is too low (requires Lvl 15) to pull it in. You got Seaweed instead.*`;
            }
        } else if (rollFish < 28.0) { // 18% Salmon (Level 5)
            if (fishingLvl >= 5) {
                itemName = 'Salmon';
                quantity = Math.floor(Math.random() * 2) + 1;
            } else {
                itemName = 'Seaweed';
                quantity = 1;
                bonusMessage = `\n🍣 *You hooked a jumping Salmon! But your Fishing level (Lvl ${fishingLvl}) is too low (requires Lvl 5). It slipped off the hook, leaving you with Seaweed.*`;
            }
        } else if (rollFish < 68.0) { // 40% Shrimp (Level 1)
            itemName = 'Shrimp';
            quantity = Math.floor(Math.random() * 3) + 1;
        } else { // 32% Seaweed (Level 1)
            itemName = 'Seaweed';
            quantity = 1;
        }

        // 5. Grant Loot Items to Inventory
        db.addItem(userId, itemName, quantity);

        // 6. Roll for Bonus Coins (15% chance to find soggy treasure)
        let coinReward = 0;
        if (Math.random() < 0.15) {
            coinReward = Math.floor(Math.random() * 41) + 20; // 20 to 60 cherries
            db.addCoins(userId, guildId, coinReward);
        }

        // 7. Track Quest Progress
        let questProgressText = '';
        if (char.active_quest_id === 'fish_5') {
            db.incrementQuestProgress(userId, 1);
            const currentProgress = (char.quest_progress || 0) + 1;
            questProgressText = `\n📌 **Quest Progress:** Master Angler (${currentProgress} / 5)`;
            if (currentProgress >= 5) {
                questProgressText += ` (Completed! Run \`/quest claim\` for rewards)`;
            }
        }

        // 8. Handle Skill Level-Up (Progressive leveling chance)
        const lvlUpChance = 100 / (fishingLvl + 2); // Level 1 = 33% chance, Level 10 = 8% chance, etc.
        let lvlUpText = '';
        if (Math.random() * 100 < lvlUpChance) {
            const newLvl = db.increaseSkill(userId, 'fishing', 1);
            lvlUpText = `\n🎉 **LEVEL UP!** Your Fishing level has increased to **Level ${newLvl}**!`;
        }

        // 9. Build and Send Embed Response
        const buffer = await drawFishingCard(char.char_name, true, itemName, quantity, fishingLvl, lvlUpText, coinReward, questProgressText);
        const attachment = new AttachmentBuilder(buffer, { name: 'fishing-trip.png' });

        const fishEmbed = new EmbedBuilder()
            .setColor('#f472b6')
            .setAuthor({ name: `🎀 ${char.char_name}'s Fishing Trip 🎀`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(
                `🎣 You cast your fishing rod and successfully reeled in:\n` +
                `• **${itemName}** x${quantity} (added to inventory)${bonusMessage}` +
                (coinReward > 0 ? `\n🍒 **Bonus:** You reeled in a soggy leather boot containing **${coinReward} cherries**!` : '') +
                lvlUpText +
                questProgressText
            )
            .setImage('attachment://fishing-trip.png')
            .setFooter({ text: `Current Fishing Level: Lvl ${lvlUpText ? fishingLvl + 1 : fishingLvl}` })
            .setTimestamp();

        await interaction.editReply({ embeds: [fishEmbed], files: [attachment] });
    }
};
