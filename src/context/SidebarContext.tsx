import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SidebarContextType {
    isCollapsed: boolean;
    isMobileOpen: boolean;
    toggleCollapse: () => void;
    toggleMobile: () => void;
    setMobileOpen: (open: boolean) => void;
}

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
