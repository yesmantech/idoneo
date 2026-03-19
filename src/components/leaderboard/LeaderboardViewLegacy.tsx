import React, { useRef } from 'react';
import { LeaderboardEntry } from '@/lib/leaderboardService';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Crown, Medal } from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';

interface LeaderboardViewProps {
    data: LeaderboardEntry[];
    loading: boolean;
    theme: 'gold' | 'emerald';
    metricLabel: string;
    emptyMessage?: string;
}

export default function LeaderboardViewLegacy({ data, loading, theme, metricLabel, emptyMessage }: LeaderboardViewProps) {
    const parentRef = useRef<HTMLDivElement>(null);
    const top3 = data.slice(0, 3);
    const list = data.slice(3);

    const isGold = theme === 'gold';
    const accentColor = isGold ? 'text-brand-orange' : 'text-brand-cyan';
    const bgColor = isGold ? 'bg-brand-orange/10' : 'bg-brand-cyan/10';

    // Virtualizer for the list
    const rowVirtualizer = useVirtualizer({
        count: list.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 76, // 64 height + 12 gap roughly
        overscan: 5,
    });

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
                    {isGold ? '🏆' : <Medal className="w-7 h-7" />}
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
            <div ref={parentRef} className="flex-1 overflow-y-auto px-6 pb-24 scrollbar-thin scrollbar-thumb-gray-200">
                <div
                    style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                    }}
                >
                    {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                        const entry = list[virtualItem.index];
                        return (
                            <div
                                key={virtualItem.key}
                                className="absolute top-0 left-0 w-full pb-3" // Add bottom padding to act as gap
                                style={{
                                    height: `${virtualItem.size}px`,
                                    transform: `translateY(${virtualItem.start}px)`,
                                }}
                            >
                                <RankingRow entry={entry} theme={theme} metricLabel={metricLabel} />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}



// --- Sub Components ---

const Podium = ({ top3, theme, metricLabel }: { top3: LeaderboardEntry[], theme: 'gold' | 'emerald', metricLabel: string }) => {
    const [first, second, third] = top3;
    const isGold = theme === 'gold';

    return (
        <div className="flex items-end justify-center gap-2 sm:gap-4 min-h-[220px] pb-6 px-2 pt-10">
            {/* 2nd Place - Silver */}
            <div className="flex flex-col items-center gap-3 w-1/3 max-w-[110px] order-1">
                {second && (
                    <>
                        <div className="relative group">
                            <div className="w-20 h-20 rounded-[28px] border-[3px] border-slate-200 dark:border-slate-700 bg-[var(--card)] shadow-[0_4px_12px_rgba(0,0,0,0.1)] p-0.5 flex items-center justify-center z-10 relative">
                                <UserAvatar src={second.user.avatarUrl} name={second.user.nickname} size="xl" className="!rounded-[20px]" />
                            </div>
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-[var(--card)] shadow-sm z-20">
                                2
                            </div>
                        </div>
                        <div className="text-center w-full mt-1">
                            <div className="font-bold text-[13px] text-[var(--foreground)] truncate px-1">{second.user.nickname}</div>
                            <div className="text-[11px] font-bold text-[var(--foreground)] opacity-50">{Math.round(second.score)} {metricLabel}</div>
                        </div>
                    </>
                )}
            </div>

            {/* 1st Place - Gold */}
            <div className="flex flex-col items-center gap-1 w-1/3 max-w-[130px] -mt-14 order-2 z-20">
                {first && (
                    <>
                        {/* Crown — in normal flow, not absolute */}
                        <div className="flex justify-center pointer-events-none mb-1">
                            <Crown className="w-10 h-10 text-amber-400 fill-amber-400 drop-shadow-md animate-bounce-subtle" />
                        </div>
                        <div className="relative group">
                            <div className={`w-24 h-24 rounded-[32px] border-[3px] ${isGold ? 'border-amber-300 dark:border-amber-500/50' : 'border-cyan-300 dark:border-cyan-500/50'} bg-[var(--card)] ${isGold ? 'shadow-[0_8px_24px_rgba(251,191,36,0.3)]' : 'shadow-[0_8px_24px_rgba(6,182,212,0.3)]'} p-0.5 flex items-center justify-center z-10 relative ${isGold ? 'ring-4 ring-amber-50 dark:ring-amber-900/20' : 'ring-4 ring-cyan-50 dark:ring-cyan-900/20'}`}>
                                <UserAvatar src={first.user.avatarUrl} name={first.user.nickname} size="2xl" className="!rounded-[24px]" />
                            </div>
                            <div className={`absolute -bottom-3.5 left-1/2 -translate-x-1/2 ${isGold ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-cyan-400 to-cyan-500'} text-white text-[12px] font-black px-4 py-0.5 rounded-full border-2 border-[var(--card)] shadow-md z-20 flex items-center gap-1`}>
                                <span>1</span>
                            </div>
                        </div>
                        <div className="text-center w-full mt-3">
                            <div className="font-black text-[15px] text-[var(--foreground)] truncate px-1">{first.user.nickname}</div>
                            <div className={`text-[13px] font-bold ${isGold ? 'text-amber-500' : 'text-cyan-500'}`}>{first.score} <span className="text-[10px] opacity-75">{metricLabel}</span></div>
                        </div>
                    </>
                )}
            </div>

            {/* 3rd Place - Bronze */}
            <div className="flex flex-col items-center gap-3 w-1/3 max-w-[110px] order-3">
                {third && (
                    <>
                        <div className="relative group">
                            <div className="w-20 h-20 rounded-[28px] border-[3px] border-orange-200 dark:border-orange-800/50 bg-[var(--card)] shadow-[0_4px_12px_rgba(0,0,0,0.1)] p-0.5 flex items-center justify-center z-10 relative">
                                <UserAvatar src={third.user.avatarUrl} name={third.user.nickname} size="xl" className="!rounded-[20px]" />
                            </div>
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-[var(--card)] shadow-sm z-20">
                                3
                            </div>
                        </div>
                        <div className="text-center w-full mt-1">
                            <div className="font-bold text-[13px] text-[var(--foreground)] truncate px-1">{third.user.nickname}</div>
                            <div className="text-[11px] font-bold text-[var(--foreground)] opacity-50">{Math.round(third.score)} {metricLabel}</div>
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

            <UserAvatar src={entry.user.avatarUrl} name={entry.user.nickname} size="md" className="rounded-squircle flex-shrink-0 shadow-sm" />

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
