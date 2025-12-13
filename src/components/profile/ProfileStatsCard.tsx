import React from 'react';
import { Trophy, Zap, Gem } from 'lucide-react';

interface ProfileStatsCardProps {
    xp: number;
}

export default function ProfileStatsCard({ xp }: ProfileStatsCardProps) {
    // Mock data for Energy and Gems (until implemented in DB)
    const energy = 5;
    const maxEnergy = 5;
    const gems = 120;

    return (
        <div className="grid grid-cols-3 gap-3 mb-2">

            {/* XP Card */}
            <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-50 aspect-square sm:aspect-auto">
                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center mb-2">
                    <Trophy className="w-4 h-4 text-amber-500" fill="currentColor" />
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">XP Totali</div>
                <div className="text-xl font-bold text-slate-900">{xp}</div>
            </div>

            {/* Energy Card */}
            <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-50 aspect-square sm:aspect-auto">
                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center mb-2">
                    <Zap className="w-4 h-4 text-red-500" fill="currentColor" />
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Energia</div>
                <div className="text-xl font-bold text-slate-900">{energy}/{maxEnergy}</div>
            </div>

            {/* Gems Card */}
            <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-50 aspect-square sm:aspect-auto">
                <div className="w-8 h-8 rounded-full bg-cyan-50 flex items-center justify-center mb-2">
                    <Gem className="w-4 h-4 text-cyan-500" fill="currentColor" />
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Gemme</div>
                <div className="text-xl font-bold text-slate-900">{gems}</div>
            </div>

        </div>
    );
}
