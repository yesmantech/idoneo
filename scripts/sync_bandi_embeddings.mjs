import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// API Keys required: OPENAI_API_KEY, VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseKey || !openaiKey) {
    console.error("Missing required environment variables. Ensure .env is loaded.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openaiKey });

async function main() {
    console.log("🚀 Starting Bandi Embedding Sync...");

    // 1. Fetch bandi that don't have embeddings yet
    const { data: bandi, error } = await supabase
        .from('bandi')
        .select(`
            id,
            title,
            short_description,
            description,
            region,
            province,
            seats_total,
            education_level,
            contract_type,
            deadline,
            enti (name, type)
        `)
        .is('embedding', null)
        .eq('status', 'published');

    if (error) {
        console.error("Error fetching bandi:", error.message);
        process.exit(1);
    }

    if (!bandi || bandi.length === 0) {
        console.log("✅ All published bandi already have embeddings! Nothing to do.");
        return;
    }

    console.log(`Found ${bandi.length} bandi requiring embeddings.`);

    let successCount = 0;
    let failCount = 0;

    // Process in batches or sequentially to respect rate limits
    for (let i = 0; i < bandi.length; i++) {
        const b = bandi[i];

        // 2. Format a dense, meaningful text block for the AI to embed
        const enteName = b.enti ? b.enti.name : 'Ente non specificato';
        const education = b.education_level && b.education_level.length > 0
            ? b.education_level.join(', ') : 'Qualsiasi';

        const textToEmbed = `
Titolo: ${b.title || ''}
Ente: ${enteName}
Regione: ${b.region || 'Nazionale'}
Provincia: ${b.province || 'Non specificata'}
Posti disponibili: ${b.seats_total || 'Non specificati'}
Titolo di studio richiesto: ${education}
Contratto: ${b.contract_type || 'Non specificato'}
Scadenza: ${b.deadline ? new Date(b.deadline).toLocaleDateString('it-IT') : 'Non specificata'}

Descrizione breve: ${b.short_description || ''}
Descrizione completa: ${b.description || ''}
        `.trim();

        try {
            // 3. Generate embedding using OpenAI
            const response = await openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: textToEmbed,
            });

            const embedding = response.data[0].embedding;

            // 4. Update the DB
            const { error: updateError } = await supabase
                .from('bandi')
                .update({ embedding: embedding })
                .eq('id', b.id);

            if (updateError) {
                console.error(`❌ Failed to update DB for bando ${b.id}:`, updateError.message);
                failCount++;
            } else {
                console.log(`✅ [${i + 1}/${bandi.length}] Embedded: ${b.title.substring(0, 40)}...`);
                successCount++;
            }

        } catch (err) {
            console.error(`❌ Failed embedding call for ${b.id}:`, err);
            failCount++;
        }

        // Small delay to prevent API rate limiting
        await new Promise(res => setTimeout(res, 200));
    }

    console.log(`\n🎉 Sync Complete! Success: ${successCount}, Failed: ${failCount}`);
}

main();
