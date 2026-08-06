const { EmbedBuilder } = require('discord.js');
const db = require('../../database.js');

// High-definition anime GIF fallback collections for instant & reliable rendering
const ROLEPLAY_ACTIONS = {
    hug: {
        name: 'hug',
        emoji: '🤗',
        title: '🤗 Time for a hug! 💕',
        color: '#FF69B4',
        footer: 'Spreading love and warmth! 💕',
        aliases: ['khug', 'hug'],
        formatDesc: (sender, target) => `**${sender}** gives **${target}** a big warm hug!`,
        gifs: [
            'https://cdn.otakugifs.xyz/gifs/hug/bc55980479c9473d.gif',
            'https://cdn.purrbot.site/sfw/hug/gif/hug_088.gif',
            'https://nekos.best/api/v2/hug/40142a6f-83c4-450e-a477-ca7c89787623.gif'
        ]
    },
    kiss: {
        name: 'kiss',
        emoji: '💋',
        title: '💋 Sweet Kiss! 💖',
        color: '#FF1493',
        footer: 'A sweet kiss filled with affection! 💖',
        aliases: ['kkiss', 'kiss'],
        formatDesc: (sender, target) => `**${sender}** plants a sweet kiss on **${target}**!`,
        gifs: [
            'https://cdn.otakugifs.xyz/gifs/kiss/15a312f23dec92ab.gif',
            'https://cdn.purrbot.site/sfw/kiss/gif/kiss_076.gif',
            'https://nekos.best/api/v2/kiss/442e2bc1-ad7d-4685-ab63-61a8c1970916.gif'
        ]
    },
    pat: {
        name: 'pat',
        emoji: '👋',
        title: '👋 Gentle Headpat! ✨',
        color: '#FEE75C',
        footer: 'Pat pat, everything is going to be okay! ✨',
        aliases: ['kpat', 'pat'],
        formatDesc: (sender, target) => `**${sender}** gently pats **${target}** on the head!`,
        gifs: [
            'https://cdn.otakugifs.xyz/gifs/pat/b827c8687dcd59e0.gif',
            'https://cdn.purrbot.site/sfw/pat/gif/pat_009.gif',
            'https://nekos.best/api/v2/pat/b9346ef0-c2f2-41e2-ba5a-926e64820db8.gif'
        ]
    },
    slap: {
        name: 'slap',
        emoji: '💥',
        title: '💥 Ouch! Slapped! 💢',
        color: '#ED4245',
        footer: 'That gotta hurt! 💥',
        aliases: ['kslap', 'slap'],
        formatDesc: (sender, target) => `*Smack!* **${sender}** slaps **${target}** across the face!`,
        gifs: [
            'https://cdn.otakugifs.xyz/gifs/slap/0d82850a623b04f6.gif',
            'https://cdn.purrbot.site/sfw/slap/gif/slap_007.gif',
            'https://nekos.best/api/v2/slap/84633856-f76f-4dcd-bc09-3c0cff429a32.gif'
        ]
    },
    boop: {
        name: 'boop',
        emoji: '👉',
        title: '👉 Cute Nose Boop! 💖',
        color: '#FF9EE2',
        footer: 'Boop! You\'ve been booped! 👉',
        aliases: ['kboop', 'boop'],
        formatDesc: (sender, target) => `*Boop!* **${sender}** reaches out and boops **${target}** right on the nose!`,
        gifs: [
            'https://cdn.otakugifs.xyz/gifs/poke/5817436bbf77458c.gif',
            'https://cdn.purrbot.site/sfw/poke/gif/poke_009.gif'
        ]
    },
    cuddle: {
        name: 'cuddle',
        emoji: '🤗',
        title: '🤗 Warm & Cozy Cuddle! 💕',
        color: '#FF69B4',
        footer: 'Warm and cozy together~ 💕',
        aliases: ['kcuddle', 'cuddle'],
        formatDesc: (sender, target) => `**${sender}** snuggles up and cuddles closely with **${target}**!`,
        gifs: [
            'https://cdn.otakugifs.xyz/gifs/cuddle/88561f7a088650b8.gif',
            'https://cdn.purrbot.site/sfw/cuddle/gif/cuddle_001.gif',
            'https://nekos.best/api/v2/cuddle/e22412d7-ea85-473d-bee7-50ae93ef772e.gif'
        ]
    },
    nuzzle: {
        name: 'nuzzle',
        emoji: '🐱',
        title: '🐱 Affectionate Nuzzle! ✨',
        color: '#FFB6C1',
        footer: 'Purrrr... so sweet! 🐱',
        aliases: ['knuzzle', 'nuzzle'],
        formatDesc: (sender, target) => `**${sender}** nuzzles affectionately against **${target}**!`,
        gifs: [
            'https://cdn.otakugifs.xyz/gifs/nuzzle/f3dd457bfa848ea5.gif'
        ]
    },
    bite: {
        name: 'bite',
        emoji: '🦷',
        title: '🦷 Playful Bite! 💖',
        color: '#E63946',
        footer: 'Nom nom! Watch out! 🦷',
        aliases: ['kbite', 'bite'],
        formatDesc: (sender, target) => `*Nom!* **${sender}** gives **${target}** a cute, playful little bite!`,
        gifs: [
            'https://cdn.otakugifs.xyz/gifs/bite/2b869d0d6cd05a40.gif',
            'https://cdn.purrbot.site/sfw/bite/gif/bite_022.gif',
            'https://nekos.best/api/v2/bite/2b263436-d5d3-433b-bc3c-6ca7ff7840b7.gif'
        ]
    },
    pout: {
        name: 'pout',
        emoji: '🥺',
        title: '🥺 Cute Pout! 💢',
        color: '#FF6B6B',
        footer: 'Aww, don\'t be upset! 🥺',
        aliases: ['kpout', 'pout'],
        formatDesc: (sender, target) => target && target !== sender
            ? `**${sender}** pouts cutely at **${target}**... *"Hmph!"*`
            : `**${sender}** crosses their arms and pouts cutely... *"Hmph!"*`,
        gifs: [
            'https://cdn.otakugifs.xyz/gifs/pout/ee4b1736194dd335.gif',
            'https://cdn.purrbot.site/sfw/pout/gif/pout_008.gif',
            'https://nekos.best/api/v2/pout/eb773e16-3a3d-4183-88ab-3a680928dcfb.gif'
        ]
    },
    blush: {
        name: 'blush',
        emoji: '😳',
        title: '😳 Flustered Blush! 💕',
        color: '#FF477E',
        footer: 'So flustered and cute! 😳',
        aliases: ['kblush', 'blush'],
        formatDesc: (sender) => `**${sender}**'s cheeks turn bright red as they blush furiously! ( >w< )`,
        gifs: [
            'https://cdn.otakugifs.xyz/gifs/blush/1ab8106c45113bc3.gif',
            'https://cdn.purrbot.site/sfw/blush/gif/blush_014.gif',
            'https://nekos.best/api/v2/blush/9c327c6b-1f63-4166-9c31-8e769e135df0.gif'
        ]
    },
    dance: {
        name: 'dance',
        emoji: '🕺',
        title: '🕺 Epic Dance Party! 🎉',
        color: '#9B59B6',
        footer: 'Bust a move! 🕺',
        aliases: ['kdance', 'dance'],
        formatDesc: (sender, target) => target && target !== sender
            ? `**${sender}** dances enthusiastically together with **${target}**!`
            : `**${sender}** breaks into a spectacular, high-energy dance! *Boogie!*`,
        gifs: [
            'https://cdn.otakugifs.xyz/gifs/dance/012d2446f6e061cf.gif',
            'https://cdn.purrbot.site/sfw/dance/gif/dance_005.gif',
            'https://nekos.best/api/v2/dance/5304c19a-dbb5-4a68-a88e-c5f9705ab67e.gif'
        ]
    },
    cry: {
        name: 'cry',
        emoji: '😢',
        title: '😢 Sad Tears! 🌧️',
        color: '#7289DA',
        footer: 'Someone give them a hug! 😢',
        aliases: ['kcry', 'cry'],
        formatDesc: (sender) => `Tears fill **${sender}**'s eyes as they weep in sorrow... *"Sniff..."*`,
        gifs: [
            'https://cdn.otakugifs.xyz/gifs/cry/32d2aea00d2fbf43.gif',
            'https://cdn.purrbot.site/sfw/cry/gif/cry_003.gif',
            'https://nekos.best/api/v2/cry/f74fe9f1-507b-4b79-80dc-285cff5f83f6.gif'
        ]
    },
    laugh: {
        name: 'laugh',
        emoji: '😆',
        title: '😆 Hysterical Laughter! 🤣',
        color: '#F1C40F',
        footer: 'Laughter is the best medicine! 😆',
        aliases: ['klaugh', 'laugh'],
        formatDesc: (sender) => `**${sender}** bursts out laughing! *"Hahaha!"*`,
        gifs: [
            'https://cdn.otakugifs.xyz/gifs/laugh/d698c73d4a95fed5.gif',
            'https://nekos.best/api/v2/laugh/d828851b-3366-40f0-9f57-2f2849aaeaf8.gif'
        ]
    },
    wave: {
        name: 'wave',
        emoji: '👋',
        title: '👋 Friendly Wave! ✨',
        color: '#2ECC71',
        footer: 'Hello there! 👋',
        aliases: ['kwave', 'wave'],
        formatDesc: (sender, target) => target && target !== sender
            ? `**${sender}** waves hello to **${target}**!`
            : `**${sender}** waves hello to everyone in the room!`,
        gifs: [
            'https://cdn.otakugifs.xyz/gifs/wave/d8a72db89663ed79.gif',
            'https://nekos.best/api/v2/wave/6158aaa6-fe8c-4c92-b9fd-a57afb06a51c.gif'
        ]
    },
    bow: {
        name: 'bow',
        emoji: '🙇',
        title: '🙇 Respectful Bow! ✨',
        color: '#99AAB5',
        footer: 'Honor and respect! 🙇',
        aliases: ['kbow', 'bow'],
        formatDesc: (sender, target) => target && target !== sender
            ? `**${sender}** bows respectfully to **${target}**.`
            : `**${sender}** bows deeply and respectfully.`,
        gifs: [
            'https://cdn.otakugifs.xyz/gifs/wave/d8a72db89663ed79.gif'
        ]
    },
    highfive: {
        name: 'highfive',
        emoji: '🙌',
        title: '🙌 Epic High Five! 💥',
        color: '#3498DB',
        footer: 'Teamwork makes the dream work! 🙌',
        aliases: ['khighfive', 'highfive'],
        formatDesc: (sender, target) => `*Clap!* **${sender}** and **${target}** share an epic high-five!`,
        gifs: [
            'https://nekos.best/api/v2/highfive/34128265-2435-4b77-88a5-faef97d93269.gif'
        ]
    },
    cheer: {
        name: 'cheer',
        emoji: '🎉',
        title: '🎉 Loud Cheer! 🌟',
        color: '#E67E22',
        footer: 'Let\'s cheer them on! 🎉',
        aliases: ['kcheer', 'cheer'],
        formatDesc: (sender, target) => target && target !== sender
            ? `**${sender}** cheers loudly for **${target}**! *"Woohoo! Let's go!"*`
            : `**${sender}** cheers loudly with excitement! *"Woohoo!"*`,
        gifs: [
            'https://cdn.otakugifs.xyz/gifs/dance/012d2446f6e061cf.gif'
        ]
    },
    sleep: {
        name: 'sleep',
        emoji: '😴',
        title: '😴 Cozy Sleep! 🌙',
        color: '#2C3E50',
        footer: 'Sweet dreams~ 😴',
        aliases: ['ksleep', 'sleep'],
        formatDesc: (sender) => `**${sender}** curls up on the ground and falls fast asleep. *Zzz...*`,
        gifs: [
            'https://cdn.otakugifs.xyz/gifs/sleep/d354a9f924433de3.gif',
            'https://nekos.best/api/v2/sleep/accdfe72-be61-4f8a-97bc-84cee30b6432.gif'
        ]
    },
    sit: {
        name: 'sit',
        emoji: '🪑',
        title: '🪑 Resting Sit! ☕',
        color: '#708090',
        footer: 'Taking a nice break~ 🪑',
        aliases: ['ksit', 'sit'],
        formatDesc: (sender) => `**${sender}** sits down to rest their weary legs. Ah, comfortable!`,
        gifs: [
            'https://cdn.otakugifs.xyz/gifs/sleep/d354a9f924433de3.gif'
        ]
    },
    wink: {
        name: 'wink',
        emoji: '😉',
        title: '😉 Playful Wink! ✨',
        color: '#FFB800',
        footer: 'Gotcha! 😉',
        aliases: ['kwink', 'wink'],
        formatDesc: (sender, target) => target && target !== sender
            ? `**${sender}** winks playfully at **${target}**!`
            : `**${sender}** winks playfully!`,
        gifs: [
            'https://cdn.otakugifs.xyz/gifs/wink/1c383c21519a03f2.gif',
            'https://nekos.best/api/v2/wink/b09c3c84-aebe-4a39-9a93-4c72e044c178.gif'
        ]
    },
    poke: {
        name: 'poke',
        emoji: '👈',
        title: '👈 Gentle Poke! 👉',
        color: '#1ABC9C',
        footer: 'Hey, pay attention! 👈',
        aliases: ['kpoke', 'poke'],
        formatDesc: (sender, target) => `**${sender}** pokes **${target}** playfully!`,
        gifs: [
            'https://cdn.otakugifs.xyz/gifs/poke/5817436bbf77458c.gif',
            'https://cdn.purrbot.site/sfw/poke/gif/poke_009.gif',
            'https://nekos.best/api/v2/poke/4cab0091-4056-4991-a8c9-c505dee0badc.gif'
        ]
    },
    tickle: {
        name: 'tickle',
        emoji: '🤪',
        title: '🤪 Tickle Attack! 😂',
        color: '#F39C12',
        footer: 'Giggle frenzy! 🤪',
        aliases: ['ktickle', 'tickle'],
        formatDesc: (sender, target) => `**${sender}** tickles **${target}** relentlessly!`,
        gifs: [
            'https://cdn.otakugifs.xyz/gifs/tickle/1bae32ddab85ae84.gif',
            'https://cdn.purrbot.site/sfw/tickle/gif/tickle_014.gif',
            'https://nekos.best/api/v2/tickle/075086e0-af68-4989-a45d-5d9b34e938bc.gif'
        ]
    },
    bonk: {
        name: 'bonk',
        emoji: '🔨',
        title: '🔨 Horny Jail Bonk! 💥',
        color: '#E74C3C',
        footer: 'Go to horny jail! 🔨',
        aliases: ['kbonk', 'bonk'],
        formatDesc: (sender, target) => `*Bonk!* **${sender}** bonks **${target}** on the head!`,
        gifs: [
            'https://nekos.best/api/v2/bonk/e092c7d4-10bf-4eab-939c-4d6ee5889ae8.gif'
        ]
    }
};

