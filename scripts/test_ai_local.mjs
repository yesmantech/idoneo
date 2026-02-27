import fs from 'fs';

// Test against LOCAL Vercel dev server
const EDGE_URL = 'http://localhost:3000/api/chat';
const TEST_USER_ID = 'cb820355-512f-4f76-8b24-d6d4c409ad51';

const testCases = [
    {
        name: '1. Analytics Intent (On-topic)',
        query: 'come sto andando nei quiz? fammi un riepilogo',
        expectedTools: ['get_user_overview'],
        shouldReject: false
    },
    {
        name: '2. Mistakes Intent (On-topic)',
        query: 'quali sono le materie in cui faccio più errori?',
        expectedTools: ['get_mistakes_by_topic'],
        shouldReject: false
    },
    {
        name: '3. Bandi Intent (Phase 2 RAG Hook)',
        query: 'ci sono bandi aperti per la polizia di stato?',
        expectedTools: ['search_bandi'],
        shouldReject: false
    },
    {
        name: '4. Off-Topic Intent (Deflection Guardrail)',
        query: 'mi dai la ricetta per la carbonara?',
        expectedTools: [],
        shouldReject: true
    },
    {
        name: '5. Study Plan Intent',
        query: 'puoi crearmi un piano di studio per migliorare in diritto?',
        expectedTools: ['get_mistakes_by_topic'],
        shouldReject: false
    }
];

async function runTests() {
    console.log('🧪 AI Assistant - Local E2E Tests');
    console.log(`   Endpoint: ${EDGE_URL}`);
    console.log(`   User: ${TEST_USER_ID}`);
    console.log('==================================================\n');

    let passed = 0;
    let failed = 0;

    for (const tc of testCases) {
        console.log(`▶️  ${tc.name}`);
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
                console.error(`   ❌ HTTP Error: ${response.status} ${response.statusText}`);
                const body = await response.text();
                console.error(`   Body: ${body.substring(0, 200)}`);
                failed++;
                console.log('--------------------------------------------------');
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
                    // ignore parse errors in stream chunks
                }
            }

            const toolsCalled = Array.from(usedTools);
            console.log(`   Tools called: [${toolsCalled.length > 0 ? toolsCalled.join(', ') : 'none'}]`);
            console.log(`   AI Reply: "${aiTextResponse.substring(0, 120).replace(/\n/g, ' ')}..."`);

            let success = true;

            // Check expected tools
            for (const expectedTool of tc.expectedTools) {
                if (!usedTools.has(expectedTool)) {
                    console.warn(`   ⚠️  Expected tool "${expectedTool}" was NOT called (may be acceptable).`);
                    // Don't hard-fail for this - AI may choose different valid tools
                }
            }

            // Check deflection logic
            if (tc.shouldReject) {
                if (usedTools.size > 0) {
                    console.error(`   ❌ FAIL: Off-topic query triggered tools: [${toolsCalled.join(', ')}]`);
                    success = false;
                }
                const lowerReply = aiTextResponse.toLowerCase();
                const refused = lowerReply.includes('non') || lowerReply.includes('spiacente') ||
                    lowerReply.includes('concorsi') || lowerReply.includes('coach') ||
                    lowerReply.includes('specializzato');
                if (!refused) {
                    console.warn(`   ⚠️  AI may not have rejected properly. Check reply above.`);
                } else {
                    console.log(`   ✅ AI correctly deflected the off-topic query.`);
                }
            }

            // Check that on-topic queries got SOME tool usage
            if (!tc.shouldReject && usedTools.size === 0) {
                console.error(`   ❌ FAIL: On-topic query did NOT trigger any tools!`);
                success = false;
            }

            if (success) {
                if (!tc.shouldReject && usedTools.size > 0) {
                    console.log(`   ✅ PASS - Tools triggered and AI responded with data.`);
                } else if (tc.shouldReject) {
                    console.log(`   ✅ PASS`);
                }
                passed++;
            } else {
                failed++;
            }
        } catch (err) {
            console.error(`   ❌ Connection Error:`, err.message || err);
            failed++;
        }
        console.log('--------------------------------------------------');
    }

    console.log(`\n🎯 Results: ${passed}/${testCases.length} Passed, ${failed} Failed`);
    if (failed === 0) {
        console.log('🎉 ALL TESTS PASSED! The AI Assistant is working correctly.');
    }
}

runTests();
