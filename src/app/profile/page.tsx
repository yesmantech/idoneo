import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

// Components
import ProfileIdentityCard from '@/components/profile/ProfileIdentityCard';
import ProfileStatsCard from '@/components/profile/ProfileStatsCard';
import DashboardList from '@/components/profile/DashboardList';
import BadgesBlock from '@/components/profile/BadgesBlock';

import { xpService } from '@/lib/xpService';

export default function ProfilePage() {
    const { user, profile, loading } = useAuth();
    const navigate = useNavigate();

    // XP State
    const [xp, setXP] = useState(0);

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
            return;
        }

        async function fetchXP() {
            if (!user) return;
            const stats = await xpService.getUserXp(user.id);
            setXP(stats.totalXp);
        }
        fetchXP();
    }, [user, loading, navigate]);

    // Loading State
    if (loading || !profile) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-500 mb-4"></div>
            <p className="text-slate-400 font-bold">Caricamento profilo...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 pb-24 md:py-8 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl font-black text-slate-900 mb-6 hidden md:block">Il tuo Profilo</h1>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

                    {/* LEFT COLUMN (Identity & Stats) */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* 1. Identity Card */}
                        <ProfileIdentityCard
                            user={user}
                            profile={profile}
                            onSettingsClick={() => navigate('/profile/settings')}
                            onShareClick={() => alert("Condivisione in arrivo!")}
                        />

                        {/* 2. Stats */}
                        <ProfileStatsCard xp={xp} />

                        {/* 4. Badges (moved here for desktop sidebar feel) */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hidden lg:block">
                            <BadgesBlock />
                        </div>
                    </div>

                    {/* RIGHT COLUMN (Dashboard & Activity) */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* 3. Dashboard (Concorsi List) */}
                        <div className="bg-white md:rounded-3xl md:border md:border-slate-200 md:shadow-sm md:p-8 p-4 rounded-xl">
                            <DashboardList userId={user?.id || ''} />
                        </div>

                        {/* Mobile Badges (Visible only on mobile) */}
                        <div className="lg:hidden bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mx-4">
                            <BadgesBlock />
                        </div>

                        {/* Recent Activity (Placeholder for now) */}
                        <div className="bg-white md:rounded-3xl md:border md:border-slate-200 md:shadow-sm md:p-8 p-4 rounded-xl">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Attività Recente</h3>
                            <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                Nessuna attività recente da mostrare.
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
}
