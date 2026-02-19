
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Map slug to known categories UUIDs
async function getCategoryId(supabase: any, slug: string): Promise<string | null> {
    const { data } = await supabase.from('bandi_categories').select('id').eq('slug', slug).maybeSingle();
    if (data) return data.id;
    const { data: fallback } = await supabase.from('bandi_categories').select('id').ilike('name', `%${slug}%`).limit(1).maybeSingle();
    return fallback?.id || null;
}

async function getOrCreateEnte(supabase: any, name: string): Promise<string | null> {
    if (!name) return null;
    const normalizedName = name.trim();
    const { data: existing } = await supabase.from('enti').select('id').ilike('name', normalizedName).limit(1).maybeSingle();
    if (existing) return existing.id;
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
                    { role: "user", content: `Analizza questo bando:\n\n${description.substring(0, 12000)}` },
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

        // Fetch 10 unenriched bandi
        const { data: bandi, error: fetchError } = await supabaseClient
            .from('bandi')
            .select('id, title, description, short_description')
            .is('ente_id', null)
            .limit(10);

        if (fetchError) throw fetchError;

        if (!bandi || bandi.length === 0) {
            return new Response(JSON.stringify({ message: 'No bandi needing enrichment.' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            })
        }

        const stats = { processed: 0, enriched: 0, errors: 0 };

        for (const bando of bandi) {
            stats.processed++;
            const textToAnalyze = bando.description || bando.short_description || bando.title;

            if (openaiKey) {
                const aiData = await parseWithAI(textToAnalyze, openaiKey);
                if (aiData) {
                    const enteId = aiData.ente_name ? await getOrCreateEnte(supabaseClient, aiData.ente_name) : null;
                    const categoryId = aiData.category_slug ? await getCategoryId(supabaseClient, aiData.category_slug) : null;

                    const { error: updateError } = await supabaseClient
                        .from('bandi')
                        .update({
                            ente_id: enteId,
                            category_id: categoryId,
                            seats_total: aiData.seats_total || null,
                            contract_type: aiData.contract_type || 'altro',
                            education_level: aiData.education_level || [],
                            region: aiData.region || null,
                            province: aiData.province || null,
                            city: aiData.city || null,
                            salary_range: aiData.salary_range || null,
                            description: aiData.optimized_description || bando.description // Update description if optimized
                        })
                        .eq('id', bando.id);

                    if (!updateError) stats.enriched++;
                    else stats.errors++;
                }
            }
        }

        return new Response(JSON.stringify(stats), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        })

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
        })
    }
})
