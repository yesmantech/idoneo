/**
 * @file StreakCalendarModal.tsx
 * @description Full calendar modal showing streak history.
 * Opens when tapping "Streak Giornaliero >" in the StreakCard.
 * Shows the current month with streak days highlighted in brand blue.
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Flame } from 'lucide-react';

interface StreakCalendarModalProps {
    isOpen: boolean;
    onClose: () => void;
    streakCurrent: number;
    streakMax: number;
}

const WEEKDAYS = ['Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa', 'Do'];
const MONTHS_IT = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

export default function StreakCalendarModal({
    isOpen,
    onClose,
    streakCurrent,
    streakMax,
}: StreakCalendarModalProps) {
    const [viewDate, setViewDate] = useState(new Date());

    // Calculate streak active dates (going backwards from today)
    const streakDates = useMemo(() => {
        const dates = new Set<string>();
        if (streakCurrent > 0) {
            const today = new Date();
            for (let i = 0; i < streakCurrent; i++) {
                const d = new Date(today);
                d.setDate(today.getDate() - i);
                dates.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
            }
        }
        return dates;
    }, [streakCurrent]);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    // Build calendar grid
    const calendarDays = useMemo(() => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();

        // Get day of week for first day (0=Sun, adjust to Mon=0)
        let startDow = firstDay.getDay();
        startDow = startDow === 0 ? 6 : startDow - 1; // Mon=0

        const days: Array<{ date: number; isActive: boolean; isToday: boolean; inMonth: boolean }> = [];

        // Empty slots before month starts
        for (let i = 0; i < startDow; i++) {
            days.push({ date: 0, isActive: false, isToday: false, inMonth: false });
        }

        const today = new Date();
        const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

        for (let d = 1; d <= daysInMonth; d++) {
            const key = `${year}-${month}-${d}`;
            days.push({
                date: d,
                isActive: streakDates.has(key),
                isToday: key === todayKey,
                inMonth: true,
            });
        }

        return days;
    }, [year, month, streakDates]);

    const goToPrevMonth = () => setViewDate(new Date(year, month - 1, 1));
    const goToNextMonth = () => setViewDate(new Date(year, month + 1, 1));

    // Don't allow navigating past current month
    const now = new Date();
    const canGoNext = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth());

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-x-4 top-[15%] z-50 mx-auto max-w-[420px]"
                    >
                        <div
                            className="rounded-[24px] overflow-hidden"
                            style={{ backgroundColor: '#1C1C1E' }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 pt-6 pb-4">
                                <h2 className="text-xl font-bold text-white tracking-tight">
                                    Streak Giornaliero
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                                >
                                    <X className="w-4 h-4 text-white/60" />
                                </button>
                            </div>

                            {/* Stats Summary */}
                            <div className="flex gap-4 px-6 pb-5">
                                <div className="flex-1 bg-white/[0.04] rounded-2xl px-4 py-3">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">
                                        Streak Attuale
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">🔥</span>
                                        <span className="text-lg font-bold text-white">
                                            {streakCurrent} {streakCurrent === 1 ? 'giorno' : 'giorni'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-1 bg-white/[0.04] rounded-2xl px-4 py-3">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">
                                        Miglior Streak
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">🟣</span>
                                        <span className="text-lg font-bold text-white">
                                            {streakMax} {streakMax === 1 ? 'giorno' : 'giorni'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Month Navigation */}
                            <div className="flex items-center justify-between px-6 pb-3">
                                <button
                                    onClick={goToPrevMonth}
                                    className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center hover:bg-white/10 transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4 text-white/60" />
                                </button>
                                <span className="text-[15px] font-bold text-white">
                                    {MONTHS_IT[month]} {year}
                                </span>
                                <button
                                    onClick={goToNextMonth}
                                    disabled={!canGoNext}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors
                                        ${canGoNext ? 'bg-white/[0.06] hover:bg-white/10' : 'opacity-20 cursor-not-allowed'}`}
                                >
                                    <ChevronRight className="w-4 h-4 text-white/60" />
                                </button>
                            </div>

                            {/* Weekday Headers */}
                            <div className="grid grid-cols-7 px-5 pb-2">
                                {WEEKDAYS.map(wd => (
                                    <div key={wd} className="text-center">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-white/25">
                                            {wd}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-y-1 px-5 pb-6">
                                {calendarDays.map((day, idx) => {
                                    if (!day.inMonth) {
                                        return <div key={idx} className="aspect-square" />;
                                    }

                                    const isActive = day.isActive;
                                    const isToday = day.isToday;

                                    return (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-center"
                                        >
                                            <div
                                                className="flex items-center justify-center transition-all duration-200"
                                                style={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: 12,
                                                    backgroundColor: isActive
                                                        ? isToday
                                                            ? 'rgba(56, 189, 248, 0.45)'
                                                            : 'rgba(0, 177, 255, 0.25)'
                                                        : 'transparent',
                                                    border: isToday
                                                        ? '2px solid #38BDF8'
                                                        : isActive
                                                            ? '2px solid #00B1FF'
                                                            : '2px solid transparent',
                                                    boxShadow: isToday
                                                        ? '0 0 10px rgba(56, 189, 248, 0.4)'
                                                        : 'none',
                                                }}
                                            >
                                                <span
                                                    className="font-bold"
                                                    style={{
                                                        fontSize: 13,
                                                        color: isActive || isToday
                                                            ? '#fff'
                                                            : 'rgba(255,255,255,0.3)',
                                                    }}
                                                >
                                                    {day.date}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Streak Info Footer */}
                            <div className="px-6 pb-6">
                                <div className="bg-white/[0.04] rounded-2xl px-4 py-3 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-[12px] bg-[#00B1FF]/20 flex items-center justify-center">
                                        <Flame className="w-5 h-5 text-[#00B1FF]" />
                                    </div>
                                    <div>
                                        <div className="text-[13px] font-bold text-white">
                                            Continua così!
                                        </div>
                                        <div className="text-[11px] text-white/40">
                                            Studia ogni giorno per mantenere la streak
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
