import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Target, Zap, Flag, ChevronRight, Sparkles, RefreshCcw } from 'lucide-react';

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
        iconBg: 'bg-amber-500',
    },
    practice: {
        icon: Target,
        iconBg: 'bg-rose-500',
    },
    simulation: {
        icon: Zap,
        iconBg: 'bg-[#00B1FF]',
    },
    goal: {
        icon: Flag,
        iconBg: 'bg-emerald-500',
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
        <div className="space-y-3">
            {/* Header */}
            <div className="px-1 mb-1">
                <h3 className="text-[20px] font-bold text-slate-900 dark:text-white tracking-tight">Cosa fare adesso</h3>
                <p className="text-[13px] text-slate-500 dark:text-white/40 mt-0.5">Suggerimenti personalizzati per te</p>
            </div>

            {/* Recommendation Rows */}
            {recommendations.map((rec, index) => {
                const config = typeConfig[rec.type];
                const Icon = config.icon;

                return (
                    <motion.button
                        key={rec.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.06 }}
                        onClick={() => handleAction(rec)}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-[#1C1C1E] active:scale-[0.98] active:opacity-80 transition-all text-left group"
                    >
                        {/* Icon */}
                        <div className={`w-[46px] h-[46px] rounded-[14px] ${config.iconBg} flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-[22px] h-[22px] text-white" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <p className="text-[15px] font-semibold text-slate-900 dark:text-white leading-tight">{rec.title}</p>
                            <p className="text-[13px] text-slate-500 dark:text-white/40 mt-0.5 line-clamp-1">{rec.description}</p>
                        </div>

                        {/* Chevron */}
                        <ChevronRight className="w-[18px] h-[18px] text-slate-300 dark:text-white/20 flex-shrink-0" />
                    </motion.button>
                );
            })}
        </div>
    );
}
