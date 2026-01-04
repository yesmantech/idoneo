import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Info, FileText, Trophy, BarChart3, Target, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    const [readinessModalOpen, setReadinessModalOpen] = useState(false);

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

    return (
        <div className="space-y-6 mb-8">

            {/* 2x2 Grid */}
            <div className="grid grid-cols-2 gap-4">

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

            {/* Preparation Level Banner - Tier S Redesign */}
            {readiness && (
                <div
                    onClick={() => setReadinessModalOpen(true)}
                    className="group relative bg-[var(--card)] p-6 rounded-[32px] shadow-soft flex items-center justify-between overflow-hidden border border-[var(--card-border)] cursor-pointer hover:border-[#00B1FF]/30 transition-all"
                >
                    {/* Background Decorator */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-[#00B1FF] to-emerald-500 opacity-[0.05] rounded-bl-[100px] pointer-events-none" />

                    {/* Text Content */}
                    <div className="flex-1 pr-4 z-10">
                        <div className="flex items-center gap-2 mb-1">
                            <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${readiness.level === 'high' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                                readiness.level === 'medium' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' :
                                    'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                }`}>
                                {readiness.label}
                            </div>
                            <div className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                <Info className="w-2.5 h-2.5" />
                            </div>
                        </div>
                        <h3 className="text-xl font-black text-[var(--foreground)] mb-1 leading-tight">
                            {readiness.level === 'high' ? 'Sei pronto!' :
                                readiness.level === 'medium' ? 'A buon punto' :
                                    'Sei all\'inizio'}
                        </h3>
                        <p className="text-[14px] text-slate-500 dark:text-slate-400 leading-snug">
                            {readiness.level === 'high' ? 'Ottima costanza. Sei pronto per la prova ufficiale.' :
                                readiness.level === 'medium' ? 'Continua così, manca poco per l\'eccellenza.' :
                                    'Serve più allenamento. Non mollare!'}
                        </p>
                    </div>

                    {/* Radial Gauge */}
                    <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center z-10">
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
                                animate={{ strokeDashoffset: 200 - ((readiness.score !== undefined ? readiness.score : (readiness.level === 'high' ? 92 : readiness.level === 'medium' ? 65 : 35)) / 100) * 200 }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                cx="40"
                                cy="40"
                                r="32"
                                stroke={readiness.level === 'high' ? '#10B981' : readiness.level === 'medium' ? '#F59E0B' : '#EF4444'}
                                strokeWidth="6"
                                strokeLinecap="round"
                                fill="transparent"
                            />
                        </svg>
                        {/* Icon in Center */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            {readiness.score !== undefined ? (
                                <span className={`text-lg font-black ${readiness.level === 'high' ? 'text-emerald-600' : readiness.level === 'medium' ? 'text-amber-600' : 'text-red-600'}`}>
                                    {Math.round(readiness.score)}
                                </span>
                            ) : (
                                <>
                                    {readiness.level === 'high' ? (
                                        <Trophy className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                    ) : readiness.level === 'medium' ? (
                                        <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                                    ) : (
                                        <Target className="w-6 h-6 text-red-600 dark:text-red-400" />
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

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
                                className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-[var(--foreground)] opacity-40 hover:opacity-100 transition-colors"
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

            {/* Readiness Info Modal - Tier S */}
            <AnimatePresence>
                {readinessModalOpen && readiness && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 px-8">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setReadinessModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative bg-white dark:bg-[var(--card)] border border-transparent dark:border-[var(--card-border)] rounded-[32px] p-6 max-w-sm w-full shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
                        >
                            {/* Decorator */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#00B1FF] to-emerald-500 opacity-[0.1] rounded-bl-[100px] pointer-events-none" />

                            <button
                                onClick={() => setReadinessModalOpen(false)}
                                className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 opacity-70 hover:opacity-100 transition-colors z-50"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="relative z-10">
                                <h3 className="text-xl font-black text-slate-900 dark:text-[var(--foreground)] mb-2">
                                    Livello di Preparazione
                                </h3>
                                <p className="text-[14px] text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                                    Il nostro algoritmo analizza le tue ultime simulazioni per calcolare quanto sei pronto per l'esame ufficiale.
                                </p>

                                <div className="space-y-4">
                                    {/* Pronto */}
                                    <div className={`p-3 rounded-2xl flex items-center gap-3 border ${readiness.level === 'high' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'}`}>
                                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
                                            <Trophy className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-[14px] font-bold text-slate-900 dark:text-slate-200">Pronto</h4>
                                            <p className="text-[12px] text-slate-500 dark:text-slate-400">Media superiore a 90/100.</p>
                                        </div>
                                        {readiness.level === 'high' && <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto" />}
                                    </div>

                                    {/* A buon punto */}
                                    <div className={`p-3 rounded-2xl flex items-center gap-3 border ${readiness.level === 'medium' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'}`}>
                                        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                                            <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-[14px] font-bold text-slate-900 dark:text-slate-200">A buon punto</h4>
                                            <p className="text-[12px] text-slate-500 dark:text-slate-400">Media tra 70/100 e 90/100.</p>
                                        </div>
                                        {readiness.level === 'medium' && <CheckCircle2 className="w-5 h-5 text-amber-500 ml-auto" />}
                                    </div>

                                    {/* Da migliorare */}
                                    <div className={`p-3 rounded-2xl flex items-center gap-3 border ${readiness.level === 'low' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'}`}>
                                        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0">
                                            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-[14px] font-bold text-slate-900 dark:text-slate-200">Da migliorare</h4>
                                            <p className="text-[12px] text-slate-500 dark:text-slate-400">Media inferiore a 70/100.</p>
                                        </div>
                                        {readiness.level === 'low' && <CheckCircle2 className="w-5 h-5 text-red-500 ml-auto" />}
                                    </div>
                                </div>

                                {/* Detailed Breakdown */}
                                {readiness.breakdown && (
                                    <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Analisi Dettagliata</h4>
                                        {[
                                            { label: 'Accuratezza', value: readiness.breakdown.accuracy, color: 'bg-emerald-500' },
                                            { label: 'Volume (Risposte Corrette)', value: readiness.breakdown.volume, color: 'bg-blue-500' },
                                            { label: 'Copertura Banca Dati', value: readiness.breakdown.coverage, color: 'bg-purple-500' },
                                            { label: 'Costanza (Reliability)', value: readiness.breakdown.reliability, color: 'bg-amber-500' },
                                        ].map((factor) => (
                                            <div key={factor.label} className="space-y-1.5">
                                                <div className="flex justify-between text-xs font-bold">
                                                    <span className="text-slate-600 dark:text-slate-300">{factor.label}</span>
                                                    <span className="text-slate-900 dark:text-slate-100">{Math.round(factor.value)}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${factor.value}%` }}
                                                        className={`h-full ${factor.color}`}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <p className="text-[12px] text-slate-400 text-center">
                                        Il calcolo si attiva dopo almeno <span className="font-bold text-slate-600 dark:text-slate-300">3 simulazioni</span> completate.
                                    </p>
                                </div>

                                {/* Link to Scoring Explanation */}
                                <a
                                    href="/come-funziona/punteggi"
                                    className="mt-4 flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#00B1FF]/10 to-emerald-500/10 hover:from-[#00B1FF]/20 hover:to-emerald-500/20 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[#00B1FF]/20 flex items-center justify-center">
                                            <BarChart3 className="w-4 h-4 text-[#00B1FF]" />
                                        </div>
                                        <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">
                                            Scopri come calcoliamo i punteggi
                                        </span>
                                    </div>
                                    <svg className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </a>

                                <button
                                    onClick={() => setReadinessModalOpen(false)}
                                    className="w-full mt-4 py-3 bg-slate-900 dark:bg-[var(--foreground)] text-white dark:text-[var(--background)] rounded-xl font-bold hover:opacity-90 transition-opacity"
                                >
                                    Chiaro!
                                </button>
                            </div>
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
                        className="p-1.5 rounded-full bg-slate-50 dark:bg-slate-800 text-[var(--foreground)] opacity-20 hover:opacity-100 hover:text-brand-blue hover:bg-brand-blue/5 transition-all"
                    >
                        <Info className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
