"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// ============================================
// SPOTLIGHT CONTEXT
// Global state for command palette / spotlight
// ============================================

interface SpotlightContextType {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
    recentSearches: string[];
    addRecentSearch: (query: string) => void;
    clearRecentSearches: () => void;
}

const SpotlightContext = createContext<SpotlightContextType | undefined>(undefined);

const RECENT_SEARCHES_KEY = 'idoneo_recent_searches';
const MAX_RECENT_SEARCHES = 5;

interface SpotlightProviderProps {
    children: ReactNode;
}

export function SpotlightProvider({ children }: SpotlightProviderProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    // Load recent searches from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
            if (stored) {
                setRecentSearches(JSON.parse(stored));
            }
        } catch (e) {
            console.warn('Failed to load recent searches:', e);
        }
    }, []);

    // Global keyboard shortcut: ⌘K (Mac) / Ctrl+K (Windows/Linux)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // ⌘K or Ctrl+K to toggle spotlight
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            // Escape to close
            if (e.key === 'Escape' && isOpen) {
                e.preventDefault();
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);
    const toggle = useCallback(() => setIsOpen(prev => !prev), []);

    const addRecentSearch = useCallback((query: string) => {
        if (!query.trim()) return;

        setRecentSearches(prev => {
            // Remove duplicate and add to front
            const filtered = prev.filter(s => s.toLowerCase() !== query.toLowerCase());
            const updated = [query, ...filtered].slice(0, MAX_RECENT_SEARCHES);

            // Persist to localStorage
            try {
                localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
            } catch (e) {
                console.warn('Failed to save recent searches:', e);
            }

            return updated;
        });
    }, []);

    const clearRecentSearches = useCallback(() => {
        setRecentSearches([]);
        try {
            localStorage.removeItem(RECENT_SEARCHES_KEY);
        } catch (e) {
            console.warn('Failed to clear recent searches:', e);
        }
    }, []);

    return (
        <SpotlightContext.Provider value={{
            isOpen,
            open,
            close,
            toggle,
            recentSearches,
            addRecentSearch,
            clearRecentSearches
        }}>
            {children}
        </SpotlightContext.Provider>
    );
}

export function useSpotlight() {
    const context = useContext(SpotlightContext);
    if (context === undefined) {
        throw new Error('useSpotlight must be used within a SpotlightProvider');
    }
    return context;
}

export default SpotlightContext;
