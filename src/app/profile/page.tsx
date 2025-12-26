import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Settings, Share2, Trophy, Zap, Target } from 'lucide-react';

// Components
import ProfileIdentityCard from '@/components/profile/ProfileIdentityCard';
import ProfileStatsCard from '@/components/profile/ProfileStatsCard';
import DashboardList from '@/components/profile/DashboardList';
import BadgesBlock from '@/components/profile/BadgesBlock';
import FriendsBlock from '@/components/profile/FriendsBlock';
import { ProfileBackgroundDecor } from '@/components/ui/ProfileBackgroundDecor';

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
        <div className="min-h-screen bg-[#F5F5F7] pb-24 relative overflow-hidden">

            {/* Animated Background Decorations */}
            <ProfileBackgroundDecor />

            {/* Safe area spacer */}
            <div className="pt-safe" />

            {/* Main Content - Desktop: Two Column Layout */}
            <div className="max-w-6xl mx-auto relative px-4 lg:px-6">
                <div className="lg:grid lg:grid-cols-[340px_1fr] lg:gap-8">

                    {/* Left Column: Identity + Stats */}
                    <div className="lg:sticky lg:top-6 lg:self-start space-y-6">
                        {/* Identity Card */}
                        <ProfileIdentityCard
                            user={user}
                            profile={profile}
                        />

                        {/* Stats Row */}
                        <ProfileStatsCard xp={xp} />

                        {/* Badges - Desktop Only in Left Column */}
                        <div className="hidden lg:block">
                            <BadgesBlock />
                        </div>
                    </div>

                    {/* Right Column: Dashboard + More */}
                    <div className="space-y-6 mt-6 lg:mt-0">
                        {/* Dashboard List */}
                        <DashboardList userId={user?.id || ''} />

                        {/* Friends Block */}
                        <FriendsBlock userId={user?.id || ''} />

                        {/* Badges - Mobile Only */}
                        <div className="lg:hidden">
                            <BadgesBlock />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
