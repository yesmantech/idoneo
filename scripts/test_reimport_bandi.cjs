const fs = require('fs');

async function run() {
    console.log("Reading env...");
    const envStr = fs.readFileSync('.env.local', 'utf-8');
    const getEnv = (key) => {
        const match = envStr.match(new RegExp(`${key}=(.*)`));
        return match ? match[1].trim() : null;
    };

    const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY'); // Will use this to trigger import-bandi
    if (!supabaseKey) {
        console.error("Missing Supabase credentials");
        return;
    }

    console.log("Triggering FULL SYSTEM re-import to fix ALL education_level data...");
    const url = 'https://yansgitqqrcovwukvpfm.supabase.co/functions/v1/import-bandi';

    try {
        // Process up to 50 pages (approx 750 items, covers all currently active)
        for (let i = 0; i < 50; i++) {
            console.log(`\nRe-evaluating page ${i}...`);
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    page: i,
                    update_existing: true // CRITICAL: forces re-analysis
                })
            });

            console.log(`Page ${i} Status:`, res.status);
            const text = await res.text();

            try {
                const data = JSON.parse(text);
                console.log(`Results: Updated: ${data.imported} | Skipped: ${data.skipped} | Errors: ${data.errors}`);

                // If there were no imported, no skipped, and no total pages (or empty page) we can break
                // But INPA sometimes returns empty pages, we will break if we hit a hard 0 totals
                if (data.total_fetched === 0) {
                    console.log("Reached end of INPA active pages.");
                    break;
                }
            } catch (e) {
                console.log("Raw Response:", text.substring(0, 200));
            }
        }

    } catch (e) {
        console.error(e);
    }
}

run();
