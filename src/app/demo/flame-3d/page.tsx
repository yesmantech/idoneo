import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Particles ─── */
interface Particle {
    id: number;
    x: number;
    y: number;
    size: number;
    color: string;
    duration: number;
    delay: number;
}

const PARTICLE_COLORS = [
    '#A855F7', '#C084FC', '#7C3AED', '#E9D5FF',
    '#D946EF', '#F0ABFC', '#6D28D9', '#8B5CF6',
];

function generateParticles(count: number): Particle[] {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: 60 + Math.random() * 40,
        size: 2 + Math.random() * 6,
        color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
        duration: 2 + Math.random() * 3,
        delay: Math.random() * 2,
    }));
}

/* ─── Ember ─── */
function Ember({ delay, side }: { delay: number; side: 'left' | 'right' }) {
    const x = side === 'left' ? -30 - Math.random() * 60 : 30 + Math.random() * 60;
    return (
        <motion.div
            className="absolute rounded-full"
            style={{
                width: 3 + Math.random() * 4,
                height: 3 + Math.random() * 4,
                background: `radial-gradient(circle, #E9D5FF, #A855F7)`,
                left: '50%',
                top: '45%',
            }}
            initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
            animate={{
                opacity: [0, 1, 1, 0],
                x: [0, x * 0.5, x],
                y: [0, -80 - Math.random() * 120, -180 - Math.random() * 60],
                scale: [0, 1, 0.3],
            }}
            transition={{
                duration: 1.5 + Math.random(),
                delay,
                repeat: Infinity,
                repeatDelay: 0.5 + Math.random() * 2,
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
        Array.from({ length: 20 }, (_, i) => ({
            id: i,
            delay: i * 0.15,
            side: (i % 2 === 0 ? 'left' : 'right') as 'left' | 'right',
        }))
    );

    // Auto-ignite after a short delay
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
                    ? 'radial-gradient(ellipse at 50% 60%, #1a0533 0%, #0a0118 40%, #000000 100%)'
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
                            className="absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2 rounded-full"
                            style={{
                                width: 500,
                                height: 500,
                                background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, rgba(168,85,247,0.1) 40%, transparent 70%)',
                                filter: 'blur(60px)',
                            }}
                        />
                        {/* Floor reflection */}
                        <div
                            className="absolute left-1/2 bottom-0 -translate-x-1/2 rounded-full"
                            style={{
                                width: 400,
                                height: 120,
                                background: 'radial-gradient(ellipse, rgba(168,85,247,0.3) 0%, transparent 70%)',
                                filter: 'blur(30px)',
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
                            y: [0, -(window.innerHeight * 0.7 + p.y * 4)],
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
                {/* Embers flying off */}
                <div className="relative" style={{ width: 260, height: 320 }}>
                    <AnimatePresence>
                        {ignited && embers.map(e => (
                            <Ember key={e.id} delay={e.delay} side={e.side} />
                        ))}
                    </AnimatePresence>

                    {/* ── Outer Pulsing Glow ── */}
                    <AnimatePresence>
                        {ignited && (
                            <motion.div
                                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                                style={{
                                    width: 280,
                                    height: 280,
                                    background: 'radial-gradient(circle, rgba(168,85,247,0.5) 0%, rgba(124,58,237,0.2) 40%, transparent 70%)',
                                    filter: 'blur(40px)',
                                }}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.6, 1, 0.6],
                                }}
                                transition={{
                                    scale: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
                                    opacity: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
                                }}
                            />
                        )}
                    </AnimatePresence>

                    {/* ── Prismatic ring ── */}
                    <AnimatePresence>
                        {ignited && (
                            <motion.div
                                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                                style={{
                                    width: 240,
                                    height: 240,
                                    background: 'conic-gradient(from 0deg, #A855F7, #D946EF, #7C3AED, #C084FC, #6D28D9, #A855F7)',
                                    opacity: 0.15,
                                    filter: 'blur(20px)',
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

                    {/* ── Main 3D SVG Flame ── */}
                    <motion.svg
                        viewBox="0 0 100 130"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="relative z-10 w-full h-full drop-shadow-2xl"
                        style={{ filter: ignited ? 'drop-shadow(0 0 30px rgba(168,85,247,0.6))' : 'none' }}
                        animate={ignited ? { y: [0, -6, 0] } : {}}
                        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <defs>
                            {/* Outer body gradient */}
                            <linearGradient id="flame3dOuter" x1="50%" y1="0%" x2="50%" y2="100%">
                                <stop offset="0%" stopColor="#C084FC" />
                                <stop offset="35%" stopColor="#A855F7" />
                                <stop offset="70%" stopColor="#7C3AED" />
                                <stop offset="100%" stopColor="#5B21B6" />
                            </linearGradient>
                            {/* Inner core gradient */}
                            <linearGradient id="flame3dInner" x1="50%" y1="0%" x2="50%" y2="100%">
                                <stop offset="0%" stopColor="#E9D5FF" />
                                <stop offset="50%" stopColor="#C084FC" />
                                <stop offset="100%" stopColor="#9333EA" />
                            </linearGradient>
                            {/* Deep core */}
                            <radialGradient id="flame3dCore" cx="50%" cy="65%" r="30%">
                                <stop offset="0%" stopColor="#F3E8FF" />
                                <stop offset="60%" stopColor="#D8B4FE" />
                                <stop offset="100%" stopColor="#A855F7" />
                            </radialGradient>
                            {/* Highlight shine */}
                            <linearGradient id="flame3dShine" x1="30%" y1="0%" x2="70%" y2="100%">
                                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
                                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                            </linearGradient>
                            {/* Stroke gradient */}
                            <linearGradient id="flame3dStroke" x1="50%" y1="0%" x2="50%" y2="100%">
                                <stop offset="0%" stopColor="#E9D5FF" />
                                <stop offset="100%" stopColor="#7C3AED" />
                            </linearGradient>
                            {/* 3D depth shadow */}
                            <filter id="flame3dShadow">
                                <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#4C1D95" floodOpacity="0.4" />
                            </filter>
                        </defs>

                        {/* Outer Flame Body — organic morphing */}
                        <motion.path
                            d="M50 8 C30 28 12 48 12 76 C12 98 28 115 50 115 C72 115 88 98 88 76 C88 48 70 28 50 8Z"
                            fill="url(#flame3dOuter)"
                            stroke="url(#flame3dStroke)"
                            strokeWidth="3"
                            filter="url(#flame3dShadow)"
                            initial={{ opacity: 0, scale: 0.2 }}
                            animate={ignited ? {
                                opacity: 1,
                                scale: 1,
                                d: [
                                    "M50 8 C30 28 12 48 12 76 C12 98 28 115 50 115 C72 115 88 98 88 76 C88 48 70 28 50 8Z",
                                    "M50 5 C27 30 10 46 10 74 C10 99 29 116 50 116 C71 116 90 99 90 74 C90 46 73 30 50 5Z",
                                    "M50 8 C30 28 12 48 12 76 C12 98 28 115 50 115 C72 115 88 98 88 76 C88 48 70 28 50 8Z",
                                ],
                            } : { opacity: 0.15, scale: 0.6 }}
                            transition={{
                                opacity: { duration: 0.8 },
                                scale: { duration: 0.8, ease: 'easeOut' },
                                d: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
                            }}
                        />

                        {/* Inner Core — lighter center */}
                        <motion.path
                            d="M50 32 C40 48 28 58 28 78 C28 92 37 102 50 102 C63 102 72 92 72 78 C72 58 60 48 50 32Z"
                            fill="url(#flame3dInner)"
                            initial={{ opacity: 0 }}
                            animate={ignited ? {
                                opacity: [0.85, 1, 0.85],
                                d: [
                                    "M50 32 C40 48 28 58 28 78 C28 92 37 102 50 102 C63 102 72 92 72 78 C72 58 60 48 50 32Z",
                                    "M50 30 C38 50 26 56 26 77 C26 93 38 103 50 103 C62 103 74 93 74 77 C74 56 62 50 50 30Z",
                                    "M50 32 C40 48 28 58 28 78 C28 92 37 102 50 102 C63 102 72 92 72 78 C72 58 60 48 50 32Z",
                                ],
                            } : { opacity: 0 }}
                            transition={{
                                opacity: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' },
                                d: { duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.1 },
                            }}
                        />

                        {/* Deep Core — almost white center blob */}
                        <motion.ellipse
                            cx="50" cy="80" rx="14" ry="16"
                            fill="url(#flame3dCore)"
                            initial={{ opacity: 0 }}
                            animate={ignited ? {
                                opacity: [0.7, 1, 0.7],
                                ry: [16, 18, 16],
                            } : { opacity: 0 }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                        />

                        {/* 3D Highlight — glass-like left shine */}
                        <motion.path
                            d="M35 55 C32 64 30 72 33 82 C35 88 42 92 46 87 C48 83 46 74 43 67 C41 62 38 57 35 55Z"
                            fill="url(#flame3dShine)"
                            initial={{ opacity: 0 }}
                            animate={ignited ? {
                                opacity: [0.3, 0.7, 0.3],
                                y: [0, -3, 0],
                            } : { opacity: 0 }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                        />

                        {/* Tiny top spark */}
                        <motion.circle
                            cx="50" cy="14" r="3"
                            fill="#E9D5FF"
                            initial={{ opacity: 0 }}
                            animate={ignited ? {
                                opacity: [0, 1, 0],
                                cy: [14, 6, 14],
                                r: [3, 2, 3],
                            } : { opacity: 0 }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                        />

                        {/* Extra side sparks */}
                        <motion.circle
                            cx="22" cy="50" r="2"
                            fill="#C084FC"
                            initial={{ opacity: 0 }}
                            animate={ignited ? {
                                opacity: [0, 0.8, 0],
                                cx: [22, 16, 22],
                                cy: [50, 42, 50],
                            } : { opacity: 0 }}
                            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                        />
                        <motion.circle
                            cx="78" cy="45" r="2"
                            fill="#D946EF"
                            initial={{ opacity: 0 }}
                            animate={ignited ? {
                                opacity: [0, 0.8, 0],
                                cx: [78, 85, 78],
                                cy: [45, 38, 45],
                            } : { opacity: 0 }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
                        />
                    </motion.svg>

                    {/* ── Sparkle Points ── */}
                    <AnimatePresence>
                        {ignited && [...Array(8)].map((_, i) => {
                            const angle = (i / 8) * Math.PI * 2;
                            const radius = 110 + Math.random() * 30;
                            return (
                                <motion.div
                                    key={i}
                                    className="absolute rounded-full"
                                    style={{
                                        width: 4 + Math.random() * 4,
                                        height: 4 + Math.random() * 4,
                                        background: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
                                        left: '50%',
                                        top: '50%',
                                        boxShadow: `0 0 8px ${PARTICLE_COLORS[i % PARTICLE_COLORS.length]}`,
                                    }}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{
                                        opacity: [0, 1, 0],
                                        scale: [0.5, 1.5, 0.5],
                                        x: [0, Math.cos(angle) * radius],
                                        y: [0, Math.sin(angle) * radius - 40],
                                    }}
                                    transition={{
                                        duration: 2 + Math.random(),
                                        delay: i * 0.2,
                                        repeat: Infinity,
                                        repeatDelay: 1,
                                        ease: 'easeOut',
                                    }}
                                />
                            );
                        })}
                    </AnimatePresence>
                </div>

                {/* ── Label ── */}
                <motion.div
                    className="mt-8 text-center"
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
