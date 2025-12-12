import React from 'react';
import { cn } from '@/lib/utils';

interface CloudMascotProps {
    className?: string;
}

export const CloudMascot: React.FC<CloudMascotProps> = ({ className }) => {
    return (
        <div className={cn("relative", className)}>
            {/* Sway/Dance animation wrapper */}
            <div className="animate-[mascot-sway_2.5s_ease-in-out_infinite]">
                <svg
                    width="130"
                    height="145"
                    viewBox="0 0 130 145"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {/* Cloud body - tilted slightly */}
                    <g transform="rotate(-3 65 75)">
                        <ellipse cx="65" cy="65" rx="38" ry="28" fill="#7DD3FC" />
                        <ellipse cx="42" cy="60" rx="24" ry="20" fill="#7DD3FC" />
                        <ellipse cx="88" cy="60" rx="24" ry="20" fill="#7DD3FC" />
                        <ellipse cx="50" cy="48" rx="18" ry="16" fill="#7DD3FC" />
                        <ellipse cx="80" cy="48" rx="18" ry="16" fill="#7DD3FC" />
                        <ellipse cx="65" cy="42" rx="16" ry="14" fill="#7DD3FC" />
                        <ellipse cx="65" cy="78" rx="32" ry="18" fill="#7DD3FC" />
                    </g>

                    {/* Squircle face - playful tilt */}
                    <rect
                        x="44"
                        y="50"
                        width="42"
                        height="42"
                        rx="13"
                        fill="#38BDF8"
                        transform="rotate(-8 65 71)"
                    />

                    {/* Left eye - normal */}
                    <circle cx="56" cy="65" r="3.5" fill="#1E293B" />

                    {/* Right eye - winking */}
                    <path
                        d="M73 65C73 65 76 64 79 65"
                        stroke="#1E293B"
                        strokeWidth="3"
                        strokeLinecap="round"
                        fill="none"
                    />

                    {/* Smile - cool sideways grin */}
                    <path
                        d="M56 77C58 80 72 80 74 77"
                        stroke="#1E293B"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        fill="none"
                    />

                    {/* Left arm - raised up in groove */}
                    <g className="origin-[35px_75px] animate-[groove-up_2s_ease-in-out_infinite]">
                        <path
                            d="M40 75C32 68 25 65 20 62"
                            stroke="#1E293B"
                            strokeWidth="4"
                            strokeLinecap="round"
                            fill="none"
                        />
                        <circle cx="18" cy="60" r="3" fill="#1E293B" />
                    </g>

                    {/* Right arm - down and relaxed */}
                    <g className="origin-[95px_80px] animate-[groove-down_2s_ease-in-out_infinite]">
                        <path
                            d="M90 80C98 85 105 88 110 90"
                            stroke="#1E293B"
                            strokeWidth="4"
                            strokeLinecap="round"
                            fill="none"
                        />
                        <circle cx="112" cy="92" r="3" fill="#1E293B" />
                    </g>

                    {/* Left leg - dance stance */}
                    <path
                        d="M52 90L48 112"
                        stroke="#1E293B"
                        strokeWidth="4"
                        strokeLinecap="round"
                    />
                    <ellipse cx="46" cy="117" rx="7" ry="5" fill="#FBBF24" transform="rotate(-10)" />

                    {/* Right leg - dance stance */}
                    <path
                        d="M78 90L82 112"
                        stroke="#1E293B"
                        strokeWidth="4"
                        strokeLinecap="round"
                    />
                    <ellipse cx="84" cy="117" rx="7" ry="5" fill="#FBBF24" transform="rotate(10)" />
                </svg>
            </div>

            {/* Musical note decorations */}
            <div className="absolute top-5 right-8 animate-[music-float_2s_ease-in-out_infinite]">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M14 0V11C14 13 12 14 10 14C8 14 6 13 6 11C6 9 8 8 10 8C11 8 12 8.5 13 9V3L7 5V14C7 16 5 17 3 17C1 17 0 16 0 14C0 12 1 11 3 11C4 11 5 11.5 6 12V0L14 0Z" fill="#FBBF24" transform="scale(0.5)" />
                </svg>
            </div>
            <div className="absolute top-12 left-4 animate-[music-float_2s_ease-in-out_infinite_0.8s]">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="4" cy="10" r="3" fill="#06D6D3" />
                    <rect x="6" y="0" width="2" height="11" fill="#06D6D3" />
                </svg>
            </div>
            <div className="absolute bottom-12 right-6 animate-[music-float_2s_ease-in-out_infinite_1.2s]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="3" cy="12" r="3" fill="#F472B6" />
                    <rect x="5" y="0" width="2" height="13" fill="#F472B6" />
                    <path d="M7 0L13 2V8L7 6V0Z" fill="#F472B6" />
                </svg>
            </div>
        </div>
    );
};
