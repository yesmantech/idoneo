import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface BackButtonProps {
    /** Visual variant — 'glass' for colored/dark backgrounds, 'default' for light/white */
    variant?: 'glass' | 'default';
    /** Override the navigate(-1) behavior */
    onClick?: () => void;
    className?: string;
}

/**
 * Tier S — Apple-style back button.
 * Used consistently across the entire app.
 *
 * glass   → frosted white/translucent circle (category headers, AI coach, dark pages)
 * default → subtle gray fill circle (white/light background pages)
 */
export default function BackButton({ variant = 'default', onClick, className = '' }: BackButtonProps) {
    const navigate = useNavigate();

    const handleClick = () => {
        if (onClick) onClick();
        else navigate(-1);
    };

    const variantClasses = variant === 'glass'
        ? 'bg-white/25 border border-white/30 text-white backdrop-blur-md shadow-[0_2px_12px_rgba(0,0,0,0.18)] hover:bg-white/35 active:scale-90'
        : 'bg-[var(--card)] border border-[var(--card-border)] text-[var(--foreground)] hover:bg-[var(--card-border)] active:scale-90';

    return (
        <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={handleClick}
            aria-label="Torna indietro"
            className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-150 ${variantClasses} ${className}`}
        >
            {/* Apple SF-style chevron — slightly heavier weight */}
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 -ml-px"
            >
                <path d="M15 18l-6-6 6-6" />
            </svg>
        </motion.button>
    );
}
