const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder 
} = require('discord.js');

function buildCherryHelpEmbed(client) {
    const embed = new EmbedBuilder()
        .setColor('#FF9EE2')
        .setTitle('🍒 Cherry Help Menu')
        .setThumbnail('https://cdn.discordapp.com/attachments/1509277321780265072/1534530699011297502/temp_image_6FA8336A-C777-4284-B480-1A2031F5CD2E.jpg?ex=6a747694&is=6a732514&hm=169bcf9ae32b80858c61a0c4b29a3fdd216f6ec61d019a305f5deac2dea2a91b&') // Cute pink Natsuki avatar thumbnail
        .setDescription(
            'Welcome to **Cherry**\n' +
            'Use `khelp [command]` to see details for any command.\n' +
            'Example: `khelp balance`'
        )
        .addFields(
            { 
                name: '🌲 Animals', 
                value: '`autohunt` `battle` `crate` `dex` `dismantle` `finishhunt` `hunt` `inventory` `lootbox` `pinkuwubox` `sacrifice` `sell` `team` `upgrade` `use` `weapon` `zoo` `zooshop` `arenalist` `battleonline` `battlepvp` `boostanimals` `clan` `clanwar` `combolist` `fabledbox` `fabledcrate` `legendarycrate` `redbox` `redfabledcrate` `transferspecialticket` `transferbox` `transfercrate` `transfershard` `uwubox` `weaponinfo`\n' 
            },
            { 
                name: '👑 Economy', 
                value: '`balance` `boostlevel` `daily` `dailystats` `deposit` `gamestats` `mystats` `omylisting` `onlinesell` `onlineshop` `onlineshopcancel` `ranking` `topservers` `topspend` `transfer` `transferpoint` `weekly` `withdraw` `work`\n' 
            },
            { 
                name: '🎰 Gamble', 
                value: '`amongus` `blackjack` `blackjackmultiplayer` `coinflip` `fishing` `klahklok` `klahklokmultiplayer` `mines` `pokkdeang` `pokkdeangmultiplayer` `slots` `slotsmultiplayer`\n' 
            },
            { 
                name: '🎉 Giveaways', 
                value: '`g-alist` `g-astart` `g-astop` `g-delete` `g-end` `g-list` `g-start`\n' 
            },
            { 
                name: '🎴 Profile', 
                value: '`claimticket` `divorce` `level` `marry` `profile` `setbio` `shop` `transferticket`\n' 
            },
            { 
                name: '😂 Roleplay', 
                value: '`angry` `bite` `blush` `clap` `cry` `curse` `dance` `hug` `jail` `kick` `kill` `kiss` `lick` `plouk` `poke` `pray` `punch` `ship` `slap` `streakpet`\n' 
            },
            { 
                name: '👥 Serverevents', 
                value: '`RandomInviteToSpeak` `confession` `datingzone`\n' 
            },
            { 
                name: '🎵 Music', 
                value: '`play` `queue` `nowplaying` `skip` `stop` `pause` `resume` `volume` `loop` `shuffle` `autoplay` `seek` `remove` `clear` `lyrics`\n' 
            },
            { 
                name: '⚙️ Utility', 
                value: '`247` `standby` `join` `leave` `avatar` `banner` `bigemoji` `botinfo` `botshard` `disablegames` `emoji` `emojilist` `enablegames` `help` `invite` `language` `ping` `poll` `prefix` `roleinfo` `serverinfo` `stats` `status` `uptime` `userinfo` \n' 
            }
        )
        .setFooter({ text: 'Developed by Yuu Long · 247 commands loaded' });

    const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setLabel('Support Server')
            .setStyle(ButtonStyle.Link)
            .setEmoji('🆘')
            .setURL('https://discord.gg'),
        new ButtonBuilder()
            .setLabel('Invite Cherry Bot')
            .setStyle(ButtonStyle.Link)
            .setEmoji('🎉')
            .setURL('https://discord.com')
    );

    const selectMenu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('uwu_help_select')
            .setPlaceholder('Inspect a category or command...')
            .addOptions(
                new StringSelectMenuOptionBuilder().setLabel('Animals Module').setValue('cat_animals').setEmoji('🌲'),
                new StringSelectMenuOptionBuilder().setLabel('Economy Module').setValue('cat_economy').setEmoji('👑'),
                new StringSelectMenuOptionBuilder().setLabel('Gamble Module').setValue('cat_gamble').setEmoji('🎰'),
                new StringSelectMenuOptionBuilder().setLabel('Giveaways Module').setValue('cat_giveaways').setEmoji('🎉'),
                new StringSelectMenuOptionBuilder().setLabel('Profile & Marriage').setValue('cat_profile').setEmoji('🎴'),
                new StringSelectMenuOptionBuilder().setLabel('Roleplay & Affection').setValue('cat_roleplay').setEmoji('😂'),
                new StringSelectMenuOptionBuilder().setLabel('Server Events').setValue('cat_serverevents').setEmoji('👥'),
                new StringSelectMenuOptionBuilder().setLabel('Utility & System').setValue('cat_utility').setEmoji('⚙️')
            )
    );

    return { embed, components: [selectMenu, buttons] };
}

const buildUwUHelpEmbed = buildCherryHelpEmbed;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('🍒 Displays the full pink Cherry Help Menu & command center.')
        .addStringOption(opt => opt.setName('command').setDescription('Specific command to inspect').setRequired(false)),

    buildCherryHelpEmbed,
    buildUwUHelpEmbed,

    async execute(interaction) {
        await interaction.deferReply();
        const { embed, components } = buildCherryHelpEmbed(interaction.client);
        await interaction.editReply({ embeds: [embed], components });
    }
};