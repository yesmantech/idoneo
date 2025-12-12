import React from 'react';

interface ResultStatsProps {
    correct: number;
    wrong: number;
    skipped: number;
}

export default function ResultStats({ correct, wrong, skipped }: ResultStatsProps) {
    const total = correct + wrong + skipped || 1;

    const items = [
        { label: "Corrette", count: correct, color: "text-semantic-success", bg: "bg-white", border: "", percentage: Math.round((correct / total) * 100) },
        { label: "Errate", count: wrong, color: "text-semantic-error", bg: "bg-white", border: "", percentage: Math.round((wrong / total) * 100) },
        { label: "Omesse", count: skipped, color: "text-text-tertiary", bg: "bg-white", border: "", percentage: Math.round((skipped / total) * 100) },
    ];

    return (
        <div className="grid grid-cols-3 gap-3 sm:gap-4 px-4 sm:px-6 mt-6 mb-8 max-w-4xl mx-auto relative z-10 text-center">
            {items.map((item, i) => (
                <div key={i} className={`p-4 sm:p-6 rounded-card shadow-soft flex flex-col items-center justify-center ${item.bg}`}>
                    <span className={`text-3xl sm:text-4xl font-bold mb-1 ${item.color}`}>{item.count}</span>
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-text-tertiary mb-3">{item.label}</span>
                    <span className="text-xs font-bold px-3 py-1 bg-canvas-light text-text-secondary rounded-pill">{item.percentage}%</span>
                </div>
            ))}
        </div>
    );
}
