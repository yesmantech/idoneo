import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { leaderboardService, LeaderboardEntry } from '@/lib/leaderboardService';
import { useAuth } from '@/context/AuthContext';

import LeaderboardSelector, { QuizOption } from '@/components/leaderboard/LeaderboardSelector';
import LeaderboardView from '@/components/leaderboard/LeaderboardView';
import LeaderboardSelectorLegacy from '@/components/leaderboard/LeaderboardSelectorLegacy';
import LeaderboardViewLegacy from '@/components/leaderboard/LeaderboardViewLegacy';

export default function UnifiedLeaderboardPage() {
    const { user } = useAuth();
    const isAdmin = user?.email === 'alessandro.valenza22@gmail.com';

    // Conditional Components
    // FORCE MODERN SELECTOR for consistency and debugging
    const SelectorComponent = LeaderboardSelector;
    const ViewComponent = isAdmin ? LeaderboardView : LeaderboardViewLegacy;

    // Selection State
    const [selection, setSelection] = useState<'xp' | string>('xp');

    // Options State
    const [activeQuizzes, setActiveQuizzes] = useState<QuizOption[]>([]);
    const [otherQuizzes, setOtherQuizzes] = useState<QuizOption[]>([]);

    // Data State
    const [data, setData] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    // 1. Fetch Options (Active & Others)
    useEffect(() => {
        async function loadOptions() {
            try {
                // A. Active Quizzes (If User Logged In)
                let myQuizzes: QuizOption[] = [];
                let myIds = new Set<string>();

                if (user) {
                    const active = await leaderboardService.getUserActiveQuizzes(user.id);
                    // FIX: 'active' array contains items where properties are spread, so use 'a.id', not 'a.quiz.id'
                    myQuizzes = active.map((a: any) => ({
                        id: a.id,
                        title: a.title,
                        slug: a.slug,
                        category: a.category_id,
                        roleTitle: a.role?.title // Role is nested in the quiz object
                    }));
                    myIds = new Set(myQuizzes.map(q => q.id));
                    setActiveQuizzes(myQuizzes);
                }

                // B. Fetch All Quizzes for "Other" list
                const { data: allQuizzes, error: quizError } = await supabase
                    .from('quizzes')
                    .select('id, title, slug, role_id, role:roles(title)')
                    .not('role_id', 'is', null) // Only those with a role
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
                if (selection === 'xp') {
                    entries = await leaderboardService.getXPLeaderboard();
                } else {
                    entries = await leaderboardService.getSkillLeaderboard(selection);
                }

                // Mark current user
                if (user) {
                    entries = entries.map(e => ({
                        ...e,
                        isCurrentUser: e.user.id === user.id
                    }));
                }

                setData(entries);
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

    // Auto-Onboarding Check
    useEffect(() => {
        const hasSeen = localStorage.getItem('idoneo_leaderboard_onboarding');
        if (!hasSeen) {
            // Default to showing XP info first since it's the default view
            setInfoType('xp');
            // Small delay for smooth entrance
            setTimeout(() => setShowInfoModal(true), 500);
        }
    }, []);

    const handleCloseModal = () => {
        setShowInfoModal(false);
        localStorage.setItem('idoneo_leaderboard_onboarding', 'true');
    };

    const handleOpenInfo = () => {
        setInfoType(isXP ? 'xp' : 'prep');
        setShowInfoModal(true);
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-canvas-light text-text-primary">

            {/* Header Area */}
            <div className="flex-none p-6 pt-8 flex flex-col items-center justify-center relative z-40">

                {/* Info Icon - Top Right */}
                <button
                    onClick={handleOpenInfo}
                    className="absolute top-8 right-6 p-2 rounded-full bg-white/50 hover:bg-white text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <Info className="w-6 h-6" />
                </button>

                <SelectorComponent
                    currentSelection={selection}
                    onSelect={setSelection}
                    activeQuizzes={activeQuizzes}
                    otherQuizzes={otherQuizzes}
                />

                {/* Subtitle / Context */}
                <p className="mt-3 text-sm text-text-tertiary font-bold uppercase tracking-wider animate-in fade-in slide-in-from-top-2 flex items-center gap-2">
                    {isXP ? 'Classifica Settimanale' : 'Classifica Concorso'}
                </p>
            </div>

            {/* Main Content Area - Card Style */}
            <div className="flex-1 overflow-hidden relative w-full max-w-2xl mx-auto px-4 lg:px-0 lg:pb-8">
                <div className="relative h-full bg-white rounded-t-[32px] shadow-soft overflow-hidden flex flex-col border border-transparent">
                    <ViewComponent
                        data={data}
                        loading={loading}
                        theme={theme}
                        metricLabel={isXP ? 'XP' : 'Punti'}
                        emptyMessage={isXP ? "Nessun giocatore in questa lega ancora." : "Nessuno ha completato questa simulazione."}
                    />
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
                    localStorage.setItem('idoneo_leaderboard_onboarding', 'true');
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

// Import icons at top
import { Info } from 'lucide-react';
import InfoModal from '@/components/leaderboard/InfoModal';
import ScoreInfoPage from '@/components/leaderboard/ScoreInfoPage';
