import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FailBadgeProps {
    className?: string;
}

export const FailBadge: React.FC<FailBadgeProps> = ({ className }) => {
    return (
        <div className={cn("relative", className)}>
            {/* Floating animation wrapper */}
            <div className="animate-[badge-float_3s_ease-in-out_infinite]">
                {/* Outer glow ring */}
                <div className="absolute inset-0 rounded-full bg-red-400/30 animate-[badge-pulse_2s_ease-in-out_infinite]" />

                {/* Badge container */}
                <div
                    className="relative w-20 h-20 rounded-full bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center shadow-xl"
                    style={{
                        boxShadow: '0 8px 32px rgba(239, 68, 68, 0.4), inset 0 2px 0 rgba(255,255,255,0.25)'
                    }}
                >
                    {/* X icon with scale animation */}
                    <div className="animate-[badge-check_0.6s_ease-out_forwards]">
                        <X className="w-10 h-10 text-white" strokeWidth={3} />
                    </div>
                </div>
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
            `}</style>
        </div>
    );
};
