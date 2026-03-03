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

                            {/* === TIER-SPECIFIC SIGNATURE EFFECTS === */}

                            {/* BRONZE: Rising ember sparks */}
                            {flameTier === 'bronze' && Array.from({ length: 8 }).map((_, i) => (
                                <motion.div
                                    key={`ember-${i}`}
                                    initial={{ opacity: 0, y: 20, scale: 0 }}
                                    animate={{
                                        opacity: [0, 1, 0.8, 0],
                                        y: [20, -80 - Math.random() * 60],
                                        x: [(Math.random() - 0.5) * 40, (Math.random() - 0.5) * 80],
                                        scale: [0, 1.2, 0.6, 0],
                                    }}
                                    transition={{
                                        duration: 2 + Math.random(),
                                        repeat: Infinity,
                                        delay: i * 0.3,
                                        ease: 'easeOut',
                                    }}
                                    style={{
                                        position: 'absolute',
                                        width: 4 + Math.random() * 4,
                                        height: 4 + Math.random() * 4,
                                        borderRadius: '50%',
                                        backgroundColor: ['#CD7F32', '#FF9F43', '#E67E22', '#FFB347'][i % 4],
                                        boxShadow: `0 0 6px ${['#CD7F32', '#FF9F43', '#E67E22', '#FFB347'][i % 4]}`,
                                        bottom: '30%',
                                    }}
                                />
                            ))}

                            {/* SILVER: Frost crystal shards orbiting */}
                            {flameTier === 'silver' && Array.from({ length: 6 }).map((_, i) => {
                                const angle = (i * 60) * Math.PI / 180;
                                const radius = 110;
                                return (
                                    <motion.div
                                        key={`frost-${i}`}
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{
                                            opacity: [0, 0.7, 0.4, 0.7],
                                            scale: [0.5, 1, 0.8, 1],
                                            rotate: [0, 180, 360],
                                        }}
                                        transition={{
                                            duration: 4,
                                            repeat: Infinity,
                                            delay: i * 0.5,
                                            ease: 'easeInOut',
                                        }}
                                        style={{
                                            position: 'absolute',
                                            width: 8,
                                            height: 2,
                                            backgroundColor: '#D4E1EC',
                                            boxShadow: '0 0 6px rgba(200,215,230,0.6)',
                                            borderRadius: 1,
                                            left: `calc(50% + ${Math.cos(angle) * radius}px)`,
                                            top: `calc(50% + ${Math.sin(angle) * radius}px)`,
                                            transform: `rotate(${i * 60}deg)`,
                                        }}
                                    />
                                );
                            })}
                            {flameTier === 'silver' && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 0.3, rotate: 360 }}
                                    transition={{
                                        scale: { type: 'spring', stiffness: 80, damping: 15, delay: 0.1 },
                                        rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                                    }}
                                    style={{
                                        position: 'absolute', width: 230, height: 230, borderRadius: '50%',
                                        border: '1px solid rgba(200,215,230,0.3)',
                                        borderTopColor: 'transparent',
                                    }}
                                />
                            )}

                            {/* GOLD: Radiating sun rays */}
                            {flameTier === 'gold' && Array.from({ length: 12 }).map((_, i) => {
                                const angle = (i * 30) * Math.PI / 180;
                                return (
                                    <motion.div
                                        key={`ray-${i}`}
                                        initial={{ scaleY: 0, opacity: 0 }}
                                        animate={{
                                            scaleY: [0.3, 1, 0.3],
                                            opacity: [0.1, 0.5, 0.1],
                                        }}
                                        transition={{
                                            duration: 2.5,
                                            repeat: Infinity,
                                            delay: i * 0.15,
                                            ease: 'easeInOut',
                                        }}
                                        style={{
                                            position: 'absolute',
                                            width: 2,
                                            height: 40,
                                            background: 'linear-gradient(to top, rgba(255,215,0,0.6), transparent)',
                                            borderRadius: 2,
                                            transformOrigin: 'bottom center',
                                            left: `calc(50% + ${Math.cos(angle) * 95}px)`,
                                            top: `calc(50% + ${Math.sin(angle) * 95}px - 20px)`,
                                            transform: `rotate(${i * 30 + 90}deg)`,
                                        }}
                                    />
                                );
                            })}
                            {flameTier === 'gold' && (
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: [0.2, 0.4, 0.2], rotate: 360 }}
                                    transition={{
                                        scale: { type: 'spring', stiffness: 80, damping: 15 },
                                        opacity: { duration: 3, repeat: Infinity },
                                        rotate: { duration: 30, repeat: Infinity, ease: 'linear' },
                                    }}
                                    style={{
                                        position: 'absolute', width: 240, height: 240, borderRadius: '50%',
                                        border: '2px solid rgba(255,215,0,0.2)',
                                    }}
                                />
                            )}

                            {/* EMERALD: Double orbiting energy rings */}
                            {flameTier === 'emerald' && (
                                <>
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0, rotateX: 60 }}
                                        animate={{ scale: 1, opacity: 0.5, rotate: 360, rotateX: 60 }}
                                        transition={{
                                            scale: { type: 'spring', stiffness: 80, delay: 0.1 },
                                            rotate: { duration: 6, repeat: Infinity, ease: 'linear' },
                                        }}
                                        style={{
                                            position: 'absolute', width: 220, height: 220, borderRadius: '50%',
                                            border: '2px solid rgba(52,211,153,0.4)',
                                            borderRightColor: 'transparent',
                                            borderLeftColor: 'transparent',
                                        }}
                                    />
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0, rotateY: 60 }}
                                        animate={{ scale: 1, opacity: 0.4, rotate: -360, rotateY: 60 }}
                                        transition={{
                                            scale: { type: 'spring', stiffness: 80, delay: 0.2 },
                                            rotate: { duration: 8, repeat: Infinity, ease: 'linear' },
                                        }}
                                        style={{
                                            position: 'absolute', width: 240, height: 240, borderRadius: '50%',
                                            border: '1.5px solid rgba(16,185,129,0.3)',
                                            borderTopColor: 'transparent',
                                            borderBottomColor: 'transparent',
                                        }}
                                    />
                                </>
                            )}
                            {flameTier === 'emerald' && Array.from({ length: 4 }).map((_, i) => (
                                <motion.div
                                    key={`epart-${i}`}
                                    animate={{
                                        scale: [0, 1.2, 0],
                                        opacity: [0, 0.7, 0],
                                        x: [0, Math.cos((i * Math.PI) / 2) * 110],
                                        y: [0, Math.sin((i * Math.PI) / 2) * 110],
                                    }}
                                    transition={{ duration: 3, repeat: Infinity, delay: i * 0.6, ease: 'easeOut' }}
                                    style={{
                                        position: 'absolute', width: 5, height: 5, borderRadius: '50%',
                                        backgroundColor: '#34D399', boxShadow: '0 0 10px #34D399',
                                    }}
                                />
                            ))}

                            {/* SAPPHIRE: Electric lightning arcs + plasma ring */}
                            {flameTier === 'sapphire' && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: [0.3, 0.6, 0.3], rotate: 360 }}
                                    transition={{
                                        scale: { type: 'spring', stiffness: 80, delay: 0.1 },
                                        opacity: { duration: 2, repeat: Infinity },
                                        rotate: { duration: 10, repeat: Infinity, ease: 'linear' },
                                    }}
                                    style={{
                                        position: 'absolute', width: 230, height: 230, borderRadius: '50%',
                                        border: '2px solid rgba(59,130,246,0.4)',
                                        boxShadow: '0 0 15px rgba(59,130,246,0.2), inset 0 0 15px rgba(59,130,246,0.1)',
                                    }}
                                />
                            )}
                            {flameTier === 'sapphire' && Array.from({ length: 6 }).map((_, i) => (
                                <motion.div
                                    key={`bolt-${i}`}
                                    animate={{
                                        opacity: [0, 1, 0],
                                        scaleX: [0.5, 1.5, 0.5],
                                    }}
                                    transition={{
                                        duration: 0.8,
                                        repeat: Infinity,
                                        delay: i * 0.4 + Math.random() * 0.3,
                                        repeatDelay: 1.5 + Math.random(),
                                    }}
                                    style={{
                                        position: 'absolute',
                                        width: 30 + Math.random() * 20,
                                        height: 1.5,
                                        background: 'linear-gradient(90deg, transparent, rgba(100,180,255,0.8), transparent)',
                                        borderRadius: 1,
                                        left: `calc(50% + ${(Math.random() - 0.5) * 180}px)`,
                                        top: `calc(50% + ${(Math.random() - 0.5) * 180}px)`,
                                        transform: `rotate(${Math.random() * 360}deg)`,
                                    }}
                                />
                            ))}

                            {/* DIAMOND: Prismatic rainbow aurora + shimmer ring */}
                            {flameTier === 'diamond' && (
                                <>
                                    {/* Rotating prismatic border */}
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 0.6, rotate: 360 }}
                                        transition={{
                                            scale: { type: 'spring', stiffness: 60, delay: 0.1 },
                                            rotate: { duration: 8, repeat: Infinity, ease: 'linear' },
                                        }}
                                        style={{
                                            position: 'absolute', width: 240, height: 240, borderRadius: '50%',
                                            background: 'conic-gradient(from 0deg, rgba(232,121,249,0.4), rgba(167,139,250,0.4), rgba(103,232,249,0.4), rgba(255,255,255,0.3), rgba(232,121,249,0.4))',
                                            WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 3px))',
                                            mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 3px))',
                                        }}
                                    />
                                    {/* Inner shimmer ring */}
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 0.4, rotate: -360 }}
                                        transition={{
                                            scale: { type: 'spring', stiffness: 60, delay: 0.15 },
                                            rotate: { duration: 12, repeat: Infinity, ease: 'linear' },
                                        }}
                                        style={{
                                            position: 'absolute', width: 210, height: 210, borderRadius: '50%',
                                            background: 'conic-gradient(from 180deg, rgba(103,232,249,0.3), rgba(232,121,249,0.3), rgba(167,139,250,0.3), rgba(103,232,249,0.3))',
                                            WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 2px))',
                                            mask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 2px))',
                                        }}
                                    />
                                </>
                            )}
                            {flameTier === 'diamond' && Array.from({ length: 8 }).map((_, i) => (
                                <motion.div
                                    key={`prism-${i}`}
                                    animate={{
                                        scale: [0, 1, 0],
                                        opacity: [0, 0.9, 0],
                                        x: [0, Math.cos((i * Math.PI) / 4) * 120],
                                        y: [0, Math.sin((i * Math.PI) / 4) * 120],
                                    }}
                                    transition={{
                                        duration: 3,
                                        repeat: Infinity,
                                        delay: i * 0.35,
                                        ease: 'easeOut',
                                    }}
                                    style={{
                                        position: 'absolute', width: 5, height: 5, borderRadius: '50%',
                                        backgroundColor: ['#E879F9', '#A78BFA', '#67E8F9', '#FFFFFF', '#F0ABFC', '#C4B5FD', '#99F6E4', '#FDE68A'][i],
                                        boxShadow: `0 0 10px ${['#E879F9', '#A78BFA', '#67E8F9', '#FFF', '#F0ABFC', '#C4B5FD', '#99F6E4', '#FDE68A'][i]}`,
                                    }}
                                />
                            ))}

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
