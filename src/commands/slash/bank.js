const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getBankAccount, deposit, withdraw, depositSavings, takeLoan, repayLoan } = require('../../systems/economy/banking.js');
const db = require('../../database/index.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bank')
        .setDescription('🏦 Cherry Financial Bank & High-Yield Savings Account')
        .addSubcommand(sub =>
            sub.setName('balance')
                .setDescription('💳 View your bank accounts, savings interest & credit score'))
        .addSubcommand(sub =>
            sub.setName('deposit')
                .setDescription('📥 Deposit wallet coins into checking account')
                .addIntegerOption(opt => opt.setName('amount').setDescription('Amount to deposit').setRequired(true).setMinValue(1)))
        .addSubcommand(sub =>
            sub.setName('withdraw')
                .setDescription('📤 Withdraw checking coins into wallet')
                .addIntegerOption(opt => opt.setName('amount').setDescription('Amount to withdraw').setRequired(true).setMinValue(1)))
        .addSubcommand(sub =>
            sub.setName('savings')
                .setDescription('📈 Move checking funds to 2% daily high-yield savings')
                .addIntegerOption(opt => opt.setName('amount').setDescription('Amount to move to savings').setRequired(true).setMinValue(1)))
        .addSubcommand(sub =>
            sub.setName('loan')
                .setDescription('🏦 Request a credit-based bank loan')
                .addIntegerOption(opt => opt.setName('amount').setDescription('Amount to borrow').setRequired(true).setMinValue(100)))
        .addSubcommand(sub =>
            sub.setName('repay')
                .setDescription('💳 Repay outstanding bank loan')
                .addIntegerOption(opt => opt.setName('amount').setDescription('Amount to repay').setRequired(true).setMinValue(1))),

    async execute(interaction) {
        await interaction.deferReply();

        const userId = interaction.user.id;
        const guildId = interaction.guildId;
        const subcommand = interaction.options.getSubcommand();
        const curr = db.getCurrencySettings(guildId);

        if (subcommand === 'balance') {
            const acc = getBankAccount(userId);
            const wallet = db.getBalance(userId) || 0;

            const embed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setTitle(`🏦 Cherry Federal Bank — ${interaction.user.username}`)
                .addFields(
                    { name: '👛 Wallet Balance', value: `${curr.symbol} **${wallet.toLocaleString()}** ${curr.name}`, inline: true },
                    { name: '💳 Checking Account', value: `${curr.symbol} **${acc.bankCoins.toLocaleString()}** ${curr.name}`, inline: true },
                    { name: '📈 High-Yield Savings (2%/day)', value: `${curr.symbol} **${acc.savingsCoins.toLocaleString()}** ${curr.name}`, inline: true },
                    { name: '🧾 Outstanding Loan', value: acc.loanBalance > 0 ? `🚨 ${curr.symbol} **${acc.loanBalance.toLocaleString()}**` : '✅ No Active Loans', inline: true },
                    { name: '⭐ Credit Score', value: `**${acc.creditScore}** / 850`, inline: true }
                )
                .setFooter({ text: 'Cherry Bank & Financial Management Engine' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'deposit') {
            const amount = interaction.options.getInteger('amount');
            const res = deposit(userId, amount);

            if (!res.success) {
                return await interaction.editReply({ content: `❌ ${res.reason}` });
            }

            const embed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setTitle('📥 Bank Deposit Successful')
                .setDescription(`Deposited **${amount.toLocaleString()}** ${curr.symbol} ${curr.name} into your checking account.`)
                .addFields(
                    { name: '💳 New Checking Balance', value: `${curr.symbol} **${res.newBank.toLocaleString()}**`, inline: true },
                    { name: '👛 Remaining Wallet', value: `${curr.symbol} **${res.newWallet.toLocaleString()}**`, inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'withdraw') {
            const amount = interaction.options.getInteger('amount');
            const res = withdraw(userId, amount);

            if (!res.success) {
                return await interaction.editReply({ content: `❌ ${res.reason}` });
            }

            const embed = new EmbedBuilder()
                .setColor('#3498DB')
                .setTitle('📤 Bank Withdrawal Successful')
                .setDescription(`Withdrew **${amount.toLocaleString()}** ${curr.symbol} ${curr.name} into your wallet.`)
                .addFields(
                    { name: '👛 New Wallet Balance', value: `${curr.symbol} **${res.newWallet.toLocaleString()}**`, inline: true },
                    { name: '💳 Remaining Checking', value: `${curr.symbol} **${res.newBank.toLocaleString()}**`, inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'savings') {
            const amount = interaction.options.getInteger('amount');
            const res = depositSavings(userId, amount);

            if (!res.success) {
                return await interaction.editReply({ content: `❌ ${res.reason}` });
            }

            const embed = new EmbedBuilder()
                .setColor('#F1C40F')
                .setTitle('📈 Savings Account Deposited')
                .setDescription(`Transferred **${amount.toLocaleString()}** ${curr.symbol} ${curr.name} into 2% Daily High-Yield Savings!`)
                .addFields(
                    { name: '📈 Total Savings', value: `${curr.symbol} **${res.account.savingsCoins.toLocaleString()}**`, inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'loan') {
            const amount = interaction.options.getInteger('amount');
            const res = takeLoan(userId, amount);

            if (!res.success) {
                return await interaction.editReply({ content: `❌ ${res.reason}` });
            }

            const embed = new EmbedBuilder()
                .setColor('#E67E22')
                .setTitle('🏦 Bank Loan Approved')
                .setDescription(`Approved loan of **${amount.toLocaleString()}** ${curr.symbol}! (10% financing interest applied)`)
                .addFields(
                    { name: '🧾 Total Loan Repayment Due', value: `${curr.symbol} **${res.loanAmount.toLocaleString()}**`, inline: true },
                    { name: '⭐ Credit Rating', value: `**${res.account.creditScore}**`, inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'repay') {
            const amount = interaction.options.getInteger('amount');
            const res = repayLoan(userId, amount);

            if (!res.success) {
                return await interaction.editReply({ content: `❌ ${res.reason}` });
            }

            const embed = new EmbedBuilder()
                .setColor('#9B59B6')
                .setTitle('💳 Loan Repayment Processed')
                .setDescription(`Paid **${res.paid.toLocaleString()}** ${curr.symbol} toward your loan balance.`)
                .addFields(
                    { name: '🧾 Remaining Loan Balance', value: res.remainingLoan > 0 ? `${curr.symbol} **${res.remainingLoan.toLocaleString()}**` : '🎉 FULLY PAID OFF!', inline: true },
                    { name: '⭐ Updated Credit Score', value: `**${res.creditScore}**`, inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
    }
};
