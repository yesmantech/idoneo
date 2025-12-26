import { supabase } from "@/lib/supabaseClient";
import { computePreparationScore } from "./leaderboardAlgorithm";

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
    // 0. Update User Score (Calculate & Save)
    async updateUserScore(userId: string, quizId: string) {
        // 1. Fetch all attempts for this user & quiz AND Quiz Details (Bank Size)
        const { data: attempts, error } = await supabase
            .from("quiz_attempts")
            .select(`
                answers, 
                created_at, 
                started_at,
                quiz:quizzes (
                    total_questions
                )
            `)
            .eq("user_id", userId)
            .eq("quiz_id", quizId);

        if (error || !attempts) {
            console.error("Error fetching attempts for score update:", error);
            throw new Error(`Fetch Attempts Failed: ${error?.message}`);
        }

        // Determine Bank Size
        // If multiple attempts, they point to same quiz, so just take first.
        const firstQuiz = (attempts as any)[0]?.quiz;
        const bankSize = Array.isArray(firstQuiz) ? firstQuiz[0]?.total_questions : firstQuiz?.total_questions;
        const safeBankSize = bankSize || 1000; // Default if missing

        // 2. Unpack answers to pure array
        let allAnswers: { isCorrect: boolean; questionId: string; timestamp: number }[] = [];

        attempts.forEach(att => {
            if (Array.isArray(att.answers)) {
                att.answers.forEach((ans: any) => {
                    // Normalize question ID
                    const qId = ans.questionId || ans.question_id || ans.id;
                    const ts = new Date(att.created_at || att.started_at).getTime();

                    if (qId) {
                        allAnswers.push({
                            isCorrect: !!ans.isCorrect,
                            questionId: String(qId),
                            timestamp: ts
                        });
                    }
                });
            }
        });

        // 3. Run Algorithm
        const result = computePreparationScore({
            answers: allAnswers,
            bankSize: safeBankSize
        });

        // 4. Upsert to concorso_leaderboard
        const payload = {
            user_id: userId,
            quiz_id: quizId,
            score: result.score,

            // New Breakdown Columns
            accuracy_weighted: result.accuracyScore, // reusing existing column name if possible, or mapping
            volume_factor: result.volumeScore,       // reusing existing column name
            // New columns from migration
            recency_score: result.recencyScore,
            coverage_score: result.coverageScore,
            reliability: result.reliability,
            unique_questions: result.uniqueQuestions,
            total_answers: result.totalAnswers,

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
                    slug,
                    role:roles(title)
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
