import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export const runtime = 'edge';

export default async function handler(req: Request) {
    // 1. Validate CORS and method
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        const { data } = await req.json();

        if (!data || typeof data !== 'string') {
            return new Response(JSON.stringify({ error: 'Nessun dato fornito per l\'analisi.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        // 2. Generate analysis using Vercel AI SDK
        const { text } = await generateText({
            model: openai('gpt-4o'),
            system: `Sei un Data Analyst e Product Manager esperto per una piattaforma E-Learning (idoneo.ai) che prepara ai concorsi pubblici.
Il tuo compito è analizzare dati grezzi o log forniti dagli amministratori (es. export da GA4, feedback degli utenti, drop-off rates) e fornire un report tattico.

Regole di risposta:
1. Sii chirurgico e azionabile. Fornisci 3-4 bullet point chiave.
2. Identifica colli di bottiglia o problemi di UX/UI evidenti.
3. Suggerisci azioni immediate (A/B test, modifiche al copy, gamification adjustments).
4. Rispondi in italiano professionale, usando formattazione Markdown semplice.`,
            prompt: `Ecco i dati grezzi estratti:\n\n${data.substring(0, 10000)}\n\nCosa noti di anomalo o cosa suggerisci di fare oggi per migliorare questi numeri?`,
        });

        return new Response(JSON.stringify({ analysis: text }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            status: 200,
        });
    } catch (e: any) {
        console.error('API Error /admin/analyze:', e);
        return new Response(JSON.stringify({ error: 'Errore durante l\'analisi AI.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
}
