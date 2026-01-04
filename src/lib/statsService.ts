/**
 * Stats Service
 * Provides analytics, trend calculations, and recommendations for the coaching dashboard.
 */

import { supabase } from './supabaseClient';

// Types
export interface AttemptWithDetails {
    id: string;
    created_at: string;
    score: number;
    correct: number;
    total_questions: number;
    mode: string | null;
    is_idoneo: boolean | null;
    answers: AnswerDetail[];
}

export interface AnswerDetail {
    questionId: string;
    subjectId?: string;
    subjectName: string;
    topicId?: string;
    topicName?: string;
    isCorrect: boolean;
    isSkipped: boolean;
    responseTimeMs?: number;
}

export interface TrendData {
    currentValue: number;
    previousValue: number;
    delta: number;
    direction: 'up' | 'down' | 'stable';
    label: string;
}

export interface SubjectPerformance {
    subjectId: string;
    subjectName: string;
    accuracy: number;
    totalQuestions: number;
    correctAnswers: number;
    trend: 'improving' | 'declining' | 'stable';
    status: 'good' | 'warning' | 'critical';
}

export interface Recommendation {
    id: string;
    type: 'review' | 'practice' | 'simulation' | 'goal';
    title: string;
    description: string;
    priority: number;
    actionUrl?: string;
    actionLabel?: string;
    metadata?: Record<string, any>;
}

// ============================================
// Trend Calculations
// ============================================

export function calculateTrends(attempts: AttemptWithDetails[], days: number = 7): {
    scoreTrend: TrendData;
    accuracyTrend: TrendData;
} {
    const now = new Date();
    const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const prevPeriodStart = new Date(periodStart.getTime() - days * 24 * 60 * 60 * 1000);

    // Split attempts into current and previous periods
    const currentPeriod = attempts.filter(a => new Date(a.created_at) >= periodStart);
    const previousPeriod = attempts.filter(a => {
        const date = new Date(a.created_at);
        return date >= prevPeriodStart && date < periodStart;
    });

    // Calculate averages
    const calcAvgScore = (arr: AttemptWithDetails[]) =>
        arr.length > 0 ? arr.reduce((sum, a) => sum + (a.score || 0), 0) / arr.length : 0;

    const calcAvgAccuracy = (arr: AttemptWithDetails[]) => {
        const valid = arr.filter(a => a.total_questions > 0);
        if (valid.length === 0) return 0;
        return valid.reduce((sum, a) => sum + (a.correct / a.total_questions) * 100, 0) / valid.length;
    };

    const currentScore = calcAvgScore(currentPeriod);
    const previousScore = calcAvgScore(previousPeriod);
    const scoreDelta = previousScore > 0 ? ((currentScore - previousScore) / previousScore) * 100 : 0;

    const currentAccuracy = calcAvgAccuracy(currentPeriod);
    const previousAccuracy = calcAvgAccuracy(previousPeriod);
    const accuracyDelta = previousAccuracy > 0 ? ((currentAccuracy - previousAccuracy) / previousAccuracy) * 100 : 0;

    return {
        scoreTrend: {
            currentValue: currentScore,
            previousValue: previousScore,
            delta: scoreDelta,
            direction: scoreDelta > 2 ? 'up' : scoreDelta < -2 ? 'down' : 'stable',
            label: `${scoreDelta >= 0 ? '+' : ''}${scoreDelta.toFixed(0)}% vs last ${days}d`
        },
        accuracyTrend: {
            currentValue: currentAccuracy,
            previousValue: previousAccuracy,
            delta: accuracyDelta,
            direction: accuracyDelta > 2 ? 'up' : accuracyDelta < -2 ? 'down' : 'stable',
            label: `${accuracyDelta >= 0 ? '+' : ''}${accuracyDelta.toFixed(0)}% vs last ${days}d`
        }
    };
}

// ============================================
// Subject Performance Analysis
// ============================================

