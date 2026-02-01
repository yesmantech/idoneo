/**
 * @file SidebarContext.tsx
 * @description Responsive sidebar state management for desktop and mobile.
 *
 * This provider manages two independent sidebar states:
 * - **Desktop (isCollapsed)**: Expanded/collapsed sidebar with persistence
 * - **Mobile (isMobileOpen)**: Full overlay sidebar (hamburger menu)
 *
 * ## Desktop Behavior
 * - Collapsed state persisted in localStorage
 * - Toggle via sidebar collapse button
 * - Shows icons only when collapsed
 *
 * ## Mobile Behavior
 * - Off-canvas overlay (not persisted)
 * - Toggle via hamburger button in header
 * - Auto-closes on navigation
 *
 * @example
 * ```tsx
 * import { useSidebar } from '@/context/SidebarContext';
 *
 * function Header() {
 *   const { toggleMobile } = useSidebar();
 *   return <button onClick={toggleMobile}>☰</button>;
 * }
 *
 * function Sidebar() {
 *   const { isCollapsed, toggleCollapse } = useSidebar();
 *   return (
 *     <aside className={isCollapsed ? 'w-16' : 'w-64'}>
 *       <button onClick={toggleCollapse}>{'<'}</button>
 *     </aside>
 *   );
 * }
 * ```
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Shape of the SidebarContext value.
 */
interface SidebarContextType {
    /** Desktop: true when sidebar is collapsed to icons-only mode */
    isCollapsed: boolean;
    /** Mobile: true when off-canvas sidebar overlay is visible */
    isMobileOpen: boolean;
    /** Toggle desktop collapsed/expanded state */
    toggleCollapse: () => void;
    /** Toggle mobile sidebar visibility */
    toggleMobile: () => void;
    /** Set mobile sidebar visibility directly */
    setMobileOpen: (open: boolean) => void;
}

// ============================================================================
// CONTEXT SETUP
// ============================================================================

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
    // Desktop: false = expanded (default), true = collapsed
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Mobile: false = closed (default), true = open
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Persist desktop preference
    useEffect(() => {
        const savedstate = localStorage.getItem('sidebar-collapsed');
        if (savedstate) {
            setIsCollapsed(JSON.parse(savedstate));
        }
    }, []);

    const toggleCollapse = () => {
        setIsCollapsed(prev => {
            const next = !prev;
            localStorage.setItem('sidebar-collapsed', JSON.stringify(next));
            return next;
        });
    };

    const toggleMobile = () => {
        setIsMobileOpen(prev => !prev);
    };

    const setMobileOpen = (open: boolean) => {
        setIsMobileOpen(open);
    };

    return (
        <SidebarContext.Provider value={{
            isCollapsed,
            isMobileOpen,
            toggleCollapse,
            toggleMobile,
            setMobileOpen
        }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (context === undefined) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
}
