import React, { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

interface StreakBadgeProps {
    collapsed?: boolean;
    className?: string;
}

export function StreakBadge({ collapsed, className }: StreakBadgeProps) {
    const { user, profile } = useAuth();
    const [streak, setStreak] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    // Fallback: Fetch directly
    useEffect(() => {
        if (!user) return;
        if (profile?.streak_current !== undefined) {
            setStreak(profile.streak_current);
            return;
        }
        const fetchStreakDirectly = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('profiles')
                    .select('streak_current')
                    .eq('id', user.id)
                    .single();
                if (data && !error) setStreak(data.streak_current || 0);
            } catch (err) {
                console.error("Failed to fetch streak", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStreakDirectly();
    }, [user, profile]);

    const currentStreak = streak || 0;
    const hasStreak = !!user && currentStreak > 0;

    // Brand specific styles
    // Inactive: Slate/Gray
    // Active: Brand Orange Background w/ Orange Flame
    const containerClasses = collapsed
        ? "justify-center w-10 h-10 p-0"
        : "px-3 py-3 w-full"; // Slightly taller for 'squircle' feel

    // Active State: Uses Brand Orange with low opacity background
    const activeBg = hasStreak
        ? "bg-brand-orange/10 border-brand-orange/20 shadow-sm"
        : "bg-canvas-light border-transparent hover:bg-slate-200/50";

    const handleTestClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        console.log("Triggering Streak Celebration Test - Day 100!");
        const event = new CustomEvent('streak_updated', {
            detail: {
                streak: 100, // TEST: Hardcoded to 100 for testing Day 100 celebration
                isMilestone: true
            }
        });
        window.dispatchEvent(event);
    };

    return (
        <div
            onClick={handleTestClick}
            className={`
                group relative flex items-center gap-3 rounded-card border transition-all duration-300 cursor-pointer
                ${activeBg}
                ${containerClasses}
                ${className}
            `}
        >
            {/* Visual Flair: Glow effect behind flame only when active */}
            {hasStreak && !collapsed && (
                <div className="absolute left-2 w-8 h-8 bg-brand-orange/20 blur-xl rounded-full animate-pulse pointer-events-none" />
            )}

            {/* Icon Container - Squircle Shape */}
            <div className={`
                relative z-10 flex items-center justify-center rounded-squircle transition-transform duration-300 group-hover:scale-105
                ${hasStreak ? 'bg-white shadow-soft ring-1 ring-brand-orange/20' : 'bg-slate-200/50'}
                ${collapsed ? 'w-full h-full' : 'w-9 h-9'}
            `}>
                <Flame
                    className={`w-4 h-4 transition-colors duration-300 ${hasStreak ? 'text-brand-orange fill-brand-orange' : 'text-slate-400'}`}
                    strokeWidth={2.5}
                />
            </div>

            {!collapsed && (
                <div className="flex flex-col min-w-0 flex-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${hasStreak ? 'text-brand-orange' : 'text-slate-500'}`}>
                        {hasStreak ? 'In Fiamme!' : (user ? 'Streak' : 'Accedi')}
                    </span>
                    <div className="flex items-baseline gap-1.5">
                        <span className={`text-base font-black ${hasStreak ? 'text-text-primary' : 'text-text-tertiary'}`}>
                            {hasStreak ? currentStreak : '-'}
                        </span>
                        <span className={`text-[11px] font-bold ${hasStreak ? 'text-brand-orange/80' : 'text-text-tertiary'}`}>
                            giorni
                        </span>
                    </div>
                </div>
            )}

            {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                    {hasStreak ? `${currentStreak} Giorni` : "Accedi"}
                </div>
            )}
        </div>
    );
}
