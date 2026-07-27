// Self-healing block for native modules compatibility inside containers
if (process.platform === 'linux') {
    try {
        require('better-sqlite3');
    } catch (e) {
        if (e.code === 'ERR_DLOPEN_FAILED' || e.message.includes('invalid ELF header') || e.message.includes('Could not locate the bindings file')) {
            console.log('⚠️ Native addon load failure detected. Attempting automatic self-healing...');
            const { execSync } = require('child_process');
            try {
                console.log('🧹 Running npm rebuild to compile native modules for Linux...');
                execSync('npm rebuild', { stdio: 'inherit', cwd: __dirname });
                console.log('✅ Rebuild completed successfully. Restarting process...');
                process.exit(0);
            } catch (rebuildErr) {
                console.error('❌ Failed to run npm rebuild. Trying clean reinstall...', rebuildErr);
                try {
                    const fs = require('fs');
                    const path = require('path');
                    const nmPath = path.join(__dirname, 'node_modules');
                    if (fs.existsSync(nmPath)) {
                        console.log('Deleting node_modules...');
                        fs.rmSync(nmPath, { recursive: true, force: true });
                    }
                    console.log('Running npm install...');
                    execSync('npm install', { stdio: 'inherit', cwd: __dirname });
                    console.log('✅ Reinstall completed. Restarting process...');
                    process.exit(0);
                } catch (installErr) {
                    console.error('❌ Automatic recovery failed:', installErr);
                    process.exit(1);
                }
            }
        } else {
            throw e;
        }
    }
}

require('dotenv').config();
const { registerErrorHandlers } = require('./src/utils/errorHandler.js');
registerErrorHandlers();

const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection, EmbedBuilder, MessageFlags } = require('discord.js');
const db = require('./database.js');
const { startServer } = require('./server.js');

// Register Windows Segoe UI Emoji font globally for @napi-rs/canvas and standard canvas
const { GlobalFonts } = require('@napi-rs/canvas');
const emojiFontPaths = [
    'C:\\Windows\\Fonts\\seguiemj.ttf', // Windows
    '/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf', // Linux (Ubuntu/Debian)
    '/usr/share/fonts/NotoColorEmoji.ttf', // Linux (Fedora/CentOS)
    '/usr/share/fonts/google-noto/NotoColorEmoji.ttf', // Linux (Generic Noto)
    '/usr/share/fonts/emoji/NotoColorEmoji.ttf' // Linux (Generic Emoji)
];

let registered = false;
for (const fontPath of emojiFontPaths) {
    if (fs.existsSync(fontPath)) {
        // Register for @napi-rs/canvas
        try {
            GlobalFonts.registerFromPath(fontPath, 'Segoe UI Emoji');
            console.log(`✅ @napi-rs/canvas: Emoji Font registered globally from ${fontPath}`);
            registered = true;
        } catch (e) {
            console.error(`Failed to register emoji font in @napi-rs/canvas from ${fontPath}:`, e);
        }

        // Register for standard canvas
        try {
            const { registerFont } = require('canvas');
            registerFont(fontPath, { family: 'Segoe UI Emoji' });
            console.log(`✅ standard canvas: Emoji Font registered globally from ${fontPath}`);
        } catch (e) {
            // Ignore if standard canvas package is not compiled or fails
        }

        if (registered) break;
    }
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers, // Required for join/leave events
        GatewayIntentBits.MessageContent, // Necessary for reading text messages to award XP
        GatewayIntentBits.GuildEmojisAndStickers, // Required for bot to see custom emojis
        GatewayIntentBits.GuildMessageReactions // Required if bot reads reactions
    ]
});

const { loadCommands } = require('./src/handlers/commandHandler.js');
loadCommands(client);



