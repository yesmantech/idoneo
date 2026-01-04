import React, { useState } from 'react';
import { Flag, Calendar, Target, TrendingUp, X } from 'lucide-react';

interface Goal {
    id: string;
    goal_type: 'score' | 'accuracy' | 'attempts';
    target_value: number;
    current_value: number;
    deadline: string | null;
    status: 'active' | 'achieved' | 'failed' | 'expired';
}

interface GoalsBlockProps {
    goal: Goal | null;
    onCreateGoal?: () => void;
    onDeleteGoal?: (goalId: string) => void;
}

const goalTypeLabels = {
    score: { label: 'Punteggio', unit: 'punti', icon: Target },
    accuracy: { label: 'Accuratezza', unit: '%', icon: TrendingUp },
    attempts: { label: 'Simulazioni', unit: '', icon: Flag }
};

export default function GoalsBlock({ goal, onCreateGoal, onDeleteGoal }: GoalsBlockProps) {
    if (!goal) {
        return (
            <div className="bg-[var(--card)] rounded-card shadow-soft p-6 border border-[var(--card-border)]">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-[var(--foreground)]">Il tuo obiettivo</h3>
                    <div className="w-10 h-10 rounded-squircle bg-brand-cyan/10 flex items-center justify-center">
                        <Flag className="w-5 h-5 text-brand-cyan" />
                    </div>
                </div>

                <div className="text-center py-8 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <div className="w-14 h-14 rounded-full bg-[var(--card)] shadow-sm flex items-center justify-center mx-auto mb-3">
                        <Target className="w-6 h-6 text-[var(--foreground)] opacity-30" />
                    </div>
                    <p className="text-sm font-medium text-[var(--foreground)] opacity-50 mb-4">
                        Imposta un obiettivo per rimanere motivato
                    </p>
                    <button
                        onClick={onCreateGoal}
                        className="px-6 py-2.5 bg-brand-cyan text-white font-bold text-sm rounded-pill hover:bg-brand-cyan/90 active:scale-95 transition-all shadow-sm"
                    >
                        Imposta obiettivo
                    </button>
                </div>
            </div>
        );
    }

    const config = goalTypeLabels[goal.goal_type];
    const Icon = config.icon;
    const progress = Math.min((goal.current_value / goal.target_value) * 100, 100);
    const daysRemaining = goal.deadline
        ? Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null;

    const statusConfig = {
        active: { label: 'In corso', color: 'text-brand-cyan bg-brand-cyan/10' },
        achieved: { label: 'Raggiunto! 🎉', color: 'text-emerald-500 bg-emerald-500/10' },
        failed: { label: 'Non raggiunto', color: 'text-rose-500 bg-rose-500/10' },
        expired: { label: 'Scaduto', color: 'text-[var(--foreground)] opacity-40 bg-slate-100 dark:bg-slate-800' }
    };

    const progressStatus = progress >= 100
        ? 'achieved'
        : daysRemaining !== null && daysRemaining <= 3 && progress < 80
            ? 'at-risk'
            : progress >= 60
                ? 'on-track'
                : 'behind';

    const progressStatusLabel = {
        'achieved': 'Obiettivo raggiunto!',
        'on-track': 'Sei sulla buona strada',
        'behind': 'Devi accelerare',
        'at-risk': 'Obiettivo a rischio'
    };

    return (
        <div className="bg-[var(--card)] rounded-card shadow-soft p-6 border border-[var(--card-border)]">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[var(--foreground)]">Il tuo obiettivo</h3>
                <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-pill text-[10px] font-bold uppercase tracking-wide ${statusConfig[goal.status].color}`}>
                        {statusConfig[goal.status].label}
                    </span>
                    {onDeleteGoal && goal.status === 'active' && (
                        <button
                            onClick={() => onDeleteGoal(goal.id)}
                            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <X className="w-4 h-4 text-[var(--foreground)] opacity-40" />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-brand-cyan/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-brand-cyan" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--foreground)] opacity-50">{config.label}</p>
                    <p className="text-2xl font-black text-[var(--foreground)]">
                        {goal.current_value.toFixed(0)}<span className="opacity-30">/{goal.target_value.toFixed(0)}</span>
                        <span className="text-sm font-bold opacity-30 ml-1">{config.unit}</span>
                    </p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-pill overflow-hidden">
                    <div
                        className={`h-full rounded-pill transition-all duration-500 ${progress >= 100 ? 'bg-emerald-500' :
                            progressStatus === 'at-risk' ? 'bg-rose-500' :
                                progressStatus === 'behind' ? 'bg-amber-500' :
                                    'bg-brand-cyan'
                            }`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Status Line */}
            <div className="flex items-center justify-between text-xs">
                <span className={`font-bold ${progressStatus === 'achieved' ? 'text-emerald-500' :
                    progressStatus === 'at-risk' ? 'text-rose-500' :
                        progressStatus === 'behind' ? 'text-amber-500' :
                            'text-[var(--foreground)] opacity-50'
                    }`}>
                    {progressStatusLabel[progressStatus]}
                </span>
                {daysRemaining !== null && (
                    <span className="text-[var(--foreground)] opacity-30 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {daysRemaining === 0 ? 'Scade oggi' : `${daysRemaining} giorni rimasti`}
                    </span>
                )}
            </div>
        </div>
    );
}
