const {SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const db = require('../database.js');

const COOLDOWN_MS = 60 * 60 * 1000; // 1 hour cooldown
const workCooldowns = new Map();

const CAREERS = [
    {
        id: 'apprentice',
        name: 'Novice Apprentice 🧹',
        salary: 150,
        reqSkill: null,
        skillName: 'combat',
        desc: 'Perform light chores and run errands around the guild hall.'
    },
    {
        id: 'smith',
        name: 'Master Blacksmith 🔨',
        salary: 380,
        reqSkill: 5,
        skillName: 'smithing',
        desc: 'Forge weapons and repair steel armor plates for active soldiers.'
    },
    {
        id: 'alchemist',
        name: 'High Alchemist 🧪',
        salary: 500,
        reqSkill: 8,
        skillName: 'alchemy',
        desc: 'Brew restoration mixtures and distill unstable elements.'
    },
    {
        id: 'chef',
        name: 'Chef de Cuisine 🍳',
        salary: 620,
        reqSkill: 10,
        skillName: 'cooking',
        desc: 'Prepare seared steaks and grand culinary feasts for returning raiders.'
    },
    {
        id: 'magus',
        name: 'Grand Magus 🔮',
        salary: 950,
        reqSkill: 15,
        skillName: 'magic',
        desc: 'Manipulate elemental anomalies and lecture apprentices on magic circles.'
    }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('work')
        .setDescription('💼 Work a shift to earn passive cherries and level up your skills!'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild ? (interaction.guild ? interaction.guild.id : 'GLOBAL') : 'GLOBAL';

        // 1. Verify Character
        const char = db.getCharacter(userId);
        if (!char || !char.char_name) {
            return interaction.reply({
                content: '⚠️ **You must create an RPG character first!**\nUse **`/character create`** to get started.',
                flags: MessageFlags.Ephemeral
            });
        }

        // 2. Cooldown check
        const now = Date.now();
        if (workCooldowns.has(userId)) {
            const expiration = workCooldowns.get(userId);
            if (now < expiration) {
                const remainingMin = Math.ceil((expiration - now) / 60000);
                return interaction.reply({
                    content: `⏳ **You are exhausted!** Please rest before starting another shift. Returns in **${remainingMin} minutes**.`,
                    flags: MessageFlags.Ephemeral
                });
            }
        }

        // 3. Determine best career unlocked
        let activeCareer = CAREERS[0];
        for (let i = CAREERS.length - 1; i >= 0; i--) {
            const career = CAREERS[i];
            if (!career.reqSkill) continue;
            
            // Get user level for the required skill
            const skillLevel = char[`skill_${career.skillName}`] || 1;
            if (skillLevel >= career.reqSkill) {
                activeCareer = career;
                break;
            }
        }

        // 4. Award rewards
        db.addCoins(userId, guildId, activeCareer.salary);
        db.logTransaction(userId, 'Work Salary', `Worked as ${activeCareer.name} and earned 🍒 ${activeCareer.salary}`);
        
        // Reward 3 points of XP in that career skill
        const newLvl = db.increaseSkill(userId, activeCareer.skillName, 3);
        
        // Add cooldown
        workCooldowns.set(userId, now + COOLDOWN_MS);

        const newBalance = db.getBalance(userId, guildId);

        const workEmbed = new EmbedBuilder()
            .setColor('#38bdf8')
            .setTitle(`💼 SHIFT COMPLETED!`)
            .setDescription(
                `You reported for duty at your workstation:\n` +
                `### **${activeCareer.name}**\n*${activeCareer.desc}*\n\n` +
                `• **Earnings:** 🍒 **${activeCareer.salary} cherries**\n` +
                `• **Skill Growth:** Worked hard! **${activeCareer.skillName.toUpperCase()}** increased (now **Lvl ${newLvl}**)\n\n` +
                `• **Remaining Purse:** 🍒 **${newBalance.toLocaleString()} cherries**`
            )
            .setTimestamp();

        await interaction.reply({ embeds: [workEmbed] });
    }
};
