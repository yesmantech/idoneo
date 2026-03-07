/**
 * @file StreakCalendarModal.tsx
 * @description Full calendar modal showing all login/activity history.
 * Tier S design: spring animations, staggered reveals, tactile interactions.
 * Supports both light and dark mode.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { getTierFromStreak, type FlameTier } from '@/components/gamification/AnimatedFlame';

const FLAME_ICONS: Record<FlameTier, string> = {
    bronze: '/icons/flame-bronze.png',
    silver: '/icons/flame-silver.png',
    gold: '/icons/flame-gold.png',
    emerald: '/icons/flame-emerald.png',
    sapphire: '/icons/flame-sapphire.png',
    diamond: '/icons/flame-diamond.png',
};

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

/* ── Framer Motion variants ── */
const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
};

const modalVariants = {
    hidden: { opacity: 0, scale: 0.92, y: 30 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { type: 'spring' as const, stiffness: 400, damping: 28, mass: 0.8 },
    },
    exit: {
        opacity: 0,
        scale: 0.92,
        y: 30,
        transition: { duration: 0.2, ease: 'easeIn' as const },
    },
};

const staggerContainer = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.015, delayChildren: 0.15 },
    },
};

const dayVariant = {
    hidden: { opacity: 0, scale: 0.6 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { type: 'spring', stiffness: 500, damping: 25 },
    },
};

const slideUp = {
    hidden: { opacity: 0, y: 16 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring' as const, stiffness: 300, damping: 24, delay: 0.3 },
    },
};

