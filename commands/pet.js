const {SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, MessageFlags } = require('discord.js');
const { createCanvas } = require('@napi-rs/canvas');
const db = require('../database.js');

const PET_TYPES = {
    Cat:     { cost: 500,   emoji: '🐱', color: '#f472b6' },
    Fox:     { cost: 800,   emoji: '🦊', color: '#fb7185' },
    Wolf:    { cost: 1500,  emoji: '🐺', color: '#c084fc' },
    Phoenix: { cost: 5000,  emoji: '🐦', color: '#f43f5e' },
    Dragon:  { cost: 15000, emoji: '🐉', color: '#db2777' },
    // Evolved Forms
    Tiger:           { cost: 0, emoji: '🐯', color: '#fb923c' },
    "Nine-Tailed Fox": { cost: 0, emoji: '🦊', color: '#f43f5e' },
    Fenrir:          { cost: 0, emoji: '🐺', color: '#38bdf8' },
    "Solar Phoenix":  { cost: 0, emoji: '🦅', color: '#facc15' },
    "Kaiser Dragon":  { cost: 0, emoji: '🐲', color: '#a855f7' }
};

const EVOLUTION_MAP = {
    Cat: "Tiger",
    Fox: "Nine-Tailed Fox",
    Wolf: "Fenrir",
    Phoenix: "Solar Phoenix",
    Dragon: "Kaiser Dragon"
};

const petTrainingCooldowns = new Map();

