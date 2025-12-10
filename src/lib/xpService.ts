import { supabase } from "@/lib/supabaseClient";

export interface UserXpStats {
    totalXp: number;
    seasonXp: number;
    nextLevelProgress: number; // 0-100
    currentLevel: number;
}

export const xpService = {
    /**
     * Get active season ID for XP tracking
     */
    async getActiveSeasonId(): Promise<string | null> {
        const { data, error } = await supabase
            .from('leaderboard_seasons')
            .select('id')
            .eq('is_active', true)
            .lte('start_at', new Date().toISOString())
            .or(`end_at.is.null,end_at.gte.${new Date().toISOString()}`)
            .order('start_at', { ascending: false })
            .limit(1)
            .single();

        if (error || !data) return null;
        return data.id;
    },

    /**
     * Award XP for a completed attempt.
     * Idempotent: checks if XP was already awarded.
     */
    async awardXpForAttempt(attemptId: string, userId: string): Promise<number> {
        // 1. Fetch Attempt
        const { data: attempt, error: fetchError } = await supabase
            .from('quiz_attempts')
            .select('answers, xp_awarded, correct')
            .eq('id', attemptId)
            .eq('user_id', userId)
            .single();

        if (fetchError || !attempt) {
            console.error("XP: Failed to fetch attempt", fetchError);
            return 0;
        }

        // 2. Idempotency Check
        if (attempt.xp_awarded) {
            console.warn("XP: Already awarded for this attempt.");
            return 0;
        }

        // 3. Calculate XP (1 XP per correct answer)
        // If 'correct' column is reliable use it, otherwise recount from answers JSON
        let xpAmount = attempt.correct || 0;

        // Fallback calculation if correct is null/0 but answers exist
        if (xpAmount === 0 && Array.isArray(attempt.answers)) {
            xpAmount = attempt.answers.filter((a: any) => a.isCorrect).length;
        }

        if (xpAmount <= 0) {
            // Mark as awarded even if 0 to prevent retries
            await supabase.from('quiz_attempts').update({ xp_awarded: true }).eq('id', attemptId);
            return 0;
        }

        // 4. Record XP Event
        const { error: eventError } = await supabase.from('xp_events').insert({
            user_id: userId,
            xp_amount: xpAmount,
            source_type: 'attempt_completion',
            attempt_id: attemptId
        });

        if (eventError) {
            console.error("XP: Failed to insert event", eventError);
            // Don't duplicate logic, just return
            return 0;
        }

        // 5. Update Global Profile Balance (Atomic via RPC)
        const { error: profileXpError } = await supabase.rpc('increment_profile_xp', {
            p_user_id: userId,
            p_amount: xpAmount
        });

        if (profileXpError) {
            console.error("XP: Failed to increment profile XP", profileXpError);
        }

        // 6. Update Seasonal Balance (Atomic via RPC)
        const seasonId = await this.getActiveSeasonId();
        if (seasonId) {
            const { error: seasonXpError } = await supabase.rpc('upsert_user_xp', {
                p_user_id: userId,
                p_season_id: seasonId,
                p_amount: xpAmount
            });

            if (seasonXpError) {
                console.error("XP: Failed to upsert seasonal XP", seasonXpError);
            }
        }

        // 7. Mark Attempt as Awarded
        await supabase.from('quiz_attempts').update({ xp_awarded: true }).eq('id', attemptId);

        return xpAmount;
    },

    /**
     * Get User's Total and Season XP
     */
    async getUserXp(userId: string): Promise<UserXpStats> {
        // Fetch Profile for Total
        const { data: profile } = await supabase
            .from('profiles')
            .select('total_xp')
            .eq('id', userId)
            .single();

        const totalXp = profile?.total_xp || 0;

        // Fetch Season XP
        let seasonXp = 0;
        const seasonId = await this.getActiveSeasonId();
        if (seasonId) {
            const { data: sXp } = await supabase
                .from('user_xp')
                .select('xp')
                .eq('user_id', userId)
                .eq('season_id', seasonId)
                .single();
            seasonXp = sXp?.xp || 0;
        }

        // Calculate Level (Simple Algorithm: Level = sqrt(XP / 10))
        // or just linear thresholds. Let's use a simple formula.
        // Level N requires N * 100 XP.
        // Current Level = Math.floor(totalXp / 100) + 1
        const level = Math.floor(totalXp / 100) + 1;
        const nextLevelXp = level * 100;
        const currentLevelStartXp = (level - 1) * 100;
        const progress = Math.min(100, Math.max(0, ((totalXp - currentLevelStartXp) / (nextLevelXp - currentLevelStartXp)) * 100));

        return {
            totalXp,
            seasonXp,
            currentLevel: level,
            nextLevelProgress: Math.round(progress)
        };
    }
};
