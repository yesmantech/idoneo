"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ChevronRight, X } from 'lucide-react';
import { hapticLight, hapticSuccess } from '@/lib/haptics';

// ============================================
// ONBOARDING WELCOME SCREEN - TIER S
// Beautiful intro screen for first-time users
// ============================================

interface OnboardingWelcomeProps {
    onStartTour: () => void;
    onSkip: () => void;
}

export default function OnboardingWelcome({ onStartTour, onSkip }: OnboardingWelcomeProps) {

    const handleStart = () => {
        hapticSuccess();
        onStartTour();
    };

    const handleSkip = () => {
        hapticLight();
        onSkip();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
        >
            {/* Backdrop */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            />

            {/* Floating particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 rounded-full bg-[#00B1FF]/30"
                        initial={{
                            x: Math.random() * window.innerWidth,
                            y: Math.random() * window.innerHeight,
                            scale: Math.random() * 0.5 + 0.5,
                        }}
                        animate={{
                            y: [null, Math.random() * -200 - 100],
                            opacity: [0.3, 0.8, 0],
                        }}
                        transition={{
                            duration: Math.random() * 3 + 3,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                        }}
                    />
                ))}
            </div>

            {/* Content Card */}
            <motion.div
                initial={{ scale: 0.9, y: 30, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 0.1 }}
                className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden"
            >
                {/* Skip button */}
                <button
                    onClick={handleSkip}
                    className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Hero Section */}
                <div className="relative bg-gradient-to-br from-[#00B1FF] via-[#00D4AA] to-[#00B1FF] p-8 pt-12 pb-16">
                    {/* Decorative circles */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

                    {/* Mascot/Icon */}
                    <motion.div
                        initial={{ scale: 0, rotate: -30 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', damping: 15, delay: 0.2 }}
                        className="relative mx-auto w-24 h-24 bg-white rounded-[28px] shadow-xl flex items-center justify-center"
                    >
                        <span className="text-5xl">📚</span>

                        {/* Sparkle badge */}
                        <motion.div
                            className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center shadow-lg"
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <Sparkles className="w-4 h-4 text-white" />
                        </motion.div>
                    </motion.div>

                    {/* Welcome text */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-center mt-6"
                    >
                        <h1 className="text-2xl font-black text-white mb-2">
                            Ciao! 👋
                        </h1>
                        <p className="text-white/80 font-medium">
                            Benvenuto su Idoneo
                        </p>
                    </motion.div>
                </div>

                {/* Bottom wave decoration */}
                <svg className="absolute left-0 right-0" style={{ bottom: 'calc(100% - 200px)' }} viewBox="0 0 400 30" fill="none" preserveAspectRatio="none">
                    <path d="M0 30V15C50 0 100 25 150 20C200 15 250 0 300 10C350 20 375 5 400 15V30H0Z" className="fill-white dark:fill-slate-900" />
                </svg>

                {/* Content */}
                <div className="p-6 pt-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <p className="text-center text-slate-600 dark:text-slate-400 text-[15px] leading-relaxed mb-6">
                            Ti guiderò alla scoperta delle funzionalità principali dell'app in <b className="text-slate-900 dark:text-white">meno di 1 minuto</b>.
                        </p>

                        {/* Features preview */}
                        <div className="space-y-3 mb-8">
                            {[
                                { emoji: '🔍', text: 'Cerca e scopri i concorsi' },
                                { emoji: '📝', text: 'Simula le prove ufficiali' },
                                { emoji: '📊', text: 'Monitora i tuoi progressi' },
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + i * 0.1 }}
                                    className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl"
                                >
                                    <span className="text-xl">{item.emoji}</span>
                                    <span className="text-[14px] font-medium text-slate-700 dark:text-slate-300">
                                        {item.text}
                                    </span>
                                </motion.div>
                            ))}
                        </div>

                        {/* CTA Button */}
                        <motion.button
                            onClick={handleStart}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-4 px-6 bg-gradient-to-r from-[#00B1FF] to-[#00D4AA] rounded-2xl text-white font-bold text-[16px] shadow-lg shadow-[#00B1FF]/25 flex items-center justify-center gap-2"
                        >
                            <span>Inizia il Tour</span>
                            <ChevronRight className="w-5 h-5" />
                        </motion.button>

                        {/* Skip link */}
                        <button
                            onClick={handleSkip}
                            className="w-full mt-3 py-2 text-[13px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        >
                            Salta, conosco già l'app
                        </button>
                    </motion.div>
                </div>
            </motion.div>
        </motion.div>
    );
}