export function analyzeSubjectPerformance(attempts: AttemptWithDetails[]): SubjectPerformance[] {
    const subjectMap: Record<string, { correct: number; total: number; recentCorrect: number; recentTotal: number }> = {};

    // Sort attempts by date (newest first)
    const sorted = [...attempts].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Last 3 attempts for trend calculation
    const recentAttempts = sorted.slice(0, 3);
    const recentIds = new Set(recentAttempts.map(a => a.id));

    // Aggregate by subject
    attempts.forEach(att => {
        if (!Array.isArray(att.answers)) return;

        att.answers.forEach((ans: AnswerDetail) => {
            const name = ans.subjectName || 'Generale';
            const id = ans.subjectId || name;

            if (!subjectMap[id]) {
                subjectMap[id] = { correct: 0, total: 0, recentCorrect: 0, recentTotal: 0 };
            }

            subjectMap[id].total++;
            if (ans.isCorrect) subjectMap[id].correct++;

            if (recentIds.has(att.id)) {
                subjectMap[id].recentTotal++;
                if (ans.isCorrect) subjectMap[id].recentCorrect++;
            }
        });
    });

    // Build performance array
    return Object.entries(subjectMap).map(([id, data]) => {
        const accuracy = (data.correct / data.total) * 100;
        const recentAccuracy = data.recentTotal > 0 ? (data.recentCorrect / data.recentTotal) * 100 : accuracy;

        const trendDiff = recentAccuracy - accuracy;
        const trend: 'improving' | 'declining' | 'stable' =
            trendDiff > 5 ? 'improving' : trendDiff < -5 ? 'declining' : 'stable';

        const status: 'good' | 'warning' | 'critical' =
            accuracy >= 70 ? 'good' : accuracy >= 50 ? 'warning' : 'critical';

        // Try to extract a readable name
        const firstAttemptWithSubject = attempts.find(a =>
            Array.isArray(a.answers) && a.answers.some((ans: AnswerDetail) => ans.subjectId === id || ans.subjectName === id)
        );
        const subjectName = firstAttemptWithSubject?.answers?.find(
            (ans: AnswerDetail) => ans.subjectId === id || ans.subjectName === id
        )?.subjectName || id;

        return {
            subjectId: id,
            subjectName,
            accuracy,
            totalQuestions: data.total,
            correctAnswers: data.correct,
            trend,
            status
        };
    }).sort((a, b) => a.accuracy - b.accuracy); // Worst first
}

// ============================================
// Recommendations Engine
// ============================================

