/**
 * @file tailwind.config.js
 * @description Tailwind CSS configuration with custom design tokens.
 *
 * This configuration extends Tailwind with Idoneo's design system:
 *
 * ## Color Palette
 *
 * - **brand.***: Primary action colors (cyan, blue, orange, purple)
 * - **canvas.***: Background colors (white, light gray)
 * - **text.***: Typography colors (primary, secondary, tertiary)
 * - **semantic.***: Feedback colors (success green, error red)
 *
 * ## Typography
 *
 * - Primary font: Inter (Google Fonts)
 * - Fallback: San Francisco, SF Pro, system sans-serif
 *
 * ## Custom Utilities
 *
 * - **borderRadius**: squircle (22%), card (24px), pill, input (16px)
 * - **boxShadow**: soft, card
 * - **transitionTimingFunction**: ios (cubic-bezier for iOS-like motion)
 *
 * ## Dark Mode
 *
 * Uses class-based dark mode (`darkMode: 'class'`).
 * The `dark` class is toggled on `<html>` by ThemeContext.
 *
 * @see https://tailwindcss.com/docs/configuration
 */

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    cyan: '#06D6D3', // Primary Action
                    blue: '#0095FF', // Utility Action
                    orange: '#FF9F0A',
                    purple: '#5856D6',
                },
                canvas: {
                    white: '#FFFFFF',
                    light: '#F3F5F7', // App background - MATCHED SPEC
                },
                text: {
                    primary: '#111827',
                    secondary: '#6B7280',
                    tertiary: '#9CA3AF',
                },
                semantic: {
                    success: '#34C759',
                    error: '#FF3B30',
                    errorBg: '#FEF2F2',
                }
            },
            borderRadius: {
                'squircle': '22%', // Approximate for icons
                'card': '24px', // Cards/Modals
                'pill': '9999px', // Full Pill
                'input': '16px',
            },
            fontFamily: {
                sans: ['Inter', 'San Francisco', 'SF Pro', 'sans-serif'],
            },
            boxShadow: {
                'soft': '0 4px 20px rgba(0,0,0,0.05)',
                'card': '0 8px 40px rgba(0,0,0,0.08)',
            },
            transitionTimingFunction: {
                'ios': 'cubic-bezier(0.25, 0.8, 0.25, 1)',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-15px)' },
                },
                sparkle: {
                    '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
                    '50%': { opacity: '1', transform: 'scale(1.2)' },
                }
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'sparkle': 'sparkle 3s ease-in-out infinite',
            }
        },
    },
    plugins: [
        require("tailwindcss-animate")
    ],
}
