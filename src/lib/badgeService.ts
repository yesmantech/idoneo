/**
 * @file badgeService.ts
 * @description Achievement badge system for user recognition.
 *
 * Badges reward users for reaching milestones and demonstrating engagement.
 * They are visual achievements displayed on user profiles.
 *
 * ## Badge Categories
 *
 * ### Streak Badges (Consistency)
 * | Badge        | Requirement      | Tier     |
 * |--------------|------------------|----------|
 * | costanza     | 7-day streak     | Bronze   |
 * | maratona     | 14-day streak    | Silver   |
 * | inarrestabile| 30-day streak    | Gold     |
 * | diamante     | 60-day streak    | Sapphire |
 * | immortale    | 100-day streak   | Diamond  |
 *
 * ### Activity Badges
 * | Badge        | Requirement                    |
 * |--------------|--------------------------------|
 * | primo_passo  | Complete first quiz attempt    |
 * | secchione    | Get 100% on 10+ question quiz  |
 * | veterano     | Earn 1000+ total XP            |
 * | hub_master   | Practice 5+ different quizzes  |
 * | nottambulo   | 5+ attempts between 1-5 AM     |
 *
 * ### Social Badges
 * | Badge        | Requirement       |
 * |--------------|-------------------|
 * | social       | Refer 5+ friends  |
 *
 * ## Implementation Notes
 * - Badges are stored in `user_badges` junction table
 * - `awardBadge` is idempotent (uses UPSERT with conflict handling)
 * - Badge checks silently fail to avoid blocking core functionality
 *
 * @example
 * ```typescript
 * import { badgeService } from '@/lib/badgeService';
 *
 * // Check and award all applicable badges (call after quiz completion)
 * await badgeService.checkAndAwardBadges(userId);
 *
 * // Get user's earned badges for profile display
 * const badges = await badgeService.getUserBadges(userId);
 * ```
 */

import { supabase } from './supabaseClient';
import { analytics } from './analytics';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Available badge identifiers.
 * Each corresponds to a specific achievement criteria.
 */
export type BadgeId =
    | 'primo_passo'    // First quiz attempt
    | 'secchione'      // Perfect score on 10+ questions
    | 'veterano'       // 1000+ total XP
    | 'social'         // 5+ referrals
    | 'inarrestabile'  // 30-day streak
    | 'cecchino'       // Reserved: Accuracy badge
    | 'fulmine'        // Reserved: Speed badge
    | 'enciclopedia'   // Reserved: Coverage badge
    | 'nottambulo'     // Night owl (1-5 AM attempts)
    | 'hub_master'     // 5+ different quizzes
    | 'costanza'       // 7-day streak
    | 'maratona'       // 14-day streak
    | 'diamante'       // 60-day streak
    | 'immortale'      // 100-day streak
    | 'leggenda';      // Reserved: Ultimate badge

// ============================================================================
// BADGE SERVICE
// ============================================================================

export const badgeService = {
    /**
     * Fetch all badges awarded to a user
     */
    async getUserBadges(userId: string): Promise<string[]> {
        const { data, error } = await supabase
            .from('user_badges')
            .select('badge_id')
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching user badges:', error);
            return [];
        }

        return data.map(b => b.badge_id);
    },

    /**
     * Fetch all badges with their unlock dates
     */
    async getUserBadgesWithDates(userId: string): Promise<Record<string, string>> {
        const { data, error } = await supabase
            .from('user_badges')
            .select('badge_id, awarded_at')
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching user badges with dates:', error);
            return {};
        }

        const map: Record<string, string> = {};
        for (const b of data) {
            map[b.badge_id] = b.awarded_at;
        }
        return map;
    },

    /**
     * Award a badge to a user (Idempotent)
     * Silently handles RLS errors to prevent console spam
     */
    async awardBadge(userId: string, badgeId: BadgeId, existingBadges?: string[]) {
        try {
            const isNewBadge = existingBadges ? !existingBadges.includes(badgeId) : true;

            const { error } = await supabase
                .from('user_badges')
                .upsert({ user_id: userId, badge_id: badgeId }, { onConflict: 'user_id, badge_id' });

            // Silently ignore RLS policy errors (42501) - user may not have permission yet
            if (error && error.code !== '42501') {
                console.warn(`Badge award skipped for ${badgeId}:`, error.message);
            } else if (!error) {
                // Dispatch event for UI notifications if this is a newly earned badge
                if (isNewBadge && typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('badge_unlocked', { detail: { badgeId } }));
                }
                // Track successful badge award
                analytics.track('badge_earned', { badge_id: badgeId });
            }
        } catch (e) {
            // Silently fail - badges are non-critical
        }
    },

    /**
     * Check and award badges based on current stats
     * This uses a single highly-optimized Postgres RPC instead of making 6+ sequential client queries.
     * This can be called after significant events (quiz completion, referral, etc.)
     */
    async checkAndAwardBadges(userId: string) {
        try {

            // Fetch and evaluate all badges in a single atomic DB transaction
            const { data: awardedBadges, error } = await supabase
                .rpc('check_and_award_badges', { p_user_id: userId });

            if (error) {
                console.error('Badge Check: RPC Error', error);
                return;
            }

            if (awardedBadges && Array.isArray(awardedBadges) && awardedBadges.length > 0) {

                // Dispatch events for UI notifications for newly earned badges
                if (typeof window !== 'undefined') {
                    for (const badgeId of awardedBadges) {
                        window.dispatchEvent(new CustomEvent('badge_unlocked', { detail: { badgeId } }));
                        analytics.track('badge_earned', { badge_id: badgeId });
                    }
                }
            } else {
            }

        } catch (error) {
            console.error('Error checking badges:', error);
        }
    }
};
