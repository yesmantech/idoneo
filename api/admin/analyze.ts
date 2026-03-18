import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // 1. Validate CORS and method
    if (req.method === 'OPTIONS') {
        return res.status(200).json(null);
    }

    if (req.method !== 'POST') {
        return res.status(405).send('Method not allowed');
    }

    // SEC-002 FIX: Verify admin role via JWT
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const supabaseAuth = createClient(
            process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
            process.env.VITE_SUPABASE_ANON_KEY || ''
        );
        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
        if (authError || !user) {
            return res.status(401).json({ error: 'Unauthorized: invalid token' });
        }
        // Check admin role
        const adminSupabase = createClient(
            process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
            process.env.SUPABASE_SERVICE_ROLE_KEY || ''
        );
        const { data: profile } = await adminSupabase.from('profiles').select('role').eq('id', user.id).single();
        if (!profile || profile.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: admin access required' });
        }
    } catch (e) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const { data } = req.body;

        if (!data || typeof data !== 'string') {
            return res.status(400).json({ error: 'Nessun dato fornito per l\'analisi.' });
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

        return res.status(200).json({ analysis: text });
    } catch (e: any) {
        console.error('API Error /admin/analyze:', e);
        return res.status(500).json({ error: 'Errore durante l\'analisi AI.' });
    }
}
