import { useEffect, useCallback } from 'react';

type KeyboardHandler = (e: KeyboardEvent) => void;

interface ShortcutOptions {
    ctrl?: boolean;
    meta?: boolean;
    alt?: boolean;
    shift?: boolean;
    preventDefault?: boolean;
}

/**
 * Hook for handling keyboard shortcuts
 * @param shortcuts - Object mapping key names to handlers
 * @example
 * useKeyboardShortcuts({
 *   'k': { handler: openSearch, meta: true },
 *   'Escape': { handler: closeModal }
 * });
 */
export function useKeyboardShortcuts(
    shortcuts: Record<string, { handler: KeyboardHandler } & ShortcutOptions>
) {
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        const key = e.key.toLowerCase();
        const config = shortcuts[e.key] || shortcuts[key];

        if (!config) return;

        const { handler, ctrl, meta, alt, shift, preventDefault = true } = config;

        // Check modifier requirements
        const ctrlMatch = ctrl ? (e.ctrlKey || e.metaKey) : true;
        const metaMatch = meta ? (e.metaKey || e.ctrlKey) : true;
        const altMatch = alt ? e.altKey : true;
        const shiftMatch = shift ? e.shiftKey : true;

        // If any modifier is explicitly required, all must match
        if (ctrlMatch && metaMatch && altMatch && shiftMatch) {
            // Prevent default if configured
            if (preventDefault) {
                e.preventDefault();
            }
            handler(e);
        }
    }, [shortcuts]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}

/**
 * Hook for Escape key press - useful for closing modals
 */
export function useEscapeKey(handler: () => void, enabled = true) {
    useEffect(() => {
        if (!enabled) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                handler();
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [handler, enabled]);
}

/**
 * Hook for Command/Ctrl + K - search shortcut
 */
export function useSearchShortcut(handler: () => void, enabled = true) {
    useEffect(() => {
        if (!enabled) return;

        const handleSearch = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                handler();
            }
        };

        window.addEventListener('keydown', handleSearch);
        return () => window.removeEventListener('keydown', handleSearch);
    }, [handler, enabled]);
}
