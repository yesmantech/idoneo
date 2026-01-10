import { supabase } from './supabaseClient';
import { analytics } from './analytics';

export type BadgeId =
    | 'primo_passo'
    | 'secchione'
    | 'veterano'
    | 'social'
    | 'inarrestabile'
    | 'cecchino'
    | 'fulmine'
    | 'enciclopedia'
    | 'nottambulo'
    | 'hub_master'
    | 'costanza'
    | 'maratona'      // NEW: 14-day streak
    | 'diamante'      // NEW: 60-day streak
    | 'immortale'     // NEW: 100-day streak
    | 'leggenda';

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
     * Award a badge to a user (Idempotent)
     * Silently handles RLS errors to prevent console spam
     */
    async awardBadge(userId: string, badgeId: BadgeId) {
        try {
            const { error } = await supabase
                .from('user_badges')
                .upsert({ user_id: userId, badge_id: badgeId }, { onConflict: 'user_id, badge_id' });

            // Silently ignore RLS policy errors (42501) - user may not have permission yet
            if (error && error.code !== '42501') {
                console.warn(`Badge award skipped for ${badgeId}:`, error.message);
            } else if (!error) {
                // Track successful badge award
                analytics.track('badge_earned', { badge_id: badgeId });
            }
        } catch (e) {
            // Silently fail - badges are non-critical
        }
    },

    /**
     * Check and award badges based on current stats
     * This can be called after significant events (quiz completion, referral, etc.)
     */
    async checkAndAwardBadges(userId: string) {
        try {
            console.log('Badge Check: Starting for user', userId);

            // 1. Fetch User Profile Stats
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('total_xp, referral_count, current_streak')
                .eq('id', userId)
                .single();

            if (profileError) {
                console.error('Badge Check: Profile Fetch Error', profileError);
                return;
            }

            if (!profile) {
                console.warn('Badge Check: No profile found for', userId);
                return;
            }

            console.log('Badge Check: Data fetched', profile);
            console.log('Badge Check: Total XP:', profile.total_xp);
            console.log('Badge Check: Current Streak:', profile.current_streak);

            // 2. veterano: 1000+ total XP (assuming 1 XP per correct answer)
            if ((profile.total_xp || 0) >= 1000) {
                console.log('Badge Check: Awarding veterano');
                await this.awardBadge(userId, 'veterano');
            }

            // 3. social: 5+ referrals
            if ((profile.referral_count || 0) >= 5) {
                console.log('Badge Check: Awarding social');
                await this.awardBadge(userId, 'social');
            }

            // 4. costanza: 7 day streak
            if ((profile.current_streak || 0) >= 7) {
                console.log('Badge Check: Awarding costanza');
                await this.awardBadge(userId, 'costanza');
            }

            // 5. maratona: 14 day streak (Gold tier)
            if ((profile.current_streak || 0) >= 14) {
                console.log('Badge Check: Awarding maratona');
                await this.awardBadge(userId, 'maratona');
            }

            // 6. inarrestabile: 30 day streak
            if ((profile.current_streak || 0) >= 30) {
                console.log('Badge Check: Awarding inarrestabile');
                await this.awardBadge(userId, 'inarrestabile');
            }

            // 7. diamante: 60 day streak (Sapphire tier)
            if ((profile.current_streak || 0) >= 60) {
                console.log('Badge Check: Awarding diamante');
                await this.awardBadge(userId, 'diamante');
            }

            // 8. immortale: 100 day streak (Diamond tier)
            if ((profile.current_streak || 0) >= 100) {
                console.log('Badge Check: Awarding immortale');
                await this.awardBadge(userId, 'immortale');
            }

            // 6. hub_master: participation in 5 different quizzes/contests
            const { data: uniqueData } = await supabase
                .from('quiz_attempts')
                .select('quiz_id')
                .eq('user_id', userId);

            const uniqueIds = new Set(uniqueData?.map(d => d.quiz_id));
            if (uniqueIds.size >= 5) {
                console.log('Badge Check: Awarding hub_master');
                await this.awardBadge(userId, 'hub_master');
            }

            // 7. nottambulo: 5 attempts between 01:00 and 05:00
            const { data: nightAttempts } = await supabase
                .from('quiz_attempts')
                .select('created_at')
                .eq('user_id', userId);

            const lateNightCount = nightAttempts?.filter(a => {
                const hour = new Date(a.created_at).getHours();
                return hour >= 1 && hour < 5;
            }).length || 0;

            if (lateNightCount >= 5) {
                console.log('Badge Check: Awarding nottambulo');
                await this.awardBadge(userId, 'nottambulo');
            }

            // 8. secchione: check if any attempt has 100% correct (min 10 questions)
            const { data: perfectAttempt } = await supabase
                .from('quiz_attempts')
                .select('id')
                .eq('user_id', userId)
                .filter('correct', 'eq', 'total_questions')
                .gt('total_questions', 9)
                .limit(1)
                .maybeSingle();

            if (perfectAttempt) {
                console.log('Badge Check: Awarding secchione');
                await this.awardBadge(userId, 'secchione');
            }

            // 9. primo_passo: at least one attempt
            const { count: attemptCount } = await supabase
                .from('quiz_attempts')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);

            if (attemptCount && attemptCount > 0) {
                console.log('Badge Check: Awarding primo_passo');
                await this.awardBadge(userId, 'primo_passo');
            }

        } catch (error) {
            console.error('Error checking badges:', error);
        }
    }
};
