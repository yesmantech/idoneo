import React from 'react';
import { ChevronRight } from 'lucide-react';

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
            className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center gap-4 active:scale-[0.98] transition-transform text-left"
        >
            {/* Circular Avatar */}
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold bg-[#E0F2FE] text-[#00B1FF] flex-shrink-0">
                {title.substring(0, 2).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between mb-1">
                    <h3 className="font-bold text-slate-900 truncate pr-2 text-sm">{title}</h3>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#00B1FF] rounded-full"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Chevron */}
            <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
        </button>
    );
}
