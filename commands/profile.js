const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, MessageFlags } = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const db = require('../database.js');

// Helper to truncate text to fit maximum canvas width
function fitText(ctx, text, maxWidth) {
    if (!text) return '';
    if (ctx.measureText(text).width <= maxWidth) return text;
    let truncated = String(text);
    while (truncated.length > 3 && ctx.measureText(truncated + '...').width > maxWidth) {
        truncated = truncated.slice(0, -1);
    }
    return truncated + '...';
}

function drawProgressBar(ctx, x, y, width, height, value, max, colorOrGradient, bgColor = 'rgba(255, 255, 255, 0.2)') {
    ctx.save();
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, height / 2);
    ctx.fill();

    const fillRatio = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
    const filledWidth = fillRatio * width;
    if (filledWidth > 0) {
        ctx.fillStyle = colorOrGradient;
        ctx.beginPath();
        ctx.roundRect(x, y, Math.max(filledWidth, height), height, height / 2);
        ctx.fill();
    }
    ctx.restore();
}

function drawRoundCard(ctx, x, y, w, h, radius, fillColor, strokeColor, strokeWidth = 1) {
    ctx.save();
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fill();
    if (strokeColor) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.stroke();
    }
    ctx.restore();
}

// Custom theme palette configuration dictionary
const THEMES = {
    'Obsidian Dark': {
        cardBg: ['#0b0f19', '#1a2333'],
        panelBg: 'rgba(15, 23, 42, 0.78)',
        borderColor: 'rgba(56, 189, 248, 0.35)',
        primaryColor: '#38bdf8',
        secondaryColor: '#94a3b8',
        accentGlow: 'rgba(56, 189, 248, 0.35)',
        accentGradient: ['#06b6d4', '#3b82f6'],
        textColor: '#f8fafc',
        badgeBg: 'rgba(56, 189, 248, 0.15)',
        isLight: false
    },
    'Royal Gold': {
        cardBg: ['#17120a', '#2a1f0d'],
        panelBg: 'rgba(28, 25, 23, 0.82)',
        borderColor: 'rgba(245, 158, 11, 0.45)',
        primaryColor: '#fbbf24',
        secondaryColor: '#d97706',
        accentGlow: 'rgba(251, 191, 36, 0.4)',
        accentGradient: ['#f59e0b', '#d97706'],
        textColor: '#fffbeb',
        badgeBg: 'rgba(251, 191, 36, 0.15)',
        isLight: false
    },
    'Cyberpunk Neon': {
        cardBg: ['#0d0221', '#261447'],
        panelBg: 'rgba(24, 8, 40, 0.8)',
        borderColor: 'rgba(236, 72, 153, 0.45)',
        primaryColor: '#f472b6',
        secondaryColor: '#38bdf8',
        accentGlow: 'rgba(236, 72, 153, 0.45)',
        accentGradient: ['#ec4899', '#8b5cf6'],
        textColor: '#fdf4ff',
        badgeBg: 'rgba(236, 72, 153, 0.18)',
        isLight: false
    },
    'Emerald Elite': {
        cardBg: ['#022c22', '#064e3b'],
        panelBg: 'rgba(6, 40, 30, 0.8)',
        borderColor: 'rgba(16, 185, 129, 0.45)',
        primaryColor: '#34d399',
        secondaryColor: '#a7f3d0',
        accentGlow: 'rgba(52, 211, 153, 0.35)',
        accentGradient: ['#10b981', '#059669'],
        textColor: '#ecfdf5',
        badgeBg: 'rgba(52, 211, 153, 0.15)',
        isLight: false
    },
    'Platinum Diamond': {
        cardBg: ['#0f172a', '#1e293b'],
        panelBg: 'rgba(30, 41, 59, 0.78)',
        borderColor: 'rgba(148, 163, 184, 0.45)',
        primaryColor: '#e2e8f0',
        secondaryColor: '#38bdf8',
        accentGlow: 'rgba(148, 163, 184, 0.35)',
        accentGradient: ['#38bdf8', '#818cf8'],
        textColor: '#f8fafc',
        badgeBg: 'rgba(148, 163, 184, 0.15)',
        isLight: false
    },
    'Soft Cherry': {
        cardBg: ['#fbcfe8', '#fdf4ff'],
        panelBg: 'rgba(255, 255, 255, 0.85)',
        borderColor: 'rgba(244, 114, 182, 0.5)',
        primaryColor: '#be185d',
        secondaryColor: '#db2777',
        accentGlow: 'rgba(244, 114, 182, 0.5)',
        accentGradient: ['#f9a8d4', '#be185d'],
        textColor: '#4c0519',
        badgeBg: 'rgba(219, 39, 119, 0.12)',
        isLight: true
    },
    'Midnight Royal': {
        cardBg: ['#0f172a', '#1e1b4b'],
        panelBg: 'rgba(15, 23, 42, 0.82)',
        borderColor: 'rgba(139, 92, 246, 0.45)',
        primaryColor: '#c084fc',
        secondaryColor: '#a78bfa',
        accentGlow: 'rgba(192, 132, 252, 0.4)',
        accentGradient: ['#a855f7', '#6366f1'],
        textColor: '#faf5ff',
        badgeBg: 'rgba(192, 132, 252, 0.15)',
        isLight: false
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('✨ View your premium financial wealth dashboard & customize profile theme')
        .addSubcommand(sub =>
            sub.setName('view')
                .setDescription('View your or another user\'s financial profile card')
                .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(false))
                .addBooleanOption(opt => opt.setName('balance_only').setDescription('Only display wallet & bank balance').setRequired(false))
        )
        .addSubcommand(sub =>
            sub.setName('set_theme')
                .setDescription('Select a premium theme for your profile card')
                .addStringOption(opt =>
                    opt.setName('theme')
                        .setDescription('Select theme palette')
                        .setRequired(true)
                        .addChoices(
                            { name: '🌑 Obsidian Dark', value: 'Obsidian Dark' },
                            { name: '👑 Royal Gold', value: 'Royal Gold' },
                            { name: '⚡ Cyberpunk Neon', value: 'Cyberpunk Neon' },
                            { name: '🌲 Emerald Elite', value: 'Emerald Elite' },
                            { name: '💎 Platinum Diamond', value: 'Platinum Diamond' },
                            { name: '🌸 Soft Cherry', value: 'Soft Cherry' },
                            { name: '🌌 Midnight Royal', value: 'Midnight Royal' }
                        )
                )
        )
        .addSubcommand(sub =>
            sub.setName('set_bio')
                .setDescription('Update your personal adventurer bio')
                .addStringOption(opt => opt.setName('bio').setDescription('Personal bio text (max 150 chars)').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('set_title')
                .setDescription('Set your displayed active title badge')
                .addStringOption(opt => opt.setName('title').setDescription('Title badge (e.g. High Roller VIP, Cherry Tycoon)').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('set_background')
                .setDescription('Set a custom background wallpaper image URL')
                .addStringOption(opt => opt.setName('url').setDescription('Image URL (http/https) or type "default"').setRequired(true))
        ),

    async execute(interaction) {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply().catch(() => {});
        }

        const subcommand = interaction.options.getSubcommand(false) || 'view';
        const userId = interaction.user.id;

        // --- SUBCOMMAND: SET THEME ---
        if (subcommand === 'set_theme') {
            const chosenTheme = interaction.options.getString('theme');
            const currentSettings = db.getProfileSettings(userId) || {};
            db.updateProfileSettings(userId, {
                ...currentSettings,
                theme: chosenTheme
            });

            const embed = new EmbedBuilder()
                .setColor('#10b981')
                .setTitle('✨ Profile Theme Updated!')
                .setDescription(`Your profile theme has been set to **${chosenTheme}**.\nRun \`/profile view\` to see your new card design!`)
                .setTimestamp();

            return await interaction.editReply({ embeds: [embed] });
        }

        // --- SUBCOMMAND: SET BIO ---
        if (subcommand === 'set_bio') {
            const bioText = interaction.options.getString('bio').slice(0, 150);
            const currentSettings = db.getProfileSettings(userId) || {};
            db.updateProfileSettings(userId, {
                ...currentSettings,
                bio: bioText
            });

            const embed = new EmbedBuilder()
                .setColor('#3b82f6')
                .setTitle('📜 Adventurer Bio Updated!')
                .setDescription(`Updated your bio to:\n> *"${bioText}"*`)
                .setTimestamp();

            return await interaction.editReply({ embeds: [embed] });
        }

        // --- SUBCOMMAND: SET TITLE ---
        if (subcommand === 'set_title') {
            const titleText = interaction.options.getString('title').slice(0, 40);
            const currentSettings = db.getProfileSettings(userId) || {};
            db.updateProfileSettings(userId, {
                ...currentSettings,
                activeTitle: titleText
            });

            const embed = new EmbedBuilder()
                .setColor('#f59e0b')
                .setTitle('👑 Active Title Updated!')
                .setDescription(`Your title has been updated to: **‹ ${titleText} ›**`)
                .setTimestamp();

            return await interaction.editReply({ embeds: [embed] });
        }

        // --- SUBCOMMAND: SET BACKGROUND ---
        if (subcommand === 'set_background') {
            let bgUrl = interaction.options.getString('url').trim();
            if (bgUrl.toLowerCase() === 'default' || bgUrl.toLowerCase() === 'reset') {
                bgUrl = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809';
            } else if (!bgUrl.startsWith('http://') && !bgUrl.startsWith('https://')) {
                return await interaction.editReply({ content: '❌ Please provide a valid HTTP or HTTPS image URL (or type `default`).' });
            }

            const currentSettings = db.getProfileSettings(userId) || {};
            db.updateProfileSettings(userId, {
                ...currentSettings,
                background: bgUrl
            });

            const embed = new EmbedBuilder()
                .setColor('#ec4899')
                .setTitle('🖼️ Background Wallpaper Updated!')
                .setDescription(`Your custom background image wallpaper has been updated!\nRun \`/profile view\` to see the wallpaper live on your profile card.`)
                .setTimestamp();

            return await interaction.editReply({ embeds: [embed] });
        }

        // --- SUBCOMMAND: VIEW (PROFILE CARD) ---
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const targetId = targetUser.id;
        const guildId = interaction.guild ? interaction.guild.id : 'GLOBAL';
        const balanceOnly = interaction.options.getBoolean('balance_only') || false;

        const coins = db.getBalance(targetId, guildId) || 0;
        const char = db.getCharacter(targetId) || {};
        const bankVault = char.bank_coins || 0;

        // Balance Only Option
        if (balanceOnly) {
            const balanceEmbed = new EmbedBuilder()
                .setColor('#db2777')
                .setAuthor({
                    name: `${targetUser.username}'s Wallet`,
                    iconURL: targetUser.displayAvatarURL({ extension: 'png' })
                })
                .setDescription(`🍒 **${targetUser.username}** holds **${coins.toLocaleString()}** cherries in liquid wallet.`)
                .addFields(
                    { name: '🏦 Bank Vault', value: `🍒 ${bankVault.toLocaleString()}`, inline: true },
                    { name: '✨ Total Liquid', value: `🍒 ${(coins + bankVault).toLocaleString()}`, inline: true }
                )
                .setTimestamp();

            return await interaction.editReply({ embeds: [balanceEmbed] });
        }

        // 1. Real Estate Valuation
        const properties = db.getUserProperties(targetId) || [];
        const propertyValues = { studio: 20000, villa: 75000, office: 220000, penthouse: 500000 };
        let realEstateWorth = 0;
        properties.forEach(p => {
            if (p) realEstateWorth += propertyValues[p.propertyType] || 0;
        });

        // 2. Business Valuation
        const businesses = db.getUserBusinesses(targetId) || [];
        const businessValues = { coffee: 15000, restaurant: 50000, bank: 150000, factory: 350000, hospital: 800000 };
        let businessWorth = 0;
        businesses.forEach(b => {
            if (b) businessWorth += (businessValues[b.businessType] || 0) * (b.level || 1);
        });

        // 3. Stock Portfolio Valuation
        const stocks = db.getStocks() || [];
        let stocksWorth = 0;
        stocks.forEach(s => {
            if (s) {
                const shares = db.getShares(targetId, s.ticker) || 0;
                if (shares > 0) stocksWorth += shares * (s.price || 0);
            }
        });

        // 4. Delivery Fleet Valuation
        const delivery = db.getDeliveryCompany(targetId) || {};
        const vehicleValues = { Bicycle: 0, Scooter: 10000, Van: 30000, Truck: 75000, 'Cargo Jet': 250000 };
        const fleetWorth = (vehicleValues[delivery.vehicle] || 0) + ((delivery.workers || 0) * 15000);

        // 5. Net Worth
        const netWorth = coins + bankVault + realEstateWorth + businessWorth + stocksWorth + fleetWorth;

        // 6. Customization Settings & RPG Data
        const profileSettings = db.getProfileSettings(targetId) || {};
        const activeTitle = profileSettings.activeTitle || 'Novice Adventurer';
        const bioText = profileSettings.bio || 'An epic Cherry RPG adventurer.';
        const themeName = profileSettings.theme || 'Obsidian Dark';
        const themeConfig = THEMES[themeName] || THEMES['Obsidian Dark'];

        const marriage = db.getMarriage(targetId);
        let spouseName = null;
        if (marriage) {
            const spouseId = marriage.user1Id === targetId ? marriage.user2Id : marriage.user1Id;
            const spouseUser = interaction.client.users.cache.get(spouseId);
            spouseName = spouseUser ? spouseUser.username : `ID: ${spouseId.slice(0, 5)}`;
        }

        const pet = db.getPet(targetId);

        // Dynamic Badge List
        const badgesList = [];
        if (netWorth >= 1000000) badgesList.push('💰 Tycoon');
        if (netWorth >= 250000) badgesList.push('👑 High Roller');
        if (stocksWorth > 50000) badgesList.push('📈 Investor');
        if (realEstateWorth > 50000) badgesList.push('🏠 Landlord');
        if (marriage) badgesList.push('💍 Married');
        if (pet) badgesList.push('🐾 Beastmaster');

        // Parse custom badges if present
        if (profileSettings.badges) {
            try {
                const parsed = JSON.parse(profileSettings.badges);
                if (Array.isArray(parsed)) {
                    parsed.forEach(b => {
                        if (typeof b === 'string' && !badgesList.includes(b)) badgesList.push(b);
                    });
                }
            } catch (e) {}
        }

        try {
            // Ultra HD Canvas: 900 x 620
            const canvas = createCanvas(900, 620);
            const ctx = canvas.getContext('2d');

            // 1. Draw Wallpaper or Gradient Background
            let bgLoaded = false;
            if (profileSettings.background && profileSettings.background.startsWith('http')) {
                try {
                    const bgImg = await loadImage(profileSettings.background);
                    ctx.drawImage(bgImg, 0, 0, 900, 620);
                    // Dark / light backdrop overlay filter
                    ctx.fillStyle = themeConfig.isLight ? 'rgba(255, 255, 255, 0.45)' : 'rgba(11, 15, 25, 0.65)';
                    ctx.fillRect(0, 0, 900, 620);
                    bgLoaded = true;
                } catch (e) {}
            }

            if (!bgLoaded) {
                const bgGrad = ctx.createLinearGradient(0, 0, 900, 620);
                bgGrad.addColorStop(0, themeConfig.cardBg[0]);
                bgGrad.addColorStop(1, themeConfig.cardBg[1]);
                ctx.fillStyle = bgGrad;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            // Sleek Tech Grid Overlay
            ctx.strokeStyle = themeConfig.isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 1;
            for (let i = 0; i < canvas.width; i += 36) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, canvas.height);
                ctx.stroke();
            }
            for (let j = 0; j < canvas.height; j += 36) {
                ctx.beginPath();
                ctx.moveTo(0, j);
                ctx.lineTo(canvas.width, j);
                ctx.stroke();
            }

            // Radial Glow Behind Avatar
            ctx.save();
            const glowGrad = ctx.createRadialGradient(175, 140, 0, 175, 140, 160);
            glowGrad.addColorStop(0, themeConfig.accentGlow);
            glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(175, 140, 160, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // LEFT PANEL: Profile Avatar & RPG Info Card
            drawRoundCard(ctx, 25, 25, 300, 570, 20, themeConfig.panelBg, themeConfig.borderColor, 2);

            // User Avatar Loading
            let avatarImg = null;
            try {
                const avatarUrl = targetUser.displayAvatarURL({ extension: 'png', size: 256 });
                avatarImg = await loadImage(avatarUrl);
            } catch (e) {}

            if (avatarImg) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(175, 125, 75, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(avatarImg, 100, 50, 150, 150);
                ctx.restore();

                // Avatar Outer Ring
                ctx.strokeStyle = themeConfig.primaryColor;
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(175, 125, 75, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Username Text
            ctx.fillStyle = themeConfig.textColor;
            ctx.font = 'bold 22px "Segoe UI Emoji", sans-serif';
            ctx.textAlign = 'center';
            const displayUsername = fitText(ctx, targetUser.username, 260);
            ctx.fillText(displayUsername, 175, 230);

            // Active Title Pill Badge
            drawRoundCard(ctx, 55, 244, 240, 26, 13, themeConfig.badgeBg, themeConfig.borderColor, 1);
            ctx.fillStyle = themeConfig.primaryColor;
            ctx.font = 'bold 11px "Segoe UI Emoji", sans-serif';
            ctx.fillText(`‹ ${fitText(ctx, activeTitle, 210)} ›`, 175, 261);

            // Server Rank & Level Card
            const serverRank = db.getServerRankPosition(targetId) ?? 'N/A';
            const userLevel = char.level || 1;
            const userXp = char.xp || 0;
            const xpNeeded = userLevel * 100;
            const xpPct = xpNeeded > 0 ? Math.floor((userXp / xpNeeded) * 100) : 0;

            drawRoundCard(ctx, 45, 280, 260, 26, 13, themeConfig.badgeBg, themeConfig.borderColor, 1);
            ctx.fillStyle = themeConfig.primaryColor;
            ctx.font = 'bold 12px "Segoe UI Emoji", sans-serif';
            ctx.fillText(`🌸 RANK #${serverRank}   |   ⚡ LVL ${userLevel}`, 175, 297);

            // XP Progress Bar
            ctx.fillStyle = themeConfig.secondaryColor;
            ctx.font = 'bold 11px "Segoe UI Emoji", sans-serif';
            ctx.fillText(`XP: ${userXp.toLocaleString()} / ${xpNeeded.toLocaleString()} (${xpPct}%)`, 175, 325);

            const xpGrad = ctx.createLinearGradient(45, 0, 305, 0);
            xpGrad.addColorStop(0, themeConfig.accentGradient[0]);
            xpGrad.addColorStop(1, themeConfig.accentGradient[1]);
            drawProgressBar(ctx, 45, 333, 260, 10, userXp, xpNeeded, xpGrad, 'rgba(255, 255, 255, 0.2)');

            // Matrimonial & Pet Cards
            const statusY = 358;
            drawRoundCard(ctx, 45, statusY, 260, 32, 10, themeConfig.panelBg, themeConfig.borderColor, 1);
            ctx.fillStyle = themeConfig.textColor;
            ctx.font = 'bold 11px "Segoe UI Emoji", sans-serif';
            const marriageText = spouseName ? `💍 Married to ${fitText(ctx, spouseName, 140)}` : '💔 Single';
            ctx.fillText(marriageText, 175, statusY + 20);

            const petY = 398;
            drawRoundCard(ctx, 45, petY, 260, 32, 10, themeConfig.panelBg, themeConfig.borderColor, 1);
            ctx.fillStyle = themeConfig.textColor;
            ctx.font = 'bold 11px "Segoe UI Emoji", sans-serif';
            const petText = pet ? `🐾 ${fitText(ctx, pet.petName, 130)} (Lvl ${pet.level})` : '🐾 No Active Pet';
            ctx.fillText(petText, 175, petY + 20);

            // Adventurer Bio Box
            drawRoundCard(ctx, 45, 438, 260, 142, 12, themeConfig.panelBg, themeConfig.borderColor, 1);
            ctx.fillStyle = themeConfig.primaryColor;
            ctx.font = 'bold 11px "Segoe UI Emoji", sans-serif';
            ctx.fillText('📜 ADVENTURER BIO', 175, 458);

            ctx.fillStyle = themeConfig.textColor;
            ctx.font = 'italic 11px "Segoe UI Emoji", sans-serif';
            const cleanBio = fitText(ctx, bioText, 240);
            ctx.fillText(`"${cleanBio}"`, 175, 482);

            // Badges Row
            if (badgesList.length > 0) {
                ctx.fillStyle = themeConfig.secondaryColor;
                ctx.font = 'bold 10px "Segoe UI Emoji", sans-serif';
                const badgeLine = badgesList.slice(0, 3).join('   ');
                ctx.fillText(badgeLine, 175, 520);
            }

            ctx.fillStyle = themeConfig.primaryColor;
            ctx.font = 'bold 10px "Segoe UI Emoji", sans-serif';
            ctx.fillText('✨ OFFICIAL CHERRY FINANCIAL PROFILE ✨', 175, 565);

            // RIGHT PANEL: Financial Wealth & Net Worth Header
            ctx.textAlign = 'left';
            ctx.fillStyle = themeConfig.secondaryColor;
            ctx.font = 'bold 12px "Segoe UI Emoji", sans-serif';
            ctx.fillText('💎 ESTIMATED TOTAL NET WORTH', 355, 50);

            ctx.fillStyle = themeConfig.primaryColor;
            ctx.font = 'bold 42px "Segoe UI Emoji", sans-serif';
            ctx.fillText(`🍒 ${netWorth.toLocaleString()}`, 355, 98);

            // Header Divider line
            ctx.strokeStyle = themeConfig.borderColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(355, 118);
            ctx.lineTo(870, 118);
            ctx.stroke();

            // Asset Breakdown Grid (2 cols x 3 rows)
            const gridItems = [
                { title: 'Liquid Wallet', value: coins, icon: '🍒', color: '#ec4899' },
                { title: 'Bank Vault', value: bankVault, icon: '🏦', color: '#f59e0b' },
                { title: 'Stock Portfolio', value: stocksWorth, icon: '📈', color: '#10b981' },
                { title: 'Businesses', value: businessWorth, icon: '🏢', color: '#8b5cf6' },
                { title: 'Real Estate', value: realEstateWorth, icon: '🏠', color: '#38bdf8' },
                { title: 'Logistics Fleet', value: fleetWorth, icon: '🚚', color: '#f43f5e' }
            ];

            gridItems.forEach((item, index) => {
                const col = index % 2;
                const row = Math.floor(index / 2);
                const x = 355 + col * 260;
                const y = 135 + row * 94;
                const w = 245;
                const h = 80;

                drawRoundCard(ctx, x, y, w, h, 14, themeConfig.panelBg, themeConfig.borderColor, 1.5);

                // Left color accent stripe
                ctx.fillStyle = item.color;
                ctx.beginPath();
                ctx.roundRect(x, y, 6, h, 6);
                ctx.fill();

                ctx.fillStyle = themeConfig.secondaryColor;
                ctx.font = 'bold 11px "Segoe UI Emoji", sans-serif';
                ctx.fillText(item.title.toUpperCase(), x + 18, y + 26);

                ctx.fillStyle = themeConfig.textColor;
                ctx.font = 'bold 17px "Segoe UI Emoji", sans-serif';
                ctx.fillText(`${item.icon} ${item.value.toLocaleString()}`, x + 18, y + 56);
            });

            // Bottom Asset Registry Ledger Box
            drawRoundCard(ctx, 355, 435, 505, 160, 16, themeConfig.panelBg, themeConfig.borderColor, 1.5);

            ctx.fillStyle = themeConfig.primaryColor;
            ctx.font = 'bold 13px "Segoe UI Emoji", sans-serif';
            ctx.fillText('📑 ASSET REGISTRY & LOGISTICS REPORT', 375, 465);

            ctx.fillStyle = themeConfig.secondaryColor;
            ctx.font = '12px "Segoe UI Emoji", sans-serif';
            ctx.fillText('• Active Logistics Vehicle:', 375, 498);
            ctx.fillStyle = themeConfig.textColor;
            ctx.fillText(delivery.vehicle || 'Bicycle (Basic)', 575, 498);

            ctx.fillStyle = themeConfig.secondaryColor;
            ctx.fillText('• Hired Couriers & Staff:', 375, 528);
            ctx.fillStyle = themeConfig.textColor;
            ctx.fillText(`${delivery.workers || 0} active workers`, 575, 528);

            ctx.fillStyle = themeConfig.secondaryColor;
            ctx.fillText('• Real Estate Properties:', 375, 558);
            const activeProps = properties.filter(p => p && p.propertyType).map(p => p.propertyType).join(', ') || 'None';
            ctx.fillStyle = themeConfig.textColor;
            ctx.fillText(fitText(ctx, activeProps, 260), 575, 558);

            // Buffer creation & Discord Attachment
            const buffer = typeof canvas.encode === 'function' ? await canvas.encode('png') : canvas.toBuffer('image/png');
            const attachment = new AttachmentBuilder(buffer, { name: 'financial-profile.png' });

            const profileEmbed = new EmbedBuilder()
                .setColor(themeConfig.primaryColor.startsWith('#') ? themeConfig.primaryColor : '#38bdf8')
                .setTitle(`✨ ${targetUser.username}'s Financial Profile`)
                .setDescription(`Official Wealth & Asset Dashboard for **${targetUser.username}** [Theme: \`${themeName}\`]`)
                .setImage('attachment://financial-profile.png')
                .setTimestamp();

            return await interaction.editReply({ embeds: [profileEmbed], files: [attachment] });

        } catch (error) {
            console.error("Error drawing profile card: ", error);
            return await interaction.editReply({ content: '❌ Something went wrong while rendering your premium profile card.' }).catch(() => {});
        }
    },
};