/**
 * Backfill Script: Generate AI short_titles for existing bandi
 *
 * Fetches all bandi without a short_title, calls OpenAI to generate
 * a concise, user-friendly title, and updates the row.
 *
 * Usage: node scripts/backfill_short_titles.mjs
 *
 * Requires: OPENAI_API_KEY environment variable or hardcoded below.
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yansgitqqrcovwukvpfm.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbnNnaXRxcXJjb3Z3dWt2cGZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA3NDk3NywiZXhwIjoyMDc5NjUwOTc3fQ.mO21DyDC66vPCHK_TIT_okhXbIfVhs--BxDyGA0TYt8';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

if (!OPENAI_API_KEY) {
    console.error('❌ Set OPENAI_API_KEY environment variable');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function generateShortTitle(title, shortDescription, enteName, categoryName) {
    const prompt = `Genera un titolo breve e chiaro (max 60 caratteri) per questo bando di concorso pubblico.
Il titolo deve comunicare IMMEDIATAMENTE il ruolo/posizione e l'ente.

Esempi di buoni titoli:
- "Allievi Agente Polizia di Stato 2025"
- "80 Funzionari Amministrativi - Comune di Ravenna"
- "Aggiornamento GPS Docenti 2025"
- "Concorso 1000 Vigili del Fuoco"

REGOLE:
- Rimuovi "AVVISO", "DELIBERA", "BANDO", maiuscole inutili
- Se ci sono posti, metti il numero all'inizio
- Includi l'ente se è breve
- Max 60 caratteri
- Rispondi SOLO con il titolo breve, nient'altro

Titolo originale: ${title}
${shortDescription ? `Descrizione breve: ${shortDescription.substring(0, 500)}` : ''}
${enteName ? `Ente: ${enteName}` : ''}
${categoryName ? `Categoria: ${categoryName}` : ''}`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'user', content: prompt }
                ],
                temperature: 0.2,
                max_tokens: 80,
            }),
        });

        if (!response.ok) {
            console.error(`   OpenAI error: ${response.status}`);
            return null;
        }

        const result = await response.json();
        const shortTitle = result.choices[0]?.message?.content?.trim().replace(/^["']|["']$/g, '');
        return shortTitle || null;
    } catch (e) {
        console.error(`   Error:`, e.message);
        return null;
    }
}

async function main() {
    console.log('\n🔄 BACKFILL: Generating short_titles for bandi\n');

    // Fetch bandi without short_title
    const { data: bandi, error } = await supabase
        .from('bandi')
        .select('id, title, short_description, ente:enti(name), category:bandi_categories(name)')
        .is('short_title', null)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('❌ Error fetching bandi:', error.message);
        return;
    }

    console.log(`📋 Found ${bandi.length} bandi without short_title\n`);

    let success = 0;
    let failed = 0;

    for (let i = 0; i < bandi.length; i++) {
        const bando = bandi[i];
        const enteName = bando.ente?.name || '';
        const categoryName = bando.category?.name || '';

        process.stdout.write(`[${i + 1}/${bandi.length}] `);

        const shortTitle = await generateShortTitle(
            bando.title,
            bando.short_description,
            enteName,
            categoryName
        );

        if (shortTitle) {
            const { error: updateError } = await supabase
                .from('bandi')
                .update({ short_title: shortTitle })
                .eq('id', bando.id);

            if (updateError) {
                console.log(`❌ ${bando.title.substring(0, 50)}... → Error: ${updateError.message}`);
                failed++;
            } else {
                console.log(`✅ "${shortTitle}"`);
                success++;
            }
        } else {
            console.log(`⚠️ Skipped: ${bando.title.substring(0, 50)}...`);
            failed++;
        }

        // Rate limit: ~3 req/sec with gpt-4o-mini
        await new Promise(r => setTimeout(r, 350));
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`✅ Success: ${success}`);
    console.log(`❌ Failed:  ${failed}`);
    console.log(`📊 Total:   ${bandi.length}\n`);
}

main().catch(console.error);
