import fs from 'fs';

async function run() {
    try {
        const envStr = fs.readFileSync('.env.local', 'utf-8');
        const urlMatch = envStr.match(/VITE_SUPABASE_URL=(.*)/);
        const keyMatch = envStr.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.*)/);
        if (!urlMatch) { console.log('no match'); return; }
        const url = urlMatch[1].trim();
        const key = keyMatch[1].trim();
        const headers = { 'apikey': key, 'Authorization': `Bearer ${key}` };

        console.log("Fetching profiles...");
        const res = await fetch(`${url}/rest/v1/profiles?select=id,total_xp,referral_count,streak_current`, { headers });
        const text = await res.text();
        console.log("Profiles:");
        console.log(text);

        console.log("\nFetching user_badges...");
        const res2 = await fetch(`${url}/rest/v1/user_badges?select=badge_id,user_id`, { headers });
        const text2 = await res2.text();
        console.log("Badges:");
        console.log(text2);
    } catch (e) {
        console.error("Error:", e);
    }
}
run();
