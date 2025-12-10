import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { leaderboardService, LeaderboardEntry } from '@/lib/leaderboardService';
import { useAuth } from '@/context/AuthContext';

import LeaderboardSelector, { QuizOption } from '@/components/leaderboard/LeaderboardSelector';
import LeaderboardView from '@/components/leaderboard/LeaderboardView';

export default function UnifiedLeaderboardPage() {
    const { user } = useAuth();

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
                    // Map to QuizOption
                    myQuizzes = active.map((q: any) => ({
                        id: q.id,
                        title: q.title,
                        category: q.category
                    }));
                    myQuizzes.forEach(q => myIds.add(q.id));
                }
                setActiveQuizzes(myQuizzes);

                // B. Fetch Recent Quizzes (for "Others")
                const { data: allQuizzes } = await supabase
                    .from('quizzes')
                    .select('id, title, category')
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (allQuizzes) {
                    // Filter out already active ones
                    const others = allQuizzes
                        .filter(q => !myIds.has(q.id))
                        .map(q => ({
                            id: q.id,
                            title: q.title,
                            category: q.category
                        }));
                    setOtherQuizzes(others);
                }

                // Auto-select most recent active quiz if coming from a quiz? 
                // For now default to 'xp' (Gold League) as per requirements implies prominent placement
            } catch (err) {
                console.error("Error loading options:", err);
            }
        }
        loadOptions();
    }, [user]);

    // 2. Fetch Leaderboard Data
    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                let result: LeaderboardEntry[] = [];

                if (selection === 'xp') {
                    // XP League
                    // TODO: Pass current season ID if available
                    result = await leaderboardService.getXPLeaderboard();
                } else {
                    // Concorso Skill Score
                    result = await leaderboardService.getSkillLeaderboard(selection);
                }

                // Mark current user
                if (user) {
                    result = result.map(entry => ({
                        ...entry,
                        isCurrentUser: entry.user.id === user.id
                    }));
                }

                setData(result);
            } catch (err) {
                console.error("Error fetching leaderboard data:", err);
            } finally {
                setLoading(false);
            }
        }

        // Debounce slightly to avoid flicker on rapid switch? No needed for now.
        fetchData();
    }, [selection, user]);


    // Computed Props
    const isXP = selection === 'xp';
    const theme = isXP ? 'gold' : 'emerald';

    // Background Gradients
    const bgGradient = isXP
        ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-900 dark:to-amber-900/10'
        : 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-emerald-900/10';

    return (
        <div className={`flex flex-col h-screen overflow-hidden ${bgGradient} transition-colors duration-500`}>
            {/* Header Area */}
            <div className="flex-none p-4 lg:pt-8 flex flex-col items-center justify-center relative z-10">
                <LeaderboardSelector
                    currentSelection={selection}
                    onSelect={setSelection}
                    activeQuizzes={activeQuizzes}
                    otherQuizzes={otherQuizzes}
                />

                {/* Subtitle / Context */}
                <p className="mt-2 text-sm text-slate-500 font-medium animate-in fade-in slide-in-from-top-2">
                    {isXP ? 'Classifica Settimanale' : 'Classifica Concorso'}
                </p>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative w-full max-w-2xl mx-auto lg:pb-8">
                {/* Visual Decor */}
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-3xl opacity-30 pointer-events-none blur-3xl 
                    ${isXP ? 'bg-amber-200/50 dark:bg-amber-900/20' : 'bg-emerald-200/50 dark:bg-emerald-900/20'} transition-colors duration-500`}
                />

                <div className="relative h-full bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-t-3xl border-t border-r border-l border-white/50 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col">
                    <LeaderboardView
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
