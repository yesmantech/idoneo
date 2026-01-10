import React from 'react';
import { motion } from 'framer-motion';

export type FlameTier = 'bronze' | 'silver' | 'gold' | 'emerald' | 'sapphire' | 'diamond';

interface AnimatedFlameProps {
    size?: number;
    className?: string;
    /** The visual tier of the flame based on streak milestones */
    tier?: FlameTier;
}

// Tier configurations with distinct visual identity
const TIER_CONFIG = {
    bronze: {
        label: 'Bronze',
        glowColor: 'rgba(205, 127, 50, 0.5)',
        sparkleColors: ['bg-orange-300', 'bg-amber-400', 'bg-yellow-300'],
        gradient: {
            outer: ['#CD7F32', '#B87333', '#8B4513'],
            inner: ['#A0522D', '#8B4513'],
            highlight: ['#DEB887', '#D2691E'],
            stroke: ['#DAA520', '#CD7F32'],
        },
        effects: { ring: false, star: false, particles: 3 },
    },
    silver: {
        label: 'Silver',
        glowColor: 'rgba(192, 192, 192, 0.6)',
        sparkleColors: ['bg-slate-200', 'bg-gray-300', 'bg-white'],
        gradient: {
            outer: ['#E8E8E8', '#C0C0C0', '#A8A8A8'],
            inner: ['#B0B0B0', '#808080'],
            highlight: ['#FFFFFF', '#E0E0E0'],
            stroke: ['#FFFFFF', '#C0C0C0'],
        },
        effects: { ring: false, star: false, particles: 4 },
    },
    gold: {
        label: 'Gold',
        glowColor: 'rgba(255, 215, 0, 0.6)',
        sparkleColors: ['bg-yellow-200', 'bg-amber-300', 'bg-yellow-400'],
        gradient: {
            outer: ['#FFD700', '#FFC107', '#FF9800'],
            inner: ['#FFB300', '#FF8F00'],
            highlight: ['#FFF59D', '#FFEE58'],
            stroke: ['#FFFFFF', '#FFD700'],
        },
        effects: { ring: true, star: false, particles: 5 },
    },
    emerald: {
        label: 'Emerald',
        glowColor: 'rgba(80, 200, 120, 0.6)',
        sparkleColors: ['bg-emerald-300', 'bg-green-400', 'bg-teal-300'],
        gradient: {
            outer: ['#50C878', '#2E8B57', '#228B22'],
            inner: ['#3CB371', '#2E8B57'],
            highlight: ['#98FB98', '#90EE90'],
            stroke: ['#FFFFFF', '#50C878'],
        },
        effects: { ring: true, star: true, particles: 6 },
    },
    sapphire: {
        label: 'Sapphire',
        glowColor: 'rgba(15, 82, 186, 0.7)',
        sparkleColors: ['bg-blue-300', 'bg-indigo-400', 'bg-cyan-300'],
        gradient: {
            outer: ['#00BFFF', '#1E90FF', '#0F52BA'],
            inner: ['#4169E1', '#0000CD'],
            highlight: ['#87CEEB', '#00BFFF'],
            stroke: ['#FFFFFF', '#1E90FF'],
        },
        effects: { ring: true, star: true, particles: 7 },
    },
    diamond: {
        label: 'Diamond',
        glowColor: 'rgba(185, 242, 255, 0.8)',
        sparkleColors: ['bg-pink-300', 'bg-purple-300', 'bg-cyan-300', 'bg-yellow-200', 'bg-white'],
        gradient: {
            outer: ['#E0FFFF', '#B9F2FF', '#E6E6FA'],
            inner: ['#DDA0DD', '#DA70D6'],
            highlight: ['#FFFFFF', '#F0F8FF'],
            stroke: ['#FFFFFF', '#E0FFFF'],
        },
        effects: { ring: true, star: true, particles: 10, rainbow: true },
    },
};

/**
 * Helper to get tier from streak count
 */
export function getTierFromStreak(streak: number): FlameTier {
    if (streak >= 100) return 'diamond';
    if (streak >= 60) return 'sapphire';
    if (streak >= 30) return 'emerald';
    if (streak >= 14) return 'gold';
    if (streak >= 7) return 'silver';
    return 'bronze';
}

/**
 * Premium Animated Flame Component with Tiered Visual System
 */
