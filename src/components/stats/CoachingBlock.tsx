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
        bgColor: 'bg-amber-50',
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        borderColor: 'border-amber-100'
    },
    practice: {
        icon: Target,
        bgColor: 'bg-red-50',
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        borderColor: 'border-red-100'
    },
    simulation: {
        icon: Zap,
        bgColor: 'bg-blue-50',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        borderColor: 'border-blue-100'
    },
    goal: {
        icon: Flag,
        bgColor: 'bg-green-50',
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        borderColor: 'border-green-100'
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
        <div className="bg-white rounded-card shadow-soft p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-text-primary">Cosa fare adesso</h3>
                    <p className="text-xs text-text-tertiary mt-0.5">Suggerimenti personalizzati per te</p>
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
                                <p className="text-sm font-bold text-text-primary leading-tight">{rec.title}</p>
                                <p className="text-xs text-text-tertiary mt-0.5 line-clamp-1">{rec.description}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-text-tertiary group-hover:text-text-secondary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
