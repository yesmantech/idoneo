import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Settings, Share2, Trophy, Zap, Target } from 'lucide-react';
import { useOnboarding } from '@/context/OnboardingProvider';
import TierSLoader from '@/components/ui/TierSLoader';

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

    // Onboarding
    const { startOnboarding, hasCompletedContext } = useOnboarding();

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
        }
        fetchData();
    }, [user, loading, navigate]);

    // Auto-start profile onboarding
    useEffect(() => {
        if (!loading && profile && !hasCompletedContext('profile')) {
            const timer = setTimeout(() => startOnboarding('profile'), 500);
            return () => clearTimeout(timer);
        }
    }, [loading, profile, hasCompletedContext, startOnboarding]);

    // Loading State
    if (loading || !profile) return (
        <TierSLoader message="Caricamento profilo..." />
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
                        <div data-onboarding="stats">
                            <ProfileIdentityCard
                                user={user}
                                profile={profile}
                                xp={xp}
                            />
                        </div>

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
