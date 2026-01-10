import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSidebar } from '@/context/SidebarContext';
import { useAuth } from '@/context/AuthContext';
import MobileDrawer from './MobileDrawer';
import { Home, User, Trophy, Newspaper, Shield, Heart, Briefcase, ChevronLeft, ChevronRight, LogIn } from 'lucide-react';
import { StreakBadge } from '../gamification/StreakBadge';

const MENU_ITEMS = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: User, label: 'Profilo', path: '/profile' },
    { icon: Trophy, label: 'Classifica', path: '/leaderboard' },
    { icon: Newspaper, label: 'Blog & News', path: '/blog' },
];

const SECONDARY_ITEMS = [
    { icon: Shield, label: 'Forze Armate', path: '/concorsi/forze-armate' },
    { icon: Heart, label: 'Sanità', path: '/concorsi/sanita' },
    { icon: Briefcase, label: 'Amministrativi', path: '/concorsi/amministrativi' },
];

function NavItem({ item, collapsed }: { item: typeof MENU_ITEMS[0]; collapsed: boolean; key?: React.Key }) {
    const location = useLocation();
    const { setMobileOpen } = useSidebar();
    const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
    const Icon = item.icon;

    return (
        <Link
            to={item.path}
            className={`group relative flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${isActive
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:bg-white/60 hover:text-slate-700'
                }`}
            title={collapsed ? item.label : undefined}
            onClick={() => setMobileOpen(false)}
        >
            {/* Active Indicator */}
            {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#00B1FF] rounded-full" />}

            <span className={`flex justify-center transition-all ${collapsed ? 'w-full' : 'w-5'}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#00B1FF]' : 'text-slate-400 group-hover:text-slate-500'}`} />
            </span>

            {!collapsed && (
                <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                    {item.label}
                </span>
            )}

            {isActive && !collapsed && (
                <div className="ml-auto w-2 h-2 rounded-full bg-[#00B1FF] shadow-[0_0_8px_rgba(0,177,255,0.5)]" />
            )}
        </Link>
    );
}

function SidebarContent({ collapsed }: { collapsed: boolean }) {
    const { toggleCollapse, setMobileOpen } = useSidebar();
    const { user, profile } = useAuth();

    return (
        <div className="flex flex-col h-full bg-[#F5F5F7]">
            {/* Logo Area */}
            <div className={`flex items-center gap-3 p-6 h-20 ${collapsed ? 'justify-center p-4' : ''} transition-all`}>
                <Link to="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
                    <div className="w-10 h-10 bg-gradient-to-br from-[#00B1FF] to-[#0091D5] rounded-[14px] flex items-center justify-center text-white font-black text-xl shadow-md shadow-[#00B1FF]/20 hover:scale-105 transition-transform shrink-0">
                        I
                    </div>
                    {!collapsed && (
                        <span className="text-slate-900 font-black text-xl tracking-tight whitespace-nowrap">
                            IDONEO
                        </span>
                    )}
                </Link>
                {!collapsed && (
                    <button
                        onClick={toggleCollapse}
                        className="ml-auto p-2 text-slate-400 hover:text-[#00B1FF] bg-white hover:bg-[#00B1FF]/10 rounded-xl transition-colors hidden lg:flex items-center justify-center shadow-sm"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Separator / Toggle (Collapsed mode only) */}
            {collapsed && (
                <div className="px-4 pb-4 hidden lg:flex justify-center">
                    <button
                        onClick={toggleCollapse}
                        className="p-2 text-slate-400 hover:text-[#00B1FF] bg-white hover:bg-[#00B1FF]/10 rounded-xl transition-colors shadow-sm"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Scrollable Nav */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <div className="px-3 space-y-6 pb-8">
                    {/* Primary */}
                    <div className="space-y-1">
                        {MENU_ITEMS.map(item => <NavItem key={item.path} item={item} collapsed={collapsed} />)}
                    </div>

                    {/* Secondary */}
                    <div>
                        {!collapsed && (
                            <h3 className="px-4 text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3">
                                Categorie
                            </h3>
                        )}
                        {collapsed && <div className="h-4"></div>}
                        <div className="space-y-1">
                            {SECONDARY_ITEMS.map(item => <NavItem key={item.path} item={item as any} collapsed={collapsed} />)}
                        </div>
                    </div>
                </div>
            </div>

            {/* User Footer with Streak */}
            <div className={`p-4 border-t border-slate-200/50 bg-white ${collapsed ? 'flex flex-col gap-2 items-center' : ''}`}>

                {/* Streak Badge (Tier S) */}
                <StreakBadge collapsed={collapsed} />

                <Link
                    to={user ? "/profile" : "/login"}
                    className={`flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-all group ${collapsed ? 'justify-center w-full' : ''}`}
                    onClick={() => setMobileOpen(false)}
                >
                    {user && profile?.avatar_url ? (
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden ring-2 ring-transparent group-hover:ring-[#00B1FF]/20 transition-all shadow-sm shrink-0">
                            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#00B1FF]/10 group-hover:text-[#00B1FF] ring-2 ring-transparent group-hover:ring-[#00B1FF]/20 transition-all shadow-sm shrink-0">
                            {user ? <User className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                        </div>
                    )}

                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate group-hover:text-[#00B1FF] transition-colors">
                                {user ? (profile?.nickname || user.email?.split('@')[0]) : 'Accedi'}
                            </p>
                            <p className="text-xs text-slate-400 truncate font-medium">
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
                className={`hidden lg:flex flex-col bg-[#F5F5F7] border-r border-slate-200/50 h-screen sticky top-0 flex-shrink-0 transition-[width] duration-300 ease-in-out ${isCollapsed ? 'w-24' : 'w-72'}`}
            >
                <SidebarContent collapsed={isCollapsed} />
            </aside>

            {/* Mobile Drawer */}
            <MobileDrawer />
        </>
    );
}
