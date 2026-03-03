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
import { Share2, ArrowRight, Check } from 'lucide-react';
import Confetti from 'react-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { getTierFromStreak, TIER_THRESHOLDS, type FlameTier } from './AnimatedFlame';

const FLAME_ICONS: Record<FlameTier, string> = {
    bronze: '/icons/flame-bronze.png',
    silver: '/icons/flame-silver.png',
    gold: '/icons/flame-gold.png',
    emerald: '/icons/flame-emerald.png',
    sapphire: '/icons/flame-sapphire.png',
    diamond: '/icons/flame-diamond.png',
};

const TIER_AURA: Record<FlameTier, { ring: string; glow: string; halo: string; particles: string[] }> = {
    bronze: {
        ring: 'rgba(205,127,50,0.25)',
        glow: 'radial-gradient(circle, rgba(255,165,80,0.4) 0%, rgba(205,127,50,0.15) 50%, transparent 70%)',
        halo: 'rgba(255,165,80,0.3)',
        particles: ['#CD7F32', '#FF9F43', '#E67E22'],
    },
    silver: {
        ring: 'rgba(192,192,192,0.3)',
        glow: 'radial-gradient(circle, rgba(220,220,230,0.4) 0%, rgba(192,192,192,0.15) 50%, transparent 70%)',
        halo: 'rgba(200,210,220,0.3)',
        particles: ['#C0C0C0', '#E8E8E8', '#A8B2BC'],
    },
    gold: {
        ring: 'rgba(255,215,0,0.3)',
        glow: 'radial-gradient(circle, rgba(255,223,50,0.45) 0%, rgba(255,185,0,0.15) 50%, transparent 70%)',
        halo: 'rgba(255,215,0,0.35)',
        particles: ['#FFD700', '#FFA500', '#FFE066'],
    },
    emerald: {
        ring: 'rgba(80,200,120,0.3)',
        glow: 'radial-gradient(circle, rgba(80,220,120,0.4) 0%, rgba(16,185,129,0.15) 50%, transparent 70%)',
        halo: 'rgba(52,211,153,0.3)',
        particles: ['#50C878', '#10B981', '#34D399'],
    },
    sapphire: {
        ring: 'rgba(30,144,255,0.3)',
        glow: 'radial-gradient(circle, rgba(60,160,255,0.45) 0%, rgba(30,100,220,0.15) 50%, transparent 70%)',
        halo: 'rgba(59,130,246,0.35)',
        particles: ['#1E90FF', '#00BFFF', '#3B82F6'],
    },
    diamond: {
        ring: 'rgba(255,255,255,0.25)',
        glow: 'radial-gradient(circle, rgba(255,200,255,0.4) 0%, rgba(139,92,246,0.2) 40%, rgba(80,200,255,0.1) 60%, transparent 75%)',
        halo: 'rgba(200,180,255,0.35)',
        particles: ['#E879F9', '#A78BFA', '#67E8F9', '#FFFFFF'],
    },
};
import { Share } from '@capacitor/share';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useTheme } from '@/context/ThemeContext';
import { hapticSuccess, hapticLight, hapticHeavy } from '@/lib/haptics';

// We rely on global CSS variables for colors (var(--background), var(--foreground))
// and standard Capacitor StatusBar configuration (which follows system theme).

