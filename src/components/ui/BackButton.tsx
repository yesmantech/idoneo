import React from 'react';
import { useNavigate } from 'react-router-dom';
import { hapticLight } from '@/lib/haptics';

interface BackButtonProps {
    /** Optional label — defaults to none (chevron only). Pass a string to show iOS-style "< Label" */
    label?: string;
    /** Override the navigate(-1) behavior */
    onClick?: () => void;
    /** Visual variant:
     *  - 'default' — dark text for light backgrounds
     *  - 'glass'   — white text for dark/image backgrounds with liquid glass blur
     */
    variant?: 'glass' | 'default';
    className?: string;
}

/**
 * iOS-native-style back button.
 * Renders a left chevron (‹) with optional text label, matching the native
 * UINavigationBar back button appearance. Supports a liquid-glass variant
 * for use on dark/image backgrounds.
 */
export default function BackButton({ label, onClick, variant = 'default', className = '' }: BackButtonProps) {
    const navigate = useNavigate();

    const handleClick = () => {
        hapticLight();
        if (onClick) onClick();
        else navigate(-1);
    };

    const isGlass = variant === 'glass';

    return (
        <button
            onClick={handleClick}
            aria-label="Torna indietro"
            className={`
                flex items-center gap-0.5 
                active:opacity-50 transition-opacity duration-100
                ${isGlass
                    ? 'text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]'
                    : 'text-[#007AFF]'
                }
                ${className}
            `}
        >
            {/* iOS-native chevron — matches SF Symbols chevron.left */}
            <svg
                viewBox="0 0 12 20"
                fill="none"
                className="w-[11px] h-[20px] -mr-px"
            >
                <path
                    d="M10 2L2 10L10 18"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
            {label && (
                <span className="text-[17px] font-normal tracking-[-0.01em]">
                    {label}
                </span>
            )}
        </button>
    );
}
