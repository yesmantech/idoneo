const fs = require('fs');

async function run() {
    console.log("Reading env...");
    const envStr = fs.readFileSync('.env.local', 'utf-8');
    const keyMatch = envStr.match(/VITE_SUPABASE_ANON_KEY=(.*)/);
    const key = keyMatch ? keyMatch[1].trim() : null;

    if (!key) {
        console.error("No key found");
        return;
    }

    const url = 'https://yansgitqqrcovwukvpfm.supabase.co/functions/v1/import-bandi';

    // Process first 10 pages sequentially (approx 150 items)
    for (let i = 0; i < 10; i++) {
        console.log(`\nTriggering import-bandi for page ${i}...`);
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ page: i }) // force 1 page only to avoid Edge 60s limit
            });

            console.log(`Page ${i} Status:`, res.status);
            const text = await res.text();

            try {
                const data = JSON.parse(text);
                console.log(`Results: Imported: ${data.imported} | Skipped: ${data.skipped} | Errors: ${data.errors}`);

                // If everything was skipped, maybe we've caught up completely
                if (data.skipped === 15 && data.imported === 0) {
                    console.log("All items in this page were skipped (already exist). Fast-forwarding might be done soon.");
                }
            } catch (e) {
                console.log("Raw Response:", text.substring(0, 200));
            }
        } catch (e) {
            console.error(`Error on page ${i}:`, e);
            break;
        }
    }

    console.log("\nRecovery Import Completed.");
}
run();
