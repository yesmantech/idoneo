import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

const navItems = [
    { path: "/admin", label: "Dashboard", exactMatch: true, color: "text-sky-400", borderColor: "border-sky-900", hoverBorder: "hover:border-sky-500" },
    { path: "/admin/questions", label: "Domande", exactMatch: false, color: "text-slate-300", borderColor: "border-slate-700", hoverBorder: "hover:border-slate-500" },
    { path: "/admin/structure", label: "Struttura (Cat/Ruoli)", exactMatch: false, color: "text-emerald-400", borderColor: "border-emerald-900", hoverBorder: "hover:border-emerald-500" },
    { path: "/admin/quiz", label: "Concorsi & Materie", exactMatch: false, color: "text-blue-400", borderColor: "border-blue-900", hoverBorder: "hover:border-blue-500" },
    { path: "/admin/blog", label: "Blog & News", exactMatch: false, color: "text-purple-400", borderColor: "border-purple-900", hoverBorder: "hover:border-purple-500" },
    { path: "/admin/images", label: "Media Library", exactMatch: false, color: "text-pink-400", borderColor: "border-pink-900", hoverBorder: "hover:border-pink-500" },
    { path: "/admin/leaderboard", label: "Classifiche", exactMatch: false, color: "text-amber-400", borderColor: "border-amber-900", hoverBorder: "hover:border-amber-500" },
    { path: "/admin/users", label: "Utenti", exactMatch: false, color: "text-indigo-400", borderColor: "border-indigo-900", hoverBorder: "hover:border-indigo-500" },
    { path: "/admin/rules", label: "Regole Simulazione", exactMatch: false, color: "text-rose-400", borderColor: "border-rose-900", hoverBorder: "hover:border-rose-500" },
    { path: "/admin/upload-csv", label: "Import CSV", exactMatch: false, color: "text-orange-400", borderColor: "border-orange-900", hoverBorder: "hover:border-orange-500" },
    { path: "/admin/analytics", label: "Analisi & AI", exactMatch: false, color: "text-cyan-400", borderColor: "border-cyan-900", hoverBorder: "hover:border-cyan-500" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
            }
        };
        checkAuth();
    }, [navigate]);

    // Close drawer on route change
    useEffect(() => {
        setIsDrawerOpen(false);
    }, [location.pathname]);

    const handleNav = (path: string) => {
        navigate(path);
        setIsDrawerOpen(false);
    };

    const isActive = (path: string, exactMatch: boolean) => {
        if (exactMatch) return location.pathname === path;
        return location.pathname.startsWith(path);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Mobile Drawer Overlay */}
            {isDrawerOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsDrawerOpen(false)}
                />
            )}

            {/* Mobile Drawer */}
            <div
                className={`fixed top-0 left-0 h-full w-72 bg-slate-900 z-50 transform transition-transform duration-300 ease-ios lg:hidden safe-area-inset ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <h2 className="font-semibold text-lg">Menu Admin</h2>
                    <button
                        onClick={() => setIsDrawerOpen(false)}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-800 transition-colors"
                        aria-label="Chiudi menu"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <nav className="p-4 space-y-2">
                    {navItems.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => handleNav(item.path)}
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive(item.path, item.exactMatch)
                                ? "bg-white text-slate-900"
                                : `bg-slate-800 ${item.color} hover:bg-slate-700`
                                }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="mx-auto max-w-6xl px-4 py-4 lg:py-8">
                {/* Header with Hamburger */}
                <div className="flex justify-between items-center mb-4 lg:mb-6">
                    <div className="flex items-center gap-3">
                        {/* Hamburger Button - Mobile Only */}
                        <button
                            onClick={() => setIsDrawerOpen(true)}
                            className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 transition-colors lg:hidden"
                            aria-label="Apri menu"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <h1 className="text-xl lg:text-2xl font-semibold">Admin Dashboard</h1>
                    </div>
                    <button onClick={() => navigate('/')} className="text-sm text-slate-400 hover:text-white transition-colors">
                        Torna al sito &rarr;
                    </button>
                </div>

                {/* Desktop NAV - Hidden on Mobile */}
                <nav className="mb-8 hidden lg:flex flex-wrap gap-2">
                    {navItems.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => handleNav(item.path)}
                            className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${isActive(item.path, item.exactMatch)
                                ? "bg-white text-slate-900 border-white shadow-sm"
                                : `bg-slate-900 ${item.color} ${item.borderColor} ${item.hoverBorder} hover:text-white`
                                }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>

                {children}
            </div>
        </div>
    );
}

