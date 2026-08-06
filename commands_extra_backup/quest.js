const { SlashCommandBuilder, EmbedBuilder, MessageFlags, AttachmentBuilder } = require('discord.js');
const { createCanvas } = require('@napi-rs/canvas');
const db = require('../database.js');

const QUEST_CATALOG = {
    mine_5: {
        id: 'mine_5',
        title: '💎 Cave Excavator',
        desc: 'Mine 5 times in the cavern.',
        type: 'mine',
        target: 5,
        rewardCoins: 600,
        rewardXp: 200,
        rewardTitle: 'Cherry Excavator'
    },
    fish_5: {
        id: 'fish_5',
        title: '🐠 Master Angler',
        desc: 'Fish 5 times in the rivers.',
        type: 'fish',
        target: 5,
        rewardCoins: 600,
        rewardXp: 200,
        rewardTitle: 'Cherry Wave'
    },
    wood_5: {
        id: 'wood_5',
        title: '🪓 Forest Logger',
        desc: 'Woodcut 5 times in the forest.',
        type: 'woodcut',
        target: 5,
        rewardCoins: 600,
        rewardXp: 200,
        rewardTitle: 'Cherry Whisperer'
    },
    slots_3: {
        id: 'slots_3',
        title: '🎰 Jackpot Chaser',
        desc: 'Spin the progressive slots 3 times.',
        type: 'slots',
        target: 3,
        rewardCoins: 400,
        rewardXp: 100,
        rewardTitle: 'High Roller'
    },
    bj_3: {
        id: 'bj_3',
        title: '🃏 Blackjack Shark',
        desc: 'Play 3 rounds of Live Casino Blackjack.',
        type: 'blackjack',
        target: 3,
        rewardCoins: 400,
        rewardXp: 100,
        rewardTitle: 'Card Sharp'
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quest')
        .setDescription('📜 Manage your RPG quests and earn cherries, XP, and custom titles')
        .addSubcommand(sub =>
            sub.setName('board')
                .setDescription('📋 View the Guild Quest board and check your active progress'))
        .addSubcommand(sub =>
            sub.setName('start')
                .setDescription('✨ Accept an active quest from the board')
                .addStringOption(opt => 
                    opt.setName('id')
                        .setDescription('The ID of the quest to accept')
                        .setRequired(true)
                        .addChoices(
                            { name: '💎 Cave Excavator (Mine 5x)', value: 'mine_5' },
                            { name: '🐠 Master Angler (Fish 5x)', value: 'fish_5' },
                            { name: '🪓 Forest Logger (Woodcut 5x)', value: 'wood_5' },
                            { name: '🎰 Jackpot Chaser (Spin Slots 3x)', value: 'slots_3' },
                            { name: '🃏 Blackjack Shark (Play Blackjack 3x)', value: 'bj_3' }
                        )))
        .addSubcommand(sub =>
            sub.setName('cancel')
                .setDescription('❌ Cancel your active quest (progress will be lost)'))
        .addSubcommand(sub =>
            sub.setName('claim')
                .setDescription('🎁 Claim rewards for a completed quest')),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;
        const guildId = interaction.guild ? (interaction.guild ? interaction.guild.id : 'GLOBAL') : 'GLOBAL';

        // Verify RPG character exists
        const char = db.getCharacter(userId);
        if (!char || !char.char_name) {
            return interaction.reply({
                content: '⚠️ **You must create an RPG character first!**\nUse **`/character create`** to get started.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        // --- SUBCOMMAND: BOARD ---
        if (subcommand === 'board') {
            await interaction.deferReply();

            const activeId = char.active_quest_id;
            const progress = char.quest_progress || 0;
            const hasActive = !!(activeId && QUEST_CATALOG[activeId]);
            const quest = hasActive ? QUEST_CATALOG[activeId] : null;

            try {
                // Setup Canvas
                const width = 800;
                const height = 450;
                const canvas = createCanvas(width, height);
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;

                if (hasActive) {
                    // 1. Parchment Background Radial Gradient
                    const bgGrad = ctx.createRadialGradient(width/2, height/2, 50, width/2, height/2, width/2);
                    bgGrad.addColorStop(0, '#fdf4ff'); // Fuchsia 50
                    bgGrad.addColorStop(1, '#fce7f3'); // Pink 100
                    ctx.fillStyle = bgGrad;
                    ctx.fillRect(0, 0, width, height);

                    // 2. Scroll Wood Roll Handles (Left & Right cylinders)
                    ctx.save();
                    const woodGrad = ctx.createLinearGradient(0, 0, 0, height);
                    woodGrad.addColorStop(0, '#fbcfe8');
                    woodGrad.addColorStop(0.5, '#f472b6');
                    woodGrad.addColorStop(1, '#db2777');
                    ctx.fillStyle = woodGrad;
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
                    ctx.shadowBlur = 8;

                    // Left handle
                    ctx.beginPath();
                    ctx.roundRect(25, 20, 25, 410, 6);
                    ctx.fill();
                    // Right handle
                    ctx.beginPath();
                    ctx.roundRect(750, 20, 25, 410, 6);
                    ctx.fill();
                    ctx.restore();

                    // 3. Scroll Body Borders
                    ctx.save();
                    ctx.strokeStyle = '#db2777'; // Pink 600
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.roundRect(65, 30, 670, 390, 8);
                    ctx.stroke();

                    ctx.strokeStyle = 'rgba(219, 39, 119, 0.15)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.roundRect(73, 38, 654, 374, 6);
                    ctx.stroke();
                    ctx.restore();

                    // 4. Header
                    ctx.fillStyle = '#be185d'; // Deep pink
                    ctx.font = 'bold 13px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('🎀 CHERRY GUILD COMMISSION 🎀', width/2, 80);

                    // Quest Title
                    ctx.fillStyle = '#831843'; // Pink 900
                    ctx.font = 'bold 28px "Segoe UI Emoji", sans-serif';
                    ctx.fillText(quest.title, width/2, 130);

                    // Objective
                    ctx.fillStyle = '#9d174d'; // Pink 800
                    ctx.font = 'bold 15px sans-serif';
                    ctx.fillText(`Objective: ${quest.desc}`, width/2, 175);

                    // Progress Bar Container
                    const bx = 150;
                    const by = 220;
                    const bw = 500;
                    const bh = 26;

                    ctx.save();
                    ctx.fillStyle = '#fce7f3';
                    ctx.beginPath();
                    ctx.roundRect(bx, by, bw, bh, 6);
                    ctx.fill();

                    // Filled Bar
                    const pct = Math.min(1, progress / quest.target);
                    if (pct > 0) {
                        const fillGrad = ctx.createLinearGradient(bx, by, bx + bw, by);
                        fillGrad.addColorStop(0, '#f472b6');
                        fillGrad.addColorStop(1, '#db2777');
                        ctx.fillStyle = fillGrad;
                        ctx.beginPath();
                        ctx.roundRect(bx, by, bw * pct, bh, 6);
                        ctx.fill();
                    }
                    ctx.restore();

                    // Progress Text on Bar
                    ctx.fillStyle = '#831843';
                    ctx.font = 'bold 12px sans-serif';
                    ctx.fillText(`${progress} / ${quest.target} (${Math.round(pct * 100)}%)`, width/2, by + 17);

                    // Divider
                    ctx.strokeStyle = 'rgba(219, 39, 119, 0.15)';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(150, 280);
                    ctx.lineTo(650, 280);
                    ctx.stroke();

                    // Rewards Section
                    ctx.fillStyle = '#be185d';
                    ctx.font = 'bold 12px sans-serif';
                    ctx.fillText('🎀 COMMISSION COMPENSATION:', width/2, 315);

                    ctx.fillStyle = '#db2777';
                    ctx.font = 'bold 14px "Segoe UI Emoji", sans-serif';
                    ctx.fillText(`🍒 ${quest.rewardCoins.toLocaleString()} cherries  •  ⭐ ${quest.rewardXp} XP  •  🎀 Title: "${quest.rewardTitle}"`, width/2, 345);

                    ctx.fillStyle = '#f472b6';
                    ctx.font = 'italic 11px sans-serif';
                    ctx.fillText('Claim bounty rewards with `/quest claim` upon completion.', width/2, 385);

                    // Wax Seal
                    const sx = 660;
                    const sy = 330;
                    const sRadius = 38;
                    ctx.save();
                    const sealGrad = ctx.createLinearGradient(sx - sRadius, sy - sRadius, sx + sRadius, sy + sRadius);
                    sealGrad.addColorStop(0, '#fbcfe8');
                    sealGrad.addColorStop(0.5, '#f472b6');
                    sealGrad.addColorStop(1, '#db2777');
                    ctx.fillStyle = sealGrad;
                    ctx.shadowColor = 'rgba(244, 114, 182, 0.4)';
                    ctx.shadowBlur = 6;
                    ctx.shadowOffsetY = 3;

                    ctx.beginPath();
                    ctx.arc(sx, sy, sRadius, 0, Math.PI * 2);
                    ctx.fill();

                    // Seal inner crest
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 20px "Segoe UI Emoji", sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('🎀', sx, sy);
                    ctx.restore();

                } else {
                    // Draw Pinned Wooden Bulletin Board Background
                    const woodGrad = ctx.createLinearGradient(0, 0, 0, height);
                    woodGrad.addColorStop(0, '#fce7f3'); // cute pink wood
                    woodGrad.addColorStop(1, '#fbcfe8');
                    ctx.fillStyle = woodGrad;
                    ctx.fillRect(0, 0, width, height);

                    // Draw board margins
                    ctx.strokeStyle = '#f472b6';
                    ctx.lineWidth = 10;
                    ctx.strokeRect(5, 5, width - 10, height - 10);

                    // Board Header
                    ctx.fillStyle = '#be185d';
                    ctx.font = 'bold 15px "Georgia", sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('🎀 GUILD QUEST BULLETIN BOARD', width/2, 36);

                    // Draw 5 flyers
                    const flyers = Object.values(QUEST_CATALOG);
                    flyers.forEach((q, idx) => {
                        // Calculate positions
                        const col = idx % 3;
                        const row = Math.floor(idx / 3);
                        const fx = col === 0 ? 70 : col === 1 ? 295 : 520;
                        const fy = row === 0 ? 65 : 240;
                        const fw = 210;
                        const fh = 160;

                        ctx.save();
                        // Slightly rotate note flyers for realism
                        const angle = 0.03 * (idx % 2 === 0 ? 1 : -1);
                        ctx.translate(fx + fw / 2, fy + fh / 2);
                        ctx.rotate(angle);

                        // Pinned paper backplate
                        ctx.fillStyle = '#ffffff'; // White paper
                        ctx.strokeStyle = '#fbcfe8';
                        ctx.lineWidth = 1;
                        
                        ctx.beginPath();
                        ctx.roundRect(-fw/2, -fh/2, fw, fh, 6);
                        ctx.fill();
                        ctx.stroke();

                        // Pin on top
                        ctx.fillStyle = '#f472b6';
                        ctx.beginPath();
                        ctx.arc(0, -fh/2 + 8, 5, 0, Math.PI * 2);
                        ctx.fill();

                        // Quest contents
                        ctx.fillStyle = '#831843';
                        ctx.font = 'bold 11px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.fillText(q.title, 0, -fh/2 + 30);

                        ctx.fillStyle = '#9d174d';
                        ctx.font = '9px sans-serif';
                        ctx.fillText(q.desc, 0, -fh/2 + 65);

                        ctx.fillStyle = '#db2777';
                        ctx.font = 'bold 9px "Segoe UI Emoji", sans-serif';
                        ctx.fillText(`Rewards: 🍒 ${q.rewardCoins} / ⭐ ${q.rewardXp}`, 0, -fh/2 + 105);

                        ctx.fillStyle = '#f472b6';
                        ctx.font = 'italic 8px sans-serif';
                        ctx.fillText(`ID: ${q.id}`, 0, -fh/2 + 135);

                        ctx.restore();
                    });
                }

                const buffer = canvas.toBuffer('image/png');
                const attachment = new AttachmentBuilder(buffer, { name: 'quest-scroll.png' });

                // Construct Guild Board Listings Embed
                const boardEmbed = new EmbedBuilder()
                    .setColor('#f472b6')
                    .setTitle('🎀 Guild Bounty Board')
                    .setDescription('Complete these requests to earn cherries, XP, and unlock permanent cosmetic titles!')
                    .setImage('attachment://quest-scroll.png')
                    .setTimestamp();

                // List all quests
                Object.values(QUEST_CATALOG).forEach(q => {
                    boardEmbed.addFields({
                        name: `${q.title} (ID: \`${q.id}\`)`,
                        value: `• **Objective:** ${q.desc}\n• **Rewards:** 🍒 **${q.rewardCoins} cherries** ┃ **${q.rewardXp} XP** ┃ 🎀 Title: \` ${q.rewardTitle} \``
                    });
                });

                await interaction.editReply({ embeds: [boardEmbed], files: [attachment] });

            } catch (err) {
                console.error('Error drawing quest scroll:', err);
                await interaction.editReply('❌ There was an error while generating your visual Quest Scroll.');
            }
        }

        // --- SUBCOMMAND: START ---
        else if (subcommand === 'start') {
            const questId = interaction.options.getString('id');

            if (char.active_quest_id) {
                return interaction.reply({
                    content: `⚠️ **You already have an active quest!**\nCancel it with \`/quest cancel\` before starting a new one.`,
                    flags: [MessageFlags.Ephemeral]
                });
            }

            const quest = QUEST_CATALOG[questId];
            if (!quest) {
                return interaction.reply({
                    content: '❌ Invalid quest ID selected.',
                    flags: [MessageFlags.Ephemeral]
                });
            }

            db.startQuest(userId, questId);

            await interaction.reply({
                content: `✨ **Quest Accepted!** You are now pursuing **${quest.title}**.\nObjective: *${quest.desc}*`
            });
        }

        // --- SUBCOMMAND: CANCEL ---
        else if (subcommand === 'cancel') {
            if (!char.active_quest_id) {
                return interaction.reply({
                    content: '⚠️ You do not have an active quest to cancel.',
                    flags: [MessageFlags.Ephemeral]
                });
            }

            const quest = QUEST_CATALOG[char.active_quest_id];
            db.completeQuest(userId); // clears it

            await interaction.reply({
                content: `❌ **Quest Canceled!** You have abandoned **${quest ? quest.title : 'your quest'}**. All progress has been lost.`
            });
        }

        // --- SUBCOMMAND: CLAIM ---
        else if (subcommand === 'claim') {
            const activeId = char.active_quest_id;
            const progress = char.quest_progress || 0;

            if (!activeId || !QUEST_CATALOG[activeId]) {
                return interaction.reply({
                    content: '⚠️ You do not have an active quest to claim rewards for.',
                    flags: [MessageFlags.Ephemeral]
                });
            }

            const quest = QUEST_CATALOG[activeId];
            if (progress < quest.target) {
                return interaction.reply({
                    content: `⏳ **Quest Incomplete!** You are at **${progress} / ${quest.target}** for **${quest.title}**. Keep going!`,
                    flags: [MessageFlags.Ephemeral]
                });
            }

            await interaction.deferReply();

            // Award Rewards
            db.addCoins(userId, guildId, quest.rewardCoins);
            const levelResult = db.addXp(userId, guildId, quest.rewardXp);
            
            // Unlock title
            const unlockedNew = db.addUnlockedTitle(userId, quest.rewardTitle);

            // Clear Quest
            db.completeQuest(userId);
            db.logTransaction(userId, 'Quest Completion', `Completed quest: ${quest.title} 🎉`);

            let xpText = `• **${quest.rewardXp} XP**`;
            if (levelResult && levelResult.leveledUp) {
                xpText += `\n🎉 **GG! You leveled up to Level ${levelResult.newLevel}!**`;
            }

            const claimEmbed = new EmbedBuilder()
                .setColor('#f472b6')
                .setTitle('🎀 Quest Completed!')
                .setDescription(`Congratulations, you have fulfilled the contract for **${quest.title}**!`)
                .addFields(
                    { name: '🎀 Rewards Received', value: `• 🍒 **${quest.rewardCoins} cherries**\n${xpText}` },
                    { name: '🎀 Title Unlocked', value: unlockedNew ? `🔓 You unlocked the cosmetic title: **"${quest.rewardTitle}"**!\nEquip it using \`/character title name:${quest.rewardTitle}\`` : `🔒 You already unlocked **"${quest.rewardTitle}"**.` }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [claimEmbed] });
        }
    }
};
