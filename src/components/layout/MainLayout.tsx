import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useSidebar } from '@/context/SidebarContext';
import AdminSidebar from '../admin/AdminSidebar';

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

    // DEV MODE: Skip waitlist lock on localhost
    const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';

    if (!loading && !isLocalhost) {
        if (!user && !isAdmin) {
            // Guest in App -> Waitlist
            return <Navigate to="/waitlist" replace />;
        }
        if (user && profile?.role !== 'admin' && !isAdmin) {
            // User in App -> Success Page
            return <Navigate to="/waitlist/success" replace />;
        }
    }


    // Bottom Nav Items
    const NAV_ITEMS = [
        { icon: '🏠', label: 'Home', path: '/' },
        { icon: '🏆', label: 'Classifica', path: '/leaderboard' },
        { icon: '👤', label: 'Profilo', path: '/profile' },
    ];

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Sidebar (Desktop) & Drawer (Mobile) */}
            {isAdmin ? <AdminSidebar /> : <Sidebar />}

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0 transition-[margin] duration-300 ease-in-out">

                <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8 pt-safe mt-4 lg:mt-0 animate-in fade-in duration-500">
                    {children}
                </main>

                {/* Mobile Bottom Navigation */}
                {!isAdmin && (
                    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-2 pb-safe z-40 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                        {NAV_ITEMS.map(item => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <span className={`text-2xl transition-transform ${isActive ? 'scale-110' : ''}`}>{item.icon}</span>
                                    <span className="text-[10px] font-bold uppercase tracking-wide">{item.label}</span>
                                </Link>
                            )
                        })}
                        <button
                            onClick={() => setMobileOpen(true)}
                            className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-slate-600"
                        >
                            <span className="text-2xl">☰</span>
                            <span className="text-[10px] font-bold uppercase tracking-wide">Menu</span>
                        </button>
                    </nav>
                )}
            </div>
        </div>
    );
}
