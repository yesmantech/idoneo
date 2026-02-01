/**
 * @file ThemeContext.tsx
 * @description Dark/light theme management with system preference support.
 *
 * This provider manages the application's color scheme with three modes:
 * - **light**: Force light mode
 * - **dark**: Force dark mode
 * - **system**: Follow OS preference (default)
 *
 * ## How It Works
 * - Adds/removes `dark` class on `<html>` element
 * - Tailwind's `darkMode: 'class'` picks up the class
 * - CSS variables in `index.css` update accordingly
 * - Preference persisted in localStorage
 *
 * ## Usage
 * ```tsx
 * import { useTheme } from '@/context/ThemeContext';
 *
 * function ThemeToggle() {
 *   const { theme, setTheme, resolvedTheme } = useTheme();
 *   return (
 *     <button onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
 *       {resolvedTheme === 'dark' ? '☀️' : '🌙'}
 *     </button>
 *   );
 * }
 * ```
 */

import React, { createContext, useContext, useEffect, useState } from 'react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** Available theme modes */
type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    resolvedTheme: 'light' | 'dark';
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('theme') as Theme) || 'system';
        }
        return 'system';
    });

    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        const root = window.document.documentElement;

        const applyTheme = (isDark: boolean) => {
            if (isDark) {
                root.classList.add('dark');
                setResolvedTheme('dark');
            } else {
                root.classList.remove('dark');
                setResolvedTheme('light');
            }
        };

        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            applyTheme(mediaQuery.matches);

            const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
            mediaQuery.addEventListener('change', handler);
            return () => mediaQuery.removeEventListener('change', handler);
        } else {
            applyTheme(theme === 'dark');
        }
    }, [theme]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
