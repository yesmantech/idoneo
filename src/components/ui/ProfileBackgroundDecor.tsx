import React from 'react';

export const ProfileBackgroundDecor: React.FC = () => {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Large floating gradient orbs */}
            <div
                className="absolute top-[10%] left-[5%] w-40 h-40 rounded-full bg-gradient-to-br from-emerald-400/20 to-cyan-400/10 blur-3xl animate-[float_8s_ease-in-out_infinite]"
            />
            <div
                className="absolute top-[30%] right-[10%] w-32 h-32 rounded-full bg-gradient-to-br from-amber-400/15 to-orange-400/5 blur-3xl animate-[float_6s_ease-in-out_infinite_2s]"
            />
            <div
                className="absolute bottom-[40%] left-[15%] w-24 h-24 rounded-full bg-gradient-to-br from-blue-400/15 to-purple-400/5 blur-2xl animate-[float_7s_ease-in-out_infinite_1s]"
            />

            {/* Sparkles */}
            <div className="absolute top-24 left-12 animate-[sparkle_3s_ease-in-out_infinite]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z" fill="#10B981" fillOpacity="0.4" />
                </svg>
            </div>
            <div className="absolute top-40 right-16 animate-[sparkle_4s_ease-in-out_infinite_1s]">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z" fill="#00B1FF" fillOpacity="0.35" />
                </svg>
            </div>
            <div className="absolute top-16 right-24 animate-[sparkle_5s_ease-in-out_infinite_0.5s]">
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                    <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z" fill="#FBBF24" fillOpacity="0.5" />
                </svg>
            </div>
            <div className="absolute top-52 left-20 animate-[sparkle_3.5s_ease-in-out_infinite_2s]">
                <svg width="8" height="8" viewBox="0 0 16 16" fill="none">
                    <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z" fill="#F472B6" fillOpacity="0.4" />
                </svg>
            </div>

            {/* Floating circles (dots) */}
            <div className="absolute top-36 left-8 w-2 h-2 rounded-full bg-emerald-400/30 animate-[float_4s_ease-in-out_infinite]" />
            <div className="absolute top-20 right-12 w-3 h-3 rounded-full bg-cyan-400/25 animate-[float_5s_ease-in-out_infinite_1.5s]" />
            <div className="absolute top-48 right-8 w-2 h-2 rounded-full bg-amber-400/30 animate-[float_3.5s_ease-in-out_infinite_0.8s]" />
        </div>
    );
};
