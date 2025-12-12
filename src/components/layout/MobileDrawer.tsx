import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSidebar } from '@/context/SidebarContext';
import { useAuth } from '@/context/AuthContext';

// Reusing the items logic - we could export this from Sidebar or config
const MENU_ITEMS = [
    { icon: '🏠', label: 'Home', path: '/' },
    { icon: '👤', label: 'Profilo', path: '/profile' },
    { icon: '🏆', label: 'Classifica', path: '/leaderboard' },
    { icon: '📰', label: 'Blog & News', path: '/blog' },
];

const SECONDARY_ITEMS = [
    { icon: '👮', label: 'Forze Armate', path: '/concorsi/forze-armate' },
    { icon: '🏥', label: 'Sanità', path: '/concorsi/sanita' },
    { icon: '💼', label: 'Amministrativi', path: '/concorsi/amministrativi' },
];

export default function MobileDrawer() {
    const { isMobileOpen, setMobileOpen } = useSidebar();
    const { user, profile } = useAuth();
    const location = useLocation();

    if (!isMobileOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
                onClick={() => setMobileOpen(false)}
            />

            {/* Drawer */}
            <div
                className="fixed top-0 left-0 bottom-0 w-[280px] bg-white z-50 lg:hidden shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col border-r border-slate-100"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-canvas-light">
                    <Link to="/" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
                        <div className="w-9 h-9 bg-brand-cyan rounded-squircle flex items-center justify-center text-white font-black text-lg shadow-soft">
                            I
                        </div>
                        <span className="text-text-primary font-black text-xl tracking-tight">IDONEO</span>
                    </Link>
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="p-2 -mr-2 text-text-tertiary hover:text-text-primary hover:bg-canvas-light rounded-full transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
                    {/* Main Nav */}
                    <div className="space-y-1">
                        {MENU_ITEMS.map((item) => {
                            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setMobileOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-3.5 rounded-xl transition-all ${isActive
                                        ? 'bg-canvas-light text-brand-cyan font-bold shadow-sm'
                                        : 'text-text-secondary font-medium hover:text-text-primary hover:bg-canvas-light'
                                        }`}
                                >
                                    <span className="text-xl">{item.icon}</span>
                                    <span>{item.label}</span>
                                    {isActive && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-cyan shadow-[0_0_8px_rgba(6,214,211,0.5)]" />
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Categories */}
                    <div>
                        <h3 className="px-3 text-xs font-bold text-text-tertiary uppercase tracking-widest mb-3">Categorie</h3>
                        <div className="space-y-1">
                            {SECONDARY_ITEMS.map((item) => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setMobileOpen(false)}
                                        className={`flex items-center gap-3 px-3 py-3.5 rounded-xl transition-all ${isActive
                                            ? 'bg-canvas-light text-brand-cyan font-bold'
                                            : 'text-text-secondary font-medium hover:text-text-primary hover:bg-canvas-light'
                                            }`}
                                    >
                                        <span className="text-lg">{item.icon}</span>
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                </div>

                {/* Footer / User */}
                <div className="p-4 border-t border-canvas-light bg-white">
                    <Link
                        to={user ? "/profile" : "/login"}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-canvas-light transition-all group border border-transparent hover:border-canvas-light"
                    >
                        {user && profile?.avatar_url ? (
                            <div className="w-10 h-10 rounded-squircle bg-canvas-light flex items-center justify-center overflow-hidden ring-2 ring-transparent group-hover:ring-brand-cyan/20 transition-all shadow-sm">
                                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded-squircle bg-canvas-light flex items-center justify-center text-lg text-text-tertiary group-hover:bg-white group-hover:text-brand-cyan ring-2 ring-transparent group-hover:ring-brand-cyan/20 transition-all shadow-sm">
                                {user ? '👤' : '🔑'}
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-text-primary truncate max-w-[160px] group-hover:text-brand-cyan transition-colors">
                                {user ? (profile?.nickname || user.email?.split('@')[0]) : 'Accedi'}
                            </p>
                            <p className="text-xs text-text-tertiary group-hover:text-text-secondary transition-colors">
                                {user ? 'Visualizza profilo' : 'Per salvare i progressi'}
                            </p>
                        </div>
                    </Link>
                </div>
            </div>
        </>
    );
}
