/**
 * @file TierSLoader.tsx
 * @description Premium full-screen loading experience.
 *
 * A beautifully animated loading screen used during:
 * - Initial app load
 * - Quiz saving/loading
 * - Any heavy async operation
 *
 * ## Visual Elements
 *
 * | Element          | Description                        |
 * |------------------|------------------------------------|
 * | Background       | Rotating conic gradient            |
 * | Outer ring       | Slow cyan rotation (3s)            |
 * | Middle ring      | Medium emerald counter-rotation    |
 * | Inner ring       | Fast purple rotation (1s)          |
 * | Center dot       | Pulsing gradient orb               |
 * | Bouncing dots    | Three sequentially animated dots   |
 *
 * ## Props
 *
 * | Prop        | Type   | Default           | Description      |
 * |-------------|--------|-------------------|------------------|
 * | `message`   | string | "Caricamento..."  | Main text        |
 * | `submessage`| string | undefined         | Secondary text   |
 *
 * @example
 * ```tsx
 * import TierSLoader from '@/components/ui/TierSLoader';
 *
 * if (loading) {
 *   return <TierSLoader message="Salvataggio..." submessage="Attendere" />;
 * }
 * ```
 */

"use client";

import React from 'react';
import { motion } from 'framer-motion';

// ============================================================================
// COMPONENT
// ============================================================================

interface LoaderProps {
    message?: string;
    submessage?: string;
}

export default function TierSLoader({
    message = "Caricamento...",
    submessage
}: LoaderProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-[var(--background)] flex flex-col items-center justify-center"
        >
            {/* Animated Background Gradient */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 180, 360],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-conic from-cyan-500/10 via-transparent to-emerald-500/10"
                />
            </div>

            {/* Central Loader */}
            <div className="relative z-10 flex flex-col items-center">
                {/* Animated Ring */}
                <div className="relative w-24 h-24 mb-8">
                    {/* Outer ring - slow rotation */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#00B1FF] border-r-[#00B1FF]/30"
                    />

                    {/* Middle ring - medium rotation */}
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-2 rounded-full border-4 border-transparent border-t-emerald-500 border-l-emerald-500/30"
                    />

                    {/* Inner ring - fast rotation */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-4 rounded-full border-4 border-transparent border-b-purple-500 border-r-purple-500/30"
                    />

                    {/* Center pulsing dot */}
                    <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-8 rounded-full bg-gradient-to-br from-[#00B1FF] to-emerald-500"
                    />
                </div>

                {/* Text */}
                <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-xl font-bold text-[var(--foreground)] mb-2"
                >
                    {message}
                </motion.h2>

                {submessage && (
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-[var(--foreground)] opacity-50 text-sm"
                    >
                        {submessage}
                    </motion.p>
                )}

                {/* Animated dots */}
                <div className="flex gap-1 mt-6">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            animate={{
                                y: [0, -8, 0],
                                opacity: [0.3, 1, 0.3]
                            }}
                            transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                delay: i * 0.15,
                                ease: "easeInOut"
                            }}
                            className="w-2 h-2 rounded-full bg-[#00B1FF]"
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
