const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas } = require('@napi-rs/canvas');
const db = require('../database.js');

const VEHICLES = {
    Bicycle:  { cost: 0,      speedMod: 1.0,  emoji: '🚲' },
    Scooter:  { cost: 10000,  speedMod: 1.5,  emoji: '🛵' },
    Van:      { cost: 30000,  speedMod: 2.0,  emoji: '🚚' },
    Truck:    { cost: 75000,  speedMod: 3.0,  emoji: '🚛' },
    'Cargo Jet': { cost: 250000, speedMod: 5.0, emoji: '✈️' }
};

const JOBS = {
    food:   { name: 'Food Order',   payout: 200,  duration: 60,   emoji: '🍕' },
    box:    { name: 'Courier Box',  payout: 600,  duration: 180,  emoji: '📦' },
    luxury: { name: 'Luxury Cargo', payout: 2500, duration: 600,  emoji: '💎' }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delivery')
        .setDescription('📦 Build and run a real-life delivery shipping company')
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('📋 Check your logistics fleet status, active runs, and hired staff'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('jobs')
                .setDescription('📋 Browse available delivery contracts'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('start')
                .setDescription('✈️ Dispatch your vehicle on a delivery run')
                .addStringOption(option =>
                    option.setName('job')
                        .setDescription('Select the delivery job contract')
                        .setRequired(true)
                        .addChoices(
                            { name: '🍕 Food Order (🍒 200 payout)', value: 'food' },
                            { name: '📦 Courier Box (🍒 600 payout)', value: 'box' },
                            { name: '💎 Luxury Cargo (🍒 2,500 payout)', value: 'luxury' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('upgrade')
                .setDescription('🛠️ Purchase fleet upgrades')
                .addStringOption(option =>
                    option.setName('choice')
                        .setDescription('Choose upgrade type')
                        .setRequired(true)
                        .addChoices(
                            { name: '🛵 Scooter (🍒 10,000)', value: 'Scooter' },
                            { name: '🚚 Van (🍒 30,000)', value: 'Van' },
                            { name: '🚛 Truck (🍒 75,000)', value: 'Truck' },
                            { name: '✈️ Cargo Jet (🍒 250,000)', value: 'Cargo Jet' },
                            { name: '👤 Hire Worker (🍒 15,000 / Passive 15c/hr)', value: 'worker' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('claim')
                .setDescription('💰 Claim rewards for completed jobs and passive worker deliveries'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('profile')
                .setDescription('📜 View the visual certificate of your logistics fleet')),

    async execute(interaction) {
        await interaction.deferReply();

        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        const subcommand = interaction.options.getSubcommand();

        const char = db.getCharacter(userId);
        if (!char || !char.char_name) {
            return interaction.editReply({ content: '⚠️ **You must create an RPG character first!**\nUse **`/character create`** to get started.' });
        }

        const company = db.getDeliveryCompany(userId);
        const activeJobs = db.getActiveDeliveryJobs(userId);

        // --- SUBCOMMAND: STATUS ---
        if (subcommand === 'status') {
            const vehicleConfig = VEHICLES[company.vehicle] || VEHICLES.Bicycle;

            // Calculate passive worker income
            const hours = (Date.now() - company.lastAutomatedClaim) / 1000 / 60 / 60;
            const passiveYield = Math.floor(hours * company.workers * 15);

            const statusEmbed = new EmbedBuilder()
                .setColor('#db2777')
                .setTitle('📦 ROYAL LOGISTICS CORP')
                .setDescription('Manage vehicles and hire workers to run express delivery operations.')
                .addFields(
                    { name: '🚛 ACTIVE TRANSPORTATION', value: `${vehicleConfig.emoji} **${company.vehicle}** (Speed modifier: **${vehicleConfig.speedMod}x**)` },
                    { name: '👤 HIRED WORKFORCE', value: `• **Workers Hired:** \` ${company.workers} \` employees\n• **Passive Yield:** 🍒 **${company.workers * 15}**/hr\n• **Accrued Cash:** 🍒 **${passiveYield}** (Run \`/delivery claim\`)` }
                )
                .setTimestamp();

            if (activeJobs.length > 0) {
                let jobText = '';
                activeJobs.forEach(job => {
                    const remaining = Math.max(0, Math.floor((job.endsAt - Date.now()) / 1000));
                    if (remaining === 0) {
                        jobText += `• **${job.jobName}**: 🟢 **Completed!** Run \`/delivery claim\` to get 🍒 **${job.payout}**.\n`;
                    } else {
                        const m = Math.floor(remaining / 60);
                        const s = remaining % 60;
                        jobText += `• **${job.jobName}**: ⏳ Dispatch in progress... **${m}m ${s}s** remaining (Payout: 🍒 **${job.payout}**).\n`;
                    }
                });
                statusEmbed.addFields({ name: '✈️ DISPATCH STATUS', value: jobText });
            } else {
                statusEmbed.addFields({ name: '✈️ DISPATCH STATUS', value: '*No delivery runs currently active.*' });
            }

            await interaction.editReply({ embeds: [statusEmbed] });
        }

        // --- SUBCOMMAND: JOBS ---
        else if (subcommand === 'jobs') {
            const vehicleConfig = VEHICLES[company.vehicle] || VEHICLES.Bicycle;
            const jobsEmbed = new EmbedBuilder()
                .setColor('#F39C12')
                .setTitle('🍕 ACTIVE EXPRESS CONTRACTS')
                .setDescription('Dispatch your vehicle on delivery contracts. Better vehicles complete runs faster.')
                .setTimestamp();

            Object.keys(JOBS).forEach(key => {
                const j = JOBS[key];
                const adjustedDuration = Math.max(10, Math.floor(j.duration / vehicleConfig.speedMod));
                
                const m = Math.floor(adjustedDuration / 60);
                const s = adjustedDuration % 60;

                jobsEmbed.addFields({
                    name: `${j.emoji} ${j.name}`,
                    value: `• **Payout:** 🍒 **${j.payout} cherries**\n• **Duration:** **${m}m ${s}s** (Fleet speed: ${vehicleConfig.speedMod}x)`
                });
            });

            await interaction.editReply({ embeds: [jobsEmbed] });
        }

        // --- SUBCOMMAND: START ---
        else if (subcommand === 'start') {
            const jobKey = interaction.options.getString('job');
            const j = JOBS[jobKey];

            if (activeJobs.length >= 2) {
                return interaction.editReply({ content: '❌ Your logistics line is busy! You can have at most **2** active runs dispatching at a time.' });
            }

            const vehicleConfig = VEHICLES[company.vehicle] || VEHICLES.Bicycle;
            const adjustedDuration = Math.max(10, Math.floor(j.duration / vehicleConfig.speedMod));
            const endsAt = Date.now() + (adjustedDuration * 1000);

            db.startDeliveryJob(userId, j.name, j.payout, endsAt);

            const m = Math.floor(adjustedDuration / 60);
            const s = adjustedDuration % 60;

            const startEmbed = new EmbedBuilder()
                .setColor('#fbcfe8')
                .setTitle(`${j.emoji} FLEET DISPATCHED`)
                .setDescription(
                    `You dispatched your **${company.vehicle}** on a **${j.name}** contract!\n` +
                    `It will arrive in **${m}m ${s}s**. Return then to claim rewards.\n\n` +
                    `• **Payout on arrival:** 🍒 **${j.payout} cherries**`
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [startEmbed] });
        }

        // --- SUBCOMMAND: UPGRADE ---
        else if (subcommand === 'upgrade') {
            const choice = interaction.options.getString('choice');
            const wallet = db.getBalance(userId, guildId);

            if (choice === 'worker') {
                const cost = 15000;
                if (wallet < cost) {
                    return interaction.editReply({ content: `❌ **Insufficient funds!** Hiring a worker costs 🍒 **${cost.toLocaleString()}** cherries. (You have: 🍒 **${wallet.toLocaleString()}**)` });
                }

                db.hireWorker(userId, cost, guildId);

                const workerEmbed = new EmbedBuilder()
                    .setColor('#fbcfe8')
                    .setTitle('👤 WORKER HIRED')
                    .setDescription(
                        `You hired an express courier employee!\n` +
                        `They will generate 🍒 **15** cherries/hour passively for your company.\n\n` +
                        `• **Wallet Balance:** 🍒 **${db.getBalance(userId, guildId).toLocaleString()} cherries**`
                    )
                    .setTimestamp();

                return interaction.editReply({ embeds: [workerEmbed] });
            }

            // Vehicle upgrade
            const targetVehicle = choice;
            const targetConfig = VEHICLES[targetVehicle];
            const currentConfig = VEHICLES[company.vehicle] || VEHICLES.Bicycle;

            if (targetConfig.cost <= currentConfig.cost) {
                return interaction.editReply({ content: `❌ You already own a vehicle of equal or higher tier!` });
            }

            if (wallet < targetConfig.cost) {
                return interaction.editReply({ content: `❌ **Insufficient funds!** Upgrading to **${targetVehicle}** costs 🍒 **${targetConfig.cost.toLocaleString()}** cherries. (You have: 🍒 **${wallet.toLocaleString()}**)` });
            }

            db.upgradeVehicle(userId, targetVehicle, targetConfig.cost, guildId);

            const vehicleEmbed = new EmbedBuilder()
                .setColor('#F1C40F')
                .setTitle('🛠️ TRANSPORT UPGRADED')
                .setDescription(
                    `🚀 Successfully upgraded your shipping fleet vehicle to **${targetVehicle}**!\n` +
                    `Your speed multiplier has increased from **${currentConfig.speedMod}x** to **${targetConfig.speedMod}x**!\n\n` +
                    `• **Wallet Balance:** 🍒 **${db.getBalance(userId, guildId).toLocaleString()} cherries**`
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [vehicleEmbed] });
        }

        // --- SUBCOMMAND: CLAIM ---
        else if (subcommand === 'claim') {
            let totalClaimed = 0;
            let jobsFinishedCount = 0;

            activeJobs.forEach(job => {
                if (Date.now() >= job.endsAt) {
                    totalClaimed += job.payout;
                    jobsFinishedCount++;
                    db.completeDeliveryJob(job.id, userId, job.payout, guildId);
                }
            });

            // Claim passive workers income
            const hours = (Date.now() - company.lastAutomatedClaim) / 1000 / 60 / 60;
            const passiveYield = Math.floor(hours * company.workers * 15);

            if (passiveYield > 0) {
                totalClaimed += passiveYield;
                db.collectAutomatedDelivery(userId, passiveYield, Date.now(), guildId);
            }

            if (totalClaimed <= 0) {
                return interaction.editReply({ content: '❌ No rewards are ready to claim yet! Wait for deliveries to arrive or workers to collect wages.' });
            }

            db.prepare("UPDATE users SET delivery_runs = delivery_runs + ?, delivery_earnings = delivery_earnings + ? WHERE userId = ?").run(jobsFinishedCount, totalClaimed, userId);

            const claimEmbed = new EmbedBuilder()
                .setColor('#fbcfe8')
                .setTitle('🍒 REWARDS CREDITED')
                .setDescription(
                    `Logistics payout summary successfully processed:\n\n` +
                    (jobsFinishedCount > 0 ? `• **Deliveries Arrived:** Collected 🍒 **${(totalClaimed - passiveYield).toLocaleString()}** from \`${jobsFinishedCount}\` runs.\n` : '') +
                    (passiveYield > 0 ? `• **Worker passive yield:** Collected 🍒 **${passiveYield.toLocaleString()}** from your hired staff.\n` : '') +
                    `\n🍒 **Total Earnings:** 🍒 **+${totalClaimed.toLocaleString()} cherries**\n` +
                    `🏦 **Wallet Balance:** 🍒 **${db.getBalance(userId, guildId).toLocaleString()} cherries**`
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [claimEmbed] });
        }

        // --- SUBCOMMAND: PROFILE ---
        else if (subcommand === 'profile') {
            const company = db.getDeliveryCompany(userId);
            if (!company) {
                return interaction.editReply('❌ **You do not own a logistics company yet!** Start a job first with \`/delivery start\`.');
            }

            try {
                // Fetch stats from DB
                const runs = char.delivery_runs || 0;
                const earnings = char.delivery_earnings || 0;
                const workers = company.workers || 0;
                const activeVehicle = company.vehicle || 'Bicycle';
                const passiveYield = workers * 15;

                // Emoji matching
                const vehicleEmojis = {
                    'Bicycle': '🚲',
                    'Scooter': '🛵',
                    'Van': '🚚',
                    'Truck': '🚛',
                    'Cargo Jet': '✈️'
                };
                const vehicleEmoji = vehicleEmojis[activeVehicle] || '📦';

                // Setup Canvas
                const width = 800;
                const height = 450;
                const canvas = createCanvas(width, height);
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;

                // 1. Dark Teal/Emerald Gradient Background
                const bgGrad = ctx.createRadialGradient(width/2, height/2, 50, width/2, height/2, width/2);
                bgGrad.addColorStop(0, '#022c22'); // deep emerald-950
                bgGrad.addColorStop(1, '#fbcfe8'); // slate-950
                ctx.fillStyle = bgGrad;
                ctx.fillRect(0, 0, width, height);

                // 2. Frame (Emerald Border)
                const frameColor = '#db2777'; // emerald-500
                ctx.save();
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'; // slate-900 inner box
                ctx.strokeStyle = frameColor;
                ctx.lineWidth = 4;
                ctx.shadowColor = 'rgba(16, 185, 129, 0.4)';
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

                // 3. Left Emblem Frame
                ctx.save();
                ctx.fillStyle = '#fce7f3'; // slate-800 background
                ctx.strokeStyle = '#475569';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(70, 90, 200, 270, 12);
                ctx.fill();
                ctx.stroke();

                // Large Emoji
                ctx.font = '100px "Segoe UI Emoji", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(vehicleEmoji, 170, 220);
                ctx.restore();

                // 4. Right Side Details
                ctx.fillStyle = '#f472b6'; // Emerald green
                ctx.font = 'bold 12px "Segoe UI Emoji", sans-serif';
                ctx.fillText('INTERSTATE CARGO FREIGHT OPERATING LICENSE', 300, 95);

                ctx.fillStyle = '#831843';
                ctx.font = 'bold 26px "Segoe UI Emoji", sans-serif';
                ctx.fillText(`${char.char_name}'s Express Logistics`, 300, 135);

                ctx.fillStyle = '#9d174d';
                ctx.font = 'bold 13px sans-serif';
                ctx.fillText(`Fleet Vehicle: ${activeVehicle} Class`, 300, 162);

                // Divider line
                ctx.strokeStyle = 'rgba(244, 114, 182, 0.3)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(300, 185);
                ctx.lineTo(710, 185);
                ctx.stroke();

                // Details Grid
                ctx.fillStyle = '#9d174d';
                ctx.font = '12px sans-serif';
                ctx.fillText('Corporate Holder ID:', 300, 215);
                ctx.fillStyle = '#831843';
                ctx.font = 'bold 13px sans-serif';
                ctx.fillText(`<@${userId}>`, 450, 215);

                ctx.fillStyle = '#9d174d';
                ctx.font = '12px sans-serif';
                ctx.fillText('Hired Logistics Staff:', 300, 255);
                ctx.fillStyle = '#831843';
                ctx.font = 'bold 13px sans-serif';
                ctx.fillText(`${workers} passive courier drivers`, 450, 255);

                ctx.fillStyle = '#9d174d';
                ctx.font = '12px sans-serif';
                ctx.fillText('Active Runs Completed:', 300, 295);
                ctx.fillStyle = '#22d3ee'; // Cyan
                ctx.font = 'bold 14px sans-serif';
                ctx.fillText(`${runs.toLocaleString()} runs`, 450, 295);

                ctx.fillStyle = '#9d174d';
                ctx.font = '12px sans-serif';
                ctx.fillText('Fleet Earnings / Yield:', 300, 335);
                ctx.fillStyle = '#db2777'; // Green
                ctx.font = 'bold 14px "Segoe UI Emoji", sans-serif';
                ctx.fillText(`🍒 ${earnings.toLocaleString()} total (🍒 +${passiveYield}/hr)`, 450, 335);

                // 5. Official Teal Seal (bottom right)
                const sx = 660;
                const sy = 330;
                const sRadius = 45;
                ctx.save();
                const sealGrad = ctx.createLinearGradient(sx - sRadius, sy - sRadius, sx + sRadius, sy + sRadius);
                sealGrad.addColorStop(0, '#22d3ee');
                sealGrad.addColorStop(0.5, '#0ea5e9');
                sealGrad.addColorStop(1, '#0369a1');
                ctx.fillStyle = sealGrad;
                
                ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
                ctx.shadowBlur = 8;
                ctx.shadowOffsetY = 4;

                ctx.beginPath();
                ctx.arc(sx, sy, sRadius, 0, Math.PI * 2);
                ctx.fill();

                // Seal border
                ctx.strokeStyle = '#831843';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(sx, sy, sRadius - 5, 0, Math.PI * 2);
                ctx.stroke();

                // Seal Icon
                ctx.fillStyle = '#fef3c7';
                ctx.font = 'bold 24px "Segoe UI Emoji", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('📦', sx, sy);
                ctx.restore();

                const buffer = canvas.toBuffer('image/png');
                const attachment = new AttachmentBuilder(buffer, { name: 'delivery-fleet.png' });

                const fleetEmbed = new EmbedBuilder()
                    .setColor('#fbcfe8')
                    .setTitle(`🚚 Logistics Fleet Operating Deed`)
                    .setDescription(`Official freight logistics permit details for **${char.char_name}**'s courier business.`)
                    .setImage('attachment://delivery-fleet.png')
                    .setTimestamp();

                await interaction.editReply({ embeds: [fleetEmbed], files: [attachment] });

            } catch (err) {
                console.error('Error drawing delivery license:', err);
                await interaction.editReply('❌ There was an error while generating your visual Operating License.');
            }
        }
    }
};
