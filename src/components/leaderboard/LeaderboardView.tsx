import React from 'react';
import { LeaderboardEntry } from '@/lib/leaderboardService';
import { Trophy, Crown, Medal } from 'lucide-react'; // Assuming lucide is available as per other files

interface LeaderboardViewProps {
    data: LeaderboardEntry[];
    loading: boolean;
    theme: 'gold' | 'emerald';
    metricLabel: string;
    emptyMessage?: string;
    currentUserEntry?: LeaderboardEntry | null;
}

export default function LeaderboardView({ data, loading, theme, metricLabel, emptyMessage, currentUserEntry }: LeaderboardViewProps) {
    const top3 = data.slice(0, 3);
    const list = data.slice(3);

    const isUserInTopList = data.some(e => e.isCurrentUser);
    const showStickyUser = !!currentUserEntry && !isUserInTopList;

    const isGold = theme === 'gold';

    // Loading State
    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6 animate-pulse">
                <div className="flex items-end justify-center gap-4 w-full">
                    <div className="w-20 h-24 bg-slate-100 dark:bg-slate-800 rounded-t-2xl"></div>
                    <div className="w-24 h-32 bg-slate-100 dark:bg-slate-800 rounded-t-2xl"></div>
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-t-2xl"></div>
                </div>
                <div className="space-y-3 w-full">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="w-full h-14 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    // Empty State
    if (data.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-[var(--foreground)] opacity-40 p-8">
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-6 shadow-sm border border-[var(--card-border)] ${isGold ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-500' : 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-500'}`}>
                    {isGold ? <Trophy className="w-10 h-10" /> : <span className="text-3xl">📊</span>}
                </div>
                <h3 className="font-bold text-xl text-[var(--foreground)] mb-2">Classifica Vuota</h3>
                <p className="text-center text-[var(--foreground)] opacity-50 max-w-[200px] leading-relaxed">
                    {emptyMessage || "Ancora nessun partecipante. Sii il primo a scalare la vetta!"}
                </p>
                {/* CTA could go here */}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[var(--card)]">


            <div className="flex-1 overflow-y-auto scrollbar-hide relative bg-[var(--card)]">
                <div className="px-4 pb-20 pt-4">
                    {/* PODIUM */}
                    <div className="mb-8">
                        <Podium top3={top3} metricLabel={metricLabel} />
                    </div>

                    {/* RANKING LIST */}
                    <div className="space-y-1">
                        {list.map(entry => (
                            <RankingRow key={entry.rank} entry={entry} metricLabel={metricLabel} />
                        ))}

                        {/* Placeholder for 'User not ranked' if needed */}
                        {/* Logic: If user is logged in but not in data, show message. 
                            But data usually includes user if we fetch getUserActiveQuizzes? 
                            Actual logic depends on backend. We'll rely on the list.
                        */}
                    </div>
                </div>
            </div>

            {/* STICKY USER ROW */}
            {showStickyUser && currentUserEntry && (
                <div className="flex-none p-4 pb-6 bg-[var(--card)] border-t border-[var(--card-border)] shadow-[0_-8px_30px_rgb(0,0,0,0.1)] z-50">
                    <div className="max-w-3xl mx-auto">
                        <div className="text-[10px] font-black text-[var(--foreground)] opacity-40 uppercase tracking-widest mb-2 text-center">
                            La tua posizione attuale
                        </div>
                        <RankingRow
                            entry={currentUserEntry}
                            metricLabel={metricLabel}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Sub Components ---

const Podium = ({ top3, metricLabel }: { top3: LeaderboardEntry[], metricLabel: string }) => {
    const [first, second, third] = top3;

    return (
        <div className="flex items-end justify-center gap-2 sm:gap-4 min-h-[220px] px-2 pt-16 overflow-visible">
            {/* 2nd Place - Silver */}
            <div className="flex flex-col items-center gap-3 w-1/3 max-w-[110px] order-1">
                {second && (
                    <>
                        <div className="relative group">
                            <div className="w-20 h-20 rounded-[28px] border-[3px] border-slate-200 dark:border-slate-700 bg-[var(--card)] shadow-[0_4px_12px_rgba(0,0,0,0.1)] p-0.5 overflow-hidden z-10 relative">
                                <img
                                    src={second.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${second.user.nickname}`}
                                    alt={second.user.nickname}
                                    className="w-full h-full object-cover rounded-[20px]"
                                />
                            </div>
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-[var(--card)] shadow-sm z-20">
                                2
                            </div>
                        </div>
                        <div className="text-center w-full mt-1">
                            <div className="font-bold text-[13px] text-[var(--foreground)] truncate px-1">{second.user.nickname}</div>
                            <div className="text-[11px] font-bold text-[var(--foreground)] opacity-50">{Math.round(second.score)} XP</div>
                        </div>
                    </>
                )}
            </div>

            {/* 1st Place - Gold */}
            <div className="flex flex-col items-center gap-3 w-1/3 max-w-[130px] -mt-14 order-2 z-20 overflow-visible">
                {first && (
                    <>
                        <div className="relative group scale-110">
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 pointer-events-none z-50">
                                <Crown className="w-10 h-10 text-amber-400 fill-amber-400 drop-shadow-md animate-bounce-subtle" />
                            </div>
                            <div className="w-24 h-24 rounded-[32px] border-[3px] border-amber-300 dark:border-amber-500/50 bg-[var(--card)] shadow-[0_8px_24px_rgba(251,191,36,0.3)] p-0.5 overflow-hidden z-10 relative ring-4 ring-amber-50 dark:ring-amber-900/20">
                                <img
                                    src={first.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${first.user.nickname}`}
                                    alt={first.user.nickname}
                                    className="w-full h-full object-cover rounded-[24px]"
                                />
                            </div>
                            <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-[12px] font-black px-4 py-0.5 rounded-full border-2 border-[var(--card)] shadow-md z-20 flex items-center gap-1">
                                <span>1</span>
                            </div>
                        </div>
                        <div className="text-center w-full mt-3">
                            <div className="font-black text-[15px] text-[var(--foreground)] truncate px-1">{first.user.nickname}</div>
                            <div className="text-[13px] font-bold text-amber-500">{first.score} <span className="text-[10px] opacity-75">{metricLabel}</span></div>
                        </div>
                    </>
                )}
            </div>

            {/* 3rd Place - Bronze */}
            <div className="flex flex-col items-center gap-3 w-1/3 max-w-[110px] order-3">
                {third && (
                    <>
                        <div className="relative group">
                            <div className="w-20 h-20 rounded-[28px] border-[3px] border-orange-200 dark:border-orange-800/50 bg-[var(--card)] shadow-[0_4px_12px_rgba(0,0,0,0.1)] p-0.5 overflow-hidden z-10 relative">
                                <img
                                    src={third.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${third.user.nickname}`}
                                    alt={third.user.nickname}
                                    className="w-full h-full object-cover rounded-[20px]"
                                />
                            </div>
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-[var(--card)] shadow-sm z-20">
                                3
                            </div>
                        </div>
                        <div className="text-center w-full mt-1">
                            <div className="font-bold text-[13px] text-[var(--foreground)] truncate px-1">{third.user.nickname}</div>
                            <div className="text-[11px] font-bold text-[var(--foreground)] opacity-50">{Math.round(third.score)} XP</div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const RankingRow = ({ entry, metricLabel }: { key?: React.Key, entry: LeaderboardEntry, metricLabel: string }) => {
    const [expanded, setExpanded] = React.useState(false);

    // Only expand if breakdown exists
    const hasBreakdown = !!entry.breakdown;

    return (
        <div
            onClick={() => hasBreakdown && setExpanded(!expanded)}
            className={`group flex flex-col p-3.5 rounded-[24px] transition-all duration-200 cursor-pointer ${entry.isCurrentUser
                ? 'bg-sky-50 dark:bg-sky-900/30 border border-sky-100 dark:border-sky-800 shadow-sm scale-[1.01] sticky z-30 -mx-2 px-5'
                : 'bg-transparent border border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}>

            <div className="flex items-center gap-4 w-full">
                <span className={`font-bold w-6 text-center text-[13px] text-[var(--foreground)] opacity-40 font-mono`}>
                    {entry.rank}
                </span>

                <div className="w-10 h-10 rounded-[16px] bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 shadow-sm border border-[var(--card-border)]">
                    <img
                        src={entry.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.user.nickname}`}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                    />
                </div>

                <div className="flex-1 min-w-0 flex items-center gap-2">
                    <div className="font-bold text-[15px] truncate text-[var(--foreground)] flex items-center gap-2">
                        {entry.user.nickname}
                    </div>
                    {entry.isCurrentUser && (
                        <span className="text-[10px] bg-[#00B1FF] text-white px-2 py-0.5 rounded-full font-bold tracking-wide shadow-sm shadow-blue-500/20">
                            YOU
                        </span>
                    )}
                </div>

                <div className="font-bold text-[15px] text-[var(--foreground)] tracking-tight text-right">
                    <div>{entry.score} <span className="text-[11px] font-bold text-[var(--foreground)] opacity-40">{metricLabel}</span></div>
                </div>
            </div>

            {/* Breakdown Panel */}
            {expanded && entry.breakdown && (
                <div className="mt-3 pt-3 border-t border-[var(--card-border)] grid grid-cols-4 gap-2 text-center animate-in slide-in-from-top-1">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-[var(--foreground)] opacity-40 uppercase font-bold tracking-wider">Volume</span>
                        <span className="text-xs font-bold text-[var(--foreground)]">{Math.round(entry.breakdown.volume * 100)}%</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-[var(--foreground)] opacity-40 uppercase font-bold tracking-wider">Accur.</span>
                        <span className="text-xs font-bold text-[var(--foreground)]">{Math.round(entry.breakdown.accuracy * 100)}%</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-[var(--foreground)] opacity-40 uppercase font-bold tracking-wider">Recent</span>
                        <span className="text-xs font-bold text-[var(--foreground)]">{Math.round(entry.breakdown.recency * 100)}%</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-[var(--foreground)] opacity-40 uppercase font-bold tracking-wider">Cover</span>
                        <span className="text-xs font-bold text-[var(--foreground)]">{Math.round(entry.breakdown.coverage * 100)}%</span>
                    </div>

                    {/* Reliability Warning */}
                    {entry.breakdown.reliability < 1 && (
                        <div className="col-span-4 mt-2 text-[10px] text-amber-500 bg-amber-50 dark:bg-amber-900/30 p-1.5 rounded-lg text-center font-medium">
                            ⚠️ Low Reliability (Need more unique questions)
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
