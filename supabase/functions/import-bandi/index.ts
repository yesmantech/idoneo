import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InPABando {
    id: string;
    codice: string;
    titolo: string;
    descrizioneBreve: string;
    descrizione: string;
    dataPubblicazione: string;
    dataScadenza: string;
    numPosti: number;
    entiRiferimento: string[];
    statusLabel: string;
    indirizzo?: string;
    provincia?: string;
    regione?: string;
}

// Map slug to known categories UUIDs (fetched at runtime or hardcoded for speed if stable)
// For robustness, we will try to match slug or partial name
async function getCategoryId(supabase: any, slug: string): Promise<string | null> {
    const { data } = await supabase.from('bandi_categories').select('id').eq('slug', slug).maybeSingle();
    if (data) return data.id;

    // Fallback: try to match by name if slug fails or is generic
    const { data: fallback } = await supabase.from('bandi_categories').select('id').ilike('name', `%${slug}%`).limit(1).maybeSingle();
    return fallback?.id || null;
}

async function getOrCreateEnte(supabase: any, name: string): Promise<string | null> {
    if (!name) return null;

    // Normalize name
    const normalizedName = name.trim();

    // 1. Try exact match
    const { data: existing } = await supabase.from('enti').select('id').ilike('name', normalizedName).limit(1).maybeSingle();
    if (existing) return existing.id;

    // 2. Create new
    const { data: newEnte, error } = await supabase.from('enti').insert({ name: normalizedName }).select('id').single();
    if (error) {
        console.error(`Error creating ente ${normalizedName}:`, error);
        return null;
    }
    return newEnte.id;
}

