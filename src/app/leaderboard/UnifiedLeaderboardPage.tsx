/**
 * @file UnifiedLeaderboardPage.tsx
 * @description The main ranking interface for the application.
 *
 * Unifies global XP rankings (Gold League) and specific contest leaderboards
 * into a single, responsive interface.
 *
 * ## Modes
 *
 * 1. **Global XP (Default)**:
 *    - Shows weekly XP ranking
 *    - Features a countdown timer to weekly reset
 *    - Theme: Gold/Amber
 *
 * 2. **Contest Specific**:
 *    - Shows ranking based on simulation scores for a specific contest
 *    - Filterable by "My Quizzes" vs "All Quizzes"
 *    - Theme: Emerald/Green
 *
 * ## Sub-Components
 *
 * - `LeaderboardSelector`: Dropdown/Tabs to switch between Global/Contest modes
 * - `LeaderboardView`: The actual list of users (Admin version detailed)
 * - `LeaderboardViewLegacy`: Simplified list for users
 * - `LeagueCountdown`: Digital timer for season reset
 *
 * ## Access Control
 *
 * - Admin users see `LeaderboardView` (more data)
 * - Regular users see `LeaderboardViewLegacy`
 */

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { leaderboardService, LeaderboardEntry } from '@/lib/leaderboardService';
import { xpService } from '@/lib/xpService';
import { useAuth } from '@/context/AuthContext';
import { useOnboarding } from '@/context/OnboardingProvider';
import { Info, Trophy, Zap, Clock } from 'lucide-react';

import LeaderboardSelector, { QuizOption } from '@/components/leaderboard/LeaderboardSelector';
import LeaderboardView from '@/components/leaderboard/LeaderboardView';
import LeaderboardViewLegacy from '@/components/leaderboard/LeaderboardViewLegacy';
import InfoModal from '@/components/leaderboard/InfoModal';
import ScoreInfoPage from '@/components/leaderboard/ScoreInfoPage';
import SEOHead from '@/components/seo/SEOHead';

function LeagueCountdown() {
    const [timeLeft, setTimeLeft] = useState('--g --o --m');

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            // Calculate next Monday at 00:00
            const nextMonday = new Date();
            const daysUntilMonday = (1 + 7 - now.getDay()) % 7;
            const targetDate = daysUntilMonday === 0 ? 7 : daysUntilMonday; // If today is Monday, target next Monday
            nextMonday.setDate(now.getDate() + targetDate);
            nextMonday.setHours(0, 0, 0, 0);

            const diff = nextMonday.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft('Resetting...');
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / 1000 / 60) % 60);

            const pad = (n: number) => n.toString().padStart(2, '0');

            if (days > 0) {
                setTimeLeft(`${days}g ${pad(hours)}o ${pad(minutes)}m`);
            } else {
                setTimeLeft(`${pad(hours)}o ${pad(minutes)}m`);
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 60000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div data-onboarding="lb-timer" className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-900/30 rounded-[14px] border border-amber-100 dark:border-amber-800 shadow-sm transition-all duration-300">
            <Clock className="w-3 h-3 text-amber-500" />
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide whitespace-nowrap">
                {timeLeft}
            </span>
        </div>
    );
}

