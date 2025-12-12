import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSidebar } from '@/context/SidebarContext';
import { useAuth } from '@/context/AuthContext';
import MobileDrawer from './MobileDrawer';

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
            className={`group relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${isActive
                ? 'bg-canvas-light text-brand-cyan shadow-sm'
                : 'text-text-secondary hover:bg-canvas-light hover:text-text-primary'
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
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-cyan shadow-[0_0_8px_rgba(6,214,211,0.5)]" />
            )}
        </Link>
    );
}

function SidebarContent({ collapsed }: { collapsed: boolean }) {
    const { toggleCollapse, setMobileOpen } = useSidebar();
    const { user, profile } = useAuth();

    return (
        <div className="flex flex-col h-full bg-white text-text-primary">
            {/* Logo Area */}
            <div className={`flex items-center gap-3 p-6 h-20 ${collapsed ? 'justify-center p-4' : ''} transition-all`}>
                <Link to="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                    <div className="w-10 h-10 bg-brand-cyan rounded-squircle flex items-center justify-center text-white font-black text-xl shadow-soft hover:scale-105 transition-transform shrink-0">
                        I
                    </div>
                    {!collapsed && (
                        <span className="text-text-primary font-black text-xl tracking-tight whitespace-nowrap animate-in fade-in">
                            IDONEO
                        </span>
                    )}
                </Link>
                {!collapsed && (
                    <button
                        onClick={toggleCollapse}
                        className="ml-auto p-2 text-text-tertiary hover:text-brand-cyan bg-canvas-light hover:bg-brand-cyan/10 rounded-squircle transition-colors hidden lg:block"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                )}
            </div>

            {/* Separator / Toggle (Collapsed mode only) */}
            {collapsed && (
                <div className="px-4 pb-4 hidden lg:flex justify-center">
                    <button
                        onClick={toggleCollapse}
                        className="p-2 text-text-tertiary hover:text-brand-cyan bg-canvas-light hover:bg-brand-cyan/10 rounded-squircle transition-colors"
                    >
                        <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                </div>
            )}

            {/* Scrollable Nav */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                <div className="px-3 space-y-8 pb-8">
                    {/* Primary */}
                    <div className="space-y-1">
                        {MENU_ITEMS.map(item => <NavItem key={item.path} item={item} collapsed={collapsed} />)}
                    </div>

                    {/* Secondary */}
                    <div>
                        {!collapsed && (
                            <h3 className="px-3 text-[10px] uppercase tracking-widest font-bold text-text-tertiary mb-3 animate-in fade-in">
                                Categorie
                            </h3>
                        )}
                        {collapsed && <div className="h-4"></div>}
                        <div className="space-y-1">
                            {SECONDARY_ITEMS.map(item => <NavItem key={item.path} item={item} collapsed={collapsed} />)}
                        </div>
                    </div>

                </div>
            </div>

            {/* User Footer */}
            <div className={`p-4 border-t border-canvas-light bg-white ${collapsed ? 'flex justify-center' : ''}`}>
                <Link to={user ? "/profile" : "/login"} className={`flex items-center gap-3 p-2 rounded-xl hover:bg-canvas-light transition-colors group ${collapsed ? 'justify-center' : ''}`}>
                    {user && profile?.avatar_url ? (
                        <div className="w-10 h-10 rounded-squircle bg-canvas-light flex items-center justify-center overflow-hidden ring-2 ring-transparent group-hover:ring-brand-cyan/20 transition-all shadow-sm">
                            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-squircle bg-canvas-light flex items-center justify-center text-lg text-text-tertiary group-hover:bg-white group-hover:text-brand-cyan ring-2 ring-transparent group-hover:ring-brand-cyan/20 transition-all shadow-sm">
                            {user ? '👤' : '🔑'}
                        </div>
                    )}

                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-text-primary truncate group-hover:text-brand-cyan transition-colors">
                                {user ? (profile?.nickname || user.email?.split('@')[0]) : 'Accedi'}
                            </p>
                            <p className="text-xs text-text-tertiary truncate font-medium">
                                {user ? 'Visualizza profilo' : 'Per salvare i progressi'}
                            </p>
                        </div>
                    )}
                </Link>
            </div>
        </div>
    );
}

export default function Sidebar() {
    const { isCollapsed, setMobileOpen } = useSidebar();

    return (
        <>
            {/* Desktop Sidebar */}
            <aside
                className={`hidden lg:flex flex-col bg-white border-r border-transparent shadow-soft h-screen sticky top-0 flex-shrink-0 transition-[width] duration-300 ease-in-out ${isCollapsed ? 'w-24' : 'w-72'}`}
            >
                <SidebarContent collapsed={isCollapsed} />
            </aside>

            {/* Mobile Drawer */}
            <MobileDrawer />
        </>
    );
}
