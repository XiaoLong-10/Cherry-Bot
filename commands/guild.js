const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas'); 
const db = require('../database.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('guild')
        .setDescription('🛡️ Player Guilds & Factions System')
        .addSubcommand(sub => 
            sub.setName('create')
            .setDescription('Pay 10,000 cherries to establish a new Guild.')
            .addStringOption(opt => opt.setName('name').setDescription('The name of your Guild').setRequired(true))
        )
        .addSubcommand(sub => 
            sub.setName('invite')
            .setDescription('Invite a player to your Guild.')
            .addUserOption(opt => opt.setName('user').setDescription('The user to invite').setRequired(true))
        )
        .addSubcommand(sub => 
            sub.setName('deposit')
            .setDescription('Deposit cherries into the Guild Bank.')
            .addIntegerOption(opt => opt.setName('amount').setDescription('Amount to deposit').setRequired(true))
        )
        .addSubcommand(sub => 
            sub.setName('upgrade')
            .setDescription('Upgrade a Guild Perk using Bank cherries.')
            .addStringOption(opt => 
                opt.setName('perk')
                .setDescription('The perk to upgrade')
                .setRequired(true)
                .addChoices(
                    { name: '🌟 XP Boost', value: 'perk_xp_boost' },
                    { name: '🏷️ Shop Discount', value: 'perk_shop_discount' }
                )
            )
        )
        .addSubcommand(sub => 
            sub.setName('info')
            .setDescription('View a Guild profile card.')
            .addStringOption(opt => opt.setName('name').setDescription('Guild name to search (optional)'))
        ),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const userId = interaction.user.id;
        const discordGuildId = interaction.guild.id;

        if (sub === 'create') {
            const guildName = interaction.options.getString('name');
            const coins = db.getBalance(userId, discordGuildId);
            
            if (coins < 10000) {
                return interaction.reply({ content: `❌ You need **10,000 cherries** to establish a Guild! (You have ${coins.toLocaleString()} cherries)`, ephemeral: true });
            }

            const existingPlayerGuild = db.getPlayerGuild(userId);
            if (existingPlayerGuild) {
                return interaction.reply({ content: `❌ You are already in the Guild **${existingPlayerGuild.name}**! Leave it first.`, ephemeral: true });
            }

            try {
                db.createPlayerGuild(userId, guildName, 10000, discordGuildId);
                return interaction.reply(`🛡️ **${interaction.user.username}** has successfully established the Guild **${guildName}**!`);
            } catch (e) {
                if (e.message.includes('UNIQUE constraint failed')) {
                    return interaction.reply({ content: `❌ The Guild name **${guildName}** is already taken!`, ephemeral: true });
                }
                return interaction.reply({ content: `❌ An error occurred: ${e.message}`, ephemeral: true });
            }
        }

        if (sub === 'invite') {
            const targetUser = interaction.options.getUser('user');
            const myGuild = db.getPlayerGuild(userId);

            if (!myGuild) return interaction.reply({ content: `❌ You are not in a Guild!`, ephemeral: true });
            if (myGuild.memberRole !== 'Owner') return interaction.reply({ content: `❌ Only the Guild Owner can invite members!`, ephemeral: true });
            if (targetUser.bot) return interaction.reply({ content: `❌ You cannot invite bots.`, ephemeral: true });
            
            const targetExisting = db.getPlayerGuild(targetUser.id);
            if (targetExisting) return interaction.reply({ content: `❌ **${targetUser.username}** is already in a Guild!`, ephemeral: true });

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId('accept_invite').setLabel('Accept Invite').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('decline_invite').setLabel('Decline').setStyle(ButtonStyle.Danger)
                );

            const msg = await interaction.reply({
                content: `📨 <@${targetUser.id}>, you have been invited to join the Guild **${myGuild.name}** by <@${userId}>!`,
                components: [row],
                fetchReply: true
            });

            const filter = i => i.user.id === targetUser.id;
            const collector = msg.createMessageComponentCollector({ filter, time: 60000, max: 1 });

            collector.on('collect', async i => {
                if (i.customId === 'accept_invite') {
                    // Double check they didn't join another in the meantime
                    if (db.getPlayerGuild(targetUser.id)) {
                        return i.reply({ content: `❌ You are already in a Guild!`, ephemeral: true });
                    }
                    db.joinPlayerGuild(targetUser.id, myGuild.id);
                    await i.update({ content: `🎉 <@${targetUser.id}> has joined the Guild **${myGuild.name}**!`, components: [] });
                } else {
                    await i.update({ content: `❌ <@${targetUser.id}> declined the guild invite.`, components: [] });
                }
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    interaction.editReply({ content: `⏳ The guild invite to <@${targetUser.id}> expired.`, components: [] });
                }
            });
        }

        if (sub === 'deposit') {
            const amount = interaction.options.getInteger('amount');
            if (amount <= 0) return interaction.reply({ content: `❌ Amount must be positive.`, ephemeral: true });

            const myGuild = db.getPlayerGuild(userId);
            if (!myGuild) return interaction.reply({ content: `❌ You are not in a Guild!`, ephemeral: true });

            const coins = db.getBalance(userId, discordGuildId);
            if (coins < amount) return interaction.reply({ content: `❌ You don't have enough cherries!`, ephemeral: true });

            db.depositGuildBank(userId, amount, discordGuildId);
            return interaction.reply(`💸 You deposited **${amount.toLocaleString()}** cherries into the **${myGuild.name}** Guild Bank!`);
        }

        if (sub === 'upgrade') {
            const perk = interaction.options.getString('perk');
            const myGuild = db.getPlayerGuild(userId);
            if (!myGuild) return interaction.reply({ content: `❌ You are not in a Guild!`, ephemeral: true });
            if (myGuild.memberRole !== 'Owner') return interaction.reply({ content: `❌ Only the Guild Owner can purchase perks!`, ephemeral: true });

            const currentPerkLevel = myGuild[perk] || 0;
            const cost = (currentPerkLevel + 1) * 20000; // 20k, 40k, 60k...

            if (myGuild.bank_coins < cost) {
                return interaction.reply({ content: `❌ The Guild Bank needs **${cost.toLocaleString()}** cherries to upgrade this perk. It only has ${myGuild.bank_coins.toLocaleString()} cherries!`, ephemeral: true });
            }

            db.upgradeGuildPerk(myGuild.id, perk, cost);
            const perkName = perk === 'perk_xp_boost' ? '🌟 XP Boost' : '🏷️ Shop Discount';
            return interaction.reply(`🎊 The Guild **${myGuild.name}** has upgraded its **${perkName}** to Level ${currentPerkLevel + 1}!`);
        }

        if (sub === 'info') {
            await interaction.deferReply();
            let guildName = interaction.options.getString('name');
            let guild = null;

            if (guildName) {
                // Find by name
                guild = db.getPlayerGuildByName(guildName);
            } else {
                guild = db.getPlayerGuild(userId);
            }

            if (!guild) {
                return interaction.editReply(`❌ Guild not found. If you aren't in one, search by name!`);
            }

            const members = db.getGuildMembers(guild.id);
            const owner = members.find(m => m.role === 'Owner');
            
            // Generate Premium Canvas Card
            const canvas = createCanvas(800, 480);
            const ctx = canvas.getContext('2d');

            // Background gradient
            const bgGrad = ctx.createLinearGradient(0, 0, 800, 480);
            bgGrad.addColorStop(0, '#fed7aa');
            bgGrad.addColorStop(1, '#ffe4e6');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, 800, 480);

            // Banner image placeholder (Top half gradient)
            const bannerGrad = ctx.createLinearGradient(0, 0, 800, 150);
            bannerGrad.addColorStop(0, '#fca5a5');
            bannerGrad.addColorStop(1, '#fda4af');
            ctx.fillStyle = bannerGrad;
            ctx.fillRect(0, 0, 800, 150);

            // Frost glass body panel
            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(40, 100, 720, 340, 15);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // Guild Name & Owner
            ctx.fillStyle = '#881337';
            ctx.font = 'bold 45px "Segoe UI", "Segoe UI Emoji", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(guild.name, 400, 160);

            ctx.fillStyle = '#be123c';
            ctx.font = '20px "Segoe UI", "Segoe UI Emoji", sans-serif';
            ctx.fillText(`Owner ID: ${owner ? owner.userId : 'Unknown'}`, 400, 190);

            // Stats Columns
            ctx.textAlign = 'left';
            ctx.fillStyle = '#9f1239';
            ctx.font = '24px "Segoe UI", "Segoe UI Emoji", sans-serif';
            
            // Left Column: Bank & Level
            ctx.fillText(`🌸 Level: ${guild.level}`, 80, 260);
            ctx.fillText(`🎀 Members: ${members.length} / 50`, 80, 310);
            ctx.fillText(`🍒 Guild Bank: ${guild.bank_coins.toLocaleString()}`, 80, 360);
            ctx.fillText(`💌 Created: ${new Date(guild.created_at).toLocaleDateString()}`, 80, 410);

            // Right Column: Perks
            ctx.fillStyle = '#e11d48'; 
            ctx.fillText(`✨ Magical Perks:`, 450, 260);
            
            ctx.fillStyle = '#9f1239';
            ctx.font = '20px "Segoe UI", "Segoe UI Emoji", sans-serif';
            ctx.fillText(`• XP Boost: Lvl ${guild.perk_xp_boost || 0}`, 450, 300);
            ctx.fillText(`• Shop Discount: Lvl ${guild.perk_shop_discount || 0}`, 450, 340);
            
            const nextXpCost = ((guild.perk_xp_boost || 0) + 1) * 20000;
            const nextShopCost = ((guild.perk_shop_discount || 0) + 1) * 20000;
            ctx.fillStyle = '#be123c';
            ctx.font = '16px "Segoe UI", "Segoe UI Emoji", sans-serif';
            ctx.fillText(`Next XP Upgrade: 🍒 ${nextXpCost.toLocaleString()}`, 470, 320);
            ctx.fillText(`Next Shop Upgrade: 🍒 ${nextShopCost.toLocaleString()}`, 470, 360);

            const buffer = await canvas.encode('png');
            const attachment = new AttachmentBuilder(buffer, { name: 'guild-card.png' });

            const embed = new EmbedBuilder()
                .setColor('#fda4af')
                .setImage('attachment://guild-card.png');

            await interaction.editReply({ embeds: [embed], files: [attachment] });
        }
    }
};
