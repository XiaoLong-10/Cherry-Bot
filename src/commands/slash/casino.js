const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { playPlinko, playCrash, playMines } = require('../../systems/games/casinoEngine.js');
const db = require('../../database/index.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('casino')
        .setDescription('🎰 Cherry High-Stakes Casino & Arcade Suite')
        .addSubcommand(sub =>
            sub.setName('plinko')
                .setDescription('🔴 Drop the ball down the peg pyramid')
                .addIntegerOption(opt => opt.setName('bet').setDescription('Amount of coins to bet').setRequired(true).setMinValue(10)))
        .addSubcommand(sub =>
            sub.setName('crash')
                .setDescription('🚀 Cash out before the multiplier crashes')
                .addIntegerOption(opt => opt.setName('bet').setDescription('Coins to bet').setRequired(true).setMinValue(10))
                .addNumberOption(opt => opt.setName('cashout').setDescription('Multiplier target to cash out (e.g., 1.5, 2.0, 5.0)').setRequired(true).setMinValue(1.05).setMaxValue(50.0)))
        .addSubcommand(sub =>
            sub.setName('mines')
                .setDescription('💣 Navigate the 5x5 minefield for high multipliers')
                .addIntegerOption(opt => opt.setName('bet').setDescription('Coins to bet').setRequired(true).setMinValue(10))
                .addIntegerOption(opt => opt.setName('mines').setDescription('Number of hidden mines (1 to 10)').setRequired(false).setMinValue(1).setMaxValue(10))
                .addIntegerOption(opt => opt.setName('picks').setDescription('Number of safe tiles to uncover (1 to 10)').setRequired(false).setMinValue(1).setMaxValue(10))),

    async execute(interaction) {
        await interaction.deferReply();

        const userId = interaction.user.id;
        const guildId = interaction.guildId;
        const subcommand = interaction.options.getSubcommand();
        const bet = interaction.options.getInteger('bet');
        const curr = db.getCurrencySettings(guildId);

        const wallet = db.getBalance(userId) || 0;
        if (bet > wallet) {
            return await interaction.editReply({ content: `❌ Insufficient coins in wallet! You have **${wallet.toLocaleString()}** ${curr.symbol} ${curr.name}.` });
        }

        if (subcommand === 'plinko') {
            const res = playPlinko(bet);
            db.addCoins(userId, res.netProfit);

            const embed = new EmbedBuilder()
                .setColor(res.isWin ? '#2ECC71' : '#E74C3C')
                .setTitle('🔴 Plinko Ball Drop')
                .setDescription(`\`\`\`\nPath: ${res.path}\n\`\`\``)
                .addFields(
                    { name: '🎯 Target Multiplier', value: `**${res.multiplier}x**`, inline: true },
                    { name: res.netProfit >= 0 ? '💰 Total Payout' : '💸 Net Loss', value: `${curr.symbol} **${res.payout.toLocaleString()}** ${curr.name}`, inline: true }
                )
                .setFooter({ text: 'Cherry Arcade Plinko Engine' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'crash') {
            const targetMult = interaction.options.getNumber('cashout');
            const res = playCrash(bet, targetMult);
            db.addCoins(userId, res.netProfit);

            const embed = new EmbedBuilder()
                .setColor(res.isWin ? '#2ECC71' : '#E74C3C')
                .setTitle(res.isWin ? '🚀 Cashout Successful!' : '💥 CRASHED!')
                .addFields(
                    { name: '📈 Your Cashout Target', value: `**${res.targetMultiplier}x**`, inline: true },
                    { name: '📊 Actual Crash Point', value: `**${res.crashMultiplier}x**`, inline: true },
                    { name: '💰 Result', value: res.isWin ? `+${res.netProfit.toLocaleString()} ${curr.symbol} ${curr.name}` : `-${bet.toLocaleString()} ${curr.symbol} ${curr.name}`, inline: false }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'mines') {
            const mines = interaction.options.getInteger('mines') || 3;
            const picks = interaction.options.getInteger('picks') || 3;
            const res = playMines(bet, mines, picks);
            db.addCoins(userId, res.netProfit);

            const embed = new EmbedBuilder()
                .setColor(res.hitMine ? '#E74C3C' : '#2ECC71')
                .setTitle(res.hitMine ? '💣 KABOOM! You hit a mine!' : '💎 Clear Field Victory!')
                .setDescription(res.hitMine ? `You stepped on a mine after ${picks} picks.` : `Uncovered ${picks} safe tiles across a grid of ${mines} mines!`)
                .addFields(
                    { name: '🎯 Multiplier Earned', value: res.hitMine ? '0.0x' : `**${res.multiplier}x**`, inline: true },
                    { name: '💰 Payout', value: `${curr.symbol} **${res.payout.toLocaleString()}** ${curr.name}`, inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
    }
};
