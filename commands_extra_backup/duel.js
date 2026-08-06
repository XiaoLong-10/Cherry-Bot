const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    MessageFlags,
    AttachmentBuilder
} = require('discord.js');
const { createCanvas } = require('@napi-rs/canvas');
const db = require('../database.js');

function drawDuelCard(p1, p2, active, lastActionMsg) {
    const width = 800;
    const height = 300;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 1. Sleek lavender/pink stadium ring background
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#faf5ff');
    bgGrad.addColorStop(1, '#fae8ff');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Border
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(20, 20, 760, 260, 16);
    ctx.stroke();

    // 2. Challenger Panel (Left)
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(40, 40, 240, 220, 16);
    ctx.fill();
    ctx.stroke();

    // Stats text
    ctx.fillStyle = '#6b21a8';
    ctx.font = 'bold 16px "Segoe UI Emoji", sans-serif';
    ctx.fillText(p1.char.char_name, 55, 75);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#db2777';
    ctx.fillText(`${p1.char.race} ${p1.char.class} (Lvl ${p1.char.level})`, 55, 95);

    // HP Bar
    ctx.fillStyle = '#9d174d';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(`HP: ${p1.hp}/${p1.maxHp}`, 55, 130);
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.roundRect(55, 140, 210, 12, 4);
    ctx.fill();
    const p1HpPct = Math.max(0, Math.min(1, p1.hp / p1.maxHp));
    if (p1HpPct > 0) {
        ctx.fillStyle = p1.hp <= p1.maxHp * 0.25 ? '#ef4444' : '#10b981';
        ctx.beginPath();
        ctx.roundRect(55, 140, 210 * p1HpPct, 12, 4);
        ctx.fill();
    }

    // Mana Bar
    ctx.fillStyle = '#9d174d';
    ctx.fillText(`MANA: ${p1.mana}/${p1.maxMp}`, 55, 175);
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.roundRect(55, 185, 210, 8, 4);
    ctx.fill();
    const p1MpPct = Math.max(0, Math.min(1, p1.mana / p1.maxMp));
    if (p1MpPct > 0) {
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.roundRect(55, 185, 210 * p1MpPct, 8, 4);
        ctx.fill();
    }
    
    // Weapon/Shield labels
    ctx.fillStyle = '#7c3aed';
    ctx.font = 'italic 10px sans-serif';
    ctx.fillText(`⚔️ ${p1.char.equipped_weapon || 'Fists'}`, 55, 218);
    ctx.fillText(`🛡️ ${p1.char.equipped_shield || 'No Shield'}`, 55, 235);
    ctx.restore();

    // 3. Opponent Panel (Right)
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(520, 40, 240, 220, 16);
    ctx.fill();
    ctx.stroke();

    // Stats text
    ctx.fillStyle = '#6b21a8';
    ctx.font = 'bold 16px "Segoe UI Emoji", sans-serif';
    ctx.fillText(p2.char.char_name, 535, 75);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#db2777';
    ctx.fillText(`${p2.char.race} ${p2.char.class} (Lvl ${p2.char.level})`, 535, 95);

    // HP Bar
    ctx.fillStyle = '#9d174d';
    ctx.fillText(`HP: ${p2.hp}/${p2.maxHp}`, 535, 130);
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.roundRect(535, 140, 210, 12, 4);
    ctx.fill();
    const p2HpPct = Math.max(0, Math.min(1, p2.hp / p2.maxHp));
    if (p2HpPct > 0) {
        ctx.fillStyle = p2.hp <= p2.maxHp * 0.25 ? '#ef4444' : '#10b981';
        ctx.beginPath();
        ctx.roundRect(535, 140, 210 * p2HpPct, 12, 4);
        ctx.fill();
    }

    // Mana Bar
    ctx.fillStyle = '#9d174d';
    ctx.fillText(`MANA: ${p2.mana}/${p2.maxMp}`, 535, 175);
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.roundRect(535, 185, 210, 8, 4);
    ctx.fill();
    const p2MpPct = Math.max(0, Math.min(1, p2.mana / p2.maxMp));
    if (p2MpPct > 0) {
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.roundRect(535, 185, 210 * p2MpPct, 8, 4);
        ctx.fill();
    }
    
    // Weapon/Shield labels
    ctx.fillStyle = '#7c3aed';
    ctx.font = 'italic 10px sans-serif';
    ctx.fillText(`⚔️ ${p2.char.equipped_weapon || 'Fists'}`, 535, 218);
    ctx.fillText(`🛡️ ${p2.char.equipped_shield || 'No Shield'}`, 535, 235);
    ctx.restore();

    // 4. Center Action Emblem & Log
    ctx.save();
    // Parse action type
    let actionEmoji = '⚔️';
    if (lastActionMsg.includes('Cast') || lastActionMsg.includes('Fireball') || lastActionMsg.includes('magic')) {
        actionEmoji = '🔮';
    } else if (lastActionMsg.includes('raised') || lastActionMsg.includes('block') || lastActionMsg.includes('shield')) {
        actionEmoji = '🛡️';
    } else if (lastActionMsg.includes('surrendered') || lastActionMsg.includes('towel')) {
        actionEmoji = '🏳️';
    } else if (lastActionMsg.includes('Initiative')) {
        actionEmoji = '🚩';
    } else if (lastActionMsg.includes('fallen') || lastActionMsg.includes('💀')) {
        actionEmoji = '💀';
    }

    ctx.font = '70px "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(actionEmoji, 400, 110);
    ctx.restore();

    // Action Log text at bottom center
    ctx.save();
    ctx.fillStyle = '#581c87';
    ctx.font = 'bold italic 13px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    
    // Clean text by stripping markdown bold tags ** for canvas draw
    const cleanLog = lastActionMsg.replace(/\*\*/g, '');
    
    // Wrap text if too long
    if (cleanLog.length > 35) {
        ctx.fillText(cleanLog.substring(0, 35) + '...', 400, 200);
        ctx.fillText(cleanLog.substring(35), 400, 222);
    } else {
        ctx.fillText(cleanLog, 400, 210);
    }
    ctx.restore();

    return canvas.toBuffer('image/png');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('duel')
        .setDescription('⚔️ Wager-backed turn-based RPG dueling')
        .addSubcommand(sub =>
            sub.setName('challenge')
                .setDescription('⚔️ Challenge another player to an RPG duel')
                .addUserOption(option =>
                    option.setName('opponent')
                        .setDescription('The user you want to duel')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('wager')
                        .setDescription('Amount of cherries to wager')
                        .setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('stats')
                .setDescription('📊 View the visual duel league stats license of a player')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to view')
                        .setRequired(false))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild ? (interaction.guild ? interaction.guild.id : 'GLOBAL') : 'GLOBAL';

        if (subcommand === 'challenge') {
            const challenger = interaction.user;
            const opponent = interaction.options.getUser('opponent');
            const wagerInput = interaction.options.getInteger('wager');
            const wager = wagerInput && wagerInput > 0 ? wagerInput : 0;

            // 1. Validations
            if (opponent.bot) {
                return interaction.reply({ content: '❌ You cannot duel bots!', ephemeral: true });
            }
            if (opponent.id === challenger.id) {
                return interaction.reply({ content: '❌ You cannot duel yourself!', ephemeral: true });
            }

            const p1Char = db.getCharacter(challenger.id);
            const p2Char = db.getCharacter(opponent.id);

            if (!p1Char || !p1Char.char_name) {
                return interaction.reply({ content: '⚠️ **You must create an RPG character first!** Use `/character create`.', ephemeral: true });
            }
            if (!p2Char || !p2Char.char_name) {
                return interaction.reply({ content: `⚠️ **Your opponent <@${opponent.id}> does not have an RPG character yet!** They must run \`/character create\` first.`, ephemeral: true });
            }

        const p1Balance = db.getBalance(challenger.id, guildId);
        const p2Balance = db.getBalance(opponent.id, guildId);

        if (p1Balance < wager) {
            return interaction.reply({ content: `❌ **You do not have enough cherries to cover this wager!** (Your Balance: 🍒 ${p1Balance.toLocaleString()})`, ephemeral: true });
        }
        if (p2Balance < wager) {
            return interaction.reply({ content: `❌ **Your opponent does not have enough cherries to cover this wager!** (Their Balance: 🍒 ${p2Balance.toLocaleString()})`, ephemeral: true });
        }

        await interaction.deferReply();

        // 2. Proposal Stage
        const inviteEmbed = new EmbedBuilder()
            .setColor('#db2777')
            .setTitle('⚔️ PVP DUEL CHALLENGE')
            .setDescription(
                `📢 <@${opponent.id}>, you have been challenged to an RPG duel by <@${challenger.id}>!\n\n` +
                `🍒 **Wagered Stake:** \` 🍒 ${wager.toLocaleString()} \` cherries\n` +
                `*Click accept below within 60 seconds to enter the arena!*`
            )
            .setTimestamp();

        const acceptBtn = new ButtonBuilder().setCustomId('duel_accept').setLabel('Accept Duel').setStyle(ButtonStyle.Success).setEmoji('⚔️');
        const declineBtn = new ButtonBuilder().setCustomId('duel_decline').setLabel('Decline').setStyle(ButtonStyle.Danger);
        const inviteRow = new ActionRowBuilder().addComponents(acceptBtn, declineBtn);

        const inviteMsg = await interaction.editReply({
            embeds: [inviteEmbed],
            components: [inviteRow]
        });

        const inviteCollector = inviteMsg.createMessageComponentCollector({
            filter: i => i.user.id === opponent.id,
            time: 60000
        });

        let duelStarted = false;

        inviteCollector.on('collect', async (i) => {
            await i.deferUpdate();
            if (i.customId === 'duel_decline') {
                inviteCollector.stop('declined');
            } else if (i.customId === 'duel_accept') {
                duelStarted = true;
                inviteCollector.stop('accepted');
            }
        });

        inviteCollector.on('end', async (_, reason) => {
            if (!duelStarted) {
                const endedEmbed = new EmbedBuilder()
                    .setColor('#f43f5e')
                    .setTitle('❌ DUEL CANCELED')
                    .setDescription(
                        reason === 'declined'
                            ? `💔 <@${opponent.id}> declined the duel challenge.`
                            : `⏳ The duel challenge expired.`
                    )
                    .setTimestamp();

                await interaction.editReply({ embeds: [endedEmbed], components: [] }).catch(() => null);
                return;
            }

            // --- START BATTLE ARENA ---
            try {
                // Initialize temporary battle stats
                const p1 = {
                    user: challenger,
                    char: p1Char,
                    hp: p1Char.max_hp || 100,
                    maxHp: p1Char.max_hp || 100,
                    mana: p1Char.max_mana || 50,
                    maxMp: p1Char.max_mana || 50,
                    defending: false,
                    magicUsed: false
                };

                const p2 = {
                    user: opponent,
                    char: p2Char,
                    hp: p2Char.max_hp || 100,
                    maxHp: p2Char.max_hp || 100,
                    mana: p2Char.max_mana || 50,
                    maxMp: p2Char.max_mana || 50,
                    defending: false,
                    magicUsed: false
                };

                // DEX initiative roll
                const p1Dex = p1.char.stat_dex || 10;
                const p2Dex = p2.char.stat_dex || 10;
                
                let p1Active = true;
                if (p1Dex !== p2Dex) {
                    p1Active = p1Dex > p2Dex;
                } else {
                    p1Active = Math.random() < 0.5;
                }

                let active = p1Active ? p1 : p2;
                let inactive = p1Active ? p2 : p1;

                let logFeed = `🚩 Initiative roll won by **${active.char.char_name}**! They take the first turn.`;

                const generateBattlePayload = () => {
                    const buffer = drawDuelCard(p1, p2, active, logFeed);
                    const attachment = new AttachmentBuilder(buffer, { name: 'duel-round.png' });

                    const embed = new EmbedBuilder()
                        .setColor('#6366f1')
                        .setTitle('⚔️ PVP ARENA SHOWDOWN')
                        .setImage('attachment://duel-round.png')
                        .setFooter({ text: `Active Turn: ${active.char.char_name}` })
                        .setTimestamp();

                    return { embeds: [embed], files: [attachment], components: [actionRow] };
                };

                const attackBtn = new ButtonBuilder().setCustomId('duel_action_attack').setLabel('Attack').setStyle(ButtonStyle.Danger).setEmoji('⚔️');
                const spellBtn = new ButtonBuilder().setCustomId('duel_action_spell').setLabel('Cast Spell').setStyle(ButtonStyle.Primary).setEmoji('🔮');
                const defendBtn = new ButtonBuilder().setCustomId('duel_action_defend').setLabel('Defend').setStyle(ButtonStyle.Secondary).setEmoji('🛡️');
                const fleeBtn = new ButtonBuilder().setCustomId('duel_action_surrender').setLabel('Surrender').setStyle(ButtonStyle.Secondary).setEmoji('🏳️');

                const actionRow = new ActionRowBuilder().addComponents(attackBtn, spellBtn, defendBtn, fleeBtn);

                await interaction.editReply(generateBattlePayload());

                const battleCollector = inviteMsg.createMessageComponentCollector({
                    time: 300000 // 5 minutes max battle
                });

                battleCollector.on('collect', async (click) => {
                    const clickerId = click.user.id;

                    // Click validation
                    if (clickerId !== p1.user.id && clickerId !== p2.user.id) {
                        return click.reply({ content: '❌ You are not a participant in this duel!', flags: [MessageFlags.Ephemeral] });
                    }
                    if (clickerId !== active.user.id) {
                        return click.reply({ content: '❌ It is not your turn! Wait for your opponent to act.', flags: [MessageFlags.Ephemeral] });
                    }

                    await click.deferUpdate();

                    let playerActionMsg = '';

                    if (click.customId === 'duel_action_attack') {
                        const str = active.char.stat_str || 10;
                        const dex = active.char.stat_dex || 10;
                        let damage = 10 + Math.floor(str * 0.4) + Math.floor(Math.random() * 5);

                        // Crit chance scales with DEX
                        const critChance = Math.min(45, Math.floor(dex * 0.8));
                        const isCrit = Math.random() * 100 < critChance;
                        if (isCrit) {
                            damage = Math.floor(damage * 1.8);
                            playerActionMsg = `💥 **CRITICAL HIT!** **${active.char.char_name}** struck **${inactive.char.char_name}** for **${damage} damage**!`;
                        } else {
                            playerActionMsg = `⚔️ **${active.char.char_name}** lunged and hit **${inactive.char.char_name}** for **${damage} damage**!`;
                        }

                        // Apply defense reduction
                        const targetDef = inactive.char.stat_def || 10;
                        let reduction = Math.floor(targetDef * 0.35);
                        if (inactive.defending) {
                            reduction = Math.floor(damage * 0.5); // Guard blocks 50%
                        }
                        damage = Math.max(2, damage - reduction);

                        inactive.hp = Math.max(0, inactive.hp - damage);
                    } 
                    else if (click.customId === 'duel_action_spell') {
                        if (active.mana < 15) {
                            return click.followUp({ content: '❌ **Not enough Mana!** Spells cost 15 Mana.', flags: [MessageFlags.Ephemeral] });
                        }

                        active.mana -= 15;
                        active.magicUsed = true;
                        const int = active.char.stat_int || 10;
                        const damage = 22 + int + Math.floor(Math.random() * 6);

                        playerActionMsg = `🔮 **${active.char.char_name}** cast a Fireball at **${inactive.char.char_name}** for **${damage} magic damage**!`;
                        inactive.hp = Math.max(0, inactive.hp - damage);
                    } 
                    else if (click.customId === 'duel_action_defend') {
                        active.defending = true;
                        playerActionMsg = `🛡️ **${active.char.char_name}** raised their shield to block the next attack!`;
                    } 
                    else if (click.customId === 'duel_action_surrender') {
                        battleCollector.stop('surrender');
                        return;
                    }

                    // Check battle end
                    if (inactive.hp <= 0) {
                        battleCollector.stop('finished');
                        return;
                    }

                    // Rotate Turn
                    active.defending = false; // Reset defense of active player as their turn ends
                    const temp = active;
                    active = inactive;
                    inactive = temp;

                    logFeed = playerActionMsg;
                    await interaction.editReply(generateBattlePayload());
                });

                battleCollector.on('end', async (_, reason) => {
                    let winner = null;
                    let loser = null;
                    let summaryText = '';

                    if (reason === 'finished') {
                        winner = active;
                        loser = inactive;
                        summaryText = `💀 **${loser.char.char_name}** has fallen! **${winner.char.char_name}** stands victorious in the PvP Arena!`;
                    } 
                    else if (reason === 'surrender') {
                        winner = inactive;
                        loser = active;
                        summaryText = `🏳️ **${loser.char.char_name}** threw in the towel and surrendered the match!`;
                    } 
                    else {
                        // Timeout forfeit (active player times out, inactive wins)
                        winner = inactive;
                        loser = active;
                        summaryText = `⏳ **${loser.char.char_name}** timed out! They forfeit the match.`;
                    }

                    let transactionText = '';
                    if (wager > 0) {
                        const winnerBal = db.getBalance(winner.user.id, guildId);
                        const loserBal = db.getBalance(loser.user.id, guildId);

                        // Double check balance final check
                        const actualStake = Math.min(wager, loserBal);
                        if (actualStake > 0) {
                            db.deductCoins(loser.user.id, guildId, actualStake);
                            db.addCoins(winner.user.id, guildId, actualStake);
                            db.logTransaction(winner.user.id, 'PvP Win', `Won wager duel against ${loser.char.char_name}`);
                            db.logTransaction(loser.user.id, 'PvP Loss', `Lost wager duel to ${winner.char.char_name}`);

                            transactionText = 
                                `🍒 **Wager Transactions:**\n` +
                                `• <@${winner.user.id}>: \` +🍒 ${actualStake.toLocaleString()} \` cherries\n` +
                                `• <@${loser.user.id}>: \` -🍒 ${actualStake.toLocaleString()} \` cherries`;
                        }
                    }

                    // Update PvP wins/losses stats in DB
                    db.prepare("UPDATE users SET duel_wins = duel_wins + 1, duel_streak = duel_streak + 1 WHERE userId = ?").run(winner.user.id);
                    db.prepare("UPDATE users SET duel_losses = duel_losses + 1, duel_streak = 0 WHERE userId = ?").run(loser.user.id);

                    // Increment Skills
                    const winSkill = winner.magicUsed ? 'magic' : 'combat';
                    const winSkillLvl = db.increaseSkill(winner.user.id, winSkill, 1);
                    
                    let loseSkillText = '';
                    if (Math.random() < 0.5) {
                        const loseSkill = loser.magicUsed ? 'magic' : 'combat';
                        const loseSkillLvl = db.increaseSkill(loser.user.id, loseSkill, 1);
                        loseSkillText = `\n• <@${loser.user.id}>'s **${loseSkill.toUpperCase()}** increased to **Lvl ${loseSkillLvl}**! (Tavern training experience)`;
                    }

                    const finalBuffer = drawDuelCard(p1, p2, active, summaryText);
                    const finalAttachment = new AttachmentBuilder(finalBuffer, { name: 'duel-final.png' });

                    const finalEmbed = new EmbedBuilder()
                        .setColor('#fbcfe8')
                        .setTitle('🏆 PVP BATTLE ARENA REPORT')
                        .setDescription(
                            `# 🎉 Winner: **${winner.char.char_name}** (<@${winner.user.id}>)\n\n` +
                            `${summaryText}\n\n` +
                            (transactionText ? `${transactionText}\n\n` : '') +
                            `📈 **Skill Updates:**\n` +
                            `• <@${winner.user.id}>'s **${winSkill.toUpperCase()}** increased to **Lvl ${winSkillLvl}**!${loseSkillText}`
                        )
                        .setImage('attachment://duel-final.png')
                        .setTimestamp();

                    await interaction.editReply({
                        embeds: [finalEmbed],
                        files: [finalAttachment],
                        components: []
                    }).catch(() => null);
                });

            } catch (err) {
                console.error('Error starting PvP duel:', err);
                await interaction.editReply({ content: '❌ There was an error while setting up the battle arena.', components: [] });
            }
        });
    }

        // --- SUBCOMMAND: STATS ---
        else if (subcommand === 'stats') {
            const targetUser = interaction.options.getUser('user') || interaction.user;
            const char = db.getCharacter(targetUser.id);

            if (!char || !char.char_name) {
                return interaction.editReply({
                    content: `❌ **This player does not have an RPG character yet!**`
                });
            }

            try {
                // Fetch stats from DB
                const wins = char.duel_wins || 0;
                const losses = char.duel_losses || 0;
                const streak = char.duel_streak || 0;
                const total = wins + losses;
                const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

                // Determine League Title
                let pvpTitle = 'Novice Recruit';
                let titleColor = '#94a3b8'; // grey
                if (wins >= 25) {
                    pvpTitle = '⚔️ Grand Gladiator';
                    titleColor = '#fbbf24'; // Gold
                } else if (wins >= 10) {
                    pvpTitle = '🛡️ Veteran Warlord';
                    titleColor = '#f43f5e'; // Rose
                } else if (wins >= 5) {
                    pvpTitle = '🗡️ Arena Duelist';
                    titleColor = '#a855f7'; // Purple
                } else if (wins >= 1) {
                    pvpTitle = '⚔️ Active Combatant';
                    titleColor = '#3b82f6'; // Blue
                }

                // Setup Canvas
                const width = 800;
                const height = 450;
                const canvas = createCanvas(width, height);
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;

                // 1. Dark Purple/Slate Gradient Background
                const bgGrad = ctx.createRadialGradient(width/2, height/2, 50, width/2, height/2, width/2);
                bgGrad.addColorStop(0, '#fce7f3'); // light pink
                bgGrad.addColorStop(1, '#fbcfe8'); // cute pink
                ctx.fillStyle = bgGrad;
                ctx.fillRect(0, 0, width, height);

                // 2. Certificate Frame (Neon Purple)
                const frameColor = '#f472b6'; // cute pink
                ctx.save();
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'; // white glass inner box
                ctx.strokeStyle = frameColor;
                ctx.lineWidth = 4;
                ctx.shadowColor = 'rgba(139, 92, 246, 0.4)';
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.roundRect(40, 30, 720, 390, 16);
                ctx.fill();
                ctx.stroke();
                ctx.restore();

                // Decorative double border
                ctx.strokeStyle = '#334155';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(48, 38, 704, 374, 12);
                ctx.stroke();

                // 3. Left Avatar Portrait Frame
                ctx.save();
                ctx.fillStyle = 'rgba(251, 207, 232, 0.5)'; // pastel pink background
                ctx.strokeStyle = '#475569';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(70, 90, 200, 270, 12);
                ctx.fill();
                ctx.stroke();
                ctx.restore();

                // Load and Draw Avatar
                let avatarImg = null;
                try {
                    const avatarUrl = targetUser.displayAvatarURL({ extension: 'png', size: 128 });
                    avatarImg = await loadImage(avatarUrl);
                } catch (e) {}

                ctx.save();
                ctx.beginPath();
                ctx.arc(170, 220, 55, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();

                if (avatarImg) {
                    ctx.drawImage(avatarImg, 115, 165, 110, 110);
                } else {
                    ctx.fillStyle = '#475569';
                    ctx.fill();
                }
                ctx.restore();

                // Draw Avatar Neon Ring
                ctx.save();
                ctx.strokeStyle = frameColor;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(170, 220, 55, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();

                // 4. Right Side Text Details
                ctx.fillStyle = '#db2777'; // dark pink
                ctx.font = 'bold 12px "Segoe UI Emoji", sans-serif';
                ctx.fillText('GLADIATOR LEAGUE DUEL LICENSE', 300, 95);

                ctx.fillStyle = '#831843'; // dark maroon
                ctx.font = 'bold 28px "Segoe UI Emoji", sans-serif';
                ctx.fillText(char.char_name, 300, 135);

                ctx.fillStyle = titleColor === '#94a3b8' ? '#9d174d' : titleColor === '#fbbf24' ? '#f472b6' : titleColor === '#f43f5e' ? '#be185d' : titleColor === '#a855f7' ? '#c084fc' : '#db2777';
                ctx.font = 'bold 14px sans-serif';
                ctx.fillText(pvpTitle, 300, 162);

                // Divider line
                ctx.strokeStyle = 'rgba(219, 39, 119, 0.3)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(300, 185);
                ctx.lineTo(710, 185);
                ctx.stroke();

                // Details Grid
                ctx.fillStyle = '#9d174d';
                ctx.font = '12px sans-serif';
                ctx.fillText('Competitor ID:', 300, 215);
                ctx.fillStyle = '#831843';
                ctx.font = 'bold 13px sans-serif';
                ctx.fillText(`<@${targetUser.id}>`, 440, 215);

                ctx.fillStyle = '#9d174d';
                ctx.font = '12px sans-serif';
                ctx.fillText('Arena Victories:', 300, 255);
                ctx.fillStyle = '#db2777'; // Pink win
                ctx.font = 'bold 14px sans-serif';
                ctx.fillText(`${wins.toLocaleString()} Wins`, 440, 255);

                ctx.fillStyle = '#9d174d';
                ctx.font = '12px sans-serif';
                ctx.fillText('Arena Defeats:', 300, 295);
                ctx.fillStyle = '#be185d'; // Dark red/pink loss
                ctx.font = 'bold 14px sans-serif';
                ctx.fillText(`${losses.toLocaleString()} Losses`, 440, 295);

                ctx.fillStyle = '#9d174d';
                ctx.font = '12px sans-serif';
                ctx.fillText('Combat Performance:', 300, 335);
                ctx.fillStyle = '#f472b6'; // Cute pink
                ctx.font = 'bold 13px "Segoe UI Emoji", sans-serif';
                ctx.fillText(`Win Rate: ${winRate}% (Streak: 🔥 ${streak})`, 440, 335);

                // 5. Official Gladiator Stamp (bottom right)
                const sx = 660;
                const sy = 330;
                const sRadius = 45;
                ctx.save();
                const sealGrad = ctx.createLinearGradient(sx - sRadius, sy - sRadius, sx + sRadius, sy + sRadius);
                sealGrad.addColorStop(0, '#fbcfe8');
                sealGrad.addColorStop(0.5, '#f472b6');
                sealGrad.addColorStop(1, '#db2777');
                ctx.fillStyle = sealGrad;
                
                ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
                ctx.shadowBlur = 8;
                ctx.shadowOffsetY = 4;

                ctx.beginPath();
                ctx.arc(sx, sy, sRadius, 0, Math.PI * 2);
                ctx.fill();

                // Seal border
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(sx, sy, sRadius - 5, 0, Math.PI * 2);
                ctx.stroke();

                // Seal Icon
                ctx.fillStyle = '#fef3c7';
                ctx.font = 'bold 24px "Segoe UI Emoji", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('⚔️', sx, sy);
                ctx.restore();

                const buffer = canvas.toBuffer('image/png');
                const attachment = new AttachmentBuilder(buffer, { name: 'duel-license.png' });

                const statsEmbed = new EmbedBuilder()
                    .setColor('#8b5cf6')
                    .setTitle(`📊 Duel Stats: ${char.char_name}`)
                    .setDescription(`Official combat stats registry card for Gladiator League battles.`)
                    .setImage('attachment://duel-license.png')
                    .setTimestamp();

                await interaction.editReply({ embeds: [statsEmbed], files: [attachment] });

            } catch (err) {
                console.error('Error drawing duel license:', err);
                await interaction.editReply('❌ There was an error while generating your visual Gladiator License.');
            }
        }
    }
};
