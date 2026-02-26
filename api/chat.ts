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
    try {
        const { messages, userId } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized: userId required' });
        }

        // Convert UIMessages (from useChat frontend) to ModelMessages (for streamText)
        const incomingMessages = messages || [];
        const modelMessages = await convertToModelMessages(incomingMessages);

        // Artificial delay to show the "thinking" animation for 3.5 seconds
        await new Promise(resolve => setTimeout(resolve, 3500));

        const result = streamText({
            model: openai('gpt-4o-mini'),
            stopWhen: stepCountIs(3),
            messages: modelMessages,
            system: `Sei l'Assistente 360° di idoneo.ai, un coach esperto per i concorsi pubblici.
Il tuo tono è professionale, incoraggiante, conciso e verticale.
Il tuo obiettivo è aiutare l'utente a migliorare nei quiz misurando i suoi dati reali. 

REGOLA FONDAMENTALE SULL'USO DEGLI STRUMENTI (TOOLS):
Quando l'utente chiede consigli su come migliorare, cosa studiare o come sta andando:
1. DEVI SEMPRE e OBBLIGATORIAMENTE usare prima il tool "get_user_overview" per vedere le sue statistiche generali.
2. DEVI SEMPRE e OBBLIGATORIAMENTE usare il tool "get_mistakes_by_topic" per capire in quali materie fa più errori.
Non dare MAI consigli generici prima di aver consultato i suoi dati reali tramite i tools.

REGOLA FONDAMENTALE SULLA PRECISIONE DEI DATI:
- Riporta SOLO i numeri esatti che ricevi dai tools. NON fare calcoli tuoi né inventare numeri.
- L'accuratezza (percentuale) è già calcolata dai tools: usala direttamente.
- Se i dati contengono "correct", "wrong" e "blank", riportali esattamente come li ricevi.
- NON sommare o sottrarre numeri tra diversi tools.
- Se un campo è 0 o vuoto, dillo chiaramente.

Rispondi sempre basandoti rigorosamente sui dati emersi. Metti in risalto i suoi punti critici e suggerisci un'azione pratica e focalizzata. Usa elenchi puntati e formattazione markdown. 
NON inventare regole sui concorsi se non hai informazioni.

Regola (TIPOLOGIE DI ERRORI e RAG):
Se l'utente chiede "in cosa sbaglio", "quali tipologie di domande", "quali argomenti", "fammi un riepilogo dettagliato", ecc., DOPO aver visto le materie più critiche con \`get_mistakes_by_topic\`, DEVI USARE il tool \`analyze_mistake_patterns\`. Questo tool ti fornirà il TESTO ESATTO delle ultime domande vere e proprie che l'utente ha sbagliato. Leggile attentamente e raggruppale in "tipologie" o "argomenti specifici" (folder). Spiega all'utente *esattamente su quali concetti teorici* sta scivolando, citando le domande reali.

REGOLA (BANDI E CONCORSI):
Se l'utente cita, chiede o menziona "bandi", "concorsi aperti", "date", o "requisiti", SEI OBBLIGATO a usare il tool "search_bandi". Non rispondere MAI prima di aver chiamato questo tool per informazioni sui bandi.

REGOLA (ORIENTAMENTO CONCORSI):
Se l'utente chiede orientamento, consiglio su quale concorso fare, dice "non so quale concorso scegliere", "quale concorso fa per me", "aiutami a scegliere", o fornisce le sue caratteristiche personali (titolo di studio, regione, età, interessi), DEVI usare il tool "orientamento_bandi".
Se l'utente non ha ancora fornito TUTTE le informazioni necessarie (titolo di studio e almeno la regione), chiedigliele prima di chiamare il tool. Sii conversazionale: "Per consigliarti al meglio, dimmi: che titolo di studio hai? In che zona d'Italia vivi? Quanti anni hai? C'è un settore che ti interessa in particolare?"

REGOLA (OFF-TOPIC):
Se interpellato su argomenti fuori dal contesto (es. ricette, programmazione software generale, ecc.), declina educatamente dicendo che sei un coach specializzato solo nella preparazione per concorsi pubblici.

REGOLA (DIVIETO SERVIZI ESTERNI):
NON suggerire MAI all'utente di iscriversi a newsletter, servizi di notifica, app di terzi, canali Telegram, gruppi Facebook o qualsiasi altro servizio esterno.
L'UNICO sito esterno che puoi consigliare è il portale ufficiale **InPA** (https://www.inpa.gov.it) per consultare i bandi ufficiali e candidarsi.
NON menzionare MAI altre piattaforme, app o siti concorrenti. idoneo.ai è l'unica soluzione che devi consigliare per la preparazione.

CONOSCENZA DELLA PIATTAFORMA IDONEO.AI:
L'utente sta usando l'app web/mobile idoneo.ai. Cerca di inquadrare i tuoi consigli agganciandoti a queste funzionalità reali dell'app:
- **Simulazioni e Allenamento**: L'app offre simulazioni d'esame e allenamento mirato per categoria (es. Allievi Marescialli, VFP1, Guardia di Finanza, ecc).
- **Gamification (XP e Leghe)**: L'utente guadagna XP (Punti Esperienza) completando quiz. C'è una Classifica (Leaderboard) divisa in Leghe (Bronzo, Argento, Oro, Diamante) basata sulla costanza e sulla precisione.
- **Streak (Giorni Consecutivi)**: L'app premia chi studia tutti i giorni con uno "Streak" di fuoco che aumenta i moltiplicatori di XP. Suggerisci di mantenere lo streak.
- **Modalità Offline**: Se l'utente scarica i quiz, può esercitarsi anche senza internet (es. in treno o aereo).
- **Statistiche Avanzate**: L'utente ha una dashboard con grafici sulle materie. Tu puoi leggere questi dati usando i tuoi tool.
- **Bandi e Concorsi**: L'app tiene traccia dei concorsi attivi. (Ricorda la regola di usare "search_bandi").`,
            tools: {
                get_user_overview: tool({
                    description: 'Recupera le performance generali dell\'utente: quiz completati, risposte corrette, errate e omesse, accuratezza, durata media. Usalo per avere un\'idea del livello generale.',
                    inputSchema: z.object({
                        range_days: z.number().describe('Il numero di giorni passati da analizzare (es. 7, 30)')
                    }),
                    execute: async ({ range_days }) => {
                        const startDate = new Date();
                        startDate.setDate(startDate.getDate() - range_days);

                        const { data: stats, error } = await supabase
                            .from('quiz_attempts')
                            .select('correct, wrong, blank, total_questions, duration_seconds, score')
                            .eq('user_id', userId)
                            .gte('created_at', startDate.toISOString());

                        if (error || !stats || stats.length === 0) {
                            return JSON.stringify({
                                message: 'Nessun quiz completato nel periodo selezionato',
                                quiz_completati: 0,
                                timeframe_days: range_days
                            });
                        }

                        const totalCorrect = stats.reduce((acc, s) => acc + (s.correct || 0), 0);
                        const totalWrong = stats.reduce((acc, s) => acc + (s.wrong || 0), 0);
                        const totalBlank = stats.reduce((acc, s) => acc + (s.blank || 0), 0);
                        const totalQuestions = totalCorrect + totalWrong + totalBlank;
                        const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
                        const avgDuration = Math.round(stats.reduce((acc, s) => acc + (s.duration_seconds || 0), 0) / stats.length);
                        const avgScore = Math.round(stats.reduce((acc, s) => acc + (s.score || 0), 0) / stats.length);

                        return JSON.stringify({
                            quiz_completati: stats.length,
                            domande_totali: totalQuestions,
                            risposte_corrette: totalCorrect,
                            risposte_errate: totalWrong,
                            risposte_omesse: totalBlank,
                            accuratezza_percentuale: accuracy,
                            punteggio_medio: avgScore,
                            durata_media_secondi: avgDuration,
                            timeframe_days: range_days
                        });
                    }
                }),

                get_mistakes_by_topic: tool({
                    description: 'Recupera le materie dove l\'utente fa più errori, con dettaglio correct/wrong/skipped per materia.',
                    inputSchema: z.object({
                        limit: z.number().describe('Quanti materie restituire al massimo')
                    }),
                    execute: async ({ limit }) => {
                        const { data: attempts, error } = await supabase
                            .from('quiz_attempts')
                            .select('answers')
                            .eq('user_id', userId)
                            .order('created_at', { ascending: false })
                            .limit(30);

                        if (error || !attempts || attempts.length === 0) {
                            return JSON.stringify({ message: 'Nessun dato disponibile sulle risposte per materia' });
                        }

                        // 1. Group stats by subjectId (not subjectName which is wrong)
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

                        // 2. Fetch the real names for these subject IDs
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

                        // 3. Prepare the final results array
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
                    }
                }),

                analyze_mistake_patterns: tool({
                    description: 'Recupera il testo letterale (Domanda, Opzioni, Risposta Giusta) delle ultime domande sbagliate o omesse dall\'utente. Funge da "RAG" per permetterti di dedurre pattern, tipologie o "folder" specifici di errore.',
                    inputSchema: z.object({
                        subject_id: z.string().optional().describe('Se forzato dall\'utente o dedotto dal contesto, filtra l\'analisi solo su una materia specifica. Altrimenti omettilo per analizzare tutto.'),
                        limit: z.number().default(20).describe('Numero massimo di domande sbagliate da estrarre per l\'analisi (max 50, default 20).')
                    }),
                    execute: async ({ subject_id, limit }) => {
                        const { data: attempts, error } = await supabase
                            .from('quiz_attempts')
                            .select('answers')
                            .eq('user_id', userId)
                            .order('created_at', { ascending: false })
                            .limit(10); // Look at last 10 quizzes

                        if (error || !attempts || attempts.length === 0) {
                            return JSON.stringify({ message: 'Nessun quiz superato di recente per poterne estrarre le domande sbagliate.' });
                        }

                        const mistakes = [];
                        const rawErrors = [];
                        const uniqueActionSubjectIds = new Set<string>();

                        // 1. Collect all mistakes and unique subject IDs
                        for (const attempt of attempts) {
                            if (!attempt.answers || !Array.isArray(attempt.answers)) continue;
                            for (const ans of attempt.answers as any[]) {
                                if (ans.isCorrect === false || ans.isSkipped === true) {
                                    rawErrors.push(ans);
                                    if (ans.subjectId) uniqueActionSubjectIds.add(ans.subjectId);
                                }
                            }
                        }

                        // 2. Resolve real subject names
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

                        // 3. Format, filter, and apply limit
                        for (const ans of rawErrors) {
                            const realName = ans.subjectId ? (idToNameMap[ans.subjectId] || ans.subjectName || 'Sconosciuta') : (ans.subjectName || 'Sconosciuta');

                            // Apply descriptive subject filter if AI provides one (case insensitive, partial match)
                            if (subject_id && !realName.toLowerCase().includes(subject_id.toLowerCase())) continue;

                            mistakes.push({
                                materia: realName,
                                testo_domanda: ans.text?.substring(0, 150) + '...',
                                risposta_esatta: ans.options?.[ans.correctOption]?.substring(0, 100) || 'N/A',
                                spiegazione: ans.explanation ? 'Presente' : 'Assente',
                            });

                            if (mistakes.length >= limit) break; // Token saving
                        }

                        if (mistakes.length === 0) {
                            return JSON.stringify({ message: 'Nessun errore specifico combacia con la materia richiesta nei quiz recenti.' });
                        }

                        return JSON.stringify(mistakes);
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

        result.pipeTextStreamToResponse(res);
    } catch (error: any) {
        console.error("AI API Error:", error?.stack || error);
        res.status(500).json({ error: 'Internal Server Error', details: error?.message || String(error) });
    }
}
