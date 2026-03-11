/**
 * @file ProfilePage.tsx
 * @description User dashboard and personal statistics hub.
 *
 * Displays the user's progress, identity card, and social connections.
 *
 * ## Components
 *
 * - **ProfileIdentityCard**: User avatar, level, role, and XP summary
 * - **DashboardList**: List of recent activities and quick actions
 * - **BadgesBlock**: Collection of earned achievements
 * - **FriendsBlock**: Social graph and friend requests
 * - **ProfileBackgroundDecor**: Animated background elements
 *
 * ## Data Flow
 *
 * 1. Checks Auth state (redirects if null)
 * 2. Fetches User XP stats via `xpService`
 * 3. Triggers Profile Onboarding Tour if not completed
 */

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
import StreakCard from '@/components/profile/StreakCard';
import SEOHead from '@/components/seo/SEOHead';

import { xpService } from '@/lib/xpService';
import { BADGE_DEFINITIONS } from '@/lib/badgeDefinitions';

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

    if (loading || !profile) return (
        <TierSLoader message="Caricamento profilo..." />
    );

    return (
        <div className="min-h-screen bg-[var(--background)] pb-24 relative overflow-hidden transition-colors duration-300">
            <SEOHead
                title={`${profile.nickname || 'Il mio Profilo'} | Idoneo`}
                description="Gestisci la tua preparazione, guarda le tue statistiche e sfida i tuoi amici su Idoneo."
                url="/profile"
            />

            {/* Animated Background Decorations */}
            <ProfileBackgroundDecor />

            {/* Safe area spacer */}
            <div className="pt-safe" />

            {/* Main Content — Full-width dashboard layout */}
            <div className="max-w-6xl mx-auto relative px-4 lg:px-6">

                {/* ── Identity Header — always full width ── */}
                <div data-onboarding="stats">
                    <ProfileIdentityCard
                        user={user}
                        profile={profile}
                        xp={xp}
                    />
                </div>

                {/* ── Badges strip — desktop only, after header ── */}
                <div className="hidden lg:block">
                    <BadgesBlock />
                </div>

                {/* ── Active Quizzes — full width ── */}
                <div className="mt-6 lg:mt-0">
                    <DashboardList userId={user?.id || ''} />
                </div>

                {/* ── Widget Grid — 1 col mobile, 2 cols desktop ── */}
                <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6">
                    {/* Streak Card */}
                    <StreakCard />

                    {/* Friends Block */}
                    <FriendsBlock userId={user?.id || ''} />

                    {/* Badges — mobile only (after Friends, same as original) */}
                    <div className="lg:hidden">
                        <BadgesBlock />
                    </div>
                </div>
            </div>
        </div>
    );
}
