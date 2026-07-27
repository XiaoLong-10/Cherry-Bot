// Fictional stocks and their starting prices
let marketPrices = {
    CHERRY: 100,
    BTC: 250,
    LINUX: 50
};

// Simulate market shifts every hour (or whenever a command runs to keep it lightweight)
function updateMarket() {
    for (const stock in marketPrices) {
        // Random change between -15% and +15%
        const changePercent = (Math.random() * 30 - 15) / 100;
        marketPrices[stock] = Math.max(10, Math.floor(marketPrices[stock] * (1 + changePercent)));
    }
}

// Automatically update the market every 30 minutes
setInterval(updateMarket, 30 * 60 * 1000);

module.exports = {
    getPrices() {
        return marketPrices;
    },
    getPrice(ticker) {
        return marketPrices[ticker.toUpperCase()];
    }
};