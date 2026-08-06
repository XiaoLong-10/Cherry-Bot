const { EmbedBuilder, MessageFlags } = require('discord.js');
const db = require('../../database.js');
const { isPluginEnabled } = require('./pluginManager.js');

// Map of plugin requirements for command enforcement
const PLUGIN_MAP = {
    'uwu': 'uwu',
    'rp': 'roleplay',
    'autoresponder': 'automod',
    'ticket': 'tickets',
    'ai': 'ai',
    'balance': 'economy', 'shop': 'economy', 'marketplace': 'economy', 'gamble': 'economy',
    'pokdeng': 'economy', 'blackjack': 'economy', 'slots': 'economy', 'roulette': 'economy',
    'klakluk': 'economy', 'scratch': 'economy', 'lottery': 'economy', 'fish': 'economy',
    'mine': 'economy', 'farm': 'economy', 'work': 'economy', 'brew': 'economy', 'cook': 'economy',
    'daily': 'economy', 'streak': 'economy', 'stock': 'economy', 'business': 'economy',
    'realestate': 'economy', 'delivery': 'economy', 'ledger': 'economy', 'currency': 'economy',
    'wheel': 'economy', 'duel': 'economy', 'hunt': 'economy', 'smelt': 'economy',
    'forge': 'economy', 'woodcut': 'economy', 'bank': 'economy', 'casino': 'economy',
    'addcoin': 'economy', 'removecoin': 'economy', 'market': 'economy', 'housing': 'economy', 'house': 'economy'
};

