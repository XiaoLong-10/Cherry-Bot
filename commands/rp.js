const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rp')
        .setDescription('🎭 Perform expressive RPG roleplay actions in chat & manage animated GIFs')
        .addSubcommand(sub =>
            sub.setName('hug')
                .setDescription('💖 Give another adventurer a warm hug')
                .addUserOption(opt => opt.setName('target').setDescription('Who to hug').setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('kiss')
                .setDescription('💋 Plant a sweet kiss on another adventurer')
                .addUserOption(opt => opt.setName('target').setDescription('Who to kiss').setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('slap')
                .setDescription('💥 Slap another adventurer across the face!')
                .addUserOption(opt => opt.setName('target').setDescription('Who to slap').setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('pat')
                .setDescription('👋 Gently pat another adventurer on the head')
                .addUserOption(opt => opt.setName('target').setDescription('Who to pat').setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('highfive')
                .setDescription('🙌 Share a high-five with another adventurer')
                .addUserOption(opt => opt.setName('target').setDescription('Who to high-five').setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('wave')
                .setDescription('👋 Wave hello to someone')
                .addUserOption(opt => opt.setName('target').setDescription('Who to wave to').setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('bow')
                .setDescription('🙇 Bow respectfully')
                .addUserOption(opt => opt.setName('target').setDescription('Who to bow to').setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('laugh')
                .setDescription('😆 Burst out laughing'))
        .addSubcommand(sub =>
            sub.setName('cry')
                .setDescription('😢 Weep in sorrow'))
        .addSubcommand(sub =>
            sub.setName('dance')
                .setDescription('🕺 Bust some epic dance moves'))
        .addSubcommand(sub =>
            sub.setName('sleep')
                .setDescription('😴 Curl up and fall fast asleep'))
        .addSubcommand(sub =>
            sub.setName('sit')
                .setDescription('🪑 Sit down to rest your legs'))
        .addSubcommand(sub =>
            sub.setName('cheer')
                .setDescription('🎉 Cheer loudly')
                .addUserOption(opt => opt.setName('target').setDescription('Who to cheer for').setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('boop')
                .setDescription('👉 Boop another adventurer on the nose!')
                .addUserOption(opt => opt.setName('target').setDescription('Who to boop').setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('cuddle')
                .setDescription('🤗 Cuddle up closely with someone warm')
                .addUserOption(opt => opt.setName('target').setDescription('Who to cuddle').setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('nuzzle')
                .setDescription('🐱 Nuzzle affectionately against someone')
                .addUserOption(opt => opt.setName('target').setDescription('Who to nuzzle').setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('pout')
                .setDescription('🥺 Pout cutely when you don\'t get your way')
                .addUserOption(opt => opt.setName('target').setDescription('Who to pout at').setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('blush')
                .setDescription('😳 Blush with affection or embarrassment'))
        .addSubcommand(sub =>
            sub.setName('bite')
                .setDescription('🦷 Playfully bite another adventurer!')
                .addUserOption(opt => opt.setName('target').setDescription('Who to bite').setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('addgif')
                .setDescription('🖼️ Add a custom animated GIF to multi-loop pool')
                .addStringOption(opt => opt.setName('action').setDescription('Action key (hug, kiss, pat, etc.)').setRequired(true))
                .addStringOption(opt => opt.setName('url').setDescription('Direct GIF image URL').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('listgifs')
                .setDescription('📜 View custom animated GIFs in multi-loop library')
                .addStringOption(opt => opt.setName('action').setDescription('Filter by action key').setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('removegif')
                .setDescription('🗑️ Remove a custom GIF from multi-loop pool')
                .addIntegerOption(opt => opt.setName('id').setDescription('ID of custom GIF to remove').setRequired(true))),

    async execute(interaction) {
        await interaction.deferReply();

        const subcommand = interaction.options.getSubcommand();
        const { ROLEPLAY_ACTIONS, buildRoleplayEmbed } = require('../src/systems/roleplayEngine.js');

        // Subcommand 1: addgif
        if (subcommand === 'addgif') {
            const rawAction = interaction.options.getString('action').toLowerCase().replace(/^k/, '');
            const url = interaction.options.getString('url').trim();

            if (!ROLEPLAY_ACTIONS[rawAction]) {
                return interaction.editReply(`⚠️ **Invalid Action!** Valid actions: \`${Object.keys(ROLEPLAY_ACTIONS).join(', ')}\``);
            }

            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                return interaction.editReply('⚠️ **Invalid URL!** URL must start with `http://` or `https://`.');
            }

            db.addCustomRoleplayGif(rawAction, url, interaction.user.username);
            const embed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setTitle('✨ Custom Animated GIF Saved!')
                .setDescription(`Successfully added new GIF for **${rawAction.toUpperCase()}**!\nIt will now multi-loop when using \`/rp ${rawAction}\` or \`k${rawAction}\`.`)
                .setImage(url)
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        }

        // Subcommand 2: listgifs
        if (subcommand === 'listgifs') {
            const filterAction = interaction.options.getString('action')?.toLowerCase().replace(/^k/, '');
            const gifs = filterAction ? db.getCustomRoleplayGifs(filterAction) : db.getAllCustomRoleplayGifs();

            if (!gifs || gifs.length === 0) {
                return interaction.editReply(filterAction ? `ℹ️ No custom GIFs found for **${filterAction}**.` : 'ℹ️ No custom GIFs found. Add one with `/rp addgif`!');
            }

            const lines = gifs.slice(0, 15).map(g => `**[ID ${g.id}]** \`${g.actionKey}\` added by ${g.addedBy}: ${g.gifUrl}`);
            const embed = new EmbedBuilder()
                .setColor('#3498DB')
                .setTitle('🖼️ Custom Animated GIFs Library')
                .setDescription(lines.join('\n') + (gifs.length > 15 ? `\n*...and ${gifs.length - 15} more*` : ''))
                .setFooter({ text: 'Use /rp removegif id:<id> to remove a custom GIF.' })
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        }

        // Subcommand 3: removegif
        if (subcommand === 'removegif') {
            const targetId = interaction.options.getInteger('id');
            const removed = db.removeCustomRoleplayGif(targetId);
            if (removed) {
                return interaction.editReply(`✅ Successfully removed custom GIF **ID ${targetId}** from multi-loop library!`);
            } else {
                return interaction.editReply(`⚠️ No custom GIF found with **ID ${targetId}**.`);
            }
        }

        // Default Roleplay Actions
        const target = interaction.options.getUser('target') || interaction.user;
        const rpEmbed = await buildRoleplayEmbed(subcommand, interaction.user, target);

        if (rpEmbed) {
            await interaction.editReply({ embeds: [rpEmbed] });
        } else {
            await interaction.editReply({ content: 'Failed to generate roleplay action.' });
        }
    }
};
