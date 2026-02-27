const fs = require('fs');
async function run() {
    try {
        const envStr = fs.readFileSync('.env.local', 'utf-8');
        const urlMatch = envStr.match(/VITE_SUPABASE_URL=(.*)/);
        const keyMatch = envStr.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.*)/);
        if(!urlMatch) { console.log('no match'); return; }
        const url = urlMatch[1].trim();
        const key = keyMatch[1].trim();
        const headers = { 'apikey': key, 'Authorization': `Bearer ${key}` };
        const res = await fetch(`${url}/rest/v1/profiles?select=id,total_xp,referral_count,streak_current`, {headers});
        const text = await res.text();
        console.log(text);
        
        const res2 = await fetch(`${url}/rest/v1/user_badges?select=badge_id,user_id`, {headers});
        console.log(await res2.text());
    } catch(e) {
        console.log(e);
    }
}
run();
