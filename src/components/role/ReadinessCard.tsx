
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, AlertTriangle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { calculateReadinessLevel } from '@/lib/statsService';

interface ReadinessCardProps {
    history: any[];
    theme: any;
    leaderboardData?: any;
}

export default function ReadinessCard({ history, theme, leaderboardData }: ReadinessCardProps) {
    const navigate = useNavigate();

    const handleClick = (statsData: any) => {
        if (!statsData) {
            navigate('/preparazione?hasData=false&level=low&score=0');
        } else {
            const params = new URLSearchParams({
                hasData: 'true',
                level: statsData.level,
                score: String(statsData.score || 0),
                accuracy: String(statsData.breakdown?.accuracy || 0),
                volume: String(statsData.breakdown?.volume || 0),
                coverage: String(statsData.breakdown?.coverage || 0),
                reliability: String(statsData.breakdown?.reliability || 0),
            });
            navigate(`/preparazione?${params.toString()}`);
        }
    };

    const stats = useMemo(() => {
        if (leaderboardData && leaderboardData.score !== undefined) {
            return calculateReadinessLevel(0, 0, history.length, leaderboardData);
        }

        if (!history || history.length < 3) return null;

        const totalTests = history.length;
        const totalScore = history.reduce((acc, curr) => acc + (curr.score || 0), 0);
        const totalCorrect = history.reduce((acc, curr) => acc + (curr.correct || 0), 0);
        const totalQuestions = history.reduce((acc, curr) => acc + (curr.total_questions || 0), 0);

        const avgScore = totalTests ? totalScore / totalTests : 0;
        const normalizedAvg = (avgScore / 30) * 100;
        const trueAccuracy = totalQuestions ? (totalCorrect / totalQuestions) * 100 : 0;

        return calculateReadinessLevel(normalizedAvg, trueAccuracy, totalTests, undefined, history);
    }, [history, leaderboardData]);

    if (!stats) {
        // Empty State — Tier S
        return (
            <div
                onClick={() => handleClick(null)}
                className="group relative cursor-pointer active:scale-[0.98] transition-all duration-300"
            >
                <div className="relative bg-[var(--card)] p-5 rounded-[28px] border border-[var(--card-border)] overflow-hidden shadow-soft hover:shadow-card transition-shadow">
                    {/* Subtle gradient decorator */}
                    <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-slate-200/30 dark:bg-slate-700/20 blur-2xl pointer-events-none" />

                    <div className="flex items-center gap-4 relative z-10">
                        {/* Icon */}
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-[#111] border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center shrink-0">
                            <Trophy className="w-6 h-6 text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Da iniziare
                                </span>
                                <div className="w-4 h-4 rounded-full bg-slate-100 dark:bg-[#111] flex items-center justify-center">
                                    <Info className="w-2.5 h-2.5 text-slate-400" />
                                </div>
                            </div>
                            <h3 className="text-[17px] font-black text-[var(--foreground)] leading-tight mb-0.5">
                                Analisi in attesa...
                            </h3>
                            <p className="text-[13px] text-slate-400 dark:text-slate-500 leading-snug">
                                Completa 3 simulazioni per sbloccare il tuo livello.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const { level, label, color } = stats;

    const levelConfig = {
        high: {
            stroke: '#10B981',
            gradient: 'from-emerald-500/10 to-emerald-500/5',
            badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
            ring: 'ring-emerald-500/20',
            glow: 'rgba(16, 185, 129, 0.15)',
            Icon: Trophy,
            title: 'Sei pronto!',
            subtitle: 'Ottima costanza. Sei pronto per la prova ufficiale.'
        },
        medium: {
            stroke: '#F59E0B',
            gradient: 'from-amber-500/10 to-amber-500/5',
            badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
            ring: 'ring-amber-500/20',
            glow: 'rgba(245, 158, 11, 0.15)',
            Icon: TrendingUp,
            title: 'A buon punto',
            subtitle: 'Continua così, manca poco per l\'eccellenza.'
        },
        low: {
            stroke: '#EF4444',
            gradient: 'from-red-500/10 to-red-500/5',
            badge: 'bg-red-500/10 text-red-600 dark:text-red-400',
            ring: 'ring-red-500/20',
            glow: 'rgba(239, 68, 68, 0.15)',
            Icon: AlertTriangle,
            title: 'Sei all\'inizio',
            subtitle: 'Serve più allenamento. Non mollare!'
        }
    };

    const config = levelConfig[level as keyof typeof levelConfig] || levelConfig.low;
    const scoreValue = stats.score !== undefined ? stats.score : (level === 'high' ? 92 : level === 'medium' ? 65 : 35);
    const circumference = 2 * Math.PI * 34;

    return (
        <div
            onClick={() => handleClick(stats)}
            className="group relative cursor-pointer active:scale-[0.98] transition-all duration-300"
        >
            <div className="relative bg-[var(--card)] p-5 rounded-[28px] border border-[var(--card-border)] overflow-hidden shadow-soft hover:shadow-card transition-shadow">
                {/* Ambient glow */}
                <div
                    className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-60"
                    style={{ background: config.glow }}
                />

                <div className="flex items-center gap-4 relative z-10">
                    {/* Radial Gauge — Premium */}
                    <div className="relative w-[72px] h-[72px] shrink-0 flex items-center justify-center">
                        <svg className="w-full h-full" viewBox="0 0 76 76">
                            {/* Track */}
                            <circle
                                cx="38"
                                cy="38"
                                r="34"
                                fill="transparent"
                                stroke="currentColor"
                                strokeWidth="5"
                                className="text-slate-100 dark:text-[#111]"
                            />
                            {/* Progress */}
                            <motion.circle
                                initial={{ strokeDashoffset: circumference }}
                                animate={{ strokeDashoffset: circumference - (scoreValue / 100) * circumference }}
                                transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                                cx="38"
                                cy="38"
                                r="34"
                                fill="transparent"
                                stroke={config.stroke}
                                strokeWidth="5"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                transform="rotate(-90 38 38)"
                                style={{ filter: `drop-shadow(0 0 4px ${config.glow})` }}
                            />
                        </svg>

                        {/* Score in center */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <motion.span
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
                                className="text-[22px] font-black text-[var(--foreground)] leading-none"
                            >
                                {Math.round(scoreValue)}
                            </motion.span>
                        </div>
                    </div>

                    {/* Text Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${config.badge}`}>
                                {label}
                            </span>
                            <div className="w-4 h-4 rounded-full bg-slate-100 dark:bg-[#111] flex items-center justify-center">
                                <Info className="w-2.5 h-2.5 text-slate-400" />
                            </div>
                        </div>
                        <h3 className="text-[17px] font-black text-[var(--foreground)] leading-tight mb-0.5">
                            {config.title}
                        </h3>
                        <p className="text-[13px] text-slate-400 dark:text-slate-500 leading-snug">
                            {config.subtitle}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
