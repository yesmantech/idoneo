import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Target, Zap, Flag, ChevronRight, RefreshCcw } from 'lucide-react';

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
        icon: RefreshCcw,
        bg: 'rgba(245, 158, 11, 0.12)',
        color: '#F59E0B',
    },
    practice: {
        icon: Target,
        bg: 'rgba(239, 68, 68, 0.12)',
        color: '#EF4444',
    },
    simulation: {
        icon: Zap,
        bg: 'rgba(0, 177, 255, 0.12)',
        color: '#00B1FF',
    },
    goal: {
        icon: Flag,
        bg: 'rgba(34, 197, 94, 0.12)',
        color: '#22C55E',
    },
};

export default function CoachingBlock({ recommendations, onSetGoal }: CoachingBlockProps) {
    const navigate = useNavigate();

    if (recommendations.length === 0) return null;

    const handleAction = (rec: Recommendation) => {
        if (rec.type === 'goal' && onSetGoal) {
            onSetGoal();
        } else if (rec.actionUrl) {
            navigate(rec.actionUrl);
        }
    };

    return (
        <div className="space-y-2">
            {/* Section label */}
            <div className="px-1 mb-3">
                <p className="text-[10px] font-black text-[var(--foreground)] opacity-40 uppercase tracking-widest">
                    Cosa fare adesso
                </p>
                <h3 className="text-[20px] font-bold text-[var(--foreground)] tracking-tight mt-0.5">
                    Suggerimenti personalizzati
                </h3>
            </div>

            {recommendations.map((rec, index) => {
                const cfg = typeConfig[rec.type];
                const Icon = cfg.icon;

                return (
                    <motion.button
                        key={rec.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, type: 'spring', damping: 24, stiffness: 300 }}
                        onClick={() => handleAction(rec)}
                        className="w-full flex items-center gap-3.5 p-4 rounded-[20px] text-left transition-all active:scale-[0.98] active:opacity-80"
                        style={{
                            background: 'var(--card)',
                            border: '1px solid var(--card-border)',
                        }}
                    >
                        {/* Icon */}
                        <div
                            className="w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0"
                            style={{ background: cfg.bg }}
                        >
                            <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                            <p className="text-[15px] font-bold text-[var(--foreground)] leading-tight truncate">
                                {rec.title}
                            </p>
                            <p className="text-[13px] text-[var(--foreground)] opacity-40 mt-0.5 line-clamp-1">
                                {rec.description}
                            </p>
                        </div>

                        {/* Chevron */}
                        <ChevronRight
                            className="w-4 h-4 shrink-0 opacity-25"
                            style={{ color: 'var(--foreground)' }}
                        />
                    </motion.button>
                );
            })}
        </div>
    );
}
