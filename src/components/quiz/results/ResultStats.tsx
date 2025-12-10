import React from 'react';

interface ResultStatsProps {
    correct: number;
    wrong: number;
    skipped: number;
}

export default function ResultStats({ correct, wrong, skipped }: ResultStatsProps) {
    const total = correct + wrong + skipped || 1;

    const items = [
        { label: "Corrette", count: correct, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-100", percentage: Math.round((correct / total) * 100) },
        { label: "Errate", count: wrong, color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-100", percentage: Math.round((wrong / total) * 100) },
        { label: "Omesse", count: skipped, color: "text-slate-700", bg: "bg-slate-50", border: "border-slate-200", percentage: Math.round((skipped / total) * 100) },
    ];

    return (
        <div className="grid grid-cols-3 gap-3 sm:gap-4 px-4 sm:px-6 mt-6 mb-8 max-w-4xl mx-auto relative z-10 text-center">
            {items.map((item, i) => (
                <div key={i} className={`p-3 sm:p-6 rounded-2xl border shadow-sm flex flex-col items-center justify-center ${item.bg} ${item.border}`}>
                    <span className={`text-2xl sm:text-4xl font-black mb-1 ${item.color}`}>{item.count}</span>
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest opacity-60 mb-2">{item.label}</span>
                    <span className="text-xs font-medium px-2 py-1 bg-white/50 rounded-lg border border-black/5">{item.percentage}%</span>
                </div>
            ))}
        </div>
    );
}
