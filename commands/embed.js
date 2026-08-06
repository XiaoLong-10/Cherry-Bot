const {SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');

const TEMPLATES = {
    'welcome': {
        title: '🌸 Welcome to {server}!',
        description: '✨ We are so excited to have you here, {user}!\n\n' +
                     '📌 **Getting Started:**\n' +
                     '• Read the server rules\n' +
                     '• Pick your roles in self-roles\n' +
                     '• Say hello in general chat!\n\n' +
                     '💖 Have a lovely stay~',
        color: '#FF9EE2',
        footer: 'Cherry Community Welcome 🌸'
    },
    'rules': {
        title: '📜 Server Rules & Guidelines',
        description: 'Please follow these simple rules to keep our community safe and sweet! 💕\n\n' +
                     '**1.** Be respectful and kind to everyone.\n' +
                     '**2.** No spamming or self-promotion without permission.\n' +
                     '**3.** Keep topics in their appropriate channels.\n' +
                     '**4.** Follow Discord Terms of Service.',
        color: '#7C3AED',
        footer: 'Cherry Server Rules ✨'
    },
    'announcement': {
        title: '📢 Server Announcement',
        description: '🌟 **Important Update!**\n\n' +
                     'We have launched brand new features on our server! Make sure to check out `/uwu`, `/autoresponder`, and `/currency`!',
        color: '#F1C40F',
        footer: 'Cherry News & Updates 📣'
    },
    'cafe_menu': {
        title: '🧋 Cherry Cafe Menu',
        description: 'Welcome to the Cherry Cafe! Here are our fresh handcrafted beverages:\n\n' +
                     '🧋 **Classic Brown Sugar Boba** — 150 🍒\n' +
                     '🍵 **Matcha Green Tea Latte** — 180 🍒\n' +
                     '🍓 **Strawberry Cheese Foam Tea** — 200 🍒\n' +
                     '🥭 **Mango Passionfruit Tea** — 170 🍒\n\n' +
                     'Order yours today using `/brew`!',
        color: '#E67E22',
        footer: 'Cherry Boba & Bakery 🧁'
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('🎨 Create beautiful Mimu-style aesthetic embed messages')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addSubcommand(sub =>
            sub.setName('create')
                .setDescription('✨ Build a custom styled embed message')
                .addStringOption(opt =>
                    opt.setName('description')
                        .setDescription('Main body description text')
                        .setRequired(true))
                .addStringOption(opt =>
                    opt.setName('title')
                        .setDescription('Embed title line')
                        .setRequired(false))
                .addStringOption(opt =>
                    opt.setName('color')
                        .setDescription('Hex color code (e.g. #FF9EE2, #7C3AED, #2ECC71, #F1C40F)')
                        .setRequired(false))
                .addChannelOption(opt =>
                    opt.setName('channel')
                        .setDescription('Channel to send the embed (defaults to current channel)')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false))
                .addStringOption(opt =>
                    opt.setName('image')
                        .setDescription('Direct image URL to embed at the bottom')
                        .setRequired(false))
                .addStringOption(opt =>
                    opt.setName('thumbnail')
                        .setDescription('Direct thumbnail image URL for top right corner')
                        .setRequired(false))
                .addStringOption(opt =>
                    opt.setName('footer')
                        .setDescription('Custom footer text')
                        .setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('template')
                .setDescription('🌸 Send a pre-styled aesthetic embed template')
                .addStringOption(opt =>
                    opt.setName('preset')
                        .setDescription('Choose a preset embed template')
                        .setRequired(true)
                        .addChoices(
                            { name: '🌸 Welcome Embed', value: 'welcome' },
                            { name: '📜 Rules Embed', value: 'rules' },
                            { name: '📢 Announcement Embed', value: 'announcement' },
                            { name: '🧋 Cafe Menu Embed', value: 'cafe_menu' }
                        ))
                .addChannelOption(opt =>
                    opt.setName('channel')
                        .setDescription('Channel to send the template')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('json')
                .setDescription('⚙️ Send an embed using raw JSON format')
                .addStringOption(opt =>
                    opt.setName('data')
                        .setDescription('JSON string representing the embed')
                        .setRequired(true))
                .addChannelOption(opt =>
                    opt.setName('channel')
                        .setDescription('Target text channel')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false))),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const subcommand = interaction.options.getSubcommand();
        const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

        try {
            if (subcommand === 'create') {
                const title = interaction.options.getString('title');
                const description = interaction.options.getString('description');
                const colorInput = interaction.options.getString('color') || '#FF9EE2';
                const imageUrl = interaction.options.getString('image');
                const thumbnailUrl = interaction.options.getString('thumbnail');
                const footerText = interaction.options.getString('footer');

                // Normalize hex color
                let hexColor = colorInput.trim();
                if (!hexColor.startsWith('#')) hexColor = `#${hexColor}`;
                if (!/^#[0-9A-F]{6}$/i.test(hexColor)) hexColor = '#FF9EE2';

                const embed = new EmbedBuilder()
                    .setColor(hexColor)
                    .setDescription(description.replace(/\\n/g, '\n'))
                    .setTimestamp();

                if (title) embed.setTitle(title);
                if (imageUrl) embed.setImage(imageUrl);
                if (thumbnailUrl) embed.setThumbnail(thumbnailUrl);
                if (footerText) embed.setFooter({ text: footerText });

                await targetChannel.send({ embeds: [embed] });

                await interaction.editReply({ 
                    content: `✅ Aesthetic embed successfully posted in ${targetChannel.toString()}!` 
                });
            } else if (subcommand === 'template') {
                const presetKey = interaction.options.getString('preset');
                const template = TEMPLATES[presetKey];

                if (!template) {
                    return await interaction.editReply({ content: '❌ Invalid template selection.' });
                }

                let desc = template.description
                    .replace(/{server}/g, interaction.guild.name)
                    .replace(/{user}/g, interaction.user.toString());

                let title = template.title.replace(/{server}/g, interaction.guild.name);

                const embed = new EmbedBuilder()
                    .setColor(template.color)
                    .setTitle(title)
                    .setDescription(desc)
                    .setFooter({ text: template.footer })
                    .setTimestamp();

                await targetChannel.send({ embeds: [embed] });

                await interaction.editReply({ 
                    content: `🌸 **${presetKey.toUpperCase()}** aesthetic template posted in ${targetChannel.toString()}!` 
                });
            } else if (subcommand === 'json') {
                const jsonRaw = interaction.options.getString('data');
                let parsed = JSON.parse(jsonRaw);

                await targetChannel.send({ embeds: [parsed] });

                await interaction.editReply({ 
                    content: `✅ Custom JSON embed posted in ${targetChannel.toString()}!` 
                });
            }
        } catch (error) {
            console.error('Embed creation error:', error);
            await interaction.editReply({ 
                content: `❌ Failed to send embed: ${error.message}` 
            });
        }
    }
};