export default function StreakCalendarModal({
    isOpen,
    onClose,
    streakCurrent,
    streakMax,
}: StreakCalendarModalProps) {
    const { user } = useAuth();
    const [viewDate, setViewDate] = useState(new Date());
    const [activeDates, setActiveDates] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [tappedStat, setTappedStat] = useState<'current' | 'max' | null>(null);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    // Fetch activity dates: merge streak-based consecutive days + quiz_attempts
    useEffect(() => {
        if (!isOpen || !user) return;

        async function fetchMonthActivity() {
            setLoading(true);
            const dates = new Set<string>();

            // 1. Add streak-based consecutive days (backwards from today)
            if (streakCurrent > 0) {
                const today = new Date();
                for (let i = 0; i < streakCurrent; i++) {
                    const d = new Date(today);
                    d.setDate(today.getDate() - i);
                    if (d.getFullYear() === year && d.getMonth() === month) {
                        dates.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
                    }
                }
            }

            // 2. Also fetch quiz_attempts for additional activity days
            const startOfMonth = new Date(year, month, 1);
            const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

            const { data } = await supabase
                .from('quiz_attempts')
                .select('completed_at')
                .eq('user_id', user!.id)
                .gte('completed_at', startOfMonth.toISOString())
                .lte('completed_at', endOfMonth.toISOString());

            if (data) {
                data.forEach(row => {
                    const d = new Date(row.completed_at);
                    dates.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
                });
            }

            setActiveDates(dates);
            setLoading(false);
        }

        fetchMonthActivity();
    }, [isOpen, user, year, month, streakCurrent]);

    // Build calendar grid
    const calendarDays = useMemo(() => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();

        let startDow = firstDay.getDay();
        startDow = startDow === 0 ? 6 : startDow - 1;

        const days: Array<{ date: number; isActive: boolean; isToday: boolean; inMonth: boolean }> = [];

        for (let i = 0; i < startDow; i++) {
            days.push({ date: 0, isActive: false, isToday: false, inMonth: false });
        }

        const today = new Date();
        const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

        for (let d = 1; d <= daysInMonth; d++) {
            const key = `${year}-${month}-${d}`;
            days.push({
                date: d,
                isActive: activeDates.has(key),
                isToday: key === todayKey,
                inMonth: true,
            });
        }

        return days;
    }, [year, month, activeDates]);

    const activeDaysCount = calendarDays.filter(d => d.inMonth && d.isActive).length;

    const goToPrevMonth = () => setViewDate(new Date(year, month - 1, 1));
    const goToNextMonth = () => setViewDate(new Date(year, month + 1, 1));

    const now = new Date();
    const canGoNext = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth());

    // Flame tap handler — triggers a bounce + wiggle
    const handleStatTap = (stat: 'current' | 'max') => {
        setTappedStat(stat);
        setTimeout(() => setTappedStat(null), 600);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        variants={overlayVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/50 dark:bg-black/60 z-50"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="fixed inset-x-4 top-[12%] z-50 mx-auto max-w-[420px]"
                    >
                        <div className="rounded-[24px] overflow-hidden bg-white dark:bg-[#1C1C1E] shadow-[0_24px_80px_-12px_rgba(0,0,0,0.25)] dark:shadow-none border border-slate-200 dark:border-transparent">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 pt-6 pb-4">
                                <motion.h2
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 20 }}
                                    className="text-xl font-bold text-slate-900 dark:text-white tracking-tight"
                                >
                                    Streak Giornaliero
                                </motion.h2>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.85 }}
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/20 transition-colors"
                                >
                                    <X className="w-4 h-4 text-slate-500 dark:text-white/60" />
                                </motion.button>
                            </div>

                            {/* Stats Summary — Interactive */}
                            <div className="flex gap-3 px-6 pb-5">
                                {/* Current Streak */}
                                <motion.button
                                    className="flex-1 bg-slate-50 dark:bg-white/[0.04] rounded-2xl px-4 py-3 border border-slate-100 dark:border-transparent text-left active:bg-slate-100 dark:active:bg-white/[0.08] transition-colors"
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleStatTap('current')}
                                >
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30 mb-1">
                                        Streak Attuale
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <motion.img
                                            src={FLAME_ICONS[getTierFromStreak(streakCurrent)]}
                                            alt="streak"
                                            style={{ height: 22, width: 'auto' }}
                                            animate={tappedStat === 'current' ? {
                                                scale: [1, 1.4, 0.9, 1.2, 1],
                                                rotate: [0, -15, 15, -8, 0],
                                            } : {}}
                                            transition={{ duration: 0.5, ease: 'easeOut' }}
                                        />
                                        <span className="text-lg font-bold text-slate-900 dark:text-white">
                                            {streakCurrent} {streakCurrent === 1 ? 'giorno' : 'giorni'}
                                        </span>
                                    </div>
                                </motion.button>

                                {/* Best Streak */}
                                <motion.button
                                    className="flex-1 bg-slate-50 dark:bg-white/[0.04] rounded-2xl px-4 py-3 border border-slate-100 dark:border-transparent text-left active:bg-slate-100 dark:active:bg-white/[0.08] transition-colors"
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleStatTap('max')}
                                >
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30 mb-1">
                                        Miglior Streak
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <motion.img
                                            src={FLAME_ICONS[getTierFromStreak(streakMax)]}
                                            alt="best"
                                            style={{ height: 22, width: 'auto' }}
                                            animate={tappedStat === 'max' ? {
                                                scale: [1, 1.4, 0.9, 1.2, 1],
                                                rotate: [0, -15, 15, -8, 0],
                                            } : {}}
                                            transition={{ duration: 0.5, ease: 'easeOut' }}
                                        />
                                        <span className="text-lg font-bold text-slate-900 dark:text-white">
                                            {streakMax} {streakMax === 1 ? 'giorno' : 'giorni'}
                                        </span>
                                    </div>
                                </motion.button>
                            </div>

                            {/* Month Navigation */}
                            <div className="flex items-center justify-between px-6 pb-3">
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.85, x: -3 }}
                                    onClick={goToPrevMonth}
                                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4 text-slate-500 dark:text-white/60" />
                                </motion.button>
                                <div className="text-center">
                                    <AnimatePresence mode="wait">
                                        <motion.span
                                            key={`${month}-${year}`}
                                            initial={{ opacity: 0, y: -8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 8 }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                            className="text-[15px] font-bold text-slate-900 dark:text-white block"
                                        >
                                            {MONTHS_IT[month]} {year}
                                        </motion.span>
                                    </AnimatePresence>
                                    {!loading && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.2 }}
                                            className="text-[11px] text-slate-400 dark:text-white/30 mt-0.5"
                                        >
                                            {activeDaysCount} {activeDaysCount === 1 ? 'giorno attivo' : 'giorni attivi'}
                                        </motion.div>
                                    )}
                                </div>
                                <motion.button
                                    whileHover={canGoNext ? { scale: 1.1 } : {}}
                                    whileTap={canGoNext ? { scale: 0.85, x: 3 } : {}}
                                    onClick={goToNextMonth}
                                    disabled={!canGoNext}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors
                                        ${canGoNext ? 'bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/10' : 'opacity-20 cursor-not-allowed'}`}
                                >
                                    <ChevronRight className="w-4 h-4 text-slate-500 dark:text-white/60" />
                                </motion.button>
                            </div>

                            {/* Weekday Headers */}
                            <div className="grid grid-cols-7 px-5 pb-2">
                                {WEEKDAYS.map((wd, i) => (
                                    <motion.div
                                        key={wd}
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.08 + i * 0.02 }}
                                        className="text-center"
                                    >
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/25">
                                            {wd}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Calendar Grid — Staggered entrance */}
                            <div className="grid grid-cols-7 gap-y-1 px-5 pb-5">
                                {loading ? (
                                    Array.from({ length: 35 }).map((_, idx) => (
                                        <div key={idx} className="flex items-center justify-center">
                                            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/[0.03] animate-pulse" />
                                        </div>
                                    ))
                                ) : (
                                    calendarDays.map((day, idx) => {
                                        if (!day.inMonth) {
                                            return <div key={idx} className="aspect-square" />;
                                        }

                                        const isActive = day.isActive;
                                        const isToday = day.isToday;

                                        return (
                                            <motion.div
                                                key={`${month}-${year}-${idx}`}
                                                initial={{ opacity: 0, scale: 0.5 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{
                                                    type: 'spring',
                                                    stiffness: 500,
                                                    damping: 25,
                                                    delay: 0.1 + idx * 0.012,
                                                }}
                                                className="flex items-center justify-center"
                                                whileTap={isActive ? { scale: 0.85 } : {}}
                                            >
                                                <div
                                                    className="flex items-center justify-center transition-all duration-200"
                                                    style={{
                                                        width: 36,
                                                        height: 36,
                                                        borderRadius: 12,
                                                        backgroundColor: isActive
                                                            ? isToday
                                                                ? 'rgba(0, 177, 255, 0.4)'
                                                                : 'rgba(0, 177, 255, 0.2)'
                                                            : 'transparent',
                                                        border: isToday
                                                            ? '2px solid #0094E0'
                                                            : isActive
                                                                ? '2px solid #00B1FF'
                                                                : '2px solid transparent',
                                                        boxShadow: isToday
                                                            ? '0 0 10px rgba(0, 148, 224, 0.35)'
                                                            : 'none',
                                                    }}
                                                >
                                                    <span
                                                        className="font-bold text-[13px]"
                                                        style={{
                                                            color: isActive || isToday
                                                                ? '#00B1FF'
                                                                : undefined,
                                                        }}
                                                    >
                                                        <span className={!(isActive || isToday) ? 'text-slate-500 dark:text-white/30' : ''}>
                                                            {day.date}
                                                        </span>
                                                    </span>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Footer — Slide up */}
                            <motion.div
                                variants={slideUp}
                                initial="hidden"
                                animate="visible"
                                className="px-6 pb-6"
                            >
                                <div className="bg-slate-50 dark:bg-white/[0.04] rounded-2xl px-4 py-3 flex items-center gap-3 border border-slate-100 dark:border-transparent">
                                    <motion.div
                                        className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-[#00B1FF]/12 to-[#0066FF]/12 dark:from-[#00B1FF]/20 dark:to-[#0066FF]/20 flex items-center justify-center"
                                        animate={{ scale: [1, 1.05, 1] }}
                                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                                    >
                                        <Sparkles className="w-5 h-5 text-[#00B1FF]" />
                                    </motion.div>
                                    <div>
                                        <div className="text-[13px] font-bold text-slate-900 dark:text-white">
                                            Continua così!
                                        </div>
                                        <div className="text-[11px] text-slate-400 dark:text-white/40">
                                            Studia ogni giorno per mantenere la streak
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