client.once('clientReady', () => {
    console.log(`🚀 Slash Command Engine Online! Logged in as ${client.user.tag}`);
    startServer(client);

    const { startStatusRotation } = require('./src/systems/statusManager.js');
    startStatusRotation(client);

    // Stock Ticking Engine - Runs every 60 seconds
    setInterval(() => {
        try {
            // Manage Active Events
            const mEvent = db.getMarketEvent();
            let activeMarketEvent = mEvent.eventType;
            let eventTicksRemaining = mEvent.ticksRemaining;

            if (activeMarketEvent) {
                eventTicksRemaining--;
                if (eventTicksRemaining <= 0) {
                    activeMarketEvent = null;
                }
                db.updateMarketEvent(activeMarketEvent, eventTicksRemaining);
            } else {
                // 2% chance to trigger a global event every minute
                if (Math.random() < 0.02) {
                    activeMarketEvent = Math.random() < 0.6 ? 'Bull Run' : 'Crash';
                    eventTicksRemaining = Math.floor(Math.random() * 6) + 5; // Lasts 5 to 10 ticks (minutes)
                    db.updateMarketEvent(activeMarketEvent, eventTicksRemaining);

                    const headline = activeMarketEvent === 'Crash' 
                        ? '🚨 BREAKING: Panic selling sweeps the Cherry Exchange. Markets are down!' 
                        : '🚀 BULL RUN: Heavy retail buying sparks massive stock price surges!';
                    db.addStockNews(headline, 'GLOBAL', activeMarketEvent === 'Crash' ? 'Negative' : 'Positive');

                    // Broadcast alert to text channels in all guilds
                    client.guilds.cache.forEach(guild => {
                        const channel = guild.systemChannel || guild.channels.cache.find(ch => 
                            ch.name.toLowerCase().includes('general') && ch.isTextBased()
                        );
                        if (channel) {
                            const alertEmbed = new EmbedBuilder()
                                .setColor(activeMarketEvent === 'Crash' ? '#E74C3C' : '#2ECC71')
                                .setTitle(activeMarketEvent === 'Crash' ? '📉 STOCK MARKET ALERTIM: CRASH DETECTED!' : '📈 STOCK MARKET ALERTIM: BULL MARKET DETECTED!')
                                .setDescription(
                                    activeMarketEvent === 'Crash'
                                        ? '🚨 **Warning!** Panic selling has hit the exchange. Stock prices are plummeting! *Is this the dip?*'
                                        : '🚀 **Mega Bull Run Inbound!** Buying frenzy detected. Values are skyrocketing across the board!'
                                )
                                .setTimestamp();
                            channel.send({ embeds: [alertEmbed] }).catch(() => null);
                        }
                    });
                }
            }

            // Fetch and update all stock prices
            const stocks = db.getStocks();
            stocks.forEach(stock => {
                let changePct = 0;

                // Volatility mappings based on ticker type
                let volMultiplier = 1.0;
                if (stock.ticker === 'BTC') volMultiplier = 2.5; // High crypto volatility
                if (stock.ticker === 'TSLA') volMultiplier = 1.8;
                if (stock.ticker === 'GOLD') volMultiplier = 0.4; // Gold is very stable

                if (activeMarketEvent === 'Bull Run') {
                    // Bull run increases prices quickly (+2% to +8% per minute)
                    changePct = (Math.random() * 0.06 + 0.02) * volMultiplier;
                } else if (activeMarketEvent === 'Crash') {
                    // Crash drops prices (-12% to -3% per minute)
                    changePct = -(Math.random() * 0.09 + 0.03) * volMultiplier;
                } else {
                    // Normal market random walk (-4% to +4.5%)
                    changePct = (Math.random() * 0.085 - 0.04) * volMultiplier;
                }

                const newPrice = Math.max(1.0, parseFloat((stock.price * (1 + changePct)).toFixed(2)));
                db.updateStockPrice(stock.ticker, newPrice);
            });

            // 8% chance to write normal random news
            if (Math.random() < 0.08 && stocks.length > 0) {
                const randomStock = stocks[Math.floor(Math.random() * stocks.length)];
                const normalHeadlines = [
                    `📊 ${randomStock.companyName} (${randomStock.ticker}) announces quarterly earnings report. Analysts remain optimistic.`,
                    `🔍 Speculation rises about a potential product launch from ${randomStock.companyName} (${randomStock.ticker}).`,
                    `📈 ${randomStock.companyName} shares trade with steady volume in today's quiet session.`,
                    `💼 ${randomStock.companyName} CEO speaks at the annual Cherry Tech Summit.`
                ];
                const randHeadline = normalHeadlines[Math.floor(Math.random() * normalHeadlines.length)];
                db.addStockNews(randHeadline, randomStock.ticker, 'Neutral');
            }

        } catch (err) {
            console.error('Error in Stock Ticker Engine:', err);
        }
    }, 60000);
});

