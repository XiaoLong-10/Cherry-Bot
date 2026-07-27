const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, MessageFlags } = require('discord.js');
const { createCanvas } = require('canvas');
const db = require('../database.js');

const CROPS = {
    Wheat: { name: 'Wheat', seed: 'Wheat Seed', duration: 120000, yieldQty: 3, yieldName: 'Wheat', skillXp: 1, emoji: '🌾' },
    Apple: { name: 'Apple', seed: 'Apple Seed', duration: 300000, yieldQty: 2, yieldName: 'Apple', skillXp: 2, emoji: '🍎' },
    Berry: { name: 'Berry', seed: 'Berry Seed', duration: 600000, yieldQty: 4, yieldName: 'Berries', skillXp: 3, emoji: '🍓' }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('farm')
        .setDescription('🚜 Plant, water, and harvest crops in your personal farm plots')
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('📋 View the current growth status of your 3 farm plots'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('plots')
                .setDescription('📋 View the current growth status of your 3 farm plots'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('plant')
                .setDescription('🌱 Plant a crop seed in an empty soil plot')
                .addIntegerOption(opt =>
                    opt.setName('plot')
                        .setDescription('Select plot index (1-3)')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Plot 1', value: 1 },
                            { name: 'Plot 2', value: 2 },
                            { name: 'Plot 3', value: 3 }
                        ))
                .addStringOption(opt =>
                    opt.setName('crop')
                        .setDescription('Select the seed type to plant')
                        .setRequired(true)
                        .addChoices(
                            { name: '🌾 Wheat (2 mins)', value: 'Wheat' },
                            { name: '🍎 Apple (5 mins)', value: 'Apple' },
                            { name: '🍓 Berry (10 mins)', value: 'Berry' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('water')
                .setDescription('💧 Water a growing crop to cut its remaining growth timer by 50%')
                .addIntegerOption(opt =>
                    opt.setName('plot')
                        .setDescription('Select plot index (1-3)')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Plot 1', value: 1 },
                            { name: 'Plot 2', value: 2 },
                            { name: 'Plot 3', value: 3 }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('harvest')
                .setDescription('🧺 Collect fully grown crops from a farm plot')
                .addIntegerOption(opt =>
                    opt.setName('plot')
                        .setDescription('Select plot index (1-3)')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Plot 1', value: 1 },
                            { name: 'Plot 2', value: 2 },
                            { name: 'Plot 3', value: 3 }
                        ))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        // Verify Character
        const char = db.getCharacter(userId);
        if (!char || !char.char_name) {
            return interaction.reply({
                content: '⚠️ **You must create an RPG character first!** Use `/character create`.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        await interaction.deferReply();

        const getProgressBar = (plantedAt, duration) => {
            const elapsed = Date.now() - plantedAt;
            const pct = Math.max(0, Math.min(1, elapsed / duration));
            const filled = Math.round(pct * 10);
            return '🟩'.repeat(filled) + '⬛'.repeat(10 - filled) + ` (${Math.round(pct * 100)}%)`;
        };

        const getRemainingTimeString = (plantedAt, duration) => {
            const remainingMs = duration - (Date.now() - plantedAt);
            if (remainingMs <= 0) return 'Ready to harvest! 🧺';
            const mins = Math.floor(remainingMs / 60000);
            const secs = Math.ceil((remainingMs % 60000) / 1000);
            return `Ready in **${mins}m ${secs}s**`;
        };

        // --- SUBCOMMAND: VIEW ---
        if (subcommand === 'view' || subcommand === 'plots') {
            const plots = db.getFarmPlots(userId);
            
            // Create Canvas
            const canvas = createCanvas(800, 450);
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;

            // 1. Draw Sky & Grass Pasture Background
            // Sky Gradient
            const skyGrad = ctx.createLinearGradient(0, 0, 0, 160);
            skyGrad.addColorStop(0, '#fbcfe8');
            skyGrad.addColorStop(1, '#fce7f3');
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, 800, 160);

            // Cloud 1
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.beginPath();
            ctx.arc(100, 70, 30, 0, Math.PI * 2);
            ctx.arc(140, 60, 40, 0, Math.PI * 2);
            ctx.arc(180, 70, 30, 0, Math.PI * 2);
            ctx.fill();

            // Cloud 2
            ctx.beginPath();
            ctx.arc(620, 60, 25, 0, Math.PI * 2);
            ctx.arc(655, 50, 35, 0, Math.PI * 2);
            ctx.arc(690, 60, 25, 0, Math.PI * 2);
            ctx.fill();

            // Grass Pasture Ground
            const grassGrad = ctx.createLinearGradient(0, 160, 0, 450);
            grassGrad.addColorStop(0, '#fdf4ff');
            grassGrad.addColorStop(1, '#fce7f3');
            ctx.fillStyle = grassGrad;
            ctx.fillRect(0, 160, 800, 290);

            // Draw header text
            ctx.fillStyle = '#db2777';
            ctx.font = 'bold 24px "Segoe UI", "Segoe UI Emoji", sans-serif';
            ctx.fillText('🎀 CUTE HOMESTEAD FARM', 40, 48);

            const farmingLvl = char.skill_farming || 1;
            ctx.textAlign = 'right';
            ctx.fillText(`FARMING: LVL ${farmingLvl}`, 760, 48);
            ctx.textAlign = 'left';

            // 2. Render each plot
            const plotX = [60, 295, 530];
            const plotY = 130;
            const plotW = 210;
            const plotH = 280;

            for (let i = 1; i <= 3; i++) {
                const rx = plotX[i - 1];
                const ry = plotY;
                const plot = plots.find(p => p.plotIndex === i);

                // Glass container card for plot
                ctx.save();
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.strokeStyle = 'rgba(244, 114, 182, 0.5)';
                ctx.lineWidth = 2;
                ctx.shadowColor = 'rgba(244, 114, 182, 0.3)';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.roundRect(rx, ry, plotW, plotH, 16);
                ctx.fill();
                ctx.stroke();
                ctx.restore();

                // Plot Title header
                ctx.fillStyle = '#831843';
                ctx.font = 'bold 15px "Segoe UI", "Segoe UI Emoji", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`PLOT ${i}`, rx + plotW / 2, ry + 28);

                // Soil patch position
                const soilX = rx + 20;
                const soilY = ry + 44;
                const soilW = plotW - 40;
                const soilH = 120;

                if (!plot) {
                    // Draw Empty Soil
                    ctx.fillStyle = '#fbcfe8'; // Cute pink dirt
                    ctx.beginPath();
                    ctx.roundRect(soilX, soilY, soilW, soilH, 12);
                    ctx.fill();

                    // Shovel/pot emoji placeholder
                    ctx.fillStyle = '#831843';
                    ctx.font = '40px "Segoe UI", "Segoe UI Emoji", sans-serif';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('🎀', soilX + soilW / 2, soilY + soilH / 2);

                    ctx.font = '12px "Segoe UI", "Segoe UI Emoji", sans-serif';
                    ctx.fillStyle = '#be185d';
                    ctx.fillText('EMPTY SOIL', rx + plotW / 2, ry + 200);
                    ctx.font = 'italic 11px "Segoe UI", "Segoe UI Emoji", sans-serif';
                    ctx.fillStyle = '#db2777';
                    ctx.fillText('Ready to Plant', rx + plotW / 2, ry + 220);
                } else {
                    const r = CROPS[plot.cropType];
                    const elapsed = Date.now() - plot.plantedAt;
                    const pct = Math.max(0, Math.min(1, elapsed / r.duration));
                    const isGrown = pct >= 1.0;

                    // Soil patch (Darker brown if watered)
                    ctx.fillStyle = plot.watered ? '#f472b6' : '#fbcfe8';
                    ctx.beginPath();
                    ctx.roundRect(soilX, soilY, soilW, soilH, 12);
                    ctx.fill();

                    // Crop stage emoji
                    let stageEmoji = '🌱'; // Sprout
                    if (pct >= 0.40 && pct < 0.99) {
                        stageEmoji = '🌿'; // Growing
                    } else if (isGrown) {
                        stageEmoji = r.emoji; // Matured
                    }

                    ctx.fillStyle = '#831843';
                    ctx.font = '44px "Segoe UI", "Segoe UI Emoji", sans-serif';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(stageEmoji, soilX + soilW / 2, soilY + soilH / 2);

                    // Water droplet icon
                    if (plot.watered) {
                        ctx.fillStyle = '#db2777';
                        ctx.font = '18px "Segoe UI", "Segoe UI Emoji", sans-serif';
                        ctx.fillText('💧', soilX + soilW - 20, soilY + 20);
                    }

                    // Progress calculations
                    ctx.font = 'bold 13px "Segoe UI", "Segoe UI Emoji", sans-serif';
                    ctx.fillStyle = '#831843';
                    ctx.fillText(`${plot.cropType} (${Math.round(pct * 100)}%)`, rx + plotW / 2, ry + 195);

                    // Progress Bar
                    const barX = rx + 20;
                    const barY = ry + 212;
                    const barW = plotW - 40;
                    const barH = 10;

                    ctx.fillStyle = '#fce7f3';
                    ctx.beginPath();
                    ctx.roundRect(barX, barY, barW, barH, 5);
                    ctx.fill();

                    const filledW = barW * pct;
                    if (filledW > 0) {
                        const barGrad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
                        barGrad.addColorStop(0, '#f472b6');
                        barGrad.addColorStop(1, '#db2777');
                        ctx.fillStyle = barGrad;
                        ctx.beginPath();
                        ctx.roundRect(barX, barY, filledW, barH, 5);
                        ctx.fill();
                    }

                    // Timer string
                    let remainingText = '';
                    const remainingMs = r.duration - elapsed;
                    if (remainingMs <= 0) {
                        remainingText = '🧺 READY TO HARVEST!';
                    } else {
                        const mins = Math.floor(remainingMs / 60000);
                        const secs = Math.ceil((remainingMs % 60000) / 1000);
                        remainingText = `⏱️ ${mins}m ${secs}s`;
                    }

                    ctx.font = 'bold 11px "Segoe UI", "Segoe UI Emoji", sans-serif';
                    ctx.fillStyle = isGrown ? '#db2777' : '#9d174d';
                    ctx.fillText(remainingText, rx + plotW / 2, ry + 242);
                }
            }

            ctx.textBaseline = 'alphabetic'; // Reset text alignment baseline

            const buffer = canvas.toBuffer();
            const attachment = new AttachmentBuilder(buffer, { name: 'homestead-farm.png' });

            const farmEmbed = new EmbedBuilder()
                .setColor('#f472b6')
                .setTitle('🎀 CUTE HOMESTEAD FARM')
                .setDescription('Visual layout of your crop plots. Keep them watered to harvest twice as fast!')
                .setImage('attachment://homestead-farm.png')
                .setFooter({ text: `Homestead Farming Level: Lvl ${farmingLvl}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [farmEmbed], files: [attachment] });
        }

        // --- SUBCOMMAND: PLANT ---
        else if (subcommand === 'plant') {
            const plotIdx = interaction.options.getInteger('plot');
            const cropType = interaction.options.getString('crop');
            const r = CROPS[cropType];

            const plots = db.getFarmPlots(userId);
            const existing = plots.find(p => p.plotIndex === plotIdx);
            if (existing) {
                return interaction.editReply(`❌ **Plot ${plotIdx} is already occupied!** Harvest or wait for the crop to finish.`);
            }

            // Check if player has the seed
            const inventory = db.getInventory(userId);
            const seedItem = inventory.find(i => i.itemName.toLowerCase() === r.seed.toLowerCase() && i.quantity > 0);
            if (!seedItem) {
                return interaction.editReply(`❌ **You do not own any ${r.seed}s!** Buy some seeds at the general \`/shop\`.`);
            }

            // Remove 1x Seed
            db.removeItem(userId, r.seed, 1);

            // Plant Crop
            db.plantCrop(userId, plotIdx, cropType);
            db.logTransaction(userId, 'Farm Plant', `Planted ${cropType} seed in plot ${plotIdx}`);

            const plantEmbed = new EmbedBuilder()
                .setColor('#f472b6')
                .setTitle('🎀 SEED PLANTED')
                .setDescription(
                    `You successfully planted a **${r.name} Seed** ${r.emoji} in **Plot ${plotIdx}**!\n\n` +
                    `• **Growth Time:** \` ${r.duration / 60000} minutes \`\n` +
                    `• **Watering:** Run \`/farm water plot:${plotIdx}\` to reduce growth time by 50%!`
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [plantEmbed] });
        }

        // --- SUBCOMMAND: WATER ---
        else if (subcommand === 'water') {
            const plotIdx = interaction.options.getInteger('plot');
            const plots = db.getFarmPlots(userId);
            const plot = plots.find(p => p.plotIndex === plotIdx);

            if (!plot) {
                return interaction.editReply(`❌ **Plot ${plotIdx} is empty!** Plant a seed first.`);
            }

            const r = CROPS[plot.cropType];
            const remainingMs = r.duration - (Date.now() - plot.plantedAt);
            if (remainingMs <= 0) {
                return interaction.editReply(`🧺 **Plot ${plotIdx} is already fully grown!** Harvest it instead.`);
            }

            if (plot.watered) {
                return interaction.editReply(`❌ **Plot ${plotIdx} has already been watered!** Crops can only be watered once per growth cycle.`);
            }

            // Water crop
            db.waterCrop(userId, plotIdx);
            db.logTransaction(userId, 'Farm Water', `Watered plot ${plotIdx}`);

            // Fetch freshly updated plot timer
            const updatedPlots = db.getFarmPlots(userId);
            const uPlot = updatedPlots.find(p => p.plotIndex === plotIdx);
            const newTimer = getRemainingTimeString(uPlot.plantedAt, r.duration);

            const waterEmbed = new EmbedBuilder()
                .setColor('#f472b6')
                .setTitle('🎀 CROP WATERED')
                .setDescription(
                    `💦 You watered **Plot ${plotIdx}**! The remaining growth timer has been slashed by **50%**!\n\n` +
                    `• **New Timer:** ${newTimer}`
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [waterEmbed] });
        }

        // --- SUBCOMMAND: HARVEST ---
        else if (subcommand === 'harvest') {
            const plotIdx = interaction.options.getInteger('plot');
            const plots = db.getFarmPlots(userId);
            const plot = plots.find(p => p.plotIndex === plotIdx);

            if (!plot) {
                return interaction.editReply(`❌ **Plot ${plotIdx} is empty!** Nothing to harvest.`);
            }

            const r = CROPS[plot.cropType];
            const remainingMs = r.duration - (Date.now() - plot.plantedAt);
            if (remainingMs > 0) {
                const timerText = getRemainingTimeString(plot.plantedAt, r.duration);
                return interaction.editReply(`❌ **The crop in Plot ${plotIdx} is still growing!** (${timerText})`);
            }

            // 1. Remove plot
            db.harvestCrop(userId, plotIdx);

            // 2. Add Yield to inventory
            db.addItem(userId, r.yieldName, r.yieldQty);

            // 3. Level Up Farming
            const newLvl = db.increaseSkill(userId, 'farming', r.skillXp);
            db.logTransaction(userId, 'Farm Harvest', `Harvested ${r.yieldQty}x ${r.yieldName} from plot ${plotIdx}`);

            const harvestEmbed = new EmbedBuilder()
                .setColor('#f472b6')
                .setTitle('🎀 CROP HARVESTED')
                .setDescription(
                    `🎉 You successfully harvested **Plot ${plotIdx}**!\n\n` +
                    `• **Collected:** **${r.yieldName}** x${r.yieldQty} ${r.emoji} (added to inventory)\n` +
                    `• **Farming Level:** Your Farming skill has increased to **Lvl ${newLvl}**!`
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [harvestEmbed] });
        }
    }
};
