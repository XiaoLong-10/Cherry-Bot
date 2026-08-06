const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    AttachmentBuilder, 
    MessageFlags
} = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const db = require('../database.js');

// Class base stats definitions
const CLASS_STATS = {
    Warrior:  { hp: 150, mp: 40,  str: 15, def: 12, dex: 10, int: 6,  luc: 8,  cha: 9,  vit: 15, color: '#f472b6', emoji: '⚔️' },
    Mage:     { hp: 80,  mp: 150, str: 5,  def: 8,  dex: 10, int: 18, luc: 10, cha: 11, vit: 8,  color: '#c084fc', emoji: '🔮' },
    Rogue:    { hp: 100, mp: 60,  str: 10, def: 8,  dex: 18, int: 10, luc: 14, cha: 12, vit: 10, color: '#fb7185', emoji: '🗡️' },
    Merchant: { hp: 100, mp: 70,  str: 8,  def: 10, dex: 12, int: 12, luc: 15, cha: 16, vit: 10, color: '#fbcfe8', emoji: '🍒' },
    Cleric:   { hp: 120, mp: 110, str: 9,  def: 11, dex: 9,  int: 14, luc: 10, cha: 13, vit: 12, color: '#db2777', emoji: '✨' }
};

const RACES = [
    { label: 'Human', emoji: '🧑', desc: 'Versatile and ambitious adventurers.' },
    { label: 'Elf', emoji: '🧝', desc: 'Graceful beings with high affinity for magic.' },
    { label: 'Dwarf', emoji: '🧔', desc: 'Sturdy, master smiths of the deep mountains.' },
    { label: 'Orc', emoji: '👹', desc: 'Powerful warriors valued for raw strength.' },
    { label: 'Halfling', emoji: '👦', desc: 'Small, nimble, and extraordinarily lucky.' }
];

function drawProgressBar(ctx, x, y, width, height, value, max, color, bgColor = '#fce7f3') {
    ctx.save();
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, height / 2);
    ctx.fill();
    
    const filledWidth = Math.max(0, Math.min(width, (value / max) * width));
    if (filledWidth > 0) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(x, y, filledWidth, height, height / 2);
        ctx.fill();
    }
    ctx.restore();
}

