'use client';
import React from 'react';
import { motion } from 'framer-motion';

type TierInfo = {
    tier: string;
    streak: number;
    label: string;
    color: string;
    bg: string;
};

const TIERS: TierInfo[] = [
    { tier: 'Bronze', streak: 1, label: '1-6 Giorni', color: 'text-orange-400', bg: 'from-orange-600 to-amber-500' },
    { tier: 'Silver', streak: 7, label: '7-13 Giorni', color: 'text-slate-300', bg: 'from-slate-500 to-gray-400' },
    { tier: 'Gold', streak: 14, label: '14-29 Giorni', color: 'text-yellow-400', bg: 'from-yellow-500 to-amber-400' },
    { tier: 'Emerald', streak: 30, label: '30-59 Giorni', color: 'text-emerald-400', bg: 'from-emerald-500 to-green-400' },
    { tier: 'Sapphire', streak: 60, label: '60-99 Giorni', color: 'text-blue-400', bg: 'from-blue-500 to-cyan-400' },
    { tier: 'Diamond', streak: 100, label: '100+ Giorni', color: 'text-purple-300', bg: 'from-purple-500 via-pink-400 to-cyan-400' },
];

function triggerStreak(streak: number, isMilestone: boolean = true) {
    window.dispatchEvent(
        new CustomEvent('streak_updated', {
            detail: { streak, isMilestone },
        })
    );
}

export default function StreakTestPage() {
    return (
        <div className="min-h-screen bg-slate-950 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-4xl font-black text-white text-center mb-2">
                    🔥 Test Streak Celebration
                </h1>
                <p className="text-slate-400 text-center mb-10 text-lg">
                    Clicca su un tier per attivare l'animazione della streak
                </p>

                <div className="grid grid-cols-2 gap-4">
                    {TIERS.map((t, i) => (
                        <motion.button
                            key={t.tier}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            onClick={() => triggerStreak(t.streak, true)}
                            className={`
                                relative overflow-hidden p-5 rounded-2xl text-left
                                bg-gradient-to-br ${t.bg}
                                hover:scale-[1.03] active:scale-[0.97]
                                transition-transform duration-200 cursor-pointer
                                shadow-lg
                            `}
                        >
                            <div className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">
                                {t.label}
                            </div>
                            <div className="text-white text-2xl font-black">
                                {t.tier}
                            </div>
                            <div className="text-white/80 text-sm font-medium mt-1">
                                Streak: {t.streak} giorni
                            </div>
                        </motion.button>
                    ))}
                </div>

                <div className="mt-8 text-center">
                    <p className="text-slate-500 text-sm mb-4">
                        Oppure inserisci un valore personalizzato:
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <input
                            id="custom-streak"
                            type="number"
                            placeholder="Giorni..."
                            min={1}
                            className="w-32 px-4 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 text-center text-lg font-bold focus:outline-none focus:border-blue-500"
                        />
                        <button
                            onClick={() => {
                                const input = document.getElementById('custom-streak') as HTMLInputElement;
                                const val = parseInt(input?.value || '1');
                                if (val > 0) triggerStreak(val, true);
                            }}
                            className="px-6 py-3 bg-[#00B1FF] hover:bg-[#0099e6] text-white font-bold rounded-xl transition-colors"
                        >
                            Testa! 🔥
                        </button>
                    </div>
                </div>

                <div className="mt-10 text-center">
                    <a
                        href="/demo/flames"
                        className="text-slate-500 hover:text-white transition-colors text-sm"
                    >
                        ← Torna alle Fiammelle
                    </a>
                </div>
            </div>
        </div>
    );
}
