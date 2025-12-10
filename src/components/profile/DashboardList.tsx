import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { leaderboardService } from '@/lib/leaderboardService';
import DashboardCard from './DashboardCard';

interface DashboardListProps {
    userId: string;
}

export default function DashboardList({ userId }: DashboardListProps) {
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const data = await leaderboardService.getUserActiveQuizzes(userId);
                setQuizzes(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        if (userId) load();
    }, [userId]);

    if (loading) return <div className="py-8 text-center text-slate-400 animate-pulse">Caricamento corsi...</div>;

    if (quizzes.length === 0) {
        return (
            <div className="text-center py-8 bg-slate-100 rounded-2xl border border-slate-200 border-dashed mb-8">
                <p className="text-slate-500 font-medium mb-2">Non hai ancora iniziato nessun corso.</p>
                <button
                    onClick={() => navigate('/')}
                    className="text-emerald-600 font-bold hover:underline"
                >
                    Inizia ora!
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-lg font-bold text-slate-800">La tua Dashboard</h3>
                <button onClick={() => navigate('/')} className="text-sm font-bold text-emerald-600 hover:text-emerald-700">
                    + Nuovo
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quizzes.map((q) => (
                    <DashboardCard
                        key={q.id}
                        quizId={q.id}
                        title={q.title}
                        category={q.category}
                        progress={q.accuracy || 0}
                        onClick={() => navigate(`/profile/stats/${q.id}`)}
                    />
                ))}
            </div>

            {/* Add Button (Mobile Only / Bottom) */}
            <div className="md:hidden">
                <button
                    onClick={() => navigate('/')}
                    className="w-full py-3 rounded-xl border-2 border-slate-200 border-dashed text-slate-400 font-bold hover:bg-slate-50 transition-colors"
                >
                    + Aggiungi corsi
                </button>
            </div>
        </div>
    );
}
