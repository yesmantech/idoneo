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
            <div className="bg-white rounded-card p-4 flex flex-col md:flex-row items-center gap-4 shadow-soft hover:shadow-card hover:scale-[1.02] transition-all duration-300 relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-20 h-20 bg-brand-orange/5 rounded-bl-[40px] -mr-4 -mt-4 z-0 group-hover:scale-110 transition-transform"></div>
                <div className="relative z-10 w-12 h-12 rounded-squircle bg-brand-orange/10 text-brand-orange flex items-center justify-center text-xl font-bold">🏆</div>
                <div className="relative z-10 text-center md:text-left">
                    <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-0.5">XP Totali</p>
                    <p className="text-2xl font-black text-text-primary">{xp}</p>
                </div>
            </div>

            {/* Energy Card */}
            <div className="bg-white rounded-card p-4 flex flex-col md:flex-row items-center gap-4 shadow-soft hover:shadow-card hover:scale-[1.02] transition-all duration-300 relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-20 h-20 bg-semantic-error/5 rounded-bl-[40px] -mr-4 -mt-4 z-0 group-hover:scale-110 transition-transform"></div>
                <div className="relative z-10 w-12 h-12 rounded-squircle bg-semantic-error/10 text-semantic-error flex items-center justify-center text-xl font-bold">⚡</div>
                <div className="relative z-10 text-center md:text-left">
                    <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-0.5">Energia</p>
                    <p className="text-2xl font-black text-text-primary">{energy} / 5</p>
                </div>
            </div>

            {/* Gems Card */}
            <div className="bg-white rounded-card p-4 flex flex-col md:flex-row items-center gap-4 shadow-soft hover:shadow-card hover:scale-[1.02] transition-all duration-300 relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-20 h-20 bg-brand-cyan/5 rounded-bl-[40px] -mr-4 -mt-4 z-0 group-hover:scale-110 transition-transform"></div>
                <div className="relative z-10 w-12 h-12 rounded-squircle bg-brand-cyan/10 text-brand-cyan flex items-center justify-center text-xl font-bold">💎</div>
                <div className="relative z-10 text-center md:text-left">
                    <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-0.5">Gemme</p>
                    <p className="text-2xl font-black text-text-primary">{gems}</p>
                </div>
            </div>

        </div>
    );
}
