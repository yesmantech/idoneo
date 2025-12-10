import React from 'react';

interface ProfileStatsCardProps {
    xp: number;
}

export default function ProfileStatsCard({ xp }: ProfileStatsCardProps) {
    // Hardcoded placeholders
    const energy = 5;
    const gems = 120;

    return (
        <div className="grid grid-cols-3 gap-3 md:grid-cols-1 md:gap-4">

            {/* XP Card */}
            <div className="bg-white border border-amber-200 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-16 h-16 bg-amber-50 rounded-bl-full -mr-4 -mt-4 z-0 group-hover:scale-110 transition-transform"></div>
                <div className="relative z-10 w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl font-bold">🏆</div>
                <div className="relative z-10 text-center md:text-left">
                    <p className="text-xs font-bold text-amber-600/70 uppercase tracking-wider">XP Totali</p>
                    <p className="text-xl font-black text-slate-900">{xp}</p>
                </div>
            </div>

            {/* Energy Card */}
            <div className="bg-white border border-rose-200 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-16 h-16 bg-rose-50 rounded-bl-full -mr-4 -mt-4 z-0 group-hover:scale-110 transition-transform"></div>
                <div className="relative z-10 w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center text-xl font-bold">⚡</div>
                <div className="relative z-10 text-center md:text-left">
                    <p className="text-xs font-bold text-rose-600/70 uppercase tracking-wider">Energia</p>
                    <p className="text-xl font-black text-slate-900">{energy} / 5</p>
                </div>
            </div>

            {/* Gems Card */}
            <div className="bg-white border border-sky-200 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-16 h-16 bg-sky-50 rounded-bl-full -mr-4 -mt-4 z-0 group-hover:scale-110 transition-transform"></div>
                <div className="relative z-10 w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center text-xl font-bold">💎</div>
                <div className="relative z-10 text-center md:text-left">
                    <p className="text-xs font-bold text-sky-600/70 uppercase tracking-wider">Gemme</p>
                    <p className="text-xl font-black text-slate-900">{gems}</p>
                </div>
            </div>

        </div>
    );
}
