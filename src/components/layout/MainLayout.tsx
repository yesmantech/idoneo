import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useSidebar } from '@/context/SidebarContext';
import AdminSidebar from '../admin/AdminSidebar';
import InstallPrompt from '../pwa/InstallPrompt';
import { Home, Search, BookOpen, BarChart3, User, Trophy } from 'lucide-react';

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

    if (!loading && !isLocalhost) {
        if (!user && !isAdmin) {
            // Guest in App -> Waitlist
            return <Navigate to="/waitlist" replace />;
        }
        // Allow if: Admin Role OR SuperUser Email OR Admin Route
        if (user && profile?.role !== 'admin' && !isAdmin && !isSuperUser) {
            // User in App -> Success Page
            return <Navigate to="/waitlist/success" replace />;
        }
    }

    // Bottom Nav Items - Updated for Idoneo
    const NAV_ITEMS = [
        { Icon: Home, label: 'Home', path: '/' },
        { Icon: Search, label: 'Cerca', path: '/concorsi/tutti' },
        { Icon: BookOpen, label: 'Quiz', path: '/quiz' },
        { Icon: Trophy, label: 'Classifica', path: '/leaderboard' },
        { Icon: User, label: 'Profilo', path: '/profile' },
    ];

    return (
        <div className="flex min-h-screen bg-white font-sans text-slate-900">
            {/* Sidebar (Desktop) & Drawer (Mobile) */}
            {isAdmin ? <AdminSidebar /> : <Sidebar />}

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0 transition-[margin] duration-300 ease-in-out">

                <main className="flex-1 pb-24 lg:pb-8 pt-safe animate-in fade-in duration-500">
                    {children}
                </main>

                {/* Mobile Bottom Navigation - Idoneo Style */}
                {!isAdmin && (
                    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg 
                                    border-t border-slate-100 px-2 py-2 pb-safe z-40 
                                    flex justify-around items-center 
                                    shadow-[0_-4px_30px_rgba(0,0,0,0.06)]">
                        {NAV_ITEMS.map(item => {
                            const isActive = location.pathname === item.path ||
                                (item.path !== '/' && location.pathname.startsWith(item.path));
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all min-w-[60px]
                                                ${isActive
                                            ? 'text-[#00B1FF]'
                                            : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    <item.Icon
                                        className={`w-6 h-6 transition-all ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`}
                                        fill={isActive ? 'currentColor' : 'none'}
                                    />
                                    <span className={`text-[10px] font-semibold ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                                        {item.label}
                                    </span>
                                </Link>
                            )
                        })}
                    </nav>
                )}

                {/* PWA Install Prompt */}
                {!isAdmin && <InstallPrompt />}
            </div>
        </div>
    );
}
