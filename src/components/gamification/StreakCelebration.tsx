/**
 * @file StreakCelebration.tsx
 * @description Full-screen streak celebration modal.
 *
 * Adapted to match the application theme (Light/Dark).
 *
 * Features:
 * - Theme-aware background (Light: White/Gray, Dark: Slate-900)
 * - Animated flame icon
 * - Sharing functionality
 * - Safe area compliant via theme consistency
 */

import React, { useEffect, useState } from 'react';
import { X, Share2, ArrowRight, Check } from 'lucide-react';
import Confetti from 'react-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedFlame, getTierFromStreak } from './AnimatedFlame';
import { Share } from '@capacitor/share';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useTheme } from '@/context/ThemeContext';

// We rely on global CSS variables for colors (var(--background), var(--foreground))
// and standard Capacitor StatusBar configuration (which follows system theme).

export function StreakCelebration() {
    const [show, setShow] = useState(false);
    const [streak, setStreak] = useState(0);
    const [isMilestone, setIsMilestone] = useState(false);
    const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
    const [shareState, setShareState] = useState<'idle' | 'success'>('idle');

    const { resolvedTheme, theme } = useTheme();

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        };

        const handleStreakUpdate = (e: any) => {
            const { streak: newStreak, isMilestone: milestone } = e.detail;
            setStreak(newStreak);
            setIsMilestone(milestone);
            setShow(true);
            setShareState('idle');
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('streak_updated', handleStreakUpdate as EventListener);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('streak_updated', handleStreakUpdate as EventListener);
        };
    }, []);

    const handleShare = async (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        const title = 'Idoneo Streak 🔥';
        const text = `Sto bruciando tutto su Idoneo! 🔥 Ho raggiunto uno streak di ${streak} giorni! Riesci a battermi? 🚀`;
        const url = 'https://idoneo.ai';

        try {
            await Share.share({
                title,
                text,
                url,
                dialogTitle: 'Condividi il tuo successo!',
            });
        } catch (error) {
            console.warn("Share API failed or closed, trying clipboard fallback...", error);
            try {
                await navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
                setShareState('success');
                setTimeout(() => setShareState('idle'), 2000);
            } catch (clipboardError) {
                console.error('Failed to copy to clipboard', clipboardError);
                alert('Impossibile condividere automaticamente. Fai uno screenshot!');
            }
        }
    };

    // ─────────────────────────────────────────────────────────────
    // SAFE AREA / STATUS BAR COLOR MANAGEMENT (THEME AWARE)
    // ─────────────────────────────────────────────────────────────
    useEffect(() => {
        const updateStatusBar = async () => {
            const meta = document.querySelector('meta[name="theme-color"]');

            // Define colors based on theme
            // Light: Slate-50 (#F8FAFC), Dark: Slate-900 (#0F172A)
            const activeColor = resolvedTheme === 'dark' ? '#0F172A' : '#F8FAFC';
            const activeStyle = resolvedTheme === 'dark' ? Style.Dark : Style.Light;

            if (show) {
                // ACTIVE: Match the modal background
                meta?.setAttribute('content', activeColor);
                document.body.style.backgroundColor = activeColor;

                try {
                    await StatusBar.setBackgroundColor({ color: activeColor });
                    await StatusBar.setStyle({ style: activeStyle });
                } catch (e) { /* ignore web errors */ }
            } else {
                // INACTIVE: Restore to default app theme
                // Dark: #0F172A, Light: #F3F5F7 (App Canvas)
                const fallbackColor = resolvedTheme === 'dark' ? '#0F172A' : '#F3F5F7';

                meta?.setAttribute('content', fallbackColor);
                document.body.style.backgroundColor = ''; // Clear inline to revert to CSS

                try {
                    await StatusBar.setBackgroundColor({ color: fallbackColor });
                    await StatusBar.setStyle({ style: activeStyle });
                } catch (e) { /* ignore */ }
            }
        };

        updateStatusBar();

        return () => {
            document.body.style.backgroundColor = '';
        };
    }, [show, resolvedTheme]);

    // Determine flame tier based on streak count
    const flameTier = getTierFromStreak(streak);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    // THEME-AWARE BACKGROUND:
                    // Uses explicit slate colors for reliability with opacity
                    className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xl"
                >
                    <Confetti
                        width={windowSize.width}
                        height={windowSize.height}
                        recycle={false}
                        numberOfPieces={isMilestone ? 800 : 400}
                        gravity={0.15}
                        colors={['#FF9F0A', '#00B1FF', '#0095FF', '#E2E8F0']}
                    />

                    {/* Main Content Card */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 50 }}
                        transition={{
                            type: "spring",
                            damping: 20,
                            stiffness: 300,
                            mass: 0.8
                        }}
                        className="relative w-full max-w-sm px-6 text-center"
                    >
                        {/* Close Button - Adaptive Color */}
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            onClick={() => setShow(false)}
                            className="absolute -top-16 right-4 p-3 rounded-full transition-colors backdrop-blur-md
                                     bg-slate-200/50 hover:bg-slate-300/50 text-slate-700
                                     dark:bg-white/10 dark:hover:bg-white/20 dark:text-white"
                        >
                            <X className="w-6 h-6" />
                        </motion.button>

                        {/* DEBUG: THEME STATE */}
                        <div className="absolute -top-24 left-0 w-full text-center text-xs text-red-500 font-mono bg-black/80 p-1 rounded pointer-events-none">
                            Theme: {theme} | Resolved: {resolvedTheme}
                        </div>

                        {/* Flame Animation Container */}
                        <div className="relative mb-10 flex justify-center">
                            <motion.div
                                initial={{ scale: 0, rotate: -30 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 200,
                                    damping: 15,
                                    delay: 0.15
                                }}
                            >
                                <AnimatedFlame size={180} tier={flameTier} />
                            </motion.div>
                        </div>

                        {/* Text Content - Adaptive Color */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, ease: "easeOut" }}
                        >
                            <h2 className="text-xl font-bold text-brand-orange uppercase tracking-widest mb-2">
                                {isMilestone ? "Traguardo Raggiunto!" : "Streak Aggiornata!"}
                            </h2>
                            <div className="flex items-center justify-center gap-3 mb-6">
                                {/* Adaptive Text Color */}
                                <span className="text-8xl font-black tracking-tighter drop-shadow-lg font-sans text-slate-900 dark:text-white">
                                    {streak}
                                </span>
                                <div className="flex flex-col items-start space-y-1">
                                    <span className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">GIORNI</span>
                                    <span className="text-lg font-medium tracking-wide text-slate-500 dark:text-slate-400">CONSECUTIVI</span>
                                </div>
                            </div>

                            <p className="text-lg mb-10 max-w-xs mx-auto leading-relaxed font-medium text-slate-600 dark:text-slate-300">
                                {isMilestone
                                    ? "Stai costruendo un'abitudine di ferro! Continua su questa strada."
                                    : "Non fermarti ora! La costanza è il segreto per superare il concorso."}
                            </p>
                        </motion.div>

                        {/* Buttons with Branding */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, ease: "easeOut" }}
                            className="flex flex-col gap-4 w-full"
                        >
                            {/* Primary Action - Brand Blue */}
                            <button
                                onClick={() => setShow(false)}
                                className="w-full py-4 bg-[#00B1FF] hover:bg-[#0099e6] active:scale-[0.98] text-white text-lg font-bold rounded-full shadow-lg shadow-[#00B1FF]/25 transition-all flex items-center justify-center gap-2 group duration-200"
                            >
                                Continua
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>

                            {/* Secondary Action - Share (Adaptive) */}
                            <button
                                onClick={(e) => handleShare(e)}
                                className={`w-full py-4 font-bold rounded-full transition-all flex items-center justify-center gap-2 border backdrop-blur-sm duration-200 active:scale-[0.98]
                                    ${shareState === 'success'
                                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/50 dark:bg-emerald-500/20 dark:text-emerald-400'
                                        : 'bg-slate-100/50 text-slate-700 border-slate-200 hover:bg-slate-200/50 dark:bg-white/10 dark:text-white dark:border-white/10 dark:hover:bg-white/15'
                                    }`}
                            >
                                {shareState === 'success' ? (
                                    <>
                                        <Check className="w-5 h-5" />
                                        Copiato!
                                    </>
                                ) : (
                                    <>
                                        <Share2 className="w-5 h-5" />
                                        Condividi
                                    </>
                                )}
                            </button>
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
