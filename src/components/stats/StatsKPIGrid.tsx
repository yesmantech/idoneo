import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Info, FileText, Trophy, BarChart3, Target, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface TrendData {
    delta: number;
    direction: 'up' | 'down' | 'stable';
    label: string;
}

interface ReadinessData {
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

interface StatsKPIGridProps {
    totalTests: number;
    bestScore: number;
    avgScore: number;
    accuracy: number;
    maxPossibleScore?: number;
    scoreTrend?: TrendData;
    accuracyTrend?: TrendData;
    readiness?: ReadinessData;
    onOpenInfo?: () => void;
}

interface MetricDesc {
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
}

export default function StatsKPIGrid({
    totalTests,
    bestScore,
    avgScore,
    accuracy,
    maxPossibleScore = 100,
    scoreTrend,
    accuracyTrend,
    readiness,
    onOpenInfo
}: StatsKPIGridProps) {
    const [explanation, setExplanation] = useState<MetricDesc | null>(null);
    const navigate = useNavigate();

    const metrics: Record<string, MetricDesc> = {
        tests: {
            title: "Simulazioni fatte",
            description: "Indica il numero totale di simulazioni d'esame che hai completato per questo concorso.",
            icon: <FileText className="w-6 h-6" />,
            color: "text-brand-purple bg-brand-purple/10"
        },
        best: {
            title: "Miglior Risultato",
            description: "Il punteggio più alto che hai ottenuto in una singola simulazione, rapportato al punteggio massimo possibile.",
            icon: <Trophy className="w-6 h-6" />,
            color: "text-brand-orange bg-brand-orange/10"
        },
        avg: {
            title: "Punti su 100",
            description: "La tua media dei voti normalizzata su una scala da 0 a 100, per darti un'idea chiara del tuo livello medio.",
            icon: <BarChart3 className="w-6 h-6" />,
            color: "text-brand-blue bg-brand-blue/10"
        },
        accuracy: {
            title: "Risposte corrette",
            description: "La percentuale media di risposte esatte che dai durante i test. Più è alta, più sei preciso.",
            icon: <Target className="w-6 h-6" />,
            color: "text-semantic-success bg-semantic-success/10"
        },
        readiness: {
            title: "Livello di preparazione",
            description: "Indica quanto sei pronto per il concorso basandosi su media voti, costanza di allenamento e volume di quiz svolti.",
            icon: <Trophy className="w-6 h-6" />,
            color: "text-brand-orange bg-brand-orange/10"
        }
    };

    const handleReadinessClick = () => {
        if (!readiness) {
            navigate('/preparazione?hasData=false&level=low&score=0');
        } else {
            const params = new URLSearchParams({
                hasData: 'true',
                level: readiness.level,
                score: String(readiness.score || 0),
                accuracy: String(readiness.breakdown?.accuracy || 0),
                volume: String(readiness.breakdown?.volume || 0),
                coverage: String(readiness.breakdown?.coverage || 0),
                reliability: String(readiness.breakdown?.reliability || 0),
            });
            navigate(`/preparazione?${params.toString()}`);
        }
    };

    return (
        <div className="space-y-6 mb-8">

            {/* Preparation Level — New Speedometer Design */}
            {readiness && (() => {
                const colorMap: Record<string, { stroke: string; bg: string; text: string; label: string }> = {
                    'high': { stroke: '#10B981', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', label: 'Pronto' },
                    'medium': { stroke: '#F59E0B', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', label: 'A buon punto' },
                    'low': { stroke: '#EF4444', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400', label: 'Da migliorare' },
                };
                const currentTheme = colorMap[readiness.level] || colorMap['low'];
                const scoreVal = readiness.score !== undefined ? readiness.score : 0;

                return (
                    <div
                        data-onboarding="stats-readiness"
                        onClick={handleReadinessClick}
                        className="group relative bg-[var(--card)] p-6 pt-8 pb-6 rounded-[32px] shadow-soft border border-[var(--card-border)] cursor-pointer hover:border-[#00B1FF]/30 transition-all overflow-hidden"
                    >
                        {/* Ambient glow */}
                        <div
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-[80px] pointer-events-none opacity-20"
                            style={{ background: currentTheme.stroke }}
                        />

                        <div className="relative z-10 flex flex-col items-center">
                            {/* Label */}
                            <div className="flex items-center gap-1.5 mb-6">
                                <span className="text-[11px] font-black text-[var(--foreground)] opacity-40 uppercase tracking-[0.2em]">
                                    Preparazione
                                </span>
                                <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-[#111] flex items-center justify-center">
                                    <Info className="w-3 h-3 text-slate-400" />
                                </div>
                            </div>

                            {/* Speedometer Gauge */}
                            <div className="relative w-[220px] h-[130px] mb-2">
                                <svg viewBox="0 0 220 130" className="w-full h-full overflow-visible">
                                    <defs>
                                        <linearGradient id="statsGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#EF4444" />
                                            <stop offset="35%" stopColor="#F59E0B" />
                                            <stop offset="65%" stopColor="#F59E0B" />
                                            <stop offset="100%" stopColor="#10B981" />
                                        </linearGradient>
                                    </defs>

                                    {/* Background track */}
                                    <path
                                        d="M 20 120 A 90 90 0 0 1 200 120"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="14"
                                        strokeLinecap="round"
                                        className="text-slate-100 dark:text-[#111]"
                                    />

                                    {/* Gradient arc */}
                                    <motion.path
                                        d="M 20 120 A 90 90 0 0 1 200 120"
                                        fill="none"
                                        stroke="url(#statsGaugeGradient)"
                                        strokeWidth="14"
                                        strokeLinecap="round"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: Math.max(scoreVal / 100, 0.02) }}
                                        transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                                        style={{ filter: `drop-shadow(0 0 6px ${currentTheme.stroke}40)` }}
                                    />

                                    {/* Needle indicator */}
                                    <motion.g
                                        initial={{ rotate: -180 }}
                                        animate={{ rotate: -180 + (scoreVal / 100) * 180 }}
                                        transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                                        style={{ transformOrigin: '110px 120px' }}
                                    >
                                        <circle cx="110" cy="30" r="6" fill={currentTheme.stroke} />
                                        <circle cx="110" cy="30" r="3" fill="var(--card)" />
                                    </motion.g>
                                </svg>

                                {/* Score in center */}
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
                                    <motion.span
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                                        className="text-[52px] font-black text-[var(--foreground)] leading-none tracking-tight"
                                    >
                                        {Math.round(scoreVal)}%
                                    </motion.span>
                                </div>
                            </div>

                            {/* Level badge + subtitle */}
                            <div className="flex flex-col items-center gap-2 mt-2">
                                <div className={`inline-flex px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${currentTheme.bg} ${currentTheme.text}`}>
                                    {currentTheme.label}
                                </div>
                                <p className="text-[13px] text-slate-500 dark:text-slate-400 text-center max-w-[240px] leading-snug">
                                    {readiness.level === 'high' ? 'Sei pronto per la prova ufficiale.' :
                                        readiness.level === 'medium' ? 'Manca poco per l\'eccellenza.' :
                                            'Serve più allenamento. Non mollare!'}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* 2x2 Grid */}
            <div data-onboarding="stats-kpi" className="grid grid-cols-2 gap-4">

                {/* 1. Total Tests */}
                <StatsCard
                    icon={<FileText className="w-5 h-5 text-brand-purple" />}
                    iconBg="bg-brand-purple/10"
                    badgeColor="bg-brand-purple/10 text-brand-purple"
                    label="Test fatti"
                    value={totalTests.toString()}
                    subLabel="Simulazioni fatte"
                    onInfo={() => setExplanation(metrics.tests)}
                />

                {/* 2. Best Score */}
                <StatsCard
                    icon={<Trophy className="w-5 h-5 text-brand-orange" />}
                    iconBg="bg-brand-orange/10"
                    badgeColor="bg-brand-orange/10 text-brand-orange"
                    label="Miglior voto"
                    value={`${bestScore.toFixed(0)}/${maxPossibleScore}`}
                    subLabel="Miglior Risultato"
                    onInfo={() => setExplanation(metrics.best)}
                />

                {/* 3. Avg Score */}
                <StatsCard
                    icon={<BarChart3 className="w-5 h-5 text-brand-blue" />}
                    iconBg="bg-brand-blue/10"
                    badgeColor="bg-brand-blue/10 text-brand-blue"
                    label="Media voto"
                    value={avgScore.toFixed(1)}
                    subLabel="Punti su 100"
                    onInfo={() => setExplanation(metrics.avg)}
                />

                {/* 4. Accuracy */}
                <StatsCard
                    icon={<Target className="w-5 h-5 text-semantic-success" />}
                    iconBg="bg-semantic-success/10"
                    badgeColor="bg-semantic-success/10 text-semantic-success"
                    label="Accuratezza"
                    value={`${accuracy.toFixed(0)}%`}
                    subLabel="Risposte corrette"
                    onInfo={() => setExplanation(metrics.accuracy)}
                />

            </div>

            {/* Explanation Modal */}
            <AnimatePresence>
                {explanation && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setExplanation(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative bg-[var(--card)] border border-[var(--card-border)] rounded-[32px] p-8 max-w-xs w-full shadow-2xl text-center overflow-y-auto max-h-[90vh] custom-scrollbar"
                        >
                            <button
                                onClick={() => setExplanation(null)}
                                className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-[#111] rounded-full text-[var(--foreground)] opacity-40 hover:opacity-100 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className={`w-16 h-16 rounded-[22px] ${explanation.color} flex items-center justify-center mx-auto mb-5`}>
                                {explanation.icon}
                            </div>

                            <h3 className="text-xl font-black text-[var(--foreground)] mb-2">{explanation.title}</h3>
                            <p className="text-[var(--foreground)] opacity-50 text-sm font-medium leading-relaxed">
                                {explanation.description}
                            </p>

                            <button
                                onClick={() => setExplanation(null)}
                                className="w-full mt-8 py-3 bg-[var(--foreground)] text-[var(--background)] rounded-2xl font-bold hover:opacity-90 transition-opacity"
                            >
                                Ho capito
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function StatsCard({
    icon,
    iconBg,
    badgeColor,
    label,
    value,
    subLabel,
    onInfo
}: {
    icon: React.ReactNode,
    iconBg: string,
    badgeColor: string,
    label: string,
    value: string,
    subLabel: string,
    onInfoText?: string,
    onInfotext?: string,
    onInfo: () => void
}) {
    return (
        <div
            onClick={onInfo}
            className="bg-[var(--card)] p-4 rounded-[24px] shadow-soft border border-[var(--card-border)] hover:shadow-card transition-all duration-300 group flex flex-col justify-between h-[150px] relative overflow-hidden cursor-pointer active:scale-95"
        >
            {/* Top Row */}
            <div className="flex justify-between items-start z-10 relative">
                <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center ${iconBg} transition-transform group-hover:scale-110 duration-300`}>
                    {icon}
                </div>
            </div>

            {/* Middle Content */}
            <div className="z-10 relative">
                <div className="text-[32px] font-black text-[var(--foreground)] leading-none tracking-tight mb-1">
                    {value}
                </div>

                <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-[var(--foreground)] opacity-40 uppercase tracking-wide">
                        {subLabel}
                    </p>

                    <button
                        onClick={(e) => { e.stopPropagation(); onInfo(); }}
                        className="p-1.5 rounded-full bg-slate-50 dark:bg-[#111] text-[var(--foreground)] opacity-20 hover:opacity-100 hover:text-brand-blue hover:bg-brand-blue/5 transition-all"
                    >
                        <Info className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