export function AnimatedFlame({ size = 160, className = '', tier = 'bronze' }: AnimatedFlameProps) {
    const config = TIER_CONFIG[tier];
    const { gradient, effects, glowColor, sparkleColors } = config;
    const isDiamond = tier === 'diamond';

    return (
        <div className={`relative ${className}`} style={{ width: size, height: size }}>
            {/* Outer Glow */}
            <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                    background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
                    filter: isDiamond ? 'blur(35px)' : 'blur(25px)',
                }}
                animate={{
                    scale: [1, isDiamond ? 1.3 : 1.2, 1],
                    opacity: [0.5, isDiamond ? 1 : 0.8, 0.5],
                }}
                transition={{
                    duration: isDiamond ? 1.2 : 1.8,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />

            {/* Ring Effect (Gold+) */}
            {effects.ring && (
                <motion.div
                    className="absolute inset-1 rounded-full"
                    style={{
                        border: `3px solid ${gradient.stroke[1]}`,
                        opacity: 0.4,
                    }}
                    animate={{
                        scale: [1, 1.15, 1],
                        opacity: [0.2, 0.5, 0.2],
                        rotate: [0, 180, 360],
                    }}
                    transition={{
                        duration: isDiamond ? 3 : 5,
                        repeat: Infinity,
                        ease: 'linear',
                    }}
                />
            )}

            {/* Rainbow Prismatic Effect (Diamond only) */}
            {isDiamond && (
                <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: 'conic-gradient(from 0deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff, #5f27cd, #ff6b6b)',
                        opacity: 0.3,
                        filter: 'blur(15px)',
                    }}
                    animate={{
                        rotate: [0, 360],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: 'linear',
                    }}
                />
            )}

            {/* Main Flame SVG */}
            <motion.svg
                viewBox="0 0 100 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="relative z-10 w-full h-full drop-shadow-xl"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
                <defs>
                    <linearGradient id={`flameOuter-${tier}`} x1="50%" y1="0%" x2="50%" y2="100%">
                        <stop offset="0%" stopColor={gradient.outer[0]} />
                        <stop offset="50%" stopColor={gradient.outer[1]} />
                        <stop offset="100%" stopColor={gradient.outer[2]} />
                    </linearGradient>
                    <linearGradient id={`flameInner-${tier}`} x1="50%" y1="0%" x2="50%" y2="100%">
                        <stop offset="0%" stopColor={gradient.inner[0]} />
                        <stop offset="100%" stopColor={gradient.inner[1]} />
                    </linearGradient>
                    <linearGradient id={`flameHighlight-${tier}`} x1="50%" y1="0%" x2="50%" y2="100%">
                        <stop offset="0%" stopColor={gradient.highlight[0]} />
                        <stop offset="100%" stopColor={gradient.highlight[1]} />
                    </linearGradient>
                    <linearGradient id={`flameStroke-${tier}`} x1="50%" y1="0%" x2="50%" y2="100%">
                        <stop offset="0%" stopColor={gradient.stroke[0]} />
                        <stop offset="100%" stopColor={gradient.stroke[1]} />
                    </linearGradient>
                </defs>

                {/* Outer Flame Body */}
                <motion.path
                    d="M50 10 C30 30 15 50 15 75 C15 95 30 110 50 110 C70 110 85 95 85 75 C85 50 70 30 50 10Z"
                    fill={`url(#flameOuter-${tier})`}
                    stroke={`url(#flameStroke-${tier})`}
                    strokeWidth={isDiamond ? "5" : "3"}
                    animate={{
                        d: [
                            "M50 10 C30 30 15 50 15 75 C15 95 30 110 50 110 C70 110 85 95 85 75 C85 50 70 30 50 10Z",
                            "M50 8 C28 32 14 48 14 74 C14 96 31 111 50 111 C69 111 86 96 86 74 C86 48 72 32 50 8Z",
                            "M50 10 C30 30 15 50 15 75 C15 95 30 110 50 110 C70 110 85 95 85 75 C85 50 70 30 50 10Z",
                        ],
                    }}
                    transition={{ duration: isDiamond ? 1.2 : 2, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* Inner Core */}
                <motion.path
                    d="M50 35 C40 50 30 60 30 78 C30 90 38 98 50 98 C62 98 70 90 70 78 C70 60 60 50 50 35Z"
                    fill={`url(#flameInner-${tier})`}
                    animate={{ opacity: [0.9, 1, 0.9], scale: [1, 1.02, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* Highlight */}
                <motion.path
                    d="M38 65 C35 72 33 78 36 85 C38 90 44 92 48 88 C50 85 48 78 45 72 C43 68 40 65 38 65Z"
                    fill={`url(#flameHighlight-${tier})`}
                    opacity="0.7"
                    animate={{ opacity: [0.5, 0.85, 0.5], y: [0, -2, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                />

                {/* Shine */}
                <motion.ellipse
                    cx="35" cy="55" rx="6" ry="10"
                    fill="white"
                    opacity={isDiamond ? "0.5" : "0.3"}
                    animate={{ opacity: isDiamond ? [0.4, 0.7, 0.4] : [0.2, 0.4, 0.2] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
            </motion.svg>

            {/* Sparkles */}
            {[...Array(effects.particles)].map((_, i) => (
                <motion.div
                    key={i}
                    className={`absolute w-2 h-2 ${sparkleColors[i % sparkleColors.length]} rounded-full`}
                    style={{
                        top: `${8 + (i * 10) % 55}%`,
                        left: i % 2 === 0 ? `${3 + i * 4}%` : `${78 + i * 2}%`,
                    }}
                    animate={{
                        opacity: [0, 1, 0],
                        scale: [0.4, isDiamond ? 1.5 : 1.1, 0.4],
                        y: [0, isDiamond ? -18 : -12, 0],
                    }}
                    transition={{
                        duration: 1 + i * 0.15,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: i * 0.25,
                    }}
                />
            ))}

            {/* Star Badge (Emerald+) */}
            {effects.star && (
                <motion.div
                    className="absolute -top-3 left-1/2 -translate-x-1/2"
                    animate={{ y: [0, -4, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                            fill={gradient.outer[0]}
                            stroke="#FFFFFF"
                            strokeWidth="1"
                        />
                    </svg>
                </motion.div>
            )}
        </div>
    );
}
