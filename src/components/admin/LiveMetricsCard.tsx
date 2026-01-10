import React, { useEffect, useState } from 'react';
import { Users, Zap, Target, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface TodayStats {
    newUsers: number;
    quizzesCompleted: number;
    avgScore: number;
    activeStreaks: number;
}

interface YesterdayComparison {
    newUsers: number;
    quizzesCompleted: number;
}

// Animated counter hook
function useAnimatedCounter(target: number, duration = 1000): number {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (target === 0) {
            setCount(0);
            return;
        }

        let startTime: number;
        let animationFrame: number;

        const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);

            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            setCount(Math.floor(easeOutQuart * target));

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [target, duration]);

    return count;
}

// Individual metric card
function MetricCard({
    icon: Icon,
    label,
    value,
    suffix = '',
    trend,
    trendValue,
    color
}: {
    icon: React.ElementType;
    label: string;
    value: number;
    suffix?: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    color: string;
}) {
    const animatedValue = useAnimatedCounter(value);

    return (
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-[20px] shadow-sm group hover:shadow-lg transition-all duration-300">
            {/* Glow effect */}
            <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity`} />

            {/* Icon */}
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-lg`}>
                <Icon className="w-5 h-5 text-white" />
            </div>

            {/* Label */}
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                {label}
            </p>

            {/* Value */}
            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                    {animatedValue}{suffix}
                </span>

                {/* Trend indicator */}
                {trend && trendValue && (
                    <div className={`flex items-center gap-0.5 text-xs font-bold ${trend === 'up' ? 'text-emerald-500' :
                            trend === 'down' ? 'text-rose-500' :
                                'text-slate-400'
                        }`}>
                        {trend === 'up' ? <TrendingUp className="w-3 h-3" /> :
                            trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
                        {trendValue}
                    </div>
                )}
            </div>

            {/* Animated pulse dot for "live" feel */}
            <div className="absolute top-3 right-3">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
            </div>
        </div>
    );
}

export default function LiveMetricsCard() {
    const [stats, setStats] = useState<TodayStats>({
        newUsers: 0,
        quizzesCompleted: 0,
        avgScore: 0,
        activeStreaks: 0
    });
    const [comparison, setComparison] = useState<YesterdayComparison>({
        newUsers: 0,
        quizzesCompleted: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTodayStats();

        // Refresh every 30 seconds for "live" feel
        const interval = setInterval(fetchTodayStats, 30000);
        return () => clearInterval(interval);
    }, []);

    async function fetchTodayStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISO = today.toISOString();

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayISO = yesterday.toISOString();

        try {
            // New users today
            const { count: newUsersToday } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', todayISO);

            // Quizzes completed today
            const { count: quizzesToday } = await supabase
                .from('quiz_attempts')
                .select('*', { count: 'exact', head: true })
                .gte('finished_at', todayISO)
                .not('finished_at', 'is', null);

            // Average score today (from finished attempts)
            const { data: scoresData } = await supabase
                .from('quiz_attempts')
                .select('score')
                .gte('finished_at', todayISO)
                .not('finished_at', 'is', null)
                .not('score', 'is', null);

            const avgScore = scoresData && scoresData.length > 0
                ? Math.round(scoresData.reduce((sum, a) => sum + (a.score || 0), 0) / scoresData.length)
                : 0;

            // Active streaks (users with streak >= 3)
            const { count: activeStreaks } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .gte('streak_current', 3);

            // Yesterday comparison
            const { count: newUsersYesterday } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', yesterdayISO)
                .lt('created_at', todayISO);

            const { count: quizzesYesterday } = await supabase
                .from('quiz_attempts')
                .select('*', { count: 'exact', head: true })
                .gte('finished_at', yesterdayISO)
                .lt('finished_at', todayISO)
                .not('finished_at', 'is', null);

            setStats({
                newUsers: newUsersToday || 0,
                quizzesCompleted: quizzesToday || 0,
                avgScore,
                activeStreaks: activeStreaks || 0
            });

            setComparison({
                newUsers: newUsersYesterday || 0,
                quizzesCompleted: quizzesYesterday || 0
            });

        } catch (err) {
            console.error('Failed to fetch today stats:', err);
        } finally {
            setLoading(false);
        }
    }

    // Calculate trends
    const usersTrend = stats.newUsers > comparison.newUsers ? 'up' :
        stats.newUsers < comparison.newUsers ? 'down' : 'neutral';
    const usersTrendValue = comparison.newUsers > 0
        ? `${Math.round(((stats.newUsers - comparison.newUsers) / comparison.newUsers) * 100)}%`
        : '+∞';

    const quizzesTrend = stats.quizzesCompleted > comparison.quizzesCompleted ? 'up' :
        stats.quizzesCompleted < comparison.quizzesCompleted ? 'down' : 'neutral';
    const quizzesTrendValue = comparison.quizzesCompleted > 0
        ? `${Math.round(((stats.quizzesCompleted - comparison.quizzesCompleted) / comparison.quizzesCompleted) * 100)}%`
        : '+∞';

    return (
        <div className="mb-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <Activity className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-900 dark:text-white">Live Metrics</h2>
                        <p className="text-xs text-slate-500">Aggiornato ogni 30 secondi</p>
                    </div>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    LIVE
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    icon={Users}
                    label="Nuovi Utenti Oggi"
                    value={stats.newUsers}
                    trend={usersTrend}
                    trendValue={usersTrendValue}
                    color="from-blue-500 to-cyan-500"
                />
                <MetricCard
                    icon={Zap}
                    label="Quiz Completati"
                    value={stats.quizzesCompleted}
                    trend={quizzesTrend}
                    trendValue={quizzesTrendValue}
                    color="from-amber-500 to-orange-500"
                />
                <MetricCard
                    icon={Target}
                    label="Punteggio Medio"
                    value={stats.avgScore}
                    suffix="%"
                    color="from-emerald-500 to-green-500"
                />
                <MetricCard
                    icon={TrendingUp}
                    label="Streak Attive (3+)"
                    value={stats.activeStreaks}
                    color="from-rose-500 to-pink-500"
                />
            </div>
        </div>
    );
}
