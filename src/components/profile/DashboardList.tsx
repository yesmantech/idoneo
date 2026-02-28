import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { leaderboardService } from '@/lib/leaderboardService';
import DashboardCard from './DashboardCard';

interface DashboardListProps {
    userId: string;
    xp?: number;
}

export default function DashboardList({ userId, xp = 0 }: DashboardListProps) {
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
            <div className="flex items-center justify-between px-2">
                <h3 className="text-[20px] font-bold text-white tracking-wide">La tua Dashboard</h3>
                {/* XP Pill */}
                <div className="flex items-center gap-1.5 bg-[#E0F4FF] dark:bg-[#001F3F] px-3.5 py-2 rounded-2xl">
                    <span
                        className="font-black select-none"
                        style={{
                            fontSize: '18px',
                            lineHeight: 1,
                            letterSpacing: '-0.5px',
                            background: 'linear-gradient(180deg, #67E8F9 0%, #00B1FF 50%, #0077CC 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        XP
                    </span>
                    <span className="text-[17px] font-bold text-[#00B1FF] leading-none">{xp.toLocaleString()}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
            <div className="md:hidden pt-2">
                <button
                    onClick={() => navigate('/')}
                    className="w-full py-4 rounded-full border-2 border-dashed border-white/20 text-white/50 font-bold hover:bg-white/5 hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                    <span className="text-xl leading-none mb-0.5">+</span> Aggiungi corsi
                </button>
            </div>
        </div>
    );
}
