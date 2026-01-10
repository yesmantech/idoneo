import React from 'react';
import { LeaderboardEntry } from '@/lib/leaderboardService';

interface LeaderboardViewProps {
    data: LeaderboardEntry[];
    loading: boolean;
    theme: 'gold' | 'emerald';
    metricLabel: string;
    emptyMessage?: string;
}

export default function LeaderboardViewLegacy({ data, loading, theme, metricLabel, emptyMessage }: LeaderboardViewProps) {
    const top3 = data.slice(0, 3);
    const list = data.slice(3);

    const isGold = theme === 'gold';
    const accentColor = isGold ? 'text-brand-orange' : 'text-brand-cyan';
    const bgColor = isGold ? 'bg-brand-orange/10' : 'bg-brand-cyan/10';

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
            <div className="flex-1 flex flex-col items-center justify-center text-text-tertiary p-8">
                <div className={`w-16 h-16 rounded-squircle flex items-center justify-center text-3xl mb-4 ${bgColor} ${accentColor}`}>
                    {isGold ? '🏆' : '📊'}
                </div>
                <p className="font-bold text-lg text-text-primary">Nessun dato disponibile</p>
                <p className="text-sm mt-2">{emptyMessage || "La classifica è vuota. Partecipa per primo!"}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Removed redundant Stats Header as it's now in UnifiedLeaderboardPage */}

            {/* Podium */}
            <Podium top3={top3} theme={theme} metricLabel={metricLabel} />

            {/* List */}
            <div className="flex-1 overflow-y-auto px-6 pb-24 space-y-3 scrollbar-thin scrollbar-thumb-gray-200">
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
    const rankBg = isGold ? 'bg-brand-orange' : 'bg-brand-cyan';

    return (
        <div className="flex items-end justify-center gap-4 mb-4 min-h-[220px] pb-6 px-4 pt-24 overflow-visible">
            {/* 2nd Place */}
            <div className="flex flex-col items-center gap-2 w-1/3 max-w-[100px]">
                {second && (
                    <>
                        <div className="relative group hover:scale-105 transition-transform duration-300">
                            <div className={`w-16 h-16 rounded-squircle border-4 border-white shadow-soft overflow-hidden bg-white`}>
                                <img src={second.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${second.user.nickname}`} alt={second.user.nickname} className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-text-secondary text-white text-[10px] font-black px-2 py-0.5 rounded-pill shadow-sm">2nd</div>
                        </div>
                        <div className="text-center w-full">
                            <div className="font-bold text-sm text-text-primary truncate">{second.user.nickname}</div>
                            <div className="text-xs font-black text-text-tertiary">{Math.round(second.score)}</div>
                        </div>
                    </>
                )}
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center gap-2 w-1/3 max-w-[120px] -mt-10 z-10">
                {first && (
                    <>
                        <div className="relative group hover:scale-105 transition-transform duration-300">
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-3xl animate-bounce">👑</div>
                            <div className={`w-24 h-24 rounded-squircle border-4 ${isGold ? 'border-brand-orange' : 'border-brand-cyan'} overflow-hidden bg-white shadow-card`}>
                                <img src={first.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${first.user.nickname}`} alt={first.user.nickname} className="w-full h-full object-cover" />
                            </div>
                            <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 ${rankBg} text-white text-sm font-black px-3 py-1 rounded-pill shadow-lg border-2 border-white`}>1st</div>
                        </div>
                        <div className="text-center w-full mt-2">
                            <div className="font-black text-base text-text-primary truncate">{first.user.nickname}</div>
                            <div className={`text-sm font-black ${isGold ? 'text-brand-orange' : 'text-brand-cyan'}`}>{first.score} <span className="text-[10px] uppercase opacity-70">{metricLabel}</span></div>
                        </div>
                    </>
                )}
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center gap-2 w-1/3 max-w-[100px]">
                {third && (
                    <>
                        <div className="relative group hover:scale-105 transition-transform duration-300">
                            <div className={`w-16 h-16 rounded-squircle border-4 border-white shadow-soft overflow-hidden bg-white`}>
                                <img src={third.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${third.user.nickname}`} alt={third.user.nickname} className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-text-tertiary text-white text-[10px] font-black px-2 py-0.5 rounded-pill shadow-sm">3rd</div>
                        </div>
                        <div className="text-center w-full">
                            <div className="font-bold text-sm text-text-primary truncate">{third.user.nickname}</div>
                            <div className="text-xs font-black text-text-tertiary">{Math.round(third.score)}</div>
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
        ? 'bg-brand-orange/5 border-brand-orange/20 shadow-soft'
        : 'bg-brand-cyan/5 border-brand-cyan/20 shadow-soft';

    return (
        <div className={`flex items-center gap-4 p-3 rounded-xl border transition-all duration-200 ${entry.isCurrentUser
            ? `border ${activeClass} transform scale-[1.01]`
            : 'bg-[var(--card)] border-transparent hover:bg-slate-100 dark:hover:bg-slate-700 hover:scale-[1.01] hover:shadow-sm'
            }`}>
            <span className={`font-black w-6 text-center text-sm text-text-tertiary`}>
                {entry.rank}
            </span>

            <div className="w-10 h-10 rounded-squircle bg-slate-100 dark:bg-slate-700 overflow-hidden flex-shrink-0 shadow-sm border border-transparent">
                <img src={entry.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.user.nickname}`} alt="Avatar" className="w-full h-full object-cover" />
            </div>

            <div className="flex-1 min-w-0">
                <div className={`font-bold text-sm truncate text-text-primary flex items-center gap-2`}>
                    {entry.user.nickname} {entry.isCurrentUser && <span className="text-[9px] bg-brand-cyan text-white px-1.5 py-0.5 rounded-pill font-black tracking-wide">YOU</span>}
                </div>
            </div>

            <div className={`font-black text-sm ${isGold ? 'text-brand-orange' : 'text-brand-cyan'}`}>
                {entry.score} <span className="text-[10px] uppercase font-bold opacity-50 text-text-tertiary">{metricLabel}</span>
            </div>
        </div>
    );
};
