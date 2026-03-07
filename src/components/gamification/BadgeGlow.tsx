import React from 'react';
import { motion } from 'framer-motion';

interface BadgeGlowProps {
    /** The badge color gradient class, e.g. 'from-blue-400 to-cyan-400' */
    color: string;
    /** Whether the badge is unlocked (only unlocked badges get effects) */
    unlocked: boolean;
    /** Container size in px */
    size?: number;
    children: React.ReactNode;
}

// Map Tailwind gradient classes → actual hex colors for glow
const GLOW_COLOR_MAP: Record<string, { glow: string; sparkles: string[] }> = {
    'from-blue-400 to-cyan-400': { glow: '#38bdf8', sparkles: ['#38bdf8', '#22d3ee', '#67e8f9'] },
    'from-amber-400 to-orange-500': { glow: '#f59e0b', sparkles: ['#fbbf24', '#f97316', '#fcd34d'] },
    'from-slate-700 to-slate-900': { glow: '#94a3b8', sparkles: ['#cbd5e1', '#94a3b8', '#e2e8f0'] },
    'from-pink-400 to-rose-500': { glow: '#f472b6', sparkles: ['#f472b6', '#fb7185', '#f9a8d4'] },
    'from-yellow-400 to-amber-500': { glow: '#facc15', sparkles: ['#fde047', '#fbbf24', '#fef08a'] },
    'from-red-500 to-maroon-700': { glow: '#ef4444', sparkles: ['#f87171', '#ef4444', '#fca5a5'] },
    'from-cyan-400 to-blue-600': { glow: '#22d3ee', sparkles: ['#22d3ee', '#3b82f6', '#67e8f9'] },
    'from-emerald-400 to-teal-600': { glow: '#34d399', sparkles: ['#34d399', '#14b8a6', '#6ee7b7'] },
    'from-indigo-600 to-purple-900': { glow: '#818cf8', sparkles: ['#818cf8', '#a78bfa', '#c4b5fd'] },
    'from-orange-500 to-red-600': { glow: '#f97316', sparkles: ['#f97316', '#ef4444', '#fdba74'] },
    'from-slate-300 to-slate-500': { glow: '#cbd5e1', sparkles: ['#e2e8f0', '#cbd5e1', '#f1f5f9'] },
    'from-blue-400 to-indigo-600': { glow: '#60a5fa', sparkles: ['#60a5fa', '#818cf8', '#93c5fd'] },
    'from-pink-400 via-purple-500 to-cyan-400': { glow: '#c084fc', sparkles: ['#f472b6', '#c084fc', '#22d3ee'] },
    'from-purple-400 to-indigo-600': { glow: '#a78bfa', sparkles: ['#a78bfa', '#818cf8', '#c4b5fd'] },
};

const DEFAULT_GLOW = { glow: '#60a5fa', sparkles: ['#60a5fa', '#93c5fd', '#bfdbfe'] };

/**
 * Tier S animated glow wrapper for badge icons.
 * Renders pulsing glow, rotating ring, and floating sparkles behind children.
 * Only shows effects for unlocked badges.
 */
export function BadgeGlow({ color, unlocked, size = 90, children }: BadgeGlowProps) {
    if (!unlocked) {
        return <div className="relative" style={{ width: size, height: size }}>{children}</div>;
    }

    const config = GLOW_COLOR_MAP[color] || DEFAULT_GLOW;
    const sparkleCount = 4;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            {/* 1. Pulsing radial glow */}
            <motion.div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                    background: `radial-gradient(circle, ${config.glow}40 0%, transparent 70%)`,
                    filter: 'blur(12px)',
                }}
                animate={{
                    scale: [1, 1.25, 1],
                    opacity: [0.4, 0.7, 0.4],
                }}
                transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />

            {/* 2. Rotating ring */}
            <motion.div
                className="absolute rounded-full pointer-events-none"
                style={{
                    inset: '4px',
                    border: `2px solid ${config.glow}30`,
                    borderTopColor: `${config.glow}80`,
                }}
                animate={{
                    rotate: [0, 360],
                }}
                transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: 'linear',
                }}
            />

            {/* 3. Floating sparkles */}
            {[...Array(sparkleCount)].map((_, i) => {
                const angle = (i / sparkleCount) * 360;
                const radius = size * 0.42;
                const x = Math.cos((angle * Math.PI) / 180) * radius;
                const y = Math.sin((angle * Math.PI) / 180) * radius;

                return (
                    <motion.div
                        key={i}
                        className="absolute rounded-full pointer-events-none"
                        style={{
                            width: 5,
                            height: 5,
                            backgroundColor: config.sparkles[i % config.sparkles.length],
                            left: '50%',
                            top: '50%',
                            marginLeft: -2.5,
                            marginTop: -2.5,
                        }}
                        animate={{
                            x: [x * 0.7, x, x * 0.7],
                            y: [y * 0.7, y - 6, y * 0.7],
                            opacity: [0, 0.9, 0],
                            scale: [0.4, 1.2, 0.4],
                        }}
                        transition={{
                            duration: 2 + i * 0.3,
                            repeat: Infinity,
                            ease: 'easeInOut',
                            delay: i * 0.5,
                        }}
                    />
                );
            })}

            {/* 4. Badge content (icon) */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}
