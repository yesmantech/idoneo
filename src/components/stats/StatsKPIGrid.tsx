import React from 'react';
import { TrendingUp, TrendingDown, Minus, Info, FileText, Trophy, BarChart3, Target } from 'lucide-react';

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
    return (
        <div className="space-y-6 mb-8">

            {/* 2x2 Grid */}
            <div className="grid grid-cols-2 gap-4">

                {/* 1. Total Tests */}
                <StatsCard
                    icon={<FileText className="w-5 h-5 text-brand-purple" />}
                    iconBg="bg-brand-purple/10"
                    badgeColor="bg-brand-purple/10 text-brand-purple"
                    label="Tuoi test"
                    value={totalTests.toString()}
                    subLabel="simulazioni fatte"
                />

                {/* 2. Best Score */}
                <StatsCard
                    icon={<Trophy className="w-5 h-5 text-brand-orange" />}
                    iconBg="bg-brand-orange/10"
                    badgeColor="bg-brand-orange/10 text-brand-orange"
                    label="Miglior voto"
                    value={`${bestScore.toFixed(0)}/${maxPossibleScore}`} // Show as X/Total
                    subLabel="Miglior Risultato"
                    isBest
                />

                {/* 3. Avg Score */}
                <StatsCard
                    icon={<BarChart3 className="w-5 h-5 text-brand-blue" />}
                    iconBg="bg-brand-blue/10"
                    badgeColor="bg-brand-blue/10 text-brand-blue"
                    label="Media voto"
                    value={avgScore.toFixed(1)}
                    subLabel="punti su 100"
                    trend={scoreTrend}
                />

                {/* 4. Accuracy */}
                <StatsCard
                    icon={<Target className="w-5 h-5 text-semantic-success" />}
                    iconBg="bg-semantic-success/10"
                    badgeColor="bg-semantic-success/10 text-semantic-success"
                    label="Accuratezza"
                    value={`${accuracy.toFixed(0)}%`}
                    subLabel="risposte corrette"
                    trend={accuracyTrend}
                />

            </div>

            {/* Preparation Level Banner */}
            {readiness && (
                <div className="bg-white p-5 rounded-[24px] shadow-soft flex items-center justify-between relative overflow-hidden group">
                    {/* Decorative Background Blob */}
                    <div className={`absolute left-0 top-0 w-1.5 h-full bg-${readiness.color === 'semantic-success' ? 'green-500' : readiness.color === 'semantic-error' ? 'red-500' : 'amber-500'}`}></div>

                    <div className="flex items-center gap-4 pl-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${readiness.level === 'high' ? 'bg-green-100 text-green-600' :
                            readiness.level === 'medium' ? 'bg-amber-100 text-amber-600' :
                                'bg-red-100 text-red-600'
                            }`}>
                            <Trophy className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <h3 className="font-bold text-slate-900 text-[15px]">Livello di preparazione</h3>
                                {onOpenInfo && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onOpenInfo(); }}
                                        className="text-slate-300 hover:text-brand-blue transition-colors"
                                    >
                                        <Info className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <p className="text-[13px] text-slate-500 font-medium">Basato sulle tue ultime performance</p>
                        </div>
                    </div>

                    <div className={`hidden sm:flex px-4 py-1.5 rounded-full text-[13px] font-bold tracking-wide ${readiness.level === 'high' ? 'bg-green-100 text-green-700' :
                        readiness.level === 'medium' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                        }`}>
                        {readiness.label}
                    </div>
                </div>
            )}
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
    isBest,
    trend
}: {
    icon: React.ReactNode,
    iconBg: string,
    badgeColor: string,
    label: string,
    value: string,
    subLabel: string,
    isBest?: boolean,
    trend?: TrendData
}) {
    return (
        <div className="bg-white p-4 rounded-[24px] shadow-soft border border-slate-50 hover:shadow-card transition-all duration-300 group flex flex-col justify-between h-[150px] relative overflow-hidden">
            {/* Top Row */}
            <div className="flex justify-between items-start z-10 relative">
                <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center ${iconBg} transition-transform group-hover:scale-110 duration-300`}>
                    {icon}
                </div>
            </div>

            {/* Middle Content */}
            <div className="z-10 relative">
                <div className="text-[32px] font-black text-slate-900 leading-none tracking-tight mb-1">
                    {value}
                </div>

                <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                        {subLabel}
                    </p>

                    {/* Trend Pill */}
                    {trend && (
                        <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${trend.direction === 'up' ? 'bg-green-100 text-green-700' :
                            trend.direction === 'down' ? 'bg-red-100 text-red-700' :
                                'bg-slate-100 text-slate-500'
                            }`}>
                            {trend.direction === 'up' ? <TrendingUp className="w-3 h-3" /> :
                                trend.direction === 'down' ? <TrendingDown className="w-3 h-3" /> :
                                    <Minus className="w-3 h-3" />}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
