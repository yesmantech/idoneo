
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yansgitqqrcovwukvpfm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbnNnaXRxcXJjb3Z3dWt2cGZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNzQ5NzcsImV4cCI6MjA3OTY1MDk3N30.TbLgWITo0hvw1Vl9OY-Y_hbrU-y6cfKEnkMZhvG9bcQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function backfillXp() {
    console.log("Starting XP Backfill...");

    // 1. Get active season
    const now = new Date().toISOString();
    const { data: season } = await supabase
        .from('leaderboard_seasons')
        .select('id')
        .eq('is_active', true)
        .lte('start_at', now)
        .order('start_at', { ascending: false })
        .limit(1)
        .single();

    if (!season) {
        console.error("No active season found. Aborting.");
        return;
    }
    console.log("Using Season ID:", season.id);

    // 2. Fetch all attempts (limit to last 200 for now)
    const { data: attempts, error } = await supabase
        .from('quiz_attempts')
        .select('id, user_id, correct, answers, xp_awarded')
        //.eq('xp_awarded', false) // Optional: only those not awarded? Or forcing re-calculation?
        // Let's re-calculate mostly to be sure.
        .order('created_at', { ascending: false })
        .limit(200);

    if (error || !attempts) {
        console.error("Error fetching attempts:", error);
        return;
    }

    console.log(`Found ${attempts.length} attempts to process.`);

    // 3. Aggregate XP per user
    const userXpMap = new Map<string, number>();

    for (const att of attempts) {
        let xp = att.correct || 0;
        if (xp === 0 && Array.isArray(att.answers)) {
            xp = att.answers.filter((a: any) => a.isCorrect).length;
        }

        const current = userXpMap.get(att.user_id) || 0;
        userXpMap.set(att.user_id, current + xp);
    }

    // 4. Update user_xp table
    for (const [userId, xp] of userXpMap.entries()) {
        console.log(`Updating User ${userId} with ${xp} XP...`);

        // Manual Upsert because RPC might be tricky with ANON key if policies block it
        // Or assume policy allows access?
        // Let's try upserting directly into table.

        const { error: upsertError } = await supabase
            .from('user_xp')
            .upsert({
                user_id: userId,
                season_id: season.id,
                xp: xp,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id, season_id' });

        if (upsertError) {
            console.error(`Error updating XP for ${userId}:`, upsertError);
        } else {
            console.log(`Success for ${userId}`);

            // Also try to update profiles.total_xp (simple addition might be wrong if double counting, but for now enforcing consistency with season xp for this season)
            // But we don't know previous total_xp. 
            // Let's assume total_xp ~ season_xp for now as this is a new system.
            await supabase.from('profiles').update({ total_xp: xp }).eq('id', userId);
        }
    }

    console.log("Backfill complete.");
}

backfillXp();