async function drawPetCard(petName, petType, level, xp, status, hunger = 50, affection = 50) {
    const width = 800;
    const height = 450;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const config = PET_TYPES[petType] || { emoji: '🐾', color: '#999999' };

    // 1. Draw Playroom Cute Background
    // Wall Gradient (Soft Pink)
    const wallGrad = ctx.createLinearGradient(0, 0, 0, 300);
    wallGrad.addColorStop(0, '#fdf4ff');
    wallGrad.addColorStop(1, '#fce7f3');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, width, 300);

    // Floor Gradient (Pastel Carpet)
    const floorGrad = ctx.createLinearGradient(0, 300, 0, height);
    floorGrad.addColorStop(0, '#fbcfe8');
    floorGrad.addColorStop(1, '#f472b6');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, 300, width, 150);

    // Floor lines
    ctx.strokeStyle = '#db2777';
    ctx.lineWidth = 2;
    for (let x = 80; x < width; x += 120) {
        ctx.beginPath();
        ctx.moveTo(x, 300);
        ctx.lineTo(x - 50, height);
        ctx.stroke();
    }
    // Floor shadow molding baseboard
    ctx.fillStyle = '#be185d';
    ctx.fillRect(0, 292, width, 8);

    // 2. Playroom Window (Left)
    ctx.save();
    // Sky inside window (Pinkish sky)
    ctx.fillStyle = '#fbcfe8';
    ctx.beginPath();
    ctx.roundRect(60, 40, 140, 180, 16);
    ctx.fill();

    // Cloud inside window
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(100, 140, 25, 0, Math.PI * 2);
    ctx.arc(140, 130, 35, 0, Math.PI * 2);
    ctx.fill();

    // Window Pane Frame
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(60, 40, 140, 180, 16);
    ctx.stroke();

    // Cross panes
    ctx.beginPath();
    ctx.moveTo(60, 120);
    ctx.lineTo(200, 120);
    ctx.moveTo(130, 40);
    ctx.lineTo(130, 220);
    ctx.stroke();
    ctx.restore();

    // 3. Cozy Pet Rug
    ctx.save();
    ctx.fillStyle = 'rgba(219, 39, 119, 0.1)';
    ctx.beginPath();
    ctx.ellipse(240, 370, 150, 45, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Colorful Rug
    ctx.fillStyle = '#fdf4ff'; // Soft pinkish white
    ctx.strokeStyle = '#f472b6';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(240, 360, 140, 40, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner ring
    ctx.strokeStyle = '#fbcfe8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(240, 360, 110, 30, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 4. Draw Center Pet Emoji
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 10;
    
    ctx.font = '120px "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.emoji, 240, 310);
    ctx.restore();

    // Toy Ball
    ctx.fillStyle = '#f43f5e'; // Red ball
    ctx.beginPath();
    ctx.arc(80, 380, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(83, 377, 4, 0, Math.PI * 2);
    ctx.fill();

    // 5. Right Stats Glass Panel
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.6)';
    ctx.lineWidth = 3;
    ctx.shadowColor = 'rgba(244, 114, 182, 0.4)';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.roundRect(470, 25, 290, 400, 20);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Inside Stats Text Details
    ctx.save();
    // Name
    ctx.fillStyle = '#831843';
    ctx.font = 'bold 22px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.fillText(petName, 495, 65);

    // Subtitle
    ctx.fillStyle = '#db2777';
    ctx.font = 'bold 11px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.fillText(`${petType.toUpperCase()} COMPANION`, 495, 88);

    // Dividing Line
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(495, 105);
    ctx.lineTo(735, 105);
    ctx.stroke();

    const barW = 240;
    const barH = 10;

    // 1. Level & XP
    ctx.fillStyle = '#9d174d';
    ctx.font = 'bold 12px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.fillText(`Level ${level}`, 495, 130);

    const xpNeeded = level * 150;
    ctx.fillStyle = '#be185d';
    ctx.font = '11px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`XP: ${xp} / ${xpNeeded}`, 735, 130);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#fce7f3';
    ctx.beginPath();
    ctx.roundRect(495, 140, barW, barH, 5);
    ctx.fill();

    const filledXp = Math.max(0, Math.min(barW, (xp / xpNeeded) * barW));
    if (filledXp > 0) {
        ctx.fillStyle = config.color;
        ctx.beginPath();
        ctx.roundRect(495, 140, filledXp, barH, 5);
        ctx.fill();
    }

    // 2. Fullness (Hunger)
    ctx.fillStyle = '#9d174d';
    ctx.font = 'bold 12px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.fillText('🍒 Fullness:', 495, 185);

    ctx.fillStyle = '#be185d';
    ctx.font = '11px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${hunger}%`, 735, 185);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#fce7f3';
    ctx.beginPath();
    ctx.roundRect(495, 195, barW, barH, 5);
    ctx.fill();

    const filledHunger = Math.max(0, Math.min(barW, (hunger / 100) * barW));
    if (filledHunger > 0) {
        ctx.fillStyle = hunger >= 60 ? '#f472b6' : (hunger >= 25 ? '#fb7185' : '#e11d48');
        ctx.beginPath();
        ctx.roundRect(495, 195, filledHunger, barH, 5);
        ctx.fill();
    }

    // 3. Affection
    ctx.fillStyle = '#9d174d';
    ctx.font = 'bold 12px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.fillText('🎀 Affection:', 495, 240);

    ctx.fillStyle = '#be185d';
    ctx.font = '11px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${affection}%`, 735, 240);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#fce7f3';
    ctx.beginPath();
    ctx.roundRect(495, 250, barW, barH, 5);
    ctx.fill();

    const filledAffection = Math.max(0, Math.min(barW, (affection / 100) * barW));
    if (filledAffection > 0) {
        ctx.fillStyle = '#db2777';
        ctx.beginPath();
        ctx.roundRect(495, 250, filledAffection, barH, 5);
        ctx.fill();
    }

    // 4. Status
    ctx.fillStyle = '#9d174d';
    ctx.font = 'bold 13px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.fillText('Status:', 495, 305);

    const isIdle = status === 'Idle';
    ctx.fillStyle = isIdle ? '#f472b6' : '#c084fc';
    ctx.beginPath();
    ctx.arc(560, 301, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#831843';
    ctx.font = 'bold 12px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.fillText(status, 574, 305);

    ctx.restore();

    return canvas.toBuffer('image/png');
}

function drawPetPlayCard(petName, petType, petMood, interactionType = 'None', isSuccess = false) {
    const width = 800;
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const config = PET_TYPES[petType] || { emoji: '🐾', color: '#999999' };

    // 1. Playroom cute background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 260);
    bgGrad.addColorStop(0, '#f5f3ff'); // violet 50
    bgGrad.addColorStop(1, '#ddd6fe'); // violet 200
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, 260);

    const floorGrad = ctx.createLinearGradient(0, 260, 0, height);
    floorGrad.addColorStop(0, '#a7f3d0'); // emerald 200
    floorGrad.addColorStop(1, '#34d399'); // emerald 400
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, 260, width, height - 260);

    // Floor texture carpet outline
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 275, width - 40, height - 295);

    // 2. Render Pet (centered)
    ctx.save();
    ctx.font = '110px "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.emoji, 400, 160);
    ctx.restore();

    // 3. Render floating item relative to action
    ctx.save();
    ctx.font = '45px "Segoe UI Emoji", sans-serif';
    if (interactionType === 'ball') {
        // Draw bouncing toy ball
        ctx.fillText('⚾', 280, 190);
        ctx.fillText('💨', 230, 200);
    } else if (interactionType === 'rub') {
        // Draw petting hand with hearts
        ctx.fillText('👋', 490, 110);
        ctx.font = '25px sans-serif';
        ctx.fillText('💖', 450, 70);
        ctx.fillText('💖', 510, 80);
    } else if (interactionType === 'treat') {
        // Draw steak treat
        ctx.fillText('🥩', 300, 190);
    }
    ctx.restore();

    // Success effects
    if (isSuccess && interactionType !== 'None') {
        ctx.save();
        ctx.fillStyle = '#fbbf24';
        ctx.font = '32px sans-serif';
        ctx.fillText('✨', 300, 80);
        ctx.fillText('✨', 480, 70);
        ctx.restore();
    }

    // 4. Bottom Info Glass Card
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(40, 280, 720, 95, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#5b21b6';
    ctx.font = 'bold 18px "Segoe UI", sans-serif';
    ctx.fillText(`Playing with ${petName} (${petType})`, 60, 312);

    ctx.fillStyle = '#6d28d9';
    ctx.font = '14px sans-serif';
    if (interactionType === 'None') {
        ctx.fillText(`Pet Mood: ${petMood} ┃ Respond with the correct toy/action within 10s!`, 60, 345);
    } else if (isSuccess) {
        ctx.fillStyle = '#047857';
        ctx.fillText(`🎉 MATCH! ${petName} absolutely loved the ${interactionType}! (+30 XP, +10 Affection)`, 60, 345);
    } else {
        ctx.fillStyle = '#b91c1c';
        ctx.fillText(`💨 Missed mood! ${petName} wanted to play differently. (+5 XP)`, 60, 345);
    }
    ctx.restore();

    return canvas.toBuffer('image/png');
}

