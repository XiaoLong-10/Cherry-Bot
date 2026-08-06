const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('utility')
        .setDescription('⚙️ UwU Bot Utility Commands (avatar, userinfo, serverinfo, botinfo, bigemoji, etc.)')
        .addSubcommand(sub =>
            sub.setName('avatar')
                .setDescription('🖼️ View high-resolution avatar of yourself or another user')
                .addUserOption(opt => opt.setName('target').setDescription('User to view avatar for').setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('banner')
                .setDescription('🎨 View profile banner of a user')
                .addUserOption(opt => opt.setName('target').setDescription('User to view banner for').setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('bigemoji')
                .setDescription('🔍 Enlarge a custom emoji')
                .addStringOption(opt => opt.setName('emoji').setDescription('The custom emoji to enlarge').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('botinfo')
                .setDescription('🤖 Display detailed system stats and bot uptime'))
        .addSubcommand(sub =>
            sub.setName('userinfo')
                .setDescription('👤 Display detailed account and member information')
                .addUserOption(opt => opt.setName('target').setDescription('User to inspect').setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('serverinfo')
                .setDescription('🏰 Display server statistics, owner, and channel breakdown'))
        .addSubcommand(sub =>
            sub.setName('emojilist')
                .setDescription('📜 View all custom emojis in this server'))
        .addSubcommand(sub =>
            sub.setName('poll')
                .setDescription('📊 Create an interactive voting poll')
                .addStringOption(opt => opt.setName('question').setDescription('Poll question').setRequired(true))),

    async execute(interaction) {
        await interaction.deferReply();
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'avatar') {
            const target = interaction.options.getUser('target') || interaction.user;
            const avatarUrl = target.displayAvatarURL({ extension: 'png', size: 1024, dynamic: true });

            const embed = new EmbedBuilder()
                .setColor('#FF9EE2')
                .setTitle(`🌸 ${target.username}'s Avatar`)
                .setImage(avatarUrl)
                .setFooter({ text: `Requested by ${interaction.user.username}` })
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setLabel('Download Avatar').setStyle(ButtonStyle.Link).setURL(avatarUrl)
            );

            return interaction.editReply({ embeds: [embed], components: [row] });
        } else if (subcommand === 'banner') {
            const target = interaction.options.getUser('target') || interaction.user;
            const fetchedUser = await interaction.client.users.fetch(target.id, { force: true });
            const bannerUrl = fetchedUser.bannerURL({ size: 1024, dynamic: true });

            if (!bannerUrl) {
                return interaction.editReply({ content: `ℹ️ **${target.username}** does not have a custom profile banner!` });
            }

            const embed = new EmbedBuilder()
                .setColor('#FF69B4')
                .setTitle(`🎨 ${target.username}'s Banner`)
                .setImage(bannerUrl)
                .setFooter({ text: `Requested by ${interaction.user.username}` })
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'bigemoji') {
            const emojiStr = interaction.options.getString('emoji');
            const customEmojiMatch = emojiStr.match(/<a?:(\w+):(\d+)>/);

            if (!customEmojiMatch) {
                return interaction.editReply({ content: '⚠️ Please provide a valid custom Discord emoji!' });
            }

            const isAnimated = emojiStr.startsWith('<a:');
            const emojiId = customEmojiMatch[2];
            const emojiName = customEmojiMatch[1];
            const emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${isAnimated ? 'gif' : 'png'}?size=512`;

            const embed = new EmbedBuilder()
                .setColor('#FF9EE2')
                .setTitle(`🔍 Big Emoji: :${emojiName}:`)
                .setImage(emojiUrl)
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'botinfo') {
            const uptime = Math.floor(interaction.client.uptime / 1000);
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = uptime % 60;

            const memUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

            const embed = new EmbedBuilder()
                .setColor('#FF69B4')
                .setTitle('🤖 UwU Bot Info & Statistics')
                .setThumbnail(interaction.client.user.displayAvatarURL())
                .addFields(
                    { name: '🌸 Developer', value: '`Albert Maki & XiaoLong`', inline: true },
                    { name: '⚡ Library', value: '`discord.js v14`', inline: true },
                    { name: '🏰 Servers', value: `\`${interaction.client.guilds.cache.size}\``, inline: true },
                    { name: '👥 Users Cached', value: `\`${interaction.client.users.cache.size}\``, inline: true },
                    { name: '⏱️ Uptime', value: `\`${hours}h ${minutes}m ${seconds}s\``, inline: true },
                    { name: '🧠 RAM Usage', value: `\`${memUsage} MB\``, inline: true }
                )
                .setFooter({ text: 'Powered by Cherry UwU Core ✨' })
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'userinfo') {
            const target = interaction.options.getUser('target') || interaction.user;
            const member = await interaction.guild.members.fetch(target.id).catch(() => null);

            const embed = new EmbedBuilder()
                .setColor('#FF9EE2')
                .setTitle(`👤 User Info — ${target.username}`)
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: '🆔 User ID', value: `\`${target.id}\``, inline: true },
                    { name: '📅 Account Created', value: `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`, inline: true },
                    { name: '📥 Joined Server', value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Unknown', inline: true },
                    { name: '👑 Roles', value: member ? member.roles.cache.map(r => r.toString()).slice(0, 8).join(' ') : 'None', inline: false }
                )
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'serverinfo') {
            const guild = interaction.guild;
            const owner = await guild.fetchOwner().catch(() => null);

            const embed = new EmbedBuilder()
                .setColor('#FF69B4')
                .setTitle(`🏰 Server Info — ${guild.name}`)
                .setThumbnail(guild.iconURL({ dynamic: true }))
                .addFields(
                    { name: '👑 Server Owner', value: owner ? owner.toString() : 'Unknown', inline: true },
                    { name: '👥 Total Members', value: `\`${guild.memberCount}\``, inline: true },
                    { name: '🚀 Boost Level', value: `\`Level ${guild.premiumTier}\` (${guild.premiumSubscriptionCount || 0} boosts)`, inline: true },
                    { name: '💬 Text Channels', value: `\`${guild.channels.cache.filter(c => c.type === 0).size}\``, inline: true },
                    { name: '🔊 Voice Channels', value: `\`${guild.channels.cache.filter(c => c.type === 2).size}\``, inline: true },
                    { name: '📅 Created On', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true }
                )
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'emojilist') {
            const emojis = interaction.guild.emojis.cache.map(e => e.toString());
            if (emojis.length === 0) {
                return interaction.editReply('ℹ️ This server has no custom emojis!');
            }

            const chunk = emojis.slice(0, 35).join(' ');
            const embed = new EmbedBuilder()
                .setColor('#FF9EE2')
                .setTitle(`📜 Server Emojis (${emojis.length} total)`)
                .setDescription(chunk + (emojis.length > 35 ? `\n*...and ${emojis.length - 35} more*` : ''))
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'poll') {
            const question = interaction.options.getString('question');

            const embed = new EmbedBuilder()
                .setColor('#FF69B4')
                .setTitle('📊 UwU Server Poll')
                .setDescription(`**${question}**\n\nVote using the reactions below!`)
                .setFooter({ text: `Created by ${interaction.user.username}` })
                .setTimestamp();

            const msg = await interaction.editReply({ embeds: [embed] });
            await msg.react('👍').catch(() => null);
            await msg.react('👎').catch(() => null);
            await msg.react('🌸').catch(() => null);
        }
    }
};
