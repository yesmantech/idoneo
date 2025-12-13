import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

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
    scoreTrend?: TrendData;
    accuracyTrend?: TrendData;
    readiness?: ReadinessData;
}

// Trend Indicator Component
function TrendIndicator({ trend }: { trend: TrendData }) {
    const Icon = trend.direction === 'up' ? TrendingUp : trend.direction === 'down' ? TrendingDown : Minus;
    const colorClass = trend.direction === 'up'
        ? 'text-semantic-success bg-semantic-success/10'
        : trend.direction === 'down'
            ? 'text-semantic-error bg-semantic-error/10'
            : 'text-text-tertiary bg-canvas-light';

    return (
        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[10px] font-bold ${colorClass}`}>
            <Icon className="w-3 h-3" />
            <span>{trend.label}</span>
        </div>
    );
}

export default function StatsKPIGrid({
    totalTests,
    bestScore,
    avgScore,
    accuracy,
    scoreTrend,
    accuracyTrend,
    readiness
}: StatsKPIGridProps) {
    return (
        <div className="space-y-4 mb-8">
            {/* Main KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Total Tests */}
                <div className="bg-white p-5 rounded-card shadow-soft hover:shadow-card hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between h-36 relative overflow-hidden group">
                    <div className="flex items-start justify-between relative z-10">
                        <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Tuoi Test</p>
                        <div className="w-10 h-10 rounded-squircle bg-canvas-light flex items-center justify-center text-lg shadow-sm">📝</div>
                    </div>
                    <div className="relative z-10">
                        <p className="text-3xl font-black text-text-primary mb-1">{totalTests}</p>
                        <p className="text-xs text-text-secondary font-medium">simulazioni fatte</p>
                    </div>
                </div>

                {/* Best Score */}
                <div className="bg-white p-5 rounded-card shadow-soft hover:shadow-card hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between h-36 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-brand-orange/5 rounded-bl-[40px] -mr-6 -mt-6 z-0 group-hover:scale-110 transition-transform"></div>
                    <div className="flex items-start justify-between relative z-10">
                        <p className="text-[10px] font-bold text-brand-orange uppercase tracking-widest">Miglior Voto</p>
                        <div className="w-10 h-10 rounded-squircle bg-brand-orange/10 text-brand-orange flex items-center justify-center text-lg shadow-sm">🏆</div>
                    </div>
                    <div className="relative z-10">
                        <p className="text-3xl font-black text-text-primary mb-1">{bestScore.toFixed(1)}</p>
                        <p className="text-xs text-brand-orange font-bold">punti su 100</p>
                    </div>
                </div>

                {/* Avg Score with Trend */}
                <div className="bg-white p-5 rounded-card shadow-soft hover:shadow-card hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between h-36 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-brand-blue/5 rounded-bl-[40px] -mr-6 -mt-6 z-0 group-hover:scale-110 transition-transform"></div>
                    <div className="flex items-start justify-between relative z-10">
                        <p className="text-[10px] font-bold text-brand-blue uppercase tracking-widest">Media Voto</p>
                        <div className="w-10 h-10 rounded-squircle bg-brand-blue/10 text-brand-blue flex items-center justify-center text-lg shadow-sm">📊</div>
                    </div>
                    <div className="relative z-10">
                        <p className="text-3xl font-black text-text-primary mb-1">{avgScore.toFixed(1)}</p>
                        {scoreTrend && totalTests >= 3 ? (
                            <TrendIndicator trend={scoreTrend} />
                        ) : (
                            <p className="text-xs text-brand-blue font-bold">punti su 100</p>
                        )}
                    </div>
                </div>

                {/* Accuracy with Trend */}
                <div className="bg-white p-5 rounded-card shadow-soft hover:shadow-card hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between h-36 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-semantic-success/5 rounded-bl-[40px] -mr-6 -mt-6 z-0 group-hover:scale-110 transition-transform"></div>
                    <div className="flex items-start justify-between relative z-10">
                        <p className="text-[10px] font-bold text-semantic-success uppercase tracking-widest">Accuratezza</p>
                        <div className="w-10 h-10 rounded-squircle bg-semantic-success/10 text-semantic-success flex items-center justify-center text-lg shadow-sm">🎯</div>
                    </div>
                    <div className="relative z-10">
                        <p className="text-3xl font-black text-text-primary mb-1">{accuracy.toFixed(0)}%</p>
                        {accuracyTrend && totalTests >= 3 ? (
                            <TrendIndicator trend={accuracyTrend} />
                        ) : (
                            <p className="text-xs text-semantic-success font-bold">risposte corrette</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Readiness Level Banner */}
            {readiness && totalTests >= 5 && (
                <div className={`bg-white p-4 rounded-card shadow-soft flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full bg-${readiness.color}`}></div>
                        <div>
                            <p className="text-sm font-bold text-text-primary">Livello di preparazione</p>
                            <p className="text-xs text-text-tertiary">Basato sulle tue ultime performance</p>
                        </div>
                    </div>
                    <div className={`px-4 py-2 rounded-pill text-sm font-bold ${readiness.level === 'high' ? 'bg-semantic-success/10 text-semantic-success' :
                            readiness.level === 'medium' ? 'bg-brand-orange/10 text-brand-orange' :
                                'bg-semantic-error/10 text-semantic-error'
                        }`}>
                        {readiness.label}
                    </div>
                </div>
            )}
        </div>
    );
}
