import React, { useState } from 'react';
import { Trophy, Zap, Gem, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileStatsCardProps {
    xp: number;
}

interface MetricDesc {
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
}

export default function ProfileStatsCard({ xp }: ProfileStatsCardProps) {
    const [explanation, setExplanation] = useState<MetricDesc | null>(null);

    const metrics: Record<string, MetricDesc> = {
        xp: {
            title: "XP Totali",
            description: "Punti esperienza accumulati rispondendo correttamente alle domande. Più XP hai, più sali nelle classifiche globali!",
            icon: <Trophy className="w-6 h-6" />,
            color: "text-amber-500 bg-amber-50"
        },
        energy: {
            title: "Energia",
            description: "Necessaria per avviare nuove simulazioni. Attualmente è infinita per te, così puoi allenarti senza limiti!",
            icon: <Zap className="w-6 h-6" />,
            color: "text-red-500 bg-red-50"
        },
        gems: {
            title: "Gemme",
            description: "Valuta speciale che potrai usare in futuro per sbloccare contenuti esclusivi, temi e vantaggi extra.",
            icon: <Gem className="w-6 h-6" />,
            color: "text-cyan-500 bg-cyan-50"
        }
    };

    return (
        <div className="grid grid-cols-3 gap-3 mb-2">

            {/* XP Card */}
            <div
                onClick={() => setExplanation(metrics.xp)}
                className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-50 aspect-square sm:aspect-auto cursor-pointer active:scale-95 transition-transform"
            >
                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center mb-2">
                    <Trophy className="w-4 h-4 text-amber-500" fill="currentColor" />
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-center">XP Totali</div>
                <div className="text-xl font-bold text-slate-900">{xp}</div>
            </div>

            {/* Energy Card */}
            <div
                onClick={() => setExplanation(metrics.energy)}
                className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-50 aspect-square sm:aspect-auto cursor-pointer active:scale-95 transition-transform"
            >
                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center mb-2">
                    <Zap className="w-4 h-4 text-red-500" fill="currentColor" />
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-center">Energia</div>
                <div className="text-xl font-bold text-slate-900">∞</div>
            </div>

            {/* Gems Card */}
            <div
                onClick={() => setExplanation(metrics.gems)}
                className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-50 aspect-square sm:aspect-auto cursor-pointer active:scale-95 transition-transform"
            >
                <div className="w-8 h-8 rounded-full bg-cyan-50 flex items-center justify-center mb-2">
                    <Gem className="w-4 h-4 text-cyan-500" fill="currentColor" />
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-center">Gemme</div>
                <div className="text-xl font-bold text-slate-900">0</div>
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
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
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
                                <X className="w-4 h-4" />
                            </button>

                            <div className={`w-16 h-16 rounded-[22px] ${explanation.color} flex items-center justify-center mx-auto mb-5`}>
                                {explanation.icon}
                            </div>

                            <h3 className="text-xl font-black text-slate-900 mb-2">{explanation.title}</h3>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                {explanation.description}
                            </p>

                            <button
                                onClick={() => setExplanation(null)}
                                className="w-full mt-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors"
                            >
                                Ho capito
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}
