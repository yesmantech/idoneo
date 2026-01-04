import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Target, Zap, Flag, ChevronRight } from 'lucide-react';

export interface Recommendation {
    id: string;
    type: 'review' | 'practice' | 'simulation' | 'goal';
    title: string;
    description: string;
    priority: number;
    actionUrl?: string;
    actionLabel?: string;
    metadata?: Record<string, any>;
}

interface CoachingBlockProps {
    recommendations: Recommendation[];
    onSetGoal?: () => void;
}

const typeConfig = {
    review: {
        icon: BookOpen,
        bgColor: 'bg-amber-50 dark:bg-amber-900/20',
        iconBg: 'bg-amber-100 dark:bg-amber-900/30',
        iconColor: 'text-amber-600 dark:text-amber-400',
        borderColor: 'border-amber-100 dark:border-amber-800/30'
    },
    practice: {
        icon: Target,
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        iconBg: 'bg-red-100 dark:bg-red-900/30',
        iconColor: 'text-red-600 dark:text-red-400',
        borderColor: 'border-red-100 dark:border-red-800/30'
    },
    simulation: {
        icon: Zap,
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        iconBg: 'bg-blue-100 dark:bg-blue-900/30',
        iconColor: 'text-blue-600 dark:text-blue-400',
        borderColor: 'border-blue-100 dark:border-blue-800/30'
    },
    goal: {
        icon: Flag,
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        iconBg: 'bg-green-100 dark:bg-green-900/30',
        iconColor: 'text-green-600 dark:text-green-400',
        borderColor: 'border-green-100 dark:border-green-800/30'
    }
};

export default function CoachingBlock({ recommendations, onSetGoal }: CoachingBlockProps) {
    const navigate = useNavigate();

    if (recommendations.length === 0) {
        return null;
    }

    const handleAction = (rec: Recommendation) => {
        if (rec.type === 'goal' && onSetGoal) {
            onSetGoal();
        } else if (rec.actionUrl) {
            navigate(rec.actionUrl);
        }
    };

    return (
        <div className="bg-[var(--card)] rounded-card shadow-soft p-6 border border-[var(--card-border)] transition-colors">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-[var(--foreground)]">Cosa fare adesso</h3>
                    <p className="text-xs text-[var(--foreground)] opacity-40 mt-0.5">Suggerimenti personalizzati per te</p>
                </div>
                <div className="w-10 h-10 rounded-squircle bg-brand-cyan/10 flex items-center justify-center">
                    <span className="text-lg">🎯</span>
                </div>
            </div>

            <div className="space-y-3">
                {recommendations.map((rec) => {
                    const config = typeConfig[rec.type];
                    const Icon = config.icon;

                    return (
                        <button
                            key={rec.id}
                            onClick={() => handleAction(rec)}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl border ${config.borderColor} ${config.bgColor} hover:scale-[1.01] active:scale-[0.99] transition-all text-left group`}
                        >
                            <div className={`w-11 h-11 rounded-xl ${config.iconBg} ${config.iconColor} flex items-center justify-center flex-shrink-0`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-[var(--foreground)] leading-tight">{rec.title}</p>
                                <p className="text-xs text-[var(--foreground)] opacity-40 mt-0.5 line-clamp-1">{rec.description}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-[var(--foreground)] opacity-30 group-hover:opacity-60 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
