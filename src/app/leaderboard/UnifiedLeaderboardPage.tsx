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
    const SelectorComponent = isAdmin ? LeaderboardSelector : LeaderboardSelectorLegacy;
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
                const myIds = new Set<string>();

                if (user) {
                    const active = await leaderboardService.getUserActiveQuizzes(user.id);
                    // Map & Filter valid
                    myQuizzes = active.map(a => ({
                        id: a.quiz.id,
                        title: a.quiz.title, // or short title if available
                        slug: a.quiz.slug,
                        category: a.quiz.category_id // approximate
                    }));
                    myQuizzes.forEach(q => myIds.add(q.id));
                }
                setActiveQuizzes(myQuizzes);

                // B. Fetch All Quizzes for "Other" list (Limited to featured or popular?)
                // For now, fetch top 50 and filter out active
                const { data: allQuizzes } = await supabase
                    .from('quizzes')
                    .select('id, title, slug')
                    .limit(20);

                if (allQuizzes) {
                    const others = allQuizzes
                        .map(q => ({ id: q.id, title: q.title, slug: q.slug }))
                        .filter(q => !myIds.has(q.id));
                    setOtherQuizzes(others);
                }

            } catch (error) {
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

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-canvas-light text-text-primary">
            {/* Header Area */}
            <div className="flex-none p-6 pt-8 flex flex-col items-center justify-center relative z-40">
                <SelectorComponent
                    currentSelection={selection}
                    onSelect={setSelection}
                    activeQuizzes={activeQuizzes}
                    otherQuizzes={otherQuizzes}
                />

                {/* Subtitle / Context */}
                <p className="mt-3 text-sm text-text-tertiary font-bold uppercase tracking-wider animate-in fade-in slide-in-from-top-2">
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
        </div>
    );
}
