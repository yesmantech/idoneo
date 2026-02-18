/**
 * @file streakService.ts
 * @description Daily streak tracking service for user engagement.
 *
 * The streak system encourages daily app usage by tracking consecutive
 * days of activity. Key features:
 *
 * - **Current Streak**: Number of consecutive days the user has been active
 * - **Max Streak**: Highest streak ever achieved (for badges/achievements)
 * - **Milestones**: Special celebrations at weekly intervals (7, 14, 21...)
 *
 * ## Streak Logic
 *
 * | Scenario | Action |
 * |----------|--------|
 * | First activity ever | Set streak to 1 |
 * | Active yesterday | Increment streak |
 * | Active today already | Update timestamp only |
 * | Inactive for 2+ days | Reset streak to 1 (broken) |
 *
 * ## Events
 *
 * When streak is extended, the service:
 * 1. Updates the database (`profiles.streak_current`, `streak_max`, `last_active_at`)
 * 2. Tracks an analytics event (`streak_extended`)
 * 3. Dispatches a window event (`streak_updated`) for UI celebration
 *
 * @example
 * ```typescript
 * import { streakService } from '@/lib/streakService';
 *
 * // Called on app initialization (see App.tsx)
 * const result = await streakService.checkAndUpdateStreak(userId);
 * if (result?.isMilestone) {
 *   // Show celebration UI
 * }
 * ```
 */

import { supabase } from './supabaseClient';
import { analytics } from './analytics';
import { TIER_THRESHOLDS } from '@/components/gamification/AnimatedFlame';

// ============================================================================
// STREAK SERVICE
// ============================================================================

export const streakService = {
    /**
     * Checks the user's last activity and updates their streak.
     * Should be called when the app initializes or when the user performs a significant action.
     */
    async checkAndUpdateStreak(userId: string) {
        try {
            // 1. Get current profile data
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('streak_current, streak_max, last_active_at')
                .eq('id', userId)
                .single();

            if (error || !profile) return null;

            const now = new Date();
            const lastActive = profile.last_active_at ? new Date(profile.last_active_at) : null;

            // Normalize dates to midnight to compare "days"
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            let newStreak = profile.streak_current || 0;
            let streakUpdated = false;
            let isBroken = false;

            // If never active, just set to 1
            if (!lastActive) {
                newStreak = 1;
                streakUpdated = true;
            } else {
                const lastActiveDate = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());

                if (lastActiveDate.getTime() === today.getTime()) {
                    // Already active today, ABORT increment to prevent double-claim exploit
                    return {
                        streak: newStreak,
                        streakUpdated: false,
                        isBroken: false,
                        isMilestone: false
                    };
                } else if (lastActiveDate.getTime() === yesterday.getTime()) {
                    // Was active yesterday, increment streak!
                    newStreak += 1;
                    streakUpdated = true;
                } else {
                    // Was active before yesterday, broken streak :(
                    if (newStreak > 0) isBroken = true;
                    newStreak = 1; // Reset to 1 (active today)
                    streakUpdated = true;
                }
            }

            // Update Max Streak if needed
            let newMax = profile.streak_max || 0;
            if (newStreak > newMax) {
                newMax = newStreak;
            }

            // 2. Update Database (ONLY if legitimately updated)
            if (streakUpdated) {
                await supabase
                    .from('profiles')
                    .update({
                        streak_current: newStreak,
                        streak_max: newMax,
                        last_active_at: now.toISOString(),
                    })
                    .eq('id', userId);
            }

            // 3. Track Event if streak increased
            if (streakUpdated && newStreak > 1) {
                analytics.track('streak_extended', {
                    new_streak: newStreak,
                    is_milestone: newStreak % 7 === 0 || TIER_THRESHOLDS.includes(newStreak)
                });

                // Dispatch event for UI
                window.dispatchEvent(new CustomEvent('streak_updated', {
                    detail: {
                        streak: newStreak,
                        isMilestone: newStreak % 7 === 0 || TIER_THRESHOLDS.includes(newStreak)
                    }
                }));
            }

            return {
                streak: newStreak,
                streakUpdated,
                isBroken,
                isMilestone: streakUpdated && (newStreak % 7 === 0 || TIER_THRESHOLDS.includes(newStreak))
            };

        } catch (err) {
            console.error('Error updating streak:', err);
            return null;
        }
    }
};
