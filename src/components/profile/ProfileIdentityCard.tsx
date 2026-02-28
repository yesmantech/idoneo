import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { RotateCcw, X, Zap, Star, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileIdentityCardProps {
    user: User | null;
    profile: any;
    xp?: number;
}

export default function ProfileIdentityCard({ user, profile, xp = 0 }: ProfileIdentityCardProps) {
    const navigate = useNavigate();
    const [showXPModal, setShowXPModal] = useState(false);

    const nickname = profile?.nickname || 'Utente';
    const avatarUrl = profile?.avatar_url;

    return (
        <>
            <div className="flex items-center justify-between py-2">

                {/* XP Pill — Blue brand theme — clickable */}
                <button
                    onClick={() => setShowXPModal(true)}
                    className="flex items-center gap-1.5 bg-[#E0F4FF] dark:bg-[#001F3F] px-3.5 py-2 rounded-2xl active:scale-95 transition-transform"
                >
                    {/* XP Logo — CSS gradient text */}
                    <span
                        className="font-black select-none"
                        style={{
                            fontSize: '18px',
                            lineHeight: 1,
                            letterSpacing: '-0.5px',
                            background: 'linear-gradient(180deg, #67E8F9 0%, #00B1FF 50%, #0077CC 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        XP
                    </span>
                    {/* Number */}
                    <span className="text-[17px] font-bold text-[#00B1FF] leading-none">{xp.toLocaleString()}</span>
                </button>

                {/* Right side: Reset Tour + Avatar (Settings) */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            Object.keys(localStorage).forEach(key => {
                                if (key.startsWith('idoneo_onboarding_') || key === 'idoneo_welcome_shown') {
                                    localStorage.removeItem(key);
                                }
                            });
                            window.location.href = '/';
                        }}
                        className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#1A1A1A] text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all flex items-center justify-center border border-slate-200 dark:border-white/5 shadow-sm group"
                        title="Ricomincia il Tour"
                    >
                        <RotateCcw className="w-4 h-4 group-hover:-rotate-180 transition-transform duration-500" />
                    </button>
                    <button
                        onClick={() => navigate('/profile/settings')}
                        data-onboarding="profile-settings"
                        className="rounded-full ring-2 ring-slate-200 dark:ring-white/10 hover:ring-amber-400 dark:hover:ring-amber-500 transition-all active:scale-95 shadow-sm"
                        title="Impostazioni"
                    >
                        <UserAvatar
                            src={avatarUrl}
                            name={nickname}
                            size="lg"
                        />
                    </button>
                </div>

            </div>

            {/* XP Info Modal — Simple XP-only explanation */}
            <AnimatePresence>
                {showXPModal && (
                    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowXPModal(false)}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 300 }}
                            className="relative w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-t-[28px] sm:rounded-[28px] overflow-hidden shadow-2xl"
                        >
                            {/* Close */}
                            <button
                                onClick={() => setShowXPModal(false)}
                                className="absolute top-3 right-3 p-2 bg-slate-100 dark:bg-white/[0.06] rounded-full text-slate-500 dark:text-white/40 z-10"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="p-6 pt-8">
                                {/* Header */}
                                <div className="flex flex-col items-center text-center mb-6">
                                    <div className="w-16 h-16 rounded-2xl bg-[#00B1FF]/10 flex items-center justify-center mb-4">
                                        <Zap className="w-8 h-8 text-[#00B1FF]" />
                                    </div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1.5">Cosa sono gli XP?</h2>
                                    <p className="text-[14px] text-slate-500 dark:text-white/40 leading-snug px-2">
                                        Gli XP (Experience Points) misurano il tuo impegno e la costanza nello studio.
                                    </p>
                                </div>

                                {/* Bullets */}
                                <div className="space-y-2.5 mb-6">
                                    <div className="flex gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04]">
                                        <div className="w-9 h-9 rounded-[12px] bg-[#00B1FF]/10 flex-shrink-0 flex items-center justify-center">
                                            <Star className="w-4 h-4 text-[#00B1FF]" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white text-[14px] mb-0.5">1 XP per risposta corretta</h4>
                                            <p className="text-[12px] text-slate-500 dark:text-white/35">Ogni risposta giusta ti fa guadagnare 1 punto esperienza.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04]">
                                        <div className="w-9 h-9 rounded-[12px] bg-emerald-500/10 flex-shrink-0 flex items-center justify-center">
                                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white text-[14px] mb-0.5">Si accumulano nel profilo</h4>
                                            <p className="text-[12px] text-slate-500 dark:text-white/35">I tuoi XP totali restano per sempre e mostrano il tuo percorso.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04]">
                                        <div className="w-9 h-9 rounded-[12px] bg-amber-500/10 flex-shrink-0 flex items-center justify-center">
                                            <Zap className="w-4 h-4 text-amber-500" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white text-[14px] mb-0.5">Impegno, non preparazione</h4>
                                            <p className="text-[12px] text-slate-500 dark:text-white/35">Gli XP misurano quanto ti alleni, non il tuo livello di preparazione.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Action */}
                                <button
                                    onClick={() => setShowXPModal(false)}
                                    className="w-full py-3.5 bg-[#00B1FF] text-white font-bold rounded-2xl active:scale-[0.98] transition-transform"
                                >
                                    Ho capito
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
