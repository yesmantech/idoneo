import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useSidebar } from '@/context/SidebarContext';
import AdminSidebar from '../admin/AdminSidebar';
import InstallPrompt from '../pwa/InstallPrompt';
import { Home, Search, BookOpen, BarChart3, User, Trophy, Newspaper, Scroll, Sparkles } from 'lucide-react';
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
    const isSuperUser = user?.email === 'alessandro.valenza22@gmail.com';

    // DEV MODE: Skip waitlist lock on localhost
    const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';

    // IMMEDIATE UNLOCK FOR SUPERUSER
    if (isSuperUser) {
        // No checks. Just render.
    } else if (!loading && !isLocalhost) {
        if (!user && !isAdmin) {
            // Guest in App -> Waitlist
            return <Navigate to="/waitlist" replace />;
        }
        // Allow if: Admin Role OR Admin Route. SuperUser is handled above (falls through).
        if (user && profile?.role !== 'admin' && !isAdmin) {
            // User in App -> Success Page
            return <Navigate to="/waitlist/success" replace />;
        }
    }

    // Bottom Nav Items - Updated for Idoneo
    const NAV_ITEMS = [
        { Icon: Home, label: 'Home', path: '/' },
        { Icon: Scroll, label: 'Bandi', path: '/bandi' },
        { Icon: Sparkles, label: 'AI', path: '/ai-assistant', isAI: true },
        { Icon: Trophy, label: 'Classifica', path: '/leaderboard' },
        { Icon: User, label: 'Profilo', path: '/profile' },
    ];

    // Check if running as native app
    const isNativeApp = Capacitor.isNativePlatform();

    // Check if on pages where bottom nav should be hidden (blog, concorsi, quiz, bandi detail)
    const hideBottomNav = location.pathname.startsWith('/blog') ||
        location.pathname.startsWith('/concorsi') ||
        location.pathname.startsWith('/quiz') ||
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
        location.pathname.startsWith('/leaderboard');

    // Check if we're on the home page for the fixed top bar color
    const isHomePage = location.pathname === '/';

    // Check if we're on the leaderboard for full-height background
    const isLeaderboard = location.pathname.startsWith('/leaderboard');

    return (
        <div className="flex min-h-screen bg-[var(--background)] font-sans text-[var(--foreground)] transition-colors duration-300">
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
                    className={`flex-1 ${hideBottomNav ? 'pb-8' : (isLeaderboard ? 'pb-0' : 'pb-28')} lg:pb-8 animate-in fade-in duration-500`}
                    style={isNativeApp && !isAdmin && !hasOwnSafeArea ? { paddingTop: 'env(safe-area-inset-top, 0px)' } : undefined}
                >
                    {children}
                </main>

                {/* Mobile Bottom Navigation - Floating Pill Style (hidden on blog and concorsi) */}
                {!isAdmin && !hideBottomNav && (
                    <div
                        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-4"
                        style={{ paddingBottom: isNativeApp ? 'max(12px, env(safe-area-inset-bottom, 12px))' : '12px' }}
                    >
                        <div className="flex items-center gap-3">
                            {/* Nav Pill */}
                            <nav className="flex-1 bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-full px-2 py-2 flex justify-around items-center shadow-lg shadow-slate-900/5 dark:shadow-black/20">
                                {NAV_ITEMS.map(item => {
                                    const isActive = location.pathname === item.path ||
                                        (item.path !== '/' && location.pathname.startsWith(item.path));
                                    const isAI = (item as any).isAI;
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full transition-all
                                                        ${isActive
                                                    ? isAI
                                                        ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/20 shadow-sm'
                                                        : 'bg-white dark:bg-slate-700 shadow-sm'
                                                    : ''
                                                }`}
                                        >
                                            <item.Icon
                                                className={`w-5 h-5 transition-all ${isAI
                                                        ? 'text-purple-500'
                                                        : isActive
                                                            ? 'text-slate-900 dark:text-white'
                                                            : 'text-slate-500 dark:text-slate-400'
                                                    }`}
                                                strokeWidth={isActive ? 2.5 : 1.5}
                                            />
                                            <span className={`text-[10px] font-semibold ${isAI
                                                    ? 'bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent'
                                                    : isActive
                                                        ? 'text-slate-900 dark:text-white'
                                                        : 'text-slate-500 dark:text-slate-400'
                                                }`}>
                                                {item.label}
                                            </span>
                                        </Link>
                                    )
                                })}
                            </nav>
                        </div>
                    </div>
                )}

                {/* PWA Install Prompt */}
                {!isAdmin && <InstallPrompt />}
            </div>
        </div>
    );
}
