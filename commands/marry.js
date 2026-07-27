const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas'); 
const db = require('../database.js');

async function drawCertificate(u1Name, u1AvatarUrl, u2Name, u2AvatarUrl, dateStr) {
    const width = 600;
    const height = 300;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Pink felt background
    ctx.fillStyle = '#fff0f5';
    ctx.fillRect(0, 0, width, height);

    // Decorative lace borders
    ctx.strokeStyle = '#ffb6c1';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, width - 10, height - 10);
    
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.strokeRect(12, 12, width - 24, height - 24);

    // Heading
    ctx.fillStyle = '#c71585';
    ctx.font = 'italic bold 28px Georgia, "Segoe UI Emoji", serif';
    ctx.textAlign = 'center';
    ctx.fillText('Certificate of Matrimony', width / 2, 55);

    // Center Gold Rings Symbol
    ctx.fillStyle = '#ffd700';
    ctx.font = '45px "Segoe UI Emoji", sans-serif';
    ctx.fillText('💍', width / 2, 145);

    // Spouse 1 Avatar
    try {
        const img1 = await loadImage(u1AvatarUrl);
        ctx.save();
        ctx.beginPath();
        ctx.arc(120, 130, 45, 0, Math.PI * 2, true);
        ctx.clip();
        ctx.drawImage(img1, 75, 85, 90, 90);
        ctx.restore();
        
        ctx.strokeStyle = '#ff69b4';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(120, 130, 45, 0, Math.PI * 2);
        ctx.stroke();
    } catch (e) {}

    // Spouse 2 Avatar
    try {
        const img2 = await loadImage(u2AvatarUrl);
        ctx.save();
        ctx.beginPath();
        ctx.arc(480, 130, 45, 0, Math.PI * 2, true);
        ctx.clip();
        ctx.drawImage(img2, 435, 85, 90, 90);
        ctx.restore();
        
        ctx.strokeStyle = '#ff69b4';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(480, 130, 45, 0, Math.PI * 2);
        ctx.stroke();
    } catch (e) {}

    // Names under avatars
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 14px "Segoe UI Emoji", sans-serif';
    ctx.fillText(u1Name.substring(0, 15), 120, 195);
    ctx.fillText(u2Name.substring(0, 15), 480, 195);

    // Union text
    ctx.fillStyle = '#555555';
    ctx.font = 'italic 16px Georgia, "Segoe UI Emoji", serif';
    ctx.fillText('This certifies that these two adventurers are joined', width / 2, 230);
    ctx.fillText(`in Holy Matrimony on ${dateStr}.`, width / 2, 255);

    return canvas.toBuffer('image/png');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('marry')
        .setDescription('💍 Propose marriage to another adventurer!')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user you want to propose to')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();

        const proposer = interaction.user;
        const target = interaction.options.getUser('target');

        if (target.bot) {
            return interaction.editReply({ content: '❌ You cannot marry a bot!' });
        }

        if (target.id === proposer.id) {
            return interaction.editReply({ content: '❌ You cannot marry yourself!' });
        }

        // Check if either user is already married
        const proposerMarry = db.getMarriage(proposer.id);
        if (proposerMarry) {
            return interaction.editReply({ content: '❌ You are already married! You must divorce first.' });
        }

        const targetMarry = db.getMarriage(target.id);
        if (targetMarry) {
            return interaction.editReply({ content: `❌ **${target.username}** is already married to someone else!` });
        }

        const acceptBtn = new ButtonBuilder()
            .setCustomId('marry_accept')
            .setLabel('❤️ Yes, I Do')
            .setStyle(ButtonStyle.Success);

        const declineBtn = new ButtonBuilder()
            .setCustomId('marry_decline')
            .setLabel('❌ Decline')
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(acceptBtn, declineBtn);

        const proposalEmbed = new EmbedBuilder()
            .setColor('#f472b6')
            .setTitle('💍 PROPOSAL OF HOLY MATRIMONY')
            .setDescription(
                `🔔 **Hear Ye, Hear Ye!**\n` +
                `<@${proposer.id}> has knelt on one knee and proposed marriage to <@${target.id}>!\n\n` +
                `*Spouse-to-be, how do you answer this proposal?*`
            )
            .setThumbnail(target.displayAvatarURL({ extension: 'png' }))
            .setTimestamp();

        const proposalMsg = await interaction.editReply({
            content: `<@${target.id}>`,
            embeds: [proposalEmbed],
            components: [row]
        });

        const collector = proposalMsg.createMessageComponentCollector({
            filter: i => i.user.id === target.id,
            time: 60000 // 1 minute proposal window
        });

        collector.on('collect', async (i) => {
            await i.deferUpdate();

            if (i.customId === 'marry_accept') {
                const now = Date.now();
                db.proposeAndMarry(proposer.id, target.id, now);

                const dateStr = new Date(now).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                const u1Avatar = proposer.displayAvatarURL({ extension: 'png', size: 128 });
                const u2Avatar = target.displayAvatarURL({ extension: 'png', size: 128 });

                try {
                    const certBuffer = await drawCertificate(proposer.username, u1Avatar, target.username, u2Avatar, dateStr);
                    const attachment = new AttachmentBuilder(certBuffer, { name: 'marriage-certificate.png' });

                    const congratsEmbed = new EmbedBuilder()
                        .setColor('#f472b6')
                        .setTitle('💖 JUST MARRIED! 💖')
                        .setDescription(
                            `🎉 **Congratulations!** <@${proposer.id}> and <@${target.id}> have accepted each other and are now officially married!\n\n` +
                            `🎒 **Union Perks Activated:**\n` +
                            `• **Shared Home**: You now share a \`Tiny Cottage\`! Rename it with \`/marriage home rename\`.\n` +
                            `• **Couple Buff**: Both spouses receive a **+20% Experience Points boost**! \n` +
                            `• **Daily Rewards**: Run \`/marriage daily\` together to claim couple cherries.`
                        )
                        .setImage('attachment://marriage-certificate.png')
                        .setTimestamp();

                    await i.editReply({ content: '🎉 The union is sealed!', embeds: [congratsEmbed], files: [attachment], components: [] });
                } catch (err) {
                    console.error("Error drawing certificate: ", err);
                    await i.editReply({ content: `🎉 Congratulations! <@${proposer.id}> and <@${target.id}> are now married!`, components: [] });
                }
                collector.stop('accepted');
            } else if (i.customId === 'marry_decline') {
                const declineEmbed = new EmbedBuilder()
                    .setColor('#c084fc')
                    .setTitle('💔 PROPOSAL DECLINED')
                    .setDescription(`<@${target.id}> has politely declined the proposal from <@${proposer.id}>. There are plenty of other fish in the sea!`)
                    .setTimestamp();

                await i.editReply({ content: '🥀 The proposal was declined.', embeds: [declineEmbed], components: [] });
                collector.stop('declined');
            }
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                const timeoutEmbed = new EmbedBuilder()
                    .setColor('#c084fc')
                    .setTitle('⏱️ PROPOSAL TIMED OUT')
                    .setDescription(`<@${proposer.id}>'s proposal to <@${target.id}> went unanswered. Perhaps they were away on an adventure!`)
                    .setTimestamp();

                await interaction.editReply({ content: '⏱️ proposal timed out.', embeds: [timeoutEmbed], components: [] }).catch(() => {});
            }
        });
    }
};