// Main Interactive Event Routing Dashboard
client.on('interactionCreate', async (interaction) => {
    
    // 1. Route Slash Commands
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        // Plugin Enforcement Check
        const { isPluginEnabled } = require('./src/systems/pluginManager.js');
        const pluginMap = {
            'uwu': 'uwu',
            'rp': 'roleplay',
            'autoresponder': 'automod',
            'balance': 'economy', 'shop': 'economy', 'marketplace': 'economy', 'gamble': 'economy',
            'pokdeng': 'economy', 'blackjack': 'economy', 'slots': 'economy', 'roulette': 'economy',
            'klakluk': 'economy', 'scratch': 'economy', 'lottery': 'economy', 'fish': 'economy',
            'mine': 'economy', 'farm': 'economy', 'work': 'economy', 'brew': 'economy', 'cook': 'economy'
        };

        const requiredPlugin = pluginMap[interaction.commandName];
        if (requiredPlugin && interaction.guildId && !isPluginEnabled(interaction.guildId, requiredPlugin)) {
            return await interaction.reply({
                content: `⚠️ The **${requiredPlugin.toUpperCase()}** module is currently disabled in this server. An admin can enable it using \`/plugin enable name:${requiredPlugin}\`.`,
                flags: [MessageFlags.Ephemeral]
            });
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error('Command Execution Error:', error);
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ 
                        content: 'There was an error while executing this command!', 
                        flags: [MessageFlags.Ephemeral] 
                    });
                } else {
                    await interaction.reply({ 
                        content: 'There was an error while executing this command!', 
                        flags: [MessageFlags.Ephemeral] 
                    });
                }
            } catch (innerError) {
                console.error('Failed to dispatch error packet:', innerError.message);
            }
        }
        return;
    }


    // 3. Route Buttons (Roles & Tickets)
    if (interaction.isButton()) {
        if (interaction.customId.startsWith('ticket_')) {
            const { handleTicketButton } = require('./src/systems/tickets/ticketEngine.js');
            return await handleTicketButton(interaction);
        }

        const roleMapping = {
            'role_announcements': 'Announcements',
            'role_gamer': 'Gamer'
        };

        const roleName = roleMapping[interaction.customId];
        if (!roleName) return;

        const role = interaction.guild.roles.cache.find(r => r.name === roleName);
        if (!role) {
            return interaction.reply({
                content: `Error: The role **${roleName}** does not exist in this server settings.`,
                flags: [MessageFlags.Ephemeral]
            });
        }

        const member = interaction.member;

        try {
            if (member.roles.cache.has(role.id)) {
                await member.roles.remove(role);
                await interaction.reply({ content: `Removed the **${roleName}** role.`, flags: [MessageFlags.Ephemeral] });
            } else {
                await member.roles.add(role);
                await interaction.reply({ content: `Granted you the **${roleName}** role!`, flags: [MessageFlags.Ephemeral] });
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: 'Failed to modify your roles. Check role hierarchy order.',
                flags: [MessageFlags.Ephemeral]
            });
        }
    }
});

// Cooldown tracking for passive XP awards
const xpCooldowns = new Set();

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    const userId = message.author.id;
    const guildId = message.guild.id;

    if (!xpCooldowns.has(userId)) {
        const xpEarned = Math.floor(Math.random() * 11) + 15; // 15-25 points
        const result = db.addXp(userId, guildId, xpEarned);
        
        if (result && result.leveledUp) {
            message.reply(`🌸 **GG ${message.author}!** You bloomed and leveled up to **Level ${result.newLevel}**! 🍒`);
        }

        xpCooldowns.add(userId);
        setTimeout(() => xpCooldowns.delete(userId), 60000); // 1-minute window lock
    }

    // Mimu-style Autoresponder Check
    try {
        const match = db.matchAutoresponder(guildId, message.content);
        if (match) {
            let responseText = match.responseText
                .replace(/{user}/g, message.author.toString())
                .replace(/{server}/g, message.guild.name)
                .replace(/{channel}/g, message.channel.toString());

            await message.reply({ content: responseText });
        }
    } catch (autoErr) {
        console.error('Error handling autoresponder trigger:', autoErr.message);
    }
});

// Welcome & Leave Embed Dispatchers
client.on('guildMemberAdd', async (member) => {
    try {
        const welcomeConfig = db.getSetting('welcome', {});
        if (!welcomeConfig.welcomeMsg) return;

        // Auto-assign default membership role if enabled
        if (welcomeConfig.autoRole) {
            const role = member.guild.roles.cache.find(r => r.name === welcomeConfig.autoRole);
            if (role) await member.roles.add(role).catch(() => null);
        }

        const channel = member.guild.systemChannel || member.guild.channels.cache.find(ch => 
            ch.name.toLowerCase().includes('general') && ch.isTextBased()
        );
        if (!channel) return;

        let msg = welcomeConfig.welcomeMsg
            .replace(/{user}/g, member.toString())
            .replace(/{server}/g, member.guild.name);

        const embed = new EmbedBuilder()
            .setColor('#7C3AED')
            .setTitle(`🌸 Welcome to ${member.guild.name}!`)
            .setDescription(msg)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    } catch (err) {
        console.error('Error handling guildMemberAdd:', err.message);
    }
});

client.on('guildMemberRemove', async (member) => {
    try {
        const welcomeConfig = db.getSetting('welcome', {});
        if (!welcomeConfig.leaveMsg) return;

        const channel = member.guild.systemChannel || member.guild.channels.cache.find(ch => 
            ch.name.toLowerCase().includes('general') && ch.isTextBased()
        );
        if (!channel) return;

        let msg = welcomeConfig.leaveMsg
            .replace(/{user}/g, member.user.username)
            .replace(/{server}/g, member.guild.name);

        await channel.send({ content: msg });
    } catch (err) {
        console.error('Error handling guildMemberRemove:', err.message);
    }
});

client.login(process.env.DISCORD_TOKEN);