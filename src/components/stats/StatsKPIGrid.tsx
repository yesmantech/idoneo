import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Info, FileText, Trophy, BarChart3, Target, X } from 'lucide-react';
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

            {/* Preparation Level Banner */}
            {readiness && (
                <div className="bg-[var(--card)] p-5 rounded-[24px] shadow-soft flex items-center justify-between relative overflow-hidden group border border-[var(--card-border)]">
                    <div className={`absolute left-0 top-0 w-1.5 h-full bg-${readiness.color === 'semantic-success' ? 'green-500' : readiness.color === 'semantic-error' ? 'red-500' : 'amber-500'}`}></div>

                    <div className="flex items-center gap-4 pl-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${readiness.level === 'high' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                            readiness.level === 'medium' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' :
                                'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                            }`}>
                            <Trophy className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <h3 className="font-bold text-[var(--foreground)] text-[15px]">Livello di preparazione</h3>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setExplanation(metrics.readiness); }}
                                    className="text-[var(--foreground)] opacity-20 hover:opacity-100 hover:text-brand-blue transition-colors"
                                >
                                    <Info className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-[13px] text-[var(--foreground)] opacity-50 font-medium">Basato sulle tue ultime performance</p>
                        </div>
                    </div>

                    <div className={`hidden sm:flex px-4 py-1.5 rounded-full text-[13px] font-bold tracking-wide ${readiness.level === 'high' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                        readiness.level === 'medium' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                            'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                        {readiness.label}
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
                            className="relative bg-[var(--card)] border border-[var(--card-border)] rounded-[32px] p-8 max-w-xs w-full shadow-2xl text-center"
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
        <div className="bg-[var(--card)] p-4 rounded-[24px] shadow-soft border border-[var(--card-border)] hover:shadow-card transition-all duration-300 group flex flex-col justify-between h-[150px] relative overflow-hidden">
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