// In-memory track pointers for multi-looping non-repetitive GIF rotation
const actionLoopPointers = new Map();

/**
 * Fetch dynamic animated GIF for action with multi-loop rotation & custom DB GIFs
 */
async function getRoleplayGif(actionKey) {
    const config = ROLEPLAY_ACTIONS[actionKey];
    const defaultGif = 'https://cdn.otakugifs.xyz/gifs/hug/bc55980479c9473d.gif';
    if (!config) return defaultGif;

    let availableGifs = [...config.gifs];

    // Fetch user-added custom GIFs from database if present
    try {
        if (db && typeof db.getCustomRoleplayGifs === 'function') {
            const customDbGifs = db.getCustomRoleplayGifs(actionKey);
            if (customDbGifs && customDbGifs.length > 0) {
                const customUrls = customDbGifs.map(g => g.gifUrl);
                availableGifs = [...customUrls, ...availableGifs];
            }
        }
    } catch (e) {
        console.error('Error querying custom GIFs from DB:', e.message);
    }

    // 1. Fetch from nekos.best API (requires DiscordBot User-Agent header)
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200);

        const apiEndpoint = `https://nekos.best/api/v2/${actionKey}`;
        const res = await fetch(apiEndpoint, { 
            signal: controller.signal,
            headers: { 'User-Agent': 'DiscordBot (https://github.com/discord.js, 14.0.0)' }
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            if (data?.results?.[0]?.url) {
                availableGifs.unshift(data.results[0].url);
            }
        }
    } catch (e) {
        // Fallback gracefully
    }

    // 2. Fetch from otakugifs API
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200);

        const apiEndpoint = `https://api.otakugifs.xyz/gif?reaction=${actionKey}`;
        const res = await fetch(apiEndpoint, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            if (data?.url) {
                availableGifs.unshift(data.url);
            }
        }
    } catch (e) {
        // Fallback gracefully
    }

    // Filter out any broken or empty URLs
    availableGifs = availableGifs.filter(url => url && typeof url === 'string' && url.startsWith('http'));

    if (availableGifs.length === 0) return defaultGif;

    // Multi-Loop Rotation Engine: Cycle smoothly through GIF pool
    let currentIdx = actionLoopPointers.get(actionKey) ?? -1;
    let nextIdx = (currentIdx + 1) % availableGifs.length;
    actionLoopPointers.set(actionKey, nextIdx);

    return availableGifs[nextIdx];
}

