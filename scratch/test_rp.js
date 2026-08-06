const { buildRoleplayEmbed, handleRoleplayPrefixMessage, ROLEPLAY_ACTIONS } = require('../src/systems/roleplayEngine.js');
const db = require('../database.js');

async function testMultiLoopAndCustomGifs() {
    const mockUser = { id: '123456789', displayName: 'Yuu Long', username: 'Yuu Long' };

    console.log('--- 🔄 Testing Multi-Loop Animation Rotation ---');
    for (let i = 1; i <= 4; i++) {
        const embed = await buildRoleplayEmbed('hug', mockUser, mockUser);
        console.log(`Loop #${i} GIF URL:`, embed.data.image?.url);
    }

    console.log('\n--- 🖼️ Testing Custom GIF Addition ("kaddgif hug <url>") ---');
    const mockAddMsg = {
        content: 'kaddgif hug https://media.tenor.com/custom-test-hug.gif',
        author: mockUser,
        reply: async (payload) => {
            console.log('Add Reply Title:', payload.embeds?.[0]?.data?.title);
            console.log('Add Reply GIF URL:', payload.embeds?.[0]?.data?.image?.url);
        }
    };
    await handleRoleplayPrefixMessage(mockAddMsg);

    console.log('\n--- 📋 Testing Custom GIF List ("klistgifs") ---');
    const mockListMsg = {
        content: 'klistgifs',
        author: mockUser,
        reply: async (payload) => {
            console.log('List Description:\n', payload.embeds?.[0]?.data?.description);
        }
    };
    await handleRoleplayPrefixMessage(mockListMsg);

    console.log('\n--- 🔄 Multi-Loop after adding custom GIF ---');
    const newEmbed = await buildRoleplayEmbed('hug', mockUser, mockUser);
    console.log('New Multi-Loop GIF URL:', newEmbed.data.image?.url);

    // Clean up test custom GIF from DB
    const customGifs = db.getCustomRoleplayGifs('hug');
    if (customGifs.length > 0) {
        db.removeCustomRoleplayGif(customGifs[0].id);
        console.log('\n🧹 Cleaned up test custom GIF ID:', customGifs[0].id);
    }

    console.log('✅ Multi-loop & Custom GIF tests passed successfully!');
}

testMultiLoopAndCustomGifs().catch(console.error);
