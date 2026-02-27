const fs = require('fs');

async function run() {
    console.log("Reading env...");
    const envStr = fs.readFileSync('.env.local', 'utf-8');
    const urlMatch = envStr.match(/VITE_SUPABASE_URL=(.*)/);
    const keyMatch = envStr.match(/VITE_SUPABASE_ANON_KEY=(.*)/);
    const url = urlMatch ? urlMatch[1].trim() : null;
    const key = keyMatch ? keyMatch[1].trim() : null;

    if (!url || !key) {
        console.error("No url/key found");
        return;
    }

    try {
        const res = await fetch(`${url}/rest/v1/bandi?select=id,title,publication_date&order=publication_date.desc&limit=10`, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`
            }
        });
        const bandi = await res.json();
        console.log(bandi.map(b => `${b.publication_date}: ${b.title.substring(0, 80)}`));
    } catch(e) {
        console.error(e);
    }
}
run();
