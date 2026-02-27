/**
 * Backfill script: Generate OpenAI embeddings for all bandi without one.
 * 
 * Uses text-embedding-3-small (1536 dimensions).
 * Processes in batches of 50 to stay within OpenAI rate limits.
 * 
 * Usage: node scripts/backfill_bandi_embeddings.cjs
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing environment variables. Ensure OPENAI_API_KEY, VITE_SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY are set in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BATCH_SIZE = 50;
const MODEL = 'text-embedding-3-small';

/**
 * Build a search-friendly text representation of a bando.
 */
function bandoToText(bando) {
    const parts = [];
    if (bando.title) parts.push(bando.title);
    if (bando.description) parts.push(bando.description);
    if (bando.region) parts.push(`Regione: ${bando.region}`);
    if (bando.province) parts.push(`Provincia: ${bando.province}`);
    if (bando.seats_total) parts.push(`Posti disponibili: ${bando.seats_total}`);
    if (bando.education_level && bando.education_level.length > 0) {
        parts.push(`Titolo di studio: ${bando.education_level.join(', ')}`);
    }
    return parts.join('\n');
}

/**
 * Call OpenAI embeddings API for a batch of texts.
 */
async function getEmbeddings(texts) {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: MODEL,
            input: texts,
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenAI API error: ${response.status} ${errorBody}`);
    }

    const json = await response.json();
    // Return embeddings sorted by index to match input order
    return json.data.sort((a, b) => a.index - b.index).map(d => d.embedding);
}

async function main() {
    console.log('🚀 Starting bandi embedding backfill...\n');

    // 1. Fetch all bandi without embeddings
    let allBandi = [];
    let page = 0;
    const PAGE_SIZE = 500;

    while (true) {
        const { data, error } = await supabase
            .from('bandi')
            .select('id, title, description, region, province, seats_total, education_level')
            .is('embedding', null)
            .eq('status', 'published')
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (error) {
            console.error('Supabase fetch error:', error);
            process.exit(1);
        }
        if (!data || data.length === 0) break;

        allBandi = allBandi.concat(data);
        page++;
    }

    console.log(`📊 Found ${allBandi.length} bandi without embeddings.\n`);

    if (allBandi.length === 0) {
        console.log('✅ All bandi already have embeddings!');
        return;
    }

    // 2. Process in batches
    let processed = 0;
    let errors = 0;

    for (let i = 0; i < allBandi.length; i += BATCH_SIZE) {
        const batch = allBandi.slice(i, i + BATCH_SIZE);
        const texts = batch.map(bandoToText);

        try {
            const embeddings = await getEmbeddings(texts);

            // 3. Update each bando with its embedding
            for (let j = 0; j < batch.length; j++) {
                const { error: updateError } = await supabase
                    .from('bandi')
                    .update({ embedding: embeddings[j] })
                    .eq('id', batch[j].id);

                if (updateError) {
                    console.error(`  ❌ Error updating bando ${batch[j].id}:`, updateError.message);
                    errors++;
                } else {
                    processed++;
                }
            }

            console.log(`  ✅ Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} bandi processed (${processed}/${allBandi.length})`);

            // Small delay to respect rate limits
            if (i + BATCH_SIZE < allBandi.length) {
                await new Promise(r => setTimeout(r, 200));
            }
        } catch (e) {
            console.error(`  ❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, e.message);
            errors += batch.length;
        }
    }

    console.log(`\n🏁 Done! Processed: ${processed}, Errors: ${errors}`);
}

main().catch(console.error);
