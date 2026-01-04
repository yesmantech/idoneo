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
        gradient: 'from-amber-500 to-orange-500',
        bgGlow: 'bg-gradient-to-br from-amber-500/10 to-orange-500/10',
        iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500',
        accentColor: 'text-amber-600 dark:text-amber-400',
        borderHover: 'hover:border-amber-300 dark:hover:border-amber-600'
    },
    practice: {
        icon: Target,
        gradient: 'from-rose-500 to-pink-500',
        bgGlow: 'bg-gradient-to-br from-rose-500/10 to-pink-500/10',
        iconBg: 'bg-gradient-to-br from-rose-500 to-pink-500',
        accentColor: 'text-rose-600 dark:text-rose-400',
        borderHover: 'hover:border-rose-300 dark:hover:border-rose-600'
    },
    simulation: {
        icon: Zap,
        gradient: 'from-[#00B1FF] to-cyan-400',
        bgGlow: 'bg-gradient-to-br from-[#00B1FF]/10 to-cyan-400/10',
        iconBg: 'bg-gradient-to-br from-[#00B1FF] to-cyan-400',
        accentColor: 'text-[#00B1FF]',
        borderHover: 'hover:border-cyan-300 dark:hover:border-cyan-600'
    },
    goal: {
        icon: Flag,
        gradient: 'from-emerald-500 to-green-500',
        bgGlow: 'bg-gradient-to-br from-emerald-500/10 to-green-500/10',
        iconBg: 'bg-gradient-to-br from-emerald-500 to-green-500',
        accentColor: 'text-emerald-600 dark:text-emerald-400',
        borderHover: 'hover:border-emerald-300 dark:hover:border-emerald-600'
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
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-[var(--card)] rounded-[32px] shadow-soft p-6 border border-[var(--card-border)] transition-colors overflow-hidden"
        >
            {/* Background Decorator */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#00B1FF]/5 to-emerald-500/5 rounded-bl-[100px] pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6 relative z-10">
                <div>
                    <h3 className="text-xl font-black text-[var(--foreground)]">Cosa fare adesso</h3>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">Suggerimenti personalizzati per te</p>
                </div>
                <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    className="w-14 h-14 rounded-[18px] bg-gradient-to-br from-[#00B1FF] to-emerald-500 flex items-center justify-center shadow-lg"
                >
                    <Sparkles className="w-7 h-7 text-white" />
                </motion.div>
            </div>

            {/* Recommendations */}
            <div className="space-y-3 relative z-10">
                {recommendations.map((rec, index) => {
                    const config = typeConfig[rec.type];
                    const Icon = config.icon;

                    return (
                        <motion.button
                            key={rec.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => handleAction(rec)}
                            className={`w-full flex items-center gap-4 p-4 rounded-[20px] bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 ${config.borderHover} hover:shadow-md active:scale-[0.98] transition-all text-left group relative overflow-hidden`}
                        >
                            {/* Subtle background glow */}
                            <div className={`absolute inset-0 ${config.bgGlow} opacity-0 group-hover:opacity-100 transition-opacity`} />

                            {/* Gradient Icon */}
                            <div className={`relative w-12 h-12 rounded-2xl ${config.iconBg} flex items-center justify-center flex-shrink-0 shadow-md`}>
                                <Icon className="w-5 h-5 text-white" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 relative z-10">
                                <p className="text-[15px] font-bold text-slate-900 dark:text-slate-100 leading-tight">{rec.title}</p>
                                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{rec.description}</p>
                            </div>

                            {/* Arrow */}
                            <div className="relative z-10 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center group-hover:bg-slate-200 dark:group-hover:bg-slate-600 transition-colors flex-shrink-0">
                                <ChevronRight className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* Footer Hint */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 relative z-10">
                <p className="text-[12px] text-slate-400 dark:text-slate-500 text-center">
                    💡 Completa queste azioni per migliorare il tuo punteggio
                </p>
            </div>
        </motion.div>
    );
}
