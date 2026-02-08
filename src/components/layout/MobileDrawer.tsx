import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSidebar } from '@/context/SidebarContext';
import { useAuth } from '@/context/AuthContext';
import { Home, User, Trophy, Newspaper, Shield, Heart, Briefcase, X, LogIn, Folder, Sparkles } from 'lucide-react';
import { StreakBadge } from '../gamification/StreakBadge';
import { type Category } from '@/lib/data';

const MENU_ITEMS = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: User, label: 'Profilo', path: '/profile' },
    { icon: Trophy, label: 'Classifica', path: '/leaderboard' },
    { icon: Newspaper, label: 'Blog & News', path: '/blog' },
];

// Map category slugs to icons
const CATEGORY_ICONS: Record<string, React.ElementType> = {
    'forze-armate': Shield,
    'sanita': Heart,
    'amministrativi': Briefcase,
};

interface MobileDrawerProps {
    categories: Category[];
}

export default function MobileDrawer({ categories }: MobileDrawerProps) {
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

                    {/* AI Section */}
                    <div>
                        <h3 className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Assistente AI</h3>
                        <Link
                            to="/ai-assistant"
                            onClick={() => setMobileOpen(false)}
                            className={`relative flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${location.pathname === '/ai-assistant'
                                    ? 'bg-gradient-to-r from-purple-500/10 to-cyan-500/10 text-slate-900 font-bold shadow-sm border border-purple-500/20'
                                    : 'text-slate-500 font-medium hover:bg-gradient-to-r hover:from-purple-500/5 hover:to-cyan-500/5'
                                }`}
                        >
                            {location.pathname === '/ai-assistant' && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-purple-500 to-cyan-500 rounded-full" />
                            )}
                            <Sparkles className={`w-5 h-5 ${location.pathname === '/ai-assistant' ? 'text-purple-500' : 'text-slate-400'
                                }`} />
                            <span className="bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent font-bold">
                                Chiedi all'AI
                            </span>
                            {location.pathname === '/ai-assistant' && (
                                <div className="ml-auto w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                            )}
                        </Link>
                    </div>
                    {categories.length > 0 && (
                        <div>
                            <h3 className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Categorie</h3>
                            <div className="space-y-1">
                                {categories.map((cat) => {
                                    const path = `/concorsi/${cat.slug}`;
                                    const isActive = location.pathname === path || location.pathname.startsWith(path);
                                    const Icon = CATEGORY_ICONS[cat.slug] || Folder;
                                    return (
                                        <Link
                                            key={cat.id}
                                            to={path}
                                            onClick={() => setMobileOpen(false)}
                                            className={`relative flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${isActive
                                                ? 'bg-white text-slate-900 font-bold shadow-sm'
                                                : 'text-slate-500 font-medium hover:text-slate-700 hover:bg-white/60'
                                                }`}
                                        >
                                            {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#00B1FF] rounded-full" />}
                                            <Icon className={`w-5 h-5 ${isActive ? 'text-[#00B1FF]' : 'text-slate-400'}`} />
                                            <span>{cat.title}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer / User */}
                <div className="p-4 border-t border-slate-200/50 bg-white">
                    {/* Tier S Streak Badge */}
                    <div className="mb-4">
                        <StreakBadge />
                    </div>

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