// Aliases mapping text triggers to slash command names or direct handlers
const ALIAS_MAP = {
    'bal': 'balance', 'kbal': 'balance', 'ubal': 'balance', 'cash': 'balance', 'kbalance': 'balance', 'ubalance': 'balance',
    'daily': 'daily', 'kdaily': 'daily', 'udaily': 'daily', 'kclaim': 'daily', 'claim': 'daily',
    'work': 'work', 'kwork': 'work', 'uwork': 'work', 'w': 'work',
    'hunt': 'hunt', 'khunt': 'hunt', 'uhunt': 'hunt', 'h': 'hunt',
    'fish': 'fish', 'kfish': 'fish', 'ufish': 'fish', 'f': 'fish',
    'ping': 'ping', 'kping': 'ping', 'uping': 'ping',
    'shop': 'shop', 'kshop': 'shop', 'ushop': 'shop',
    'pet': 'pet', 'kpet': 'pet', 'upet': 'pet',
    'profile': 'profile', 'kprofile': 'profile', 'uprofile': 'profile', 'p': 'profile',
    'rank': 'rank', 'krank': 'rank', 'urank': 'rank', 'level': 'rank',
    'leaderboard': 'leaderboard', 'kleaderboard': 'leaderboard', 'uleaderboard': 'leaderboard', 'lb': 'leaderboard', 'top': 'leaderboard',
    'slots': 'slots', 'kslots': 'slots', 'uslots': 'slots', 'slot': 'slots', 'kslot': 'slots',
    'blackjack': 'blackjack', 'kblackjack': 'blackjack', 'ublackjack': 'blackjack', 'bj': 'blackjack', 'kbj': 'blackjack',
    'pokdeng': 'pokdeng', 'kpokdeng': 'pokdeng', 'upokdeng': 'pokdeng', 'pok': 'pokdeng', 'kpok': 'pokdeng',
    'roulette': 'roulette', 'kroulette': 'roulette', 'uroulette': 'roulette',
    'klakluk': 'klakluk', 'kklakluk': 'klakluk', 'uklakluk': 'klakluk', 'klahklok': 'klakluk', 'kklahklok': 'klakluk',
    'scratch': 'scratch', 'kscratch': 'scratch', 'uscratch': 'scratch',
    'wheel': 'wheel', 'kwheel': 'wheel', 'uwheel': 'wheel',
    'gamble': 'gamble', 'kgamble': 'gamble', 'ugamble': 'gamble', 'coinflip': 'gamble', 'cf': 'gamble',
    'marry': 'marry', 'kmarry': 'marry', 'umarry': 'marry',
    'marriage': 'marriage', 'kmarriage': 'marriage', 'umarriage': 'marriage',
    'trade': 'trade', 'ktrade': 'trade', 'utrade': 'trade',
    'clear': 'clear', 'kclear': 'clear', 'uclear': 'clear', 'purge': 'clear',
    'embed': 'embed', 'kembed': 'embed', 'uembed': 'embed',
    'open': 'open', 'kopen': 'open', 'uopen': 'open',
    'giveaway': 'giveaway', 'kgiveaway': 'giveaway', 'ugiveaway': 'giveaway',
    'autoresponder': 'autoresponder', 'kautoresponder': 'autoresponder', 'uautoresponder': 'autoresponder', 'ar': 'autoresponder',
    'currency': 'currency', 'kcurrency': 'currency', 'ucurrency': 'currency',
    'admin': 'admin', 'kadmin': 'admin', 'uadmin': 'admin',
    'rp': 'rp', 'krp': 'rp', 'urp': 'rp',
    'uwu': 'uwu', 'kuwu': 'uwu', 'uuwu': 'uwu',
    'utility': 'utility', 'kutility': 'utility', 'uutility': 'utility',
    'serverevents': 'serverevents', 'kserverevents': 'serverevents', 'userverevents': 'serverevents',
    'help': 'help', 'khelp': 'help', 'uhelp': 'help',
    'lottery': 'lottery', 'klottery': 'lottery',
    'mine': 'mine', 'kmine': 'mine',
    'farm': 'farm', 'kfarm': 'farm',
    'cook': 'cook', 'kcook': 'cook',
    'brew': 'brew', 'kbrew': 'brew',
    'forge': 'forge', 'kforge': 'forge',
    'smelt': 'smelt', 'ksmelt': 'smelt',
    'woodcut': 'woodcut', 'kwoodcut': 'woodcut',
    'duel': 'duel', 'kduel': 'duel',
    'business': 'business', 'kbusiness': 'business',
    'realestate': 'realestate', 'krealestate': 'realestate',
    'house': 'house', 'khouse': 'house',
    'delivery': 'delivery', 'kdelivery': 'delivery',
    'ledger': 'ledger', 'kledger': 'ledger',
    'streak': 'streak', 'kstreak': 'streak',
    'quest': 'quest', 'kquest': 'quest',
    'raid': 'raid', 'kraid': 'raid',
    'collection': 'collection', 'kcollection': 'collection',
    'character': 'character', 'kcharacter': 'character',
    'enhance': 'enhance', 'kenhance': 'enhance',
    'guild': 'guild', 'kguild': 'guild',
    'addcoin': 'addcoin', 'kaddcoin': 'addcoin',
    'removecoin': 'removecoin', 'kremovecoin': 'removecoin',
    'stock': 'stock', 'kstock': 'stock',
    '247': '247', 'k247': '247', 'u247': '247',
    'standby': '247', 'kstandby': '247', 'ustandby': '247',
    'join': '247', 'kjoin': '247', 'ujoin': '247',
    'leave': '247', 'kleave': '247', 'uleave': '247',
    'dc': '247', 'kdc': '247', 'udc': '247',
    'play': 'music', 'kplay': 'music', 'uplay': 'music', 'p': 'music', 'kp': 'music', 'up': 'music',
    'skip': 'music', 'kskip': 'music', 'uskip': 'music', 's': 'music', 'ks': 'music',
    'stop': 'music', 'kstop': 'music', 'ustop': 'music',
    'pause': 'music', 'kpause': 'music', 'upause': 'music',
    'resume': 'music', 'kresume': 'music', 'uresume': 'music',
    'queue': 'music', 'kqueue': 'music', 'uqueue': 'music', 'kq': 'music', 'q': 'music',
    'nowplaying': 'music', 'knowplaying': 'music', 'unowplaying': 'music', 'np': 'music', 'knp': 'music',
    'volume': 'music', 'kvolume': 'music', 'uvolume': 'music', 'vol': 'music', 'kvol': 'music',
    'loop': 'music', 'kloop': 'music', 'uloop': 'music',
    'shuffle': 'music', 'kshuffle': 'music', 'ushuffle': 'music',
    'seek': 'music', 'kseek': 'music', 'useek': 'music',
    'remove': 'music', 'kremove': 'music', 'uremove': 'music',
    'clear': 'music', 'kclear': 'music', 'clearqueue': 'music', 'kclearqueue': 'music', 'kcq': 'music',
    'autoplay': 'music', 'kautoplay': 'music', 'kauto': 'music',
    'lyrics': 'music', 'klyrics': 'music', 'ulyrics': 'music'
};

