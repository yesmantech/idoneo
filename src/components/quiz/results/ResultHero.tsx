import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Success/Failure Animation Component
// Uses SVG path animation for the checkmark or X
// Success/Failure/Neutral Animation Component
const AnimatedIcon = ({ passed }: { passed: boolean | null }) => {
    if (passed === null) {
        return (
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-xl bg-blue-100">
                <svg className="w-12 h-12 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <motion.path
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        d="M5 13l4 4L19 7" // Checkmark but simpler or different icon? Let's use flag or simple check
                    />
                </svg>
            </div>
        )
    }

    return (
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-xl ${passed ? 'bg-emerald-100' : 'bg-red-100'}`}>
            {passed ? (
                <svg className="w-12 h-12 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <motion.path
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        d="M20 6L9 17l-5-5"
                    />
                </svg>
            ) : (
                <svg className="w-12 h-12 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <motion.path
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        d="M18 6L6 18M6 6l12 12" // X icon
                    />
                </svg>
            )}
        </div>
    );
};

interface ResultHeroProps {
    score: number;
    maxScore: number;
    passed: boolean | null;
    xpEarned?: number | null;
}

export default function ResultHero({ score, passed, xpEarned }: ResultHeroProps) {
    const getHeroText = () => {
        if (passed === true) return "IDONEO! 🎉";
        if (passed === false) return "NON IDONEO ⚠️";
        return "Quiz Completato! 🚀";
    };

    const getHeroColor = () => {
        if (passed === true) return 'text-emerald-600';
        if (passed === false) return 'text-red-600';
        return 'text-slate-800';
    };

    const getMessage = () => {
        if (passed === true) return "Ottimo lavoro, hai superato la soglia di idoneità!";
        if (passed === false) return "Non hai raggiunto il punteggio minimo per l'idoneità. Riprova!";
        return "Hai completato la simulazione. Controlla le risposte per migliorare.";
    };

    return (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-white border-b border-slate-100">
            <AnimatedIcon passed={passed} />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <h1 className={`text-3xl font-black mb-2 tracking-tight ${getHeroColor()}`}>
                    {getHeroText()}
                </h1>
                <p className="text-slate-500 font-medium mb-6 max-w-sm mx-auto">
                    {getMessage()}
                </p>

                <div className="flex gap-4 justify-center">
                    <div className="bg-slate-50 px-6 py-3 rounded-2xl inline-flex flex-col border border-slate-200 shadow-sm">
                        <span className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">Punteggio Totale</span>
                        <span className="text-3xl font-black text-slate-900">{score.toFixed(2)}</span>
                    </div>

                    {xpEarned !== undefined && xpEarned !== null && xpEarned > 0 && (
                        <div className="bg-violet-50 px-6 py-3 rounded-2xl inline-flex flex-col border border-violet-100 shadow-sm animate-bounce-short">
                            <span className="text-xs uppercase tracking-widest text-violet-400 font-bold mb-1">XP Guadagnati</span>
                            <span className="text-3xl font-black text-violet-600">+{xpEarned}</span>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
