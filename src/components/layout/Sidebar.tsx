import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSidebar } from '@/context/SidebarContext';

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

function NavItem({ item, collapsed }: { item: any; collapsed: boolean; key?: React.Key }) {
    const location = useLocation();
    const { setMobileOpen } = useSidebar();
    const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));

    return (
        <Link
            to={item.path}
            className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                ? 'bg-slate-800 text-emerald-400 shadow-lg shadow-emerald-900/10'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
            title={collapsed ? item.label : undefined}
            onClick={() => setMobileOpen(false)}
        >
            <span className={`text-xl flex justify-center transition-all ${collapsed ? 'w-full' : 'w-6'}`}>
                {item.icon}
            </span>

            {!collapsed && (
                <span className="whitespace-nowrap overflow-hidden text-ellipsis animate-in fade-in slide-in-from-left-2 duration-300">
                    {item.label}
                </span>
            )}

            {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            )}
        </Link>
    );
}

import { useAuth } from '@/context/AuthContext';

function SidebarContent({ collapsed }: { collapsed: boolean }) {
    const { toggleCollapse, setMobileOpen } = useSidebar();
    const { user, profile } = useAuth(); // Assuming AuthContext provides user & profile

    return (
        <div className="flex flex-col h-full">
            {/* Logo Area */}
            <div className={`flex items-center gap-3 p-6 h-20 ${collapsed ? 'justify-center p-4' : ''} transition-all`}>
                <Link to="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                    <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-500/20 shrink-0">
                        I
                    </div>
                    {!collapsed && (
                        <span className="text-white font-bold text-xl tracking-tight whitespace-nowrap animate-in fade-in">
                            IDONEO
                        </span>
                    )}
                </Link>
                {!collapsed && (
                    <button
                        onClick={toggleCollapse}
                        className="ml-auto p-1.5 text-slate-500 hover:text-white bg-slate-800/50 hover:bg-slate-700 rounded-lg transition-colors hidden lg:block"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                )}
            </div>

            {/* Separator / Toggle (Collapsed mode only) */}
            {collapsed && (
                <div className="px-4 pb-4 hidden lg:flex justify-center">
                    <button
                        onClick={toggleCollapse}
                        className="p-2 text-slate-500 hover:text-white bg-slate-800/50 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                </div>
            )}

            {/* Scrollable Nav */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                <div className="px-3 space-y-8 pb-8">
                    {/* Primary */}
                    <div className="space-y-1">
                        {MENU_ITEMS.map(item => <NavItem key={item.path} item={item} collapsed={collapsed} />)}
                    </div>

                    {/* Secondary */}
                    <div>
                        {!collapsed && (
                            <h3 className="px-3 text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-2 animate-in fade-in">
                                Categorie
                            </h3>
                        )}
                        {collapsed && <div className="h-4"></div>}
                        <div className="space-y-1">
                            {SECONDARY_ITEMS.map(item => <NavItem key={item.path} item={item} collapsed={collapsed} />)}
                        </div>
                    </div>

                    {/* Promo Box */}
                    {!collapsed && (
                        <div className="mx-1 p-5 rounded-2xl bg-gradient-to-br from-emerald-900/40 to-slate-800/50 border border-emerald-500/10 animate-in zoom-in-95 duration-300">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-emerald-400">🔥</span>
                                <p className="text-xs text-white font-bold uppercase tracking-wide">Premium</p>
                            </div>
                            <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                                Sblocca simulazioni illimitate e tutor IA.
                            </p>
                            <button className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40">
                                Upgrade ora
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* User Footer */}
            <div className={`p-4 border-t border-slate-800 bg-slate-900 ${collapsed ? 'flex justify-center' : ''}`}>
                <Link to={user ? "/profile" : "/login"} className={`flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800 transition-colors group ${collapsed ? 'justify-center' : ''}`}>
                    {user && profile?.avatar_url ? (
                        <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden ring-2 ring-slate-800 group-hover:ring-slate-700 transition-all">
                            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-300 group-hover:bg-slate-600 ring-2 ring-slate-800 group-hover:ring-slate-700 transition-all">
                            {user ? '👤' : '🔑'}
                        </div>
                    )}

                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-200 truncate group-hover:text-white">
                                {user ? (profile?.nickname || user.email?.split('@')[0]) : 'Accedi'}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                                {user ? 'Visualizza profilo' : 'Per salvare i progressi'}
                            </p>
                        </div>
                    )}
                </Link>
            </div>
        </div>
    );
}

import MobileDrawer from './MobileDrawer';

export default function Sidebar() {
    const { isCollapsed, setMobileOpen } = useSidebar();

    return (
        <>
            {/* Desktop Sidebar */}
            <aside
                className={`hidden lg:flex flex-col bg-slate-900 border-r border-slate-800 h-screen sticky top-0 flex-shrink-0 transition-[width] duration-300 ease-in-out ${isCollapsed ? 'w-24' : 'w-72'}`}
            >
                <SidebarContent collapsed={isCollapsed} />
            </aside>

            {/* Mobile Drawer (Extracted) */}
            <MobileDrawer />
        </>
    );
}
