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
        const command = require(filePath);
        if (command && 'data' in command && 'execute' in command) {
            commandsMap.set(command.data.name, command.data.toJSON());
        }
    }
}

const commands = Array.from(commandsMap.values());

// Prepare the REST module
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // Deploying globally (reaches all servers your bot is in within a few seconds)
        const data = await rest.put(
            Routes.applicationCommands(process.env.APPLICATION_ID),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands globally!`);
    } catch (error) {
        console.error(error);
    }
})();