export function generateRecommendations(
    attempts: AttemptWithDetails[],
    subjectPerformance: SubjectPerformance[],
    quizId: string
): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // 1. Review wrong answers if there are many
    const totalWrong = attempts.reduce((sum, a) => {
        if (!Array.isArray(a.answers)) return sum;
        return sum + a.answers.filter((ans: AnswerDetail) => !ans.isCorrect && !ans.isSkipped).length;
    }, 0);

    if (totalWrong > 5) {
        recommendations.push({
            id: 'review-wrong',
            type: 'review',
            title: `Ripassa ${totalWrong} errori`,
            description: 'Rivedi le domande sbagliate per capire dove migliorare.',
            priority: 1,
            actionUrl: `/quiz/${quizId}/review`,
            actionLabel: 'Inizia ripasso'
        });
    }

    // 2. Practice weak subject
    const weakestSubject = subjectPerformance.find(s => s.status === 'critical');
    if (weakestSubject) {
        recommendations.push({
            id: 'practice-weak',
            type: 'practice',
            title: `Allenati su ${weakestSubject.subjectName}`,
            description: `Accuratezza solo ${weakestSubject.accuracy.toFixed(0)}%. Questa materia richiede più pratica.`,
            priority: 2,
            actionUrl: `/quiz/${quizId}/practice?subject=${weakestSubject.subjectId}`,
            actionLabel: 'Fai esercizi'
        });
    }

    // 3. Simulation if not done recently
    const lastAttempt = attempts[0];
    const daysSinceLastAttempt = lastAttempt
        ? Math.floor((Date.now() - new Date(lastAttempt.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

    if (daysSinceLastAttempt >= 2 || attempts.length < 3) {
        recommendations.push({
            id: 'do-simulation',
            type: 'simulation',
            title: 'Fai una simulazione completa',
            description: daysSinceLastAttempt >= 2
                ? `Sono passati ${daysSinceLastAttempt} giorni dall'ultimo test.`
                : 'Fai più simulazioni per prepararti al meglio.',
            priority: 3,
            actionUrl: `/quiz/${quizId}/official`,
            actionLabel: 'Inizia simulazione'
        });
    }

    // 4. Suggest setting a goal if none exists
    if (attempts.length >= 3) {
        recommendations.push({
            id: 'set-goal',
            type: 'goal',
            title: 'Imposta un obiettivo',
            description: 'Definisci un traguardo per rimanere motivato.',
            priority: 4,
            actionLabel: 'Imposta obiettivo'
        });
    }

    // Sort by priority and return top 3
    return recommendations.sort((a, b) => a.priority - b.priority).slice(0, 3);
}

// ============================================
// Readiness Level
// ============================================

export interface ReadinessDetail {
    level: 'low' | 'medium' | 'high';
    label: string;
    color: string;
    score?: number;
    breakdown?: {
        accuracy: number;
        volume: number;
        coverage: number;
        reliability: number;
        recency: number;
    }
}

export function calculateReadinessLevel(
    avgScore: number,
    avgAccuracy: number,
    attemptCount: number,
    leaderboardData?: any
): ReadinessDetail {
    // If we have official leaderboard data, use it!
    if (leaderboardData && leaderboardData.score !== undefined) {
        const score = leaderboardData.score;
        let level: 'low' | 'medium' | 'high' = 'low';
        let label = 'Da migliorare';
        let color = 'semantic-error';

        if (score >= 85) {
            level = 'high';
            label = 'Pronto';
            color = 'semantic-success';
        } else if (score >= 50) {
            level = 'medium';
            label = 'A buon punto';
            color = 'brand-orange';
        }

        return {
            level,
            label,
            color,
            score,
            breakdown: {
                accuracy: leaderboardData.accuracy_weighted || 0,
                volume: (leaderboardData.volume_factor || 0) * 100,
                coverage: (leaderboardData.coverage_score || 0) * 100,
                reliability: (leaderboardData.reliability || 0) * 100,
                recency: (leaderboardData.recency_score || 0) * 100
            }
        };
    }

    // Heuristic fallback if leaderboard not yet calculated
    const scoreWeight = avgScore >= 90 ? 2 : avgScore >= 70 ? 1 : 0;
    const accuracyWeight = avgAccuracy >= 90 ? 2 : avgAccuracy >= 70 ? 1 : 0;
    const volumeWeight = attemptCount >= 10 ? 2 : attemptCount >= 5 ? 1 : 0;

    const total = scoreWeight + accuracyWeight + volumeWeight;
    const scoreEstimate = Math.min((total / 6) * 100, 100);

    if (total >= 5) {
        return {
            level: 'high', label: 'Pronto', color: 'semantic-success', score: scoreEstimate,
            breakdown: { accuracy: avgAccuracy, volume: (attemptCount / 10) * 100, coverage: 0, reliability: 0, recency: 100 }
        };
    } else if (total >= 3) {
        return {
            level: 'medium', label: 'In progresso', color: 'brand-orange', score: scoreEstimate,
            breakdown: { accuracy: avgAccuracy, volume: (attemptCount / 10) * 100, coverage: 0, reliability: 0, recency: 100 }
        };
    } else {
        return {
            level: 'low', label: 'Da migliorare', color: 'semantic-error', score: scoreEstimate,
            breakdown: { accuracy: avgAccuracy, volume: (attemptCount / 10) * 100, coverage: 0, reliability: 0, recency: 100 }
        };
    }
}

// ============================================
// Goal Updates
// ============================================

export async function updateGoals(
    userId: string,
    quizId: string,
    attemptData: { score: number; total: number; correct: number }
) {
    // 1. Fetch active goals for this user/quiz
    const { data: goals, error } = await supabase
        .from('test_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('quiz_id', quizId)
        .eq('status', 'active');

    if (error || !goals?.length) return;

    const accuracy = attemptData.total > 0 ? (attemptData.correct / attemptData.total) * 100 : 0;

    // 2. Process each goal
    for (const goal of goals) {
        let newValue = goal.current_value;
        let achieved = false;

        if (goal.goal_type === 'score') {
            // For/Score goals: track best score or just check threshold
            // We'll treat current_value as "best score so far"
            if (attemptData.score > (goal.current_value || 0)) {
                newValue = attemptData.score;
            }
            if (attemptData.score >= goal.target_value) {
                achieved = true;
            }
        } else if (goal.goal_type === 'accuracy') {
            // Similar for accuracy
            if (accuracy > (goal.current_value || 0)) {
                newValue = accuracy;
            }
            if (accuracy >= goal.target_value) {
                achieved = true;
            }
        } else if (goal.goal_type === 'attempts') {
            // Increment attempts
            newValue = (goal.current_value || 0) + 1;
            if (newValue >= goal.target_value) {
                achieved = true;
            }
        }

        // 3. Update if changed
        if (newValue !== goal.current_value || achieved) {
            await supabase
                .from('test_goals')
                .update({
                    current_value: newValue,
                    status: achieved ? 'achieved' : 'active',
                    updated_at: new Date().toISOString()
                })
                .eq('id', goal.id);
        }
    }
}

export const statsService = {
    calculateTrends,
    analyzeSubjectPerformance,
    generateRecommendations,
    calculateReadinessLevel,
    updateGoals
};
