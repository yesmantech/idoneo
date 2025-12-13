import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Settings, Share2, Plus } from 'lucide-react';

// Components
import ProfileIdentityCard from '@/components/profile/ProfileIdentityCard';
import ProfileStatsCard from '@/components/profile/ProfileStatsCard';
import DashboardList from '@/components/profile/DashboardList';
import BadgesBlock from '@/components/profile/BadgesBlock';
import FriendsBlock from '@/components/profile/FriendsBlock';

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
        <div className="min-h-screen bg-[#F5F5F7] pb-24">

            {/* 1. HERO HEADER */}
            {/* 1. MINIMAL HEADER */}
            <header className="relative pt-safe bg-transparent flex justify-end items-start p-4">
                {/* Actions */}
                <div className="flex gap-3 mt-2">
                    <button
                        onClick={() => alert("Condivisione in arrivo!")}
                        className="w-10 h-10 rounded-full bg-white/50 backdrop-blur-md border border-slate-200/50 flex items-center justify-center transition-all hover:bg-white active:scale-95 shadow-sm"
                    >
                        <Share2 className="w-5 h-5 text-slate-700" />
                    </button>
                    <button
                        onClick={() => navigate('/profile/settings')}
                        className="w-10 h-10 rounded-full bg-white/50 backdrop-blur-md border border-slate-200/50 flex items-center justify-center transition-all hover:bg-white active:scale-95 shadow-sm"
                    >
                        <Settings className="w-5 h-5 text-slate-700" />
                    </button>
                </div>
            </header>

            <div className="max-w-md mx-auto relative px-5">

                {/* 2. OVERLAPPING IDENTITY CARD */}
                <ProfileIdentityCard
                    user={user}
                    profile={profile}
                />

                <div className="space-y-6">
                    {/* 3. STATS ROW */}
                    <ProfileStatsCard xp={xp} />

                    {/* 4. DASHBOARD LIST */}
                    {/* We need to pass the "wrapper" styling or modify DashboardList to NOT have internal padding if needed. 
                        DashboardList currently has its own container. Let's inspect/adjust if needed. 
                        Actually DashboardList uses `p-8` or `p-4` internally. We might want to clear that up 
                        or just rely on it. Given the mockup, it should be a clean list. 
                        The current DashboardList component returns a `div`. We'll just render it here.
                    */}
                    <DashboardList userId={user?.id || ''} />

                    {/* 5. BADGES */}
                    <BadgesBlock />

                    {/* 6. FRIENDS & INVITES */}
                    <FriendsBlock userId={user?.id || ''} />
                </div>
            </div>
        </div>
    );
}
