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
 * Redesigned to match the BadgeDetailModal cinematic dark style with glossy 3D badge images.
 */

// Map badge color classes to hex for glow effects
const colorMap: Record<string, string> = {
    'from-blue-400 to-cyan-400': '#38bdf8',
    'from-amber-400 to-orange-500': '#f59e0b',
    'from-slate-700 to-slate-900': '#64748b',
    'from-pink-400 to-rose-500': '#f472b6',
    'from-yellow-400 to-amber-500': '#facc15',
    'from-red-500 to-maroon-700': '#ef4444',
    'from-cyan-400 to-blue-600': '#22d3ee',
    'from-emerald-400 to-teal-600': '#34d399',
    'from-indigo-600 to-purple-900': '#818cf8',
    'from-orange-500 to-red-600': '#f97316',
    'from-slate-300 to-slate-500': '#cbd5e1',
    'from-blue-400 to-indigo-600': '#60a5fa',
    'from-pink-400 via-purple-500 to-cyan-400': '#c084fc',
    'from-purple-400 to-indigo-600': '#a78bfa',
};

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
            hapticSuccess();
            setTimeout(hapticLight, 200);
            setTimeout(hapticSuccess, 400);
        }
    }, [queue, location.pathname, activeBadgeId]);

    // 3. Lock #root scroll while celebration is active
    useEffect(() => {
        if (!activeBadgeId) return;
        const root = document.getElementById('root');
        if (root) {
            const prev = root.style.overflow;
            root.style.overflow = 'hidden';
            return () => { root.style.overflow = prev; };
        }
    }, [activeBadgeId]);

    // 4. Status Bar Theme Management
    useEffect(() => {
        const updateStatusBar = async () => {
            const meta = document.querySelector('meta[name="theme-color"]');
            const activeColor = '#0a0a0a';
            const activeStyle = Style.Dark;

            if (activeBadgeId) {
                meta?.setAttribute('content', activeColor);
                try {
                    await StatusBar.setBackgroundColor({ color: activeColor });
                    await StatusBar.setStyle({ style: activeStyle });
                } catch (e) { /* ignore web errors */ }
            } else {
                const fallbackColor = resolvedTheme === 'dark' ? '#000000' : '#F5F5F7';
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
    const glowColor = activeBadge ? (colorMap[activeBadge.color] || '#60a5fa') : '#60a5fa';

    return (
        <AnimatePresence>
            {activeBadge && (
                <motion.div
                    key="badge-modal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#0a0a0a]"
                >
                    {/* Radial background glow */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: `radial-gradient(ellipse at 50% 35%, ${glowColor}18 0%, transparent 55%)`,
                        }}
                    />

                    {/* Ambient glow layer 1 — large breathing bleed */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: [0.15, 0.3, 0.15], scale: [0.9, 1.2, 0.9] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute top-[12%] w-80 h-80 rounded-full blur-[120px] pointer-events-none"
                        style={{ background: glowColor }}
                    />

                    {/* Ambient glow layer 2 — tighter ring */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.25 }}
                        transition={{ delay: 0.2 }}
                        className="absolute top-[20%] w-52 h-52 rounded-full blur-[60px] pointer-events-none"
                        style={{ background: glowColor }}
                    />

                    {/* Confetti */}
                    <Confetti
                        width={windowSize.width}
                        height={windowSize.height}
                        recycle={false}
                        numberOfPieces={500}
                        gravity={0.1}
                        initialVelocityY={18}
                        colors={['#FFD700', '#FFFFFF', glowColor, '#A855F7', '#FF9F0A']}
                        style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
                    />

                    {/* Main content */}
                    <motion.div
                        initial={{ scale: 0.85, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 0.05 }}
                        className="relative z-10 flex flex-col items-center px-8 max-w-sm w-full"
                    >
                        {/* Badge image — hero (glossy 3D PNG) */}
                        <motion.div
                            initial={{ scale: 0, rotate: -30 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 10, delay: 0.1 }}
                            className="mb-6"
                        >
                            <img
                                src={activeBadge.imageSrc}
                                alt={activeBadge.name}
                                className="w-52 h-52 object-contain"
                                style={{
                                    filter: `drop-shadow(0 0 40px ${glowColor}50) drop-shadow(0 8px 24px rgba(0,0,0,0.5))`,
                                }}
                            />
                        </motion.div>

                        {/* "Achievement Sbloccato" label */}
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex items-center gap-2 mb-4"
                        >
                            <Sparkles className="w-4 h-4" style={{ color: glowColor }} />
                            <span
                                className="text-[11px] font-bold uppercase tracking-[0.2em]"
                                style={{ color: glowColor }}
                            >
                                Conquista Sbloccata
                            </span>
                            <Sparkles className="w-4 h-4" style={{ color: glowColor }} />
                        </motion.div>

                        {/* Title */}
                        <motion.h2
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                            className="text-[32px] font-black text-white text-center tracking-tight mb-4"
                            style={{ textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}
                        >
                            {activeBadge.name}
                        </motion.h2>

                        {/* Description */}
                        <motion.p
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.45 }}
                            className="text-[16px] text-white/50 text-center leading-relaxed max-w-[300px] mb-3"
                        >
                            {activeBadge.description}
                        </motion.p>

                        {/* Requirement pill */}
                        <motion.p
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.55 }}
                            className="text-[13px] text-white/30 text-center leading-relaxed max-w-[280px] px-4 py-2 rounded-full border border-white/[0.06] bg-white/[0.03]"
                        >
                            {activeBadge.requirement}
                        </motion.p>
                    </motion.div>

                    {/* Bottom button */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="absolute bottom-0 left-0 right-0 p-6 pb-8 safe-area-bottom z-20"
                    >
                        <button
                            onClick={handleDismiss}
                            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[15px] bg-[#00B1FF] text-white active:scale-[0.97] transition-transform"
                            style={{ boxShadow: '0 4px 24px -4px rgba(0,177,255,0.4)' }}
                        >
                            <span>{queue.length > 0 ? 'Mostra la prossima' : 'Chiudi e continua'}</span>
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
