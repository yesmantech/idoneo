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

            {/* Avg Score */}
            <div className="bg-white p-5 rounded-card shadow-soft hover:shadow-card hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between h-36 relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-24 h-24 bg-brand-blue/5 rounded-bl-[40px] -mr-6 -mt-6 z-0 group-hover:scale-110 transition-transform"></div>
                <div className="flex items-start justify-between relative z-10">
                    <p className="text-[10px] font-bold text-brand-blue uppercase tracking-widest">Media Voto</p>
                    <div className="w-10 h-10 rounded-squircle bg-brand-blue/10 text-brand-blue flex items-center justify-center text-lg shadow-sm">📊</div>
                </div>
                <div className="relative z-10">
                    <p className="text-3xl font-black text-text-primary mb-1">{avgScore.toFixed(1)}</p>
                    <p className="text-xs text-brand-blue font-bold">punti su 100</p>
                </div>
            </div>

            {/* Accuracy */}
            <div className="bg-white p-5 rounded-card shadow-soft hover:shadow-card hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between h-36 relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-24 h-24 bg-semantic-success/5 rounded-bl-[40px] -mr-6 -mt-6 z-0 group-hover:scale-110 transition-transform"></div>
                <div className="flex items-start justify-between relative z-10">
                    <p className="text-[10px] font-bold text-semantic-success uppercase tracking-widest">Accuratezza</p>
                    <div className="w-10 h-10 rounded-squircle bg-semantic-success/10 text-semantic-success flex items-center justify-center text-lg shadow-sm">🎯</div>
                </div>
                <div className="relative z-10">
                    <p className="text-3xl font-black text-text-primary mb-1">{accuracy.toFixed(0)}%</p>
                    <p className="text-xs text-semantic-success font-bold">risposte corrette</p>
                </div>
            </div>
        </div>
    );
}