export default function UnifiedLeaderboardPage() {

    const { user, profile, refreshProfile } = useAuth();
    // Use role-based check instead of hardcoded emails
    const isAdmin = profile?.role === 'admin';

    // Conditional Components
    const SelectorComponent = LeaderboardSelector;
    const ViewComponent = isAdmin ? LeaderboardView : LeaderboardViewLegacy;

    // Selection State
    const [selection, setSelection] = useState<'xp' | string>('xp');

    // Options State
    const [activeQuizzes, setActiveQuizzes] = useState<QuizOption[]>([]);
    const [otherQuizzes, setOtherQuizzes] = useState<QuizOption[]>([]);

    // Data State
    const [data, setData] = useState<LeaderboardEntry[]>([]);
    const [userEntry, setUserEntry] = useState<LeaderboardEntry | null>(null);
    const [participantsCount, setParticipantsCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // 1. Fetch Options (Active & Others)
    const { startOnboarding, hasCompletedContext, isActive: isTourActive, activeContext } = useOnboarding();

    // Auto-start leaderboard onboarding
    useEffect(() => {
        if (!loading && data.length > 0 && !hasCompletedContext('leaderboard')) {
            const timer = setTimeout(() => startOnboarding('leaderboard'), 500);
            return () => clearTimeout(timer);
        }
    }, [loading, data.length, hasCompletedContext, startOnboarding]);

    useEffect(() => {
        async function loadOptions() {
            try {
                let myQuizzes: QuizOption[] = [];
                let myIds = new Set<string>();

                if (user) {
                    const active = await leaderboardService.getUserActiveQuizzes(user.id);
                    myQuizzes = active.map((a: any) => ({
                        id: a.id,
                        title: a.title,
                        slug: a.slug,
                        category: a.category_id,
                        roleTitle: a.role?.title
                    }));
                    myIds = new Set(myQuizzes.map(q => q.id));
                    setActiveQuizzes(myQuizzes);
                }

                const { data: allQuizzes } = await supabase
                    .from('quizzes')
                    .select('id, title, slug, role_id, role:roles(title)')
                    .not('role_id', 'is', null)
                    .order('title', { ascending: true })
                    .limit(100);

                if (allQuizzes) {
                    const others = allQuizzes
                        .map(q => ({
                            id: q.id,
                            title: q.title,
                            slug: (q as any).slug || 'no-slug',
                            roleTitle: (q as any).role?.title
                        }))
                        .filter(q => !myIds.has(q.id));

                    setOtherQuizzes(others);
                }
            } catch (error: any) {
                console.error("Error loading options", error);
            }
        }
        loadOptions();
    }, [user]);

    // 2. Fetch Leaderboard Data on Selection Change
    useEffect(() => {
        async function loadLeaderboard() {
            setLoading(true);
            try {
                let entries: LeaderboardEntry[] = [];
                let pCount = 0;
                let personalEntry: LeaderboardEntry | null = null;

                if (selection === 'xp') {
                    // Fetch Active Season ID
                    const activeSeasonId = await xpService.getActiveSeasonId();

                    const [topEntries, total, myRank] = await Promise.all([
                        leaderboardService.getXPLeaderboard(activeSeasonId),
                        leaderboardService.getXPParticipantsCount(activeSeasonId),
                        user ? leaderboardService.getUserXPRank(user.id, activeSeasonId) : null
                    ]);
                    entries = topEntries;
                    pCount = total;
                    personalEntry = myRank;
                } else {
                    const [topEntries, total, myRank] = await Promise.all([
                        leaderboardService.getSkillLeaderboard(selection),
                        leaderboardService.getParticipantsCount(selection),
                        user ? leaderboardService.getUserSkillRank(user.id, selection) : null
                    ]);
                    entries = topEntries;
                    pCount = total;
                    personalEntry = myRank;
                }

                if (user) {
                    entries = entries.map(e => ({
                        ...e,
                        isCurrentUser: e.user.id === user.id
                    }));
                }

                setData(entries);
                setParticipantsCount(pCount);
                setUserEntry(personalEntry);
            } catch (error) {
                console.error("Error loading leaderboard", error);
            } finally {
                setLoading(false);
            }
        }
        loadLeaderboard();
    }, [selection, user]);

    // Computed Props
    const isXP = selection === 'xp';
    const theme = isXP ? 'gold' : 'emerald';

    // State for Info System
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [showInfoPage, setShowInfoPage] = useState(false);
    const [infoType, setInfoType] = useState<'prep' | 'xp'>('xp');

    // Helper: Check if a modal has been dismissed (DB ONLY)
    const isInfoDismissed = (type: 'xp' | 'prep') => {
        const dbKey = type === 'xp' ? 'xp_info' : 'prep_info';
        return profile?.dismissed_modals?.includes(dbKey) ?? false;
    };

    // Helper: Dismiss a modal and persist to DB ONLY
    const dismissInfoModal = async (type: 'xp' | 'prep') => {
        if (!user || !profile) return;
        const dbKey = type === 'xp' ? 'xp_info' : 'prep_info';
        const current = profile.dismissed_modals || [];
        if (current.includes(dbKey)) return;

        // Optimistic update to UI state / local profile cache could be good, but for now we trust refresh
        const updated = [...current, dbKey];
        await supabase
            .from('profiles')
            .update({ dismissed_modals: updated })
            .eq('id', user.id);
        refreshProfile();
    };

    // Auto-Onboarding Check for Global XP
    useEffect(() => {
        if (loading || !profile) return; // strict wait for profile
        const tourIsActive = isTourActive && activeContext === 'leaderboard';
        if (!isInfoDismissed('xp') && selection === 'xp' && !tourIsActive) {
            setInfoType('xp');
            setTimeout(() => setShowInfoModal(true), 500);
        }
    }, [selection, loading, isTourActive, activeContext, profile, profile?.dismissed_modals]);

    // Auto-Onboarding Check for Contest specific leaderboard
    useEffect(() => {
        if (loading || !profile) return; // strict wait for profile
        const tourIsActive = isTourActive && activeContext === 'leaderboard';
        if (selection !== 'xp' && !tourIsActive) {
            if (!isInfoDismissed('prep')) {
                setInfoType('prep');
                setTimeout(() => setShowInfoModal(true), 500);
            }
        }
    }, [selection, loading, isTourActive, activeContext, profile, profile?.dismissed_modals]);


    const handleCloseModal = () => {
        setShowInfoModal(false);
        dismissInfoModal(infoType);
    };

    // Close InfoModal when onboarding tour becomes active (fixes race condition)
    useEffect(() => {
        if (isTourActive && activeContext === 'leaderboard' && showInfoModal) {
            setShowInfoModal(false);
        }
    }, [isTourActive, activeContext, showInfoModal]);

    const handleOpenInfo = () => {
        setInfoType(isXP ? 'xp' : 'prep');
        setShowInfoModal(true);
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
            <SEOHead
                title="Classifica Globale | Sfida gli altri candidati"
                description="Guarda la tua posizione nelle classifiche di Idoneo. Confrontati con gli altri candidati e scala la Gold League."
                url="/leaderboard"
            />

            {/* Header Area - Desktop Optimized */}
            <div className="flex-none p-4 lg:p-8 pt-safe relative z-40">
                <div className="max-w-5xl mx-auto px-2">
                    {/* Desktop Header Row */}
                    <div className="hidden lg:flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-[var(--foreground)] flex items-center gap-3">
                                <Trophy className="w-8 h-8 text-amber-500" />
                                Classifica
                            </h1>
                            <p className="text-[var(--foreground)] opacity-50 mt-1">Competi con gli altri studenti e scala la classifica</p>
                        </div>
                        <button
                            onClick={handleOpenInfo}
                            className="p-3 rounded-xl bg-[var(--card)] hover:bg-slate-100 dark:hover:bg-slate-700 text-[var(--foreground)] opacity-50 hover:opacity-100 transition-colors shadow-sm border border-[var(--card-border)]"
                        >
                            <Info className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Mobile Header Row */}
                    <div className="lg:hidden flex items-center justify-between mb-6">
                        <div className="w-10" /> {/* Spacer for centering selector */}
                        <div data-onboarding="lb-selector">
                            <SelectorComponent
                                currentSelection={selection}
                                onSelect={setSelection}
                                activeQuizzes={activeQuizzes}
                                otherQuizzes={otherQuizzes}
                            />
                        </div>
                        <button
                            onClick={handleOpenInfo}
                            className="p-2 rounded-full bg-[var(--card)] shadow-sm border border-[var(--card-border)] text-[var(--foreground)] opacity-50 hover:opacity-100 transition-colors"
                        >
                            <Info className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Desktop Selector - Centered */}
                    <div className="hidden lg:flex flex-col items-center justify-center">
                        <SelectorComponent
                            currentSelection={selection}
                            onSelect={setSelection}
                            activeQuizzes={activeQuizzes}
                            otherQuizzes={otherQuizzes}
                        />
                    </div>

                </div>
            </div>

            {/* Main Content Area - Responsive Card */}
            <div className="flex-1 overflow-hidden relative w-full max-w-5xl mx-auto px-4 lg:px-8 pb-0 lg:pb-8">
                <div data-onboarding="lb-ranking" className="relative h-full bg-[var(--card)] rounded-t-[32px] lg:rounded-[32px] shadow-lg flex flex-col border-x border-t border-[var(--card-border)] overflow-hidden pb-safe">
                    {/* Status Area: Subtitle + Participants + Timer */}
                    {!loading && data.length > 0 && (
                        <div className="flex-none flex flex-col items-center justify-center pt-4 pb-3 px-4 border-b border-slate-100 dark:border-slate-700 bg-[var(--card)] space-y-2">
                            {/* Subtitle Inside Card */}
                            <p className="text-[11px] text-[var(--foreground)] opacity-50 font-bold uppercase tracking-widest flex items-center gap-2">
                                {isXP ? (
                                    <>
                                        <Zap className="w-3.5 h-3.5 text-purple-500" />
                                        Classifica Settimanale
                                    </>
                                ) : (
                                    <>
                                        <Trophy className="w-3.5 h-3.5 text-emerald-500" />
                                        Classifica Concorso
                                    </>
                                )}
                            </p>

                            <div className="flex items-center gap-2.5">
                                {/* Participants Badge */}
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-[14px] border border-slate-100 shadow-sm transition-all hover:bg-slate-100">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse"></span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                                        {participantsCount} {participantsCount === 1 ? 'Partecipante' : 'Partecipanti'}
                                    </span>
                                </div>

                                {/* League Timer (Only for XP/Gold League) */}
                                {isXP && <LeagueCountdown />}
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-visible">
                        <ViewComponent
                            data={data}
                            currentUserEntry={userEntry}
                            loading={loading}
                            theme={theme}
                            metricLabel={isXP ? 'XP' : 'Punti'}
                            emptyMessage={isXP ? "Nessun giocatore in questa lega ancora." : "Nessuno ha completato questa simulazione."}
                        />
                    </div>
                </div>
            </div>

            {/* Info System Overlays */}
            <InfoModal
                isOpen={showInfoModal}
                onClose={handleCloseModal}
                type={infoType}
                onMoreInfo={() => {
                    setShowInfoModal(false);
                    setShowInfoPage(true);
                    dismissInfoModal(infoType);
                }}
            />

            {showInfoPage && (
                <ScoreInfoPage
                    onBack={() => setShowInfoPage(false)}
                    initialTab={infoType}
                />
            )}

        </div>
    );
}

