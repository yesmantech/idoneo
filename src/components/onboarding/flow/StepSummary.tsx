/**
 * @file StepSummary.tsx
 * @description Phase 6 — Tier S completion. CSS-only confetti (GPU),
 * full-height layout with recap card that fills the space.
 */

import React, { useEffect, useState } from 'react';
import { Trophy, ArrowRight, Target, BarChart3, Clock, Zap, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { hapticSuccess } from '@/lib/haptics';
import type { OnboardingData } from '@/lib/onboardingService';

// ─── CSS Confetti — 0 JS overhead, pure GPU ───
const CONFETTI_CSS = `
@keyframes confetti-fall {
  0%   { transform: translateY(-10px) rotate(0deg); opacity: 1; }
  80%  { opacity: 1; }
  100% { transform: translateY(100vh) rotate(var(--rot)); opacity: 0; }
}
.confetti-piece {
  position: fixed;
  top: -12px;
  z-index: 100;
  pointer-events: none;
  will-change: transform, opacity;
  animation: confetti-fall var(--dur) var(--delay) cubic-bezier(0.25,0.46,0.45,0.94) forwards;
}
`;

function CSSConfetti() {
    const colors = ['#00B1FF', '#0066FF', '#FFD93D', '#FF6B6B', '#C084FC', '#fff', '#00D4AA'];
    const pieces = Array.from({ length: 40 }, (_, i) => ({
        left: `${Math.random() * 100}%`,
        width: 5 + Math.random() * 6,
        height: 4 + Math.random() * 8,
        bg: colors[i % colors.length],
        dur: `${2 + Math.random() * 2}s`,
        delay: `${Math.random() * 0.5}s`,
        rot: `${Math.random() * 540 - 270}deg`,
        radius: i % 3 === 0 ? '50%' : '2px',
    }));

    return (
        <>
            <style>{CONFETTI_CSS}</style>
            {pieces.map((p, i) => (
                <div
                    key={i}
                    className="confetti-piece"
                    style={{
                        left: p.left,
                        width: p.width,
                        height: p.height,
                        backgroundColor: p.bg,
                        borderRadius: p.radius,
                        '--dur': p.dur,
                        '--delay': p.delay,
                        '--rot': p.rot,
                    } as React.CSSProperties}
                />
            ))}
        </>
    );
}

// ─── Labels ───
const GOAL_L: Record<string, string> = {
    goal_specific: 'Superare un concorso specifico',
    goal_structured: 'Studio strutturato e organizzato',
    goal_quick_practice: 'Esercitazione rapida con quiz',
    goal_explore: 'Esplorare e scoprire',
};
const EXP_L: Record<string, string> = {
    beginner: 'Principiante', intermediate: 'Prima esperienza',
    advanced: 'Con esperienza', expert: 'Esperto',
};
const TIME_L: Record<string, string> = {
    '5-10': '5-10 minuti al giorno', '15-30': '15-30 minuti al giorno',
    '30-60': '30-60 minuti al giorno', '60+': 'Più di 1 ora al giorno',
};
const PREF_L: Record<string, string> = {
    quick_quiz: 'Quiz veloci', structured_path: 'Percorsi strutturati',
    progressive: 'Difficoltà progressiva', gamification: 'Gamification',
    reminders: 'Promemoria', detailed_stats: 'Statistiche dettagliate',
};

interface StepSummaryProps {
    data: OnboardingData;
    onComplete: () => void;
    saving: boolean;
}

export default function StepSummary({ data, onComplete, saving }: StepSummaryProps) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        hapticSuccess();
        requestAnimationFrame(() => setShow(true));
    }, []);

    // Build rich recap rows
    const rows: { icon: React.ReactNode; label: string; value: string; tint: string }[] = [];
    if (data.goal) rows.push({
        icon: <Target className="w-[18px] h-[18px] text-[#00B1FF]" />,
        label: 'Obiettivo', value: GOAL_L[data.goal] || data.goal,
        tint: 'bg-[#00B1FF]/10',
    });
    if (data.experience) rows.push({
        icon: <BarChart3 className="w-[18px] h-[18px] text-[#0066FF]" />,
        label: 'Livello', value: EXP_L[data.experience] || data.experience,
        tint: 'bg-[#0066FF]/10',
    });
    if (data.dailyTime) rows.push({
        icon: <Clock className="w-[18px] h-[18px] text-amber-500" />,
        label: 'Tempo', value: TIME_L[data.dailyTime] || data.dailyTime,
        tint: 'bg-amber-500/10',
    });
    if (data.preferences.length > 0) rows.push({
        icon: <Zap className="w-[18px] h-[18px] text-purple-500" />,
        label: 'Stile', value: data.preferences.map((p: string) => PREF_L[p] || p).join(', '),
        tint: 'bg-purple-500/10',
    });
    if (data.categories.length > 0) rows.push({
        icon: <BookOpen className="w-[18px] h-[18px] text-emerald-500" />,
        label: 'Concorsi', value: `${data.categories.length} selezionati`,
        tint: 'bg-emerald-500/10',
    });

    return (
        <div
            className="flex-1 flex flex-col relative overflow-hidden bg-[var(--background)]"
            style={{ paddingTop: 'var(--safe-area-top, 0px)' }}
        >
            <CSSConfetti />

            {/* ─── Content — centered group ─── */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24">

                {/* Trophy + headline */}
                <div
                    className={`flex flex-col items-center mb-6 transition-all duration-700 ease-out ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                >
                    <div className="relative mb-5">
                        <div className="absolute -inset-4 rounded-[28px] bg-[#00B1FF]/10 blur-2xl" />
                        <div className="relative w-[72px] h-[72px] rounded-[20px] bg-gradient-to-br from-[#00B1FF] to-[#0066FF] flex items-center justify-center shadow-xl shadow-[#00B1FF]/30">
                            <Trophy className="w-9 h-9 text-white" strokeWidth={1.5} />
                        </div>
                    </div>
                    <h1 className="text-[22px] font-extrabold tracking-tight leading-[1.2] text-center mb-1">
                        <span className="bg-gradient-to-r from-[#00B1FF] to-[#0066FF] bg-clip-text text-transparent">Tutto pronto</span>
                        <span className="text-[var(--foreground)]"> per te! 🎉</span>
                    </h1>
                    <p className="text-[13px] font-medium text-[var(--foreground)] opacity-40">
                        Il tuo percorso personalizzato è configurato
                    </p>
                </div>

                {/* Recap card — content-sized, not stretched */}
                <div
                    className={`w-full rounded-3xl overflow-hidden border border-slate-100 dark:border-white/[0.08] shadow-soft transition-all duration-700 delay-300 ease-out ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                    style={{ background: 'var(--card, rgba(255,255,255,0.04))' }}
                >
                    <div className="px-5 pt-4 pb-2">
                        <p className="text-[10px] font-black text-[var(--foreground)] opacity-30 uppercase tracking-[0.15em] mb-3">
                            Il tuo piano
                        </p>

                        {rows.map((row, i) => (
                            <div
                                key={i}
                                className={`flex items-center gap-3.5 py-3.5 ${i < rows.length - 1 ? 'border-b border-slate-100 dark:border-white/[0.05]' : ''}`}
                                style={{
                                    transition: 'opacity 0.4s ease, transform 0.4s ease',
                                    transitionDelay: `${400 + i * 90}ms`,
                                    opacity: show ? 1 : 0,
                                    transform: show ? 'translateX(0)' : 'translateX(-10px)',
                                }}
                            >
                                <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 ${row.tint}`}>
                                    {row.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold text-[var(--foreground)] opacity-30 uppercase tracking-widest leading-none mb-0.5">
                                        {row.label}
                                    </p>
                                    <p className="text-[14px] font-semibold text-[var(--foreground)] leading-snug line-clamp-1">
                                        {row.value}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ─── Fixed CTA ─── */}
            <div
                className={`fixed bottom-0 left-0 right-0 z-50 px-6 pb-safe pt-3 bg-[var(--background)]/95 backdrop-blur-md transition-all duration-500 delay-[900ms] ease-out ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            >
                <Button variant="primary" size="lg" fullWidth onClick={onComplete} disabled={saving} isLoading={saving}>
                    <span className="flex items-center justify-center gap-2 font-bold">
                        Inizia la preparazione
                        <ArrowRight className="w-5 h-5" />
                    </span>
                </Button>
            </div>
        </div>
    );
}
