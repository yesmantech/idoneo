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
            <div className="bg-white rounded-card shadow-soft p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-text-primary">Il tuo obiettivo</h3>
                    <div className="w-10 h-10 rounded-squircle bg-brand-cyan/10 flex items-center justify-center">
                        <Flag className="w-5 h-5 text-brand-cyan" />
                    </div>
                </div>

                <div className="text-center py-8 bg-canvas-light rounded-2xl border border-dashed border-text-tertiary/20">
                    <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-3">
                        <Target className="w-6 h-6 text-text-tertiary" />
                    </div>
                    <p className="text-sm font-medium text-text-secondary mb-4">
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
        achieved: { label: 'Raggiunto! 🎉', color: 'text-semantic-success bg-semantic-success/10' },
        failed: { label: 'Non raggiunto', color: 'text-semantic-error bg-semantic-error/10' },
        expired: { label: 'Scaduto', color: 'text-text-tertiary bg-canvas-light' }
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
        <div className="bg-white rounded-card shadow-soft p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-text-primary">Il tuo obiettivo</h3>
                <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-pill text-[10px] font-bold uppercase tracking-wide ${statusConfig[goal.status].color}`}>
                        {statusConfig[goal.status].label}
                    </span>
                    {onDeleteGoal && goal.status === 'active' && (
                        <button
                            onClick={() => onDeleteGoal(goal.id)}
                            className="p-1.5 rounded-full hover:bg-canvas-light transition-colors"
                        >
                            <X className="w-4 h-4 text-text-tertiary" />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-brand-cyan/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-brand-cyan" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium text-text-secondary">{config.label}</p>
                    <p className="text-2xl font-black text-text-primary">
                        {goal.current_value.toFixed(0)}<span className="text-text-tertiary">/{goal.target_value.toFixed(0)}</span>
                        <span className="text-sm font-bold text-text-tertiary ml-1">{config.unit}</span>
                    </p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
                <div className="h-3 bg-canvas-light rounded-pill overflow-hidden">
                    <div
                        className={`h-full rounded-pill transition-all duration-500 ${progress >= 100 ? 'bg-semantic-success' :
                                progressStatus === 'at-risk' ? 'bg-semantic-error' :
                                    progressStatus === 'behind' ? 'bg-brand-orange' :
                                        'bg-brand-cyan'
                            }`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Status Line */}
            <div className="flex items-center justify-between text-xs">
                <span className={`font-bold ${progressStatus === 'achieved' ? 'text-semantic-success' :
                        progressStatus === 'at-risk' ? 'text-semantic-error' :
                            progressStatus === 'behind' ? 'text-brand-orange' :
                                'text-text-secondary'
                    }`}>
                    {progressStatusLabel[progressStatus]}
                </span>
                {daysRemaining !== null && (
                    <span className="text-text-tertiary flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {daysRemaining === 0 ? 'Scade oggi' : `${daysRemaining} giorni rimasti`}
                    </span>
                )}
            </div>
        </div>
    );
}
