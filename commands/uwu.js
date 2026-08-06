const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');

const KAOMOJI_LIST = [
    '(owo)', '(uwu)', '( >w< )', '( ^-^ )', '(⁠◕⁠ᴗ⁠◕⁠✿⁠)', '(⁠≧⁠▽⁠≦⁠)', 
    '(* ^ ω ^)', '( ` ω ´ )', '(✿◡‿◡)', '( 🥭 >w<)', '( rawr xD )',
    '(⁠•⁠ө⁠•⁠♡)', '(⁠っ⁠.⁠❛⁠ ⁠g⁠c⁠ ⁠.⁠❛⁠)⁠っ', '(#^.^#)', '(⁠/⁠^⁠-⁠^⁠(⁠^⁠^⁠*⁠)⁠/'
];

function owoifyText(text) {
    if (!text) return 'uwu';

    let converted = text
        // Replace r and l with w
        .replace(/r/g, 'w')
        .replace(/l/g, 'w')
        .replace(/R/g, 'W')
        .replace(/L/g, 'W')
        // Replace ove with uv
        .replace(/ove/g, 'uv')
        .replace(/OVE/g, 'UV')
        .replace(/Ove/g, 'Uv')
        // Replace N followed by vowel with ny
        .replace(/n([aeiou])/g, 'ny$1')
        .replace(/N([aeiou])/g, 'Ny$1')
        .replace(/N([AEIOU])/g, 'NY$1')
        // Replace th with d or f randomly
        .replace(/th/g, 'd')
        .replace(/TH/g, 'D');

    // Add stutter to random words starting with consonants
    const words = converted.split(' ');
    const stutteredWords = words.map(word => {
        if (word.length > 2 && Math.random() < 0.25 && /^[b-df-hj-np-tv-z]/i.test(word)) {
            const firstChar = word.charAt(0);
            return `${firstChar}-${word}`;
        }
        return word;
    });

    converted = stutteredWords.join(' ');
    const randomKaomoji = KAOMOJI_LIST[Math.floor(Math.random() * KAOMOJI_LIST.length)];
    return `${converted} ${randomKaomoji}`;
}

async function drawShipCard(user1, user2, percentage, shipName, statusTitle) {
    const { createCanvas, loadImage } = require('@napi-rs/canvas');
    const canvas = createCanvas(700, 320);
    const ctx = canvas.getContext('2d');

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 700, 320);
    grad.addColorStop(0, '#fce7f3');
    grad.addColorStop(0.5, '#f472b6');
    grad.addColorStop(1, '#db2777');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 700, 320);

    // Decorative inner box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.roundRect(20, 20, 660, 280, 20);
    ctx.fill();

    // Avatars
    try {
        const avatar1 = await loadImage(user1.displayAvatarURL({ extension: 'png', size: 128 }));
        const avatar2 = await loadImage(user2.displayAvatarURL({ extension: 'png', size: 128 }));

        ctx.save();
        ctx.beginPath();
        ctx.arc(150, 110, 50, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatar1, 100, 60, 100, 100);
        ctx.restore();
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(150, 110, 52, 0, Math.PI * 2); ctx.stroke();

        ctx.save();
        ctx.beginPath();
        ctx.arc(550, 110, 50, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatar2, 500, 60, 100, 100);
        ctx.restore();
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(550, 110, 52, 0, Math.PI * 2); ctx.stroke();
    } catch (e) {}

    // Heart icon in middle
    ctx.font = '48px "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💖', 350, 120);

    // Names
    ctx.fillStyle = '#831843';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(user1.username.slice(0, 12), 150, 185);
    ctx.fillText(user2.username.slice(0, 12), 550, 185);

    // Ship Name
    ctx.fillStyle = '#db2777';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`Ship: ${shipName}`, 350, 210);

    // Progress Bar
    const barWidth = 440;
    const barHeight = 26;
    const barX = (700 - barWidth) / 2;
    const barY = 235;

    ctx.fillStyle = '#fbcfe8';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, 13);
    ctx.fill();

    const fillWidth = Math.max(16, (barWidth * percentage) / 100);
    ctx.fillStyle = '#be185d';
    ctx.beginPath();
    ctx.roundRect(barX, barY, fillWidth, barHeight, 13);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`${percentage}% — ${statusTitle}`, 350, barY + 18);

    return canvas.toBuffer('image/png');
}

