import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { ArrowRight, Sparkles } from 'lucide-react';
import { BADGE_DEFINITIONS } from '@/lib/badgeDefinitions';
import { hapticSuccess, hapticLight } from '@/lib/haptics';
import { useTheme } from '@/context/ThemeContext';
import { StatusBar, Style } from '@capacitor/status-bar';

/**
 * Global component that listens for new badges and displays a celebration modal.
 * "Tier S" Masterpiece Redesign: Incorporates deep cinematic shadows,
 * pure glassmorphism, glowing typography, and dynamic particle/aura effects.
 */
export function BadgeUnlockCelebration() {
    const location = useLocation();
    const { resolvedTheme } = useTheme();
    const [queue, setQueue] = useState<string[]>([]);
    const [activeBadgeId, setActiveBadgeId] = useState<string | null>(null);
    const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

    // 1. Listen for badge unlock events and add to queue
    useEffect(() => {
        const handleBadgeUnlocked = (e: any) => {
            const { badgeId } = e.detail;
            if (badgeId) {
                setQueue(prev => {
                    if (prev.includes(badgeId) || activeBadgeId === badgeId) return prev;
                    return [...prev, badgeId];
                });
            }
        };

        window.addEventListener('badge_unlocked', handleBadgeUnlocked as EventListener);
        return () => window.removeEventListener('badge_unlocked', handleBadgeUnlocked as EventListener);
    }, [activeBadgeId]);

    // Track window size for Confetti
    useEffect(() => {
        const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 2. Process Queue based on route
    useEffect(() => {
        const isQuizActive = location.pathname.startsWith('/quiz/run') || location.pathname.startsWith('/quiz/results');

        if (!activeBadgeId && queue.length > 0 && !isQuizActive) {
            const nextBadge = queue[0];
            setActiveBadgeId(nextBadge);
            setQueue(prev => prev.slice(1));
            // Trigger a slightly longer success haptic sequence for premium feel
            hapticSuccess();
            setTimeout(hapticLight, 200);
            setTimeout(hapticSuccess, 400);
        }
    }, [queue, location.pathname, activeBadgeId]);

    // 3. Status Bar Theme Management
    useEffect(() => {
        const updateStatusBar = async () => {
            const meta = document.querySelector('meta[name="theme-color"]');

            // For the celebration, we force a stunning dark contextual overlay even in light mode,
            // or adapt it with heavy blur. We'll use a deep slate color for the status bar during modal.
            const activeColor = resolvedTheme === 'dark' ? '#020617' : '#0F172A'; // Darker than usual for contrast
            const activeStyle = Style.Dark; // Force dark-style content (white icons) during modal

            if (activeBadgeId) {
                meta?.setAttribute('content', activeColor);
                try {
                    await StatusBar.setBackgroundColor({ color: activeColor });
                    await StatusBar.setStyle({ style: activeStyle });
                } catch (e) { /* ignore web errors */ }
            } else {
                const fallbackColor = resolvedTheme === 'dark' ? '#0F172A' : '#F3F5F7';
                const fallbackStyle = resolvedTheme === 'dark' ? Style.Dark : Style.Light;
                meta?.setAttribute('content', fallbackColor);
                try {
                    await StatusBar.setBackgroundColor({ color: fallbackColor });
                    await StatusBar.setStyle({ style: fallbackStyle });
                } catch (e) { /* ignore */ }
            }
        };

        updateStatusBar();
    }, [activeBadgeId, resolvedTheme]);

    const handleDismiss = () => {
        hapticLight();
        setActiveBadgeId(null);
    };

    const activeBadge = activeBadgeId ? BADGE_DEFINITIONS.find(b => b.id === activeBadgeId) : null;

    return (
        <AnimatePresence>
            {activeBadge && (
                <motion.div
                    key="badge-modal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    // Tier S Backdrop: Deep cinematic radial gradient focusing on the center
                    className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
                >
                    {/* Immersive Background Layers */}
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl"></div>
                    <div className={`absolute inset-0 opacity-40 mix-blend-color bg-gradient-to-b ${activeBadge.color}`}></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_60%)]"></div>

                    <Confetti
                        width={windowSize.width}
                        height={windowSize.height}
                        recycle={false}
                        numberOfPieces={600}
                        gravity={0.12}
                        initialVelocityY={20}
                        colors={['#FFD700', '#FFFFFF', '#00B1FF', '#A855F7', '#FF9F0A']}
                    />

                    <motion.div
                        initial={{ scale: 0.85, opacity: 0, y: 40 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: -20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300, mass: 0.8 }}
                        className="relative w-full max-w-md px-6 flex flex-col items-center"
                    >
                        {/* 🌟 Glowing Aura Behind Badge */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 0.5, scale: [1, 1.2, 1] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className={`absolute top-10 w-64 h-64 bg-gradient-to-br ${activeBadge.color} blur-[80px] rounded-full z-0`}
                        />

                        {/* 🏆 The Badge Avatar */}
                        <div className="relative z-10 mb-12 flex justify-center mt-8">
                            <motion.div
                                initial={{ scale: 0, rotate: -20, y: 20 }}
                                animate={{ scale: 1, rotate: 0, y: 0 }}
                                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                                whileHover={{ scale: 1.05, rotate: 2 }}
                                className="group relative"
                            >
                                {/* Outer Glow Ring */}
                                <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-br from-white/40 to-transparent blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                {/* Badge Body */}
                                <div className={`w-44 h-44 rounded-[2.5rem] bg-gradient-to-br ${activeBadge.color} p-[2px] shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden`}>

                                    {/* Glass Specular Highlight */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-white/80 opacity-60 z-10 mix-blend-overlay pointer-events-none"></div>
                                    <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/20 to-transparent rotate-45 translate-x-[-100%] animate-[shimmer_3s_infinite_ease-in-out] z-20"></div>

                                    {/* Inner Depessed Area */}
                                    <div className="w-full h-full bg-slate-950/30 backdrop-blur-md rounded-[2.4rem] flex items-center justify-center border-t border-l border-white/40 border-b border-r border-black/40 relative overflow-hidden shadow-inner">
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2)_0%,transparent_100%)]"></div>

                                        <motion.div
                                            initial={{ scale: 0.5, opacity: 0 }}
                                            animate={{ scale: 1.8, opacity: 1 }}
                                            transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                                            className="text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] z-30"
                                        >
                                            {activeBadge.icon}
                                        </motion.div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* 📜 Elegant Text Content Structure */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, ease: "easeOut" }}
                            className="w-full flex flex-col items-center text-center z-10 mb-12"
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="w-4 h-4 text-amber-400" />
                                <span className="text-sm font-bold text-amber-400 tracking-[0.2em] uppercase">
                                    Achievement Sbloccato
                                </span>
                                <Sparkles className="w-4 h-4 text-amber-400" />
                            </div>

                            <h3 className="text-5xl lg:text-6xl font-black tracking-tight text-white mb-6 drop-shadow-lg">
                                {activeBadge.name}
                            </h3>

                            <div className="w-12 h-1 bg-white/20 rounded-full mb-6"></div>

                            <p className="text-xl leading-relaxed text-slate-300 font-medium max-w-[280px]">
                                {activeBadge.description}
                            </p>

                            <p className="text-sm border border-white/10 bg-white/5 rounded-full px-4 py-2 mt-6 text-slate-400 font-medium tracking-wide">
                                {activeBadge.requirement}
                            </p>
                        </motion.div>

                        {/* 🚀 Action Button */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6, ease: "easeOut" }}
                            className="w-full z-10"
                        >
                            <button
                                onClick={handleDismiss}
                                className="relative w-full py-4 rounded-2xl font-bold text-lg text-white shadow-2xl transition-all duration-300 active:scale-95 group overflow-hidden"
                            >
                                {/* Base gradient matching the badge style */}
                                <div className={`absolute inset-0 bg-gradient-to-r ${activeBadge.color} opacity-90`}></div>

                                {/* Glass overlay for button */}
                                <div className="absolute inset-0 bg-white/10 border-t border-white/30 rounded-2xl mix-blend-overlay"></div>

                                {/* Button Hover Aura */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/20"></div>

                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    {queue.length > 0 ? "Mostra il prossimo" : "Chiudi e continua"}
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </button>
                        </motion.div>

                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
