import React from 'react';

interface SubjectProgressBarProps {
    key?: React.Key;
    subjectName: string;
    totalQuestions: number;
    completedQuestions: number; // Unique questions answered correctly
    onClick?: () => void;
}

export default function SubjectProgressBar({ subjectName, totalQuestions, completedQuestions, onClick }: SubjectProgressBarProps) {
    const percentage = Math.round((completedQuestions / totalQuestions) * 100) || 0;

    // Color logic based on percentage
    const barColor = percentage >= 80 ? 'bg-emerald-500' :
        percentage >= 50 ? 'bg-blue-500' :
            percentage >= 20 ? 'bg-amber-500' :
                'bg-slate-300';

    return (
        <div
            onClick={onClick}
            className={`bg-white rounded-xl border border-slate-200 p-4 transition-all ${onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-sm' : ''}`}
        >
            <div className="flex justify-between items-end mb-3">
                <h4 className="font-bold text-slate-800 line-clamp-2" title={subjectName}>
                    {subjectName}
                </h4>
                <div className="text-right">
                    <div className="text-sm font-bold text-slate-900">{percentage}%</div>
                    <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Completato</div>
                </div>
            </div>

            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full ${barColor} transition-all duration-1000 ease-out`}
                    style={{ width: `${percentage}%` }}
                />
            </div>

            <div className="mt-2 text-xs text-slate-400 flex justify-between">
                <span>{completedQuestions} apprese</span>
                <span>/ {totalQuestions} totali</span>
            </div>
        </div>
    );
}