async function drawPetLicenseCard(petName, petType, level, status, hunger, affection, charName) {
    const width = 800;
    const height = 450;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const config = PET_TYPES[petType] || { emoji: '🐾', color: '#999999' };

    // 1. Certificate-style gold gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#fdfbf7');
    bgGrad.addColorStop(1, '#f5edd6');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Ornate Double Gold Border Frame
    ctx.save();
    ctx.strokeStyle = '#d97706'; // Gold
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(30, 30, 740, 390, 16);
    ctx.stroke();

    ctx.strokeStyle = '#f59e0b'; // Light Gold
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(42, 42, 716, 366, 12);
    ctx.stroke();
    ctx.restore();

    // 3. Gold Seal on left
    ctx.save();
    // Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;

    // Outer Ribbon (red/gold)
    ctx.fillStyle = '#dc2626'; // Ribbon red
    ctx.beginPath();
    ctx.moveTo(140, 200);
    ctx.lineTo(110, 340);
    ctx.lineTo(150, 320);
    ctx.lineTo(190, 340);
    ctx.lineTo(160, 200);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(180, 200);
    ctx.lineTo(210, 340);
    ctx.lineTo(250, 320);
    ctx.lineTo(290, 340);
    ctx.lineTo(260, 200);
    ctx.fill();

    // Seal Circle
    const sx = 200;
    const sy = 210;
    const sRadius = 60;
    const sealGrad = ctx.createLinearGradient(sx - sRadius, sy - sRadius, sx + sRadius, sy + sRadius);
    sealGrad.addColorStop(0, '#fbbf24');
    sealGrad.addColorStop(1, '#d97706');
    ctx.fillStyle = sealGrad;
    ctx.beginPath();
    ctx.arc(sx, sy, sRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(sx, sy, sRadius - 8, 0, Math.PI * 2);
    ctx.stroke();

    // Star/Emblem inside seal
    ctx.fillStyle = '#854d0e';
    ctx.font = 'bold 28px "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👑', sx, sy - 8);
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('APPROVED', sx, sy + 20);
    ctx.restore();

    // 4. Large Pet Emoji next to seal
    ctx.save();
    ctx.font = '100px "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.emoji, sx, sy - 90);
    ctx.restore();

    // 5. Registry Details (Right Side)
    ctx.fillStyle = '#78350f'; // Dark amber brown
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('ROYAL COMPANION REGISTRY & LICENSE', 340, 90);

    ctx.font = 'italic 12px sans-serif';
    ctx.fillStyle = '#b45309';
    ctx.fillText('This document certifies that the companion named below is officially registered.', 340, 115);

    // Divider
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(340, 135);
    ctx.lineTo(720, 135);
    ctx.stroke();

    // Pet Name (Large)
    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 36px "Segoe UI Emoji", sans-serif';
    ctx.fillText(petName, 340, 185);

    // Species / Subtitle
    ctx.fillStyle = '#d97706';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`SPECIES: ${petType.toUpperCase()} COMPANION`, 340, 215);

    // Stats Grid
    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('Registered Keeper:', 340, 260);
    ctx.fillStyle = '#b45309';
    ctx.font = '13px sans-serif';
    ctx.fillText(charName, 490, 260);

    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('Registry Level:', 340, 295);
    ctx.fillStyle = '#0f766e'; // Teal
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`Lvl ${level} (Elite Morph)`, 490, 295);

    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('Affection Rating:', 340, 330);
    ctx.fillStyle = '#db2777'; // Pink
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`💖 ${affection}% Affection`, 490, 330);

    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('Adventure Status:', 340, 365);
    ctx.fillStyle = status === 'Idle' ? '#059669' : '#7c3aed';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(status, 490, 365);

    return canvas.toBuffer('image/png');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pet')
        .setDescription('🐾 Adopt and manage your adventure pet companion')
        .addSubcommand(subcommand =>
            subcommand
                .setName('adopt')
                .setDescription('🐾 Adopt a new pet companion')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('The type of pet to adopt')
                        .setRequired(true)
                        .addChoices(
                            { name: '🐱 Cat (🍒 500 cherries)', value: 'Cat' },
                            { name: '🦊 Fox (🍒 800 cherries)', value: 'Fox' },
                            { name: '🐺 Wolf (🍒 1,500 cherries)', value: 'Wolf' },
                            { name: '🐦 Phoenix (🍒 5,000 cherries)', value: 'Phoenix' },
                            { name: '🐉 Dragon (🍒 15,000 cherries)', value: 'Dragon' }
                        ))
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Give your new pet companion a name')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('profile')
                .setDescription('📋 View your pet\'s status and levels'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('feed')
                .setDescription('🍖 Feed your pet to restore fullness and affection')
                .addStringOption(option =>
                    option.setName('food')
                        .setDescription('The food to feed your pet')
                        .setRequired(true)
                        .addChoices(
                            { name: '🍬 Pet Treat (🍒 50 cherries)', value: 'treat' },
                            { name: '🍖 Raw Meat (Restores 50% Fullness, +15 XP)', value: 'meat' },
                            { name: '🐟 Raw Fish (Restores 40% Fullness, +10 XP)', value: 'fish' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('train')
                .setDescription('⚔️ Train your pet to earn XP and affection')
                .addStringOption(option =>
                    option.setName('activity')
                        .setDescription('Select training activity')
                        .setRequired(true)
                        .addChoices(
                            { name: '🥎 Play Fetch (+10 XP, +15 Affection, -10 Hunger)', value: 'fetch' },
                            { name: '🏃 Agility Course (+25 XP, +5 Affection, -15 Hunger)', value: 'agility' },
                            { name: '⚔️ Sparring Session (+50 XP, -25 Hunger)', value: 'spar' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('adventure')
                .setDescription('⚔️ Send your pet to scavenge for seeds and raw meats'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('license')
                .setDescription('📜 View your pet\'s visual Royal Registry License certificate'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('morph')
                .setDescription('✨ Evolve your pet companion into their legendary form (Level 15+)'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('play')
                .setDescription('🎮 Play interactive matching mood games with your companion'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('battle')
                .setDescription('⚔️ Battle your active pet against another player\'s pet!')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('The player whose pet you want to challenge')
                        .setRequired(true))),

    async execute(interaction) {
        await interaction.deferReply();

        const userId = interaction.user.id;
        const guildId = interaction.guild ? (interaction.guild ? interaction.guild.id : 'GLOBAL') : 'GLOBAL';
        const subcommand = interaction.options.getSubcommand();

        // Enforce RPG character exists first
        const char = db.getCharacter(userId);
        if (!char || !char.char_name) {
            return interaction.editReply({ content: '⚠️ **You must create an RPG character first!**\nUse **`/character create`** to get started.' });
        }

        // --- SUBCOMMAND: ADOPT ---
        if (subcommand === 'adopt') {
            const pet = db.getPet(userId);
            if (pet) {
                return interaction.editReply({ content: `❌ You already have a pet companion named **${pet.petName}**! You cannot adopt another.` });
            }

            const petType = interaction.options.getString('type');
            const petName = interaction.options.getString('name');

            if (petName.length > 20) {
                return interaction.editReply({ content: '❌ Pet name cannot exceed 20 characters!' });
            }

            const config = PET_TYPES[petType];
            const currentCoins = db.getBalance(userId, guildId);

            if (currentCoins < config.cost) {
                return interaction.editReply({ content: `❌ You do not have enough cherries! Adopting a **${petType}** costs **🍒 ${config.cost.toLocaleString()}** cherries (Balance: **🍒 ${currentCoins.toLocaleString()}**).` });
            }

            db.deductCoins(userId, guildId, config.cost);
            db.adoptPet(userId, petType, petName);

            const adoptEmbed = new EmbedBuilder()
                .setColor('#f472b6')
                .setTitle(`🐾 COMPANION ADOPTED! ${config.emoji}`)
                .setDescription(
                    `Congratulations! You have adopted **${petName}**, the **${petType}**!\n` +
                    `They have been bound to your character.\n\n` +
                    `⚔️ Run **\`/pet adventure\`** to send them into the wild to scavenge seeds, raw ingredients, and claim XP!`
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [adoptEmbed] });
        }

        // --- SUBCOMMAND: PROFILE ---
        else if (subcommand === 'profile') {
            const pet = db.getPet(userId);
            if (!pet) {
                return interaction.editReply({ content: '⚠️ You do not have an active pet! Use **`/pet adopt`** to get a companion.' });
            }

            try {
                const buffer = await drawPetCard(pet.petName, pet.petType, pet.level, pet.xp, pet.status, pet.hunger, pet.affection);
                const attachment = new AttachmentBuilder(buffer, { name: 'pet-profile.png' });

                const profileEmbed = new EmbedBuilder()
                    .setColor(PET_TYPES[pet.petType].color)
                    .setTitle(`🐾 ${pet.petName}'s Companion Profile`)
                    .setImage('attachment://pet-profile.png')
                    .setTimestamp();

                await interaction.editReply({ embeds: [profileEmbed], files: [attachment] });
            } catch (err) {
                console.error(err);
                await interaction.editReply({ content: `🐾 **${pet.petName}** (${pet.petType}) - Level ${pet.level} [${pet.status}] (Fullness: ${pet.hunger}%, Affection: ${pet.affection}%)` });
            }
        }

        // --- SUBCOMMAND: FEED ---
        else if (subcommand === 'feed') {
            const pet = db.getPet(userId);
            if (!pet) {
                return interaction.editReply({ content: '⚠️ You do not have an active pet! Use **`/pet adopt`** to get a companion.' });
            }

            if (pet.status !== 'Idle') {
                return interaction.editReply({ content: `❌ **${pet.petName}** is busy (**Status: ${pet.status}**)! You can only feed them when they are Idle.` });
            }

            if (pet.hunger >= 100) {
                return interaction.editReply({ content: `❌ **${pet.petName}** is already completely full (**100% Fullness**)!` });
            }

            const food = interaction.options.getString('food');
            let costText = '';
            let restoreText = '';

            if (food === 'treat') {
                const cost = 50;
                const coins = db.getBalance(userId, guildId);
                if (coins < cost) {
                    return interaction.editReply({ content: `❌ You do not have enough cherries! A Pet Treat costs **🍒 ${cost}** cherries (Your Balance: **🍒 ${coins.toLocaleString()}**).` });
                }
                db.deductCoins(userId, guildId, cost);
                db.updatePetStats(pet.id, 25, 5);
                const xpResult = db.addPetXp(pet.id, 5);
                costText = `🍒 ${cost} cherries`;
                restoreText = `Restored **25% Fullness**, **+5% Affection**, and gained **5 XP**!`;
            } else if (food === 'meat') {
                const qty = db.getItemQuantity(userId, 'Raw Meat');
                if (qty < 1) {
                    return interaction.editReply({ content: `❌ You do not have any **Raw Meat** in your inventory! Send your pet to scavenge some via **\`/pet adventure\`**.` });
                }
                db.removeItem(userId, 'Raw Meat', 1);
                db.updatePetStats(pet.id, 50, 10);
                const xpResult = db.addPetXp(pet.id, 15);
                costText = `1x Raw Meat`;
                restoreText = `Restored **50% Fullness**, **+10% Affection**, and gained **15 XP**!`;
            } else if (food === 'fish') {
                const qty = db.getItemQuantity(userId, 'Raw Fish');
                if (qty < 1) {
                    return interaction.editReply({ content: `❌ You do not have any **Raw Fish** in your inventory! Send your pet to scavenge some via **\`/pet adventure\`**.` });
                }
                db.removeItem(userId, 'Raw Fish', 1);
                db.updatePetStats(pet.id, 40, 12);
                const xpResult = db.addPetXp(pet.id, 10);
                costText = `1x Raw Fish`;
                restoreText = `Restored **40% Fullness**, **+12% Affection**, and gained **10 XP**!`;
            }

            // Re-fetch pet stats for updated embed
            const updatedPet = db.getPet(userId);

            const feedEmbed = new EmbedBuilder()
                .setColor('#f472b6')
                .setTitle(`🍖 ${updatedPet.petName} was fed!`)
                .setDescription(
                    `You fed **${updatedPet.petName}** some delicious food!\n\n` +
                    `💳 **Cost:** ${costText}\n` +
                    `✨ **Effect:** ${restoreText}\n\n` +
                    `📊 **New Stats:**\n` +
                    `• 🍗 **Fullness:** ${updatedPet.hunger}%\n` +
                    `• ❤️ **Affection:** ${updatedPet.affection}%\n` +
                    `• 🌟 **Level:** ${updatedPet.level} (${updatedPet.xp} XP)`
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [feedEmbed] });
        }

        // --- SUBCOMMAND: TRAIN ---
        else if (subcommand === 'train') {
            const pet = db.getPet(userId);
            if (!pet) {
                return interaction.editReply({ content: '⚠️ You do not have an active pet! Use **`/pet adopt`** to get a companion.' });
            }

            if (pet.status !== 'Idle') {
                return interaction.editReply({ content: `❌ **${pet.petName}** is busy (**Status: ${pet.status}**)! You can only train them when they are Idle.` });
            }

            // Check hunger first (need at least 20% hunger/fullness to train)
            if (pet.hunger < 20) {
                return interaction.editReply({ content: `❌ **${pet.petName}** is too exhausted and hungry to train (**Fullness: ${pet.hunger}%**)! Feed them first.` });
            }

            // Cooldown check (5 minutes = 300,000 ms)
            const now = Date.now();
            const cooldownTime = 5 * 60 * 1000;
            if (petTrainingCooldowns.has(userId)) {
                const lastTrained = petTrainingCooldowns.get(userId);
                const elapsed = now - lastTrained;
                if (elapsed < cooldownTime) {
                    const remainingSec = Math.ceil((cooldownTime - elapsed) / 1000);
                    const remainingMin = Math.floor(remainingSec / 60);
                    const remSecDisplay = remainingSec % 60;
                    const cooldownMsg = remainingMin > 0 
                        ? `${remainingMin}m ${remSecDisplay}s` 
                        : `${remainingSec}s`;
                    return interaction.editReply({ content: `⏳ **${pet.petName}** is tired from training! Let them rest for **${cooldownMsg}** before training again.` });
                }
            }

            const activity = interaction.options.getString('activity');
            let description = '';
            let hungerCost = 0;
            let affectionGain = 0;
            let xpGain = 0;

            if (activity === 'fetch') {
                description = `🥎 You threw a squeaky toy and played fetch with **${pet.petName}**! They happily brought it back.`;
                hungerCost = -10;
                affectionGain = 15;
                xpGain = 10;
            } else if (activity === 'agility') {
                description = `🏃 You guided **${pet.petName}** through an agility obstacle course, navigating hurdles and tunnels!`;
                hungerCost = -15;
                affectionGain = 5;
                xpGain = 25;
            } else if (activity === 'spar') {
                description = `⚔️ You equipped **${pet.petName}** with wooden gear and held a mini combat training and sparring session!`;
                hungerCost = -25;
                affectionGain = 0;
                xpGain = 50;
            }

            // Apply stats updates
            db.updatePetStats(pet.id, hungerCost, affectionGain);
            const xpResult = db.addPetXp(pet.id, xpGain);
            
            // Set cooldown
            petTrainingCooldowns.set(userId, now);

            // Re-fetch updated pet stats
            const updatedPet = db.getPet(userId);

            const trainEmbed = new EmbedBuilder()
                .setColor('#fbcfe8')
                .setTitle(`⚔️ Training Complete!`)
                .setDescription(
                    `${description}\n\n` +
                    `✨ **XP Gained:** \` +${xpGain} XP \`\n` +
                    (xpResult.leveledUp ? `🌟 **LEVEL UP!** **${updatedPet.petName}** is now **Level ${xpResult.newLevel}**!\n` : '') +
                    `\n📊 **Updated Stats:**\n` +
                    `• 🍗 **Fullness:** ${updatedPet.hunger}% (${hungerCost} hunger)\n` +
                    `• ❤️ **Affection:** ${updatedPet.affection}% (+${affectionGain} affection)\n` +
                    `• 🌟 **Level:** ${updatedPet.level} (${updatedPet.xp} XP)`
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [trainEmbed] });
        }

        // --- SUBCOMMAND: ADVENTURE ---
        else if (subcommand === 'adventure') {
            const pet = db.getPet(userId);
            if (!pet) {
                return interaction.editReply({ content: '⚠️ You do not have an active pet! Use **`/pet adopt`** to get a companion.' });
            }

            const now = Date.now();
            const duration = 60 * 1000; // 1 minute adventure duration

            if (pet.status === 'Idle') {
                if (pet.hunger < 20) {
                    return interaction.editReply({ content: `❌ **${pet.petName}** is starving (**Fullness: ${pet.hunger}%**)! Please feed them via **\`/pet feed\`** before sending them on an adventure.` });
                }

                // Deduct 20 hunger and 10 affection
                db.updatePetStats(pet.id, -20, -10);

                db.updatePetStatus(pet.id, 'Adventure', now);
                const goEmbed = new EmbedBuilder()
                    .setColor('#f472b6')
                    .setTitle(`🎀 PET DISPATCHED! ${PET_TYPES[pet.petType].emoji}`)
                    .setDescription(
                        `**${pet.petName}** has packed their gear and ventured into the wild forests!\n` +
                        `They will search for raw food, seeds, and materials.\n\n` +
                        `⏱️ **Time required: 1 Minute.**\nRun \`/pet adventure\` again once finished to claim the rewards!`
                    )
                    .setTimestamp();

                return interaction.editReply({ embeds: [goEmbed] });
            }

            if (pet.status === 'Adventure') {
                const elapsed = now - pet.lastAction;
                if (elapsed < duration) {
                    const remaining = Math.ceil((duration - elapsed) / 1000);
                    return interaction.editReply({ content: `⏳ **${pet.petName}** is still exploring the wild! They will return in **${remaining} seconds**.` });
                }

                // Resolve adventure!
                db.updatePetStatus(pet.id, 'Idle', 0);
                db.incrementQuestProgress(userId, 1);

                const xpGained = Math.floor(Math.random() * 51) + 50; // 50 to 100 XP
                const xpResult = db.addPetXp(pet.id, xpGained);

                // Scavenge loot
                const possibleLoot = [
                    { name: 'Raw Meat', qty: 1 },
                    { name: 'Raw Fish', qty: 1 },
                    { name: 'Corn Seed', qty: 1 },
                    { name: 'Carrot Seed', qty: 1 },
                    { name: 'Rice Seed', qty: 1 },
                    { name: 'Tomato Seed', qty: 1 },
                    { name: 'Wood', qty: 1 }
                ];

                const lootDrops = [];
                // Guaranteed 2-3 drops
                const dropCount = Math.floor(Math.random() * 2) + 2;
                for (let k = 0; k < dropCount; k++) {
                    const drop = possibleLoot[Math.floor(Math.random() * possibleLoot.length)];
                    lootDrops.push(drop);
                    db.addItem(userId, drop.name, drop.qty);
                }

                let lootText = lootDrops.map(d => `• **${d.name}** (x${d.qty})`).join('\n');

                const returnEmbed = new EmbedBuilder()
                    .setColor('#f472b6')
                    .setTitle(`🎀 PET COMPANION RETURNED! ${PET_TYPES[pet.petType].emoji}`)
                    .setDescription(
                        `🎉 **Welcome back!** **${pet.petName}** has returned safe and sound from their adventure!\n\n` +
                        `✨ **Companion Stats:**\n` +
                        `• **XP Gained:** \` +${xpGained} XP \`\n` +
                        (xpResult.leveledUp ? `🌟 **LEVEL UP!** **${pet.petName}** is now **Level ${xpResult.newLevel}**!\n` : '') +
                        `\n📦 **Loot Scavenged:**\n${lootText}\n\n` +
                        `*Items have been added to your inventory. Seeds can be grown on plots via \`/farm\`, raw meats can be cooked via \`/cook\`!*`
                    )
                    .setTimestamp();

                await interaction.editReply({ embeds: [returnEmbed] });
            }
        }

        // --- SUBCOMMAND: LICENSE ---
        else if (subcommand === 'license') {
            const pet = db.getPet(userId);
            if (!pet) {
                return interaction.editReply({ content: '⚠️ You do not have an active pet! Use **`/pet adopt`** to get a companion.' });
            }

            try {
                const buffer = await drawPetLicenseCard(pet.petName, pet.petType, pet.level, pet.status, pet.hunger, pet.affection, char.char_name);
                const attachment = new AttachmentBuilder(buffer, { name: 'pet-license.png' });

                const licenseEmbed = new EmbedBuilder()
                    .setColor('#d97706')
                    .setTitle(`📜 Royal Companion Registry License: ${pet.petName}`)
                    .setDescription(`Official royal registry deed certifying **${pet.petName}** as an elite registered companion.`)
                    .setImage('attachment://pet-license.png')
                    .setTimestamp();

                await interaction.editReply({ embeds: [licenseEmbed], files: [attachment] });
            } catch (err) {
                console.error('Error drawing pet license card:', err);
                await interaction.editReply({ content: '❌ There was an error while generating your visual Registry License.' });
            }
        }

        // --- SUBCOMMAND: MORPH ---
        else if (subcommand === 'morph') {
            const pet = db.getPet(userId);
            if (!pet) {
                return interaction.editReply({ content: '⚠️ You do not have an active pet! Use **`/pet adopt`** to get a companion.' });
            }

            if (pet.status !== 'Idle') {
                return interaction.editReply({ content: `❌ **${pet.petName}** is busy (**Status: ${pet.status}**)! Wait until they return.` });
            }

            // Check level requirement
            if (pet.level < 15) {
                return interaction.editReply({ content: `❌ **${pet.petName}** must be at least **Level 15** to evolve/morph! (Current level: **Level ${pet.level}**)` });
            }

            const evolvedForm = EVOLUTION_MAP[pet.petType];
            if (!evolvedForm) {
                return interaction.editReply({ content: `❌ **${pet.petName}** is already in their ultimate evolved form (**${pet.petType}**)!` });
            }

            // Perform DB update of petType
            db.prepare("UPDATE pets SET petType = ? WHERE id = ?").run(evolvedForm, pet.id);

            const oldType = pet.petType;
            const config = PET_TYPES[evolvedForm];

            const morphEmbed = new EmbedBuilder()
                .setColor(config.color)
                .setTitle(`✨ ULTIMATE COMPANION MORPH! ${config.emoji}`)
                .setDescription(
                    `✨ A magical aura surrounds **${pet.petName}**! ✨\n\n` +
                    `Your **${oldType}** has evolved into a legendary **${evolvedForm}**! ${config.emoji}\n` +
                    `• Run **\`/pet license\`** to view their new certificate!`
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [morphEmbed] });
        }

        // --- SUBCOMMAND: PLAY ---
        else if (subcommand === 'play') {
            const pet = db.getPet(userId);
            if (!pet) {
                return interaction.editReply({ content: '⚠️ You do not have an active pet! Use **`/pet adopt`** to get a companion.' });
            }

            if (pet.status !== 'Idle') {
                return interaction.editReply({ content: `❌ **${pet.petName}** is busy (**Status: ${pet.status}**)! Wait until they return.` });
            }

            // Choose a random mood
            const moods = [
                { mood: 'wants to chase something', key: 'ball', text: 'Bored' },
                { mood: 'needs some scratches', key: 'rub', text: 'Itchy' },
                { mood: 'looks a bit peckish', key: 'treat', text: 'Hungry' }
            ];
            const targetMood = moods[Math.floor(Math.random() * moods.length)];

            const ballBtn = new ButtonBuilder().setCustomId('pet_play_ball').setLabel('Throw Ball').setStyle(ButtonStyle.Primary).setEmoji('⚾');
            const rubBtn = new ButtonBuilder().setCustomId('pet_play_rub').setLabel('Rub Belly').setStyle(ButtonStyle.Success).setEmoji('👋');
            const treatBtn = new ButtonBuilder().setCustomId('pet_play_treat').setLabel('Give Treat').setStyle(ButtonStyle.Danger).setEmoji('🥩');

            const row = new ActionRowBuilder().addComponents(ballBtn, rubBtn, treatBtn);

            const initialBuffer = await drawPetPlayCard(pet.petName, pet.petType, targetMood.mood, 'None', false);
            const initialAttachment = new AttachmentBuilder(initialBuffer, { name: 'pet-playroom.png' });

            const playEmbed = new EmbedBuilder()
                .setColor('#a855f7')
                .setTitle(`🎮 Playroom: ${pet.petName}`)
                .setDescription(
                    `✨ **${pet.petName}** ${targetMood.mood}!\n` +
                    `Select the correct toy or action button within 10 seconds to make them happy!`
                )
                .setImage('attachment://pet-playroom.png')
                .setTimestamp();

            const msg = await interaction.editReply({
                embeds: [playEmbed],
                files: [initialAttachment],
                components: [row]
            });

            const collector = msg.createMessageComponentCollector({
                filter: i => i.user.id === userId,
                time: 10000 // 10s
            });

            let playResolved = false;

            const resolvePlay = async (clickedId) => {
                playResolved = true;

                let actionName = 'None';
                if (clickedId === 'pet_play_ball') actionName = 'ball';
                else if (clickedId === 'pet_play_rub') actionName = 'rub';
                else if (clickedId === 'pet_play_treat') actionName = 'treat';

                const isSuccess = actionName === targetMood.key;

                let xpGain = 5;
                let affectionGain = 2;
                let outcomeText = '';

                if (isSuccess) {
                    xpGain = 30;
                    affectionGain = 10;
                    outcomeText = `🎉 **Success!** You correctly guessed **${pet.petName}**'s mood! They happily jump around and purr.`;
                    
                    // Add standard rewards
                    db.addItem(userId, 'Stone', 2); // Small toy stones
                } else {
                    outcomeText = `💨 **Miss!** **${pet.petName}** didn't want that action right now, but they still appreciated the attention.`;
                }

                // Update Pet XP/Affection
                const newAffection = Math.min(100, (pet.affection || 0) + affectionGain);
                const currentXp = (pet.xp || 0) + xpGain;
                
                let newLvl = pet.level;
                let remainingXp = currentXp;
                const reqXp = pet.level * 100;
                let leveledUp = false;

                if (currentXp >= reqXp) {
                    newLvl += 1;
                    remainingXp = currentXp - reqXp;
                    leveledUp = true;
                }

                db.prepare("UPDATE pets SET level = ?, xp = ?, affection = ? WHERE id = ?").run(newLvl, remainingXp, newAffection, pet.id);

                const finalBuffer = await drawPetPlayCard(pet.petName, pet.petType, targetMood.mood, actionName, isSuccess);
                const finalAttachment = new AttachmentBuilder(finalBuffer, { name: 'pet-playroom.png' });

                const finalEmbed = new EmbedBuilder()
                    .setColor(isSuccess ? '#10b981' : '#ef4444')
                    .setTitle(`🎮 Playroom Result: ${pet.petName}`)
                    .setDescription(
                        outcomeText + `\n\n` +
                        `• **XP Gained:** +${xpGain} XP\n` +
                        `• **Affection:** ${pet.affection}% ➡️ **${newAffection}%**\n` +
                        (leveledUp ? `\n🎉 **LEVEL UP!** **${pet.petName}** has reached **Level ${newLvl}**!` : '')
                    )
                    .setImage('attachment://pet-playroom.png')
                    .setTimestamp();

                await interaction.editReply({
                    embeds: [finalEmbed],
                    files: [finalAttachment],
                    components: []
                });
            };

            collector.on('collect', async (i) => {
                collector.stop('played');
                await i.deferUpdate();
                await resolvePlay(i.customId);
            });

            collector.on('end', async (_, reason) => {
                if (reason === 'time' && !playResolved) {
                    await resolvePlay(null);
                }
            });
        }
        // --- SUBCOMMAND: BATTLE ---
        else if (subcommand === 'battle') {
            const targetUser = interaction.options.getUser('target');
            if (targetUser.id === userId) {
                return interaction.editReply({ content: '❌ You cannot battle against your own pet! Challenge someone else.' });
            }
            if (targetUser.bot) {
                return interaction.editReply({ content: '❌ Bots do not own pets to battle with!' });
            }

            const myPet = db.getPet(userId);
            if (!myPet) {
                return interaction.editReply({ content: '⚠️ You do not have an active pet! Adopt one first using **`/pet adopt`**.' });
            }

            const targetPet = db.getPet(targetUser.id);
            if (!targetPet) {
                return interaction.editReply({ content: `❌ **${targetUser.username}** does not have an active companion pet!` });
            }

            if (myPet.status !== 'Idle' || targetPet.status !== 'Idle') {
                return interaction.editReply({ content: `❌ One of the pets is currently busy on an adventure or training session! Both must be Idle.` });
            }

            // Lock pet statuses
            db.updatePetStatus(myPet.id, 'Battle', Date.now());
            db.updatePetStatus(targetPet.id, 'Battle', Date.now());

            const challenger = {
                user: interaction.user,
                pet: myPet,
                maxHp: 100 + myPet.level * 10,
                hp: 100 + myPet.level * 10,
                focus: false,
                emoji: PET_TYPES[myPet.petType]?.emoji || '🐾'
            };

            const opponent = {
                user: targetUser,
                pet: targetPet,
                maxHp: 100 + targetPet.level * 10,
                hp: 100 + targetPet.level * 10,
                focus: false,
                emoji: PET_TYPES[targetPet.petType]?.emoji || '🐾'
            };

            let activeTurn = challenger;
            let passiveTurn = opponent;
            let battleLog = [];

            const getBattleEmbed = () => {
                return new EmbedBuilder()
                    .setColor('#c084fc')
                    .setTitle(`⚔️ COMPANION ARENA: ${challenger.pet.petName} VS ${opponent.pet.petName}`)
                    .setDescription(
                        `🛡️ **${challenger.pet.petName}** (Lvl ${challenger.pet.level} ${challenger.pet.petType})\n` +
                        `❤️ **HP:** ${challenger.hp} / ${challenger.maxHp} ${challenger.focus ? '⚡ *Charged*' : ''}\n\n` +
                        `🛡️ **${opponent.pet.petName}** (Lvl ${opponent.pet.level} ${opponent.pet.petType})\n` +
                        `❤️ **HP:** ${opponent.hp} / ${opponent.maxHp} ${opponent.focus ? '⚡ *Charged*' : ''}\n\n` +
                        `👉 **Active Turn:** <@${activeTurn.user.id}>'s pet **${activeTurn.pet.petName}**!\n\n` +
                        `📜 **Battle History:**\n${battleLog.slice(-4).map(x => `• ${x}`).join('\n') || '*The duel begins!*'}`
                    )
                    .setTimestamp();
            };

            const btnAttack = new ButtonBuilder().setCustomId('pet_btn_attack').setLabel('Attack ⚔️').setStyle(ButtonStyle.Primary);
            const btnHeal = new ButtonBuilder().setCustomId('pet_btn_heal').setLabel('Heal 💖').setStyle(ButtonStyle.Success);
            const btnFocus = new ButtonBuilder().setCustomId('pet_btn_focus').setLabel('Focus ⚡').setStyle(ButtonStyle.Secondary);
            const row = new ActionRowBuilder().addComponents(btnAttack, btnHeal, btnFocus);

            const msg = await interaction.editReply({
                content: `⚔️ **${interaction.user.username}** has challenged **${targetUser.username}** to a companion pet duel!`,
                embeds: [getBattleEmbed()],
                components: [row]
            });

            const collector = msg.createMessageComponentCollector({
                filter: i => [challenger.user.id, opponent.user.id].includes(i.user.id),
                time: 120000 // 2 minutes max
            });

            const cleanupBattle = () => {
                db.updatePetStatus(challenger.pet.id, 'Idle', 0);
                db.updatePetStatus(opponent.pet.id, 'Idle', 0);
            };

            collector.on('collect', async i => {
                // Ensure it is indeed their turn
                if (i.user.id !== activeTurn.user.id) {
                    return i.reply({ content: '❌ It is not your pet\'s turn yet! Wait for your opponent.', flags: MessageFlags.Ephemeral });
                }

                await i.deferUpdate();

                const action = i.customId;
                let damage = 0;
                let heal = 0;

                if (action === 'pet_btn_attack') {
                    const baseDmg = Math.floor(Math.random() * 11) + 12; // 12-22
                    damage = baseDmg + Math.floor(activeTurn.pet.level * 1.5);
                    if (activeTurn.focus) {
                        damage *= 2;
                        activeTurn.focus = false;
                    }
                    passiveTurn.hp = Math.max(0, passiveTurn.hp - damage);
                    battleLog.push(`💥 **${activeTurn.pet.petName}** ${activeTurn.emoji} strikes **${passiveTurn.pet.petName}** for **${damage}** damage!`);
                } 
                else if (action === 'pet_btn_heal') {
                    const baseHeal = Math.floor(Math.random() * 11) + 15; // 15-25
                    heal = baseHeal + Math.floor(activeTurn.pet.level * 1.2);
                    activeTurn.hp = Math.min(activeTurn.maxHp, activeTurn.hp + heal);
                    battleLog.push(`💖 **${activeTurn.pet.petName}** ${activeTurn.emoji} meditates and heals **${heal} HP**!`);
                } 
                else if (action === 'pet_btn_focus') {
                    activeTurn.focus = true;
                    battleLog.push(`⚡ **${activeTurn.pet.petName}** ${activeTurn.emoji} gathers elemental energy to double their next strike!`);
                }

                // Check for Game Over
                if (passiveTurn.hp <= 0) {
                    collector.stop('gameover');
                    cleanupBattle();

                    // Apply Rewards
                    const winXp = 100;
                    const loseXp = 30;
                    
                    const winResult = db.addPetXp(activeTurn.pet.id, winXp);
                    const loseResult = db.addPetXp(passiveTurn.pet.id, loseXp);

                    db.updatePetStats(activeTurn.pet.id, -10, 15); // Deduct hunger, add affection
                    db.updatePetStats(passiveTurn.pet.id, -5, 5);

                    // Add cherry reward for the winning player
                    db.addCoins(activeTurn.user.id, guildId, 500);
                    db.logTransaction(activeTurn.user.id, 'Pet Battle Win', `Won duel with ${activeTurn.pet.petName} (+500c)`);
                    db.logTransaction(passiveTurn.user.id, 'Pet Battle Loss', `Lost duel with ${passiveTurn.pet.petName}`);

                    const winEmbed = new EmbedBuilder()
                        .setColor('#10b981')
                        .setTitle(`🏆 ARENA VICTORY: ${activeTurn.pet.petName} WINS!`)
                        .setDescription(
                            `🎉 **Congratulations!** **${activeTurn.pet.petName}** ${activeTurn.emoji} has defeated **${passiveTurn.pet.petName}** ${passiveTurn.emoji} in combat!\n\n` +
                            `🎁 **Rewards:**\n` +
                            `• **${activeTurn.user.username} (Winner):** 🍒 **500 cherries** & **+${winXp} XP** for **${activeTurn.pet.petName}**\n` +
                            (winResult.leveledUp ? `🌟 **LEVEL UP!** **${activeTurn.pet.petName}** is now **Level ${winResult.newLevel}**!\n` : '') +
                            `• **${passiveTurn.user.username} (Loser):** **+${loseXp} XP** for **${passiveTurn.pet.petName}**\n` +
                            (loseResult.leveledUp ? `🌟 **LEVEL UP!** **${passiveTurn.pet.petName}** is now **Level ${loseResult.newLevel}**!\n` : '')
                        )
                        .setTimestamp();

                    await interaction.editReply({
                        embeds: [winEmbed],
                        components: []
                    });
                    return;
                }

                // Switch Turns
                const temp = activeTurn;
                activeTurn = passiveTurn;
                passiveTurn = temp;

                await interaction.editReply({
                    embeds: [getBattleEmbed()],
                    components: [row]
                });
            });

            collector.on('end', async (_, reason) => {
                if (reason !== 'gameover') {
                    cleanupBattle();
                    await interaction.editReply({
                        content: '⏳ **The pet battle arena expired or was abandoned!** Pets returned home.',
                        embeds: [],
                        components: []
                    }).catch(() => null);
                }
            });
        }
    }
};
