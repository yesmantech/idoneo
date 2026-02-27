const fs = require('fs');

async function run() {
    const envStr = fs.readFileSync('.env.local', 'utf-8');
    const urlMatch = envStr.match(/VITE_SUPABASE_URL=(.*)/);
    const keyMatch = envStr.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.*)/);
    const url = urlMatch ? urlMatch[1].trim() : null;
    const key = keyMatch ? keyMatch[1].trim() : null;
    const headers = { 'apikey': key, 'Authorization': `Bearer ${key}` };

    const res = await fetch(`${url}/rest/v1/profiles?select=id,total_xp,referral_count,streak_current&limit=5`, {headers});
    const text = await res.text();
    console.log(text);
}
run();
