import React from 'react';
import { LeaderboardEntry } from '@/lib/leaderboardService';
import { Trophy, Crown, Medal } from 'lucide-react'; // Assuming lucide is available as per other files

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

    // Loading State
    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6 animate-pulse">
                <div className="flex items-end justify-center gap-4 w-full">
                    <div className="w-20 h-24 bg-slate-100 rounded-t-2xl"></div>
                    <div className="w-24 h-32 bg-slate-100 rounded-t-2xl"></div>
                    <div className="w-20 h-20 bg-slate-100 rounded-t-2xl"></div>
                </div>
                <div className="space-y-3 w-full">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="w-full h-14 bg-slate-100 rounded-xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    // Empty State
    if (data.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-6 shadow-sm border border-slate-100 ${isGold ? 'bg-amber-50 text-amber-500' : 'bg-cyan-50 text-cyan-500'}`}>
                    {isGold ? <Trophy className="w-10 h-10" /> : <span className="text-3xl">📊</span>}
                </div>
                <h3 className="font-bold text-xl text-slate-900 mb-2">Classifica Vuota</h3>
                <p className="text-center text-slate-500 max-w-[200px] leading-relaxed">
                    {emptyMessage || "Ancora nessun partecipante. Sii il primo a scalare la vetta!"}
                </p>
                {/* CTA could go here */}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white">

            {/* Meta Header */}
            <div className="text-center py-6 border-b border-slate-50 bg-gradient-to-b from-white to-slate-50/50">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100/50 rounded-full border border-slate-200/50">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {data.length} Partecipanti
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide relative">
                <div className="px-4 pb-20 pt-6">
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
        </div>
    );
}

// --- Sub Components ---

const Podium = ({ top3, metricLabel }: { top3: LeaderboardEntry[], metricLabel: string }) => {
    const [first, second, third] = top3;

    return (
        <div className="flex items-end justify-center gap-2 sm:gap-4 min-h-[190px] px-2">
            {/* 2nd Place - Silver */}
            <div className="flex flex-col items-center gap-3 w-1/3 max-w-[110px] order-1">
                {second && (
                    <>
                        <div className="relative group">
                            <div className="w-20 h-20 rounded-[24px] border-[3px] border-slate-200 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.06)] p-0.5 overflow-hidden z-10 relative">
                                <img
                                    src={second.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${second.user.nickname}`}
                                    alt={second.user.nickname}
                                    className="w-full h-full object-cover rounded-[20px]"
                                />
                            </div>
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-200 text-slate-600 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-white shadow-sm z-20">
                                2
                            </div>
                        </div>
                        <div className="text-center w-full mt-1">
                            <div className="font-bold text-[13px] text-slate-800 truncate px-1">{second.user.nickname}</div>
                            <div className="text-[11px] font-bold text-slate-400">{Math.round(second.score)} XP</div>
                        </div>
                    </>
                )}
            </div>

            {/* 1st Place - Gold */}
            <div className="flex flex-col items-center gap-3 w-1/3 max-w-[130px] -mt-8 order-2 z-20">
                {first && (
                    <>
                        <div className="relative group scale-110">
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 pointer-events-none">
                                <Crown className="w-8 h-8 text-amber-400 fill-amber-400 drop-shadow-sm" />
                            </div>
                            <div className="w-24 h-24 rounded-[28px] border-[3px] border-amber-300 bg-white shadow-[0_8px_24px_rgba(251,191,36,0.25)] p-0.5 overflow-hidden z-10 relative ring-4 ring-amber-50">
                                <img
                                    src={first.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${first.user.nickname}`}
                                    alt={first.user.nickname}
                                    className="w-full h-full object-cover rounded-[24px]"
                                />
                            </div>
                            <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-[12px] font-black px-4 py-0.5 rounded-full border-2 border-white shadow-md z-20 flex items-center gap-1">
                                <span>1</span>
                            </div>
                        </div>
                        <div className="text-center w-full mt-3">
                            <div className="font-black text-[15px] text-slate-900 truncate px-1">{first.user.nickname}</div>
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
                            <div className="w-20 h-20 rounded-[24px] border-[3px] border-orange-200 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.06)] p-0.5 overflow-hidden z-10 relative">
                                <img
                                    src={third.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${third.user.nickname}`}
                                    alt={third.user.nickname}
                                    className="w-full h-full object-cover rounded-[20px]"
                                />
                            </div>
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-orange-100 text-orange-700 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-white shadow-sm z-20">
                                3
                            </div>
                        </div>
                        <div className="text-center w-full mt-1">
                            <div className="font-bold text-[13px] text-slate-800 truncate px-1">{third.user.nickname}</div>
                            <div className="text-[11px] font-bold text-slate-400">{Math.round(third.score)} XP</div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const RankingRow = ({ entry, metricLabel }: { entry: LeaderboardEntry, metricLabel: string }) => {
    return (
        <div className={`group flex items-center gap-4 p-3.5 rounded-[20px] transition-all duration-200 ${entry.isCurrentUser
            ? 'bg-[#F0F9FF] border border-[#BAE6FD] shadow-sm scale-[1.01] sticky z-30 -mx-2 px-5'
            : 'bg-transparent border border-transparent hover:bg-slate-50'
            }`}>

            <span className={`font-bold w-6 text-center text-[13px] text-slate-400 font-mono`}>
                {entry.rank}
            </span>

            <div className="w-10 h-10 rounded-[14px] bg-slate-100 overflow-hidden flex-shrink-0 shadow-sm border border-slate-50">
                <img
                    src={entry.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.user.nickname}`}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                />
            </div>

            <div className="flex-1 min-w-0 flex items-center gap-2">
                <div className="font-bold text-[15px] truncate text-slate-700 flex items-center gap-2">
                    {entry.user.nickname}
                </div>
                {entry.isCurrentUser && (
                    <span className="text-[10px] bg-[#00B1FF] text-white px-2 py-0.5 rounded-full font-bold tracking-wide shadow-sm shadow-blue-200">
                        YOU
                    </span>
                )}
            </div>

            <div className="font-bold text-[15px] text-slate-900 tracking-tight">
                {entry.score} <span className="text-[11px] font-bold text-slate-400">{metricLabel}</span>
            </div>
        </div>
    );
};
