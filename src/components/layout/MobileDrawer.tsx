import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSidebar } from '@/context/SidebarContext';
import { useAuth } from '@/context/AuthContext';
import { Home, User, Trophy, Newspaper, Shield, Heart, Briefcase, X, LogIn } from 'lucide-react';

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

export default function MobileDrawer() {
    const { isMobileOpen, setMobileOpen } = useSidebar();
    const { user, profile } = useAuth();
    const location = useLocation();

    if (!isMobileOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
                onClick={() => setMobileOpen(false)}
            />

            {/* Drawer */}
            <div
                className="fixed top-0 left-0 bottom-0 w-[300px] bg-[#F5F5F7] z-50 lg:hidden shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-200/50 bg-white">
                    <Link to="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
                        <div className="w-10 h-10 bg-gradient-to-br from-[#00B1FF] to-[#0091D5] rounded-[14px] flex items-center justify-center text-white font-black text-xl shadow-md shadow-[#00B1FF]/20">
                            I
                        </div>
                        <span className="text-slate-900 font-black text-xl tracking-tight">IDONEO</span>
                    </Link>
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
                    {/* Main Nav */}
                    <div className="space-y-1">
                        {MENU_ITEMS.map((item) => {
                            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setMobileOpen(false)}
                                    className={`relative flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${isActive
                                        ? 'bg-white text-slate-900 font-bold shadow-sm'
                                        : 'text-slate-500 font-medium hover:text-slate-700 hover:bg-white/60'
                                        }`}
                                >
                                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#00B1FF] rounded-full" />}
                                    <Icon className={`w-5 h-5 ${isActive ? 'text-[#00B1FF]' : 'text-slate-400'}`} />
                                    <span>{item.label}</span>
                                    {isActive && (
                                        <div className="ml-auto w-2 h-2 rounded-full bg-[#00B1FF] shadow-[0_0_8px_rgba(0,177,255,0.5)]" />
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Categories */}
                    <div>
                        <h3 className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Categorie</h3>
                        <div className="space-y-1">
                            {SECONDARY_ITEMS.map((item) => {
                                const isActive = location.pathname === item.path;
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setMobileOpen(false)}
                                        className={`relative flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${isActive
                                            ? 'bg-white text-slate-900 font-bold shadow-sm'
                                            : 'text-slate-500 font-medium hover:text-slate-700 hover:bg-white/60'
                                            }`}
                                    >
                                        {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#00B1FF] rounded-full" />}
                                        <Icon className={`w-5 h-5 ${isActive ? 'text-[#00B1FF]' : 'text-slate-400'}`} />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer / User */}
                <div className="p-4 border-t border-slate-200/50 bg-white">
                    <Link
                        to={user ? "/profile" : "/login"}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-all group"
                    >
                        {user && profile?.avatar_url ? (
                            <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden ring-2 ring-transparent group-hover:ring-[#00B1FF]/20 transition-all shadow-sm">
                                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                        ) : (
                            <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#00B1FF]/10 group-hover:text-[#00B1FF] ring-2 ring-transparent group-hover:ring-[#00B1FF]/20 transition-all shadow-sm">
                                {user ? <User className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate max-w-[180px] group-hover:text-[#00B1FF] transition-colors">
                                {user ? (profile?.nickname || user.email?.split('@')[0]) : 'Accedi'}
                            </p>
                            <p className="text-xs text-slate-400 group-hover:text-slate-500 transition-colors">
                                {user ? 'Visualizza profilo' : 'Per salvare i progressi'}
                            </p>
                        </div>
                    </Link>
                </div>
            </div>
        </>
    );
}
