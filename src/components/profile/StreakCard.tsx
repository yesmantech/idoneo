/**
 * @file StreakCard.tsx
 * @description Weekly streak tracker card for the profile page.
 * Pixel-perfect match of the Skitla reference design.
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const DAYS = ['Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa', 'Do'] as const;

interface DayState {
    label: string;
    isToday: boolean;
    isActive: boolean;
}

export default function StreakCard() {
    const { profile } = useAuth();

    const streakCurrent = profile?.streak_current || 0;
    const streakMax = profile?.streak_max || 0;

    // Calculate today's index (0=Mon ... 6=Sun)
    const now = new Date();
    const todayDow = now.getDay();
    const todayIdx = todayDow === 0 ? 6 : todayDow - 1;

    // Derive which days this week had activity based on streak count.
    // If streak = 16, the last 16 consecutive days were active — so all days
    // from today backwards that fall in this week should be blue.
    const activeDays = new Set<number>();
    if (streakCurrent > 0) {
        for (let d = 0; d < Math.min(streakCurrent, 7); d++) {
            const dayIdx = todayIdx - d;
            if (dayIdx >= 0) {
                activeDays.add(dayIdx);
            }
            // If streak extends before Monday (dayIdx < 0), those days are in last week
        }
    }

    const days: DayState[] = DAYS.map((label, i) => ({
        label,
        isToday: i === todayIdx,
        isActive: activeDays.has(i),
    }));

    return (
        <div
            className="rounded-[22px] p-6"
            style={{ backgroundColor: '#1C1C1E' }}
        >
            {/* Header — "Streak >" */}
            <button className="flex items-center gap-0.5 mb-6 group">
                <h3
                    className="font-bold text-white"
                    style={{ fontSize: 22, letterSpacing: '-0.02em' }}
                >
                    Streak Giornaliero
                </h3>
                <ChevronRight
                    className="w-5 h-5 text-white/40 group-hover:text-white/60 transition-colors"
                    style={{ marginTop: 2 }}
                    strokeWidth={3}
                />
            </button>

            {/* ── Week Row ── */}
            <div className="flex justify-between items-start" style={{ paddingInline: 2 }}>
                {days.map((day, i) => {
                    // Color logic:
                    // - Active day (streak conquered): blue fill + blue ring
                    // - Today (current): orange ring + amber tint fill
                    // - Active + today: blue fill + orange ring
                    // - Inactive: dark grey
                    const isActive = day.isActive;
                    const isToday = day.isToday;

                    let bg = '#2C2C2E';
                    let border = '2.5px solid transparent';
                    let labelColor = 'rgba(255,255,255,0.35)';

                    if (isActive && isToday) {
                        bg = 'rgba(56, 189, 248, 0.45)';
                        border = '3px solid #38BDF8';
                        labelColor = '#38BDF8';
                    } else if (isActive) {
                        bg = 'rgba(0, 177, 255, 0.25)';
                        border = '2.5px solid #00B1FF';
                        labelColor = '#00B1FF';
                    } else if (isToday) {
                        bg = 'rgba(56, 189, 248, 0.35)';
                        border = '3px solid #38BDF8';
                        labelColor = '#38BDF8';
                    }

                    const shadow = isToday
                        ? '0 0 12px rgba(56, 189, 248, 0.5)'
                        : 'none';

                    return (
                        <div key={i} className="flex flex-col items-center" style={{ gap: 10 }}>
                            {/* Circle */}
                            <div
                                className="flex items-center justify-center"
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 16,
                                    backgroundColor: bg,
                                    border,
                                    boxShadow: shadow,
                                    transition: 'all 0.3s ease',
                                }}
                            />

                            {/* Day Label */}
                            <span
                                className="font-bold"
                                style={{
                                    fontSize: 14,
                                    color: labelColor,
                                    letterSpacing: '0.02em',
                                }}
                            >
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
                    <div
                        className="font-extrabold uppercase"
                        style={{
                            fontSize: 11,
                            letterSpacing: '0.12em',
                            color: 'rgba(255,255,255,0.3)',
                            marginBottom: 8,
                        }}
                    >
                        Streak Attuale
                    </div>
                    <div className="flex items-center" style={{ gap: 8 }}>
                        <span style={{ fontSize: 26, lineHeight: 1 }}>🔥</span>
                        <span
                            className="font-bold text-white"
                            style={{ fontSize: 24, letterSpacing: '-0.02em' }}
                        >
                            {streakCurrent} {streakCurrent === 1 ? 'giorno' : 'giorni'}
                        </span>
                    </div>
                </div>

                {/* Best Streak */}
                <div className="flex-1">
                    <div
                        className="font-extrabold uppercase"
                        style={{
                            fontSize: 11,
                            letterSpacing: '0.12em',
                            color: 'rgba(255,255,255,0.3)',
                            marginBottom: 8,
                        }}
                    >
                        Miglior Streak
                    </div>
                    <div className="flex items-center" style={{ gap: 8 }}>
                        <span style={{ fontSize: 26, lineHeight: 1 }}>🟣</span>
                        <span
                            className="font-bold text-white"
                            style={{ fontSize: 24, letterSpacing: '-0.02em' }}
                        >
                            {streakMax} {streakMax === 1 ? 'giorno' : 'giorni'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
