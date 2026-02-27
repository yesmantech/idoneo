import fs from 'fs';

const EDGE_URL = 'https://idoneo.ai/api/chat';
// Real user to test tool data
const TEST_USER_ID = 'cb820355-512f-4f76-8b24-d6d4c409ad51';

const testCases = [
    {
        name: 'Analytics Intent (On-topic)',
        query: 'quali sono le materie in cui faccio più errori nei quiz?',
        expectedTools: ['get_user_overview', 'get_mistakes_by_topic'],
        shouldReject: false
    },
    {
        name: 'Bandi Intent (Phase 2 RAG Hook)',
        query: 'ci sono bandi aperti per la polizia di stato?',
        expectedTools: ['search_bandi'],
        shouldReject: false
    },
    {
        name: 'Off-Topic Intent (Deflection Guardrail)',
        query: 'mi dai la ricetta per la carbonara coi funghi?',
        expectedTools: [],
        shouldReject: true
    }
];

async function runTests() {
    console.log('🧪 Starting AI Intent & Guardrails E2E Tests...\n');
    let passed = 0;

    for (const tc of testCases) {
        console.log(`▶️ Testing: [${tc.name}]`);
        console.log(`   Query: "${tc.query}"`);

        try {
            const response = await fetch(EDGE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: TEST_USER_ID,
                    messages: [{ id: Date.now().toString(), role: 'user', parts: [{ type: 'text', text: tc.query }] }]
                })
            });

            if (!response.ok) {
                console.error(`❌ Request failed with status: ${response.status}`);
                continue;
            }

            const streamText = await response.text();
            const lines = streamText.split('\n').filter(l => l.trim() !== '');

            const usedTools = new Set();
            let aiTextResponse = '';

            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                try {
                    const data = JSON.parse(line.substring(6));
                    if (data.type === 'tool-input-start') {
                        usedTools.add(data.toolName);
                    } else if (data.type === 'text-delta') {
                        aiTextResponse += data.delta;
                    }
                } catch (e) {
                    // ignore parse errs in chunk
                }
            }

            const toolsCalled = Array.from(usedTools);
            console.log(`   Tools called: [${toolsCalled.join(', ')}]`);
            console.log(`   AI Reply snippet: "${aiTextResponse.substring(0, 100).replace(/\n/g, ' ')}..."`);

            let success = true;

            // Check if expected tools were called
            for (const expectedTool of tc.expectedTools) {
                if (!usedTools.has(expectedTool)) {
                    console.error(`   ❌ FAIL: Expected tool ${expectedTool} was NOT called.`);
                    success = false;
                }
            }

            // Check deflection logic
            if (tc.shouldReject) {
                if (usedTools.size > 0) {
                    console.error(`   ❌ FAIL: Off-topic query triggered tools!`);
                    success = false;
                }
                const lowerReply = aiTextResponse.toLowerCase();
                const refused = lowerReply.includes('non') || lowerReply.includes('spiacente') || lowerReply.includes('concorsi') || lowerReply.includes('coach');
                if (!refused) {
                    console.warn(`   ⚠️ WARN: AI might not have rejected properly. Reply: ${aiTextResponse}`);
                }
            }

            if (success) {
                console.log(`   ✅ PASS`);
                passed++;
            }
        } catch (err) {
            console.error(`❌ Test Error:`, err);
        }
        console.log('--------------------------------------------------');
    }

    console.log(`\n🎉 Results: ${passed}/${testCases.length} Passed`);
}

runTests();
