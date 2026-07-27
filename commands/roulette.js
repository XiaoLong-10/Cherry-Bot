const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database.js');

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roulette')
        .setDescription('🎰 Play visual casino Roulette and multiply your cherries!')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('The amount of cherries to wager')
                .setMinValue(1)
                .setRequired(true))
        .addStringOption(option =>
            option.setName('bet_type')
                .setDescription('Select your betting method')
                .setRequired(true)
                .addChoices(
                    { name: '🔴⚫ Color (Red / Black / Green)', value: 'color' },
                    { name: '🔢 Specific Number (0 - 36)', value: 'number' },
                    { name: '⚖️ Parity (Even / Odd)', value: 'parity' }
                ))
        .addStringOption(option =>
            option.setName('choice')
                .setDescription('Wager choice (e.g., Red, Odd, or number like 14)')
                .setRequired(true)),

    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        const amount = interaction.options.getInteger('amount');
        const betType = interaction.options.getString('bet_type');
        const choiceRaw = interaction.options.getString('choice').toLowerCase().trim();

        // 1. Verify Character
        const char = db.getCharacter(userId);
        if (!char || !char.char_name) {
            return interaction.reply({
                content: '⚠️ **You must create an RPG character first!**\nUse **`/character create`** to get started.',
                ephemeral: true
            });
        }

        // 2. Verify Balance
        const balance = db.getBalance(userId, guildId);
        if (balance < amount) {
            return interaction.reply({
                content: `❌ **Insufficient cherries!** You only have **🍒 ${balance.toLocaleString()} cherries** in your wallet.`,
                ephemeral: true
            });
        }

        // 3. Choice Validation
        let validatedChoice = choiceRaw;
        if (betType === 'color') {
            if (!['red', 'black', 'green'].includes(choiceRaw)) {
                return interaction.reply({ content: '❌ **Invalid choice for Color!** Choose between `red`, `black`, or `green`.', ephemeral: true });
            }
        } else if (betType === 'parity') {
            if (!['even', 'odd'].includes(choiceRaw)) {
                return interaction.reply({ content: '❌ **Invalid choice for Parity!** Choose between `even` or `odd`.', ephemeral: true });
            }
        } else if (betType === 'number') {
            const num = parseInt(choiceRaw);
            if (isNaN(num) || num < 0 || num > 36) {
                return interaction.reply({ content: '❌ **Invalid choice for Number!** Enter a specific number between `0` and `36`.', ephemeral: true });
            }
            validatedChoice = num;
        }

        await interaction.deferReply();

        // 4. Play Rolling animation
        const animations = [
            '🎡 **The croupier spins the wheel! The ivory ball whirls...**',
            '⚪ *The ball bounces over Red 14... Black 22...*',
            '⚡ *Slowing down... bouncing across the metal pockets...*'
        ];

        for (let step = 0; step < animations.length; step++) {
            await interaction.editReply({ content: animations[step] });
            await new Promise(resolve => setTimeout(resolve, 800));
        }

        // 5. Calculate Result
        const winningNumber = Math.floor(Math.random() * 37); // 0 to 36
        let winningColor = 'green';
        if (RED_NUMBERS.includes(winningNumber)) winningColor = 'red';
        else if (BLACK_NUMBERS.includes(winningNumber)) winningColor = 'black';

        const isWinningEven = winningNumber !== 0 && winningNumber % 2 === 0;
        const isWinningOdd = winningNumber !== 0 && winningNumber % 2 !== 0;
        const winningParity = isWinningEven ? 'even' : (isWinningOdd ? 'odd' : 'none');

        // Determine if player won
        let isWin = false;
        let payoutMultiplier = 0;

        if (betType === 'color') {
            isWin = (validatedChoice === winningColor);
            payoutMultiplier = winningColor === 'green' ? 35 : 1;
        } else if (betType === 'parity') {
            isWin = (validatedChoice === winningParity);
            payoutMultiplier = 1;
        } else if (betType === 'number') {
            isWin = (validatedChoice === winningNumber);
            payoutMultiplier = 35;
        }

        // Apply Balance Update
        let netChange = 0;
        if (isWin) {
            netChange = amount * payoutMultiplier;
            db.addCoins(userId, guildId, netChange);
            db.logTransaction(userId, 'Roulette Win', `Won 🍒 ${netChange} betting ${validatedChoice} on ${betType}`);
        } else {
            netChange = -amount;
            db.deductCoins(userId, guildId, amount);
            db.logTransaction(userId, 'Roulette Loss', `Lost 🍒 ${amount} betting ${validatedChoice} on ${betType}`);
        }

        const newBalance = db.getBalance(userId, guildId);

        // 6. Build final result Embed Card
        const emojiColor = winningColor === 'red' ? '🔴' : (winningColor === 'black' ? '⚫' : '🟢');
        const colorTitle = winningColor.toUpperCase();
        const parityText = winningParity !== 'none' ? winningParity.toUpperCase() : 'NONE';

        const resultEmbed = new EmbedBuilder()
            .setColor(isWin ? '#10b981' : '#ef4444')
            .setTitle(isWin ? '🎉 ROULETTE WINNER!' : '💸 ROULETTE DEFEAT')
            .setDescription(
                `The wheel stops and the ball rests in pocket:\n` +
                `### ${emojiColor} **${winningNumber} ${colorTitle} (${parityText})**\n\n` +
                `• **Your Bet:** ${amount.toLocaleString()} cherries on **${betType} (${choiceRaw})**\n` +
                `• **Result:** ${isWin ? `🏆 **Won 🍒 ${(amount + netChange).toLocaleString()}**` : `💀 **Lost 🍒 ${amount.toLocaleString()}**`}\n\n` +
                `• **New Purse Balance:** 🍒 **${newBalance.toLocaleString()} cherries**`
            )
            .setTimestamp();

        await interaction.editReply({ content: '', embeds: [resultEmbed] });
    }
};
