
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://yansgitqqrcovwukvpfm.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbnNnaXRxcXJjb3Z3dWt2cGZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNzQ5NzcsImV4cCI6MjA3OTY1MDk3N30.TbLgWITo0hvw1Vl9OY-Y_hbrU-y6cfKEnkMZhvG9bcQ"

async function runDeepImport() {
    console.log("🚀 Starting Deep Import for last 550 bandi (Sub-batched)...");
    const startPage = 0;
    const endPage = 11; // 11 * 50 = 550 items

    // Process each page
    for (let page = startPage; page <= endPage; page++) {
        console.log(`\n📄 Processing Page ${page}...`);

        // Sub-batch of 10 items to avoid timeout
        const batchSize = 10;
        const totalItemsOnPage = 50;

        for (let startIndex = 0; startIndex < totalItemsOnPage; startIndex += batchSize) {
            console.log(`   > Batch ${startIndex} - ${startIndex + batchSize}...`);

            try {
                const start = Date.now();
                const response = await fetch(`${SUPABASE_URL}/functions/v1/import-bandi`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${SUPABASE_KEY}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        page: page,
                        start_index: startIndex,
                        limit: batchSize
                    })
                });

                const duration = ((Date.now() - start) / 1000).toFixed(1);

                if (!response.ok) {
                    const text = await response.text();
                    console.error(`   ❌ Error on page ${page} batch ${startIndex}: ${response.status} - ${text}`);
                    continue; // try next batch
                }

                const result = await response.json();
                console.log(`   ✅ Complete in ${duration}s. Imported: ${result.imported} | Skipped: ${result.skipped} | Errors: ${result.errors} | Enriched: ${result.enriched_enti}`);

            } catch (e) {
                console.error(`   💥 Exception on page ${page} batch ${startIndex}:`, e.message);
            }

            // Small pause
            await new Promise(r => setTimeout(r, 500));
        }
    }
    console.log("\n🏁 Deep Import process finished.");
}

runDeepImport();
