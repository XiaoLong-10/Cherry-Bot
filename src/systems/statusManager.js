const { ActivityType } = require('discord.js');

function startStatusRotation(client) {
    if (!client || !client.user) return;

    let index = 0;

    setInterval(() => {
        const totalGuilds = client.guilds.cache.size;
        const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + (guild.memberCount || 0), 0);

        const activities = [
            { name: `/help | Cherry Bot 3.0 🌸`, type: ActivityType.Playing },
            { name: `${totalUsers.toLocaleString()} members across ${totalGuilds} servers 🌐`, type: ActivityType.Watching },
            { name: `/realm & /bank | Shared Tycoon 🏰`, type: ActivityType.Listening },
            { name: `/casino plinko & crash 🎰`, type: ActivityType.Competing },
            { name: `/ai chat & /language 🇰🇭`, type: ActivityType.Listening }
        ];

        const current = activities[index % activities.length];
        client.user.setActivity(current.name, { type: current.type });
        index++;
    }, 15000); // Rotate every 15 seconds
}

module.exports = { startStatusRotation };
