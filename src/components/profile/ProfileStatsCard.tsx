import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { leaderboardService } from '@/lib/leaderboardService';
import { Trophy, Zap, Flame, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileStatsCardProps {
    xp: number;
    score?: number;
    streak?: number;
}

interface MetricDesc {
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
}

export default function ProfileStatsCard({ xp = 0, score = 0, streak = 0 }: ProfileStatsCardProps) {
    const [explanation, setExplanation] = useState<MetricDesc | null>(null);

    const metrics: Record<string, MetricDesc> = {
        xp: {
            title: "XP Totali",
            description: "Punti esperienza accumulati rispondendo correttamente alle domande. Più XP hai, più sali nelle classifiche globali!",
            icon: <Trophy className="w-5 h-5 text-amber-500" fill="currentColor" />,
            color: "bg-amber-50 text-amber-500"
        },
        score: {
            title: "Punteggio Idoneità",
            description: "Il tuo livello di preparazione reale (0-100), calcolato da un algoritmo avanzato che considera costanza, precisione e copertura degli argomenti.",
            icon: <Zap className="w-5 h-5 text-emerald-500" fill="currentColor" />,
            color: "bg-emerald-50 text-emerald-500"
        },
        streak: {
            title: "Streak Giornaliera",
            description: "I giorni consecutivi in cui hai completato almeno un quiz. Mantienila accesa ogni giorno per sbloccare badge speciali!",
            icon: <Flame className="w-5 h-5 text-orange-500" fill="currentColor" />,
            color: "bg-orange-50 text-orange-500"
        }
    };

    return (
        <div className="space-y-3">

            {/* XP Card */}
            <div
                onClick={async () => {
                    try {
                        const { data: { user } } = await supabase.auth.getUser();
                        if (!user) return;
                        const quizzes = await leaderboardService.getUserActiveQuizzes(user.id);
                        if (quizzes.length === 0) {
                            alert("Nessun quiz attivo trovato.");
                            return;
                        }
                        const firstQuiz = quizzes[0];
                        await leaderboardService.updateUserScore(user.id, firstQuiz.id);
                        const fresh = await leaderboardService.getUserSkillRank(user.id, firstQuiz.id);
                        if (fresh) {
                            alert(`Score aggiornato: ${fresh.score}`);
                        }
                    } catch (e: any) {
                        alert(`Errore: ${e.message}`);
                    }
                    setExplanation(metrics.xp);
                }}
                className="bg-white rounded-[32px] p-5 shadow-sm border border-slate-100/60 flex flex-col justify-between h-[140px] cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group"
            >
                <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                        <Trophy className="w-6 h-6 text-amber-500" fill="currentColor" />
                    </div>
                </div>
                <div>
                    <div className="text-3xl font-black text-slate-900 tracking-tight">{xp}</div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">XP Totali</div>
                </div>
            </div>

            {/* Preparation Score Card */}
            <div
                onClick={() => setExplanation(metrics.score)}
                className="bg-white rounded-[32px] p-5 shadow-sm border border-slate-100/60 flex flex-col justify-between h-[140px] cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group"
            >
                <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                        <Zap className="w-6 h-6 text-emerald-500" fill="currentColor" />
                    </div>
                </div>
                <div>
                    <div className="text-3xl font-black text-slate-900 tracking-tight">{score}</div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">Punteggio Idoneità</div>
                </div>
            </div>

            {/* Streak Card */}
            <div
                onClick={() => setExplanation(metrics.streak)}
                className="bg-white rounded-[32px] p-5 shadow-sm border border-slate-100/60 flex flex-col justify-between h-[140px] cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group"
            >
                <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                        <Flame className="w-6 h-6 text-orange-500" fill="currentColor" />
                    </div>
                </div>
                <div>
                    <div className="text-3xl font-black text-slate-900 tracking-tight">{streak}</div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">Streak</div>
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
                            className="relative bg-white rounded-[40px] p-8 max-w-xs w-full shadow-2xl text-center border border-white/20"
                        >
                            <button
                                onClick={() => setExplanation(null)}
                                className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className={`w-20 h-20 rounded-[24px] ${explanation.color} flex items-center justify-center mx-auto mb-6 shadow-sm`}>
                                {React.cloneElement(explanation.icon as React.ReactElement, { className: "w-10 h-10" })}
                            </div>

                            <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">{explanation.title}</h3>
                            <p className="text-slate-500 text-[15px] font-medium leading-relaxed mb-8">
                                {explanation.description}
                            </p>

                            <button
                                onClick={() => setExplanation(null)}
                                className="w-full py-4 bg-slate-900 text-white rounded-[24px] font-bold hover:bg-slate-800 transition-colors text-[15px] shadow-lg shadow-slate-900/20"
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
