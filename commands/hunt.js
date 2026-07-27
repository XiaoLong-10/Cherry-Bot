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

const MONSTER_LOBBY = {
    forest: [
        { name: 'Sticky Green Slime', hp: 50, dmg: 8, xp: 30, coinsMin: 40, coinsMax: 80, drop: 'Slime Gel', color: '#10b981' },
        { name: 'Goblin Raider', hp: 80, dmg: 14, xp: 50, coinsMin: 80, coinsMax: 150, drop: 'Goblin Ear', color: '#84cc16' }
    ],
    caverns: [
        { name: 'Undead Skeleton', hp: 130, dmg: 20, xp: 90, coinsMin: 150, coinsMax: 250, drop: 'Ancient Bone', color: '#94a3b8' },
        { name: 'Stone Golem', hp: 200, dmg: 28, xp: 140, coinsMin: 220, coinsMax: 380, drop: 'Iron Ore', color: '#64748b' }
    ],
    volcano: [
        { name: 'Crimson Imp', hp: 160, dmg: 26, xp: 120, coinsMin: 200, coinsMax: 320, drop: 'Coal', color: '#f97316' },
        { name: 'Magma Dragon', hp: 350, dmg: 44, xp: 300, coinsMin: 500, coinsMax: 900, drop: 'Dragon Scale', color: '#ef4444' }
    ]
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hunt')
        .setDescription('⚔️ Venture into dangerous territories to hunt monsters and harvest loot')
        .addStringOption(option =>
            option.setName('zone')
                .setDescription('Select the hunting region')
                .setRequired(true)
                .addChoices(
                    { name: '🌲 Whisper Forest (Lvl 1+)', value: 'forest' },
                    { name: '🪨 Deep Caverns (Lvl 5+)', value: 'caverns' },
                    { name: '🌋 Obsidian Volcano (Lvl 15+)', value: 'volcano' }
                )),

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

        // Check if player is dead
        if ((char.hp || 0) <= 0) {
            return interaction.reply({
                content: '❌ **You are too weak to hunt!** Your HP is `0`.\nUse `/character use` to drink a **Health Potion** or rest before venturing out.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        const zone = interaction.options.getString('zone');
        const zoneNames = { forest: '🌲 Whisper Forest', caverns: '🪨 Deep Caverns', volcano: '🌋 Obsidian Volcano' };

        // Select Monster
        const list = MONSTER_LOBBY[zone];
        const roll = Math.random();
        const monsterTemplate = roll < 0.65 ? list[0] : list[1];

        // Clone template for active battle instance
        const monster = {
            name: monsterTemplate.name,
            hp: monsterTemplate.hp,
            maxHp: monsterTemplate.hp,
            dmg: monsterTemplate.dmg,
            xp: monsterTemplate.xp,
            coinsMin: monsterTemplate.coinsMin,
            coinsMax: monsterTemplate.coinsMax,
            drop: monsterTemplate.drop,
            color: monsterTemplate.color
        };

        await interaction.deferReply();

        let playerHP = char.hp;
        let playerMP = char.mana || 50;
        const maxHP = char.max_hp || 100;
        const maxMP = char.max_mana || 50;

        let defending = false;
        let magicUsed = false;
        let battleLog = `⚔️ You encountered a **${monster.name}** in the ${zoneNames[zone]}! Prepare yourself!`;

        const getProgressBar = (val, max, length = 12) => {
            const filled = Math.max(0, Math.min(length, Math.round((val / max) * length)));
            return '🟩'.repeat(filled) + '⬛'.repeat(length - filled);
        };

        const generateHuntCanvas = (zone, monster, char, playerHP, maxHP, playerMP, maxMP, battleLog) => {
            const canvas = createCanvas(800, 500);
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;

            // Cavern/Forest/Volcano Arena background
            const bgGrad = ctx.createRadialGradient(400, 250, 50, 400, 250, 450);
            if (zone === 'forest') {
                bgGrad.addColorStop(0, '#fbcfe8'); // Soft pink
                bgGrad.addColorStop(0.7, '#f472b6');
            } else if (zone === 'caverns') {
                bgGrad.addColorStop(0, '#e9d5ff'); // Soft purple
                bgGrad.addColorStop(0.7, '#fbcfe8');
            } else { // volcano
                bgGrad.addColorStop(0, '#fecaca'); // Soft peach
                bgGrad.addColorStop(0.7, '#fbcfe8');
            }
            bgGrad.addColorStop(1, '#db2777');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, 800, 500);

            // Thin gridlines
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
            ctx.lineWidth = 1;
            for (let x = 0; x < 800; x += 40) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 500); ctx.stroke();
            }
            for (let y = 0; y < 500; y += 40) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(800, y); ctx.stroke();
            }

            // --- LEFT COLUMN: Player Card ---
            const pX = 40;
            const pY = 50;
            const pW = 320;
            const pH = 230;

            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.strokeStyle = 'rgba(244, 114, 182, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(pX, pY, pW, pH, 16);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // Player details
            ctx.fillStyle = '#be185d';
            ctx.font = 'bold 16px sans-serif';
            ctx.fillText(`👤 ${char.char_name}`, pX + 20, pY + 36);

            ctx.fillStyle = '#db2777';
            ctx.font = 'bold 11px sans-serif';
            ctx.fillText(`LEVEL ${char.level || 1} HERO`, pX + 20, pY + 58);

            // Dividing line
            ctx.strokeStyle = 'rgba(244, 114, 182, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pX + 20, pY + 74);
            ctx.lineTo(pX + pW - 20, pY + 74);
            ctx.stroke();

            // Player HP Bar
            const barW = 280;
            const barH = 12;

            ctx.fillStyle = '#831843';
            ctx.font = 'bold 11px sans-serif';
            ctx.fillText(`HP: ${playerHP} / ${maxHP}`, pX + 20, pY + 104);

            ctx.fillStyle = '#fce7f3';
            ctx.beginPath();
            ctx.roundRect(pX + 20, pY + 114, barW, barH, 6);
            ctx.fill();

            const pHPpct = Math.max(0, Math.min(1, playerHP / maxHP));
            if (pHPpct > 0) {
                const hpGrad = ctx.createLinearGradient(pX + 20, pY + 114, pX + 20 + barW, pY + 114);
                hpGrad.addColorStop(0, '#f472b6');
                hpGrad.addColorStop(1, '#db2777');
                ctx.fillStyle = hpGrad;
                ctx.beginPath();
                ctx.roundRect(pX + 20, pY + 114, barW * pHPpct, barH, 6);
                ctx.fill();
            }

            // Player MP Bar
            ctx.fillStyle = '#831843';
            ctx.font = 'bold 11px sans-serif';
            ctx.fillText(`MANA: ${playerMP} / ${maxMP}`, pX + 20, pY + 158);

            ctx.fillStyle = '#fce7f3';
            ctx.beginPath();
            ctx.roundRect(pX + 20, pY + 168, barW, barH, 6);
            ctx.fill();

            const pMPpct = Math.max(0, Math.min(1, playerMP / maxMP));
            if (pMPpct > 0) {
                const mpGrad = ctx.createLinearGradient(pX + 20, pY + 168, pX + 20 + barW, pY + 168);
                mpGrad.addColorStop(0, '#c084fc');
                mpGrad.addColorStop(1, '#a855f7');
                ctx.fillStyle = mpGrad;
                ctx.beginPath();
                ctx.roundRect(pX + 20, pY + 168, barW * pMPpct, barH, 6);
                ctx.fill();
            }

            // --- RIGHT COLUMN: Monster Card ---
            const mX = 440;
            const mY = 50;
            const mW = 320;
            const mH = 230;

            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.strokeStyle = 'rgba(244, 114, 182, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(mX, mY, mW, mH, 16);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // Monster details
            ctx.fillStyle = '#be185d';
            ctx.font = 'bold 16px sans-serif';
            ctx.fillText(`👾 ${monster.name}`, mX + 20, mY + 36);

            ctx.fillStyle = '#db2777';
            ctx.font = 'bold 11px sans-serif';
            ctx.fillText('WILD ENEMY', mX + 20, mY + 58);

            // Dividing line
            ctx.strokeStyle = 'rgba(244, 114, 182, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(mX + 20, mY + 74);
            ctx.lineTo(mX + mW - 20, mY + 74);
            ctx.stroke();

            // Monster HP Bar
            ctx.fillStyle = '#831843';
            ctx.font = 'bold 11px sans-serif';
            ctx.fillText(`HP: ${monster.hp} / ${monster.maxHp}`, mX + 20, mY + 104);

            ctx.fillStyle = '#fce7f3';
            ctx.beginPath();
            ctx.roundRect(mX + 20, mY + 114, barW, barH, 6);
            ctx.fill();

            const mHPpct = Math.max(0, Math.min(1, monster.hp / monster.maxHp));
            if (mHPpct > 0) {
                const mhpGrad = ctx.createLinearGradient(mX + 20, mY + 114, mX + 20 + barW, mY + 114);
                mhpGrad.addColorStop(0, '#ef4444');
                mhpGrad.addColorStop(1, '#b91c1c');
                ctx.fillStyle = mhpGrad;
                ctx.beginPath();
                ctx.roundRect(mX + 20, mY + 114, barW * mHPpct, barH, 6);
                ctx.fill();
            }

            // Monster Sprite/Emoji
            let monsterEmoji = '👾';
            if (monster.name.includes('Slime')) monsterEmoji = '🟢';
            else if (monster.name.includes('Goblin')) monsterEmoji = '👺';
            else if (monster.name.includes('Skeleton')) monsterEmoji = '💀';
            else if (monster.name.includes('Golem')) monsterEmoji = '🪨';
            else if (monster.name.includes('Imp')) monsterEmoji = '👿';
            else if (monster.name.includes('Dragon')) monsterEmoji = '🐉';

            ctx.save();
            ctx.font = '76px "Segoe UI Emoji", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(monsterEmoji, mX + mW / 2, mY + 175);
            ctx.restore();

            // --- BOTTOM COLUMN: Battle Feed ---
            const bX = 40;
            const bY = 310;
            const bW = 720;
            const bH = 145;

            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.strokeStyle = 'rgba(244, 114, 182, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(bX, bY, bW, bH, 12);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#db2777';
            ctx.font = 'bold 11px sans-serif';
            ctx.fillText('📣 BATTLE FEED', bX + 20, bY + 28);

            // Wrapped logs text (removes markdown bolding)
            ctx.fillStyle = '#831843';
            ctx.font = 'italic 13px sans-serif';
            
            const cleanLog = battleLog.replace(/\*\*/g, '').replace(/\*/g, '');
            const logLines = cleanLog.split('\n');

            logLines.slice(0, 4).forEach((line, idx) => {
                ctx.fillText(line, bX + 20, bY + 54 + idx * 24);
            });
            ctx.restore();

            return canvas.toBuffer('image/png');
        };

        const generateEmbed = (color = '#6366f1') => {
            const buffer = generateHuntCanvas(zone, monster, char, playerHP, maxHP, playerMP, maxMP, battleLog);
            const attachment = new AttachmentBuilder(buffer, { name: 'hunt-battle.png' });

            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle(`⚔️ BATTLE IN THE ${zoneNames[zone].toUpperCase()}`)
                .setDescription(`Battle progress vs **${monster.name}** in the ${zoneNames[zone]}`)
                .setImage('attachment://hunt-battle.png')
                .setFooter({ text: 'Commands: Attack (STR) ┃ Spell (15 Mana, INT) ┃ Defend (+DEF) ┃ Flee (DEX)' })
                .setTimestamp();

            return { embed, attachment };
        };

        const attackBtn = new ButtonBuilder().setCustomId('hunt_btn_attack').setLabel('Attack').setStyle(ButtonStyle.Danger).setEmoji('⚔️');
        const spellBtn = new ButtonBuilder().setCustomId('hunt_btn_spell').setLabel('Cast Spell').setStyle(ButtonStyle.Primary).setEmoji('🔮');
        const defendBtn = new ButtonBuilder().setCustomId('hunt_btn_defend').setLabel('Defend').setStyle(ButtonStyle.Secondary).setEmoji('🛡️');
        const fleeBtn = new ButtonBuilder().setCustomId('hunt_btn_flee').setLabel('Flee').setStyle(ButtonStyle.Secondary).setEmoji('🏃');

        const row = new ActionRowBuilder().addComponents(attackBtn, spellBtn, defendBtn, fleeBtn);

        const initialBattle = generateEmbed();
        const battleMessage = await interaction.editReply({
            embeds: [initialBattle.embed],
            files: [initialBattle.attachment],
            components: [row]
        });

        const collector = battleMessage.createMessageComponentCollector({
            filter: i => i.user.id === userId,
            time: 300000 // 5 minutes
        });

        collector.on('collect', async (i) => {
            await i.deferUpdate();

            defending = false;
            let playerActionMsg = '';
            let monsterActionMsg = '';

            if (i.customId === 'hunt_btn_attack') {
                // Physical Attack
                const str = char.stat_str || 10;
                const dex = char.stat_dex || 10;
                let damage = 10 + Math.floor(str * 0.5) + Math.floor(Math.random() * 5);
                
                // Crit Chance scales with DEX (max 40%)
                const critChance = Math.min(40, Math.floor(dex * 0.8));
                const isCrit = Math.random() * 100 < critChance;
                if (isCrit) {
                    damage = Math.floor(damage * 1.8);
                    playerActionMsg = `💥 **CRITICAL HIT!** You struck the monster for **${damage} damage**!`;
                } else {
                    playerActionMsg = `⚔️ You attacked and dealt **${damage} damage**!`;
                }

                monster.hp = Math.max(0, monster.hp - damage);
            } 
            else if (i.customId === 'hunt_btn_spell') {
                // Magical Spell
                if (playerMP < 15) {
                    return interaction.followUp({ content: '❌ **Not enough Mana!** Spells cost 15 Mana.', flags: [MessageFlags.Ephemeral] });
                }

                playerMP -= 15;
                magicUsed = true;
                const int = char.stat_int || 10;
                const damage = 22 + int + Math.floor(Math.random() * 6);
                
                playerActionMsg = `🔮 You cast a Fireball and incinerated the monster for **${damage} damage**!`;
                monster.hp = Math.max(0, monster.hp - damage);
            } 
            else if (i.customId === 'hunt_btn_defend') {
                // Defend
                defending = true;
                playerActionMsg = `🛡️ You entered a defensive stance, guarding against the next attack!`;
            } 
            else if (i.customId === 'hunt_btn_flee') {
                // Flee
                const dex = char.stat_dex || 10;
                const escapeChance = 50 + dex * 1.5; // DEX increases escape chance
                const escaped = Math.random() * 100 < escapeChance;

                if (escaped) {
                    collector.stop('fled');
                    return;
                } else {
                    playerActionMsg = `🏃 You tried to escape, but the monster blocked your exit!`;
                }
            }

            // Check if monster died
            if (monster.hp <= 0) {
                collector.stop('won');
                return;
            }

            // Monster Turn
            let monsterDmg = monster.dmg + Math.floor(Math.random() * 4);
            const def = char.stat_def || 10;

            // Reduce monster damage based on player defense stats
            monsterDmg = Math.max(2, monsterDmg - Math.floor(def * 0.4));

            if (defending) {
                monsterDmg = Math.max(1, Math.floor(monsterDmg * 0.4)); // Guard blocks 60% of damage
                monsterActionMsg = `👾 The monster struck your shield, dealing a minor **${monsterDmg} damage**!`;
            } else {
                monsterActionMsg = `👾 The monster retaliated, dealing **${monsterDmg} damage** to you!`;
            }

            playerHP = Math.max(0, playerHP - monsterDmg);

            // Check if player died
            if (playerHP <= 0) {
                collector.stop('died');
                return;
            }

            // Update Database stats temporarily so potions sync
            db.prepare("UPDATE users SET hp = ?, mana = ? WHERE userId = ?").run(playerHP, playerMP, userId);

            battleLog = `${playerActionMsg}\n${monsterActionMsg}`;
            const turnBattle = generateEmbed();
            await interaction.editReply({
                embeds: [turnBattle.embed],
                files: [turnBattle.attachment]
            });
        });

        collector.on('end', async (_, reason) => {
            const finalColor = reason === 'won' ? '#10b981' : reason === 'died' ? '#ef4444' : '#6b7280';
            let finalDesc = '';

            if (reason === 'won') {
                // Resolve Loot
                const coinsReward = Math.floor(Math.random() * (monster.coinsMax - monster.coinsMin + 1)) + monster.coinsMin;
                db.addCoins(userId, guildId, coinsReward);
                db.addItem(userId, monster.drop, 1);

                // Add character level XP
                const lvlUp = db.addXp(userId, guildId, monster.xp);

                // Add skill progression levels
                const skillType = magicUsed ? 'magic' : 'combat';
                const newSkillLvl = db.increaseSkill(userId, skillType, 1);

                // Fully save remaining battle HP/Mana back to DB
                db.prepare("UPDATE users SET hp = ?, mana = ? WHERE userId = ?").run(playerHP, playerMP, userId);
                db.logTransaction(userId, 'Dungeon Hunt', `Defeated ${monster.name} in ${zone}`);

                finalDesc = 
                    `🏆 **VICTORY!** You successfully defeated the **${monster.name}**!\n\n` +
                    `📈 **Battle Rewards:**\n` +
                    `• **Cherries:** +🍒 **${coinsReward}** cherries\n` +
                    `• **Loot:** Gathered **${monster.drop}** x1 (added to artifacts vault)\n` +
                    `• **Character XP:** +**${monster.xp}** XP\n` +
                    `• **RPG Skill:** Your **${skillType.toUpperCase()}** skill increased to **Lvl ${newSkillLvl}**!\n` +
                    (lvlUp && lvlUp.leveledUp ? `🎉 **LEVEL UP!** You leveled up to **Lvl ${lvlUp.newLevel}**!\n` : '') +
                    `\n👤 **Remaining Status:** \`HP: ${playerHP} / ${maxHP}\` | \`Mana: ${playerMP} / ${maxMP}\``;
            } 
            else if (reason === 'died') {
                // Penalty: Lose 10% pocket money and HP is set to 0
                const currentBalance = db.getBalance(userId, guildId);
                const penalty = Math.floor(currentBalance * 0.1);
                db.deductCoins(userId, guildId, penalty);
                db.prepare("UPDATE users SET hp = 0, mana = ? WHERE userId = ?").run(playerMP, userId);
                db.logTransaction(userId, 'Dungeon Defeat', `Died fighting ${monster.name}`);

                finalDesc = 
                    `☠️ **DEFEATED!** You fell in combat against the **${monster.name}**.\n\n` +
                    `📈 **Casualty Ledger:**\n` +
                    `• **HP:** set to \` 0 \` HP\n` +
                    `• **Cherries Penalty:** Lost 10% of pocket cherries (\`-🍒 ${penalty.toLocaleString()} cherries\`)\n` +
                    `• **Resurrection:** Drink a **Health Potion** using \`/character use\` to restore HP before hunting again!`;
            } 
            else if (reason === 'fled') {
                // Escape
                db.prepare("UPDATE users SET hp = ?, mana = ? WHERE userId = ?").run(playerHP, playerMP, userId);
                finalDesc = `🏃 **Escaped!** You successfully dodged the monster and fled back to the local tavern. HP and Mana saved.`;
            } 
            else {
                // Timeout
                db.prepare("UPDATE users SET hp = ?, mana = ? WHERE userId = ?").run(playerHP, playerMP, userId);
                finalDesc = `⏳ **Battle Expired!** You fell asleep in the dungeon and crawled back to safety.`;
            }

            const finalEmbed = new EmbedBuilder()
                .setColor(finalColor)
                .setTitle(`⚔️ BATTLE REPORT: ${reason.toUpperCase()}`)
                .setDescription(finalDesc)
                .setTimestamp();

            await interaction.editReply({
                embeds: [finalEmbed],
                components: []
            }).catch(() => null);
        });
    }
};
