import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

async function checkAndAwardBadges(userId: string) {
    try {
        console.log('Badge Check: Starting for user', userId);

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('total_xp, referral_count, streak_current')
            .eq('id', userId)
            .single();

        if (profileError) {
            console.error('Badge Check: Profile Fetch Error', profileError);
            return;
        }

        console.log('Badge Check: Total XP:', profile.total_xp);
        console.log('Badge Check: Current Streak:', profile.streak_current);

        async function awardBadge(badgeId: string) {
            const { error } = await supabase
                .from('user_badges')
                .upsert({ user_id: userId, badge_id: badgeId }, { onConflict: 'user_id, badge_id' });
            if (error) {
                console.error(`Error awarding ${badgeId}:`, error);
            } else {
                console.log(`Successfully awarded: ${badgeId}`);
            }
        }

        if ((profile.total_xp || 0) >= 1000) await awardBadge('veterano');
        if ((profile.referral_count || 0) >= 5) await awardBadge('social');
        if ((profile.streak_current || 0) >= 7) await awardBadge('costanza');

        // NEW LOGIC
        const { data: highTotalAttempts } = await supabase
            .from('quiz_attempts')
            .select('id, correct, total_questions')
            .eq('user_id', userId)
            .gt('total_questions', 9);

        const perfectAttempt = highTotalAttempts?.find(a => a.correct === a.total_questions);

        if (perfectAttempt) {
            console.log('Badge Check: Awarding secchione');
            await awardBadge('secchione');
        }

    } catch (error) {
        console.error('Error checking badges:', error);
    }
}

async function run() {
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, total_xp')
        .order('total_xp', { ascending: false })
        .limit(1);

    if (profiles && profiles.length > 0) {
        const userId = profiles[0].id;
        console.log(`Testing with top user: ${profiles[0].email} (XP: ${profiles[0].total_xp})`);

        const { data: before } = await supabase.from('user_badges').select('badge_id').eq('user_id', userId);
        console.log("Badges before run:", before?.map(b => b.badge_id));

        await checkAndAwardBadges(userId);

        const { data: after } = await supabase.from('user_badges').select('badge_id').eq('user_id', userId);
        console.log("Badges after run:", after?.map(b => b.badge_id));
    }
}

run();
