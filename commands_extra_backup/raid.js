const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    AttachmentBuilder,
    MessageFlags 
} = require('discord.js');
const { createCanvas } = require('canvas');
const db = require('../database.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('raid')
        .setDescription('🐉 Form a co-op party to take down a legendary Dragon Raid Boss'),

    async execute(interaction) {
        const host = interaction.user;
        const guildId = interaction.guild ? (interaction.guild ? interaction.guild.id : 'GLOBAL') : 'GLOBAL';

        const hostChar = db.getCharacter(host.id);
        if (!hostChar || !hostChar.char_name) {
            return interaction.reply({ content: '⚠️ **You must create an RPG character first!** Use `/character create`.', ephemeral: true });
        }

        await interaction.deferReply();

        // 1. Initialize Lobby
        const party = [{
            userId: host.id,
            username: host.username,
            hp: hostChar.max_hp || 100,
            maxHp: hostChar.max_hp || 100,
            mana: hostChar.max_mana || 50,
            maxMp: hostChar.max_mana || 50,
            char: hostChar,
            dmgDealt: 0,
            magicUsed: false,
            role: 'DPS'
        }];

        const getLobbyEmbed = () => {
            const list = party.map((p, idx) => {
                const roleEmoji = p.role === 'Tank' ? '🛡️' : p.role === 'Healer' ? '💖' : '⚔️';
                return `${idx === 0 ? '👑' : '👥'} <@${p.userId}> (Lvl ${p.char.level}) [${p.role} ${roleEmoji}]`;
            }).join('\n');
            return new EmbedBuilder()
                .setColor('#f472b6')
                .setTitle('🎀 CUTE CO-OP RAID LOBBY')
                .setDescription(
                    `A **Colossal Cherry Dragon** has breached the local outskirts! Assemble a raid party to face it.\n\n` +
                    `👥 **Raid Party (${party.length} / 5):**\n` +
                    `${list}\n\n` +
                    `*Host <@${host.id}> can start the raid when ready. Lobby expires in 90s.*`
                )
                .setTimestamp();
        };

        const joinDpsBtn = new ButtonBuilder().setCustomId('raid_btn_join_dps').setLabel('Join DPS').setStyle(ButtonStyle.Primary).setEmoji('⚔️');
        const joinTankBtn = new ButtonBuilder().setCustomId('raid_btn_join_tank').setLabel('Join Tank').setStyle(ButtonStyle.Secondary).setEmoji('🛡️');
        const joinHealerBtn = new ButtonBuilder().setCustomId('raid_btn_join_healer').setLabel('Join Healer').setStyle(ButtonStyle.Success).setEmoji('💖');
        const startBtn = new ButtonBuilder().setCustomId('raid_btn_start').setLabel('Start Raid').setStyle(ButtonStyle.Danger).setEmoji('🔥');
        const cancelBtn = new ButtonBuilder().setCustomId('raid_btn_cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary);

        const lobbyRow = new ActionRowBuilder().addComponents(joinDpsBtn, joinTankBtn, joinHealerBtn, startBtn, cancelBtn);

        const lobbyMsg = await interaction.editReply({
            embeds: [getLobbyEmbed()],
            components: [lobbyRow]
        });

        const lobbyCollector = lobbyMsg.createMessageComponentCollector({
            time: 90000
        });

        let raidStarted = false;

        lobbyCollector.on('collect', async (click) => {
            const clickerId = click.user.id;

            if (click.customId.startsWith('raid_btn_join_')) {
                const clickedRole = click.customId.replace('raid_btn_join_', '').toUpperCase(); // 'DPS', 'TANK', 'HEALER'
                const clickerChar = db.getCharacter(clickerId);
                if (!clickerChar || !clickerChar.char_name) {
                    return click.reply({ content: '⚠️ **You must create an RPG character first!** Use `/character create`.', flags: [MessageFlags.Ephemeral] });
                }

                await click.deferUpdate();

                const existingMember = party.find(p => p.userId === clickerId);
                if (existingMember) {
                    // Update role
                    existingMember.role = clickedRole === 'TANK' ? 'Tank' : clickedRole === 'HEALER' ? 'Healer' : 'DPS';
                } else {
                    // Add new member
                    if (party.length >= 5) {
                        return click.followUp({ content: '❌ The raid party is full! (Max 5 members)', flags: [MessageFlags.Ephemeral] });
                    }
                    party.push({
                        userId: clickerId,
                        username: click.user.username,
                        hp: clickerChar.max_hp || 100,
                        maxHp: clickerChar.max_hp || 100,
                        mana: clickerChar.max_mana || 50,
                        maxMp: clickerChar.max_mana || 50,
                        char: clickerChar,
                        dmgDealt: 0,
                        magicUsed: false,
                        role: clickedRole === 'TANK' ? 'Tank' : clickedRole === 'HEALER' ? 'Healer' : 'DPS'
                    });
                }

                await interaction.editReply({ embeds: [getLobbyEmbed()] });
            } 
            else if (click.customId === 'raid_btn_start') {
                if (clickerId !== host.id) {
                    return click.reply({ content: '❌ Only the party host can start the raid!', flags: [MessageFlags.Ephemeral] });
                }
                await click.deferUpdate();
                raidStarted = true;
                lobbyCollector.stop('started');
            } 
            else if (click.customId === 'raid_btn_cancel') {
                if (clickerId !== host.id) {
                    return click.reply({ content: '❌ Only the party host can cancel the lobby!', flags: [MessageFlags.Ephemeral] });
                }
                await click.deferUpdate();
                lobbyCollector.stop('cancelled');
            }
        });

        lobbyCollector.on('end', async (_, reason) => {
            if (!raidStarted) {
                const cancelEmbed = new EmbedBuilder()
                    .setColor('#f43f5e')
                    .setTitle('❌ RAID ABORTED')
                    .setDescription(reason === 'cancelled' ? 'The party host cancelled the raid.' : 'The raid lobby expired.')
                    .setTimestamp();
                await interaction.editReply({ embeds: [cancelEmbed], components: [] }).catch(() => null);
                return;
            }

            // --- GUILD RAID ARENA ---
            try {
                // Boss stats scale dynamically by party size
                const bossMaxHp = 1000 + party.length * 400;
                const bossDmg = 25 + party.length * 5;
                const boss = {
                    name: 'Colossal Cherry Dragon',
                    hp: bossMaxHp,
                    maxHp: bossMaxHp,
                    dmg: bossDmg
                };

                let activeIdx = 0;
                let logFeed = `🔥 **The Cherry Dragon roars!** The ground shakes as the party prepares to strike!`;
                let groupDefending = false;

                const getProgressBar = (val, max, length = 12) => {
                    const filled = Math.max(0, Math.min(length, Math.round((val / max) * length)));
                    return '🟥'.repeat(filled) + '⬛'.repeat(length - filled);
                };

                const generateBattleCanvas = (boss, party, activeIdx, logFeed) => {
                    const canvas = createCanvas(800, 550);
                    const ctx = canvas.getContext('2d');
                    ctx.imageSmoothingEnabled = true;

                    // Volcanic background
                    const bgGrad = ctx.createRadialGradient(400, 275, 50, 400, 275, 450);
                    bgGrad.addColorStop(0, '#fbcfe8');
                    bgGrad.addColorStop(0.6, '#fce7f3');
                    bgGrad.addColorStop(1, '#fdf4ff');
                    ctx.fillStyle = bgGrad;
                    ctx.fillRect(0, 0, 800, 550);

                    // Lava flows at the bottom
                    ctx.fillStyle = 'rgba(244, 114, 182, 0.2)';
                    ctx.beginPath();
                    ctx.ellipse(400, 540, 350, 60, 0, 0, Math.PI * 2);
                    ctx.fill();

                    // Grid
                    ctx.strokeStyle = 'rgba(244, 114, 182, 0.2)';
                    ctx.lineWidth = 1;
                    for (let x = 0; x < 800; x += 40) {
                        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 550); ctx.stroke();
                    }
                    for (let y = 0; y < 550; y += 40) {
                        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(800, y); ctx.stroke();
                    }

                    // Boss Column (Right)
                    ctx.fillStyle = '#db2777';
                    ctx.font = 'bold 20px "Segoe UI", "Segoe UI Emoji", sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('Colossal Cherry Dragon', 560, 95);

                    // Boss Health Bar
                    const bBarX = 430;
                    const bBarY = 120;
                    const bBarW = 260;
                    const bBarH = 16;
                    ctx.fillStyle = '#fce7f3';
                    ctx.beginPath();
                    ctx.roundRect(bBarX, bBarY, bBarW, bBarH, 4);
                    ctx.fill();

                    const bPct = Math.max(0, Math.min(1, boss.hp / boss.maxHp));
                    if (bPct > 0) {
                        const bBarGrad = ctx.createLinearGradient(bBarX, bBarY, bBarX + bBarW, bBarY);
                        bBarGrad.addColorStop(0, '#f472b6');
                        bBarGrad.addColorStop(1, '#db2777');
                        ctx.fillStyle = bBarGrad;
                        ctx.beginPath();
                        ctx.roundRect(bBarX, bBarY, bBarW * bPct, bBarH, 4);
                        ctx.fill();
                    }

                    ctx.fillStyle = '#831843';
                    ctx.font = 'bold 11px "Segoe UI", "Segoe UI Emoji", sans-serif';
                    ctx.fillText(`HP: ${boss.hp} / ${boss.maxHp}`, 560, 132);

                    // Dragon Icon
                    ctx.font = '130px "Segoe UI Emoji", sans-serif';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('🐉', 560, 260);
                    ctx.textBaseline = 'alphabetic';

                    // Party Columns (Left)
                    const startY = 60;
                    const spacing = 74;
                    ctx.textAlign = 'left';

                    party.forEach((p, idx) => {
                        const py = startY + idx * spacing;
                        const active = idx === activeIdx;
                        const dead = p.hp <= 0;

                        // Player Card Frame
                        ctx.save();
                        ctx.fillStyle = active ? 'rgba(244, 114, 182, 0.2)' : (dead ? 'rgba(251, 113, 133, 0.1)' : 'rgba(255, 255, 255, 0.7)');
                        ctx.strokeStyle = active ? '#f472b6' : 'rgba(244, 114, 182, 0.5)';
                        ctx.lineWidth = active ? 2.5 : 1;
                        if (active) {
                            ctx.shadowColor = '#f472b6';
                            ctx.shadowBlur = 8;
                        }
                        ctx.beginPath();
                        ctx.roundRect(40, py, 320, 64, 10);
                        ctx.fill();
                        ctx.stroke();
                        ctx.restore();

                        // Player details
                        ctx.fillStyle = dead ? '#fb7185' : '#831843';
                        ctx.font = 'bold 13px "Segoe UI", "Segoe UI Emoji", sans-serif';
                        const roleEmoji = p.role === 'Tank' ? '🛡️' : p.role === 'Healer' ? '💖' : '⚔️';
                        const nameText = `${idx === 0 ? '👑' : ''}${roleEmoji} ${p.char.char_name || p.username} [${p.role}]`;
                        ctx.fillText(nameText, 55, py + 22);

                        // Level
                        ctx.fillStyle = '#db2777';
                        ctx.font = '10px "Segoe UI", "Segoe UI Emoji", sans-serif';
                        ctx.fillText(`Lvl ${p.char.level || 1}`, 260, py + 22);

                        // HP Bar
                        const hpBarX = 55;
                        const hpBarY = 28;
                        const hpBarW = 120;
                        const hpBarH = 8;
                        
                        ctx.fillStyle = '#fbcfe8';
                        ctx.beginPath();
                        ctx.roundRect(hpBarX, py + hpBarY, hpBarW, hpBarH, 3);
                        ctx.fill();

                        const hpPct = Math.max(0, Math.min(1, p.hp / p.maxHp));
                        if (hpPct > 0) {
                            const hpGrad = ctx.createLinearGradient(hpBarX, py + hpBarY, hpBarX + hpBarW, py + hpBarY);
                            hpGrad.addColorStop(0, '#f472b6');
                            hpGrad.addColorStop(1, '#db2777');
                            ctx.fillStyle = hpGrad;
                            ctx.beginPath();
                            ctx.roundRect(hpBarX, py + hpBarY, hpBarW * hpPct, hpBarH, 3);
                            ctx.fill();
                        }

                        ctx.fillStyle = '#db2777';
                        ctx.font = '9px "Segoe UI", "Segoe UI Emoji", sans-serif';
                        ctx.fillText(`HP: ${p.hp}/${p.maxHp}`, hpBarX, py + 48);

                        // MP Bar
                        const mpBarX = 185;
                        const mpBarY = 28;
                        const mpBarW = 90;
                        const mpBarH = 8;

                        ctx.fillStyle = '#fce7f3';
                        ctx.beginPath();
                        ctx.roundRect(mpBarX, py + mpBarY, mpBarW, mpBarH, 3);
                        ctx.fill();

                        const mpPct = Math.max(0, Math.min(1, p.mana / p.maxMp));
                        if (mpPct > 0) {
                            const mpGrad = ctx.createLinearGradient(mpBarX, py + mpBarY, mpBarX + mpBarW, py + mpBarY);
                            mpGrad.addColorStop(0, '#c084fc');
                            mpGrad.addColorStop(1, '#a855f7');
                            ctx.fillStyle = mpGrad;
                            ctx.beginPath();
                            ctx.roundRect(mpBarX, py + mpBarY, mpBarW * mpPct, mpBarH, 3);
                            ctx.fill();
                        }

                        ctx.fillStyle = '#831843';
                        ctx.font = '9px "Segoe UI", "Segoe UI Emoji", sans-serif';
                        ctx.fillText(`MP: ${p.mana}/${p.maxMp}`, mpBarX, py + 48);

                        // Turn pointer
                        if (active) {
                            ctx.fillStyle = '#f472b6';
                            ctx.font = 'bold 15px "Segoe UI", "Segoe UI Emoji", sans-serif';
                            ctx.fillText('👉', 16, py + 38);
                        }
                    });

                    // 10. Logs Board (Bottom)
                    ctx.save();
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.strokeStyle = 'rgba(244, 114, 182, 0.3)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.roundRect(40, 440, 720, 80, 10);
                    ctx.fill();
                    ctx.stroke();

                    ctx.fillStyle = '#be185d';
                    ctx.font = 'bold 11px "Segoe UI", "Segoe UI Emoji", sans-serif';
                    ctx.fillText('🎀 BATTLE LOGS', 55, 462);

                    ctx.fillStyle = '#831843';
                    ctx.font = 'italic 13px "Segoe UI", "Segoe UI Emoji", sans-serif';
                    
                    // Clean log text
                    const cleanLog = logFeed.replace(/\*\*/g, '').replace(/\*/g, '');
                    // Splitting into two lines if too long
                    if (cleanLog.length > 80) {
                        const half = Math.floor(cleanLog.length / 2);
                        const breakIdx = cleanLog.indexOf(' ', half);
                        if (breakIdx !== -1) {
                            ctx.fillText(cleanLog.substring(0, breakIdx), 55, 484);
                            ctx.fillText(cleanLog.substring(breakIdx + 1), 55, 504);
                        } else {
                            ctx.fillText(cleanLog, 55, 484);
                        }
                    } else {
                        ctx.fillText(cleanLog, 55, 484);
                    }
                    ctx.restore();

                    return canvas.toBuffer();
                };

                const generateBattleEmbed = () => {
                    const activePlayer = party[activeIdx];
                    const buffer = generateBattleCanvas(boss, party, activeIdx, logFeed);
                    const attachment = new AttachmentBuilder(buffer, { name: 'raid-battle.png' });

                    const embed = new EmbedBuilder()
                        .setColor('#f472b6')
                        .setTitle('🎀 CUTE CO-OP RAID BOSS DUNGEON')
                        .setDescription(`👉 **Active Turn:** <@${activePlayer.userId}> (${activePlayer.char.char_name || activePlayer.username})`)
                        .setImage('attachment://raid-battle.png')
                        .setTimestamp();

                    return { embed, attachment };
                };

                const atkBtn = new ButtonBuilder().setCustomId('raid_action_attack').setLabel('Attack').setStyle(ButtonStyle.Danger).setEmoji('⚔️');
                const splBtn = new ButtonBuilder().setCustomId('raid_action_spell').setLabel('Cast Spell').setStyle(ButtonStyle.Primary).setEmoji('🔮');
                const dfnBtn = new ButtonBuilder().setCustomId('raid_action_defend').setLabel('Defend Party').setStyle(ButtonStyle.Secondary).setEmoji('🛡️');
                const helBtn = new ButtonBuilder().setCustomId('raid_action_heal').setLabel('Heal Party (20 MP)').setStyle(ButtonStyle.Success).setEmoji('💚');

                const battleRow = new ActionRowBuilder().addComponents(atkBtn, splBtn, dfnBtn, helBtn);

                const updateRaidState = () => {
                    global.activeRaid = {
                        active: true,
                        bossName: boss.name,
                        bossHp: boss.hp,
                        bossMaxHp: boss.maxHp,
                        party: party.map(p => ({
                            userId: p.userId,
                            username: `${p.role === 'Tank' ? '🛡️' : p.role === 'Healer' ? '💖' : '⚔️'} ${p.char.char_name || p.username}`,
                            hp: p.hp,
                            maxHp: p.maxHp,
                            mana: p.mana,
                            maxMana: p.maxMp,
                            dmgDealt: p.dmgDealt
                        })),
                        logFeed: logFeed
                    };
                };
                updateRaidState();

                const performRaidTurn = async (userId, customId) => {
                    const activePlayer = party[activeIdx];
                    if (userId !== activePlayer.userId) {
                        throw new Error("It is not your turn!");
                    }

                    let playerActionMsg = '';
                    let monsterActionMsg = '';

                    // Resolve player turn
                    if (customId === 'raid_action_attack') {
                        const str = activePlayer.char.stat_str || 10;
                        const dex = activePlayer.char.stat_dex || 10;
                        let damage = 10 + Math.floor(str * 0.4) + Math.floor(Math.random() * 5);

                        if (activePlayer.role === 'DPS') {
                            damage = Math.floor(damage * 1.8);
                        } else if (activePlayer.role === 'Healer') {
                            damage = Math.floor(damage * 0.7);
                            party.forEach(p => {
                                if (p.hp > 0) p.hp = Math.min(p.maxHp, p.hp + 10);
                            });
                        }

                        const isCrit = Math.random() * 100 < Math.min(40, dex * 0.8);
                        if (isCrit) {
                            damage = Math.floor(damage * 1.8);
                            playerActionMsg = `💥 **CRITICAL STRIKE!** **${activePlayer.char.char_name || activePlayer.username}** hammered the dragon for **${damage} damage**!`;
                        } else {
                            playerActionMsg = `⚔️ **${activePlayer.char.char_name || activePlayer.username}** attacked and dealt **${damage} damage**!`;
                        }

                        if (activePlayer.role === 'Healer') {
                            playerActionMsg += ` (Sprayed healing mist: +10 HP to party!)`;
                        }

                        boss.hp = Math.max(0, boss.hp - damage);
                        activePlayer.dmgDealt += damage;
                    } 
                    else if (customId === 'raid_action_spell') {
                        if (activePlayer.mana < 15) {
                            throw new Error("Not enough Mana! Spells cost 15 Mana.");
                        }
                        activePlayer.mana -= 15;
                        activePlayer.magicUsed = true;
                        
                        if (activePlayer.role === 'Healer') {
                            party.forEach(p => {
                                if (p.hp > 0) p.hp = Math.min(p.maxHp, p.hp + 40);
                            });
                            playerActionMsg = `💚 **${activePlayer.char.char_name || activePlayer.username}** cast a celestial prayer, restoring **40 HP** to all conscious members!`;
                        } else {
                            const int = activePlayer.char.stat_int || 10;
                            let damage = 22 + int + Math.floor(Math.random() * 6);
                            
                            if (activePlayer.role === 'DPS') {
                                damage = Math.floor(damage * 2.5);
                                playerActionMsg = `🔮 **${activePlayer.char.char_name || activePlayer.username}** cast Lightning Burst, dealing **${damage} critical magic damage**!`;
                            } else if (activePlayer.role === 'Tank') {
                                activePlayer.taunted = true;
                                playerActionMsg = `🛡️ **${activePlayer.char.char_name || activePlayer.username}** taunted the dragon, dealing **${damage} magic damage** and bracing for impact (blocks 80% next damage)!`;
                            } else {
                                playerActionMsg = `🔮 **${activePlayer.char.char_name || activePlayer.username}** cast Lightning Bolt, dealing **${damage} magic damage**!`;
                            }
                            boss.hp = Math.max(0, boss.hp - damage);
                            activePlayer.dmgDealt += damage;
                        }
                    } 
                    else if (customId === 'raid_action_defend') {
                        groupDefending = true;
                        playerActionMsg = `🛡️ **${activePlayer.char.char_name || activePlayer.username}** fortified the frontlines, shielding the entire party!`;
                    } 
                    else if (customId === 'raid_action_heal') {
                        if (activePlayer.mana < 20) {
                            throw new Error("Not enough Mana! Group Heal costs 20 Mana.");
                        }
                        activePlayer.mana -= 20;
                        const healAmt = activePlayer.role === 'Healer' ? 40 : 25;
                        party.forEach(p => {
                            if (p.hp > 0) {
                                p.hp = Math.min(p.maxHp, p.hp + healAmt);
                            }
                        });
                        playerActionMsg = `💚 **${activePlayer.char.char_name || activePlayer.username}** cast Group Heal! Restored **${healAmt} HP** to all conscious members!`;
                    }

                    // Check if boss died
                    if (boss.hp <= 0) {
                        battleCollector.stop('victory');
                        return;
                    }

                    // Boss Retaliation
                    const alivePlayers = party.filter(p => p.hp > 0);
                    if (alivePlayers.length === 0) {
                        battleCollector.stop('defeat');
                        return;
                    }

                    const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
                    let finalBossDmg = boss.dmg + Math.floor(Math.random() * 6);

                    const activeTanksCount = party.filter(p => p.hp > 0 && p.role === 'Tank').length;
                    const tankMitigation = Math.min(0.60, activeTanksCount * 0.20);
                    finalBossDmg = Math.floor(finalBossDmg * (1 - tankMitigation));

                    const targetDef = target.char.stat_def || 10;
                    finalBossDmg = Math.max(3, finalBossDmg - Math.floor(targetDef * 0.35));

                    if (target.role === 'Tank' && target.taunted) {
                        finalBossDmg = Math.max(1, Math.round(finalBossDmg * 0.20));
                        target.taunted = false;
                        monsterActionMsg = `\n👾 The Cherry Dragon sweeps its claws! <@${target.userId}> blocked the blast, taking only **${finalBossDmg} damage**!`;
                    } else if (groupDefending) {
                        finalBossDmg = Math.max(1, Math.floor(finalBossDmg * 0.65));
                        monsterActionMsg = `\n👾 The Cherry Dragon sweeps its tail! The party block reduces impact. Deals **${finalBossDmg} damage** to <@${target.userId}>!`;
                    } else {
                        monsterActionMsg = `\n👾 The Cherry Dragon spits fire, dealing **${finalBossDmg} damage** directly to <@${target.userId}>!`;
                    }

                    target.hp = Math.max(0, target.hp - finalBossDmg);

                    const stillAlive = party.some(p => p.hp > 0);
                    if (!stillAlive) {
                        battleCollector.stop('defeat');
                        return;
                    }

                    // Rotate active index to next alive member
                    groupDefending = false;
                    let loopSafety = 0;
                    do {
                        activeIdx = (activeIdx + 1) % party.length;
                        loopSafety++;
                    } while (party[activeIdx].hp <= 0 && loopSafety < 10);

                    logFeed = playerActionMsg + monsterActionMsg;
                    updateRaidState();

                    const turnBattle = generateBattleEmbed();
                    await lobbyMsg.edit({
                        embeds: [turnBattle.embed],
                        files: [turnBattle.attachment],
                        components: [battleRow]
                    }).catch(() => null);
                };

                const initialBattle = generateBattleEmbed();
                await interaction.editReply({
                    embeds: [initialBattle.embed],
                    files: [initialBattle.attachment],
                    components: [battleRow]
                });

                const battleCollector = lobbyMsg.createMessageComponentCollector({
                    time: 600000 // 10 minutes max battle
                });

                // Store instance on global for web requests
                global.activeRaidInstance = {
                    party,
                    activeIdx,
                    boss,
                    resolveWebTurn: async (userId, customId) => {
                        await performRaidTurn(userId, customId);
                    }
                };

                battleCollector.on('collect', async (click) => {
                    const clickerId = click.user.id;
                    if (!party.some(p => p.userId === clickerId)) {
                        return click.reply({ content: '❌ You are not a participant in this raid!', flags: [MessageFlags.Ephemeral] });
                    }
                    try {
                        await click.deferUpdate();
                        await performRaidTurn(clickerId, click.customId);
                    } catch (err) {
                        await click.followUp({ content: '❌ ' + err.message, flags: [MessageFlags.Ephemeral] }).catch(() => null);
                    }
                });

                battleCollector.on('end', async (_, reason) => {
                    const finalColor = reason === 'victory' ? '#10b981' : '#ef4444';
                    let reportText = '';

                    if (reason === 'victory') {
                        // Split 2,500 coins pool proportionally based on damage dealt
                        const totalDmg = party.reduce((sum, p) => sum + p.dmgDealt, 0);
                        let payoutListText = '';

                        // Find MVP (Highest damage)
                        let mvp = party[0];
                        party.forEach(p => {
                            if (p.dmgDealt > mvp.dmgDealt) mvp = p;
                        });

                        party.forEach(p => {
                            const pct = totalDmg > 0 ? p.dmgDealt / totalDmg : 0.2;
                            const share = Math.max(100, Math.floor(2500 * pct)); // Consolidated minimum payout 100 coins
                            db.addCoins(p.userId, guildId, share);

                            // Grant Character Level XP
                            db.addXp(p.userId, guildId, 150);

                            // Grant skill level progression
                            const skillType = p.magicUsed ? 'magic' : 'combat';
                            const newSkillLvl = db.increaseSkill(p.userId, skillType, 1);

                            db.unlockAchievement(p.userId, 'guild_raider');

                            db.logTransaction(p.userId, 'Raid Win', `Defeated Magma Dragon co-op share`);
                            payoutListText += `• <@${p.userId}>: \`+🍒 ${share.toLocaleString()}\` cherries | \`+150 XP\` | **${skillType.toUpperCase()} Lvl ${newSkillLvl}**\n`;
                        });

                        // Award MVP item drop
                        db.addItem(mvp.userId, 'Dragon Scale', 1);

                        reportText = 
                            `🏆 **VICTORY!** The party successfully slayed the **${boss.name}**!\n\n` +
                            `⭐ **Raid MVP:** <@${mvp.userId}> (Dealt **${mvp.dmgDealt} dmg**! Awarded: **Dragon Scale** x1 🐉)\n\n` +
                            `📈 **Raid Payouts & Ledger Updates:**\n` +
                            `${payoutListText}`;
                    } 
                    else {
                        // Defeat
                        reportText = 
                            `☠️ **DEFEATED!** The entire raid party collapsed under the dragon's molten breath.\n\n` +
                            `• **Result:** The dragon fled back to the volcanic crags.\n` +
                            `• **Penalty:** Consolation safety recovery has set all party members' HP to \` 10 \` HP. Better luck next time!`;
                    }

                    // Set everyone back to safe HP levels in database
                    party.forEach(p => {
                        const finalHP = reason === 'victory' ? p.hp : 10;
                        db.prepare("UPDATE users SET hp = ?, mana = ? WHERE userId = ?").run(finalHP, p.mana, p.userId);
                    });

                    const finalEmbed = new EmbedBuilder()
                        .setColor(finalColor)
                        .setTitle(`⚔️ RAID DUNGEON REPORT: ${reason.toUpperCase()}`)
                        .setDescription(reportText)
                        .setTimestamp();

                    global.activeRaid = null;
                    global.activeRaidInstance = null;
                    await interaction.editReply({
                        embeds: [finalEmbed],
                        components: []
                    }).catch(() => null);
                });

            } catch (err) {
                console.error('Error in raid execution:', err);
                await interaction.editReply({ content: '❌ There was an error while setting up the raid dungeon.', components: [] });
            }
        });
    }
};
