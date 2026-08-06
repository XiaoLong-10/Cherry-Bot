require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commandsMap = new Map();
const commandDirs = [
    path.join(__dirname, 'commands'),
    path.join(__dirname, 'src/commands/slash')
];

for (const dir of commandDirs) {
    if (!fs.existsSync(dir)) continue;
    const commandFiles = fs.readdirSync(dir).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(dir, file);
        try {
            const command = require(filePath);
            if (command && 'data' in command && 'execute' in command) {
                commandsMap.set(command.data.name, command.data.toJSON());
            }
        } catch (err) {
            console.error(`Failed to load command file ${file}:`, err.message);
        }
    }
}

const commands = Array.from(commandsMap.values());
const appId = process.env.APPLICATION_ID || process.env.CLIENT_ID;
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`🧹 Refreshing Application (/) Commands...`);
        console.log(`📦 Loaded ${commands.length} active slash commands from disk:`);
        console.log(Array.from(commandsMap.keys()).map(name => ` - /${name}`).join('\n'));

        // 1. Sync Global Slash Commands (overwrites and deletes removed commands)
        const globalData = await rest.put(
            Routes.applicationCommands(appId),
            { body: commands }
        );
        console.log(`✅ Successfully updated ${globalData.length} Global Slash Commands! (Deleted commands removed)`);

        // 2. Clear any lingering Guild-specific slash commands if GUILD_ID is defined
        const guildId = process.env.DISCORD_GUILD_ID;
        if (guildId) {
            await rest.put(
                Routes.applicationGuildCommands(appId, guildId),
                { body: [] }
            );
            console.log(`✅ Successfully cleared lingering Guild-specific Slash Commands for Guild: ${guildId}`);
        }
    } catch (error) {
        console.error('❌ Failed to deploy slash commands:', error);
    }
})();