import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Particles ─── */
const PARTICLE_COLORS = [
    '#A855F7', '#C084FC', '#7C3AED', '#E9D5FF',
    '#D946EF', '#F0ABFC', '#6D28D9', '#8B5CF6',
];

function generateParticles(count: number) {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        size: 2 + Math.random() * 6,
        color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
        duration: 2 + Math.random() * 3,
        delay: Math.random() * 2,
    }));
}

/* ─── Ember ─── */
function Ember({ delay, side }: { delay: number; side: 'left' | 'right' }) {
    const x = side === 'left' ? -30 - Math.random() * 80 : 30 + Math.random() * 80;
    return (
        <motion.div
            className="absolute rounded-full"
            style={{
                width: 3 + Math.random() * 5,
                height: 3 + Math.random() * 5,
                background: `radial-gradient(circle, #E9D5FF, #A855F7)`,
                left: '50%',
                top: '40%',
            }}
            initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
            animate={{
                opacity: [0, 1, 1, 0],
                x: [0, x * 0.5, x],
                y: [0, -100 - Math.random() * 120, -200 - Math.random() * 80],
                scale: [0, 1, 0.2],
            }}
            transition={{
                duration: 1.8 + Math.random(),
                delay,
                repeat: Infinity,
                repeatDelay: 0.5 + Math.random() * 2,
                ease: 'easeOut',
            }}
        />
    );
}

/* ─── Heat Distortion Wave ─── */
function HeatWave({ delay }: { delay: number }) {
    return (
        <motion.div
            className="absolute left-1/2 -translate-x-1/2 rounded-full pointer-events-none"
            style={{
                width: 200,
                height: 200,
                border: '1px solid rgba(168, 85, 247, 0.15)',
                top: '35%',
            }}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{
                scale: [0.3, 2.5],
                opacity: [0.6, 0],
            }}
            transition={{
                duration: 2.5,
                delay,
                repeat: Infinity,
                ease: 'easeOut',
            }}
        />
    );
}

