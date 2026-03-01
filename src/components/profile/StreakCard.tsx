/**
 * @file StreakCard.tsx
 * @description Weekly streak tracker card for the profile page.
 * Pixel-perfect match of the Skitla reference design.
 * Supports both light and dark mode.
 */

import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import StreakCalendarModal from './StreakCalendarModal';

const DAYS = ['Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa', 'Do'] as const;

interface DayState {
    label: string;
    isToday: boolean;
    isActive: boolean;
}

export default function StreakCard() {
    const { profile } = useAuth();
    const [calendarOpen, setCalendarOpen] = useState(false);

    const streakCurrent = profile?.streak_current || 0;
    const streakMax = profile?.streak_max || 0;

    // Calculate today's index (0=Mon ... 6=Sun)
    const now = new Date();
    const todayDow = now.getDay();
    const todayIdx = todayDow === 0 ? 6 : todayDow - 1;

    // Derive which days this week had activity based on streak count.
    const activeDays = new Set<number>();
    if (streakCurrent > 0) {
        for (let d = 0; d < Math.min(streakCurrent, 7); d++) {
            const dayIdx = todayIdx - d;
            if (dayIdx >= 0) {
                activeDays.add(dayIdx);
            }
        }
    }

    const days: DayState[] = DAYS.map((label, i) => ({
        label,
        isToday: i === todayIdx,
        isActive: activeDays.has(i),
    }));

    return (
        <div className="bg-white dark:bg-[#1C1C1E] rounded-[22px] p-6 shadow-sm dark:shadow-none border border-slate-100 dark:border-transparent">
            {/* Header — "Streak Giornaliero >" */}
            <button
                className="flex items-center gap-0.5 mb-6 group"
                onClick={() => setCalendarOpen(true)}
            >
                <h3 className="font-bold text-slate-900 dark:text-white text-[22px] tracking-tight">
                    Streak Giornaliero
                </h3>
                <ChevronRight
                    className="w-5 h-5 text-slate-400 dark:text-white/40 group-hover:text-slate-600 dark:group-hover:text-white/60 transition-colors"
                    style={{ marginTop: 2 }}
                    strokeWidth={3}
                />
            </button>

            {/* ── Week Row ── */}
            <div className="flex justify-between items-start" style={{ paddingInline: 2 }}>
                {days.map((day, i) => {
                    const isActive = day.isActive;
                    const isToday = day.isToday;

                    let bg = '';
                    let border = '2.5px solid transparent';
                    let labelClass = 'text-slate-300 dark:text-white/35';

                    if (isActive && isToday) {
                        bg = 'rgba(56, 189, 248, 0.45)';
                        border = '3px solid #38BDF8';
                        labelClass = 'text-sky-400';
                    } else if (isActive) {
                        bg = 'rgba(0, 177, 255, 0.2)';
                        border = '2.5px solid #00B1FF';
                        labelClass = 'text-[#00B1FF]';
                    } else if (isToday) {
                        bg = 'rgba(56, 189, 248, 0.35)';
                        border = '3px solid #38BDF8';
                        labelClass = 'text-sky-400';
                    }

                    const shadow = isToday
                        ? '0 0 12px rgba(56, 189, 248, 0.5)'
                        : 'none';

                    return (
                        <div key={i} className="flex flex-col items-center" style={{ gap: 10 }}>
                            <div
                                className="flex items-center justify-center bg-slate-100 dark:bg-[#2C2C2E]"
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 16,
                                    ...(bg ? { backgroundColor: bg } : {}),
                                    border,
                                    boxShadow: shadow,
                                    transition: 'all 0.3s ease',
                                }}
                            />
                            <span className={`font-bold text-[14px] tracking-wide ${labelClass}`}>
                                {day.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* ── Stats Row ── */}
            <div className="flex" style={{ marginTop: 28, gap: 16 }}>
                {/* Current Streak */}
                <div className="flex-1">
                    <div className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-white/30 mb-2">
                        Streak Attuale
                    </div>
                    <div className="flex items-center" style={{ gap: 8 }}>
                        <svg width="34" height="34" viewBox="0 0 64 64" fill="none">
                            <defs>
                                <radialGradient id="flameOrange" cx="50%" cy="60%" r="50%">
                                    <stop offset="0%" stopColor="#FFD54F" />
                                    <stop offset="50%" stopColor="#FF9800" />
                                    <stop offset="100%" stopColor="#E65100" />
                                </radialGradient>
                            </defs>
                            <path d="M32 4C32 4 18 20 18 36C18 44.8 24.3 52 32 56C39.7 52 46 44.8 46 36C46 20 32 4 32 4Z" fill="url(#flameOrange)" />
                            <path d="M32 18C32 18 25 28 25 38C25 43.5 28 48 32 50C36 48 39 43.5 39 38C39 28 32 18 32 18Z" fill="#FFE082" opacity="0.6" />
                        </svg>
                        <span className="text-[24px] font-bold text-slate-900 dark:text-white tracking-tight">
                            {streakCurrent} {streakCurrent === 1 ? 'giorno' : 'giorni'}
                        </span>
                    </div>
                </div>

                {/* Best Streak */}
                <div className="flex-1">
                    <div className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-white/30 mb-2">
                        Miglior Streak
                    </div>
                    <div className="flex items-center" style={{ gap: 8 }}>
                        <svg width="34" height="34" viewBox="0 0 64 64" fill="none">
                            <defs>
                                <radialGradient id="flamePurple" cx="50%" cy="60%" r="50%">
                                    <stop offset="0%" stopColor="#CE93D8" />
                                    <stop offset="50%" stopColor="#9C27B0" />
                                    <stop offset="100%" stopColor="#6A1B9A" />
                                </radialGradient>
                            </defs>
                            <path d="M32 4C32 4 18 20 18 36C18 44.8 24.3 52 32 56C39.7 52 46 44.8 46 36C46 20 32 4 32 4Z" fill="url(#flamePurple)" />
                            <path d="M32 18C32 18 25 28 25 38C25 43.5 28 48 32 50C36 48 39 43.5 39 38C39 28 32 18 32 18Z" fill="#E1BEE7" opacity="0.5" />
                        </svg>
                        <span className="text-[24px] font-bold text-slate-900 dark:text-white tracking-tight">
                            {streakMax} {streakMax === 1 ? 'giorno' : 'giorni'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Calendar Modal */}
            <StreakCalendarModal
                isOpen={calendarOpen}
                onClose={() => setCalendarOpen(false)}
                streakCurrent={streakCurrent}
                streakMax={streakMax}
            />
        </div>
    );
}
