import React from 'react';
import { Trophy, Zap, Gem } from 'lucide-react';

interface ProfileStatsCardProps {
    xp: number;
}

export default function ProfileStatsCard({ xp }: ProfileStatsCardProps) {
    // Hardcoded placeholders
    const energy = 5;
    const gems = 120;

    return (
        <div className="grid grid-cols-3 gap-3">

            {/* XP Card */}
            <div className="bg-white rounded-2xl p-3 flex flex-col items-center justify-center shadow-sm border border-slate-100 relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-500" />
                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-2 mt-1">
                    <Trophy className="w-4 h-4 fill-current" />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">XP Totali</p>
                <p className="text-lg font-black text-slate-900">{xp}</p>
            </div>

            {/* Energy Card */}
            <div className="bg-white rounded-2xl p-3 flex flex-col items-center justify-center shadow-sm border border-slate-100 relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 to-red-500" />
                <div className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-2 mt-1">
                    <Zap className="w-4 h-4 fill-current" />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Energia</p>
                <p className="text-lg font-black text-slate-900">{energy}/5</p>
            </div>

            {/* Gems Card */}
            <div className="bg-white rounded-2xl p-3 flex flex-col items-center justify-center shadow-sm border border-slate-100 relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-cyan-500" />
                <div className="w-8 h-8 rounded-full bg-cyan-50 text-cyan-500 flex items-center justify-center mb-2 mt-1">
                    <Gem className="w-4 h-4 fill-current" />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Gemme</p>
                <p className="text-lg font-black text-slate-900">{gems}</p>
            </div>

        </div>
    );
}
