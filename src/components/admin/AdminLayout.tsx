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
        <div className="min-h-screen bg-slate-950 text-white flex">
            {/* Sidebar */}
            <AdminSidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Top Bar */}
                <header className="h-14 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-10 backdrop-blur-sm">
                    <div className="text-sm text-slate-400">
                        {/* Breadcrumb or search could go here */}
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Notifications placeholder */}
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                            🔔
                        </button>

                        {/* User menu */}
                        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 transition-colors">
                            <div className="w-7 h-7 bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold">
                                A
                            </div>
                            <span>Admin</span>
                            <span className="text-slate-500 text-xs">▾</span>
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 overflow-y-auto">
                    <div className="max-w-6xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
