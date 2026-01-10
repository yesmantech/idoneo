import React, { useEffect, useState } from 'react';
import { Flame, X, Share2, ArrowRight } from 'lucide-react';
import Confetti from 'react-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedFlame, getTierFromStreak } from './AnimatedFlame';

export function StreakCelebration() {
    const [show, setShow] = useState(false);
    const [streak, setStreak] = useState(0);
    const [isMilestone, setIsMilestone] = useState(false);
    const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        };

        const handleStreakUpdate = (e: any) => {
            const { streak, isMilestone } = e.detail;
            setStreak(streak);
            setIsMilestone(isMilestone);
            setShow(true);
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('streak_updated', handleStreakUpdate as EventListener);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('streak_updated', handleStreakUpdate as EventListener);
        };
    }, []);

    // Determine flame tier based on streak count
    const flameTier = getTierFromStreak(streak);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.8, 0.25, 1] }} // iOS ease
                    className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-xl"
                >
                    <Confetti
                        width={windowSize.width}
                        height={windowSize.height}
                        recycle={false}
                        numberOfPieces={isMilestone ? 800 : 400}
                        gravity={0.15}
                        colors={['#FF9F0A', '#00B1FF', '#0095FF', '#FFFFFF']} // Brand Colors (Orange + Blue)
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
                        {/* Close Button */}
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            onClick={() => setShow(false)}
                            className="absolute -top-16 right-4 p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors backdrop-blur-md"
                        >
                            <X className="w-6 h-6 text-white" />
                        </motion.button>

                        {/* Flame Animation Container */}
                        <div className="relative mb-10 flex justify-center">
                            {/* The Tiered Animated Flame */}
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

                        {/* Text Content */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, ease: "easeOut" }}
                        >
                            <h2 className="text-xl font-bold text-brand-orange uppercase tracking-widest mb-2">
                                {isMilestone ? "Traguardo Raggiunto!" : "Streak Aggiornata!"}
                            </h2>
                            <div className="flex items-center justify-center gap-3 mb-6">
                                <span className="text-8xl font-black text-white tracking-tighter drop-shadow-lg font-sans">
                                    {streak}
                                </span>
                                <div className="flex flex-col items-start space-y-1">
                                    <span className="text-2xl font-bold text-white tracking-tight">GIORNI</span>
                                    <span className="text-lg font-medium text-white/50 tracking-wide">CONSECUTIVI</span>
                                </div>
                            </div>

                            <p className="text-lg text-slate-300/90 mb-10 max-w-xs mx-auto leading-relaxed font-medium">
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
                            {/* Primary Action - Official App Brand Blue (#00B1FF) */}
                            <button
                                onClick={() => setShow(false)}
                                className="w-full py-4 bg-[#00B1FF] hover:bg-[#0099e6] active:scale-[0.98] text-white text-lg font-bold rounded-full shadow-lg shadow-[#00B1FF]/25 transition-all flex items-center justify-center gap-2 group duration-200"
                            >
                                Continua
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>

                            {/* Secondary Action - White/Transparent */}
                            <button
                                onClick={() => setShow(false)}
                                className="w-full py-4 bg-white/10 hover:bg-white/15 active:scale-[0.98] text-white font-bold rounded-full transition-all flex items-center justify-center gap-2 border border-white/10 backdrop-blur-sm duration-200"
                            >
                                <Share2 className="w-5 h-5" />
                                Condividi
                            </button>
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
