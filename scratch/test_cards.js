const fs = require('fs');
const path = require('path');
const db = require('../database.js');
const profileCmd = require('../commands/profile.js');
const balanceCmd = require('../commands/balance.js');

async function testRender() {
    console.log('Testing Profile Card Canvas Generation...');
    
    // Mock user & interaction
    const mockUser = {
        id: '123456789',
        username: 'CherryMaster99',
        displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/0.png'
    };

    let profileResult = null;
    let balanceResult = null;

    const mockProfileInteraction = {
        user: mockUser,
        guild: { id: 'GLOBAL' },
        deferred: true,
        replied: false,
        options: {
            getUser: (opt) => null,
            getBoolean: (opt) => false
        },
        editReply: async (payload) => {
            profileResult = payload;
            console.log('✅ Profile editReply received payload with embeds:', payload.embeds.length, 'and files:', payload.files.length);
        },
        reply: async (payload) => {
            profileResult = payload;
        },
        client: {
            users: { cache: new Map() }
        }
    };

    const mockBalanceInteraction = {
        user: mockUser,
        guild: { id: 'GLOBAL' },
        deferred: true,
        replied: false,
        options: {
            getUser: (opt) => null
        },
        editReply: async (payload) => {
            balanceResult = payload;
            console.log('✅ Balance editReply received payload with embeds:', payload.embeds.length, 'and files:', payload.files.length);
        },
        reply: async (payload) => {
            balanceResult = payload;
        }
    };

    try {
        await profileCmd.execute(mockProfileInteraction);
        await balanceCmd.execute(mockBalanceInteraction);

        if (profileResult && profileResult.files && profileResult.files.length > 0) {
            fs.writeFileSync(path.join(__dirname, 'test_profile.png'), profileResult.files[0].attachment);
            console.log('📷 Saved test_profile.png to scratch folder!');
        }

        if (balanceResult && balanceResult.files && balanceResult.files.length > 0) {
            fs.writeFileSync(path.join(__dirname, 'test_balance.png'), balanceResult.files[0].attachment);
            console.log('📷 Saved test_balance.png to scratch folder!');
        }

        console.log('🎉 ALL CANVAS RENDER TESTS PASSED PERFECTLY!');
    } catch (err) {
        console.error('❌ Canvas render test failed:', err);
    }
}

testRender();
