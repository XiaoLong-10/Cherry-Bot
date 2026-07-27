const db = require('../../database/index.js');

// Schema initialization for bank accounts & loans
db.exec(`
    CREATE TABLE IF NOT EXISTS bank_accounts (
        userId TEXT PRIMARY KEY,
        bankCoins INTEGER DEFAULT 0,
        savingsCoins INTEGER DEFAULT 0,
        loanBalance INTEGER DEFAULT 0,
        creditScore INTEGER DEFAULT 650,
        lastInterest INTEGER DEFAULT 0
    );
`);

function getBankAccount(userId) {
    db.prepare("INSERT OR IGNORE INTO bank_accounts (userId, bankCoins, savingsCoins, loanBalance, creditScore, lastInterest) VALUES (?, 0, 0, 0, 650, ?)").run(userId, Date.now());
    let account = db.prepare("SELECT * FROM bank_accounts WHERE userId = ?").get(userId);

    // Apply daily 2% savings interest
    const now = Date.now();
    const dayMs = 24 * 3600 * 1000;
    if (account.savingsCoins > 0 && (now - account.lastInterest) >= dayMs) {
        const interest = Math.floor(account.savingsCoins * 0.02);
        account.savingsCoins += interest;
        account.lastInterest = now;
        db.prepare("UPDATE bank_accounts SET savingsCoins = ?, lastInterest = ? WHERE userId = ?").run(account.savingsCoins, now, userId);
    }
    return account;
}

function deposit(userId, amount) {
    const userWallet = db.getBalance(userId) || 0;
    if (amount > userWallet) return { success: false, reason: 'Insufficient wallet coins' };

    db.addCoins(userId, -amount);
    db.prepare("UPDATE bank_accounts SET bankCoins = bankCoins + ? WHERE userId = ?").run(amount, userId);
    return { success: true, newWallet: userWallet - amount, newBank: getBankAccount(userId).bankCoins };
}

function withdraw(userId, amount) {
    const account = getBankAccount(userId);
    if (amount > account.bankCoins) return { success: false, reason: 'Insufficient bank balance' };

    db.prepare("UPDATE bank_accounts SET bankCoins = bankCoins - ? WHERE userId = ?").run(amount, userId);
    db.addCoins(userId, amount);
    return { success: true, newBank: account.bankCoins - amount, newWallet: (db.getBalance(userId) || 0) };
}

function depositSavings(userId, amount) {
    const account = getBankAccount(userId);
    if (amount > account.bankCoins) return { success: false, reason: 'Insufficient checking account balance' };

    db.prepare("UPDATE bank_accounts SET bankCoins = bankCoins - ?, savingsCoins = savingsCoins + ? WHERE userId = ?").run(amount, amount, userId);
    return { success: true, account: getBankAccount(userId) };
}

function takeLoan(userId, amount) {
    const account = getBankAccount(userId);
    if (account.loanBalance > 0) return { success: false, reason: 'You already have an outstanding bank loan!' };
    if (account.creditScore < 600) return { success: false, reason: 'Credit score too low for a bank loan (Minimum 600 required).' };
    
    const maxLoan = account.creditScore * 50; // Max loan based on credit score
    if (amount > maxLoan) return { success: false, reason: `Maximum allowed loan is ${maxLoan.toLocaleString()} coins based on your credit score (${account.creditScore}).` };

    db.prepare("UPDATE bank_accounts SET bankCoins = bankCoins + ?, loanBalance = ? WHERE userId = ?").run(amount, Math.floor(amount * 1.1), userId); // 10% interest rate
    return { success: true, loanAmount: Math.floor(amount * 1.1), account: getBankAccount(userId) };
}

function repayLoan(userId, amount) {
    const account = getBankAccount(userId);
    if (account.loanBalance <= 0) return { success: false, reason: 'You do not have any active loans to repay!' };

    const wallet = db.getBalance(userId) || 0;
    const payment = Math.min(amount, account.loanBalance, wallet);
    if (payment <= 0) return { success: false, reason: 'Insufficient funds to make a loan payment.' };

    db.addCoins(userId, -payment);
    const newLoan = account.loanBalance - payment;
    let newCredit = account.creditScore;
    if (newLoan === 0) newCredit = Math.min(850, account.creditScore + 25); // Credit boost on full payoff

    db.prepare("UPDATE bank_accounts SET loanBalance = ?, creditScore = ? WHERE userId = ?").run(newLoan, newCredit, userId);
    return { success: true, paid: payment, remainingLoan: newLoan, creditScore: newCredit };
}

module.exports = {
    getBankAccount,
    deposit,
    withdraw,
    depositSavings,
    takeLoan,
    repayLoan
};
