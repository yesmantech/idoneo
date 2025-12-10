import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useSidebar } from '@/context/SidebarContext';
import AdminSidebar from '../admin/AdminSidebar';

interface MainLayoutProps {
    children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
    const { isCollapsed, setMobileOpen } = useSidebar();
    const location = useLocation();
    const isAdmin = location.pathname.startsWith('/admin');

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

                {/* Mobile Header (Hamburger) */}
                <header className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-30">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold">I</div>
                        <span className="font-bold text-slate-800 tracking-tight">IDONEO</span>
                    </Link>
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="p-2 -mr-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                </header>

                <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8 animate-in fade-in duration-500">
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
