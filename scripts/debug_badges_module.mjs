import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function checkBadges() {
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, total_xp, streak_current, referral_count, email')
        .order('total_xp', { ascending: false, nullsFirst: false })
        .limit(1);

    if (error || !profile || profile.length === 0) {
        console.error('Error fetching profile:', error);
        return;
    }

    const userId = profile[0].id;
    console.log("====== Found Top User Profile ======");
    console.log(profile[0]);

    const { data: badges, error: badgeError } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId);

    console.log(`\n====== Awarded Badges (${badges?.length}) ======`);
    console.log(badges?.map(b => b.badge_id).join(', '));

    console.log("\n====== Logic Evaluation ======");
    if ((profile[0].total_xp || 0) >= 1000) console.log("veterano SHOULD BE unlocked (1000 XP)");
    if ((profile[0].streak_current || 0) >= 7) console.log("costanza SHOULD BE unlocked (7 day streak)");
}

checkBadges();