export function StreakCelebration() {
    const [show, setShow] = useState(false);
    const [streak, setStreak] = useState(0);
    const [isMilestone, setIsMilestone] = useState(false);
    const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
    const [shareState, setShareState] = useState<'idle' | 'success'>('idle');
    const [isTierUnlock, setIsTierUnlock] = useState(false);

    const { resolvedTheme, theme } = useTheme();

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        };

        const handleStreakUpdate = (e: any) => {
            const { streak: newStreak, isMilestone: milestone } = e.detail;
            const tierUnlock = TIER_THRESHOLDS.includes(newStreak);

            setStreak(newStreak);
            setIsMilestone(milestone);
            setIsTierUnlock(tierUnlock);
            setShow(true);
            setShareState('idle');

            if (tierUnlock) {
                hapticHeavy();
            } else {
                hapticSuccess();
            }
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
    const aura = TIER_AURA[flameTier];

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
                    className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-50/95 dark:bg-black/95 backdrop-blur-xl"
                >
                    <Confetti
                        width={windowSize.width}
                        height={windowSize.height}
                        recycle={false}
                        numberOfPieces={isMilestone ? 300 : 150}
                        gravity={0.35}
                        initialVelocityY={20}
                        tweenDuration={3000}
                        colors={aura.particles}
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


                        {/* Flame Animation Container with Tier S Aura */}
                        <div className="relative mb-10 flex justify-center items-center" style={{ height: 280 }}>

                            {/* === SHARED BASE: Radial Glow === */}
                            <motion.div
                                initial={{ scale: 0.3, opacity: 0 }}
                                animate={{ scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
                                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                                style={{
                                    position: 'absolute',
                                    width: 280,
                                    height: 280,
                                    borderRadius: '50%',
                                    background: aura.glow,
                                }}
                            />

                            {/* === TIER-SPECIFIC V2 SIGNATURE EFFECTS === */}

                            {/* BRONZE V2: Concentric heat shimmer ripples */}
                            {flameTier === 'bronze' && Array.from({ length: 3 }).map((_, i) => (
                                <motion.div
                                    key={`heat-${i}`}
                                    initial={{ scale: 0.4, opacity: 0 }}
                                    animate={{
                                        scale: [0.5 + i * 0.1, 1.2 + i * 0.1],
                                        opacity: [0.5, 0],
                                    }}
                                    transition={{
                                        duration: 2.5,
                                        repeat: Infinity,
                                        delay: i * 0.8,
                                        ease: 'easeOut',
                                    }}
                                    style={{
                                        position: 'absolute',
                                        width: 200,
                                        height: 200,
                                        borderRadius: '50%',
                                        border: '2px solid rgba(205,127,50,0.35)',
                                        boxShadow: '0 0 8px rgba(255,165,80,0.15)',
                                    }}
                                />
                            ))}
                            {/* Bronze: Slow rotating warm corona */}
                            {flameTier === 'bronze' && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 0.35, rotate: 360 }}
                                    transition={{
                                        scale: { type: 'spring', stiffness: 60, delay: 0.2 },
                                        rotate: { duration: 25, repeat: Infinity, ease: 'linear' },
                                    }}
                                    style={{
                                        position: 'absolute', width: 250, height: 250, borderRadius: '50%',
                                        background: 'conic-gradient(from 0deg, rgba(205,127,50,0.25), transparent 30%, rgba(255,165,80,0.2), transparent 65%, rgba(205,127,50,0.25))',
                                    }}
                                />
                            )}

                            {/* SILVER V2: Mercury liquid orbs floating */}
                            {flameTier === 'silver' && Array.from({ length: 5 }).map((_, i) => {
                                const baseAngle = (i * 72) * Math.PI / 180;
                                const r = 95 + (i % 2) * 20;
                                return (
                                    <motion.div
                                        key={`mercury-${i}`}
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{
                                            opacity: [0, 0.6, 0.3, 0.6],
                                            scale: [0.6, 1.2, 0.8, 1.2],
                                            x: [Math.cos(baseAngle) * r * 0.6, Math.cos(baseAngle) * r, Math.cos(baseAngle + 0.3) * r * 1.1, Math.cos(baseAngle) * r * 0.6],
                                            y: [Math.sin(baseAngle) * r * 0.6, Math.sin(baseAngle) * r, Math.sin(baseAngle + 0.3) * r * 1.1, Math.sin(baseAngle) * r * 0.6],
                                        }}
                                        transition={{
                                            duration: 5,
                                            repeat: Infinity,
                                            delay: i * 0.4,
                                            ease: 'easeInOut',
                                        }}
                                        style={{
                                            position: 'absolute',
                                            width: 10 + (i % 3) * 4,
                                            height: 10 + (i % 3) * 4,
                                            borderRadius: '50%',
                                            background: 'radial-gradient(circle at 35% 35%, rgba(230,235,240,0.9), rgba(160,170,180,0.5))',
                                            boxShadow: '0 0 8px rgba(200,210,220,0.4)',
                                        }}
                                    />
                                );
                            })}
                            {/* Silver: Soft breathing haze */}
                            {flameTier === 'silver' && (
                                <motion.div
                                    animate={{ scale: [1, 1.08, 1], opacity: [0.15, 0.3, 0.15] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                    style={{
                                        position: 'absolute', width: 220, height: 220, borderRadius: '50%',
                                        background: 'radial-gradient(circle, rgba(200,210,225,0.25) 0%, transparent 70%)',
                                        filter: 'blur(8px)',
                                    }}
                                />
                            )}

                            {/* GOLD V2: Twinkling constellation stars */}
                            {flameTier === 'gold' && Array.from({ length: 10 }).map((_, i) => {
                                const a = (i * 36 + 15) * Math.PI / 180;
                                const r = 85 + (i % 3) * 25;
                                return (
                                    <motion.div
                                        key={`star-${i}`}
                                        animate={{
                                            opacity: [0.1, 0.9, 0.1],
                                            scale: [0.5, 1.3, 0.5],
                                        }}
                                        transition={{
                                            duration: 1.5 + (i % 3) * 0.5,
                                            repeat: Infinity,
                                            delay: i * 0.25,
                                            ease: 'easeInOut',
                                        }}
                                        style={{
                                            position: 'absolute',
                                            width: 3 + (i % 3),
                                            height: 3 + (i % 3),
                                            borderRadius: '50%',
                                            backgroundColor: '#FFD700',
                                            boxShadow: '0 0 6px #FFD700, 0 0 12px rgba(255,215,0,0.3)',
                                            left: `calc(50% + ${Math.cos(a) * r}px)`,
                                            top: `calc(50% + ${Math.sin(a) * r}px)`,
                                        }}
                                    />
                                );
                            })}
                            {/* Gold: Slow royal crown ring */}
                            {flameTier === 'gold' && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: [0.15, 0.35, 0.15], rotate: -360 }}
                                    transition={{
                                        scale: { type: 'spring', stiffness: 60, delay: 0.1 },
                                        opacity: { duration: 4, repeat: Infinity },
                                        rotate: { duration: 40, repeat: Infinity, ease: 'linear' },
                                    }}
                                    style={{
                                        position: 'absolute', width: 250, height: 250, borderRadius: '50%',
                                        border: '1.5px dashed rgba(255,215,0,0.2)',
                                    }}
                                />
                            )}

                            {/* EMERALD V2: Cascading bio-pulse rings */}
                            {flameTier === 'emerald' && Array.from({ length: 4 }).map((_, i) => (
                                <motion.div
                                    key={`bio-${i}`}
                                    initial={{ scale: 0.3, opacity: 0 }}
                                    animate={{
                                        scale: [0.4, 1.3],
                                        opacity: [0.6, 0],
                                        borderRadius: ['50%', '50%'],
                                    }}
                                    transition={{
                                        duration: 3,
                                        repeat: Infinity,
                                        delay: i * 0.7,
                                        ease: 'easeOut',
                                    }}
                                    style={{
                                        position: 'absolute',
                                        width: 180,
                                        height: 180,
                                        borderRadius: '50%',
                                        border: '2px solid rgba(52,211,153,0.4)',
                                        boxShadow: '0 0 12px rgba(16,185,129,0.15)',
                                    }}
                                />
                            ))}
                            {/* Emerald: Organic breathing nucleus */}
                            {flameTier === 'emerald' && (
                                <motion.div
                                    animate={{ scale: [0.95, 1.1, 0.95], opacity: [0.2, 0.4, 0.2] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                    style={{
                                        position: 'absolute', width: 160, height: 160, borderRadius: '50%',
                                        background: 'radial-gradient(circle, rgba(52,211,153,0.2) 0%, transparent 70%)',
                                        filter: 'blur(4px)',
                                    }}
                                />
                            )}

                            {/* SAPPHIRE V2: Deep ocean expanding wave ripples */}
                            {flameTier === 'sapphire' && Array.from({ length: 3 }).map((_, i) => (
                                <motion.div
                                    key={`wave-${i}`}
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{
                                        scale: [0.5, 1.4],
                                        opacity: [0.5, 0],
                                    }}
                                    transition={{
                                        duration: 3.5,
                                        repeat: Infinity,
                                        delay: i * 1.1,
                                        ease: [0.25, 0.46, 0.45, 0.94],
                                    }}
                                    style={{
                                        position: 'absolute',
                                        width: 200,
                                        height: 200,
                                        borderRadius: '50%',
                                        border: '1.5px solid rgba(59,130,246,0.4)',
                                        boxShadow: '0 0 10px rgba(59,130,246,0.1), inset 0 0 10px rgba(59,130,246,0.05)',
                                    }}
                                />
                            ))}
                            {/* Sapphire: Orbiting blue nebula dots */}
                            {flameTier === 'sapphire' && Array.from({ length: 5 }).map((_, i) => (
                                <motion.div
                                    key={`neb-${i}`}
                                    animate={{
                                        rotate: 360,
                                    }}
                                    transition={{
                                        duration: 6 + i * 2,
                                        repeat: Infinity,
                                        ease: 'linear',
                                    }}
                                    style={{
                                        position: 'absolute',
                                        width: 230,
                                        height: 230,
                                    }}
                                >
                                    <div style={{
                                        position: 'absolute',
                                        width: 4 + (i % 2) * 2,
                                        height: 4 + (i % 2) * 2,
                                        borderRadius: '50%',
                                        backgroundColor: ['#60A5FA', '#38BDF8', '#3B82F6', '#818CF8', '#22D3EE'][i],
                                        boxShadow: `0 0 8px ${['#60A5FA', '#38BDF8', '#3B82F6', '#818CF8', '#22D3EE'][i]}`,
                                        top: 0,
                                        left: '50%',
                                    }} />
                                </motion.div>
                            ))}

                            {/* DIAMOND V2: Holographic glitch bands + chromatic shift */}
                            {flameTier === 'diamond' && Array.from({ length: 5 }).map((_, i) => (
                                <motion.div
                                    key={`holo-${i}`}
                                    animate={{
                                        opacity: [0, 0.5, 0],
                                        y: [-60 + i * 25, -55 + i * 25, -60 + i * 25],
                                        scaleX: [0.8, 1.1, 0.8],
                                    }}
                                    transition={{
                                        duration: 2 + i * 0.3,
                                        repeat: Infinity,
                                        delay: i * 0.4,
                                        ease: 'easeInOut',
                                    }}
                                    style={{
                                        position: 'absolute',
                                        width: 180 - i * 10,
                                        height: 2,
                                        background: `linear-gradient(90deg, transparent, ${['rgba(232,121,249,0.6)', 'rgba(167,139,250,0.6)', 'rgba(103,232,249,0.6)', 'rgba(255,255,255,0.4)', 'rgba(251,191,36,0.5)'][i]}, transparent)`,
                                        borderRadius: 2,
                                    }}
                                />
                            ))}
                            {/* Diamond: Rotating prismatic halo */}
                            {flameTier === 'diamond' && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 0.5, rotate: 360 }}
                                    transition={{
                                        scale: { type: 'spring', stiffness: 50, delay: 0.1 },
                                        rotate: { duration: 10, repeat: Infinity, ease: 'linear' },
                                    }}
                                    style={{
                                        position: 'absolute', width: 240, height: 240, borderRadius: '50%',
                                        background: 'conic-gradient(from 0deg, rgba(232,121,249,0.3), rgba(103,232,249,0.3), rgba(167,139,250,0.3), rgba(251,191,36,0.2), rgba(232,121,249,0.3))',
                                        WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 2.5px), black calc(100% - 2.5px))',
                                        mask: 'radial-gradient(farthest-side, transparent calc(100% - 2.5px), black calc(100% - 2.5px))',
                                    }}
                                />
                            )}
                            {/* Diamond: Shimmer sparkles */}
                            {flameTier === 'diamond' && Array.from({ length: 6 }).map((_, i) => {
                                const a = (i * 60 + 30) * Math.PI / 180;
                                const r = 100 + (i % 2) * 15;
                                return (
                                    <motion.div
                                        key={`sparkle-${i}`}
                                        animate={{
                                            opacity: [0, 1, 0],
                                            scale: [0, 1.5, 0],
                                        }}
                                        transition={{
                                            duration: 1.8,
                                            repeat: Infinity,
                                            delay: i * 0.5,
                                            ease: 'easeInOut',
                                        }}
                                        style={{
                                            position: 'absolute',
                                            width: 4,
                                            height: 4,
                                            borderRadius: '50%',
                                            backgroundColor: ['#FFF', '#E879F9', '#67E8F9', '#A78BFA', '#FDE68A', '#F0ABFC'][i],
                                            boxShadow: `0 0 8px ${['#FFF', '#E879F9', '#67E8F9', '#A78BFA', '#FDE68A', '#F0ABFC'][i]}`,
                                            left: `calc(50% + ${Math.cos(a) * r}px)`,
                                            top: `calc(50% + ${Math.sin(a) * r}px)`,
                                        }}
                                    />
                                );
                            })}

                            {/* === SHARED: Pulsating Halo === */}
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: [1, 1.35, 1], opacity: [0.25, 0, 0.25] }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
                                style={{
                                    position: 'absolute', width: 200, height: 200, borderRadius: '50%',
                                    border: `3px solid ${aura.halo}`,
                                }}
                            />

                            {/* === The Flame === */}
                            <motion.div
                                initial={{ scale: 0, rotate: -30 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.15 }}
                                style={{ position: 'relative', zIndex: 2 }}
                            >
                                <motion.img
                                    src={FLAME_ICONS[flameTier]}
                                    alt={`${flameTier} flame`}
                                    style={{
                                        width: 180,
                                        height: 180,
                                        objectFit: 'contain',
                                        filter: `drop-shadow(0 0 25px ${aura.halo})`,
                                    }}
                                    animate={{ y: [0, -6, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                />
                            </motion.div>
                        </div>

                        {/* Text Content - Adaptive Color */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, ease: "easeOut" }}
                        >
                            <h2 className="text-xl font-bold text-brand-orange uppercase tracking-widest mb-2">
                                {isTierUnlock ? "Nuovo Grado Sbloccato!" : (isMilestone ? "Traguardo Raggiunto!" : "Streak Aggiornata!")}
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
                                onClick={() => {
                                    hapticLight();
                                    setShow(false);
                                }}
                                className="w-full py-4 bg-[#00B1FF] hover:bg-[#0099e6] active:scale-[0.98] text-white text-lg font-bold rounded-full shadow-lg shadow-[#00B1FF]/25 transition-all flex items-center justify-center gap-2 group duration-200"
                            >
                                Continua
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>

                            {/* Secondary Action - Share (Adaptive) */}
                            <button
                                onClick={(e) => {
                                    hapticLight();
                                    handleShare(e);
                                }}
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
