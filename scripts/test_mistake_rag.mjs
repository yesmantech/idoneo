import fs from 'fs';

const EDGE_URL = 'https://idoneo.ai/api/chat';
// Using a known test user ID that has recent mistakes in the database
const TEST_USER_ID = 'cb820355-512f-4f76-8b24-d6d4c409ad51';

const testQuery = "dimmi esattamente in quali argomenti di dettaglio, regole o tipologie di domande faccio più errori, leggendo le mie ultime risposte sbagliate. Voglio un'analisi chirurgica.";

async function runRAGTest() {
    console.log('🧪 AI Assistant - Advanced Mistake Pattern RAG Test');
    console.log(`   Endpoint: ${EDGE_URL}`);
    console.log(`   User: ${TEST_USER_ID}`);
    console.log('==================================================\n');

    console.log(`▶️  Query: "${testQuery}"\n`);

    try {
        const response = await fetch(EDGE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: TEST_USER_ID,
                messages: [{ id: Date.now().toString(), role: 'user', parts: [{ type: 'text', text: testQuery }] }]
            })
        });

        if (!response.ok) {
            console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
            const body = await response.text();
            console.error(`Body: ${body.substring(0, 500)}`);
            return;
        }

        const streamText = await response.text();
        const lines = streamText.split('\n').filter(l => l.trim() !== '');

        const usedTools = new Set();
        let aiTextResponse = '';
        let toolData = null;

        for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
                const data = JSON.parse(line.substring(6));
                if (data.type === 'tool-input-start') {
                    usedTools.add(data.toolName);
                } else if (data.type === 'tool-result' && data.toolName === 'analyze_mistake_patterns') {
                    toolData = data.result;
                } else if (data.type === 'text-delta') {
                    aiTextResponse += data.delta;
                    process.stdout.write(data.delta); // Stream securely to console
                }
            } catch (e) {
                // ignore
            }
        }

        console.log('\n\n--------------------------------------------------');
        const toolsCalled = Array.from(usedTools);
        console.log(`🛠️  Tools called: [${toolsCalled.join(', ')}]`);

        if (toolsCalled.includes('analyze_mistake_patterns')) {
            console.log(`✅ SUCCESS: The AI correctly understood to use the RAG mistake tool.`);

            if (toolData && typeof toolData === 'string') {
                try {
                    const parsedData = JSON.parse(toolData);
                    console.log(`📄 Found ${parsedData.length} raw mistake records extracted for the AI.`);
                } catch (e) { }
            }
        } else {
            console.log(`❌ FAIL: The AI did not use analyze_mistake_patterns. Tools used: ${toolsCalled.join(', ')}`);
        }

    } catch (err) {
        console.error(`❌ Connection Error:`, err.message || err);
    }
}

runRAGTest();
