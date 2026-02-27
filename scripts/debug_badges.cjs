const fs = require('fs');

async function run() {
    const envStr = fs.readFileSync('.env.local', 'utf-8');
    const urlMatch = envStr.match(/VITE_SUPABASE_URL=(.*)/);
    const keyMatch = envStr.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.*)/);
    const url = urlMatch ? urlMatch[1].trim() : null;
    const key = keyMatch ? keyMatch[1].trim() : null;

    if (!url || !key) {
        console.error("Missing credentials");
        return;
    }

    try {
        // Find an active user
        const resUsers = await fetch(`${url}/rest/v1/profiles?select=id,total_xp,referral_count,streak_current&limit=1`, {
            headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
        });
        const users = await resUsers.json();
        if (users.length === 0) return console.log("No users.");
        const user = users[0];
        console.log("Profile Data:", user);

        const resBadges = await fetch(`${url}/rest/v1/user_badges?select=badge_id&user_id=eq.${user.id}`, {
            headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
        });
        const badges = await resBadges.json();
        console.log("Awarded Badges:", badges.map(b => b.badge_id));
        
    } catch(e) {
        console.error(e);
    }
}
run();
