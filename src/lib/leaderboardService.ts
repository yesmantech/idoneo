import { supabase } from "@/lib/supabaseClient";
import { computeSkillScore } from "./leaderboardAlgorithm";

export interface LeaderboardEntry {
    rank: number;
    user: {
        avatarUrl?: string;
        nickname: string;
        id: string;
    };
    score: number;
    isCurrentUser?: boolean;
}

export const leaderboardService = {
    // 0. Update User Score (Calculate & Save)
    async updateUserScore(userId: string, quizId: string) {
        // 1. Fetch all attempts for this user & quiz
        const { data: attempts, error } = await supabase
            .from("quiz_attempts")
            .select("answers, created_at, started_at")
            .eq("user_id", userId)
            .eq("quiz_id", quizId);

        if (error || !attempts) {
            console.error("Error fetching attempts for score update:", error);
            throw new Error(`Fetch Attempts Failed: ${error?.message}`);
        }

        // 2. Unpack answers to pure array
        let allAnswers: any[] = [];
        attempts.forEach(att => {
            if (Array.isArray(att.answers)) {
                att.answers.forEach((ans: any) => {
                    allAnswers.push({
                        isCorrect: ans.isCorrect,
                        timestamp: new Date(att.created_at || att.started_at),
                        isOfficial: true
                    });
                });
            }
        });

        // 3. Run Algorithm
        const result = computeSkillScore(allAnswers);

        // 4. Upsert to concorso_leaderboard
        const payload = {
            user_id: userId,
            quiz_id: quizId,
            score: result.score,
            accuracy_weighted: result.accuracyWeighted,
            volume_factor: result.volumeFactor,
            trend_factor: result.trendMultiplier,
            last_calculated_at: new Date().toISOString()
        };

        const { error: upsertError } = await supabase
            .from("concorso_leaderboard")
            .upsert(payload);

        if (upsertError) {
            console.error("Error upserting leaderboard score:", upsertError);
            throw new Error(`Upsert Leaderboard Failed: ${upsertError.message}`);
        }
    },

    // 1. Fetch Skill Leaderboard for a quiz
    async getSkillLeaderboard(quizId: string, limit = 50): Promise<LeaderboardEntry[]> {
        // Fetch from the materialized table
        const { data: rankings, error } = await supabase
            .from('concorso_leaderboard')
            .select('user_id, score')
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
                isCurrentUser: false // To be refined with AuthContext
            };
        });
    },

    // 2. Fetch Global XP Leaderboard
    async getXPLeaderboard(seasonId: string | null = null, limit = 50): Promise<LeaderboardEntry[]> {
        let query = supabase
            .from('user_xp')
            .select('user_id, xp');

        if (seasonId) {
            query = query.eq('season_id', seasonId);
        }

        const { data: rankings, error } = await query.order('xp', { ascending: false }).limit(limit);

        if (error || !rankings || rankings.length === 0) return [];

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
                    nickname: profile?.nickname || `Player ${row.user_id.slice(0, 4)}`,
                    avatarUrl: profile?.avatar_url
                },
                score: row.xp
            };
        });
    },

    // 3. Get User's Active Quizzes (for "My Concorsi" selector)
    async getUserActiveQuizzes(userId: string) {
        // Fetch attempts with quiz details
        // Note: distinct on quiz_id would be better but requires specific RPC or post-processing
        const { data: attempts, error } = await supabase
            .from("quiz_attempts")
            .select(`
                quiz_id,
                correct,
                total_questions,
                quiz:quizzes (
                    id, 
                    title, 
                    year, 
                    category,
                    slug
                )
            `)
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(50); // Scan last 50 attempts to find active ones

        if (error) {
            console.error("Error fetching active quizzes:", error);
            return [];
        }

        if (!attempts) return [];

        // Deduplicate by Quiz ID and compute stats
        const quizStatsMap = new Map<string, { quiz: any, totalCorrect: number, totalQuestions: number, attemptsCount: number }>();

        for (const att of attempts) {
            // Supabase sometimes returns relation as array
            const quizData = att.quiz as any;
            const q = Array.isArray(quizData) ? quizData[0] : quizData;

            if (q && q.id) {
                if (!quizStatsMap.has(q.id)) {
                    quizStatsMap.set(q.id, {
                        quiz: q,
                        totalCorrect: 0,
                        totalQuestions: 0,
                        attemptsCount: 0
                    });
                }

                const stats = quizStatsMap.get(q.id)!;
                stats.attemptsCount++;
                if (att.total_questions > 0) {
                    stats.totalCorrect += (att.correct || 0);
                    stats.totalQuestions += (att.total_questions || 0);
                }
            }
        }

        return Array.from(quizStatsMap.values()).map(item => {
            const avgAccuracy = item.totalQuestions > 0
                ? (item.totalCorrect / item.totalQuestions) * 100
                : 0;

            return {
                ...item.quiz,
                accuracy: Math.round(avgAccuracy),
                attempts: item.attemptsCount
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
