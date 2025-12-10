import React from 'react';

interface StatsKPIGridProps {
    totalTests: number;
    bestScore: number;
    avgScore: number;
    accuracy: number;
}

export default function StatsKPIGrid({ totalTests, bestScore, avgScore, accuracy }: StatsKPIGridProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {/* Total Tests */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-32">
                <div className="flex items-start justify-between">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tuoi Test</p>
                    <span className="text-xl">📝</span>
                </div>
                <div>
                    <p className="text-3xl font-black text-slate-800">{totalTests}</p>
                    <p className="text-xs text-slate-400 font-medium">simulazioni fatte</p>
                </div>
            </div>

            {/* Best Score */}
            <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
                <div className="absolute -right-2 -top-2 w-16 h-16 bg-amber-50 rounded-full blur-2xl"></div>
                <div className="flex items-start justify-between relative z-10">
                    <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">Miglior Voto</p>
                    <span className="text-xl">🏆</span>
                </div>
                <div className="relative z-10">
                    <p className="text-3xl font-black text-amber-600">{bestScore.toFixed(1)}</p>
                    <p className="text-xs text-amber-600/60 font-medium">punti su 100</p>
                </div>
            </div>

            {/* Avg Score */}
            <div className="bg-white p-4 rounded-2xl border border-indigo-200 shadow-sm flex flex-col justify-between h-32">
                <div className="flex items-start justify-between">
                    <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Media Voto</p>
                    <span className="text-xl">📊</span>
                </div>
                <div>
                    <p className="text-3xl font-black text-indigo-600">{avgScore.toFixed(1)}</p>
                    <p className="text-xs text-indigo-400 font-medium">punti su 100</p>
                </div>
            </div>

            {/* Accuracy */}
            <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm flex flex-col justify-between h-32">
                <div className="flex items-start justify-between">
                    <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Accuratezza</p>
                    <span className="text-xl">🎯</span>
                </div>
                <div>
                    <p className="text-3xl font-black text-emerald-600">{accuracy.toFixed(0)}%</p>
                    <p className="text-xs text-emerald-400 font-medium">risposte corrette</p>
                </div>
            </div>
        </div>
    );
}