function createPrefixInteraction(message, command, args = [], rawCmd = '') {
    let deferred = false;
    let replied = false;
    let replyMessage = null;

    const optionsMap = new Map();
    const rawData = command.data ? (typeof command.data.toJSON === 'function' ? command.data.toJSON() : command.data) : {};
    const commandOptions = rawData.options || [];

    let subcommandName = null;
    let subcommandGroup = null;
    let remainingArgs = [...args];

    // Detect Subcommand if defined
    if (commandOptions.length > 0) {
        const subOpt = commandOptions.find(opt => opt.type === 1 || opt.type === 2);
        if (subOpt) {
            if (remainingArgs.length > 0) {
                const possibleSub = remainingArgs[0].toLowerCase();
                const matchingSub = commandOptions.find(opt => opt.name.toLowerCase() === possibleSub);
                if (matchingSub) {
                    subcommandName = matchingSub.name;
                    remainingArgs.shift();
                }
            }

            // Fallback for voice standby aliases (e.g. kjoin -> on, kleave / kdc -> off, k247 -> on)
            if (!subcommandName && rawData.name === '247') {
                const lowerRaw = rawCmd.toLowerCase();
                if (['leave', 'kleave', 'uleave', 'dc', 'kdc', 'udc', 'off'].some(k => lowerRaw.endsWith(k))) {
                    subcommandName = 'off';
                } else {
                    subcommandName = 'on';
                }
            }

            // Fallback for music aliases (e.g. kplay -> play, kskip -> skip, kqueue -> queue, knp -> nowplaying, etc.)
            if (!subcommandName && rawData.name === 'music') {
                const lowerRaw = rawCmd.toLowerCase();
                if (['play', 'kplay', 'uplay', 'p', 'kp', 'up'].includes(lowerRaw)) subcommandName = 'play';
                else if (['skip', 'kskip', 'uskip', 's', 'ks'].includes(lowerRaw)) subcommandName = 'skip';
                else if (['stop', 'kstop', 'ustop'].includes(lowerRaw)) subcommandName = 'stop';
                else if (['pause', 'kpause', 'upause'].includes(lowerRaw)) subcommandName = 'pause';
                else if (['resume', 'kresume', 'uresume'].includes(lowerRaw)) subcommandName = 'resume';
                else if (['queue', 'kqueue', 'uqueue', 'kq', 'q'].includes(lowerRaw)) subcommandName = 'queue';
                else if (['nowplaying', 'knowplaying', 'unowplaying', 'np', 'knp'].includes(lowerRaw)) subcommandName = 'nowplaying';
                else if (['volume', 'kvolume', 'uvolume', 'vol', 'kvol'].includes(lowerRaw)) subcommandName = 'volume';
                else if (['loop', 'kloop', 'uloop'].includes(lowerRaw)) subcommandName = 'loop';
                else if (['shuffle', 'kshuffle', 'ushuffle'].includes(lowerRaw)) subcommandName = 'shuffle';
                else if (['seek', 'kseek', 'useek'].includes(lowerRaw)) subcommandName = 'seek';
                else if (['remove', 'kremove', 'uremove'].includes(lowerRaw)) subcommandName = 'remove';
                else if (['clear', 'kclear', 'clearqueue', 'kclearqueue', 'kcq'].includes(lowerRaw)) subcommandName = 'clear';
                else if (['autoplay', 'kautoplay', 'kauto'].includes(lowerRaw)) subcommandName = 'autoplay';
                else if (['lyrics', 'klyrics', 'ulyrics'].includes(lowerRaw)) subcommandName = 'lyrics';
                else subcommandName = 'play';
            }
        }
    }

    // Resolve subcommand options schema if active
    let targetOptions = commandOptions;
    if (subcommandName && commandOptions.length > 0) {
        const matchingSub = commandOptions.find(opt => opt.name && opt.name.toLowerCase() === subcommandName.toLowerCase());
        if (matchingSub && matchingSub.options) {
            targetOptions = matchingSub.options;
        }
    }

    const validOptNames = targetOptions.map(o => o.name ? o.name.toLowerCase() : '').filter(Boolean);

    // Process named arguments (e.g. amount:100) vs positional arguments (e.g. URLs or song titles)
    const positionalArgs = [];
    for (const arg of remainingArgs) {
        if (arg.toLowerCase().startsWith('http://') || arg.toLowerCase().startsWith('https://')) {
            positionalArgs.push(arg);
            continue;
        }

        const colonIdx = arg.indexOf(':');
        const eqIdx = arg.indexOf('=');
        const splitIdx = colonIdx !== -1 ? colonIdx : eqIdx;
        if (splitIdx > 0) {
            const key = arg.slice(0, splitIdx).toLowerCase();
            const val = arg.slice(splitIdx + 1);
            if (validOptNames.includes(key)) {
                optionsMap.set(key, val);
                continue;
            }
        }
        positionalArgs.push(arg);
    }

    // Map positional arguments to defined option schema order
    let posIdx = 0;
    for (const optDef of targetOptions) {
        if (optDef.type === 1 || optDef.type === 2) continue;
        const optName = optDef.name.toLowerCase();
        if (!optionsMap.has(optName) && posIdx < positionalArgs.length) {
            optionsMap.set(optName, positionalArgs[posIdx]);
            posIdx++;
        }
    }

    const getOptionValue = (name) => {
        if (!name) return null;
        const val = optionsMap.get(name.toLowerCase());
        return (val !== undefined && val !== null) ? val : null;
    };

    const optionsObj = {
        getSubcommand: (required = true) => subcommandName,
        getSubcommandGroup: (required = true) => subcommandGroup,

        getString: (name, required = false) => {
            const val = getOptionValue(name);
            if (val !== null) return val;
            if (positionalArgs.length > 0) return positionalArgs.join(' ');
            return null;
        },

        getInteger: (name, required = false) => {
            const val = getOptionValue(name);
            if (val !== null) {
                const parsed = parseInt(val, 10);
                if (!isNaN(parsed)) return parsed;
            }
            for (const p of positionalArgs) {
                const pInt = parseInt(p, 10);
                if (!isNaN(pInt)) return pInt;
            }
            return null;
        },

        getNumber: (name, required = false) => {
            const val = getOptionValue(name);
            if (val !== null) {
                const parsed = parseFloat(val);
                if (!isNaN(parsed)) return parsed;
            }
            for (const p of positionalArgs) {
                const pNum = parseFloat(p);
                if (!isNaN(pNum)) return pNum;
            }
            return null;
        },

        getBoolean: (name, required = false) => {
            const val = getOptionValue(name);
            if (val !== null) {
                return ['true', 'yes', '1', 'on'].includes(val.toLowerCase());
            }
            for (const p of positionalArgs) {
                if (['true', 'yes', '1', 'on'].includes(p.toLowerCase())) return true;
                if (['false', 'no', '0', 'off'].includes(p.toLowerCase())) return false;
            }
            return null;
        },

        getUser: (name, required = false) => {
            if (message.mentions && message.mentions.users.size > 0) {
                return message.mentions.users.first();
            }
            const val = getOptionValue(name);
            if (val && message.client.users.cache.has(val)) {
                return message.client.users.cache.get(val);
            }
            return null;
        },

        getMember: (name, required = false) => {
            if (message.mentions && message.mentions.members && message.mentions.members.size > 0) {
                return message.mentions.members.first();
            }
            if (message.guild) {
                const user = optionsObj.getUser(name, required);
                if (user) return message.guild.members.cache.get(user.id) || null;
            }
            return null;
        },

        getChannel: (name, required = false) => {
            if (message.mentions && message.mentions.channels && message.mentions.channels.size > 0) {
                return message.mentions.channels.first();
            }
            return null;
        },

        getRole: (name, required = false) => {
            if (message.mentions && message.mentions.roles && message.mentions.roles.size > 0) {
                return message.mentions.roles.first();
            }
            return null;
        },

        getAttachment: (name, required = false) => {
            if (message.attachments && message.attachments.size > 0) {
                return message.attachments.first();
            }
            return null;
        },

        get: (name) => {
            const val = getOptionValue(name);
            if (val === null) return null;
            return { value: val, name };
        }
    };

    function formatPayload(payload) {
        if (typeof payload === 'string') {
            return { content: payload };
        }
        if (payload && typeof payload === 'object') {
            const copy = { ...payload };
            delete copy.flags;
            delete copy.ephemeral;
            return copy;
        }
        return { content: String(payload) };
    }

    return {
        id: message.id,
        commandName: rawData.name || command.name,
        user: message.author,
        member: message.member,
        guild: message.guild,
        guildId: message.guild ? message.guild.id : null,
        channel: message.channel,
        channelId: message.channel ? message.channel.id : null,
        client: message.client,
        createdTimestamp: message.createdTimestamp,
        isChatInputCommand: () => true,
        isButton: () => false,
        isStringSelectMenu: () => false,
        isSelectMenu: () => false,
        isContextMenuCommand: () => false,
        isAutocomplete: () => false,
        get replied() { return replied; },
        get deferred() { return deferred; },

        options: optionsObj,

        async deferReply(options = {}) {
            deferred = true;
            if (message.channel && message.channel.sendTyping) {
                await message.channel.sendTyping().catch(() => null);
            }
            return true;
        },

        async reply(options) {
            if (replied || deferred) {
                return await this.editReply(options);
            }
            replied = true;
            let payload = formatPayload(options);
            replyMessage = await message.reply(payload).catch(err => {
                return message.channel.send(payload);
            });
            return replyMessage;
        },

        async editReply(options) {
            replied = true;
            let payload = formatPayload(options);
            if (replyMessage) {
                try {
                    return await replyMessage.edit(payload);
                } catch (e) {
                    replyMessage = await message.reply(payload).catch(err => message.channel.send(payload));
                    return replyMessage;
                }
            } else {
                replyMessage = await message.reply(payload).catch(err => {
                    return message.channel.send(payload);
                });
                return replyMessage;
            }
        },

        async followUp(options) {
            let payload = formatPayload(options);
            return await message.channel.send(payload);
        },

        async deleteReply() {
            if (replyMessage && replyMessage.deletable) {
                await replyMessage.delete().catch(() => null);
            }
        }
    };
}

