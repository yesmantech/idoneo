/**
 * @file useKeyboardShortcuts.ts
 * @description Keyboard shortcut hooks for accessibility and power users.
 *
 * This module provides three hooks for common keyboard interaction patterns:
 *
 * ## Hooks
 *
 * | Hook                   | Purpose                          |
 * |------------------------|----------------------------------|
 * | `useKeyboardShortcuts` | Generic multi-shortcut handler   |
 * | `useEscapeKey`         | Modal/overlay close handler      |
 * | `useSearchShortcut`    | Cmd/Ctrl+K spotlight search      |
 *
 * ## Modifier Support
 *
 * Shortcuts can require modifiers:
 * - `ctrl` - Control key (maps to Cmd on Mac)
 * - `meta` - Command/Windows key (maps to Ctrl on Windows)
 * - `alt` - Option/Alt key
 * - `shift` - Shift key
 *
 * ## Cross-Platform
 *
 * The hooks treat Cmd (Mac) and Ctrl (Windows) as equivalent for
 * better cross-platform compatibility.
 *
 * @example
 * ```tsx
 * import { useKeyboardShortcuts, useEscapeKey } from '@/hooks/useKeyboardShortcuts';
 *
 * function Modal({ onClose }) {
 *   useEscapeKey(onClose);
 *   return <div>Modal Content</div>;
 * }
 *
 * function App() {
 *   useKeyboardShortcuts({
 *     'k': { handler: openSearch, meta: true },
 *     '/': { handler: focusSearch }
 *   });
 * }
 * ```
 */

import { useEffect, useCallback } from 'react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

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
