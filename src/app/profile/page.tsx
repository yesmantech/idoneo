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
            {/* 1. HERO HEADER (Dark Navy/Charcoal Gradient) */}
            <header className="relative pt-safe h-48 bg-gradient-to-b from-[#0B1121] to-[#1a2333] flex justify-end items-start p-4 overflow-hidden">
                {/* Background decorative glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-md pointer-events-none opacity-40">
                    <div className="absolute top-[-50%] left-[-20%] w-[80%] h-[150%] bg-[#00B1FF] blur-[100px] rounded-full mix-blend-screen" />
                </div>

                {/* Actions */}
                <div className="relative z-10 flex gap-3 mt-2">
                    <button
                        onClick={() => alert("Condivisione in arrivo!")}
                        className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/5 flex items-center justify-center transition-all hover:bg-white/20 active:scale-95 shadow-lg shadow-black/10"
                    >
                        <Share2 className="w-5 h-5 text-white" />
                    </button>
                    <button
                        onClick={() => navigate('/profile/settings')}
                        className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/5 flex items-center justify-center transition-all hover:bg-white/20 active:scale-95 shadow-lg shadow-black/10"
                    >
                        <Settings className="w-5 h-5 text-white" />
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
