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
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        // Wait for auth to load
        if (loading) return;

        // Not logged in
        if (!user) {
            navigate('/login', { replace: true });
            return;
        }

        // Logged in but not admin
        if (profile?.role !== 'admin') {
            console.warn('AdminGuard: Unauthorized access attempt by user:', user.email);
            navigate('/', { replace: true });
            return;
        }

        // User is admin
        setIsAuthorized(true);
    }, [user, profile, loading, navigate]);

    // Show loading while checking auth
    if (loading || !isAuthorized) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-[var(--foreground)] opacity-60">Verifica autorizzazione...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
