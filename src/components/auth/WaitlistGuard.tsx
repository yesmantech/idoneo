import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function WaitlistGuard({ children }: { children: React.ReactNode }) {
    const { user, profile, loading } = useAuth();
    const location = useLocation();
    const path = location.pathname;

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-white">
                <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            </div>
        );
    }

    // 1. Always allow public routes (Login, Waitlist, Success, Profile Setup)
    if (path.startsWith('/login') || path.startsWith('/waitlist') || path.startsWith('/profile/setup')) {
        return <>{children}</>;
    }

    // BYPASS: SuperUser
    const isSuperUser = user?.email === 'alessandro.valenza22@gmail.com';
    if (isSuperUser) {
        return <>{children}</>;
    }

    // 2. Always allow Admin routes (The developer needs access)
    // We assume AdminLayout handles its own auth checks, or we trust the route separation.
    if (path.startsWith('/admin')) {
        return <>{children}</>;
    }

    // 3. For all other App routes (/concorsi, /quiz, /profile...):

    // DEV MODE: Allow localhost access for testing
    if (window.location.hostname === 'localhost') {
        return <>{children}</>;
    }

    // If Admin -> Allow access to App
    if (profile?.role === 'admin') {
        return <>{children}</>;
    }

    // If Regular User -> Redirect to Waitlist Success (Dead end)
    if (user) {
        return <Navigate to="/waitlist/success" replace />;
    }

    // If Guest -> Redirect to Waitlist Intro
    return <Navigate to="/waitlist" replace />;
}
