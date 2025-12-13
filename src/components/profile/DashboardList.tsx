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
            <div className="text-center py-12 bg-canvas-light rounded-card border-none mb-8">
                <div className="text-4xl mb-3">☁️</div>
                <p className="text-text-secondary font-medium mb-6">Non hai ancora iniziato nessun corso.</p>
                <button
                    onClick={() => navigate('/')}
                    className="text-white bg-brand-cyan px-6 py-3 rounded-pill font-bold hover:shadow-lg hover:scale-105 transition-all"
                >
                    Inizia ora!
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 mb-8">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-lg font-bold text-text-primary">La tua Dashboard</h3>

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
                    className="w-full py-4 rounded-card border-2 border-canvas-light text-text-tertiary font-bold hover:bg-canvas-light hover:text-text-secondary transition-colors"
                >
                    + Aggiungi corsi
                </button>
            </div>
        </div>
    );
}
