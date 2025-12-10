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
                className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
                onClick={() => setMobileOpen(false)}
            />

            {/* Drawer */}
            <div
                className={`fixed top-0 left-0 bottom-0 w-[280px] bg-slate-900 z-50 lg:hidden shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col border-r border-slate-800`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-800">
                    <Link to="/" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
                        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/20">
                            I
                        </div>
                        <span className="text-white font-bold text-lg tracking-tight">IDONEO</span>
                    </Link>
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="p-2 -mr-2 text-slate-500 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
                    {/* Main Nav */}
                    <div className="space-y-1">
                        {MENU_ITEMS.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setMobileOpen(false)}
                                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
                                        ? 'bg-slate-800 text-emerald-400 font-bold'
                                        : 'text-slate-400 font-medium hover:text-white hover:bg-slate-800/50'
                                    }`}
                            >
                                <span className="text-xl">{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </div>

                    {/* Categories */}
                    <div>
                        <h3 className="px-3 text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Categorie</h3>
                        <div className="space-y-1">
                            {SECONDARY_ITEMS.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setMobileOpen(false)}
                                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-400 font-medium hover:text-white hover:bg-slate-800/50 transition-all"
                                >
                                    <span className="text-lg">{item.icon}</span>
                                    <span>{item.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Promo */}
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-900/40 to-slate-800/50 border border-emerald-500/10">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-emerald-400">🔥</span>
                            <p className="text-xs text-white font-bold uppercase tracking-wide">Premium</p>
                        </div>
                        <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                            Sblocca simulazioni illimitate e tutor IA.
                        </p>
                        <button className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all">
                            Upgrade ora
                        </button>
                    </div>
                </div>

                {/* Footer / User */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                    <Link
                        to={user ? "/profile" : "/login"}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all"
                    >
                        {user && profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-900" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 ring-2 ring-slate-900">
                                {user ? '👤' : '🔑'}
                            </div>
                        )}
                        <div>
                            <p className="text-sm font-bold text-white truncate max-w-[150px]">
                                {user ? (profile?.nickname || 'Utente') : 'Accedi'}
                            </p>
                            <p className="text-xs text-slate-400">
                                {user ? 'Visualizza profilo' : 'Per salvare i progressi'}
                            </p>
                        </div>
                    </Link>
                </div>
            </div>
        </>
    );
}
