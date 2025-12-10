import React, { useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
            }
        };
        checkAuth();
    }, [navigate]);

    const handleNav = (path: string) => {
        navigate(path);
    };

    const isActive = (path: string) => {
        // accurate match for /admin, others prefix
        if (path === "/admin") return location.pathname === "/admin";
        return location.pathname.startsWith(path);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <div className="mx-auto max-w-6xl px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
                    <button onClick={() => navigate('/')} className="text-sm text-slate-400 hover:text-white">
                        Torna al sito &rarr;
                    </button>
                </div>

                {/* NAV ADMIN */}
                <nav className="mb-8 flex flex-wrap gap-2">
                    <button
                        onClick={() => handleNav("/admin")}
                        className={`px - 4 py - 2 rounded - md text - sm font - medium border transition - colors ${isActive("/admin") && location.pathname === "/admin"
                            ? "bg-white text-slate-900 border-white shadow-sm"
                            : "bg-slate-900 text-slate-300 border-slate-700 hover:border-sky-500 hover:text-white"
                            } `}
                    >
                        Domande
                    </button>
                    <button
                        onClick={() => handleNav("/admin/structure")}
                        className={`px - 4 py - 2 rounded - md text - sm font - medium border transition - colors ${isActive("/admin/structure")
                            ? "bg-white text-slate-900 border-white shadow-sm"
                            : "bg-slate-900 text-emerald-400 border-emerald-900 hover:border-emerald-500 hover:text-white"
                            } `}
                    >
                        Struttura (Categorie/Ruoli)
                    </button>
                    <button
                        onClick={() => handleNav("/admin/quiz")}
                        className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${isActive("/admin/quiz")
                            ? "bg-white text-slate-900 border-white shadow-sm"
                            : "bg-slate-900 text-slate-300 border-slate-700 hover:border-sky-500 hover:text-white"
                            } `}
                    >
                        Concorsi &amp; Materie
                    </button>
                    <button
                        onClick={() => handleNav("/admin/rules")}
                        className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${isActive("/admin/rules")
                            ? "bg-white text-slate-900 border-white shadow-sm"
                            : "bg-slate-900 text-purple-400 border-purple-900 hover:border-purple-500 hover:text-white"
                            } `}
                    >
                        Regole Simulazione
                    </button>
                    <button
                        onClick={() => handleNav("/admin/upload-csv")}
                        className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${isActive("/admin/upload-csv")
                            ? "bg-white text-slate-900 border-white shadow-sm"
                            : "bg-slate-900 text-amber-500 border-amber-900 hover:border-amber-500 hover:text-white"
                            } `}
                    >
                        Import CSV
                    </button>
                    <button
                        disabled
                        className="px-4 py-2 rounded-md text-sm font-medium border bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed"
                    >
                        Admin Utenti (WIP)
                    </button>
                </nav>

                {children}
            </div>
        </div>
    );
}
