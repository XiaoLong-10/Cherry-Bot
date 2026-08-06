const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database.js');

const WILD_CREATURES = [
    { name: 'Sparkmew ⚡', rarity: 'Common' },
    { name: 'Pyroruff 🔥', rarity: 'Common' },
    { name: 'Aquafox 💧', rarity: 'Common' },
    { name: 'Terrasaur 🌱', rarity: 'Rare' },
    { name: 'Celestibird ✨', rarity: 'Rare' },
    { name: 'Shadowraith 🔮', rarity: 'Legendary' },
    { name: 'Nebula-Rex 🪐', rarity: 'Legendary' }
];

function getActiveEvent() {
    const month = new Date().getMonth(); // 0 = Jan, 6 = Jul, 9 = Oct, 11 = Dec
    if (month === 9) {
        return {
            name: 'Spooky Hollow 🎃',
            description: 'Halloween species are roaming the sanctuaries!',
            legendary: { name: 'Ghost-Rex 👻', rarity: 'Legendary' },
            rare: { name: 'Lanterncat 🎃', rarity: 'Rare' }
        };
    }
    if (month === 11) {
        return {
            name: 'Winter Solstice ❄️',
            description: 'Winter solstice species have arrived in the sanctuaries!',
            legendary: { name: 'Frosty-Rex ❄️', rarity: 'Legendary' },
            rare: { name: 'Snowmew 🌨️', rarity: 'Rare' }
        };
    }
    if (month === 6) {
        return {
            name: 'Summer Solstice ☀️',
            description: 'Summer solstice species are active in the sanctuaries!',
            legendary: { name: 'Sun-fox ☀️', rarity: 'Legendary' },
            rare: { name: 'Solaruff ☀️', rarity: 'Rare' }
        };
    }
    return null;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('collection')
        .setDescription('🐾 Manage your premium collection assets and creature sanctuaries')
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('📋 Check your collection registry, dragons, aquarium, farm, and dino park'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('catch')
                .setDescription('🍒 Catch a wild original creature (costs 🍒 200)'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('dragon')
                .setDescription('🐉 Purchase and raise rare dragons')
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('Select action')
                        .setRequired(true)
                        .addChoices(
                            { name: '🥚 Hatch Dragon Egg (🍒 15,000)', value: 'hatch' },
                            { name: '🍖 Feed Dragon (🍒 500)', value: 'feed' }
                        ))
                .addStringOption(option =>
                    option.setName('name_or_id')
                        .setDescription('Enter nickname to Hatch OR Dragon ID to Feed')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('aquarium')
                .setDescription('🐠 Buy exotic fish and collect visitor ticket profits')
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('Select action')
                        .setRequired(true)
                        .addChoices(
                            { name: '🐠 Buy Exotic Fish (🍒 3,000)', value: 'buy' },
                            { name: '🎟️ Claim Visitor Tickets', value: 'claim' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('farm')
                .setDescription('🐄 Buy livestock and harvest passive agricultural yields')
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('Select action')
                        .setRequired(true)
                        .addChoices(
                            { name: '🐔 Buy Chicken (🍒 2,000 / Yield: 🍒 5/hr)', value: 'buy_chicken' },
                            { name: '🐄 Buy Cow (🍒 6,000 / Yield: 🍒 20/hr)', value: 'buy_cow' },
                            { name: '🧺 Harvest Farm Payouts', value: 'claim' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('park')
                .setDescription('🦖 Clone dinosaurs and manage high-security enclosures')
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('Select action')
                        .setRequired(true)
                        .addChoices(
                            { name: '🧬 Clone Dinosaur (🍒 50,000 / Yield: 🍒 250/hr)', value: 'clone' },
                            { name: '🛡️ Upgrade Enclosure Fences', value: 'upgrade' },
                            { name: '🎟️ Collect Park Ticket Sales', value: 'claim' }
                        ))),

    async execute(interaction) {
        await interaction.deferReply();

        const userId = interaction.user.id;
        const guildId = interaction.guild ? (interaction.guild ? interaction.guild.id : 'GLOBAL') : 'GLOBAL';
        const subcommand = interaction.options.getSubcommand();

        const wallet = db.getBalance(userId, guildId);

        // --- SUBCOMMAND: STATUS ---
        if (subcommand === 'status') {
            const creatures = db.getUserCreatures(userId);
            const dragons = db.getUserDragons(userId);
            const aquarium = db.getAquarium(userId);
            const farm = db.getFarmAnimals(userId);
            const park = db.getDinoPark(userId);

            const event = getActiveEvent();
            const eventBadgeText = event ? `\n• **Active Seasonal Event:** **${event.name}** (${event.description})` : '';

            const statusEmbed = new EmbedBuilder()
                .setColor('#fbcfe8')
                .setTitle('🐾 PREMIUM SANCTUARY PORTFOLIO')
                .setDescription('Overview of your rare wildlife, dragons, agricultural stocks, and safari parks.')
                .setTimestamp();

            // 1. Pokémon-style collection count
            statusEmbed.addFields({
                name: '🎮 Wild Creature Dex',
                value: `• **Total Caught:** \` ${creatures.length} \` creatures\n• *Run \`/collection catch\` to expand your index.*${eventBadgeText}`
            });

            // 2. Dragons list
            let dragonText = '';
            if (dragons.length > 0) {
                dragons.forEach(d => {
                    dragonText += `• **[ID: ${d.id}]** ${d.dragonName} — Stage: **${d.stage}** (Fed: ${d.fedCount}/15 times)\n`;
                });
            } else {
                dragonText = '*No dragons hatched yet.*';
            }
            statusEmbed.addFields({ name: '🐉 Dragon Nest', value: dragonText });

            // 3. Aquarium status
            const fishHours = (Date.now() - aquarium.lastCollected) / 1000 / 60 / 60;
            const fishAccrued = Math.floor(fishHours * aquarium.fishCount * 12);
            statusEmbed.addFields({
                name: '🐠 Aquarium Exhibition',
                value: `• **Fish Population:** \` ${aquarium.fishCount} \` exotic fish\n• **Passive Revenue:** 🍒 **${aquarium.fishCount * 12}**/hr\n• **Accrued Cash:** 🍒 **${fishAccrued}**`
            });

            // 4. Farm Animals status
            const farmHours = (Date.now() - farm.lastHarvested) / 1000 / 60 / 60;
            const farmHourly = (farm.chickens * 5) + (farm.cows * 20);
            const farmAccrued = Math.floor(farmHours * farmHourly);
            statusEmbed.addFields({
                name: '🐄 Livestock Range',
                value: `• **Population:** 🐔 \` ${farm.chickens} \` Chickens | 🐄 \` ${farm.cows} \` Cows\n• **Passive Yield:** 🍒 **${farmHourly}**/hr\n• **Accrued Earnings:** 🍒 **${farmAccrued}**`
            });

            // 5. Dino Park status
            const parkHours = (Date.now() - park.lastCollected) / 1000 / 60 / 60;
            const parkHourly = park.dinos * 250;
            const parkAccrued = Math.floor(parkHours * parkHourly);
            const breakoutRisk = Math.max(0, (park.dinos * 8) - (park.securityLevel * 10));
            statusEmbed.addFields({
                name: '🦖 Dinosaur Safari',
                value: `• **Cloned Dinosaurs:** \` ${park.dinos} \` dinosaurs\n• **Fencing Level:** Lvl **${park.securityLevel}**\n• **Breakout Risk:** ⚠️ **${breakoutRisk}%**\n• **Accrued Ticket Sales:** 🍒 **${parkAccrued}**`
            });

            await interaction.editReply({ embeds: [statusEmbed] });
        }

        // --- SUBCOMMAND: CATCH ---
        else if (subcommand === 'catch') {
            const cost = 200;
            if (wallet < cost) {
                return interaction.editReply({ content: `❌ **Insufficient funds!** Launching a Cherry Ball costs 🍒 **${cost}** cherries. (You have: 🍒 **${wallet.toLocaleString()}**)` });
            }

            db.deductCoins(userId, guildId, cost);

            const event = getActiveEvent();

            // Capture roll
            const roll = Math.random();
            let c;
            if (roll < 0.60) {
                // Common
                const commons = WILD_CREATURES.filter(x => x.rarity === 'Common');
                c = commons[Math.floor(Math.random() * commons.length)];
            } else if (roll < 0.90) {
                // Rare
                if (event && Math.random() < 0.5) {
                    c = event.rare;
                } else {
                    const rares = WILD_CREATURES.filter(x => x.rarity === 'Rare');
                    c = rares[Math.floor(Math.random() * rares.length)];
                }
            } else {
                // Legendary
                if (event && Math.random() < 0.5) {
                    c = event.legendary;
                } else {
                    const legends = WILD_CREATURES.filter(x => x.rarity === 'Legendary');
                    c = legends[Math.floor(Math.random() * legends.length)];
                }
            }

            db.catchCreature(userId, c.name, c.rarity);

            const catchEmbed = new EmbedBuilder()
                .setColor(c.rarity === 'Legendary' ? '#F1C40F' : c.rarity === 'Rare' ? '#9B59B6' : '#3498DB')
                .setTitle('🍒 WILD CREATURE CAPTURED')
                .setDescription(
                    `🎯 You successfully captured a wild **${c.name}**!\n\n` +
                    `• **Rarity Type:** **${c.rarity}**\n` +
                    `• **Wallet Balance:** 🍒 **${db.getBalance(userId, guildId).toLocaleString()} cherries**`
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [catchEmbed] });
        }

        // --- SUBCOMMAND: DRAGON ---
        else if (subcommand === 'dragon') {
            const action = interaction.options.getString('action');
            const param = interaction.options.getString('name_or_id');

            if (action === 'hatch') {
                if (!param) {
                    return interaction.editReply({ content: '❌ You must specify a nickname to hatch a new egg! (E.g. `/collection dragon action: hatch name_or_id: Sparky`)' });
                }

                const cost = 15000;
                if (wallet < cost) {
                    return interaction.editReply({ content: `❌ **Insufficient funds!** Hatching a dragon egg costs 🍒 **${cost.toLocaleString()}** cherries. (You have: 🍒 **${wallet.toLocaleString()}**)` });
                }

                const dragons = db.getUserDragons(userId);
                if (dragons.length >= 3) {
                    return interaction.editReply({ content: '❌ Your dragon nest is full! You can own at most **3** dragons simultaneously.' });
                }

                db.buyDragonEgg(userId, param, cost, guildId);

                const hatchEmbed = new EmbedBuilder()
                    .setColor('#9B59B6')
                    .setTitle('🥚 DRAGON EGG NESTED')
                    .setDescription(
                        `🥚 You purchased a rare Dragon Egg and nicknamed it **${param}**!\n` +
                        `• Run **\`/collection status\`** to find its ID.\n` +
                        `• Feed it via **\`/collection dragon action: Feed name_or_id: [ID]\`** to hatch and evolve it!`
                    )
                    .setTimestamp();

                await interaction.editReply({ embeds: [hatchEmbed] });
            }

            else if (action === 'feed') {
                if (!param) {
                    return interaction.editReply({ content: '❌ You must specify the Dragon ID to feed! (E.g. `/collection dragon action: Feed name_or_id: 1`)' });
                }

                const cost = 500;
                if (wallet < cost) {
                    return interaction.editReply({ content: `❌ **Insufficient funds!** Feeding costs 🍒 **500** cherries.` });
                }

                const dragId = parseInt(param);
                const dragons = db.getUserDragons(userId);
                const target = dragons.find(d => d.id === dragId);

                if (!target) {
                    return interaction.editReply({ content: `❌ You do not own a dragon with Nest ID **${param}**!` });
                }

                db.deductCoins(userId, guildId, cost);
                const evolResult = db.feedDragon(dragId);

                const feedEmbed = new EmbedBuilder()
                    .setColor('#fbcfe8')
                    .setTitle('🍖 DRAGON FED')
                    .setDescription(
                        `🍖 You fed **${target.dragonName}** a premium cut of meat!\n\n` +
                        `• **Current Stage:** **${evolResult.stage}**\n` +
                        `• **Total Feedings:** \` ${evolResult.fedCount} \`/15 times\n` +
                        `• **Wallet Balance:** 🍒 **${db.getBalance(userId, guildId).toLocaleString()}**`
                    )
                    .setTimestamp();

                await interaction.editReply({ embeds: [feedEmbed] });
            }
        }

        // --- SUBCOMMAND: AQUARIUM ---
        else if (subcommand === 'aquarium') {
            const action = interaction.options.getString('action');
            const aq = db.getAquarium(userId);

            if (action === 'buy') {
                const cost = 3000;
                if (wallet < cost) {
                    return interaction.editReply({ content: `❌ **Insufficient funds!** Buying an exotic fish costs 🍒 **3,000** cherries.` });
                }

                db.buyFish(userId, cost, guildId);

                const buyEmbed = new EmbedBuilder()
                    .setColor('#c084fc')
                    .setTitle('🐠 EXOTIC FISH ACQUIRED')
                    .setDescription(
                        `🐠 You successfully added an exotic specimen to your aquarium tank!\n` +
                        `Your visitor ticket yields have increased by 🍒 **12**/hr.\n\n` +
                        `• **Total Fish:** \` ${aq.fishCount + 1} \` specimens`
                    )
                    .setTimestamp();

                await interaction.editReply({ embeds: [buyEmbed] });
            }

            else if (action === 'claim') {
                const hours = (Date.now() - aq.lastCollected) / 1000 / 60 / 60;
                const revenue = Math.floor(hours * aq.fishCount * 12);

                if (revenue <= 0) {
                    return interaction.editReply({ content: '⏳ No tickets accrued yet. Aquarium earnings accumulate hourly!' });
                }

                db.collectAquariumRevenue(userId, revenue, Date.now(), guildId);

                const claimEmbed = new EmbedBuilder()
                    .setColor('#fbcfe8')
                    .setTitle('🎟️ AQUARIUM TICKETS CASHED')
                    .setDescription(
                        `🎉 You collected tickets from aquarium visitors!\n\n` +
                        `• **Total Earnings:** 🍒 **+${revenue.toLocaleString()} cherries**\n` +
                        `• **Wallet Balance:** 🍒 **${db.getBalance(userId, guildId).toLocaleString()}**`
                    )
                    .setTimestamp();

                await interaction.editReply({ embeds: [claimEmbed] });
            }
        }

        // --- SUBCOMMAND: FARM ---
        else if (subcommand === 'farm') {
            const action = interaction.options.getString('action');
            const farm = db.getFarmAnimals(userId);

            if (action === 'buy_chicken') {
                const cost = 2000;
                if (wallet < cost) {
                    return interaction.editReply({ content: `❌ **Insufficient funds!** Buying a chicken costs 🍒 **2,000** cherries.` });
                }

                db.buyFarmAnimal(userId, 'chicken', cost, guildId);

                const buyEmbed = new EmbedBuilder()
                    .setColor('#F1C40F')
                    .setTitle('🐔 LIVESTOCK ACQUIRED')
                    .setDescription(
                        `🐔 You added a laying chicken to your farm!\n` +
                        `Passive yield increased by 🍒 **5**/hr.\n\n` +
                        `• **Total Chickens:** \` ${farm.chickens + 1} \``
                    )
                    .setTimestamp();

                await interaction.editReply({ embeds: [buyEmbed] });
            }

            else if (action === 'buy_cow') {
                const cost = 6000;
                if (wallet < cost) {
                    return interaction.editReply({ content: `❌ **Insufficient funds!** Buying a cow costs 🍒 **6,000** cherries.` });
                }

                db.buyFarmAnimal(userId, 'cow', cost, guildId);

                const buyEmbed = new EmbedBuilder()
                    .setColor('#db2777')
                    .setTitle('🐄 LIVESTOCK ACQUIRED')
                    .setDescription(
                        `🐄 You added a dairy cow to your farm!\n` +
                        `Passive yield increased by 🍒 **20**/hr.\n\n` +
                        `• **Total Cows:** \` ${farm.cows + 1} \``
                    )
                    .setTimestamp();

                await interaction.editReply({ embeds: [buyEmbed] });
            }

            else if (action === 'claim') {
                const hours = (Date.now() - farm.lastHarvested) / 1000 / 60 / 60;
                const hourly = (farm.chickens * 5) + (farm.cows * 20);
                const revenue = Math.floor(hours * hourly);

                if (revenue <= 0) {
                    return interaction.editReply({ content: '⏳ No eggs or milk produced yet. Harvests accumulate hourly!' });
                }

                db.harvestFarm(userId, revenue, Date.now(), guildId);

                const claimEmbed = new EmbedBuilder()
                    .setColor('#fbcfe8')
                    .setTitle('🧺 FARM HARVEST COMPLETED')
                    .setDescription(
                        `🧺 You sold eggs and milk produced by your animals!\n\n` +
                        `• **Total Payout:** 🍒 **+${revenue.toLocaleString()} cherries**\n` +
                        `• **Wallet Balance:** 🍒 **${db.getBalance(userId, guildId).toLocaleString()}**`
                    )
                    .setTimestamp();

                await interaction.editReply({ embeds: [claimEmbed] });
            }
        }

        // --- SUBCOMMAND: PARK ---
        else if (subcommand === 'park') {
            const action = interaction.options.getString('action');
            const park = db.getDinoPark(userId);

            if (action === 'clone') {
                const cost = 50000;
                if (wallet < cost) {
                    return interaction.editReply({ content: `❌ **Insufficient funds!** Cloning a dinosaur costs 🍒 **50,000** cherries.` });
                }

                db.cloneDinosaur(userId, cost, guildId);

                const cloneEmbed = new EmbedBuilder()
                    .setColor('#f43f5e')
                    .setTitle('🦖 DINOSAUR CLONED')
                    .setDescription(
                        `🧬 Safety warning! You successfully cloned a dinosaur!\n` +
                        `Your park visitor ticket yields increased by 🍒 **250**/hr.\n\n` +
                        `• **Total Dinosaurs:** \` ${park.dinos + 1} \` specimens\n` +
                        `⚠️ *Warning: Keep your security fence upgraded to prevent escape breakouts!*`
                    )
                    .setTimestamp();

                await interaction.editReply({ embeds: [cloneEmbed] });
            }

            else if (action === 'upgrade') {
                const cost = park.securityLevel * 20000;
                if (wallet < cost) {
                    return interaction.editReply({ content: `❌ **Insufficient funds!** Upgrading safety fences to Level **${park.securityLevel + 1}** costs 🍒 **${cost.toLocaleString()}** cherries.` });
                }

                db.upgradeSecurity(userId, cost, guildId);

                const fenceEmbed = new EmbedBuilder()
                    .setColor('#fbcfe8')
                    .setTitle('🛡️ SECURITY FENCES UPGRADED')
                    .setDescription(
                        `🛡️ Security grid upgraded to Level **${park.securityLevel + 1}**!\n` +
                        `Breakout risk rates successfully decreased.`
                    )
                    .setTimestamp();

                await interaction.editReply({ embeds: [fenceEmbed] });
            }

            else if (action === 'claim') {
                const hours = (Date.now() - park.lastCollected) / 1000 / 60 / 60;
                const hourly = park.dinos * 250;
                const revenue = Math.floor(hours * hourly);

                if (revenue <= 0) {
                    return interaction.editReply({ content: '⏳ No park ticket revenue accrued yet!' });
                }

                // Security Breakout Simulation Risk roll
                const riskPercent = Math.max(0, (park.dinos * 8) - (park.securityLevel * 10));
                if (riskPercent > 0 && Math.random() * 100 < riskPercent) {
                    // Disaster! Breakout resets dinos to 0 and security to 1
                    db.collectParkRevenue(userId, 0, Date.now(), guildId); // Reset timestamp
                    
                    // Direct SQLite updates to reset
                    db.prepare("UPDATE dino_parks SET dinos = 0, securityLevel = 1 WHERE userId = ?").run(userId);

                    const breakoutEmbed = new EmbedBuilder()
                        .setColor('#f43f5e')
                        .setTitle('🚨 SAFARI FENCE SECURITY BREACH!')
                        .setDescription(
                            `🚨 **ALERT!** Safety grids failed! Your cloned dinosaurs escaped from the enclosures and caused a park shutdown!\n\n` +
                            `• **Losses:** All **${park.dinos}** dinosaurs broke out and fled!\n` +
                            `• **Enclosure Security:** Reset back to Level 1.`
                        )
                        .setTimestamp();

                    return await interaction.editReply({ embeds: [breakoutEmbed] });
                }

                // Normal claim
                db.collectParkRevenue(userId, revenue, Date.now(), guildId);

                const claimEmbed = new EmbedBuilder()
                    .setColor('#fbcfe8')
                    .setTitle('🎟️ SAFARI TICKET SALES COLLECTED')
                    .setDescription(
                        `🍒 Safari park tickets successfully gathered from visitors!\n\n` +
                        `• **Earnings:** 🍒 **+${revenue.toLocaleString()} cherries**\n` +
                        `• **Wallet Balance:** 🍒 **${db.getBalance(userId, guildId).toLocaleString()}**`
                    )
                    .setTimestamp();

                await interaction.editReply({ embeds: [claimEmbed] });
            }
        }
    }
};
