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
        <div className={`w-28 h-28 rounded-squircle flex items-center justify-center mb-6 shadow-soft ${passed ? 'bg-semantic-success/10' : 'bg-semantic-error/10'}`}>
            {passed ? (
                <svg className="w-14 h-14 text-semantic-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <motion.path
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        d="M20 6L9 17l-5-5"
                    />
                </svg>
            ) : (
                <svg className="w-14 h-14 text-semantic-error" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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
        if (passed === true) return 'text-semantic-success';
        if (passed === false) return 'text-semantic-error';
        return 'text-text-primary';
    };

    const getMessage = () => {
        if (passed === true) return "Ottimo lavoro, hai superato la soglia di idoneità!";
        if (passed === false) return "Non hai raggiunto il punteggio minimo per l'idoneità. Riprova!";
        return "Hai completato la simulazione. Controlla le risposte per migliorare.";
    };

    return (
        <div className="flex flex-col items-center justify-center pt-12 pb-8 px-4 text-center bg-white rounded-b-[40px] shadow-soft mb-8">
            <AnimatedIcon passed={passed} />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="w-full max-w-md mx-auto"
            >
                <h1 className={`text-4xl font-bold mb-3 tracking-tight ${getHeroColor()}`}>
                    {getHeroText()}
                </h1>
                <p className="text-text-secondary text-lg mb-8 max-w-sm mx-auto leading-relaxed">
                    {getMessage()}
                </p>

                <div className="flex gap-4 justify-center">
                    <div className="bg-canvas-light px-8 py-4 rounded-card inline-flex flex-col items-center min-w-[140px]">
                        <span className="text-[10px] uppercase tracking-widest text-text-tertiary font-bold mb-1">Punteggio</span>
                        <span className="text-4xl font-bold text-text-primary">{score.toFixed(2)}</span>
                    </div>

                    {xpEarned !== undefined && xpEarned !== null && xpEarned > 0 && (
                        <div className="bg-brand-purple/5 px-8 py-4 rounded-card inline-flex flex-col items-center border border-brand-purple/10 min-w-[140px] animate-bounce-short">
                            <span className="text-[10px] uppercase tracking-widest text-brand-purple font-bold mb-1">XP Guadagnati</span>
                            <span className="text-4xl font-bold text-brand-purple">+{xpEarned}</span>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
