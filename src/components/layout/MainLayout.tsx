import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useSidebar } from '@/context/SidebarContext';
import AdminSidebar from '../admin/AdminSidebar';
import InstallPrompt from '../pwa/InstallPrompt';
import BottomNavigation from './BottomNavigation';
import { Capacitor } from '@capacitor/core';

interface MainLayoutProps {
    children: React.ReactNode;
}

import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function MainLayout({ children }: MainLayoutProps) {
    const { isCollapsed, setMobileOpen } = useSidebar();
    const location = useLocation();
    const isAdmin = location.pathname.startsWith('/admin');

    // REDUNDANT WAITLIST LOCK:
    // Ensure only Admins can see the MainLayout (App).
    const { user, profile, loading } = useAuth();

    // IMMEDIATE UNLOCK FOR ALL USERS (Except Guests)
    if (!loading) {
        if (!user && !isAdmin) {
            // Guest -> Force Waitlist Landing
            // return <Navigate to="/waitlist" replace />;
        }
    }

    // Check if running as native app
    const isNativeApp = Capacitor.isNativePlatform();

    // Check if on pages where bottom nav should be hidden (blog, concorsi, quiz, bandi detail)
    const hideBottomNav = location.pathname.startsWith('/blog') ||
        location.pathname.startsWith('/concorsi') ||
        location.pathname.startsWith('/quiz') ||
        location.pathname === '/profile/settings' ||
        location.pathname.startsWith('/profile/stats') ||
        location.pathname.startsWith('/preparazione') ||
        location.pathname === '/ai-assistant' ||
        (location.pathname.startsWith('/bandi/') && location.pathname !== '/bandi/watchlist');

    // Pages that handle their own safe area in their headers
    const hasOwnSafeArea = location.pathname === '/' ||
        location.pathname.startsWith('/blog') ||
        location.pathname.startsWith('/concorsi') ||
        location.pathname.startsWith('/quiz') ||
        location.pathname.startsWith('/profile') ||
        location.pathname.startsWith('/leaderboard');

    // Check if we're on the leaderboard for full-height background
    const isLeaderboard = location.pathname.startsWith('/leaderboard');

    return (
        <div className="flex min-h-screen bg-[var(--background)] font-sans text-[var(--foreground)] transition-colors duration-300 overflow-hidden">
            {/* Cinematic Global Texture */}
            <div className="grain-overlay" aria-hidden="true" />

            {/* Fixed top safe area cover to prevent overscroll showing empty area */}
            {isNativeApp && !isAdmin && (
                <div
                    className="fixed top-0 left-0 right-0 z-[100]"
                    style={{
                        height: 'env(safe-area-inset-top, 0px)',
                        backgroundColor: 'var(--background)'
                    }}
                />
            )}

            {/* Sidebar (Desktop) & Drawer (Mobile) */}
            {isAdmin ? <AdminSidebar /> : <Sidebar />}

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0 transition-[margin] duration-300 ease-in-out">

                <main
                    className={`flex-1 ${hideBottomNav ? 'pb-8' : (isLeaderboard ? 'pb-0' : 'pb-20')} lg:pb-8 animate-in fade-in duration-500`}
                    style={isNativeApp && !isAdmin && !hasOwnSafeArea ? { paddingTop: 'env(safe-area-inset-top, 0px)' } : undefined}
                >
                    {children}
                </main>

                {/* Skitla-Style Bottom Navigation */}
                {!isAdmin && !hideBottomNav && <BottomNavigation />}

                {/* PWA Install Prompt */}
                {!isAdmin && <InstallPrompt />}
            </div>
        </div>
    );
}
