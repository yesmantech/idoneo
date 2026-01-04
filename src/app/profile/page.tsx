import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Settings, Share2, Trophy, Zap, Target } from 'lucide-react';

// Components
import ProfileIdentityCard from '@/components/profile/ProfileIdentityCard';
import DashboardList from '@/components/profile/DashboardList';
import BadgesBlock from '@/components/profile/BadgesBlock';
import FriendsBlock from '@/components/profile/FriendsBlock';
import { ProfileBackgroundDecor } from '@/components/ui/ProfileBackgroundDecor';

import { xpService } from '@/lib/xpService';

export default function ProfilePage() {
    const { user, profile, loading } = useAuth();
    const navigate = useNavigate();

    // XP & Score State
    const [xp, setXP] = useState(0);
    const [score, setScore] = useState(0);

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
            return;
        }

        async function fetchData() {
            if (!user) return;
            // Fetch XP
            const stats = await xpService.getUserXp(user.id);
            setXP(stats.totalXp);

            // Fetch Score (Take the first active quiz score)
            try {
                const { leaderboardService } = await import('@/lib/leaderboardService');
                const quizzes = await leaderboardService.getUserActiveQuizzes(user.id);
                if (quizzes.length > 0) {
                    setScore(quizzes[0].accuracy);
                }
            } catch (e) {
                console.error(e);
            }
        }
        fetchData();
    }, [user, loading, navigate]);

    // Loading State
    if (loading || !profile) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--background)]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-500 mb-4"></div>
            <p className="text-[var(--foreground)] opacity-50 font-bold">Caricamento profilo...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[var(--background)] pb-24 relative overflow-hidden transition-colors duration-300">

            {/* Animated Background Decorations */}
            <ProfileBackgroundDecor />

            {/* Safe area spacer */}
            <div className="pt-safe" />

            {/* Main Content - Desktop: Two Column Layout */}
            <div className="max-w-6xl mx-auto relative px-4 lg:px-6">
                <div className="lg:grid lg:grid-cols-[360px_1fr] lg:gap-10">

                    {/* Left Column: Identity + Stats (all in one card now) */}
                    <div className="lg:sticky lg:top-8 lg:self-start space-y-6">
                        {/* Identity Card with integrated stats */}
                        <ProfileIdentityCard
                            user={user}
                            profile={profile}
                            xp={xp}
                            score={score}
                        />

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
