const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas } = require('canvas');
const db = require('../database.js');

// Simple collection to store user cooldown dates in memory
const cooldowns = new Map();

async function drawDailyVaultCard(username, amount, balance) {
    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;

    // 1. Cute Pastel Picnic Background
    const vaultGrad = ctx.createRadialGradient(400, 200, 50, 400, 200, 450);
    vaultGrad.addColorStop(0, '#fef08a'); // Sunny yellow
    vaultGrad.addColorStop(1, '#fbcfe8'); // Soft pink
    ctx.fillStyle = vaultGrad;
    ctx.fillRect(0, 0, 800, 400);

    // Cute polka dots instead of stone lines
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for (let i = 0; i < 800; i += 50) {
        for (let j = 0; j < 400; j += 50) {
            ctx.beginPath();
            ctx.arc(i + 25, j + 25, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // 2. Picnic Basket Emoji & Spilling Cherries in Center
    ctx.save();
    ctx.shadowColor = 'rgba(244, 114, 182, 0.5)'; // Pink glow
    ctx.shadowBlur = 25;
    ctx.font = '95px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🧺', 400, 160); // Picnic basket
    ctx.restore();

    // Cherries floating and cherry blossoms
    ctx.font = '32px "Segoe UI", "Segoe UI Emoji", sans-serif';
    const spots = [
        { x: 340, y: 130, e: '🍒' }, { x: 460, y: 140, e: '🍒' },
        { x: 380, y: 220, e: '🍒' }, { x: 420, y: 220, e: '🍒' },
        { x: 300, y: 180, e: '🌸' }, { x: 500, y: 170, e: '🌸' },
        { x: 400, y: 80, e: '🌸' }
    ];
    spots.forEach(s => {
        ctx.fillText(s.e, s.x, s.y);
    });

    // 3. Frosted Glass Info Board
    const infoX = 60;
    const infoY = 270;
    const infoW = 680;
    const infoH = 100;

    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(infoX, infoY, infoW, infoH, 12);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Text labels
    ctx.fillStyle = '#db2777'; // Pink success
    ctx.font = 'bold 13px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.fillText('🌸 DAILY ALLOWANCE CLAIMED 🌸', infoX + 25, infoY + 32);

    ctx.fillStyle = '#831843'; // Dark pink
    ctx.font = 'bold 15px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.fillText(`+${amount} Cherries added to your basket!`, infoX + 25, infoY + 58);

    ctx.fillStyle = '#9d174d'; // Medium pink
    ctx.font = '11px "Segoe UI", "Segoe UI Emoji", sans-serif';
    ctx.fillText(`Ledger: ${username} ┃ Total Purse: 🍒 ${balance.toLocaleString()} cherries`, infoX + 25, infoY + 82);

    return canvas.toBuffer('image/png');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Claim your 500 free daily allowance cherries.'),
    async execute(interaction) {
        const userId = interaction.user.id;
        const now = Date.now();
        const cooldownAmount = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

        if (cooldowns.has(userId)) {
            const expirationTime = cooldowns.get(userId) + cooldownAmount;
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000 / 60 / 60;
                return interaction.reply({ 
                    content: `⏳ You already claimed your daily cherries! Try again in **${timeLeft.toFixed(1)}** hours.`, 
                    ephemeral: true 
                });
            }
        }

        db.addCoins(userId, interaction.guild.id, 500); // Add 500 coins to the user's balance
        cooldowns.set(userId, now);

        await interaction.deferReply();

        const balance = db.getBalance(userId, interaction.guild.id);
        const buffer = await drawDailyVaultCard(interaction.user.username, 500, balance);
        const attachment = new AttachmentBuilder(buffer, { name: 'daily-claim.png' });

        const embed = new EmbedBuilder()
            .setColor('#fbcfe8')
            .setAuthor({ name: `${interaction.user.username}'s Daily Treasury`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(`🎉 You successfully claimed **500** daily bonus cherries! Check your wallet with \`/balance\`.`)
            .setImage('attachment://daily-claim.png')
            .setTimestamp();

        await interaction.editReply({ embeds: [embed], files: [attachment] });
    },
};
