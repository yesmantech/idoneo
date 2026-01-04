import { supabase } from "@/lib/supabaseClient";

export interface LeaderboardEntry {
    rank: number;
    user: {
        avatarUrl?: string;
        nickname: string;
        id: string;
    };
    score: number;
    isCurrentUser?: boolean;
    // New breakdown fields (optional as they might not persist for XP)
    breakdown?: {
        volume: number;
        accuracy: number;
        recency: number;
        coverage: number;
        reliability: number;
    };
}

export const leaderboardService = {
    // 0. Update User Score
    // [REFACTORED] Function logic moved to Postgres Trigger (2026-01-02)
    // This is now an O(1) operation on the server.
    async updateUserScore(userId: string, quizId: string) {
        // We no longer need to fetch attempts or calculate locally.
        // The trigger 'on_new_attempt_score' on 'quiz_attempts' handles this
        // immediately after the attempt is inserted/updated.
        console.log("updateUserScore: Managed by Server-Side Trigger for user", userId);
        return;
    },

    // 1. Fetch Skill Leaderboard for a quiz
    async getSkillLeaderboard(quizId: string, limit = 50): Promise<LeaderboardEntry[]> {
        // Fetch from the materialized table
        const { data: rankings, error } = await supabase
            .from('concorso_leaderboard')
            .select(`
                user_id, 
                score,
                volume_factor,
                accuracy_weighted,
                recency_score,
                coverage_score,
                reliability
            `)
            .eq('quiz_id', quizId)
            .order('score', { ascending: false })
            .limit(limit);

        if (error) {
            console.error("Error fetching skill leaderboard:", error);
            return [];
        }

        if (!rankings || rankings.length === 0) return [];

        // Fetch Profiles
        const userIds = rankings.map(r => r.user_id);
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, nickname, avatar_url')
            .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]));

        return rankings.map((row, idx) => {
            const profile = profileMap.get(row.user_id);
            return {
                rank: idx + 1,
                user: {
                    id: row.user_id,
                    nickname: profile?.nickname || `User ${row.user_id.slice(0, 4)}`,
                    avatarUrl: profile?.avatar_url
                },
                score: Number(row.score),
                isCurrentUser: false,
                breakdown: {
                    volume: row.volume_factor,
                    accuracy: row.accuracy_weighted,
                    recency: row.recency_score || 0,
                    coverage: row.coverage_score || 0,
                    reliability: row.reliability || 0
                }
            };
        });
    },

    // 2. Fetch Global XP Leaderboard
    async getXPLeaderboard(seasonId: string | null = null, limit = 50): Promise<LeaderboardEntry[]> {
        // If Season ID is provided, fetch specific season XP
        if (seasonId) {
            const { data: rankings, error } = await supabase
                .from('user_xp')
                .select('user_id, xp')
                .eq('season_id', seasonId)
                .order('xp', { ascending: false })
                .limit(limit);

            if (error) {
                console.error("Error fetching season XP:", error);
                return [];
            }
            if (!rankings || rankings.length === 0) return []; // Or fallback to mock if strictly needed for dev

            // Fetch Profiles for nicknames
            const userIds = rankings.map(r => r.user_id);
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, nickname, avatar_url')
                .in('id', userIds);

            const profileMap = new Map(profiles?.map(p => [p.id, p]));

            return rankings.map((row, idx) => {
                const profile = profileMap.get(row.user_id);
                return {
                    rank: idx + 1,
                    user: {
                        id: row.user_id,
                        nickname: profile?.nickname || `Player ${row.user_id.slice(0, 4)}`,
                        avatarUrl: profile?.avatar_url
                    },
                    score: row.xp
                };
            });
        }

        // Default: Fetch ALL TIME XP from profiles
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id, nickname, avatar_url, total_xp')
            .order('total_xp', { ascending: false }) // Sorting by total_xp
            .limit(limit);

        if (error) {
            console.error("Error fetching all-time XP:", error);
            return [];
        }

        if (!profiles || profiles.length === 0) return [];

        return profiles.map((p, idx) => ({
            rank: idx + 1,
            user: {
                id: p.id,
                nickname: p.nickname || `User ${p.id.slice(0, 4)}`,
                avatarUrl: p.avatar_url
            },
            score: p.total_xp || 0
        }));
    },

    // 2b. Get User's Total Participnats Count for a quiz
    async getParticipantsCount(quizId: string): Promise<number> {
        const { count, error } = await supabase
            .from('concorso_leaderboard')
            .select('*', { count: 'exact', head: true })
            .eq('quiz_id', quizId);

        if (error) return 0;
        return count || 0;
    },

    async getXPParticipantsCount(): Promise<number> {
        const { count, error } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .not('total_xp', 'is', null);

        if (error) return 0;
        return count || 0;
    },

    // 2c. Get Specific User Rank
    async getUserSkillRank(userId: string, quizId: string): Promise<LeaderboardEntry | null> {
        // Fetch user's score first
        const { data: userRow, error: scoreError } = await supabase
            .from('concorso_leaderboard')
            .select('score, volume_factor, accuracy_weighted, recency_score, coverage_score, reliability')
            .eq('user_id', userId)
            .eq('quiz_id', quizId)
            .maybeSingle();

        if (scoreError || !userRow) return null;

        // Count how many have higher score
        const { count: higherCount, error: rankError } = await supabase
            .from('concorso_leaderboard')
            .select('*', { count: 'exact', head: true })
            .eq('quiz_id', quizId)
            .gt('score', userRow.score);

        if (rankError) return null;

        // Get Profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, nickname, avatar_url')
            .eq('id', userId)
            .single();

        return {
            rank: (higherCount || 0) + 1,
            user: {
                id: userId,
                nickname: profile?.nickname || 'Io',
                avatarUrl: profile?.avatar_url
            },
            score: Number(userRow.score),
            isCurrentUser: true,
            breakdown: {
                volume: userRow.volume_factor,
                accuracy: userRow.accuracy_weighted,
                recency: userRow.recency_score || 0,
                coverage: userRow.coverage_score || 0,
                reliability: userRow.reliability || 0
            }
        };
    },

    async getUserXPRank(userId: string): Promise<LeaderboardEntry | null> {
        // Fetch user's total_xp
        const { data: profileRow, error: scoreError } = await supabase
            .from('profiles')
            .select('total_xp, nickname, avatar_url')
            .eq('id', userId)
            .single();

        if (scoreError || !profileRow || profileRow.total_xp === null) return null;

        // Count how many have higher XP
        const { count: higherCount, error: rankError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gt('total_xp', profileRow.total_xp);

        if (rankError) return null;

        return {
            rank: (higherCount || 0) + 1,
            user: {
                id: userId,
                nickname: profileRow.nickname || 'Io',
                avatarUrl: profileRow.avatar_url
            },
            score: profileRow.total_xp,
            isCurrentUser: true
        };
    },

    // 3. Get User's Active Quizzes (from Leaderboard)
    async getUserActiveQuizzes(userId: string) {
        // Fetch from concorso_leaderboard which stores the "Official" preparation score
        const { data: leaderboardRows, error } = await supabase
            .from("concorso_leaderboard")
            .select(`
                score,
                last_calculated_at,
                quiz:quizzes (
                    id, 
                    title, 
                    year, 
                    category,
                    slug,
                    role:roles(title)
                )
            `)
            .eq("user_id", userId)
            .order("last_calculated_at", { ascending: false });

        if (error) {
            console.error("Error fetching active quizzes from leaderboard:", error);
            // Fallback to empty, or could try attempts as backup (omitted for cleaner logic)
            return [];
        }

        if (!leaderboardRows) return [];

        return leaderboardRows.map(row => {
            // Flatten the structure
            const quizData = row.quiz as any;
            const quiz = Array.isArray(quizData) ? quizData[0] : quizData;

            return {
                ...quiz,
                // Use the official preparation score (0-100)
                accuracy: Math.round(row.score || 0),
                // We don't have exact attempts count here easily without another join, 
                // but for dashboard "progress" visual, score is what matters.
                // We could rename 'accuracy' to 'score' in the component later if needed, 
                // but keeping 'accuracy' key for compatibility.
                lastPlayed: row.last_calculated_at
            };
        });
    },

    // --- Mocks for Development ---
    getMockSkillData(): LeaderboardEntry[] {
        return [
            { rank: 1, score: 92.5, user: { nickname: 'Kate', id: '1' } },
            { rank: 2, score: 89.1, user: { nickname: 'Liana', id: '2' } },
            { rank: 3, score: 88.4, user: { nickname: 'John', id: '3' } },
            { rank: 4, score: 85.0, user: { nickname: 'Ethan', id: '4' } },
            { rank: 5, score: 82.3, user: { nickname: 'Olivia', id: '5' } },
        ];
    },

    getMockXPData(): LeaderboardEntry[] {
        return [
            { rank: 1, score: 1450, user: { nickname: 'MaxPower', id: 'x1' } },
            { rank: 2, score: 1320, user: { nickname: 'QuizMaster', id: 'x2' } },
            { rank: 3, score: 1280, user: { nickname: 'Luna', id: 'x3' } },
        ];
    }
};
