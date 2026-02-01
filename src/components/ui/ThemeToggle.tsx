/**
 * @file ThemeToggle.tsx
 * @description Theme switcher components with light/dark/system modes.
 *
 * This module exports two theme toggle components:
 *
 * ## ThemeToggle (default export)
 *
 * Segmented control for selecting theme mode with three options:
 * - Light (sun icon, amber)
 * - Dark (moon icon, indigo)
 * - System (monitor icon, cyan)
 *
 * | Prop       | Type    | Default | Description                    |
 * |------------|---------|---------|--------------------------------|
 * | `className`| string  | ''      | Additional CSS classes         |
 * | `compact`  | boolean | false   | Single-button cycle mode       |
 *
 * ## SimpleThemeToggle (named export)
 *
 * iOS-style toggle switch for light/dark only (no system option).
 * Uses `resolvedTheme` to show actual mode when system is selected.
 *
 * | Prop       | Type   | Default | Description            |
 * |------------|--------|---------|------------------------|
 * | `className`| string | ''      | Additional CSS classes |
 *
 * @example
 * ```tsx
 * import ThemeToggle, { SimpleThemeToggle } from '@/components/ui/ThemeToggle';
 *
 * // Segmented control (full)
 * <ThemeToggle />
 *
 * // Compact single-button
 * <ThemeToggle compact />
 *
 * // Simple switch
 * <SimpleThemeToggle />
 * ```
 */

import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { hapticLight } from '@/lib/haptics';

// ============================================================================
// THEME TOGGLE - Segmented Control
// ============================================================================

interface ThemeToggleProps {
    className?: string;
    compact?: boolean;
}

export default function ThemeToggle({ className = '', compact = false }: ThemeToggleProps) {
    const { theme, setTheme } = useTheme();

    const options = [
        { value: 'light' as const, icon: Sun, label: 'Chiaro' },
        { value: 'dark' as const, icon: Moon, label: 'Scuro' },
        { value: 'system' as const, icon: Monitor, label: 'Sistema' },
    ];

    const handleChange = (value: 'light' | 'dark' | 'system') => {
        hapticLight();
        setTheme(value);
    };

    if (compact) {
        return (
            <button
                onClick={() => {
                    const themes = ['light', 'dark', 'system'] as const;
                    const currentIndex = themes.indexOf(theme);
                    const nextIndex = (currentIndex + 1) % themes.length;
                    handleChange(themes[nextIndex]);
                }}
                className={`p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all btn-bounce ${className}`}
                aria-label="Cambia tema"
            >
                {theme === 'light' && <Sun className="w-5 h-5 text-amber-500" />}
                {theme === 'dark' && <Moon className="w-5 h-5 text-indigo-400" />}
                {theme === 'system' && <Monitor className="w-5 h-5 text-slate-500" />}
            </button>
        );
    }

    return (
        <div className={`bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl inline-flex ${className}`}>
            {options.map((option) => {
                const isActive = theme === option.value;
                const Icon = option.icon;

                return (
                    <button
                        key={option.value}
                        onClick={() => handleChange(option.value)}
                        className={`
                            relative flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm
                            transition-all duration-200 ease-out
                            ${isActive
                                ? 'bg-white dark:bg-slate-700 text-[var(--foreground)] shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }
                        `}
                        aria-pressed={isActive}
                    >
                        <Icon className={`w-4 h-4 ${isActive
                            ? option.value === 'light'
                                ? 'text-amber-500'
                                : option.value === 'dark'
                                    ? 'text-indigo-400'
                                    : 'text-[#00B1FF]'
                            : ''
                            }`} />
                        <span className="hidden sm:inline">{option.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

// =============================================================================
// SIMPLE TOGGLE - Just light/dark without system option
// =============================================================================
export function SimpleThemeToggle({ className = '' }: { className?: string }) {
    const { resolvedTheme, setTheme } = useTheme();

    const toggleTheme = () => {
        hapticLight();
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    };

    return (
        <button
            onClick={toggleTheme}
            className={`
                relative w-14 h-8 rounded-full p-1
                bg-slate-200 dark:bg-slate-700
                transition-colors duration-300 ease-out
                focus:outline-none focus:ring-2 focus:ring-[#00B1FF] focus:ring-offset-2
                ${className}
            `}
            role="switch"
            aria-checked={resolvedTheme === 'dark'}
            aria-label="Toggle dark mode"
        >
            {/* Track Icons */}
            <div className="absolute inset-0 flex items-center justify-between px-2">
                <Sun className="w-3.5 h-3.5 text-amber-500 opacity-60" />
                <Moon className="w-3.5 h-3.5 text-indigo-400 opacity-60" />
            </div>

            {/* Thumb */}
            <div
                className={`
                    relative w-6 h-6 rounded-full bg-white shadow-md
                    transform transition-transform duration-300 ease-out
                    flex items-center justify-center
                    ${resolvedTheme === 'dark' ? 'translate-x-6' : 'translate-x-0'}
                `}
            >
                {resolvedTheme === 'dark'
                    ? <Moon className="w-3.5 h-3.5 text-indigo-500" />
                    : <Sun className="w-3.5 h-3.5 text-amber-500" />
                }
            </div>
        </button>
    );
}
