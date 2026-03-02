import React from 'react';
import { motion } from 'framer-motion';

type FlameTier = 'bronze' | 'silver' | 'gold' | 'emerald' | 'sapphire' | 'diamond';

/**
 * Demo Page to preview all flame tiers (using 2D PNG icons)
 * Access at: /demo/flames
 */
export default function FlamesDemoPage() {
    const tiers: { tier: FlameTier; streak: number; label: string; icon: string }[] = [
        { tier: 'bronze', streak: 1, label: '1-6 Giorni', icon: '/icons/flame-bronze.png' },
        { tier: 'silver', streak: 7, label: '1 Settimana', icon: '/icons/flame-silver.png' },
        { tier: 'gold', streak: 14, label: '2 Settimane', icon: '/icons/flame-gold.png' },
        { tier: 'emerald', streak: 30, label: '1 Mese', icon: '/icons/flame-emerald.png' },
        { tier: 'sapphire', streak: 60, label: '2 Mesi', icon: '/icons/flame-sapphire.png' },
        { tier: 'diamond', streak: 100, label: '100+ Giorni', icon: '/icons/flame-diamond.png' },
    ];

    const tierBgColors: Record<FlameTier, string> = {
        bronze: 'from-orange-900/30 to-amber-900/20 border-orange-500/30',
        silver: 'from-slate-700/40 to-gray-800/30 border-slate-400/30',
        gold: 'from-yellow-900/30 to-amber-800/20 border-yellow-500/40',
        emerald: 'from-emerald-900/30 to-green-900/20 border-emerald-500/40',
        sapphire: 'from-blue-900/40 to-indigo-900/30 border-blue-500/40',
        diamond: 'from-purple-900/30 via-pink-900/20 to-cyan-900/20 border-white/30',
    };

    const tierTextColors: Record<FlameTier, string> = {
        bronze: 'text-orange-400',
        silver: 'text-slate-300',
        gold: 'text-yellow-400',
        emerald: 'text-emerald-400',
        sapphire: 'text-blue-400',
        diamond: 'text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400',
    };

    const tierGlow: Record<FlameTier, string> = {
        bronze: 'drop-shadow(0 0 20px rgba(205,127,50,0.4))',
        silver: 'drop-shadow(0 0 20px rgba(192,192,192,0.4))',
        gold: 'drop-shadow(0 0 20px rgba(255,215,0,0.5))',
        emerald: 'drop-shadow(0 0 20px rgba(80,200,120,0.5))',
        sapphire: 'drop-shadow(0 0 20px rgba(30,144,255,0.5))',
        diamond: 'drop-shadow(0 0 25px rgba(255,255,255,0.4))',
    };

    return (
        <div className="min-h-screen bg-slate-950 py-12 px-4">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-4xl font-black text-white text-center mb-2">
                    🔥 Sistema Fiammelle Tier
                </h1>
                <p className="text-slate-400 text-center mb-12 text-lg">
                    Ogni traguardo sblocca una fiammella unica
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {tiers.map((t, i) => (
                        <motion.div
                            key={t.tier}
                            initial={{ opacity: 0, y: 30, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: i * 0.12, type: 'spring', damping: 15 }}
                            className={`
                                flex flex-col items-center p-6 rounded-3xl
                                bg-gradient-to-br ${tierBgColors[t.tier]}
                                border backdrop-blur-sm
                            `}
                        >
                            <motion.img
                                src={t.icon}
                                alt={`${t.tier} flame`}
                                style={{
                                    width: 120,
                                    height: 120,
                                    objectFit: 'contain',
                                    filter: tierGlow[t.tier],
                                }}
                                animate={{ y: [0, -4, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            />

                            <span className={`text-4xl font-black mt-4 ${tierTextColors[t.tier]}`}>
                                {t.streak}
                            </span>
                            <span className="text-sm font-medium text-slate-400 mt-1">
                                {t.label}
                            </span>
                            <span className={`
                                text-xs font-bold uppercase tracking-wider mt-2 px-3 py-1 rounded-full
                                ${t.tier === 'diamond'
                                    ? 'bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 text-white'
                                    : `bg-${t.tier === 'bronze' ? 'orange' : t.tier === 'silver' ? 'slate' : t.tier === 'gold' ? 'yellow' : t.tier === 'emerald' ? 'emerald' : 'blue'}-500/20 ${tierTextColors[t.tier]}`
                                }
                            `}>
                                {t.tier.charAt(0).toUpperCase() + t.tier.slice(1)}
                            </span>
                        </motion.div>
                    ))}
                </div>

                {/* Back Button */}
                <div className="mt-12 text-center">
                    <a
                        href="/"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-[#00B1FF] hover:bg-[#0099e6] text-white font-bold rounded-full transition-all text-lg"
                    >
                        ← Torna alla Home
                    </a>
                </div>
            </div>
        </div>
    );
}
