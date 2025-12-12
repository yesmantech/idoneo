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
            className="w-full bg-white rounded-card shadow-soft hover:shadow-card hover:scale-[1.02] p-5 flex items-center gap-4 transition-all duration-300 text-left group border border-transparent"
        >
            {/* Icon / Avatar placeholder for Quiz */}
            <div className={`w-12 h-12 rounded-squircle flex items-center justify-center text-xl font-bold bg-brand-blue/10 text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-colors`}>
                {title.substring(0, 2).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between mb-0.5">
                    <h3 className="font-bold text-text-primary truncate group-hover:text-brand-blue transition-colors">{title}</h3>
                </div>
                {category && <p className="text-xs text-text-tertiary font-bold uppercase tracking-wider mb-2">{category}</p>}

                {/* Progress Bar */}
                <div className="w-full h-2 bg-canvas-light rounded-pill overflow-hidden">
                    <div
                        className="h-full bg-brand-cyan rounded-pill transition-all duration-1000"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Chevron */}
            <div className="text-text-tertiary group-hover:text-brand-cyan transition-colors bg-canvas-light p-2 rounded-full">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
            </div>
        </button>
    );
}
