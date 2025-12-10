import React from 'react';
import { LeaderboardEntry } from '@/lib/leaderboardService';

interface LeaderboardViewProps {
    data: LeaderboardEntry[];
    loading: boolean;
    theme: 'gold' | 'emerald';
    metricLabel: string;
    emptyMessage?: string;
}

export default function LeaderboardView({ data, loading, theme, metricLabel, emptyMessage }: LeaderboardViewProps) {
    const top3 = data.slice(0, 3);
    const list = data.slice(3);

    const isGold = theme === 'gold';
    const accentColor = isGold ? 'text-amber-600' : 'text-emerald-500';
    const bgColor = isGold ? 'bg-amber-50 dark:bg-amber-900/10' : 'bg-emerald-50 dark:bg-emerald-900/10';

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4 animate-pulse">
                <div className="w-24 h-24 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                <div className="w-32 h-6 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                <div className="w-full max-w-md h-12 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                <div className="w-full max-w-md h-12 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4 ${bgColor} ${accentColor}`}>
                    {isGold ? '🏆' : '📊'}
                </div>
                <p className="font-bold text-lg text-slate-700 dark:text-slate-300">Nessun dato disponibile</p>
                <p className="text-sm mt-2">{emptyMessage || "La classifica è vuota. Partecipa per primo!"}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Stats Header */}
            <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-medium text-slate-500">
                    <span>👥 {data.length} Partecipanti</span>
                    <span>•</span>
                    <span className={accentColor}>{metricLabel}</span>
                </div>
            </div>

            {/* Podium */}
            <Podium top3={top3} theme={theme} metricLabel={metricLabel} />

            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                {list.map(entry => (
                    <RankingRow key={entry.rank} entry={entry} theme={theme} metricLabel={metricLabel} />
                ))}
            </div>
        </div>
    );
}

// --- Sub Components ---

const Podium = ({ top3, theme, metricLabel }: { top3: LeaderboardEntry[], theme: 'gold' | 'emerald', metricLabel: string }) => {
    const [first, second, third] = top3;
    const isGold = theme === 'gold';

    // Colors
    const ringColor = isGold ? 'ring-amber-400' : 'ring-emerald-500';
    const rankBg = isGold ? 'bg-amber-400' : 'bg-emerald-500';

    return (
        <div className="flex items-end justify-center gap-4 mb-4 min-h-[160px] pb-6 px-4">
            {/* 2nd Place */}
            <div className="flex flex-col items-center gap-2 w-1/3 max-w-[100px]">
                {second && (
                    <>
                        <div className="relative">
                            <div className={`w-16 h-16 rounded-full border-4 border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800`}>
                                <img src={second.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${second.user.nickname}`} alt={second.user.nickname} />
                            </div>
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ring-2 ring-white dark:ring-slate-900">2nd</div>
                        </div>
                        <div className="text-center w-full">
                            <div className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{second.user.nickname}</div>
                            <div className="text-xs font-mono font-bold text-slate-500">{Math.round(second.score)} {metricLabel}</div>
                        </div>
                    </>
                )}
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center gap-2 w-1/3 max-w-[120px] -mt-8 z-10">
                {first && (
                    <>
                        <div className="relative">
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-3xl animate-bounce">👑</div>
                            <div className={`w-24 h-24 rounded-full border-4 ${isGold ? 'border-amber-400' : 'border-emerald-500'} overflow-hidden bg-white dark:bg-slate-800 shadow-xl`}>
                                <img src={first.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${first.user.nickname}`} alt={first.user.nickname} />
                            </div>
                            <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 ${rankBg} text-white text-sm font-bold px-3 py-0.5 rounded-full ring-2 ring-white dark:ring-slate-900 shadow-lg`}>1st</div>
                        </div>
                        <div className="text-center w-full mt-1">
                            <div className="font-bold text-base text-slate-900 dark:text-white truncate">{first.user.nickname}</div>
                            <div className={`text-sm font-mono font-bold ${isGold ? 'text-amber-600' : 'text-emerald-500'}`}>{first.score} {metricLabel}</div>
                        </div>
                    </>
                )}
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center gap-2 w-1/3 max-w-[100px]">
                {third && (
                    <>
                        <div className="relative">
                            <div className={`w-16 h-16 rounded-full border-4 border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800`}>
                                <img src={third.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${third.user.nickname}`} alt={third.user.nickname} />
                            </div>
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-700/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ring-2 ring-white dark:ring-slate-900">3rd</div>
                        </div>
                        <div className="text-center w-full">
                            <div className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{third.user.nickname}</div>
                            <div className="text-xs font-mono font-bold text-slate-500">{Math.round(third.score)} {metricLabel}</div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const RankingRow = ({ entry, theme, metricLabel }: { key?: React.Key; entry: LeaderboardEntry, theme: 'gold' | 'emerald', metricLabel: string }) => {
    const isGold = theme === 'gold';
    const activeClass = isGold
        ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-700'
        : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-700';

    return (
        <div className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${entry.isCurrentUser
            ? `border ${activeClass} shadow-sm transform scale-[1.01]`
            : 'bg-white dark:bg-slate-800 border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}>
            <span className={`font-mono font-bold w-6 text-center text-slate-400`}>
                {entry.rank}
            </span>

            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden flex-shrink-0">
                <img src={entry.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.user.nickname}`} alt="Avatar" />
            </div>

            <div className="flex-1 min-w-0">
                <div className={`font-bold text-sm truncate text-slate-900 dark:text-white`}>
                    {entry.user.nickname} {entry.isCurrentUser && <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded ml-2 text-slate-500">YOU</span>}
                </div>
            </div>

            <div className={`font-mono font-bold ${isGold ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {entry.score} <span className="text-[10px] uppercase opacity-50 text-slate-400">{metricLabel}</span>
            </div>
        </div>
    );
};
