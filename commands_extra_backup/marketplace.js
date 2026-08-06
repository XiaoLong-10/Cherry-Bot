const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('marketplace')
        .setDescription('🛒 Sell or purchase items in the global player marketplace')
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('📋 View all items currently listed for sale by players'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('sell')
                .setDescription('🛒 List an item for sale in the marketplace')
                .addStringOption(option =>
                    option.setName('item')
                        .setDescription('The item name (e.g. Wood, Iron Ore)')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('quantity')
                        .setDescription('The quantity to list')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('price')
                        .setDescription('The total cherries price for this listing')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('buy')
                .setDescription('🛒 Purchase a listing from the marketplace')
                .addIntegerOption(option =>
                    option.setName('listing_id')
                        .setDescription('The ID of the listing to buy')
                        .setRequired(true))),

    async execute(interaction) {
        await interaction.deferReply();

        const userId = interaction.user.id;
        const guildId = interaction.guild ? (interaction.guild ? interaction.guild.id : 'GLOBAL') : 'GLOBAL';
        const subcommand = interaction.options.getSubcommand();

        const char = db.getCharacter(userId);
        if (!char || !char.char_name) {
            return interaction.editReply({ content: '⚠️ **You must create an RPG character first!**\nUse **`/character create`** to get started.' });
        }

        // --- SUBCOMMAND: LIST ---
        if (subcommand === 'list') {
            const listings = db.getMarketListings();

            const listEmbed = new EmbedBuilder()
                .setColor('#c084fc')
                .setTitle('🛒 PLAYER MARKETPLACE LISTINGS')
                .setDescription(
                    `Find items listed for sale by other adventurers!\n` +
                    `*A **10% transaction tax** applies on all completed sales.*`
                )
                .setTimestamp();

            if (listings.length === 0) {
                listEmbed.setDescription('*No items are currently listed on the marketplace. Be the first to list one!*');
            } else {
                for (const l of listings) {
                    const seller = await interaction.client.users.fetch(l.sellerId).catch(() => null);
                    const sellerName = seller ? seller.username : 'Unknown Seller';
                    listEmbed.addFields({
                        name: `Listing ID: \` ${l.id} \` ┃ ${l.itemName} (x${l.quantity})`,
                        value: `🍒 Price: **🍒 ${l.price.toLocaleString()} cherries** ┃ Seller: **${sellerName}**`
                    });
                }
            }

            await interaction.editReply({ embeds: [listEmbed] });
        }

        // --- SUBCOMMAND: SELL ---
        else if (subcommand === 'sell') {
            const itemNameInput = interaction.options.getString('item').trim();
            const qty = interaction.options.getInteger('quantity');
            const price = interaction.options.getInteger('price');

            if (qty <= 0) {
                return interaction.editReply({ content: '❌ Quantity must be greater than 0!' });
            }

            if (price <= 0) {
                return interaction.editReply({ content: '❌ Price must be greater than 0!' });
            }

            const inventory = db.getInventory(userId);
            const invItem = inventory.find(i => i.itemName.toLowerCase() === itemNameInput.toLowerCase());

            if (!invItem || invItem.quantity < qty) {
                const held = invItem ? invItem.quantity : 0;
                return interaction.editReply({ content: `❌ You do not have enough **${itemNameInput}**! (Held: ${held}, Required: ${qty})` });
            }

            const correctName = invItem.itemName;

            db.removeItem(userId, correctName, qty);
            db.addMarketListing(userId, correctName, qty, price);

            const sellEmbed = new EmbedBuilder()
                .setColor('#fbcfe8')
                .setTitle('🛒 ITEM LISTED FOR SALE')
                .setDescription(
                    `Successfully listed **${qty}x ${correctName}** on the marketplace for **🍒 ${price.toLocaleString()} cherries**!\n\n` +
                    `*Items have been put in the escrow vaults. You will receive 90% of cherries once sold (10% sales tax).*`
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [sellEmbed] });
        }

        // --- SUBCOMMAND: BUY ---
        else if (subcommand === 'buy') {
            const listingId = interaction.options.getInteger('listing_id');
            const listing = db.getMarketListing(listingId);

            if (!listing) {
                return interaction.editReply({ content: `❌ Listing ID **\` ${listingId} \`** does not exist or has already been purchased!` });
            }

            if (listing.sellerId === userId) {
                return interaction.editReply({ content: '❌ You cannot buy your own listing! If you want to cancel it, contact an admin.' });
            }

            const buyerCoins = db.getBalance(userId, guildId);
            if (buyerCoins < listing.price) {
                return interaction.editReply({ content: `❌ Insufficient cherries! You only have **🍒 ${buyerCoins.toLocaleString()}** cherries, but this listing costs **🍒 ${listing.price.toLocaleString()}**.` });
            }

            // Deduct coins from buyer
            db.deductCoins(userId, guildId, listing.price);

            // Give item to buyer
            db.addItem(userId, listing.itemName, listing.quantity);

            // Transfer coins to seller minus 10% tax
            const tax = Math.floor(listing.price * 0.10);
            const payout = listing.price - tax;
            db.addCoins(listing.sellerId, guildId, payout);

            // Delete listing
            db.removeMarketListing(listingId);

            const buyEmbed = new EmbedBuilder()
                .setColor('#db2777')
                .setTitle('🛒 ITEM PURCHASED!')
                .setDescription(
                    `You successfully purchased listing **\` #${listing.id} \`**!\n\n` +
                    `• **Item:** **${listing.quantity}x ${listing.itemName}**\n` +
                    `• **Paid:** **🍒 ${listing.price.toLocaleString()} cherries**\n\n` +
                    `*A 10% transaction tax (🍒 ${tax.toLocaleString()}) was collected, and the seller received 🍒 ${payout.toLocaleString()} cherries.*`
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [buyEmbed] });
        }
    }
};
