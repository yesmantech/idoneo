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
            <header className="relative pt-safe h-36 bg-gradient-to-b from-[#0B1121] to-[#1a2333] flex justify-end items-start p-4 overflow-hidden">

                {/* Background Animations */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {/* Floating Orbs */}
                    <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[120%] bg-[#00B1FF]/30 blur-[80px] rounded-full mix-blend-screen animate-[float_6s_ease-in-out_infinite]" />
                    <div className="absolute bottom-[-40%] right-[-10%] w-[50%] h-[100%] bg-[#10B981]/20 blur-[60px] rounded-full mix-blend-screen animate-[float_8s_ease-in-out_infinite_1s]" />

                    {/* Sparkles (Subtle) */}
                    <div className="absolute top-12 left-8 opacity-60 animate-[sparkle_3s_ease-in-out_infinite]">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z" fill="#FBBF24" /></svg>
                    </div>
                    <div className="absolute top-8 right-20 opacity-40 animate-[sparkle_4s_ease-in-out_infinite_1.5s]">
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z" fill="#00B1FF" /></svg>
                    </div>
                </div>

                {/* Actions */}
                <div className="relative z-10 flex gap-3 mt-1">
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
