import React from 'react';

interface GamificationBlockProps {
    xp: number;
    // energy?: number; // Future
    // gems?: number;   // Future
}

export default function GamificationBlock({ xp }: GamificationBlockProps) {
    // Hardcoded placeholders for now as per requirements
    const energy = 5;
    const gems = 120;

    return (
        <div className="flex justify-center gap-3 px-4 mb-8">
            {/* XP Card */}
            <div className="flex-1 max-w-[110px]">
                <div className="flex flex-col items-center bg-white border-2 border-amber-400 border-b-4 rounded-2xl p-2 active:border-b-2 active:translate-y-[2px] transition-all cursor-pointer group">
                    <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">🏆</span>
                    <span className="font-black text-amber-500 text-lg">{xp}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">XP</span>
                </div>
            </div>

            {/* Energy Card */}
            <div className="flex-1 max-w-[110px]">
                <div className="flex flex-col items-center bg-white border-2 border-rose-400 border-b-4 rounded-2xl p-2 active:border-b-2 active:translate-y-[2px] transition-all cursor-pointer group">
                    <span className="text-2xl mb-1 group-hover:animate-pulse">⚡</span>
                    <span className="font-black text-rose-500 text-lg">{energy}/5</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Energia</span>
                </div>
            </div>

            {/* Gems Card */}
            <div className="flex-1 max-w-[110px]">
                <div className="flex flex-col items-center bg-white border-2 border-sky-400 border-b-4 rounded-2xl p-2 active:border-b-2 active:translate-y-[2px] transition-all cursor-pointer group">
                    <span className="text-2xl mb-1 group-hover:rotate-12 transition-transform">💎</span>
                    <span className="font-black text-sky-500 text-lg">{gems}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Gemme</span>
                </div>
            </div>
        </div>
    );
}
