/**
 * @file StreakCard.tsx
 * @description Weekly streak tracker card for the profile page.
 * Shows 7 days of the week with activity indicators plus current/best streak stats.
 * Design matches the iOS-native flat style reference.
 */

import React, { useEffect, useState } from 'react';
import { ChevronRight, Flame } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const;
// Italian day labels
const DAYS_IT = ['Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa', 'Do'] as const;

interface DayActivity {
    label: string;
    isToday: boolean;
    isActive: boolean; // had activity that day
}

export default function StreakCard() {
    const { user, profile } = useAuth();
    const [activeDays, setActiveDays] = useState<Set<number>>(new Set());

    const streakCurrent = profile?.streak_current || 0;
    const streakMax = profile?.streak_max || 0;

    useEffect(() => {
        if (!user) return;

        async function fetchWeekActivity() {
            // Get the start of the current week (Monday)
            const now = new Date();
            const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
            const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            const monday = new Date(now);
            monday.setDate(now.getDate() + mondayOffset);
            monday.setHours(0, 0, 0, 0);

            // Query quiz_attempts for this week
            const { data } = await supabase
                .from('quiz_attempts')
                .select('completed_at')
                .eq('user_id', user!.id)
                .gte('completed_at', monday.toISOString())
                .order('completed_at', { ascending: true });

            if (data) {
                const active = new Set<number>();
                data.forEach(attempt => {
                    const d = new Date(attempt.completed_at);
                    const day = d.getDay(); // 0=Sun
                    // Convert to 0=Mon index
                    const idx = day === 0 ? 6 : day - 1;
                    active.add(idx);
                });
                setActiveDays(active);
            }
        }

        fetchWeekActivity();
    }, [user]);

    // Determine today's index (0=Mon ... 6=Sun)
    const now = new Date();
    const todayDow = now.getDay();
    const todayIdx = todayDow === 0 ? 6 : todayDow - 1;

    const days: DayActivity[] = DAYS_IT.map((label, i) => ({
        label,
        isToday: i === todayIdx,
        isActive: activeDays.has(i),
    }));

    return (
        <div className="bg-[#1C1C1E] rounded-[20px] p-5 space-y-5">
            {/* Header */}
            <button className="flex items-center gap-1 group">
                <h3 className="text-[20px] font-bold text-white tracking-tight">Streak</h3>
                <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white/60 transition-colors mt-0.5" />
            </button>

            {/* Week Days Row */}
            <div className="flex justify-between px-1">
                {days.map((day, i) => (
                    <div key={i} className="flex flex-col items-center gap-2.5">
                        {/* Circle */}
                        <div
                            className={`w-[42px] h-[42px] rounded-full flex items-center justify-center transition-all duration-300
                                ${day.isToday && day.isActive
                                    ? 'bg-orange-500/30 ring-[2.5px] ring-orange-500'
                                    : day.isToday
                                        ? 'bg-orange-500/20 ring-[2.5px] ring-orange-500'
                                        : day.isActive
                                            ? 'bg-orange-500/30 ring-[2.5px] ring-orange-500'
                                            : 'bg-[#2C2C2E]'
                                }`}
                        >
                            {day.isActive && (
                                <Flame className="w-5 h-5 text-orange-400" />
                            )}
                        </div>
                        {/* Label */}
                        <span className={`text-[13px] font-bold tracking-wide
                            ${day.isToday
                                ? 'text-orange-500'
                                : 'text-white/40'
                            }`}
                        >
                            {day.label}
                        </span>
                    </div>
                ))}
            </div>

            {/* Divider */}
            <div className="h-px bg-white/[0.06]" />

            {/* Stats Row */}
            <div className="flex gap-4">
                {/* Current Streak */}
                <div className="flex-1">
                    <div className="text-[11px] font-extrabold uppercase tracking-widest text-white/30 mb-2">
                        Current Streak
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🔥</span>
                        <span className="text-[22px] font-bold text-white tracking-tight">
                            {streakCurrent} {streakCurrent === 1 ? 'day' : 'days'}
                        </span>
                    </div>
                </div>

                {/* Best Streak */}
                <div className="flex-1">
                    <div className="text-[11px] font-extrabold uppercase tracking-widest text-white/30 mb-2">
                        Best Streak
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🔮</span>
                        <span className="text-[22px] font-bold text-white tracking-tight">
                            {streakMax} {streakMax === 1 ? 'day' : 'days'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
