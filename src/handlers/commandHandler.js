const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');

function loadCommands(client) {
    client.commands = new Collection();
    const commandDirs = [
        path.join(__dirname, '../../commands'),
        path.join(__dirname, '../commands/slash')
    ];

    let count = 0;

    for (const dir of commandDirs) {
        if (!fs.existsSync(dir)) continue;

        const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
        for (const file of files) {
            const filePath = path.join(dir, file);
            try {
                // Clear require cache for dynamic reloading
                delete require.cache[require.resolve(filePath)];
                const command = require(filePath);
                if (command && 'data' in command && 'execute' in command) {
                    client.commands.set(command.data.name, command);
                    count++;
                }
            } catch (err) {
                console.error(`Failed to load command file ${file}:`, err.message);
            }
        }
    }

    console.log(`✅ Command Handler Loaded ${count} Slash Commands successfully!`);
    return client.commands;
}

module.exports = { loadCommands };