/* ─── Main Page ─── */
export default function Flame3DPage() {
    const [ignited, setIgnited] = useState(false);
    const [particles] = useState(() => generateParticles(30));
    const [embers] = useState(() =>
        Array.from({ length: 24 }, (_, i) => ({
            id: i,
            delay: i * 0.12,
            side: (i % 2 === 0 ? 'left' : 'right') as 'left' | 'right',
        }))
    );

    useEffect(() => {
        const t = setTimeout(() => setIgnited(true), 800);
        return () => clearTimeout(t);
    }, []);

    const toggleFlame = useCallback(() => setIgnited(v => !v), []);

    return (
        <div
            className="relative min-h-screen flex items-center justify-center overflow-hidden"
            style={{
                background: ignited
                    ? 'radial-gradient(ellipse at 50% 55%, #1a0533 0%, #0a0118 40%, #000000 100%)'
                    : '#050510',
                transition: 'background 1.5s ease',
            }}
        >
            {/* ── Background Ambient Glow ── */}
            <AnimatePresence>
                {ignited && (
                    <motion.div
                        className="absolute inset-0 pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5 }}
                    >
                        {/* Central glow */}
                        <div
                            className="absolute left-1/2 top-[50%] -translate-x-1/2 -translate-y-1/2 rounded-full"
                            style={{
                                width: 600,
                                height: 600,
                                background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(168,85,247,0.1) 40%, transparent 70%)',
                                filter: 'blur(80px)',
                            }}
                        />
                        {/* Floor reflection */}
                        <div
                            className="absolute left-1/2 bottom-0 -translate-x-1/2 rounded-full"
                            style={{
                                width: 500,
                                height: 150,
                                background: 'radial-gradient(ellipse, rgba(168,85,247,0.35) 0%, transparent 70%)',
                                filter: 'blur(40px)',
                            }}
                        />
                        {/* Top heat haze */}
                        <div
                            className="absolute left-1/2 top-[20%] -translate-x-1/2 rounded-full"
                            style={{
                                width: 200,
                                height: 300,
                                background: 'radial-gradient(ellipse, rgba(192,132,252,0.15) 0%, transparent 70%)',
                                filter: 'blur(50px)',
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Rising Particles ── */}
            <AnimatePresence>
                {ignited && particles.map(p => (
                    <motion.div
                        key={p.id}
                        className="absolute rounded-full pointer-events-none"
                        style={{
                            width: p.size,
                            height: p.size,
                            background: p.color,
                            left: `${p.x}%`,
                            bottom: '-5%',
                            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                        }}
                        initial={{ opacity: 0, y: 0 }}
                        animate={{
                            opacity: [0, 0.8, 0],
                            y: [0, -(window.innerHeight * 0.8 + Math.random() * 200)],
                        }}
                        transition={{
                            duration: p.duration,
                            delay: p.delay,
                            repeat: Infinity,
                            ease: 'easeOut',
                        }}
                    />
                ))}
            </AnimatePresence>

            {/* ── Flame Container ── */}
            <div className="relative z-10 flex flex-col items-center">
                <div className="relative" style={{ width: 280, height: 360 }}>

                    {/* Heat distortion waves */}
                    <AnimatePresence>
                        {ignited && (
                            <>
                                <HeatWave delay={0} />
                                <HeatWave delay={0.8} />
                                <HeatWave delay={1.6} />
                            </>
                        )}
                    </AnimatePresence>

                    {/* Embers flying off */}
                    <AnimatePresence>
                        {ignited && embers.map(e => (
                            <Ember key={e.id} delay={e.delay} side={e.side} />
                        ))}
                    </AnimatePresence>

                    {/* ── Outer Pulsing Glow ── */}
                    <AnimatePresence>
                        {ignited && (
                            <motion.div
                                className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 rounded-full"
                                style={{
                                    width: 320,
                                    height: 320,
                                    background: 'radial-gradient(circle, rgba(168,85,247,0.5) 0%, rgba(124,58,237,0.2) 40%, transparent 70%)',
                                    filter: 'blur(50px)',
                                }}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{
                                    scale: [1, 1.25, 1],
                                    opacity: [0.5, 0.9, 0.5],
                                }}
                                transition={{
                                    duration: 1.8,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                            />
                        )}
                    </AnimatePresence>

                    {/* ── Prismatic ring ── */}
                    <AnimatePresence>
                        {ignited && (
                            <motion.div
                                className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 rounded-full"
                                style={{
                                    width: 280,
                                    height: 280,
                                    background: 'conic-gradient(from 0deg, #A855F7, #D946EF, #7C3AED, #C084FC, #6D28D9, #A855F7)',
                                    opacity: 0.12,
                                    filter: 'blur(25px)',
                                }}
                                initial={{ rotate: 0, scale: 0 }}
                                animate={{ rotate: 360, scale: 1 }}
                                transition={{
                                    rotate: { duration: 6, repeat: Infinity, ease: 'linear' },
                                    scale: { duration: 0.8, ease: 'easeOut' },
                                }}
                            />
                        )}
                    </AnimatePresence>

                    {/* ── The actual flame3.png image ── */}
                    <motion.div
                        className="absolute inset-0 flex items-center justify-center z-10"
                        style={{
                            filter: ignited
                                ? 'drop-shadow(0 0 40px rgba(168,85,247,0.7)) drop-shadow(0 0 80px rgba(124,58,237,0.3))'
                                : 'grayscale(0.8) brightness(0.3)',
                            transition: 'filter 0.8s ease',
                        }}
                        animate={ignited ? { y: [0, -8, 0] } : { y: 0 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <motion.img
                            src="/icons/flame-purple.png"
                            alt="Flame"
                            style={{ width: 200, height: 'auto' }}
                            initial={{ scale: 0.3, opacity: 0 }}
                            animate={ignited
                                ? { scale: [1, 1.04, 1], opacity: 1 }
                                : { scale: 0.6, opacity: 0.3 }
                            }
                            transition={{
                                scale: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
                                opacity: { duration: 0.8 },
                            }}
                        />
                    </motion.div>

                    {/* ── Sparkle orbiting points ── */}
                    <AnimatePresence>
                        {ignited && [...Array(10)].map((_, i) => {
                            const angle = (i / 10) * Math.PI * 2;
                            const radius = 120 + Math.random() * 40;
                            return (
                                <motion.div
                                    key={i}
                                    className="absolute rounded-full"
                                    style={{
                                        width: 3 + Math.random() * 5,
                                        height: 3 + Math.random() * 5,
                                        background: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
                                        left: '50%',
                                        top: '45%',
                                        boxShadow: `0 0 10px ${PARTICLE_COLORS[i % PARTICLE_COLORS.length]}`,
                                    }}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{
                                        opacity: [0, 1, 0],
                                        scale: [0.3, 1.5, 0.3],
                                        x: [0, Math.cos(angle) * radius],
                                        y: [0, Math.sin(angle) * radius - 50],
                                    }}
                                    transition={{
                                        duration: 2.5 + Math.random(),
                                        delay: i * 0.25,
                                        repeat: Infinity,
                                        repeatDelay: 0.8,
                                        ease: 'easeOut',
                                    }}
                                />
                            );
                        })}
                    </AnimatePresence>
                </div>

                {/* ── Label ── */}
                <motion.div
                    className="mt-6 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                >
                    <h1
                        className="text-5xl font-black tracking-tight"
                        style={{
                            background: 'linear-gradient(135deg, #E9D5FF, #A855F7, #7C3AED)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        Streak 🔥
                    </h1>
                    <p className="text-white/40 mt-2 text-sm font-medium tracking-widest uppercase">
                        Tier S — Idoneo Flame
                    </p>
                </motion.div>

                {/* ── Ignite Button ── */}
                <motion.button
                    onClick={toggleFlame}
                    className="mt-10 px-8 py-3 rounded-full font-bold text-sm uppercase tracking-widest transition-all"
                    style={{
                        background: ignited
                            ? 'rgba(124,58,237,0.2)'
                            : 'linear-gradient(135deg, #A855F7, #7C3AED)',
                        color: ignited ? '#C084FC' : '#FFFFFF',
                        border: ignited ? '1px solid rgba(168,85,247,0.3)' : 'none',
                        boxShadow: ignited ? 'none' : '0 0 30px rgba(168,85,247,0.4)',
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                >
                    {ignited ? 'Spegni' : 'Accendi'} la Fiamma
                </motion.button>

                {/* ── Back Button ── */}
                <motion.a
                    href="/"
                    className="mt-6 text-white/30 hover:text-white/60 text-sm font-medium transition-colors"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2 }}
                >
                    ← Torna alla Home
                </motion.a>
            </div>
        </div>
    );
}
