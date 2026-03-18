import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
    supportsResponseStreaming: true,
};

import { streamText, tool, convertToModelMessages, stepCountIs, embed } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

// We need an OpenAI API Key. In Vercel, this comes from process.env.OPENAI_API_KEY
const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS: Allow all Capacitor/WebView origins for native streaming
    const allowedOrigins = ['capacitor://localhost', 'https://localhost', 'http://localhost', 'https://idoneo.ai'];
    const origin = req.headers.origin || '';
    if (allowedOrigins.includes(origin) || origin === '') {
        // Allow the specific origin, or '*' if no origin header (WKWebView native fetch)
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'false');

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const { messages } = body || {};

        // SEC-001 FIX: Extract userId from JWT instead of trusting client-sent value
        const authHeader = req.headers.authorization;
        const token = authHeader?.replace('Bearer ', '');
        let userId: string | null = null;

        if (token) {
            // Verify the JWT with Supabase to get the authenticated user
            const { data: { user }, error: authError } = await createClient(
                process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
                process.env.VITE_SUPABASE_ANON_KEY || ''
            ).auth.getUser(token);

            if (authError || !user) {
                return res.status(401).json({ error: 'Unauthorized: invalid token' });
            }
            userId = user.id;
        } else {
            // Fallback: try client-sent userId (backwards compatibility during migration)
            userId = body?.userId;
        }

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized: authentication required' });
        }

        // SEC-017 FIX: Input validation — prevent unbounded memory/token abuse
        const incomingMessages = messages || [];
        if (!Array.isArray(incomingMessages)) {
            return res.status(400).json({ error: 'Invalid messages format' });
        }
        if (incomingMessages.length > 50) {
            return res.status(400).json({ error: 'Too many messages (max 50)' });
        }
        for (const msg of incomingMessages) {
            const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content || '');
            if (content.length > 10000) {
                return res.status(400).json({ error: 'Message too long (max 10000 chars)' });
            }
        }

        // Convert UIMessages (from useChat frontend) to ModelMessages (for streamText)
        const modelMessages = await convertToModelMessages(incomingMessages);

        // No artificial delay — OpenAI's natural latency provides enough "thinking" time

        const result = streamText({
            model: openai('gpt-4o-mini'),
            stopWhen: stepCountIs(2),
            messages: modelMessages,
            system: `Sei l'Assistente 360° di idoneo.ai, un coach esperto per i concorsi pubblici.
Il tuo tono è professionale, incoraggiante, conciso e verticale.
Il tuo obiettivo è aiutare l'utente a migliorare nei quiz misurando i suoi dati reali.

VELOCITÀ (REGOLA CRITICA):
- Per saluti, domande generiche, off-topic o domande sulla piattaforma: rispondi SUBITO senza usare tools.
- Usa i tools SOLO quando l'utente chiede specificamente dei suoi dati, statistiche, errori o consigli personalizzati.
- Quando usi i tools, chiama TUTTI quelli necessari nello stesso step (in parallelo), NON uno alla volta.

USO DEI TOOLS (quando servono):
- "get_user_overview": per vedere statistiche generali e concorsi attivi.
- "get_mistakes_by_topic": per vedere in quali materie fa più errori.
- "analyze_mistake_patterns": per il testo letterale delle domande sbagliate. Usalo DOPO get_mistakes_by_topic, solo se l'utente chiede dettagli specifici sugli errori.
- "search_bandi": OBBLIGATORIO se l'utente chiede di bandi, concorsi aperti, date o requisiti.
- "orientamento_bandi": se l'utente chiede orientamento su quale concorso scegliere.

REGOLA SUI CONCORSI:
- Il tool "get_user_overview" restituisce anche i concorsi a cui si sta preparando. Cita i concorsi per nome!

REGOLA SULLA PRECISIONE:
- Riporta SOLO i numeri esatti dai tools. NON inventare numeri.
- L'accuratezza è già calcolata: usala direttamente.

Rispondi basandoti sui dati emersi. Usa elenchi puntati e markdown. NON inventare regole sui concorsi.

REGOLA OFF-TOPIC: Se interpellato su argomenti fuori contesto, declina educatamente.
REGOLA DIVIETO SERVIZI ESTERNI: NON suggerire servizi esterni. L'unico sito esterno consigliabile è InPA (https://www.inpa.gov.it). NON menzionare piattaforme concorrenti.

CONOSCENZA PIATTAFORMA:
- Simulazioni e Allenamento per categoria
- XP e Leghe (Classifica)
- Streak (giorni consecutivi)
- Statistiche Avanzate
- Bandi e Concorsi
- Template Prova Personalizzata`,
            tools: {
                get_user_overview: tool({
                    description: 'Recupera le performance generali dell\'utente: quiz completati, risposte corrette, errate e omesse, accuratezza, durata media. Usalo per avere un\'idea del livello generale.',
                    inputSchema: z.object({
                        range_days: z.number().describe('Il numero di giorni passati da analizzare (es. 7, 30)')
                    }),
                    execute: async ({ range_days }) => {
                        try {
                            const startDate = new Date();
                            startDate.setDate(startDate.getDate() - range_days);

                            const { data: stats, error } = await supabase
                                .from('quiz_attempts')
                                .select('correct, wrong, blank, total_questions, duration_seconds, score, quiz_id')
                                .eq('user_id', userId)
                                .gte('created_at', startDate.toISOString());

                            if (error || !stats || stats.length === 0) {
                                return JSON.stringify({
                                    message: 'Nessun quiz completato nel periodo selezionato',
                                    quiz_completati: 0,
                                    timeframe_days: range_days,
                                    concorsi_attivi: []
                                });
                            }

                            const totalCorrect = stats.reduce((acc, s) => acc + (s.correct || 0), 0);
                            const totalWrong = stats.reduce((acc, s) => acc + (s.wrong || 0), 0);
                            const totalBlank = stats.reduce((acc, s) => acc + (s.blank || 0), 0);
                            const totalQuestions = totalCorrect + totalWrong + totalBlank;
                            const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
                            const avgDuration = Math.round(stats.reduce((acc, s) => acc + (s.duration_seconds || 0), 0) / stats.length);
                            const avgScore = Math.round(stats.reduce((acc, s) => acc + (s.score || 0), 0) / stats.length);

                            const quizIds = [...new Set(stats.map(s => s.quiz_id).filter(Boolean))];
                            let concorsiAttivi: any[] = [];

                            if (quizIds.length > 0) {
                                const { data: quizzes } = await supabase
                                    .from('quizzes')
                                    .select('id, title, slug')
                                    .in('id', quizIds);

                                if (quizzes) {
                                    concorsiAttivi = quizzes.map(q => {
                                        const qStats = stats.filter(s => s.quiz_id === q.id);
                                        const qCorrect = qStats.reduce((acc, s) => acc + (s.correct || 0), 0);
                                        const qWrong = qStats.reduce((acc, s) => acc + (s.wrong || 0), 0);
                                        const qBlank = qStats.reduce((acc, s) => acc + (s.blank || 0), 0);
                                        const qTotal = qCorrect + qWrong + qBlank;
                                        return {
                                            nome_concorso: q.title,
                                            quiz_completati: qStats.length,
                                            risposte_corrette: qCorrect,
                                            risposte_errate: qWrong,
                                            risposte_omesse: qBlank,
                                            accuratezza_percentuale: qTotal > 0 ? Math.round((qCorrect / qTotal) * 100) : 0
                                        };
                                    });
                                }
                            }

                            return JSON.stringify({
                                quiz_completati: stats.length,
                                domande_totali: totalQuestions,
                                risposte_corrette: totalCorrect,
                                risposte_errate: totalWrong,
                                risposte_omesse: totalBlank,
                                accuratezza_percentuale: accuracy,
                                punteggio_medio: avgScore,
                                durata_media_secondi: avgDuration,
                                timeframe_days: range_days,
                                concorsi_attivi: concorsiAttivi
                            });
                        } catch (e: any) {
                            console.error('get_user_overview error:', e);
                            return JSON.stringify({ message: 'Errore temporaneo nel recupero dati. Riprova.', error: e.message });
                        }
                    }
                }),

                get_mistakes_by_topic: tool({
                    description: 'Recupera le materie dove l\'utente fa più errori, con dettaglio correct/wrong/skipped per materia.',
                    inputSchema: z.object({
                        limit: z.number().describe('Quanti materie restituire al massimo')
                    }),
                    execute: async ({ limit }) => {
                        try {
                            const { data: attempts, error } = await supabase
                                .from('quiz_attempts')
                                .select('answers')
                                .eq('user_id', userId)
                                .order('created_at', { ascending: false })
                                .limit(30);

                            if (error || !attempts || attempts.length === 0) {
                                return JSON.stringify({ message: 'Nessun dato disponibile sulle risposte per materia' });
                            }

                            const statsById: Record<string, { correct: number; wrong: number; skipped: number }> = {};
                            for (const attempt of attempts) {
                                if (!attempt.answers || !Array.isArray(attempt.answers)) continue;
                                for (const ans of attempt.answers as any[]) {
                                    const sId = ans.subjectId;
                                    if (!sId) continue;

                                    if (!statsById[sId]) statsById[sId] = { correct: 0, wrong: 0, skipped: 0 };
                                    if (ans.isCorrect === true) {
                                        statsById[sId].correct++;
                                    } else if (ans.isSkipped === true) {
                                        statsById[sId].skipped++;
                                    } else {
                                        statsById[sId].wrong++;
                                    }
                                }
                            }

                            const subjectIds = Object.keys(statsById);
                            let idToNameMap: Record<string, string> = {};

                            if (subjectIds.length > 0) {
                                const { data: subjectsData } = await supabase
                                    .from('subjects')
                                    .select('id, name')
                                    .in('id', subjectIds);

                                if (subjectsData) {
                                    subjectsData.forEach(s => {
                                        idToNameMap[s.id] = s.name;
                                    });
                                }
                            }

                            const results = Object.entries(statsById)
                                .map(([sId, s]) => {
                                    const total = s.correct + s.wrong + s.skipped;
                                    return {
                                        materia: idToNameMap[sId] || 'Materia Sconosciuta',
                                        risposte_corrette: s.correct,
                                        risposte_errate: s.wrong,
                                        risposte_omesse: s.skipped,
                                        domande_totali: total,
                                        accuratezza_percentuale: total > 0 ? Math.round((s.correct / total) * 100) : 0
                                    };
                                })
                                .sort((a, b) => b.risposte_errate - a.risposte_errate)
                                .slice(0, limit);

                            return JSON.stringify(results);
                        } catch (e: any) {
                            console.error('get_mistakes_by_topic error:', e);
                            return JSON.stringify({ message: 'Errore temporaneo nel recupero errori per materia.', error: e.message });
                        }
                    }
                }),

                analyze_mistake_patterns: tool({
                    description: 'Recupera il testo letterale (Domanda, Opzioni, Risposta Giusta) delle ultime domande sbagliate o omesse dall\'utente. Funge da "RAG" per permetterti di dedurre pattern, tipologie o "folder" specifici di errore.',
                    inputSchema: z.object({
                        subject_id: z.string().optional().describe('Se forzato dall\'utente o dedotto dal contesto, filtra l\'analisi solo su una materia specifica. Altrimenti omettilo per analizzare tutto.'),
                        limit: z.number().default(20).describe('Numero massimo di domande sbagliate da estrarre per l\'analisi (max 50, default 20).')
                    }),
                    execute: async ({ subject_id, limit }) => {
                        try {
                            const { data: attempts, error } = await supabase
                                .from('quiz_attempts')
                                .select('answers')
                                .eq('user_id', userId)
                                .order('created_at', { ascending: false })
                                .limit(10);

                            if (error || !attempts || attempts.length === 0) {
                                return JSON.stringify({ message: 'Nessun quiz superato di recente per poterne estrarre le domande sbagliate.' });
                            }

                            const mistakes = [];
                            const rawErrors = [];
                            const uniqueActionSubjectIds = new Set<string>();

                            for (const attempt of attempts) {
                                if (!attempt.answers || !Array.isArray(attempt.answers)) continue;
                                for (const ans of attempt.answers as any[]) {
                                    if (ans.isCorrect === false || ans.isSkipped === true) {
                                        rawErrors.push(ans);
                                        if (ans.subjectId) uniqueActionSubjectIds.add(ans.subjectId);
                                    }
                                }
                            }

                            const idToNameMap: Record<string, string> = {};
                            if (uniqueActionSubjectIds.size > 0) {
                                const subjectIds = Array.from(uniqueActionSubjectIds).filter(id => id.length === 36);
                                if (subjectIds.length > 0) {
                                    const { data: subjectsData } = await supabase
                                        .from('subjects')
                                        .select('id, name')
                                        .in('id', subjectIds);
                                    if (subjectsData) {
                                        subjectsData.forEach(s => { idToNameMap[s.id] = s.name; });
                                    }
                                }
                            }

                            for (const ans of rawErrors) {
                                const realName = ans.subjectId ? (idToNameMap[ans.subjectId] || ans.subjectName || 'Sconosciuta') : (ans.subjectName || 'Sconosciuta');

                                if (subject_id && !realName.toLowerCase().includes(subject_id.toLowerCase())) continue;

                                mistakes.push({
                                    materia: realName,
                                    testo_domanda: ans.text?.substring(0, 150) + '...',
                                    risposta_esatta: ans.options?.[ans.correctOption]?.substring(0, 100) || 'N/A',
                                    spiegazione: ans.explanation ? 'Presente' : 'Assente',
                                });

                                if (mistakes.length >= limit) break;
                            }

                            if (mistakes.length === 0) {
                                return JSON.stringify({ message: 'Nessun errore specifico combacia con la materia richiesta nei quiz recenti.' });
                            }

                            return JSON.stringify(mistakes);
                        } catch (e: any) {
                            console.error('analyze_mistake_patterns error:', e);
                            return JSON.stringify({ message: 'Errore temporaneo nell\'analisi degli errori.', error: e.message });
                        }
                    }
                }),

                create_study_sessions: tool({
                    description: 'Genera un piano di studio in card interattive. Usalo quando vuoi raccomandare quiz, simulazioni o ripasso. Questo tool emette un componente UI al frontend.',
                    inputSchema: z.object({
                        goal: z.string().describe('Il motivo della sessione (es. Recupero Diritto Pubblico)'),
                        sessions: z.array(z.object({
                            title: z.string(),
                            mode: z.enum(['practice', 'sim']),
                            duration_min: z.number(),
                            target_subtopics: z.array(z.string()),
                            cta_text: z.string()
                        }))
                    }),
                    execute: async ({ goal, sessions }) => {
                        return JSON.stringify({ goal, sessions, rendered_ui: 'action_plan_card' });
                    }
                }),

                // ==========================================
                // PHASE 2: BANDI RAG ARCHITECTURE HOOKS
                // ==========================================
                search_bandi: tool({
                    description: 'Cerca nel database vettoriale informazioni sui bandi di concorso attivi, requisiti, date di scadenza e posti disponibili.',
                    inputSchema: z.object({
                        query: z.string().describe('La domanda specifica dell\'utente sul bando (es. "Quali sono i requisiti per ispettore di polizia?" o "Concorsi nel lazio")'),
                        filters: z.object({
                            titolo_studio: z.string().optional(),
                            regione: z.string().optional()
                        }).optional()
                    }),
                    execute: async ({ query, filters }) => {
                        try {
                            // 1. Generate embedding for the user's query
                            const { embedding } = await embed({
                                model: openai.embedding('text-embedding-3-small'),
                                value: query,
                            });

                            // 2. Search Supabase using the pgvector RPC
                            const { data, error } = await supabase.rpc('match_bandi', {
                                query_embedding: embedding,
                                match_threshold: 0.2, // Lowered slightly to improve recall
                                match_count: 5,
                                filter_region: filters?.regione || null,
                                filter_education: filters?.titolo_studio || null
                            });

                            if (error) {
                                console.error('Supabase match_bandi error:', error);
                                return JSON.stringify({
                                    error: "Si è verificato un errore durante la ricerca dei bandi. Riprova più tardi."
                                });
                            }

                            if (!data || data.length === 0) {
                                return JSON.stringify({
                                    message: "Non ho trovato nessun bando attivo che corrisponde esattamente alla tua ricerca. Prova a usare termini più generici oppure verifica i filtri impostati."
                                });
                            }

                            // 3. Optional: Format dates / cleanup payload to save tokens
                            const safeData = Array.isArray(data) ? data : [];
                            const formattedData = safeData.map((b: any) => ({
                                id: b.id,
                                titolo: b.title,
                                ente: b.ente_name,
                                posti: b.seats_total,
                                scadenza: new Date(b.deadline).toLocaleDateString('it-IT'),
                                regioni: b.region,
                                link_candidatura: b.application_url
                            }));

                            return JSON.stringify({
                                results: formattedData,
                                note: "Usa queste informazioni per rispondere all'utente. Menziona sempre l'Ente, i posti, la scadenza e il link per candidarsi se rilevante."
                            });
                        } catch (e: any) {
                            console.error('search_bandi execution error:', e);
                            return JSON.stringify({ error: e.message });
                        }
                    }
                }),

                // ==========================================
                // PHASE 3: ORIENTAMENTO PERSONALIZZATO
                // ==========================================
                orientamento_bandi: tool({
                    description: 'Consiglia bandi personalizzati in base al profilo dell\'utente. Usa questo tool quando l\'utente chiede orientamento su quale concorso scegliere.',
                    inputSchema: z.object({
                        titolo_studio: z.string().describe('Titolo di studio dell\'utente (es. "diploma", "laurea in giurisprudenza", "laurea in ingegneria")'),
                        regione: z.string().describe('Regione di residenza o preferita (es. "Lazio", "Lombardia")'),
                        eta: z.number().optional().describe('Età dell\'utente'),
                        interessi: z.string().optional().describe('Settori di interesse (es. "polizia", "amministrazione", "sanità", "forze armate", "istruzione")'),
                        tipo_contratto: z.string().optional().describe('Preferenza tipo contratto (es. "tempo_indeterminato", "tempo_determinato")')
                    }),
                    execute: async ({ titolo_studio, regione, eta, interessi, tipo_contratto }) => {
                        try {
                            // 1. Build a rich query text from user profile for semantic search
                            const queryParts = [
                                `Concorso per ${titolo_studio}`,
                                regione ? `nella regione ${regione}` : '',
                                interessi ? `settore ${interessi}` : '',
                                tipo_contratto ? `contratto ${tipo_contratto}` : '',
                            ].filter(Boolean);
                            const queryText = queryParts.join(' ');

                            // 2. Generate embedding from the profile description
                            const { embedding } = await embed({
                                model: openai.embedding('text-embedding-3-small'),
                                value: queryText,
                            });

                            // 3. Get more candidates than needed so we can post-filter
                            const { data, error } = await supabase.rpc('match_bandi', {
                                query_embedding: embedding,
                                match_threshold: 0.15,
                                match_count: 20,
                                filter_region: regione || null,
                                filter_education: titolo_studio.toLowerCase().includes('laurea') ? 'Laurea' :
                                    titolo_studio.toLowerCase().includes('diploma') ? 'Diploma' : null
                            });

                            if (error) {
                                console.error('Supabase orientamento error:', error);
                                return JSON.stringify({ error: 'Errore durante la ricerca dei bandi. Riprova più tardi.' });
                            }

                            if (!data || data.length === 0) {
                                // Fallback: try without region filter for broader results
                                const { data: fallbackData, error: fallbackErr } = await supabase.rpc('match_bandi', {
                                    query_embedding: embedding,
                                    match_threshold: 0.15,
                                    match_count: 10,
                                    filter_region: null,
                                    filter_education: null
                                });

                                if (fallbackErr || !fallbackData || fallbackData.length === 0) {
                                    return JSON.stringify({
                                        message: 'Non ho trovato bandi perfettamente in linea con il tuo profilo al momento. Ti consiglio di controllare periodicamente o di provare con criteri più ampi.'
                                    });
                                }

                                // Use fallback data
                                const safeFallback = Array.isArray(fallbackData) ? fallbackData : [];
                                const formatted = safeFallback.slice(0, 5).map((b: any) => ({
                                    titolo: b.title,
                                    ente: b.ente_name,
                                    posti: b.seats_total,
                                    regione: b.region,
                                    scadenza: b.deadline ? new Date(b.deadline).toLocaleDateString('it-IT') : 'N/D',
                                    link_candidatura: b.application_url,
                                    similarita: b.similarity?.toFixed(2)
                                }));

                                return JSON.stringify({
                                    nota: 'Non ho trovato bandi nella tua regione. Ecco i migliori a livello nazionale:',
                                    raccomandazioni: formatted,
                                    istruzioni_ai: 'Per ogni bando, spiega PERCHÉ potrebbe essere adatto in base al profilo dell\'utente. Menziona ente, posti disponibili, scadenza e link.'
                                });
                            }

                            // 4. Post-filter by age if provided
                            let candidates = Array.isArray(data) ? data : [];
                            if (eta) {
                                // Fetch full bandi details to check age requirements
                                const ids = candidates.map((b: any) => b.id);
                                const { data: fullBandi } = await supabase
                                    .from('bandi')
                                    .select('id, age_min, age_max, contract_type, education_level, category_id, short_description')
                                    .in('id', ids);

                                if (fullBandi) {
                                    const fullMap = new Map(fullBandi.map((b: any) => [b.id, b]));
                                    candidates = candidates.filter((b: any) => {
                                        const full = fullMap.get(b.id);
                                        if (!full) return true;
                                        if (full.age_min && eta < full.age_min) return false;
                                        if (full.age_max && eta > full.age_max) return false;
                                        return true;
                                    }).map((b: any) => {
                                        const full = fullMap.get(b.id);
                                        return { ...b, contract_type: full?.contract_type, education_level: full?.education_level, short_description: full?.short_description };
                                    });
                                }
                            }

                            // 5. Format top 5 results with recommendation context
                            const top5 = candidates.slice(0, 5).map((b: any) => ({
                                titolo: b.title,
                                ente: b.ente_name,
                                posti: b.seats_total,
                                regione: b.region,
                                scadenza: b.deadline ? new Date(b.deadline).toLocaleDateString('it-IT') : 'N/D',
                                tipo_contratto: b.contract_type || 'Non specificato',
                                titoli_richiesti: b.education_level || [],
                                link_candidatura: b.application_url,
                                similarita: b.similarity?.toFixed(2),
                                breve_descrizione: b.short_description || ''
                            }));

                            return JSON.stringify({
                                profilo_utente: { titolo_studio, regione, eta, interessi, tipo_contratto },
                                raccomandazioni: top5,
                                istruzioni_ai: `Sei un consulente di orientamento professionale. Per OGNI bando raccomandato:
1. Spiega PERCHÉ è adatto al profilo dell'utente (collegati al suo titolo di studio, regione e interessi)
2. Evidenzia i PUNTI DI FORZA del bando (posti disponibili, tipo contratto, scadenza)
3. Avvisa se la scadenza è vicina
4. Suggerisci i prossimi passi concreti (es. "candidati entro il...", "prepara i documenti", "inizia a studiare le materie X")
Usa un tono caldo e incoraggiante. Formatta con markdown.`
                            });
                        } catch (e: any) {
                            console.error('orientamento_bandi error:', e);
                            return JSON.stringify({ error: e.message });
                        }
                    }
                }),
            }
        });

        result.pipeUIMessageStreamToResponse(res, {
            sendReasoning: true,
        });
    } catch (error: any) {
        console.error("AI API Error:", error?.stack || error);
        res.status(500).json({ error: 'Internal Server Error', details: error?.message || String(error) });
    }
}
