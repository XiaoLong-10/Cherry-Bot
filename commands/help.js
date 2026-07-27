const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder 
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription(' Displays the interactive bot command center & system guide.'),

    async execute(interaction) {
        const initialEmbed = new EmbedBuilder()
            .setColor('#7C3AED')
            .setTitle('🌸 CHERRY BOT 3.0 — ULTIMATE SYSTEM COMMAND CENTER')
            .setDescription(
                'Welcome to **Cherry Bot 3.0**!\n\n' +
                'Select a category below to explore available system modules, interactive mini-games, AI utilities, and server management features.'
            )
            .addFields(
                { name: '🌐 Quick Info', value: '• **Version:** 3.0.0 (Enterprise Production)\n• **Language:** `/language` (English 🇺🇸 & Khmer ភាសាខ្មែរ 🇰🇭)\n• **Server Realm:** `/realm view`', inline: false }
            )
            .setFooter({ text: 'Select a category from the dropdown below' })
            .setTimestamp();

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('help_category_select')
            .setPlaceholder('Explore command categories...')
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('Banking & Economy')
                    .setDescription('Bank accounts, 2% high-yield savings, loans, shop, and trade.')
                    .setValue('banking')
                    .setEmoji('🏦'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Shared Realm & Tycoon')
                    .setDescription('Server virtual kingdom, building upgrades & daily dividends.')
                    .setValue('realm')
                    .setEmoji('🏰'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Casino & Arcade Games')
                    .setDescription('Plinko, Crash, Mines, Slots, Blackjack, Pokdeng, Coinflip.')
                    .setValue('casino')
                    .setEmoji('🎰'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('AI Assistant & Translation')
                    .setDescription('AI Chat, document summarizer, multi-language translator.')
                    .setValue('ai')
                    .setEmoji('🤖'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Tickets & Server Moderation')
                    .setDescription('Support ticket panels, plugin manager, autoresponder.')
                    .setValue('tickets')
                    .setEmoji('🎫'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('UwU, Roleplay & Aesthetics')
                    .setDescription('UwU text converter, cute RP actions, custom embed builder.')
                    .setValue('uwu')
                    .setEmoji('🌸'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('RPG, Pets & Professions')
                    .setDescription('Hunting, mining, woodcutting, character progression, pets.')
                    .setValue('rpg')
                    .setEmoji('⚔️')
            );

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const replyMsg = await interaction.reply({
            embeds: [initialEmbed],
            components: [row]
        });

        const collector = replyMsg.createMessageComponentCollector({
            time: 120000 // 2 minutes window
        });

        collector.on('collect', async (i) => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: '❌ You cannot control this help dashboard!', ephemeral: true });
            }

            await i.deferUpdate();
            const selected = i.values[0];
            const categoryEmbed = new EmbedBuilder().setTimestamp();

            if (selected === 'banking') {
                categoryEmbed
                    .setColor('#2ECC71')
                    .setTitle('🏦 Banking & Economy Commands')
                    .setDescription(
                        `• **/bank balance**: View checking, 2% daily savings, active loans & credit score.\n` +
                        `• **/bank deposit <amount>**: Transfer wallet coins into checking account.\n` +
                        `• **/bank withdraw <amount>**: Withdraw checking funds into wallet.\n` +
                        `• **/bank savings <amount>**: Move funds to 2% daily high-yield savings.\n` +
                        `• **/bank loan <amount>**: Borrow funds based on credit rating.\n` +
                        `• **/bank repay <amount>**: Repay outstanding bank loan.\n` +
                        `• **/balance**: Graphical inventory & wallet balance sheet.\n` +
                        `• **/currency set/view/reset**: Customize server currency name & symbol.`
                    );
            } else if (selected === 'realm') {
                categoryEmbed
                    .setColor('#F1C40F')
                    .setTitle('🏰 Shared Realm & Server Tycoon Commands')
                    .setDescription(
                        `• **/realm view**: Inspect your server's shared virtual kingdom status.\n` +
                        `• **/realm contribute <resource> <amount>**: Donate wood, stone, iron, crops, or coins to upgrade kingdom buildings.\n` +
                        `• **/realm collect**: Claim daily shared passive dividends from the Boba Distillery.`
                    );
            } else if (selected === 'casino') {
                categoryEmbed
                    .setColor('#E74C3C')
                    .setTitle('🎰 High-Stakes Casino & Arcade Commands')
                    .setDescription(
                        `• **/casino plinko <bet>**: Drop balls down a peg pyramid for up to 10.0x multipliers.\n` +
                        `• **/casino crash <bet> <cashout>**: Cash out before the multiplier crashes.\n` +
                        `• **/casino mines <bet> [mines] [picks]**: Navigate safe tiles on a 5x5 minefield.\n` +
                        `• **/slots <bet>**: Spin the progressive slots jackpot.\n` +
                        `• **/blackjack <bet>**: Play 21 against the dealer.\n` +
                        `• **/pokdeng [bet]**: Play Thai Pokdeng with Deng multipliers.`
                    );
            } else if (selected === 'ai') {
                categoryEmbed
                    .setColor('#9B59B6')
                    .setTitle('🤖 AI Assistant & Translation Suite')
                    .setDescription(
                        `• **/ai chat <prompt>**: Ask Cherry AI assistant any question.\n` +
                        `• **/ai summarize <text>**: Condense long text or announcements into executive summaries.\n` +
                        `• **/ai translate <text> <language>**: Translate text to Khmer (ភាសាខ្មែរ 🇰🇭), English 🇺🇸, Japanese 🇯🇵, French 🇫🇷, Spanish 🇪🇸.`
                    );
            } else if (selected === 'tickets') {
                categoryEmbed
                    .setColor('#3498DB')
                    .setTitle('🎫 Support Tickets & Moderation Commands')
                    .setDescription(
                        `• **/ticket panel [channel]**: Deploy interactive support ticket panels.\n` +
                        `• **/ticket close**: Close an active ticket channel.\n` +
                        `• **/plugin list/enable/disable**: Manage active server feature modules.\n` +
                        `• **/autoresponder add/remove/list/clear**: Configure custom Mimu-style autoresponder triggers.\n` +
                        `• **/language set/view**: Toggle server language between English 🇺🇸 and Khmer ភាសាខ្មែរ 🇰🇭.`
                    );
            } else if (selected === 'uwu') {
                categoryEmbed
                    .setColor('#FF9EE2')
                    .setTitle('🌸 UwU, Roleplay & Aesthetics Commands')
                    .setDescription(
                        `• **/uwu convert <text>**: Turn regular text into cute UwU speech with kaomojis.\n` +
                        `• **/uwu kaomoji**: Display a random Japanese kaomoji emoticon.\n` +
                        `• **/uwu stutter <text>**: Add adorable stuttering to text.\n` +
                        `• **/rp boop/cuddle/nuzzle/pout/blush/bite**: Perform expressive anime interaction actions.\n` +
                        `• **/embed create/template/json**: Build custom styled embed cards with banner images and colors.`
                    );
            } else if (selected === 'rpg') {
                categoryEmbed
                    .setColor('#E67E22')
                    .setTitle('⚔️ RPG, Pets & Professions Commands')
                    .setDescription(
                        `• **/character create/profile**: Create your RPG hero and assign skill points.\n` +
                        `• **/hunt**: Hunt wild beasts for XP and crafting materials.\n` +
                        `• **/mine / woodcut / fish**: Harvest ores, timber, and fish.\n` +
                        `• **/pet adopt/profile**: Adopt and raise pets.`
                    );
            }

            await interaction.editReply({ embeds: [categoryEmbed] });
        });

        collector.on('end', async () => {
            const disabledMenu = StringSelectMenuBuilder.from(selectMenu).setDisabled(true);
            const disabledRow = new ActionRowBuilder().addComponents(disabledMenu);
            await interaction.editReply({ components: [disabledRow] }).catch(() => {});
        });
    },
};