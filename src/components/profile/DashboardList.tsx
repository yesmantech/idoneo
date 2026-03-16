import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { leaderboardService } from '@/lib/leaderboardService';
import DashboardCard from './DashboardCard';

interface DashboardListProps {
    userId: string;
}

export default function DashboardList({ userId }: DashboardListProps) {
    const navigate = useNavigate();

    const { data: quizzes = [], isLoading: loading } = useQuery({
        queryKey: ['user-active-quizzes', userId],
        queryFn: () => leaderboardService.getUserActiveQuizzes(userId),
        enabled: !!userId,
        staleTime: 5 * 60 * 1000, // 5 min — instant on back/forward
    });

    if (loading) return <div className="py-8 text-center text-slate-400 animate-pulse">Caricamento corsi...</div>;

    if (quizzes.length === 0) {
        return (
            <div className="text-center py-12 bg-white dark:bg-[var(--card)] rounded-[32px] border border-slate-100/60 dark:border-slate-800 mb-8 shadow-sm transition-colors">
                <div className="text-4xl mb-4">☁️</div>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">Non hai ancora iniziato nessun corso.</p>
                <button
                    onClick={() => navigate('/')}
                    className="text-white bg-[#00B1FF] px-8 py-3.5 rounded-2xl font-bold hover:shadow-lg hover:scale-105 transition-all"
                >
                    Inizia ora!
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4 mb-8">

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {quizzes.map((q: any) => (
                    <DashboardCard
                        key={q.id}
                        quizId={q.id}
                        title={q.title}
                        category={q.category}
                        progress={q.coverage || 0}
                        onClick={() => navigate(`/profile/stats/${q.id}`)}
                    />
                ))}
            </div>

            {/* Add Button (Mobile Only / Bottom) */}
            <div className="md:hidden pt-2">
                <button
                    onClick={() => navigate('/')}
                    className="w-full py-4 rounded-full border-2 border-dashed border-slate-300 dark:border-white/20 text-slate-400 dark:text-white/50 font-bold hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-600 dark:hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                    <span className="text-xl leading-none mb-0.5">+</span> Aggiungi corsi
                </button>
            </div>
        </div>
    );
}
