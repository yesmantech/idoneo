/**
 * @file TierSLoader.tsx
 * @description Premium full-screen loading screen — updated to match the new
 * Idoneo app aesthetic (minimal, iOS-style, dark-first).
 *
 * Visual design:
 * - Full-screen background matching app theme (--background)
 * - Centered app icon (rounded-[28px] glassmorphism style)
 * - "idoneo" wordmark in bold Inter
 * - Subtle animated progress bar shimmer
 * - Soft fade-in on mount
 */

"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface LoaderProps {
    message?: string;
    submessage?: string;
}

export default function TierSLoader({
    message,
    submessage,
}: LoaderProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[var(--background)]"
        >
            {/* ── APP ICON ── */}
            <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                className="mb-5"
            >
                <div
                    className="w-20 h-20 rounded-[22px] flex items-center justify-center shadow-xl"
                    style={{
                        background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 50%, #8b5cf6 100%)',
                        boxShadow: '0 16px 48px rgba(14, 165, 233, 0.35), 0 4px 12px rgba(0,0,0,0.2)',
                    }}
                >
                    {/* Target / bullseye icon matching the app logo */}
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Outer ring */}
                        <circle cx="20" cy="20" r="17" stroke="rgba(255,255,255,0.5)" strokeWidth="2" fill="none" />
                        {/* Middle ring */}
                        <circle cx="20" cy="20" r="11" stroke="rgba(255,255,255,0.75)" strokeWidth="2" fill="none" />
                        {/* Inner filled dot */}
                        <circle cx="20" cy="20" r="5" fill="white" />
                        {/* Arrow shaft */}
                        <line x1="30" y1="10" x2="22" y2="18" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                        {/* Arrow tip */}
                        <polyline points="25,10 30,10 30,15" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                </div>
            </motion.div>

            {/* ── WORDMARK ── */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="flex flex-col items-center gap-1 mb-10"
            >
                <span
                    className="text-[28px] font-black tracking-tight text-[var(--foreground)]"
                    style={{ letterSpacing: '-0.03em' }}
                >
                    idoneo
                </span>
                {(message || submessage) && (
                    <span className="text-[13px] text-[var(--foreground)] opacity-40 font-medium">
                        {message ?? submessage}
                    </span>
                )}
            </motion.div>

            {/* ── PROGRESS BAR ── */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="w-[120px] h-[3px] rounded-full overflow-hidden"
                style={{ background: 'rgba(0,0,0,0.08)' }}
            >
                <div
                    className="h-full rounded-full"
                    style={{
                        background: 'linear-gradient(90deg, transparent, #00B1FF, transparent)',
                        backgroundSize: '200% 100%',
                        animation: 'loaderShimmer 1.4s ease-in-out infinite',
                    }}
                />
            </motion.div>

            <style>{`
                @keyframes loaderShimmer {
                    0%   { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
            `}</style>
        </motion.div>
    );
}