async function handleUwUTextPrefix(message) {
    if (!message.content || message.author.bot || !message.guild) return false;

    const content = message.content.trim();
    let rawPrefix = null;
    let rest = '';

    // Prefix detection (k!, u!, k , u , k, u)
    if (content.toLowerCase().startsWith('k!')) {
        rawPrefix = 'k!';
        rest = content.slice(2).trim();
    } else if (content.toLowerCase().startsWith('u!')) {
        rawPrefix = 'u!';
        rest = content.slice(2).trim();
    } else if (content.toLowerCase().startsWith('k ')) {
        rawPrefix = 'k ';
        rest = content.slice(2).trim();
    } else if (content.toLowerCase().startsWith('u ')) {
        rawPrefix = 'u ';
        rest = content.slice(2).trim();
    } else if (content.toLowerCase().startsWith('k')) {
        rawPrefix = 'k';
        rest = content.slice(1).trim();
    } else if (content.toLowerCase().startsWith('u')) {
        rawPrefix = 'u';
        rest = content.slice(1).trim();
    } else {
        // Fallback for standalone aliases without prefix: bal, daily, work, hunt, ship, fortune, avatar, userinfo, serverinfo, bj, slots, etc.
        rest = content;
    }

    if (!rest) return false;

    const tokens = rest.split(/\s+/);
    const rawCmd = tokens[0].toLowerCase();
    const args = tokens.slice(1);

    // Resolve command name via ALIAS_MAP or client commands collection
    let resolvedCmdName = ALIAS_MAP[rawCmd] || ALIAS_MAP[rawPrefix ? (rawPrefix.trim() + rawCmd) : rawCmd];

    if (!resolvedCmdName && message.client.commands) {
        if (message.client.commands.has(rawCmd)) {
            resolvedCmdName = rawCmd;
        } else if (rawPrefix && rawPrefix.toLowerCase().startsWith('k')) {
            // Check if stripped prefix matches command name
            if (message.client.commands.has(rawCmd)) {
                resolvedCmdName = rawCmd;
            }
        }
    }

    // Special direct text fast handlers:
    const userId = message.author.id;
    const guildId = message.guild.id;

    // kship, uship, ship
    if (['ship', 'kship', 'uship'].includes(rawCmd) || resolvedCmdName === 'ship') {
        const targetUser = message.mentions.users.first();
        if (!targetUser) {
            await message.reply('⚠️ Please mention another user to ship with! (Example: `kship @User`)');
            return true;
        }
        const user1 = message.author;
        const user2 = targetUser;
        const idSum = BigInt(user1.id) + BigInt(user2.id);
        const percentage = Number(idSum % 101n);

        let statusTitle = 'Soulmates ✨';
        if (percentage < 20) statusTitle = 'Total Disaster 💔';
        else if (percentage < 40) statusTitle = 'Awkward Friends 😳';
        else if (percentage < 60) statusTitle = 'Cute Crush 🌸';
        else if (percentage < 85) statusTitle = 'Lovebirds 💖';

        const u1Name = user1.username;
        const u2Name = user2.username;
        const shipName = u1Name.slice(0, Math.ceil(u1Name.length / 2)) + u2Name.slice(Math.floor(u2Name.length / 2));

        const embed = new EmbedBuilder()
            .setColor('#EC4899')
            .setTitle(`💖 UwU Love Match: ${user1.username} x ${user2.username}`)
            .setDescription(`**Ship Name:** \`${shipName}\`\n**Compatibility:** **${percentage}%**\n**Status:** ${statusTitle}`)
            .setTimestamp();

        await message.reply({ embeds: [embed] });
        return true;
    }

    // kfortune, ufortune, fortune, omikuji
    if (['fortune', 'kfortune', 'ufortune', 'omikuji'].includes(rawCmd)) {
        const fortunes = [
            { title: '大吉 — Great Blessing ✨', reward: 300, color: 'Sakura Pink 🌸' },
            { title: '中吉 — Middle Blessing 💖', reward: 200, color: 'Pastel Blue 🫐' },
            { title: '小吉 — Small Blessing 🌿', reward: 150, color: 'Mint Green 🍵' },
            { title: '末吉 — Future Blessing 🌟', reward: 100, color: 'Sunshine Gold ☀️' }
        ];
        const picked = fortunes[Math.floor(Math.random() * fortunes.length)];
        db.addCoins(userId, guildId, picked.reward);

        const embed = new EmbedBuilder()
            .setColor('#F43F5E')
            .setTitle('🥠 Japanese Omikuji Fortune')
            .setDescription(`You drew **${picked.title}**!\n🎨 **Lucky Color:** ${picked.color}\n💰 **Reward:** +${picked.reward} coins!`)
            .setTimestamp();

        await message.reply({ embeds: [embed] });
        return true;
    }

    // kavatar, uavatar, avatar
    if (['avatar', 'kavatar', 'uavatar'].includes(rawCmd)) {
        const target = message.mentions.users.first() || message.author;
        const avatarUrl = target.displayAvatarURL({ extension: 'png', size: 1024, dynamic: true });

        const embed = new EmbedBuilder()
            .setColor('#FF9EE2')
            .setTitle(`🌸 ${target.username}'s Avatar`)
            .setImage(avatarUrl)
            .setTimestamp();

        await message.reply({ embeds: [embed] });
        return true;
    }

    // kuserinfo, uuserinfo, userinfo
    if (['userinfo', 'kuserinfo', 'uuserinfo'].includes(rawCmd)) {
        const target = message.mentions.users.first() || message.author;
        const member = await message.guild.members.fetch(target.id).catch(() => null);

        const embed = new EmbedBuilder()
            .setColor('#FF9EE2')
            .setTitle(`👤 User Info — ${target.username}`)
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '🆔 User ID', value: `\`${target.id}\``, inline: true },
                { name: '📅 Created On', value: `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`, inline: true },
                { name: '📥 Joined Server', value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Unknown', inline: true }
            )
            .setTimestamp();

        await message.reply({ embeds: [embed] });
        return true;
    }

    // kserverinfo, userverinfo, serverinfo
    if (['serverinfo', 'kserverinfo', 'userverinfo'].includes(rawCmd)) {
        const guild = message.guild;

        const embed = new EmbedBuilder()
            .setColor('#FF69B4')
            .setTitle(`🏰 Server Info — ${guild.name}`)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields(
                { name: '👥 Total Members', value: `\`${guild.memberCount}\``, inline: true },
                { name: '🚀 Boost Level', value: `\`Level ${guild.premiumTier}\``, inline: true },
                { name: '📅 Created On', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true }
            )
            .setTimestamp();

        await message.reply({ embeds: [embed] });
        return true;
    }

    // Standard Slash Command Router fallback via Mock Interaction
    if (resolvedCmdName && message.client.commands) {
        const command = message.client.commands.get(resolvedCmdName);
        if (command) {
            // Plugin Enforcement Check
            const requiredPlugin = PLUGIN_MAP[resolvedCmdName];
            if (requiredPlugin && interactionGuildIdCheck(message, requiredPlugin)) {
                await message.reply(`⚠️ The **${requiredPlugin.toUpperCase()}** module is currently disabled in this server. An admin can enable it using \`/plugin enable name:${requiredPlugin}\`.`);
                return true;
            }

            try {
                const mockInteraction = createPrefixInteraction(message, command, args, rawCmd);
                await command.execute(mockInteraction);
                return true;
            } catch (err) {
                console.error(`Prefix Command Execution Error [${resolvedCmdName}]:`, err);
                await message.reply(`❌ Error executing prefix command \`k${resolvedCmdName}\`: ${err.message}`).catch(() => null);
                return true;
            }
        }
    }

    return false;
}

function interactionGuildIdCheck(message, requiredPlugin) {
    if (message.guild && message.guild.id) {
        return !isPluginEnabled(message.guild.id, requiredPlugin);
    }
    return false;
}

module.exports = { handleUwUTextPrefix, createPrefixInteraction };

