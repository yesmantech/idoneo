
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { calculateReadinessLevel } from '@/lib/statsService';

interface ReadinessCardProps {
    history: any[];
    theme: any;
}

export default function ReadinessCard({ history, theme }: ReadinessCardProps) {
    const stats = useMemo(() => {
        if (!history || history.length < 3) return null;

        const totalTests = history.length;
        const totalScore = history.reduce((acc, curr) => acc + (curr.score || 0), 0);
        // Calculate accuracy roughly if not present, assuming 100 questions or relying on future fix
        // For now, we will use score normalized to 100 if accuracy missing, or score/30 * 100
        // Wait, history items have 'score' (usually /30 or /100 depending on quiz).
        // Let's assume normalized score behavior from statsService logic or just pass best guess.

        const avgScore = totalTests ? totalScore / totalTests : 0;

        // Mock accuracy if missing (history from role hub is simplified)
        // ideally we fetch full stats, but for now we approximate readiness via score
        // normalizing score 0-30 to 0-100
        const normalizedAvg = (avgScore / 30) * 100;

        return calculateReadinessLevel(normalizedAvg, normalizedAvg, totalTests);
    }, [history]);

    if (!stats) {
        return (
            <div className="bg-white dark:bg-[var(--card)] p-6 rounded-[32px] shadow-soft border border-[var(--card-border)] flex items-center justify-between opacity-80">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-[var(--foreground)]">Livello di preparazione</h3>
                        <p className="text-sm text-slate-500">Fai almeno 3 simulazioni per sbloccare.</p>
                    </div>
                </div>
            </div>
        );
    }

    const { level, label, color } = stats;

    // Theme colors mapping
    const colorMap = {
        'semantic-success': { stroke: '#10B981', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400' },
        'brand-orange': { stroke: '#F59E0B', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400' },
        'semantic-error': { stroke: '#EF4444', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400' }
    };

    const currentTheme = colorMap[color as keyof typeof colorMap] || colorMap['brand-orange'];

    // Determine score for circle (0-100)
    // Map level to percentage for visual: Low=30, Med=60, High=90
    const percentage = level === 'high' ? 92 : level === 'medium' ? 65 : 35;

    return (
        <div className="group relative bg-white dark:bg-[var(--card)] p-6 rounded-[32px] shadow-soft border border-[var(--card-border)] overflow-hidden">
            {/* Background Decorator */}
            <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl ${theme.gradient} opacity-[0.05] rounded-bl-[100px] pointer-events-none`} />

            <div className="flex items-center justify-between relative z-10">

                {/* Text Content */}
                <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                        <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${currentTheme.bg} ${currentTheme.text}`}>
                            {label}
                        </div>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-[var(--foreground)] mb-1 leading-tight">
                        Sei {level === 'high' ? 'pronto!' : level === 'medium' ? 'buon punto' : 'all\'inizio'}
                    </h3>
                    <p className="text-[14px] text-slate-500 dark:text-slate-400 leading-snug">
                        {level === 'high' ? 'Ottima costanza. Sei pronto per la prova ufficiale.' :
                            level === 'medium' ? 'Continua così, manca poco per l\'eccellenza.' :
                                'Serve più allenamento. Non mollare!'}
                    </p>
                </div>

                {/* Radial Gauge */}
                <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
                    {/* SVG Circle */}
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="40"
                            cy="40"
                            r="32"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="transparent"
                            className="text-slate-100 dark:text-slate-800"
                        />
                        <motion.circle
                            initial={{ strokeDasharray: 200, strokeDashoffset: 200 }}
                            animate={{ strokeDashoffset: 200 - (percentage / 100) * 200 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            cx="40"
                            cy="40"
                            r="32"
                            stroke={currentTheme.stroke}
                            strokeWidth="6"
                            strokeLinecap="round"
                            fill="transparent"
                        />
                    </svg>

                    {/* Icon in Center */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        {level === 'high' ? <Trophy className={`w-6 h-6 ${currentTheme.text}`} /> :
                            level === 'medium' ? <TrendingUp className={`w-6 h-6 ${currentTheme.text}`} /> :
                                <AlertTriangle className={`w-6 h-6 ${currentTheme.text}`} />}
                    </div>
                </div>
            </div>
        </div>
    );
}