async function drawFortuneCard(user, blessingTitle, luckyColor, luckyNumber, adviceText, rewardCoins) {
    const { createCanvas, loadImage } = require('@napi-rs/canvas');
    const canvas = createCanvas(600, 360);
    const ctx = canvas.getContext('2d');

    // Traditional Parchment Background
    const grad = ctx.createLinearGradient(0, 0, 600, 360);
    grad.addColorStop(0, '#fff1f2');
    grad.addColorStop(0.5, '#ffe4e6');
    grad.addColorStop(1, '#fecdd3');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 360);

    // Frame
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 6;
    ctx.strokeRect(15, 15, 570, 330);

    ctx.strokeStyle = '#fda4af';
    ctx.lineWidth = 2;
    ctx.strokeRect(22, 22, 556, 316);

    // Header
    ctx.fillStyle = '#9f1239';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🌸 OMIKUJI — DAILY UWU FORTUNE 🌸', 300, 55);

    // Blessing Title Box
    ctx.fillStyle = '#be123c';
    ctx.beginPath();
    ctx.roundRect(160, 75, 280, 50, 10);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(blessingTitle, 300, 108);

    // User Avatar
    try {
        const avatar = await loadImage(user.displayAvatarURL({ extension: 'png', size: 128 }));
        ctx.save();
        ctx.beginPath();
        ctx.arc(80, 100, 35, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatar, 45, 65, 70, 70);
        ctx.restore();
        ctx.strokeStyle = '#be123c';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(80, 100, 36, 0, Math.PI * 2); ctx.stroke();
    } catch(e) {}

    // Advice text
    ctx.fillStyle = '#881337';
    ctx.font = 'italic 17px sans-serif';
    ctx.fillText(`"${adviceText}"`, 300, 165);

    // Details Grid
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(40, 190, 520, 110, 12);
    ctx.fill();
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#9f1239';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`🎨 Lucky Color: ${luckyColor}`, 70, 225);
    ctx.fillText(`🔢 Lucky Number: ${luckyNumber}`, 70, 255);
    ctx.fillText(`💰 Daily Fortune Reward: +${rewardCoins} coins!`, 70, 285);

    ctx.textAlign = 'center';
    ctx.font = '28px "Segoe UI Emoji", sans-serif';
    ctx.fillText('⛩️', 510, 250);

    return canvas.toBuffer('image/png');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uwu')
        .setDescription('💖 Cute UwU and OwO text tools, love calculator, fortune cookie, and kaomojis!')
        .addSubcommand(sub =>
            sub.setName('convert')
                .setDescription('✨ Convert any text into adorable UwU speech')
                .addStringOption(opt =>
                    opt.setName('text')
                        .setDescription('The message you want to uwuify')
                        .setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('kaomoji')
                .setDescription('🌸 Get a random cute Japanese kaomoji emoticon'))
        .addSubcommand(sub =>
            sub.setName('stutter')
                .setDescription('🥺 Make your text stutter cutely')
                .addStringOption(opt =>
                    opt.setName('text')
                        .setDescription('Text to turn into cute stuttering speech')
                        .setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('ship')
                .setDescription('💖 Calculate cute love compatibility between two users!')
                .addUserOption(opt =>
                    opt.setName('target')
                        .setDescription('The user you want to test love compatibility with')
                        .setRequired(true))
                .addUserOption(opt =>
                    opt.setName('secondary')
                        .setDescription('Optional second user (defaults to you)')
                        .setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('fortune')
                .setDescription('🥠 Draw your daily Japanese Omikuji fortune & claim bonus coins!')),

    async execute(interaction) {
        await interaction.deferReply();

        const subcommand = interaction.options.getSubcommand();
        const db = require('../database.js');

        if (subcommand === 'convert') {
            const textInput = interaction.options.getString('text');
            const uwuResult = owoifyText(textInput);

            const embed = new EmbedBuilder()
                .setColor('#FF9EE2')
                .setTitle('🌸 UwUified Text!')
                .setDescription(`\`\`\`\n${uwuResult}\n\`\`\``)
                .setFooter({ text: 'Powered by Cherry UwU Engine ✨' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'kaomoji') {
            const randomKaomoji = KAOMOJI_LIST[Math.floor(Math.random() * KAOMOJI_LIST.length)];
            
            const embed = new EmbedBuilder()
                .setColor('#FF69B4')
                .setTitle('✨ Random Cute Kaomoji')
                .setDescription(`# ${randomKaomoji}`)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'stutter') {
            const textInput = interaction.options.getString('text');
            const words = textInput.split(' ');
            const stuttered = words.map(w => {
                if (w.length > 0 && /^[a-zA-Z]/.test(w)) {
                    return `${w[0]}-${w[0]}-${w}`;
                }
                return w;
            }).join(' ');

            const embed = new EmbedBuilder()
                .setColor('#FEE75C')
                .setTitle('🥺 Stuttering Speech')
                .setDescription(`*"${stuttered}..."*`)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'ship') {
            const user1 = interaction.options.getUser('secondary') || interaction.user;
            const user2 = interaction.options.getUser('target');

            const idSum = BigInt(user1.id) + BigInt(user2.id);
            const percentage = Number(idSum % 101n);

            let statusTitle = 'Soulmates ✨';
            if (percentage < 20) statusTitle = 'Total Disaster 💔';
            else if (percentage < 40) statusTitle = 'Awkward Friends 😳';
            else if (percentage < 60) statusTitle = 'Cute Crush 🌸';
            else if (percentage < 85) statusTitle = 'Lovebirds 💖';

            const u1Name = user1.username;
            const u2Name = user2.username;
            const shipName = u1Name.slice(0, Math.ceil(u1Name.length / 2)) + u2Name.slice(Math.floor(u2Name.length / 2));

            try {
                const buffer = await drawShipCard(user1, user2, percentage, shipName, statusTitle);
                const attachment = new AttachmentBuilder(buffer, { name: 'uwu_ship.png' });

                const embed = new EmbedBuilder()
                    .setColor('#EC4899')
                    .setTitle(`💖 UwU Love Match: ${user1.username} x ${user2.username}`)
                    .setDescription(`**${shipName}** score is **${percentage}%**! ${statusTitle}`)
                    .setImage('attachment://uwu_ship.png')
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed], files: [attachment] });
            } catch (err) {
                console.error('Ship card error:', err);
                const embed = new EmbedBuilder()
                    .setColor('#EC4899')
                    .setTitle(`💖 Love Match: ${user1.username} x ${user2.username}`)
                    .setDescription(`**Ship Name:** ${shipName}\n**Compatibility:** ${percentage}%\n**Status:** ${statusTitle}`);
                await interaction.editReply({ embeds: [embed] });
            }
        } else if (subcommand === 'fortune') {
            const userId = interaction.user.id;
            const guildId = interaction.guild?.id || 'GLOBAL';

            const fortunes = [
                { title: '大吉 — Great Blessing ✨', reward: 300, color: 'Sakura Pink 🌸', advice: 'Great joy and wealth will bloom around you today (⁠≧⁠▽⁠≦⁠)!' },
                { title: '中吉 — Middle Blessing 💖', reward: 200, color: 'Pastel Blue 🫐', advice: 'Your kindness to others will bring a pleasant surprise (* ^ ω ^).' },
                { title: '小吉 — Small Blessing 🌿', reward: 150, color: 'Mint Green 🍵', advice: 'Patience will open an unexpected door for you (✿◡‿◡).' },
                { title: '末吉 — Future Blessing 🌟', reward: 100, color: 'Sunshine Gold ☀️', advice: 'Good things are quietly heading your way (⁠◕⁠ᴗ⁠◕⁠✿⁠).' },
                { title: '吉 — Simple Fortune 💫', reward: 120, color: 'Lavender Violet 🪻', advice: 'Keep your head high and enjoy a warm cup of boba (⁠•⁠ө⁠•⁠♡).' }
            ];

            const picked = fortunes[Math.floor(Math.random() * fortunes.length)];
            const luckyNum = Math.floor(Math.random() * 99) + 1;

            // Award coins to user
            db.addCoins(userId, guildId, picked.reward);

            try {
                const buffer = await drawFortuneCard(interaction.user, picked.title, picked.color, luckyNum, picked.advice, picked.reward);
                const attachment = new AttachmentBuilder(buffer, { name: 'omikuji.png' });

                const embed = new EmbedBuilder()
                    .setColor('#F43F5E')
                    .setTitle('🥠 Japanese Omikuji Fortune')
                    .setDescription(`You drew **${picked.title}**!\nClaimed **+${picked.reward} coins**!`)
                    .setImage('attachment://omikuji.png')
                    .setFooter({ text: 'Come back tomorrow for another fortune slip! 🌸' })
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed], files: [attachment] });
            } catch (err) {
                console.error('Fortune card error:', err);
                await interaction.editReply({
                    content: `🥠 **Your Fortune:** ${picked.title}\n🎨 **Lucky Color:** ${picked.color}\n🔢 **Lucky Number:** ${luckyNum}\n💰 **Reward:** +${picked.reward} coins!`
                });
            }
        }
    }
};


