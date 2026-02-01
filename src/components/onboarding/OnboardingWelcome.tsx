/**
 * @file OnboardingWelcome.tsx
 * @description First-time user welcome modal with animated logo.
 *
 * This modal is shown to new users on their first visit to the homepage.
 * It introduces the app's main features and offers to start a guided tour.
 *
 * ## Features Displayed
 *
 * - Search contests
 * - Run simulations
 * - Track progress
 * - Climb leaderboards
 *
 * ## Visual Elements
 *
 * | Element        | Description                           |
 * |----------------|---------------------------------------|
 * | AnimatedLogo   | Pulsing checkmark with sparkles       |
 * | Feature grid   | 2x2 icons with descriptions           |
 * | CTA button     | Gradient "Start Tour" button          |
 * | Skip link      | "I already know the app" dismiss      |
 *
 * ## Props
 *
 * | Prop         | Type       | Description                    |
 * |--------------|------------|--------------------------------|
 * | `onStartTour`| () => void | Called when user starts tour   |
 * | `onSkip`     | () => void | Called when user dismisses     |
 *
 * @example
 * ```tsx
 * import OnboardingWelcome from '@/components/onboarding/OnboardingWelcome';
 *
 * <OnboardingWelcome
 *   onStartTour={() => startOnboarding('homepage')}
 *   onSkip={() => dismissWelcome()}
 * />
 * ```
 */

"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, X, Search, FileText, TrendingUp, Trophy, Sparkles } from 'lucide-react';
import { hapticLight, hapticSuccess } from '@/lib/haptics';
import { useAuth } from '@/context/AuthContext';

// ============================================================================
// ANIMATED LOGO COMPONENT
// ============================================================================

interface OnboardingWelcomeProps {
    onStartTour: () => void;
    onSkip: () => void;
}

// ============================================
// TIER S ANIMATED CHECKMARK - FLAME STYLE
// Uses same visual language as AnimatedFlame
// ============================================

