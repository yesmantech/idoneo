import React, { useState } from 'react';

// Types
interface LeaderboardEntry {
    rank: number;
    user: {
        avatarUrl?: string;
        nickname: string;
        id: string;
    };
    score: number; // For XP or Skill Score
    isCurrentUser?: boolean;
}

// --- Components ---

// 1. Podium (Top 3)
const Podium = ({ top3, context }: { top3: LeaderboardEntry[], context: 'skill' | 'xp' }) => {
    // Expected order: [2nd, 1st, 3rd] for visual layout usually, or we sort properly.
    // Let's assume input matches 1st, 2nd, 3rd logic, but we map them to slots.
    const [first, second, third] = top3;

    // Theme colors
    const isDark = context === 'skill';
    const textColor = isDark ? 'text-white' : 'text-slate-900';
    const scoreColor = isDark ? 'text-emerald-400' : 'text-slate-500';

    return (
        <div className="flex items-end justify-center gap-4 mb-8 pt-4">
            {/* 2nd Place */}
            {second && (
                <div className="flex flex-col items-center gap-2">
                    <div className="relative">
                        <div className={`w-16 h-16 rounded-full border-4 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} overflow-hidden`}>
                            <img src={second.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${second.user.nickname}`} alt={second.user.nickname} />
                        </div>
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-400 text-white text-xs font-bold px-2 py-0.5 rounded-full ring-2 ring-white">2nd</div>
                    </div>
                    <div className="text-center">
                        <div className={`font-bold text-sm ${textColor} truncate max-w-[80px]`}>{second.user.nickname}</div>
                        <div className={`text-xs font-mono font-bold ${scoreColor}`}>{second.score} {context === 'xp' ? 'XP' : ''}</div>
                    </div>
                </div>
            )}

            {/* 1st Place */}
            {first && (
                <div className="flex flex-col items-center gap-2 -mt-4 z-10">
                    <div className="relative">
                        {/* Crown */}
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl">👑</div>
                        <div className={`w-24 h-24 rounded-full border-4 ${isDark ? 'border-emerald-500 bg-slate-800' : 'border-yellow-400 bg-white'} overflow-hidden shadow-xl`}>
                            <img src={first.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${first.user.nickname}`} alt={first.user.nickname} />
                        </div>
                        <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 ${isDark ? 'bg-emerald-500' : 'bg-yellow-400'} text-white text-sm font-bold px-3 py-0.5 rounded-full ring-2 ring-white shadow-lg`}>1st</div>
                    </div>
                    <div className="text-center">
                        <div className={`font-bold text-base ${textColor} truncate max-w-[100px]`}>{first.user.nickname}</div>
                        <div className={`text-sm font-mono font-bold ${scoreColor}`}>{first.score} {context === 'xp' ? 'XP' : ''}</div>
                    </div>
                </div>
            )}

            {/* 3rd Place */}
            {third && (
                <div className="flex flex-col items-center gap-2">
                    <div className="relative">
                        <div className={`w-16 h-16 rounded-full border-4 ${isDark ? 'border-amber-700 bg-slate-800' : 'border-slate-200 bg-white'} overflow-hidden`}>
                            <img src={third.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${third.user.nickname}`} alt={third.user.nickname} />
                        </div>
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-xs font-bold px-2 py-0.5 rounded-full ring-2 ring-white">3rd</div>
                    </div>
                    <div className="text-center">
                        <div className={`font-bold text-sm ${textColor} truncate max-w-[80px]`}>{third.user.nickname}</div>
                        <div className={`text-xs font-mono font-bold ${scoreColor}`}>{third.score} {context === 'xp' ? 'XP' : ''}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

// 2. Ranking List Row
const RankingRow = ({ entry, context }: { key?: React.Key; entry: LeaderboardEntry, context: 'skill' | 'xp' }) => {
    const isDark = context === 'skill';

    return (
        <div className={`flex items-center gap-4 p-3 rounded-xl mb-2 transition-transform ${entry.isCurrentUser
            ? (isDark ? 'bg-emerald-900/40 border border-emerald-500/50' : 'bg-emerald-50 border border-emerald-200')
            : 'hover:scale-[1.01]'
            }`}>
            <span className={`font-mono font-bold w-6 text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {entry.rank}
            </span>

            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                <img src={entry.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.user.nickname}`} alt="Avatar" />
            </div>

            <div className="flex-1 min-w-0">
                <div className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {entry.user.nickname}
                </div>
            </div>

            <div className={`font-mono font-bold ${isDark ? 'text-emerald-400' : 'text-slate-600'}`}>
                {entry.score} <span className="text-[10px] uppercase opacity-50">{context === 'xp' ? 'XP' : ''}</span>
            </div>
        </div>
    );
};

// 3. Main Page Logic / Layout
export default function LeaderboardPageMock() {
    // Mock Data
    const skillTop3 = [
        { rank: 1, score: 92.5, user: { nickname: 'Kate', id: '1' } },
        { rank: 2, score: 89.1, user: { nickname: 'Liana', id: '2' } },
        { rank: 3, score: 88.4, user: { nickname: 'John', id: '3' } },
    ];
    const skillList = Array.from({ length: 7 }).map((_, i) => ({
        rank: i + 4,
        score: 85 - i * 2,
        user: { nickname: `User ${i + 4}`, id: `u${i}` },
        isCurrentUser: i === 2
    }));

    const xpTop3 = [
        { rank: 1, score: 1450, user: { nickname: 'MaxPower', id: 'x1' } },
        { rank: 2, score: 1320, user: { nickname: 'QuizMaster', id: 'x2' } },
        { rank: 3, score: 1280, user: { nickname: 'Luna', id: 'x3' } },
    ];
    const xpList = Array.from({ length: 7 }).map((_, i) => ({
        rank: i + 4,
        score: 1200 - i * 50,
        user: { nickname: `Player ${i + 4}`, id: `x${i}` },
        isCurrentUser: i === 5
    }));

    return (
        <div className="flex flex-col lg:flex-row h-screen bg-slate-900">

            {/* Left Panel: Concorso Skill Ranking (Dark) */}
            <div className="flex-1 bg-slate-900 text-white p-6 lg:p-10 flex flex-col border-r border-slate-800">
                {/* Header */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold mb-1 flex items-center justify-center gap-2">
                        Allievi 2025 <span className="text-slate-500 text-sm">›</span>
                    </h2>
                    <div className="flex items-center justify-center gap-2 text-xs text-rose-400 font-mono">
                        <span>⏰</span> Termina in 13:59:59
                    </div>
                </div>

                {/* Podium */}
                <Podium top3={skillTop3} context="skill" />

                {/* Stats */}
                <div className="bg-slate-800/50 rounded-xl p-3 text-center mb-6 border border-slate-700">
                    <span className="font-bold text-white">45,000</span> <span className="text-slate-400 text-sm">Partecipanti</span>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
                    {skillList.map(entry => <RankingRow key={entry.rank} entry={entry} context="skill" />)}
                </div>
            </div>

            {/* Right Panel: Global XP League (Light) */}
            <div className="flex-1 bg-slate-50 text-slate-900 p-6 lg:p-10 flex flex-col">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold mb-1 flex items-center justify-center gap-2 text-amber-600">
                        ♦ Gold League <span className="text-slate-300 text-sm">›</span>
                    </h2>
                    <div className="text-xs text-slate-400">
                        Classifica basata sui punti esperienza (XP)
                    </div>
                </div>

                <Podium top3={xpTop3} context="xp" />

                <div className="bg-white rounded-xl p-3 text-center mb-6 border border-slate-200 shadow-sm">
                    <span className="font-bold text-slate-900">+12,450</span> <span className="text-slate-400 text-sm">Partecipanti questa stagione</span>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
                    {xpList.map(entry => <RankingRow key={entry.rank} entry={entry} context="xp" />)}
                </div>
            </div>

        </div>
    );
}
