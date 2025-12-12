import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import AdminSidebar from './AdminSidebar';

// ================== TYPES ==================

interface AdminLayoutProps {
    children: React.ReactNode;
}

// ================== MAIN COMPONENT ==================

export default function AdminLayout({ children }: AdminLayoutProps) {
    const navigate = useNavigate();

    // Auth check
    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
            }
        };
        checkAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_OUT') {
                navigate('/login');
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 flex font-sans">
            {/* Sidebar */}
            <AdminSidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Top Bar */}
                <header className="h-16 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 z-10 backdrop-blur-md">
                    <div className="text-sm text-slate-500 font-medium">
                        {/* Breadcrumb or search could go here */}
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Notifications placeholder */}
                        <button className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                            🔔
                        </button>

                        {/* User menu */}
                        <button className="flex items-center gap-3 px-2 py-1.5 rounded-full hover:bg-slate-800 hover:shadow-sm transition-all border border-transparent hover:border-slate-700/50">
                            <div className="w-8 h-8 bg-slate-800 rounded-squircle flex items-center justify-center text-xs font-bold text-slate-300">
                                A
                            </div>
                            <span className="text-sm font-semibold text-slate-300">Admin</span>
                            <span className="text-slate-500 text-xs">▾</span>
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
