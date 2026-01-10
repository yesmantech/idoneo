import { supabase } from './supabaseClient';

export interface GrowthStats {
    totalUsers: number;
    totalAttempts: number;
    completionRate: number;
    weeklyGrowth: number;
}

export interface QuizPerformance {
    quizTitle: string;
    attemptsCount: number;
    successRate: number;
}

export const adminAnalytics = {
    /**
     * Fetch high-level growth and performance stats
     */
    async getGrowthStats(): Promise<GrowthStats> {
        const { count: totalUsers } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        const { data: attempts, count: totalAttempts } = await supabase
            .from('quiz_attempts')
            .select('id, finished_at, is_idoneo', { count: 'exact' });

        const finishedAttempts = attempts?.filter(a => a.finished_at) || [];
        const successCount = finishedAttempts.filter(a => a.is_idoneo).length;

        const completionRate = totalAttempts ? (finishedAttempts.length / totalAttempts) * 100 : 0;

        // Simplified weekly growth calculation for demo/current context
        // in a real app, this would compare count from current week vs previous
        const weeklyGrowth = 12; // Placeholder

        return {
            totalUsers: totalUsers || 0,
            totalAttempts: totalAttempts || 0,
            completionRate,
            weeklyGrowth
        };
    },

    /**
     * Get performance by quiz to identify bottlenecks
     */
    async getQuizPerformance(limit = 5): Promise<QuizPerformance[]> {
        const { data, error } = await supabase
            .from('quiz_attempts')
            .select(`
                id,
                is_idoneo,
                quizzes (
                    title
                )
            `)
            .not('quizzes', 'is', null)
            .limit(500); // Sample last 500

        if (error || !data) return [];

        const grouping: Record<string, { total: number; success: number }> = {};

        data.forEach((item: any) => {
            const title = item.quizzes?.title || 'Unknown';
            if (!grouping[title]) grouping[title] = { total: 0, success: 0 };
            grouping[title].total++;
            if (item.is_idoneo) grouping[title].success++;
        });

        return Object.entries(grouping)
            .map(([title, stats]) => ({
                quizTitle: title,
                attemptsCount: stats.total,
                successRate: (stats.success / stats.total) * 100
            }))
            .sort((a, b) => b.attemptsCount - a.attemptsCount)
            .slice(0, limit);
    }
};
