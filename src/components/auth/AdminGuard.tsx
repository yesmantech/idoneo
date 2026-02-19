"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/**
 * AdminGuard - Protects admin routes from unauthorized access
 * 
 * Security: Only users with profile.role === 'admin' can access admin routes.
 * All other users are redirected to the home page.
 */
export default function AdminGuard({ children }: { children: React.ReactNode }) {
    const { user, profile, loading } = useAuth();
    const navigate = useNavigate();
    const isAuthorized = user && profile?.role === 'admin';

    // Show loading while checking auth
    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-[var(--foreground)] opacity-60">Verifica autorizzazione...</p>
                </div>
            </div>
        );
    }

    // Access Denied Screen
    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-red-50 dark:bg-red-900/20 rounded-2xl p-8 border border-red-200 dark:border-red-800 text-center">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-red-600 dark:text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>

                    <h2 className="text-2xl font-bold text-red-900 dark:text-red-100 mb-2">Accesso Negato</h2>
                    <p className="text-red-700 dark:text-red-300 mb-6 font-medium">
                        Non hai i permessi necessari per accedere a questa sezione amministrativa.
                    </p>

                    <div className="text-sm text-red-600/80 dark:text-red-400/80 mb-8 bg-red-100/50 dark:bg-red-900/40 p-4 rounded-lg text-left">
                        <div className="font-bold mb-1">Dettagli Debug:</div>
                        <div>User: {user?.email}</div>
                        <div>Role: {profile?.role || 'Nessuno (o non caricato)'}</div>
                        <div>ID: {user?.id}</div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-red-600/20"
                        >
                            Riprova (Ricarica Pagina)
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full py-3 bg-white dark:bg-transparent border border-red-200 dark:border-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl font-medium transition-colors"
                        >
                            Torna alla Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