function AnimatedLogo() {
    const size = 100;
    const glowColor = 'rgba(0, 177, 255, 0.5)';
    const sparkleColors = ['bg-cyan-300', 'bg-emerald-300', 'bg-sky-300', 'bg-teal-300'];

    return (
        <div className="relative" style={{ width: size, height: size }}>
            {/* Outer Glow - same as flame */}
            <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                    background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
                    filter: 'blur(25px)',
                }}
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />

            {/* Main Checkmark SVG - flame style */}
            <motion.svg
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="relative z-10 w-full h-full drop-shadow-xl"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
                <defs>
                    {/* Outer gradient - like flame outer */}
                    <linearGradient id="checkOuter" x1="50%" y1="0%" x2="50%" y2="100%">
                        <stop offset="0%" stopColor="#00D4AA" />
                        <stop offset="50%" stopColor="#00B1FF" />
                        <stop offset="100%" stopColor="#0090CC" />
                    </linearGradient>

                    {/* Inner gradient - like flame inner */}
                    <linearGradient id="checkInner" x1="50%" y1="0%" x2="50%" y2="100%">
                        <stop offset="0%" stopColor="#00E5C0" />
                        <stop offset="100%" stopColor="#00B1FF" />
                    </linearGradient>

                    {/* Highlight gradient */}
                    <linearGradient id="checkHighlight" x1="50%" y1="0%" x2="50%" y2="100%">
                        <stop offset="0%" stopColor="#FFFFFF" />
                        <stop offset="100%" stopColor="#B0F0FF" />
                    </linearGradient>

                    {/* Stroke gradient */}
                    <linearGradient id="checkStroke" x1="50%" y1="0%" x2="50%" y2="100%">
                        <stop offset="0%" stopColor="#FFFFFF" />
                        <stop offset="100%" stopColor="#00D4AA" />
                    </linearGradient>
                </defs>

                {/* Outer circle - main body */}
                <motion.circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="url(#checkOuter)"
                    stroke="url(#checkStroke)"
                    strokeWidth="3"
                    animate={{
                        r: [40, 41, 40],
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* Inner circle - core */}
                <motion.circle
                    cx="50"
                    cy="50"
                    r="32"
                    fill="url(#checkInner)"
                    animate={{ opacity: [0.9, 1, 0.9], scale: [1, 1.02, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* Checkmark path */}
                <motion.path
                    d="M30 50 L45 65 L70 35"
                    fill="none"
                    stroke="white"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
                />

                {/* Highlight arc - like flame highlight */}
                <motion.path
                    d="M25 35 Q20 50 28 60"
                    fill="url(#checkHighlight)"
                    opacity="0.5"
                    animate={{ opacity: [0.4, 0.7, 0.4], y: [0, -2, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                />

                {/* Shine - like flame shine */}
                <motion.ellipse
                    cx="35"
                    cy="32"
                    rx="8"
                    ry="6"
                    fill="white"
                    opacity="0.4"
                    animate={{ opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
            </motion.svg>

            {/* Sparkles - same as flame */}
            {[...Array(5)].map((_, i) => (
                <motion.div
                    key={i}
                    className={`absolute w-2 h-2 ${sparkleColors[i % sparkleColors.length]} rounded-full`}
                    style={{
                        top: `${8 + (i * 12) % 50}%`,
                        left: i % 2 === 0 ? `${3 + i * 5}%` : `${80 + i * 3}%`,
                    }}
                    animate={{
                        opacity: [0, 1, 0],
                        scale: [0.4, 1.1, 0.4],
                        y: [0, -12, 0],
                    }}
                    transition={{
                        duration: 1 + i * 0.15,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: i * 0.25,
                    }}
                />
            ))}
        </div>
    );
}


export default function OnboardingWelcome({ onStartTour, onSkip }: OnboardingWelcomeProps) {
    const { profile } = useAuth();

    const handleStart = () => {
        hapticSuccess();
        onStartTour();
    };

    const handleSkip = () => {
        hapticLight();
        onSkip();
    };

    const features = [
        { icon: Search, text: 'Cerca i concorsi' },
        { icon: FileText, text: 'Simula le prove' },
        { icon: TrendingUp, text: 'Monitora i progressi' },
        { icon: Trophy, text: 'Scala le classifiche' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        >
            {/* Backdrop */}
            <motion.div
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={handleSkip}
            />

            {/* Content Card */}
            <motion.div
                initial={{ scale: 0.9, y: 40, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300, delay: 0.1 }}
                className="relative w-full max-w-[340px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden"
            >
                {/* Skip button */}
                <button
                    onClick={handleSkip}
                    className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Header Section */}
                <div className="relative pt-8 pb-6 px-6 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800">
                    {/* Subtle gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#00B1FF]/5 to-[#00D4AA]/5" />

                    <div className="relative flex flex-col items-center">
                        <AnimatedLogo />

                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-center mt-5"
                        >
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                                Ciao{profile?.nickname ? `, ${profile.nickname}` : ''}! 👋
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                                Benvenuto su <span className="font-bold text-[#00B1FF]">Idoneo</span>
                            </p>
                        </motion.div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-5">
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-center text-slate-500 dark:text-slate-400 text-[13px] mb-5"
                    >
                        Scopri le funzionalità in <b className="text-slate-700 dark:text-slate-300">meno di 1 minuto</b>
                    </motion.p>

                    {/* Features grid */}
                    <div className="grid grid-cols-2 gap-2 mb-5">
                        {features.map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.55 + i * 0.08 }}
                                className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
                            >
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00B1FF]/20 to-[#00D4AA]/20 flex items-center justify-center flex-shrink-0">
                                    <item.icon className="w-3.5 h-3.5 text-[#00B1FF]" />
                                </div>
                                <span className="text-[12px] font-medium text-slate-600 dark:text-slate-300 leading-tight">
                                    {item.text}
                                </span>
                            </motion.div>
                        ))}
                    </div>

                    {/* CTA Button */}
                    <motion.button
                        onClick={handleStart}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-3.5 px-5 bg-gradient-to-r from-[#00B1FF] to-[#00D4AA] rounded-xl text-white font-bold text-[15px] shadow-lg shadow-[#00B1FF]/25 flex items-center justify-center gap-2"
                    >
                        <span>Inizia il Tour</span>
                        <ChevronRight className="w-4 h-4" />
                    </motion.button>

                    {/* Skip link */}
                    <button
                        onClick={handleSkip}
                        className="w-full mt-2 py-2 text-[12px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                        Salta, conosco già l'app
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
