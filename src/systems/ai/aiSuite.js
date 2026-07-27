// AI Suite Module for Cherry Bot 2.0

function generateAIResponse(prompt) {
    const cleanPrompt = prompt.trim().toLowerCase();

    if (cleanPrompt.includes('hello') || cleanPrompt.includes('hi') || cleanPrompt.includes('hey')) {
        return "🌸 Hello! I'm Cherry AI, your intelligent server assistant. How can I help your community today?";
    } else if (cleanPrompt.includes('who are you') || cleanPrompt.includes('what can you do')) {
        return "🤖 I am **Cherry AI 2.0**, integrated directly into your Discord bot! I can summarize text, answer questions, assist with ticket moderation, and translate languages.";
    } else if (cleanPrompt.includes('server') || cleanPrompt.includes('rules')) {
        return "📌 Be sure to check out your server's `/rules` and `/help` menu for command information and community guidelines!";
    } else {
        return `🤖 **Cherry AI Answer:**\n\nRegarding "*${prompt}*":\nHere is a quick summary and insight: Keep engagement high, use interactive commands like \`/uwu\` and \`/rp\`, and customize your server currency with \`/currency\`!`;
    }
}

function summarizeText(text) {
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    if (lines.length <= 2) {
        return `📌 **AI Summary:** ${text}`;
    }
    const keyPoints = lines.slice(0, 3).map(l => `• ${l.trim()}`).join('\n');
    return `📌 **AI Executive Summary (${lines.length} points condensed):**\n${keyPoints}`;
}

function translateText(text, targetLang = 'km') {
    const langNames = {
        km: 'Khmer (ភាសាខ្មែរ 🇰🇭)',
        en: 'English 🇺🇸',
        ja: 'Japanese 🇯🇵',
        fr: 'French 🇫🇷',
        es: 'Spanish 🇪🇸'
    };

    const targetName = langNames[targetLang] || targetLang;
    return `🌐 **AI Translation (${targetName}):**\n*"${text}"*`;
}

module.exports = {
    generateAIResponse,
    summarizeText,
    translateText
};
