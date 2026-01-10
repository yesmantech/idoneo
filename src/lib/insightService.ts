import { supabase } from './supabaseClient';

// =============================================================================
// TYPES
// =============================================================================

export type InsightType = 'conversion' | 'content_gap' | 'trend' | 'alert';
export type InsightPriority = 'high' | 'medium' | 'low';
export type InsightTrend = 'up' | 'down' | null;

export interface Insight {
    id: string;
    insight_type: InsightType;
    priority: InsightPriority;
    title: string;
    description: string;
    recommendation: string | null;
    trend: InsightTrend;
    metadata: Record<string, any>;
    is_active: boolean;
    created_at: string;
    expires_at: string | null;
}

// =============================================================================
// SERVICE
// =============================================================================

export const insightService = {
    /**
     * Fetch all active insights
     */
    async getActiveInsights(): Promise<Insight[]> {
        const { data, error } = await supabase
            .from('admin_insights')
            .select('*')
            .eq('is_active', true)
            .order('priority', { ascending: true }) // high first (alphabetically 'high' < 'low' < 'medium')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Failed to fetch insights:', error);
            return [];
        }

        // Re-sort properly
        const priorityOrder: Record<InsightPriority, number> = { high: 0, medium: 1, low: 2 };
        return (data || []).sort((a, b) =>
            priorityOrder[a.priority as InsightPriority] - priorityOrder[b.priority as InsightPriority]
        );
    },

    /**
     * Dismiss (deactivate) an insight
     */
    async dismissInsight(id: string): Promise<void> {
        const { error } = await supabase
            .from('admin_insights')
            .update({ is_active: false })
            .eq('id', id);

        if (error) {
            console.error('Failed to dismiss insight:', error);
        }
    },

    /**
     * Generate new insights based on current data
     */
    async generateInsights(): Promise<Insight[]> {
        const insights: Omit<Insight, 'id' | 'created_at'>[] = [];

        // =================================================================
        // 1. CONVERSION GAP ANALYSIS
        // =================================================================
        const { data: quizAttempts } = await supabase
            .from('quiz_attempts')
            .select(`
                id,
                finished_at,
                is_idoneo,
                quiz_id,
                quizzes (title)
            `)
            .limit(1000);

        if (quizAttempts && quizAttempts.length > 0) {
            // Group by quiz
            const quizStats: Record<string, { title: string; total: number; completed: number; success: number }> = {};

            quizAttempts.forEach((attempt: any) => {
                const quizId = attempt.quiz_id;
                const title = attempt.quizzes?.title || 'Unknown';

                if (!quizStats[quizId]) {
                    quizStats[quizId] = { title, total: 0, completed: 0, success: 0 };
                }
                quizStats[quizId].total++;
                if (attempt.finished_at) quizStats[quizId].completed++;
                if (attempt.is_idoneo) quizStats[quizId].success++;
            });

            // Find quizzes with low completion rate
            Object.entries(quizStats).forEach(([quizId, stats]) => {
                if (stats.total >= 10) { // Minimum sample size
                    const completionRate = (stats.completed / stats.total) * 100;
                    const successRate = stats.completed > 0 ? (stats.success / stats.completed) * 100 : 0;

                    if (completionRate < 50) {
                        insights.push({
                            insight_type: 'conversion',
                            priority: completionRate < 30 ? 'high' : 'medium',
                            title: `Basso completamento: ${stats.title}`,
                            description: `Solo il ${Math.round(completionRate)}% degli utenti completa questo quiz. ${stats.total - stats.completed} tentativi abbandonati.`,
                            recommendation: 'Considera di ridurre il numero di domande o aggiungere checkpoint intermedi.',
                            trend: 'down',
                            metadata: { quiz_id: quizId, completion_rate: completionRate },
                            is_active: true,
                            expires_at: null
                        });
                    }

                    if (successRate < 40 && stats.completed >= 5) {
                        insights.push({
                            insight_type: 'alert',
                            priority: successRate < 25 ? 'high' : 'medium',
                            title: `Quiz troppo difficile: ${stats.title}`,
                            description: `Success rate del ${Math.round(successRate)}%. Gli utenti potrebbero scoraggiarsi.`,
                            recommendation: 'Verifica che le domande siano chiare e il tempo sufficiente.',
                            trend: 'down',
                            metadata: { quiz_id: quizId, success_rate: successRate },
                            is_active: true,
                            expires_at: null
                        });
                    }
                }
            });
        }

        // =================================================================
        // 2. USER ENGAGEMENT TRENDS
        // =================================================================
        const { count: totalUsers } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        const { count: activeStreaks } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gte('streak_current', 3);

        if (totalUsers && activeStreaks) {
            const streakPercentage = (activeStreaks / totalUsers) * 100;

            if (streakPercentage > 20) {
                insights.push({
                    insight_type: 'trend',
                    priority: 'low',
                    title: 'Streak engagement alto',
                    description: `${Math.round(streakPercentage)}% degli utenti ha una streak di 3+ giorni.`,
                    recommendation: 'Considera di aggiungere badge o premi per le streak più lunghe.',
                    trend: 'up',
                    metadata: { active_streaks: activeStreaks, total_users: totalUsers },
                    is_active: true,
                    expires_at: null
                });
            } else if (streakPercentage < 5 && totalUsers > 50) {
                insights.push({
                    insight_type: 'alert',
                    priority: 'medium',
                    title: 'Streak engagement basso',
                    description: `Solo ${Math.round(streakPercentage)}% degli utenti mantiene una streak attiva.`,
                    recommendation: 'Aumenta la visibilità delle streak o invia notifiche push.',
                    trend: 'down',
                    metadata: { active_streaks: activeStreaks, total_users: totalUsers },
                    is_active: true,
                    expires_at: null
                });
            }
        }

        // =================================================================
        // 3. CONTENT GAP - Find subjects with few questions
        // =================================================================
        const { data: subjects } = await supabase
            .from('subjects')
            .select('id, name, question_count:questions(count)')
            .order('name');

        if (subjects) {
            subjects.forEach((subject: any) => {
                const count = subject.question_count?.[0]?.count || 0;
                if (count < 20 && count > 0) {
                    insights.push({
                        insight_type: 'content_gap',
                        priority: count < 10 ? 'high' : 'medium',
                        title: `Poche domande: ${subject.name}`,
                        description: `Questa materia ha solo ${count} domande. Gli utenti potrebbero vedere ripetizioni.`,
                        recommendation: `Aggiungi almeno ${50 - count} domande per una copertura completa.`,
                        trend: null,
                        metadata: { subject_id: subject.id, question_count: count },
                        is_active: true,
                        expires_at: null
                    });
                }
            });
        }

        // =================================================================
        // SAVE INSIGHTS TO DATABASE
        // =================================================================
        if (insights.length > 0) {
            // Deactivate old insights first
            await supabase
                .from('admin_insights')
                .update({ is_active: false })
                .eq('is_active', true);

            // Insert new insights
            const { data: inserted, error } = await supabase
                .from('admin_insights')
                .insert(insights)
                .select();

            if (error) {
                console.error('Failed to save insights:', error);
                return [];
            }

            return inserted || [];
        }

        return [];
    }
};