async function parseWithAI(description: string, openaiKey: string) {
    const systemPrompt = `Sei un esperto di concorsi pubblici. Analizza la descrizione di un bando e estrai dati strutturati PRECISI.
    
    Output richiesto (JSON):
    - ente_name: Nome pulito dell'ente (es. "Comune di Milano" non "COMUNE DI MILANO - UFFICIO CONCORSI").
    - category_slug: Scegli una tra: ['pubblica-amministrazione', 'enti-locali', 'sanita', 'istruzione', 'forze-armate', 'forze-ordine', 'giustizia', 'agenzia-entrate', 'universita', 'infrastrutture-trasporti', 'altro'].
    - seats_total: numero posti (intero).
    - contract_type: 'tempo_indeterminato', 'tempo_determinato', 'formazione_lavoro', 'altro'.
    - education_level: array ["Laurea", "Diploma", "Licenza Media", "Nessuno"].
    - region: Regione (es. "Lombardia").
    - province: Sigla provincia (es. "MI").
    - city: Comune principale (es. "Milano").
    - salary_range: Stringa stima stipendio o RAL se presente.
    - optimized_description: Una descrizione riscritta in Markdown, ben strutturata con:
        - ## Descrizione
        - ## Requisiti Principali
        - ## Scadenza e Riferimenti
      Rendila leggibile, rimuovi burocratese inutile. Usa elenchi puntati.
    
    Rispondi SOLO JSON valido.`;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${openaiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Analizza questo bando:\n\n${description.substring(0, 12000)}` }, // Limit token usage
                ],
                temperature: 0.1,
            }),
        });

        if (!response.ok) return null;
        const result = await response.json();
        const content = result.choices[0]?.message?.content || "{}";
        return JSON.parse(content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    } catch (e) {
        console.error("AI Parse Error:", e);
        return null;
    }
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )
        const openaiKey = Deno.env.get("OPENAI_API_KEY");

        // Parse request body for optional parameters
        let requestData = {};
        try {
            requestData = await req.json();
        } catch (e) { /* ignore if empty */ }

        const forcePage = (requestData as any).page;
        const subBatchStart = (requestData as any).start_index || 0;
        const subBatchLimit = (requestData as any).limit || 50;

        // Increase batch size for faster processing
        const size = 50;
        let currentPage = (typeof forcePage === 'number') ? forcePage : 0;
        let totalPages = 1;
        let processedCount = 0;

        const results = {
            imported: 0,
            skipped: 0,
            errors: 0,
            total_fetched: 0,
            enriched_enti: 0,
            details: [] as any[]
        };

        console.log(`Starting import. Page: ${currentPage}, Mode: ${typeof forcePage === 'number' ? 'Single Page' : 'Auto-Loop'}`);

        // Loop through pages (or just run once if specific page requested)
        do {
            console.log(`Fetching page ${currentPage}...`);

            const inpaRes = await fetch(`https://portale.inpa.gov.it/concorsi-smart/api/concorso-public-area/search-better?page=${currentPage}&size=${size}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    queryString: "",
                    regioni: [],
                    settori: [],
                    stati: ["IN_APERTURA"],
                })
            });

            if (!inpaRes.ok) break;

            const data = await inpaRes.json() as { content: InPABando[], totalPages: number };
            totalPages = data.totalPages;
            // Sub-batching logic: slice the 50 items
            const allBandi = data.content || [];
            results.total_fetched += allBandi.length;

            const bandiToProcess = allBandi.slice(subBatchStart, subBatchStart + subBatchLimit);
            console.log(`Processing sub-batch: ${bandiToProcess.length} items (from index ${subBatchStart})`);

            for (const item of bandiToProcess) {
                processedCount++;

                // Check if exists
                const { data: existing } = await supabaseClient
                    .from('bandi')
                    .select('id')
                    .eq('source_id', item.id)
                    .single();

                if (existing) {
                    results.skipped++;
                    continue;
                }

                // AI Parsing & Enrichment
                let aiData: any = {};
                let enteId: string | null = null;
                let categoryId: string | null = null;

                if (openaiKey) {
                    aiData = await parseWithAI(item.descrizione || item.descrizioneBreve, openaiKey) || {};

                    // Resolve Ente
                    if (aiData.ente_name) {
                        enteId = await getOrCreateEnte(supabaseClient, aiData.ente_name);
                        if (enteId) results.enriched_enti++;
                    }

                    // Resolve Category
                    if (aiData.category_slug) {
                        categoryId = await getCategoryId(supabaseClient, aiData.category_slug);
                    }
                }

                // Fallback for description if AI fails
                const finalDescription = aiData.optimized_description || item.descrizione || item.descrizioneBreve;

                const { error } = await supabaseClient
                    .from('bandi')
                    .insert({
                        title: item.titolo,
                        source_id: item.id,
                        source_type: 'inpa',
                        status: 'published', // Always live
                        deadline: item.dataScadenza,
                        publication_date: item.dataPubblicazione,

                        // Enriched Relations
                        ente_id: enteId,
                        category_id: categoryId,

                        // Precise Data
                        seats_total: aiData.seats_total || item.numPosti || null,
                        contract_type: aiData.contract_type || 'altro',
                        education_level: aiData.education_level || [],

                        // Location
                        region: aiData.region || null,
                        province: aiData.province || null,
                        city: aiData.city || null,

                        // Content
                        salary_range: aiData.salary_range || null,
                        short_description: item.descrizioneBreve, // keep original short
                        description: finalDescription, // Optimized MD

                        source_urls: [`https://www.inpa.gov.it/bandi-e-avvisi/dettaglio-bando-avviso/?concorso_id=${item.id}`]
                    });

                if (error) {
                    results.errors++;
                    results.details.push({ title: item.titolo, error: error.message });
                } else {
                    results.imported++;
                }
            }

            currentPage++;

            // Safety break 
            if (typeof forcePage === 'number') break; // Process only one page if requested
            if (processedCount > 200) break; // Lower limit due to AI latency for auto-loop

        } while (currentPage < totalPages);

        return new Response(JSON.stringify(results), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        })

    } catch (error: any) {
        console.error("Critical error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
        })
    }
})
