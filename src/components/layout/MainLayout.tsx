import React from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar';
import { useSidebar } from '@/context/SidebarContext';
import AdminSidebar from '../admin/AdminSidebar';
import BottomNavigation from './BottomNavigation';
import { isStandaloneApp } from '@/lib/standalone';
import { useAuth } from '@/context/AuthContext';

interface MainLayoutProps {
    children: React.ReactNode;
}

// Tier S page transition — instant content + subtle lift
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const pageVariants = {
    initial: { opacity: 0, y: 6 },
    enter: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.18, ease: EASE }
    },
    exit: {
        opacity: 0,
        y: -4,
        transition: { duration: 0.12, ease: EASE }
    }
};

export default function MainLayout({ children }: MainLayoutProps) {
    const { isCollapsed, setMobileOpen } = useSidebar();
    const location = useLocation();
    const isAdmin = location.pathname.startsWith('/admin');
    const { user, profile, loading } = useAuth();
    const isNativeApp = isStandaloneApp();

    // Check if on pages where bottom nav should be hidden
    const hideBottomNav = location.pathname.startsWith('/blog') ||
        location.pathname.startsWith('/concorsi') ||
        location.pathname.startsWith('/quiz') ||
        location.pathname.startsWith('/ai-assistant') ||
        location.pathname.startsWith('/come-funziona') ||
        location.pathname === '/profile/settings' ||
        location.pathname.startsWith('/profile/stats') ||
        location.pathname.startsWith('/preparazione') ||
        (location.pathname.startsWith('/bandi/') && location.pathname !== '/bandi/watchlist');

    // Pages that handle their own safe area in their headers
    const hasOwnSafeArea = location.pathname === '/' ||
        location.pathname.startsWith('/blog') ||
        location.pathname.startsWith('/concorsi') ||
        location.pathname.startsWith('/quiz') ||
        location.pathname.startsWith('/profile') ||
        location.pathname.startsWith('/leaderboard') ||
        location.pathname.startsWith('/bandi') ||
        location.pathname.startsWith('/conquiste') ||
        location.pathname.startsWith('/come-funziona') ||
        location.pathname.startsWith('/ai-assistant');

    const isLeaderboard = location.pathname.startsWith('/leaderboard');

    return (
        <div className="flex min-h-screen bg-[var(--background)] font-sans text-[var(--foreground)] transition-colors duration-300 overflow-hidden">
            {/* Cinematic Global Texture */}
            <div className="grain-overlay" aria-hidden="true" />

            {/* Safe area is handled per-page via pt-safe class */}

            {/* Sidebar (Desktop) & Drawer (Mobile) */}
            {isAdmin ? <AdminSidebar /> : <Sidebar />}

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0 transition-[margin] duration-300 ease-in-out">

                <AnimatePresence mode="wait" initial={false}>
                    <motion.main
                        key={location.pathname}
                        variants={pageVariants}
                        initial="initial"
                        animate="enter"
                        exit="exit"
                        className={`flex-1 ${hideBottomNav ? 'pb-8' : (isLeaderboard ? 'pb-0' : 'pb-20')} lg:pb-8`}
                        style={isNativeApp && !isAdmin && !hasOwnSafeArea ? { paddingTop: 'env(safe-area-inset-top, 0px)' } : undefined}
                    >
                        {children}
                    </motion.main>
                </AnimatePresence>

                {/* Bottom Navigation */}
                {!isAdmin && !hideBottomNav && <BottomNavigation />}
            </div>
        </div>
    );
}
