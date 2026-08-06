const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, MessageFlags } = require('discord.js');
const { createCanvas } = require('@napi-rs/canvas');
const db = require('../database.js');

const WHEEL_SECTORS = [
    { label: 'CHERRY 🍒', color: '#e11d48', action: (u, g) => { db.addCoins(u, g, 1000); return 'Won 🍒 1,000 cherries!'; } },
    { label: 'CHERRY BAG 🧺', color: '#db2777', action: (u, g) => { db.addCoins(u, g, 500); return 'Won 🍒 500 cherries!'; } },
    { label: 'XP BOOST ✨', color: '#f472b6', action: (u, g) => { const r = db.addXp(u, g, 150); return `Gained 150 XP!${r && r.leveledUp ? ' (Leveled Up!)' : ''}`; } },
    { label: 'LUCK BUFF 🌸', color: '#fb7185', action: (u, g) => { db.prepare("UPDATE users SET luck_buff_expiry = ? WHERE userId = ?").run(Date.now() + 30 * 60 * 1000, u); return 'Received 30-min Luck Buff! (Increases slots win rate)'; } },
    { label: 'LEMON 🍋', color: '#fde047', action: (u, g) => { db.addCoins(u, g, 100); return 'Won 🍒 100 cherries!'; } },
    { label: 'RUIN 💀', color: '#94a3b8', action: (u, g) => { db.deductCoins(u, g, 200); return 'Bankrupt! Deducted 200 extra cherries!'; } },
    { label: 'NOTHING 🎀', color: '#cbd5e1', action: (u, g) => { return 'Better luck next time!'; } },
    { label: 'BONUS CHERRY 🍒', color: '#f43f5e', action: (u, g) => { db.addCoins(u, g, 300); return 'Won 🍒 300 cherries!'; } }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wheel')
        .setDescription('🎀 Spin the cute Wheel of Fortune for 200 cherries!'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild ? (interaction.guild ? interaction.guild.id : 'GLOBAL') : 'GLOBAL';

        // Verify Character
        const char = db.getCharacter(userId);
        if (!char || !char.char_name) {
            return interaction.reply({
                content: '⚠️ **You must create an RPG character first!**\nUse **`/character create`** to get started.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        // Verify Balance
        const balance = db.getBalance(userId, guildId);
        const buyIn = 200;
        if (balance < buyIn) {
            return interaction.reply({
                content: `❌ **Insufficient funds!** Spinning the Wheel costs 🍒 **${buyIn} cherries**. (Your Balance: 🍒 ${balance.toLocaleString()})`,
                flags: [MessageFlags.Ephemeral]
            });
        }

        await interaction.deferReply();

        try {
            // Deduct buy-in
            db.deductCoins(userId, guildId, buyIn);
            db.unlockAchievement(userId, 'first_spin');

            // Roll winning sector (weighted towards non-jackpot items)
            // Roll: CHERRY(5%), GOLD(15%), XP(20%), LUCK(10%), LEMON(25%), RUIN(5%), NOTHING(10%), BONUS(10%)
            const weights = [5, 15, 20, 10, 25, 5, 10, 10];
            const cumulativeWeights = [];
            let sum = 0;
            weights.forEach(w => {
                sum += w;
                cumulativeWeights.push(sum);
            });

            const roll = Math.random() * 100;
            let winningIdx = 0;
            for (let i = 0; i < cumulativeWeights.length; i++) {
                if (roll <= cumulativeWeights[i]) {
                    winningIdx = i;
                    break;
                }
            }

            const sector = WHEEL_SECTORS[winningIdx];
            const resultText = sector.action(userId, guildId);
            db.logTransaction(userId, 'Wheel Spin', `Spun wheel and landed on ${sector.label} 🎡`);

            // --- CANVAS DRAWING ---
            const canvas = createCanvas(800, 480);
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;

            const cx = 250;
            const cy = 240;
            const radius = 180;

            // 1. Draw Cute Pastel Arcade Room Background
            const roomGrad = ctx.createRadialGradient(400, 240, 50, 400, 240, 450);
            roomGrad.addColorStop(0, '#fbcfe8'); // Pink 200
            roomGrad.addColorStop(1, '#fdf4ff'); // Fuchsia 50
            ctx.fillStyle = roomGrad;
            ctx.fillRect(0, 0, 800, 480);

            // Flashing border bulbs around the outer edges of the card
            ctx.fillStyle = '#f472b6'; // Cute pink bulbs
            for (let x = 20; x < 800; x += 60) {
                ctx.beginPath(); ctx.arc(x, 10, 3, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(x, 470, 3, 0, Math.PI * 2); ctx.fill();
            }
            for (let y = 20; y < 480; y += 60) {
                ctx.beginPath(); ctx.arc(10, y, 3, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(790, y, 3, 0, Math.PI * 2); ctx.fill();
            }

            // Draw Wheel shadow
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetY = 10;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Draw Wheel Sectors
            const numSectors = WHEEL_SECTORS.length;
            const sectorAngle = (Math.PI * 2) / numSectors;

            // We want the winning sector to end up pointing UP (at -90 degrees / 270 degrees).
            // Rotation offset to make sector `winningIdx` point straight up.
            const targetRotation = -sectorAngle * winningIdx - sectorAngle / 2 - Math.PI / 2;

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(targetRotation);

            for (let i = 0; i < numSectors; i++) {
                ctx.fillStyle = WHEEL_SECTORS[i].color;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.arc(0, 0, radius, i * sectorAngle, (i + 1) * sectorAngle);
                ctx.closePath();
                ctx.fill();

                // Draw sector border lines
                ctx.strokeStyle = '#fbcfe8'; // Soft pink border
                ctx.lineWidth = 2.5;
                ctx.stroke();

                // Draw sector text labels
                ctx.save();
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 12px "Segoe UI", "Segoe UI Emoji", sans-serif';
                ctx.textAlign = 'right';
                ctx.textBaseline = 'middle';
                
                // Rotate to center of sector
                const textAngle = i * sectorAngle + sectorAngle / 2;
                ctx.rotate(textAngle);
                
                // Position text near outer rim
                ctx.fillText(WHEEL_SECTORS[i].label, radius - 15, 0);
                ctx.restore();
            }
            ctx.restore();

            // Draw outer neon glow rim
            ctx.strokeStyle = sector.color; // Wins color glow
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.stroke();

            // Draw center cap pin
            ctx.save();
            ctx.fillStyle = '#fce7f3'; // Soft pink cap
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(cx, cy, 22, 0, Math.PI * 2);
            ctx.fill();

            // Center cap inner border
            ctx.strokeStyle = '#f472b6';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.restore();

            // Draw Pointer Arrow at Top (pointing down at cx, cy-radius)
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#f472b6';
            ctx.shadowBlur = 5;
            ctx.beginPath();
            ctx.moveTo(cx, cy - radius - 10);     // pointer tail top
            ctx.lineTo(cx - 14, cy - radius - 30); // top left tail
            ctx.lineTo(cx + 14, cy - radius - 30); // top right tail
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#e11d48'; // Cute red tip pointing down
            ctx.beginPath();
            ctx.moveTo(cx, cy - radius + 10);
            ctx.lineTo(cx - 12, cy - radius - 10);
            ctx.lineTo(cx + 12, cy - radius - 10);
            ctx.closePath();
            ctx.fill();

            // 2. Right Side Status Ledger (Frosted Glass Panel)
            const ledX = 490;
            const ledY = 40;
            const ledW = 270;
            const ledH = 400;

            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.strokeStyle = 'rgba(244, 114, 182, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(ledX, ledY, ledW, ledH, 16);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // Title
            ctx.fillStyle = '#be185d';
            ctx.font = 'bold 10px "Segoe UI", "Segoe UI Emoji", sans-serif';
            ctx.fillText('🎀 WHEEL OF FORTUNE LEDGER', ledX + 20, ledY + 36);

            // Divider
            ctx.strokeStyle = 'rgba(244, 114, 182, 0.2)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(ledX + 20, ledY + 48);
            ctx.lineTo(ledX + ledW - 20, ledY + 48);
            ctx.stroke();

            // Player Purse
            ctx.fillStyle = '#9d174d';
            ctx.font = '11px "Segoe UI", "Segoe UI Emoji", sans-serif';
            ctx.fillText('Account Holder:', ledX + 20, ledY + 80);
            ctx.fillStyle = '#831843';
            ctx.font = 'bold 12px "Segoe UI", "Segoe UI Emoji", sans-serif';
            ctx.fillText(char.char_name, ledX + 20, ledY + 100);

            // Stake ticket
            ctx.fillStyle = '#9d174d';
            ctx.font = '11px "Segoe UI", "Segoe UI Emoji", sans-serif';
            ctx.fillText('Spin Ticket Cost:', ledX + 20, ledY + 140);
            ctx.fillStyle = '#e11d48';
            ctx.font = 'bold 12px "Segoe UI", "Segoe UI Emoji", sans-serif';
            ctx.fillText(`-🍒 ${buyIn} cherries`, ledX + 20, ledY + 160);

            // Winner Outcome Display
            ctx.fillStyle = '#9d174d';
            ctx.font = '11px "Segoe UI", "Segoe UI Emoji", sans-serif';
            ctx.fillText('Landed Sector:', ledX + 20, ledY + 200);
            ctx.fillStyle = sector.color;
            ctx.font = 'bold 14px "Segoe UI", "Segoe UI Emoji", sans-serif';
            ctx.fillText(sector.label, ledX + 20, ledY + 222);

            ctx.fillStyle = '#831843';
            ctx.font = 'italic 11px "Segoe UI", "Segoe UI Emoji", sans-serif';
            // Wrap result text
            const words = resultText.split(' ');
            let line = '';
            let lineY = ledY + 242;
            for (let w = 0; w < words.length; w++) {
                const testLine = line + words[w] + ' ';
                const metrics = ctx.measureText(testLine);
                if (metrics.width > ledW - 40) {
                    ctx.fillText(line, ledX + 20, lineY);
                    line = words[w] + ' ';
                    lineY += 16;
                } else {
                    line = testLine;
                }
            }
            ctx.fillText(line, ledX + 20, lineY);

            // Divider
            ctx.strokeStyle = 'rgba(244, 114, 182, 0.2)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(ledX + 20, ledY + 310);
            ctx.lineTo(ledX + ledW - 20, ledY + 310);
            ctx.stroke();

            // New Balance
            ctx.fillStyle = '#9d174d';
            ctx.font = 'bold 9px "Segoe UI", "Segoe UI Emoji", sans-serif';
            ctx.fillText('UPDATED WALLET BALANCE', ledX + 20, ledY + 338);

            const newBalance = db.getBalance(userId, guildId);
            ctx.fillStyle = '#db2777';
            ctx.font = 'bold 20px "Segoe UI", "Segoe UI Emoji", sans-serif';
            ctx.fillText(`🍒 ${newBalance.toLocaleString()}`, ledX + 20, ledY + 365);

            const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'wheel.png' });

            const wheelEmbed = new EmbedBuilder()
                .setColor('#fbcfe8')
                .setTitle('🎀 WHEEL OF FORTUNE 🎀')
                .setAuthor({ name: `${char.char_name} Spun the Wheel!`, iconURL: interaction.user.displayAvatarURL() })
                .setDescription(
                    `🎉 **Landed on:** **${sector.label}**\n` +
                    `📝 **Result:** ${resultText}\n\n` +
                    `📈 **Ledger Update:**\n` +
                    `• Buy-in: \`-🍒 ${buyIn}\` cherries\n` +
                    `• New Balance: \`🍒 ${newBalance.toLocaleString()}\` cherries`
                )
                .setImage('attachment://wheel.png')
                .setTimestamp();

            await interaction.editReply({ embeds: [wheelEmbed], files: [attachment] });

        } catch (err) {
            console.error('Error spinning wheel:', err);
            await interaction.editReply('❌ There was an error while spinning the Wheel of Fortune.');
        }
    }
};
