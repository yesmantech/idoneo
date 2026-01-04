import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Share2, Settings, Trophy, Zap, Gem, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileIdentityCardProps {
    user: User | null;
    profile: any;
    xp?: number;
}

interface MetricDesc {
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
}

export default function ProfileIdentityCard({ user, profile, xp = 0 }: ProfileIdentityCardProps) {
    const navigate = useNavigate();
    const [explanation, setExplanation] = useState<MetricDesc | null>(null);

    const nickname = profile?.nickname || 'Utente';
    const avatarUrl = profile?.avatar_url;

    const metrics: Record<string, MetricDesc> = {
        xp: {
            title: "XP Totali",
            description: "Punti esperienza accumulati rispondendo alle domande. Più XP hai, più sali nelle classifiche globali!",
            icon: <Trophy className="w-5 h-5 text-amber-500" fill="currentColor" />,
            color: "bg-amber-50 text-amber-500"
        },
        score: {
            title: "Energia",
            description: "L'energia necessaria per affrontare i quiz. Come utente Premium, la tua energia è infinita!",
            icon: <Zap className="w-5 h-5 text-emerald-500" fill="currentColor" />,
            color: "bg-emerald-50 text-emerald-500"
        },
        gems: {
            title: "Gemme",
            description: "Valuta speciale per sbloccare contenuti esclusivi, temi e vantaggi extra.",
            icon: <Gem className="w-5 h-5 text-cyan-500" fill="currentColor" />,
            color: "bg-cyan-50 text-cyan-500"
        }
    };

    const handleShare = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (navigator.share) {
            navigator.share({
                title: 'Idoneo',
                text: 'Mettiti alla prova con i quiz di Idoneo!',
                url: window.location.origin,
            }).catch(console.error);
        } else {
            alert("Condivisione in arrivo!");
        }
    };

    return (
        <>
            <div className="w-full bg-[var(--card)] rounded-[32px] shadow-sm border border-[var(--card-border)] overflow-hidden transition-colors duration-300">

                {/* Top Section - Avatar & Identity */}
                <div className="relative px-6 pt-6 pb-5 flex flex-col items-center">

                    {/* Action Buttons */}
                    <div className="absolute top-5 left-5">
                        <button
                            onClick={handleShare}
                            className="w-9 h-9 rounded-full bg-slate-100/80 dark:bg-slate-700/80 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all flex items-center justify-center backdrop-blur-sm"
                        >
                            <Share2 className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="absolute top-5 right-5">
                        <button
                            onClick={() => navigate('/profile/settings')}
                            className="w-9 h-9 rounded-full bg-slate-100/80 dark:bg-slate-700/80 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all flex items-center justify-center backdrop-blur-sm"
                        >
                            <Settings className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Avatar */}
                    <div className="relative mb-3">
                        <div className="w-20 h-20 rounded-[20px] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 shadow-inner relative overflow-hidden ring-[3px] ring-[var(--card)]">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt={nickname} className="w-full h-full object-cover" />
                            ) : (
                                <span className="w-full h-full flex items-center justify-center text-4xl">👤</span>
                            )}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 p-0.5 bg-[var(--card)] rounded-full">
                            <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-[var(--card)]"></div>
                        </div>
                    </div>

                    {/* Name & Email */}
                    <h1 className="text-xl font-black text-[var(--foreground)] tracking-tight text-center">{nickname}</h1>
                    <p className="text-[13px] text-[var(--foreground)] opacity-50 font-medium text-center truncate w-full px-8">
                        {user?.email}
                    </p>
                </div>

                {/* Stats Bar - S-Tier Dark Mode */}
                <div className="mx-4 mb-4 -mt-1">
                    <div className="bg-gradient-to-br from-[var(--card)] via-slate-50 dark:via-slate-700 to-[var(--card)] rounded-2xl p-4 border border-[var(--card-border)] shadow-sm">
                        <div className="flex items-center justify-between">

                            {/* XP */}
                            <div
                                className="flex-1 flex flex-col items-center cursor-pointer active:scale-95 transition-transform"
                                onClick={() => setExplanation(metrics.xp)}
                            >
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-800/50 dark:to-amber-900/30 flex items-center justify-center mb-1.5 ring-1 ring-amber-200/50 dark:ring-amber-700/50">
                                    <Trophy className="w-5 h-5 text-amber-500" fill="currentColor" />
                                </div>
                                <span className="text-xl font-black text-[var(--foreground)] tracking-tight">{xp}</span>
                                <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">XP</span>
                            </div>

                            <div className="w-px h-14 bg-gradient-to-b from-transparent via-slate-300 dark:via-slate-600 to-transparent"></div>

                            {/* Score */}
                            <div
                                className="flex-1 flex flex-col items-center cursor-pointer active:scale-95 transition-transform"
                                onClick={() => setExplanation(metrics.score)}
                            >
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-800/50 dark:to-emerald-900/30 flex items-center justify-center mb-1.5 ring-1 ring-emerald-200/50 dark:ring-emerald-700/50 relative">
                                    <Zap className="w-5 h-5 text-emerald-500" fill="currentColor" />
                                </div>
                                <span className="text-2xl font-black text-[var(--foreground)] tracking-tight leading-none mb-1">∞</span>
                                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">Energia</span>
                            </div>

                            <div className="w-px h-14 bg-gradient-to-b from-transparent via-slate-300 dark:via-slate-600 to-transparent"></div>

                            {/* Gems */}
                            <div
                                className="flex-1 flex flex-col items-center cursor-pointer active:scale-95 transition-transform"
                                onClick={() => setExplanation(metrics.gems)}
                            >
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-100 to-cyan-50 dark:from-cyan-800/50 dark:to-cyan-900/30 flex items-center justify-center mb-1.5 ring-1 ring-cyan-200/50 dark:ring-cyan-700/50">
                                    <Gem className="w-5 h-5 text-cyan-500" fill="currentColor" />
                                </div>
                                <span className="text-xl font-black text-[var(--foreground)] tracking-tight">0</span>
                                <span className="text-[9px] font-bold text-cyan-500 uppercase tracking-wider">Gemme</span>
                            </div>

                        </div>
                    </div>
                </div>

            </div>

            {/* Explanation Modal */}
            <AnimatePresence>
                {explanation && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setExplanation(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative bg-white rounded-[32px] p-8 max-w-xs w-full shadow-2xl text-center"
                        >
                            <button
                                onClick={() => setExplanation(null)}
                                className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className={`w-16 h-16 rounded-2xl ${explanation.color} flex items-center justify-center mx-auto mb-5`}>
                                {React.cloneElement(explanation.icon as React.ReactElement, { className: "w-8 h-8" })}
                            </div>

                            <h3 className="text-xl font-black text-slate-900 mb-2">{explanation.title}</h3>
                            <p className="text-slate-500 text-[14px] font-medium leading-relaxed mb-6">
                                {explanation.description}
                            </p>

                            <button
                                onClick={() => setExplanation(null)}
                                className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors text-[14px]"
                            >
                                Ho capito
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