function drawRoundCard(ctx, x, y, w, h, radius, fillColor, strokeColor, strokeWidth = 1) {
    ctx.save();
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fill();
    if (strokeColor) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.stroke();
    }
    ctx.restore();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('character')
        .setDescription('🛡️ Create, view, and customize your RPG Adventurer profile')
        .addSubcommand(sub =>
            sub.setName('create')
                .setDescription('✨ Start your journey and create a new custom RPG character'))
        .addSubcommand(sub =>
            sub.setName('view')
                .setDescription('📇 View your RPG statistics and attribute sheet')
                .addUserOption(opt => opt.setName('user').setDescription('View another user\'s character card').setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('customize')
                .setDescription('🎨 Update your character details (gender, bio, avatar)'))
        .addSubcommand(sub =>
            sub.setName('title')
                .setDescription('👑 Select your active earned Title')
                .addStringOption(opt => opt.setName('name').setDescription('Title name to equip (e.g. Adventurer)').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('equip')
                .setDescription('⚔️ Equip a weapon or shield from your artifacts vault')
                .addStringOption(opt =>
                    opt.setName('name')
                        .setDescription('The name of the item to equip')
                        .setRequired(true)
                        .addChoices(
                            { name: '⚔️ Iron Sword (+5 STR)', value: 'Iron Sword' },
                            { name: '🏹 Oak Bow (+5 DEX)', value: 'Oak Bow' },
                            { name: '🔮 Magic Staff (+5 INT)', value: 'Magic Staff' },
                            { name: '🔱 Gold Sword (+8 STR)', value: 'Gold Sword' },
                            { name: '🛡️ Wooden Shield (+3 DEF)', value: 'Wooden Shield' },
                            { name: '🧱 Plated Shield (+6 DEF)', value: 'Plated Shield' },
                            { name: '💍 Gold Ring (+5 LUC)', value: 'Gold Ring' }
                        )))
        .addSubcommand(sub =>
            sub.setName('use')
                .setDescription('🧪 Consume a potion from your vault to restore HP or Mana')
                .addStringOption(opt =>
                    opt.setName('potion')
                        .setDescription('The potion to drink')
                        .setRequired(true)
                        .addChoices(
                            { name: '🧪 Health Potion (Restores 50 HP)', value: 'Health Potion' },
                            { name: '🌀 Mana Potion (Restores 40 Mana)', value: 'Mana Potion' }
                        ))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;
        const guildId = interaction.guild ? (interaction.guild ? interaction.guild.id : 'GLOBAL') : 'GLOBAL';

        // --- SUBCOMMAND: CREATE ---
        if (subcommand === 'create') {
            const existingChar = db.getCharacter(userId);
            if (existingChar && existingChar.char_name && existingChar.char_name !== 'Adventurer') {
                return interaction.reply({ 
                    content: `⚠️ You already have an established adventurer named **${existingChar.char_name}**! Use \`/character view\` to check stats.`, 
                    flags: [MessageFlags.Ephemeral] 
                });
            }

            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

            let selectedRace = null;
            let selectedClass = null;
            let details = {
                name: interaction.user.username,
                age: 20,
                gender: 'Unknown',
                background: 'A fresh recruit seeking fame and fortune in Cherry land.'
            };

            const generateCreationEmbed = () => {
                return new EmbedBuilder()
                    .setColor('#f472b6')
                    .setTitle('🎀 Adventurer Character Registry')
                    .setDescription('Configure your character details, select a Class and Race, and begin your story!')
                    .addFields(
                        { name: '👤 Character Name', value: `\`${details.name}\` (Age: ${details.age} | ${details.gender})`, inline: true },
                        { name: '🌱 Selected Race', value: selectedRace ? `${selectedRace.emoji} **${selectedRace.label}**` : '❌ *Not selected*', inline: true },
                        { name: '⚔️ Selected Class', value: selectedClass ? `${CLASS_STATS[selectedClass].emoji} **${selectedClass}**` : '❌ *Not selected*', inline: true },
                        { name: '📜 Background / Bio', value: `*"${details.background}"*` }
                    )
                    .setFooter({ text: 'Select class & race below, click Details to edit name/age, then click Confirm!' });
            };

            const raceSelect = new StringSelectMenuBuilder()
                .setCustomId('char_select_race')
                .setPlaceholder('Select your character Race...')
                .addOptions(RACES.map(r => ({
                    label: r.label,
                    value: r.label,
                    description: r.desc,
                    emoji: r.emoji
                })));

            const classSelect = new StringSelectMenuBuilder()
                .setCustomId('char_select_class')
                .setPlaceholder('Select your combat Class...')
                .addOptions(Object.keys(CLASS_STATS).map(k => ({
                    label: k,
                    value: k,
                    description: `Primary Stats: HP, MP, and combat scaling.`,
                    emoji: CLASS_STATS[k].emoji
                })));

            const editDetailsBtn = new ButtonBuilder()
                .setCustomId('char_btn_details')
                .setLabel('Set Name & Details')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('✏️');

            const confirmBtn = new ButtonBuilder()
                .setCustomId('char_btn_confirm')
                .setLabel('Confirm & Create')
                .setStyle(ButtonStyle.Success)
                .setEmoji('✅')
                .setDisabled(true);

            const rowRace = new ActionRowBuilder().addComponents(raceSelect);
            const rowClass = new ActionRowBuilder().addComponents(classSelect);
            const rowBtns = new ActionRowBuilder().addComponents(editDetailsBtn, confirmBtn);

            const creationMsg = await interaction.editReply({
                embeds: [generateCreationEmbed()],
                components: [rowRace, rowClass, rowBtns]
            });

            const collector = creationMsg.createMessageComponentCollector({
                time: 300000 // 5 minutes
            });

            collector.on('collect', async (i) => {
                if (i.customId === 'char_select_race') {
                    selectedRace = RACES.find(r => r.label === i.values[0]);
                    confirmBtn.setDisabled(!selectedRace || !selectedClass);
                    await i.update({
                        embeds: [generateCreationEmbed()],
                        components: [rowRace, rowClass, rowBtns]
                    });
                } 
                else if (i.customId === 'char_select_class') {
                    selectedClass = i.values[0];
                    confirmBtn.setDisabled(!selectedRace || !selectedClass);
                    await i.update({
                        embeds: [generateCreationEmbed()],
                        components: [rowRace, rowClass, rowBtns]
                    });
                }
                else if (i.customId === 'char_btn_details') {
                    const modal = new ModalBuilder()
                        .setCustomId('char_details_modal')
                        .setTitle('Configure Character Details');

                    const nameInput = new TextInputBuilder()
                        .setCustomId('modal_name')
                        .setLabel('Character Name')
                        .setStyle(TextInputStyle.Short)
                        .setValue(details.name)
                        .setMaxLength(25)
                        .setRequired(true);

                    const ageInput = new TextInputBuilder()
                        .setCustomId('modal_age')
                        .setLabel('Character Age (Years)')
                        .setStyle(TextInputStyle.Short)
                        .setValue(details.age.toString())
                        .setMaxLength(3)
                        .setRequired(true);

                    const genderInput = new TextInputBuilder()
                        .setCustomId('modal_gender')
                        .setLabel('Gender')
                        .setStyle(TextInputStyle.Short)
                        .setValue(details.gender)
                        .setMaxLength(15)
                        .setRequired(false);

                    const bioInput = new TextInputBuilder()
                        .setCustomId('modal_bio')
                        .setLabel('Biography / Background Story')
                        .setStyle(TextInputStyle.Paragraph)
                        .setValue(details.background)
                        .setMaxLength(250)
                        .setRequired(false);

                    modal.addComponents(
                        new ActionRowBuilder().addComponents(nameInput),
                        new ActionRowBuilder().addComponents(ageInput),
                        new ActionRowBuilder().addComponents(genderInput),
                        new ActionRowBuilder().addComponents(bioInput)
                    );

                    await i.showModal(modal);

                    const modalSubmit = await i.awaitModalSubmit({
                        time: 120000,
                        filter: mi => mi.customId === 'char_details_modal' && mi.user.id === userId
                    }).catch(() => null);

                    if (modalSubmit) {
                        details.name = modalSubmit.fields.getTextInputValue('modal_name').trim();
                        details.gender = modalSubmit.fields.getTextInputValue('modal_gender').trim() || 'Unknown';
                        
                        const rawAge = modalSubmit.fields.getTextInputValue('modal_age').trim();
                        details.age = isNaN(parseInt(rawAge)) ? 20 : Math.max(1, Math.min(999, parseInt(rawAge)));
                        
                        details.background = modalSubmit.fields.getTextInputValue('modal_bio').trim() || 'A mysterious traveller.';

                        await modalSubmit.update({
                            embeds: [generateCreationEmbed()],
                            components: [rowRace, rowClass, rowBtns]
                        });
                    }
                }
                else if (i.customId === 'char_btn_confirm') {
                    collector.stop('confirmed');
                    await i.deferUpdate();

                    const stats = CLASS_STATS[selectedClass];

                    // Save to database
                    db.updateCharacter(userId, {
                        name: details.name,
                        age: details.age,
                        gender: details.gender,
                        race: selectedRace.label,
                        className: selectedClass,
                        background: details.background,
                        avatar: interaction.user.displayAvatarURL({ extension: 'png' })
                    });

                    db.initializeRPGStats(userId, {
                        hp: stats.hp,
                        mp: stats.mp,
                        str: stats.str,
                        def: stats.def,
                        dex: stats.dex,
                        int: stats.int,
                        luc: stats.luc,
                        cha: stats.cha,
                        vit: stats.vit
                    });

                    db.logTransaction(userId, 'Character Creation', `Registered as a ${selectedRace.label} ${selectedClass} 🛡️`);

                    const finalEmbed = new EmbedBuilder()
                        .setColor('#fbcfe8')
                        .setTitle('🎉 Adventurer Registered Successfully!')
                        .setDescription(`Your character **${details.name}** the **${selectedRace.label} ${selectedClass}** has been written to the ledger!`)
                        .addFields(
                            { name: '❤️ Starting HP', value: `\`${stats.hp}\``, inline: true },
                            { name: '🧪 Starting MP', value: `\`${stats.mp}\``, inline: true },
                            { name: '✨ Character Level', value: '`Level 1`', inline: true }
                        )
                        .setTimestamp();

                    await interaction.editReply({
                        embeds: [finalEmbed],
                        components: []
                    });
                }
            });

            collector.on('end', async (_, reason) => {
                if (reason !== 'confirmed') {
                    // Disable components on timeout
                    const disabledRace = StringSelectMenuBuilder.from(raceSelect).setDisabled(true);
                    const disabledClass = StringSelectMenuBuilder.from(classSelect).setDisabled(true);
                    const disabledDetails = ButtonBuilder.from(editDetailsBtn).setDisabled(true);
                    const disabledConfirm = ButtonBuilder.from(confirmBtn).setDisabled(true);

                    await interaction.editReply({
                        components: [
                            new ActionRowBuilder().addComponents(disabledRace),
                            new ActionRowBuilder().addComponents(disabledClass),
                            new ActionRowBuilder().addComponents(disabledDetails, disabledConfirm)
                        ]
                    }).catch(() => null);
                }
            });
        }

        // --- SUBCOMMAND: VIEW ---
        else if (subcommand === 'view') {
            await interaction.deferReply();
            const targetUser = interaction.options.getUser('user') || interaction.user;
            const char = db.getCharacter(targetUser.id);

            if (!char || !char.char_name) {
                return interaction.editReply({
                    content: targetUser.id === userId 
                        ? '⚠️ **You have not created a character yet!** Use `/character create` to get started.'
                        : `⚠️ **${targetUser.username}** has not registered an RPG character yet.`
                });
            }

            try {
                const canvas = createCanvas(800, 480);
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;

                // 1. Draw Wooden Table / Scroll Background
                ctx.fillStyle = '#fce7f3'; // Cute pink background
                ctx.fillRect(0, 0, 800, 480);

                // Golden Parchment Paper
                const pX = 35;
                const pY = 20;
                const pW = 730;
                const pH = 440;

                ctx.save();
                ctx.shadowColor = 'rgba(244, 114, 182, 0.4)';
                ctx.shadowBlur = 20;
                ctx.shadowOffsetY = 10;
                ctx.fillStyle = '#fdf4ff'; // Warm eggshell parchment
                ctx.strokeStyle = '#fbcfe8'; // Brown scroll border
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.roundRect(pX, pY, pW, pH, 12);
                ctx.fill();
                ctx.stroke();
                ctx.restore();

                // Draw Left and Right wooden scroll rollers
                ctx.fillStyle = '#f472b6'; // Very dark wood rollers
                ctx.fillRect(15, 10, 20, 460);
                ctx.fillRect(765, 10, 20, 460);

                // Roller gold knobs
                ctx.fillStyle = '#db2777';
                ctx.beginPath();
                ctx.arc(25, 10, 12, 0, Math.PI * 2);
                ctx.arc(25, 470, 12, 0, Math.PI * 2);
                ctx.arc(775, 10, 12, 0, Math.PI * 2);
                ctx.arc(775, 470, 12, 0, Math.PI * 2);
                ctx.fill();

                // 2. LEFT COLUMN (Avatar & Details)
                const col1X = 60;
                const col1W = 210;

                // Load Avatar Image
                let avatarImg;
                try {
                    const avatarUrl = char.char_avatar || targetUser.displayAvatarURL({ extension: 'png', size: 256 });
                    avatarImg = await loadImage(avatarUrl);
                } catch (err) {}

                if (avatarImg) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(col1X + col1W / 2, 105, 55, 0, Math.PI * 2);
                    ctx.clip();
                    ctx.drawImage(avatarImg, col1X + col1W / 2 - 55, 50, 110, 110);
                    ctx.restore();

                    // Gold Border Ring
                    ctx.strokeStyle = '#db2777';
                    ctx.lineWidth = 3.5;
                    ctx.beginPath();
                    ctx.arc(col1X + col1W / 2, 105, 57, 0, Math.PI * 2);
                    ctx.stroke();
                }

                // Name
                ctx.fillStyle = '#831843';
                ctx.font = 'bold 20px "Georgia", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(char.char_name, col1X + col1W / 2, 186);

                // Title
                const activeTitle = char.active_title || 'Novice Adventurer';
                ctx.fillStyle = '#db2777';
                ctx.font = 'italic 11px sans-serif';
                ctx.fillText(activeTitle, col1X + col1W / 2, 206);

                // Level / Class Details
                ctx.fillStyle = '#9d174d';
                ctx.font = 'bold 11px sans-serif';
                ctx.fillText(`Lvl ${char.level} — ${char.char_race} ${char.char_class}`, col1X + col1W / 2, 226);

                // HP & Mana Bars
                ctx.textAlign = 'left';
                const col1BarW = 180;
                const col1BarH = 10;
                const startY = 245;

                // HP
                ctx.fillStyle = '#9d174d';
                ctx.font = 'bold 9px sans-serif';
                ctx.fillText(`HP: ${char.hp} / ${char.max_hp || 100}`, col1X + 15, startY + 12);
                drawProgressBar(ctx, col1X + 15, startY + 18, col1BarW, col1BarH, char.hp, char.max_hp || 100, '#f472b6', '#fce7f3');

                // Mana
                ctx.fillStyle = '#9d174d';
                ctx.fillText(`MANA: ${char.mana || 50} / ${char.max_mana || 50}`, col1X + 15, startY + 44);
                drawProgressBar(ctx, col1X + 15, startY + 50, col1BarW, col1BarH, char.mana || 50, char.max_mana || 50, '#c084fc', '#fce7f3');

                // XP
                const xpNeeded = char.level * 100;
                const xpPercent = Math.min(100, Math.round((char.xp / xpNeeded) * 100));
                ctx.fillStyle = '#9d174d';
                ctx.fillText(`XP: ${char.xp} / ${xpNeeded} (${xpPercent}%)`, col1X + 15, startY + 76);
                drawProgressBar(ctx, col1X + 15, startY + 82, col1BarW, col1BarH, char.xp, xpNeeded, '#db2777', '#fce7f3');

                // 3. MIDDLE COLUMN (Core Attribute Progress Bars)
                const col2X = 300;
                const col2W = 220;

                ctx.fillStyle = '#831843';
                ctx.font = 'bold 14px "Georgia", sans-serif';
                ctx.fillText('🎀 CORE ATTRIBUTES', col2X, 60);

                // Divider line
                ctx.strokeStyle = 'rgba(219, 39, 119, 0.15)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(col2X, 70);
                ctx.lineTo(col2X + col2W, 70);
                ctx.stroke();

                const attrList = [
                    { label: '💪 STRENGTH', val: char.stat_str || 10, color: '#f472b6' },
                    { label: '🛡️ DEFENSE', val: char.stat_def || 10, color: '#fbcfe8' },
                    { label: '🎯 DEXTERITY', val: char.stat_dex || 10, color: '#db2777' },
                    { label: '🧠 INTELLIGENCE', val: char.stat_int || 10, color: '#c084fc' },
                    { label: '🍀 LUCK', val: char.stat_luc || 10, color: '#f9a8d4' },
                    { label: '🪵 VITALITY', val: char.stat_vit || 10, color: '#be185d' }
                ];

                attrList.forEach((attr, idx) => {
                    const y = 92 + idx * 60;

                    ctx.fillStyle = '#831843';
                    ctx.font = 'bold 10px sans-serif';
                    ctx.fillText(attr.label, col2X, y);

                    ctx.fillStyle = '#9d174d';
                    ctx.font = 'bold 11px sans-serif';
                    ctx.textAlign = 'right';
                    ctx.fillText(attr.val.toString(), col2X + col2W, y);
                    ctx.textAlign = 'left';

                    drawProgressBar(ctx, col2X, y + 6, col2W, 8, attr.val, 50, attr.color, '#fce7f3');
                });

                // 4. RIGHT COLUMN (Equipment & Life Skills)
                const col3X = 550;
                const col3W = 190;

                ctx.fillStyle = '#831843';
                ctx.font = 'bold 14px "Georgia", sans-serif';
                ctx.fillText('🎀 GEAR & LIFE SKILLS', col3X, 60);

                // Divider line
                ctx.beginPath();
                ctx.moveTo(col3X, 70);
                ctx.lineTo(col3X + col3W, 70);
                ctx.stroke();

                // Equipment List
                ctx.fillStyle = '#9d174d';
                ctx.font = 'bold 10px sans-serif';
                ctx.fillText(`⚔️ Weapon:`, col3X, 90);
                ctx.fillStyle = '#831843';
                ctx.font = '11px sans-serif';
                ctx.fillText(char.equipped_weapon || 'Empty Hand', col3X, 106);

                ctx.fillStyle = '#9d174d';
                ctx.font = 'bold 10px sans-serif';
                ctx.fillText(`🛡️ Shield:`, col3X, 130);
                ctx.fillStyle = '#831843';
                ctx.font = '11px sans-serif';
                ctx.fillText(char.equipped_shield || 'No Shield', col3X, 146);

                ctx.fillStyle = '#9d174d';
                ctx.font = 'bold 10px sans-serif';
                ctx.fillText(`👔 Armor:`, col3X, 170);
                ctx.fillStyle = '#831843';
                ctx.font = '11px sans-serif';
                ctx.fillText(char.equipped_armor || 'Standard Cloth', col3X, 186);

                // Divider line
                ctx.beginPath();
                ctx.moveTo(col3X, 206);
                ctx.lineTo(col3X + col3W, 206);
                ctx.stroke();

                ctx.fillStyle = '#831843';
                ctx.font = 'bold 11px sans-serif';
                ctx.fillText('🎀 Life Skills Levels:', col3X, 226);

                const skillsList = [
                    { name: 'Mining ⛏️', val: char.skill_mining || 1 },
                    { name: 'Fishing 🎣', val: char.skill_fishing || 1 },
                    { name: 'Woodcutting 🪓', val: char.skill_woodcutting || 1 },
                    { name: 'Smithing 🔨', val: char.skill_smithing || 1 },
                    { name: 'Cooking 🍳', val: char.skill_cooking || 1 },
                    { name: 'Crafting 🔧', val: char.skill_crafting || 1 }
                ];

                skillsList.forEach((skill, idx) => {
                    const y = 248 + idx * 32;

                    ctx.fillStyle = '#9d174d';
                    ctx.font = 'bold 10px "Segoe UI Emoji", sans-serif';
                    ctx.fillText(skill.name, col3X, y);

                    ctx.fillStyle = '#831843';
                    ctx.font = 'bold 11px sans-serif';
                    ctx.textAlign = 'right';
                    ctx.fillText(`Lvl ${skill.val}`, col3X + col3W, y);
                    ctx.textAlign = 'left';

                    drawProgressBar(ctx, col3X, y + 6, col3W, 4, skill.val, 99, '#f472b6', '#fce7f3');
                });

                const statsConfig = CLASS_STATS[char.char_class] || { color: '#f472b6', emoji: '🎀' };
                const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'character-card.png' });

                const sheetEmbed = new EmbedBuilder()
                    .setColor(statsConfig.color)
                    .setTitle(`🎀 RPG Character Card: ${char.char_name}`)
                    .setDescription(`Registered profile statement for **${targetUser.username}**`)
                    .setImage('attachment://character-card.png')
                    .setTimestamp();

                await interaction.editReply({ embeds: [sheetEmbed], files: [attachment] });

            } catch (err) {
                console.error('Error drawing RPG Character card:', err);
                await interaction.editReply('❌ There was an error while generating your premium RPG character sheet.');
            }
        }

        // --- SUBCOMMAND: CUSTOMIZE ---
        else if (subcommand === 'customize') {
            const char = db.getCharacter(userId);
            if (!char || !char.char_name) {
                return interaction.reply({
                    content: '⚠️ **You do not have a character yet!** Use `/character create` to create one first.',
                    flags: [MessageFlags.Ephemeral]
                });
            }

            const modal = new ModalBuilder()
                .setCustomId('char_customize_modal')
                .setTitle('Customize Your Adventurer');

            const genderInput = new TextInputBuilder()
                .setCustomId('modal_gender')
                .setLabel('Gender')
                .setStyle(TextInputStyle.Short)
                .setValue(char.char_gender || '')
                .setMaxLength(15)
                .setRequired(false);

            const bioInput = new TextInputBuilder()
                .setCustomId('modal_bio')
                .setLabel('Biography / Custom Bio')
                .setStyle(TextInputStyle.Paragraph)
                .setValue(char.char_background || '')
                .setMaxLength(250)
                .setRequired(false);

            const avatarInput = new TextInputBuilder()
                .setCustomId('modal_avatar')
                .setLabel('Custom Avatar URL (Image Link)')
                .setStyle(TextInputStyle.Short)
                .setValue(char.char_avatar || '')
                .setPlaceholder('https://example.com/avatar.png')
                .setRequired(false);

            modal.addComponents(
                new ActionRowBuilder().addComponents(genderInput),
                new ActionRowBuilder().addComponents(bioInput),
                new ActionRowBuilder().addComponents(avatarInput)
            );

            await interaction.showModal(modal);

            const modalSubmit = await interaction.awaitModalSubmit({
                time: 120000,
                filter: mi => mi.customId === 'char_customize_modal' && mi.user.id === userId
            }).catch(() => null);

            if (modalSubmit) {
                const newGender = modalSubmit.fields.getTextInputValue('modal_gender').trim() || 'Unknown';
                const newBio = modalSubmit.fields.getTextInputValue('modal_bio').trim() || 'A mysterious adventurer.';
                const newAvatar = modalSubmit.fields.getTextInputValue('modal_avatar').trim();

                // Simple HTTP validation if provided
                let validAvatar = newAvatar;
                if (newAvatar && !newAvatar.startsWith('http://') && !newAvatar.startsWith('https://')) {
                    validAvatar = char.char_avatar; // fallback to old
                }

                db.updateCharacter(userId, {
                    name: char.char_name,
                    age: char.char_age || 20,
                    gender: newGender,
                    race: char.char_race || 'Human',
                    className: char.char_class || 'Merchant',
                    background: newBio,
                    avatar: validAvatar
                });

                db.logTransaction(userId, 'Character Customize', `Updated gender, bio, or avatar card 🎨`);

                await modalSubmit.reply({
                    content: '✅ **Your character details have been updated successfully!** Run `/character view` to check them out.',
                    flags: [MessageFlags.Ephemeral]
                });
            }
        }

        // --- SUBCOMMAND: TITLE ---
        else if (subcommand === 'title') {
            const char = db.getCharacter(userId);
            if (!char || !char.char_name) {
                return interaction.reply({
                    content: '⚠️ **You do not have a character yet!** Use `/character create` to create one first.',
                    flags: [MessageFlags.Ephemeral]
                });
            }

            const titleToEquip = interaction.options.getString('name').trim();

            let unlocked = [];
            try {
                unlocked = JSON.parse(char.unlocked_titles || '[]');
            } catch (err) {}

            // Always allow default title
            if (!unlocked.includes('Adventurer')) {
                unlocked.push('Adventurer');
            }

            if (!unlocked.some(t => t.toLowerCase() === titleToEquip.toLowerCase())) {
                return interaction.reply({
                    content: `❌ **You do not own the title "${titleToEquip}"!**\nUnlock titles by completing quests and milestones. (Your unlocked titles: ${unlocked.map(t => `\`${t}\``).join(', ')})`,
                    flags: [MessageFlags.Ephemeral]
                });
            }

            const officialTitle = unlocked.find(t => t.toLowerCase() === titleToEquip.toLowerCase());

            // Save to DB
            db.prepare("UPDATE users SET active_title = ? WHERE userId = ?").run(officialTitle, userId);

            await interaction.reply({
                content: `👑 **Title Equipped!** You are now recognized as **${char.char_name} the ${officialTitle}**.`
            });
        }

        // --- SUBCOMMAND: EQUIP ---
        else if (subcommand === 'equip') {
            const char = db.getCharacter(userId);
            if (!char || !char.char_name) {
                return interaction.reply({
                    content: '⚠️ **You do not have a character yet!** Use `/character create` to create one first.',
                    flags: [MessageFlags.Ephemeral]
                });
            }

            const itemName = interaction.options.getString('name');
            const inventory = db.getInventory(userId);

            const hasItem = inventory.find(i => i.itemName.toLowerCase() === itemName.toLowerCase() && i.quantity > 0);
            if (!hasItem) {
                return interaction.reply({
                    content: `❌ **You do not own a "${itemName}" in your inventory!** Forge one first using \`/forge\`.`,
                    flags: [MessageFlags.Ephemeral]
                });
            }

            // Determine slot
            const weaponNames = ['Iron Sword', 'Gold Sword', 'Oak Bow', 'Magic Staff'];
            const slot = weaponNames.includes(itemName) ? 'weapon' : 'shield';

            // Remove 1x item from inventory
            db.removeItem(userId, itemName, 1);

            // Equip item and retrieve old item
            const oldItem = db.equipItem(userId, itemName, slot);

            // Add old item back to inventory
            if (oldItem) {
                db.addItem(userId, oldItem, 1);
            }

            db.logTransaction(userId, 'Character Equip', `Equipped ${itemName} in ${slot} slot`);

            const embed = new EmbedBuilder()
                .setColor('#f472b6')
                .setTitle('🎀 EQUIPMENT EQUIPPED')
                .setDescription(
                    `You successfully equipped **${itemName}** to your **${slot.toUpperCase()}** slot!\n\n` +
                    (oldItem ? `🔄 **Swapped Out:** Your previously equipped **${oldItem}** has been returned to your inventory.\n` : '') +
                    `📈 **Stats Updated:** Open \`/character view\` to check your new stats.`
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }

        // --- SUBCOMMAND: USE ---
        else if (subcommand === 'use') {
            const char = db.getCharacter(userId);
            if (!char || !char.char_name) {
                return interaction.reply({
                    content: '⚠️ **You do not have a character yet!** Use `/character create` to create one first.',
                    flags: [MessageFlags.Ephemeral]
                });
            }

            const potionName = interaction.options.getString('potion');
            const inventory = db.getInventory(userId);

            const hasItem = inventory.find(i => i.itemName.toLowerCase() === potionName.toLowerCase() && i.quantity > 0);
            if (!hasItem) {
                return interaction.reply({
                    content: `❌ **You do not have a "${potionName}" in your inventory!** Brew one first using \`/brew\`.`,
                    flags: [MessageFlags.Ephemeral]
                });
            }

            // Determine restoration values
            const hpRestore = potionName === 'Health Potion' ? 50 : 0;
            const mpRestore = potionName === 'Mana Potion' ? 40 : 0;

            // Remove 1x potion from inventory
            db.removeItem(userId, potionName, 1);

            // Restore stats
            const res = db.restoreStats(userId, hpRestore, mpRestore);

            db.logTransaction(userId, 'Character Use', `Consumed ${potionName}`);

            const embed = new EmbedBuilder()
                .setColor('#db2777')
                .setTitle('🎀 POTION CONSUMED')
                .setDescription(
                    `🍷 You drank the **${potionName}**!\n\n` +
                    `❤️ **New HP:** \` ${res.hp} / ${char.max_hp || 100} \` HP\n` +
                    `🌀 **New Mana:** \` ${res.mana} / ${char.max_mana || 50} \` Mana`
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }
    }
};
