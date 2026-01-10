import React, { useEffect, useState } from 'react';
import { Crown, Flame, Trophy, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface PowerUser {
    id: string;
    nickname: string;
    avatar_url: string | null;
    streak_current: number;
    streak_best: number;
    total_attempts: number;
    success_rate: number;
}

export default function PowerUsersCard() {
    const [users, setUsers] = useState<PowerUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'streak' | 'volume'>('streak');

    useEffect(() => {
        fetchPowerUsers();
    }, [viewMode]);

    async function fetchPowerUsers() {
        setLoading(true);
        try {
            if (viewMode === 'streak') {
                // Top users by current streak
                const { data } = await supabase
                    .from('profiles')
                    .select('id, nickname, avatar_url, streak_current, streak_best')
                    .order('streak_current', { ascending: false })
                    .limit(5);

                setUsers((data || []).map(u => ({
                    ...u,
                    total_attempts: 0,
                    success_rate: 0
                })));
            } else {
                // Top users by quiz volume - need to aggregate from attempts
                const { data: attempts } = await supabase
                    .from('quiz_attempts')
                    .select('user_id, is_idoneo, profiles(nickname, avatar_url, streak_current, streak_best)')
                    .not('finished_at', 'is', null)
                    .limit(500);

                // Aggregate by user
                const userStats: Record<string, PowerUser> = {};
                (attempts || []).forEach((a: any) => {
                    const uid = a.user_id;
                    if (!userStats[uid]) {
                        userStats[uid] = {
                            id: uid,
                            nickname: a.profiles?.nickname || 'Anonimo',
                            avatar_url: a.profiles?.avatar_url || null,
                            streak_current: a.profiles?.streak_current || 0,
                            streak_best: a.profiles?.streak_best || 0,
                            total_attempts: 0,
                            success_rate: 0
                        };
                    }
                    userStats[uid].total_attempts++;
                    if (a.is_idoneo) userStats[uid].success_rate++;
                });

                // Calculate success rate and sort
                const sorted = Object.values(userStats)
                    .map(u => ({
                        ...u,
                        success_rate: u.total_attempts > 0
                            ? Math.round((u.success_rate / u.total_attempts) * 100)
                            : 0
                    }))
                    .sort((a, b) => b.total_attempts - a.total_attempts)
                    .slice(0, 5);

                setUsers(sorted);
            }
        } catch (err) {
            console.error('Failed to fetch power users:', err);
        } finally {
            setLoading(false);
        }
    }

    const getRankColor = (index: number) => {
        if (index === 0) return 'from-yellow-400 to-amber-500';
        if (index === 1) return 'from-slate-300 to-slate-400';
        if (index === 2) return 'from-amber-600 to-orange-700';
        return 'from-slate-500 to-slate-600';
    };

    const getRankIcon = (index: number) => {
        if (index === 0) return <Crown className="w-3 h-3" />;
        if (index === 1) return <Trophy className="w-3 h-3" />;
        if (index === 2) return <Trophy className="w-3 h-3" />;
        return <span className="text-[10px] font-bold">{index + 1}</span>;
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] p-6 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                        <Crown className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Power Users</h3>
                </div>

                {/* Toggle */}
                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('streak')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${viewMode === 'streak'
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500'
                            }`}
                    >
                        <Flame className="w-3 h-3 inline mr-1" />
                        Streak
                    </button>
                    <button
                        onClick={() => setViewMode('volume')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${viewMode === 'volume'
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500'
                            }`}
                    >
                        <Trophy className="w-3 h-3 inline mr-1" />
                        Volume
                    </button>
                </div>
            </div>

            {/* Users List */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : users.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                    <Trophy className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Nessun dato disponibile</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {users.map((user, index) => (
                        <div
                            key={user.id}
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                        >
                            {/* Rank Badge */}
                            <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${getRankColor(index)} flex items-center justify-center text-white shadow-sm`}>
                                {getRankIcon(index)}
                            </div>

                            {/* Avatar */}
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center overflow-hidden">
                                {user.avatar_url ? (
                                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                                        {user.nickname?.[0]?.toUpperCase() || '?'}
                                    </span>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                                    {user.nickname || 'Anonimo'}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {viewMode === 'streak' ? (
                                        <>
                                            <Flame className="w-3 h-3 inline text-orange-500 mr-1" />
                                            {user.streak_current} giorni • Best: {user.streak_best}
                                        </>
                                    ) : (
                                        <>
                                            {user.total_attempts} quiz • {user.success_rate}% success
                                        </>
                                    )}
                                </p>
                            </div>

                            {/* Arrow */}
                            <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
