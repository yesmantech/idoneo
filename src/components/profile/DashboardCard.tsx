import React from 'react';

export interface DashboardCardProps {
    key?: React.Key;
    quizId: string;
    title: string;
    category?: string;
    progress: number; // 0-100
    lastPlayed?: Date;
    onClick: () => void;
}

export default function DashboardCard({ title, category, progress, onClick }: DashboardCardProps) {
    return (
        <button
            onClick={onClick}
            className="w-full bg-white rounded-2xl border-2 border-slate-200 border-b-4 active:border-b-2 active:translate-y-[2px] p-4 flex items-center gap-4 transition-all hover:border-slate-300 text-left group"
        >
            {/* Icon / Avatar placeholder for Quiz */}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold bg-slate-100 text-slate-500`}>
                {title.substring(0, 2).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between mb-1">
                    <h3 className="font-bold text-slate-800 truncate">{title}</h3>
                </div>
                {category && <p className="text-xs text-slate-400 font-medium mb-2">{category}</p>}

                {/* Progress Bar */}
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Chevron */}
            <div className="text-slate-300 group-hover:text-emerald-500 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
            </div>
        </button>
    );
}
