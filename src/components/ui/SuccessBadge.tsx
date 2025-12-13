import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuccessBadgeProps {
    className?: string;
}

export const SuccessBadge: React.FC<SuccessBadgeProps> = ({ className }) => {
    return (
        <div className={cn("relative", className)}>
            {/* Floating animation wrapper */}
            <div className="animate-[badge-float_3s_ease-in-out_infinite]">
                {/* Outer glow ring */}
                <div className="absolute inset-0 rounded-full bg-emerald-400/30 animate-[badge-pulse_2s_ease-in-out_infinite]" />

                {/* Badge container */}
                <div
                    className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shadow-xl"
                    style={{
                        boxShadow: '0 8px 32px rgba(16, 185, 129, 0.4), inset 0 2px 0 rgba(255,255,255,0.25)'
                    }}
                >
                    {/* Check icon with scale animation */}
                    <div className="animate-[badge-check_0.6s_ease-out_forwards]">
                        <Check className="w-10 h-10 text-white" strokeWidth={3} />
                    </div>
                </div>
            </div>

            {/* Sparkle particles */}
            <div className="absolute -top-2 -right-1 animate-[sparkle_2s_ease-in-out_infinite]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z" fill="#FBBF24" />
                </svg>
            </div>
            <div className="absolute -bottom-1 -left-2 animate-[sparkle_2s_ease-in-out_infinite_0.5s]">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z" fill="#00B1FF" />
                </svg>
            </div>
            <div className="absolute top-1/2 -right-4 animate-[sparkle_2s_ease-in-out_infinite_1s]">
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                    <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z" fill="#F472B6" />
                </svg>
            </div>

            {/* CSS Keyframes */}
            <style>{`
                @keyframes badge-float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
                
                @keyframes badge-pulse {
                    0%, 100% { 
                        transform: scale(1);
                        opacity: 0.3;
                    }
                    50% { 
                        transform: scale(1.15);
                        opacity: 0.1;
                    }
                }
                
                @keyframes badge-check {
                    0% { 
                        transform: scale(0) rotate(-45deg);
                        opacity: 0;
                    }
                    60% { 
                        transform: scale(1.2) rotate(0deg);
                        opacity: 1;
                    }
                    100% { 
                        transform: scale(1) rotate(0deg);
                        opacity: 1;
                    }
                }
                
                @keyframes sparkle {
                    0%, 100% { 
                        transform: scale(1) rotate(0deg);
                        opacity: 1;
                    }
                    50% { 
                        transform: scale(0.5) rotate(180deg);
                        opacity: 0.3;
                    }
                }
            `}</style>
        </div>
    );
};