/**
 * Build Discord Embed matching exact design from screenshot
 */
async function buildRoleplayEmbed(actionKey, senderUser, targetUser = null) {
    const config = ROLEPLAY_ACTIONS[actionKey];
    if (!config) return null;

    const senderDisplayName = senderUser.displayName || senderUser.globalName || senderUser.username;
    const targetDisplayName = targetUser ? (targetUser.displayName || targetUser.globalName || targetUser.username) : senderDisplayName;

    const descriptionText = config.formatDesc(senderDisplayName, targetDisplayName);
    const gifUrl = await getRoleplayGif(actionKey);

    const embed = new EmbedBuilder()
        .setColor(config.color)
        .setTitle(config.title)
        .setDescription(descriptionText)
        .setImage(gifUrl)
        .setFooter({ text: config.footer })
        .setTimestamp();

    return embed;
}

/**
 * Prefix handler for message commands:
 * - Roleplay: `khug @User`, `kkiss @User`, etc.
 * - Manage Custom GIFs: `kaddgif <action> <url>`, `klistgif [action]`, `kremovegif <id>`
 */
async function handleRoleplayPrefixMessage(message) {
    if (!message.content) return false;

    const content = message.content.trim();
    const parts = content.split(/\s+/);
    const commandName = parts[0].toLowerCase(); // e.g. "khug", "kaddgif"

    // 1. Management Prefix: kaddgif <action> <url>
    if (['kaddgif', 'addgif', 'kaddg'].includes(commandName)) {
        if (parts.length < 3) {
            await message.reply('⚠️ **Usage:** `kaddgif <action> <gif_url>`\n*Example:* `kaddgif hug https://media.giphy.com/media/.../giphy.gif`');
            return true;
        }

        const rawAction = parts[1].toLowerCase().replace(/^k/, '');
        const gifUrl = parts[2].trim();

        if (!ROLEPLAY_ACTIONS[rawAction]) {
            const validList = Object.keys(ROLEPLAY_ACTIONS).join(', ');
            await message.reply(`⚠️ **Invalid Action!** Choose from: \`${validList}\``);
            return true;
        }

        if (!gifUrl.startsWith('http://') && !gifUrl.startsWith('https://')) {
            await message.reply('⚠️ **Invalid URL!** Please provide a valid HTTP/HTTPS image or GIF URL.');
            return true;
        }

        try {
            db.addCustomRoleplayGif(rawAction, gifUrl, message.author.username);
            const actionEmoji = ROLEPLAY_ACTIONS[rawAction].emoji || '✨';
            const embed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setTitle(`${actionEmoji} Custom Animated GIF Added!`)
                .setDescription(`Successfully added a new animated GIF for action **${rawAction.toUpperCase()}**!\nIt will now multi-loop in commands like \`k${rawAction}\`!`)
                .setImage(gifUrl)
                .setTimestamp();
            await message.reply({ embeds: [embed] });
        } catch (err) {
            console.error('Error adding custom GIF:', err);
            await message.reply('❌ Failed to save custom GIF to database.');
        }
        return true;
    }

    // 2. Management Prefix: klistgif / klistgifs [action]
    if (['klistgif', 'klistgifs', 'listgifs'].includes(commandName)) {
        const filterAction = parts[1] ? parts[1].toLowerCase().replace(/^k/, '') : null;
        let gifs = filterAction ? db.getCustomRoleplayGifs(filterAction) : db.getAllCustomRoleplayGifs();

        if (!gifs || gifs.length === 0) {
            await message.reply(filterAction ? `ℹ️ No custom GIFs found for **${filterAction}**.` : 'ℹ️ No custom GIFs added yet. Add one with `kaddgif <action> <url>`!');
            return true;
        }

        const lines = gifs.slice(0, 15).map(g => `**[ID ${g.id}]** \`${g.actionKey}\` added by ${g.addedBy}: ${g.gifUrl}`);
        const embed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle('🖼️ Custom Animated GIFs Multi-Loop Library')
            .setDescription(lines.join('\n') + (gifs.length > 15 ? `\n*...and ${gifs.length - 15} more*` : ''))
            .setFooter({ text: 'Use kremovegif <id> to remove a custom GIF.' })
            .setTimestamp();

        await message.reply({ embeds: [embed] });
        return true;
    }

    // 3. Management Prefix: kremovegif / kdelgif <id>
    if (['kremovegif', 'kdelgif', 'delgif'].includes(commandName)) {
        const targetId = parseInt(parts[1], 10);
        if (isNaN(targetId)) {
            await message.reply('⚠️ **Usage:** `kremovegif <id>` (e.g. `kremovegif 2`)');
            return true;
        }

        const removed = db.removeCustomRoleplayGif(targetId);
        if (removed) {
            await message.reply(`✅ Successfully removed custom GIF **ID ${targetId}** from the multi-loop pool!`);
        } else {
            await message.reply(`⚠️ No custom GIF found with **ID ${targetId}**.`);
        }
        return true;
    }

    // 4. Roleplay Execution Prefix (khug, kkiss, etc.)
    let matchedActionKey = null;
    for (const [key, config] of Object.entries(ROLEPLAY_ACTIONS)) {
        if (config.aliases.includes(commandName) || commandName === `k${key}`) {
            matchedActionKey = key;
            break;
        }
    }

    if (!matchedActionKey) return false;

    // Resolve target user
    let targetUser = message.mentions.users.first();
    
    // If no mention, try resolving by user ID or username in command text if present
    if (!targetUser && parts.length > 1) {
        const potentialTarget = parts.slice(1).join(' ').replace(/[<@!>]/g, '');
        if (message.guild) {
            const member = message.guild.members.cache.find(m => 
                m.id === potentialTarget || 
                m.user.username.toLowerCase() === potentialTarget.toLowerCase() ||
                m.displayName.toLowerCase() === potentialTarget.toLowerCase()
            );
            if (member) targetUser = member.user;
        }
    }

    // Default target: if no target mentioned, default to sender (e.g. self hug/action like in user screenshot)
    if (!targetUser) {
        targetUser = message.author;
    }

    try {
        const embed = await buildRoleplayEmbed(matchedActionKey, message.author, targetUser);
        if (embed) {
            await message.reply({ embeds: [embed] });
            return true;
        }
    } catch (err) {
        console.error('Error sending roleplay prefix reply:', err);
    }

    return false;
}

module.exports = {
    ROLEPLAY_ACTIONS,
    buildRoleplayEmbed,
    getRoleplayGif,
    handleRoleplayPrefixMessage
};
