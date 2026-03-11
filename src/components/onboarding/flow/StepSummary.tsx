/**
 * @file StepSummary.tsx
 * @description Phase 6 — Completion screen with Tier S celebration.
 * Brand gradient card, glassmorphic recap, and shared Button CTA.
 */

import React, { useEffect, useState } from 'react';
import { Loader2, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { OnboardingData } from '@/lib/onboardingService';

interface StepSummaryProps {
    data: OnboardingData;
    onComplete: () => void;
    saving: boolean;
}

const GOAL_LABELS: Record<string, string> = {
    goal_specific: 'Superare un concorso specifico',
    goal_structured: 'Studio strutturato e organizzato',
    goal_quick_practice: 'Esercitazione rapida con quiz',
    goal_explore: 'Esplorare e scoprire',
};

const EXPERIENCE_LABELS: Record<string, string> = {
    beginner: 'Principiante',
    intermediate: 'Prima esperienza',
    advanced: 'Con esperienza',
    expert: 'Esperto',
};

const TIME_LABELS: Record<string, string> = {
    '5-10': '5-10 minuti al giorno',
    '15-30': '15-30 minuti al giorno',
    '30-60': '30-60 minuti al giorno',
    '60+': 'Più di 1 ora al giorno',
};

const PREF_LABELS: Record<string, string> = {
    quick_quiz: 'Quiz veloci',
    structured_path: 'Percorsi strutturati',
    progressive: 'Difficoltà progressiva',
    gamification: 'Gamification',
    reminders: 'Promemoria',
    detailed_stats: 'Statistiche dettagliate',
};

export default function StepSummary({ data, onComplete, saving }: StepSummaryProps) {
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setShowContent(true), 300);
        return () => clearTimeout(t);
    }, []);

    const summaryItems = [
        data.goal && { icon: '📌', label: 'Obiettivo', value: GOAL_LABELS[data.goal] || data.goal },
        data.experience && { icon: '📊', label: 'Livello', value: EXPERIENCE_LABELS[data.experience] || data.experience },
        data.dailyTime && { icon: '⏱️', label: 'Sessioni', value: TIME_LABELS[data.dailyTime] || data.dailyTime },
        data.preferences.length > 0 && { icon: '⚡', label: 'Stile', value: data.preferences.map(p => PREF_LABELS[p] || p).join(', ') },
        data.categories.length > 0 && { icon: '🎯', label: 'Concorsi', value: `${data.categories.length} selezionati` },
    ].filter(Boolean) as { icon: string; label: string; value: string }[];

    return (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
            {/* Celebration Icon — brand gradient */}
            <div className="relative mb-8 animate-in zoom-in-75 duration-700">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-500/25">
                    <Trophy className="w-10 h-10 text-white" strokeWidth={1.5} />
                </div>
                {/* Confetti dots — pastel circles like login floating icons */}
                <div className="absolute -top-3 left-1 w-3 h-3 rounded-full bg-amber-400 animate-ping" style={{ animationDuration: '2s' }} />
                <div className="absolute -top-1 -right-3 w-2.5 h-2.5 rounded-full bg-[#00B1FF] animate-ping" style={{ animationDuration: '2.5s' }} />
                <div className="absolute -bottom-2 -left-4 w-2 h-2 rounded-full bg-purple-400 animate-ping" style={{ animationDuration: '3s' }} />
                <div className="absolute -bottom-3 right-1 w-2 h-2 rounded-full bg-rose-400 animate-ping" style={{ animationDuration: '1.8s' }} />
            </div>

            {/* Headline */}
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--foreground)] leading-[1.1] mb-2 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
                Il tuo percorso è pronto! 🎉
            </h1>
            <p className="text-[15px] md:text-[16px] font-medium text-[var(--foreground)] opacity-50 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
                Ecco cosa abbiamo preparato per te
            </p>

            {/* Recap Card — Tier S glassmorphic */}
            {showContent && (
                <div className="w-full max-w-sm bg-white dark:bg-white/[0.04] rounded-3xl border border-slate-100 dark:border-white/[0.08] p-5 text-left shadow-soft animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="space-y-4">
                        {summaryItems.map((item, i) => (
                            <div
                                key={i}
                                className="flex items-start gap-3 animate-in fade-in slide-in-from-left-4 duration-300"
                                style={{ animationDelay: `${i * 100 + 200}ms`, animationFillMode: 'both' }}
                            >
                                <span className="text-xl shrink-0 mt-0.5">{item.icon}</span>
                                <div>
                                    <p className="text-[11px] font-bold text-[var(--foreground)] opacity-40 uppercase tracking-wide">
                                        {item.label}
                                    </p>
                                    <p className="text-[15px] font-semibold text-[var(--foreground)]">
                                        {item.value}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Spacer */}
            <div className="flex-1 min-h-8" />

            {/* CTA — shared Button component */}
            <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '800ms', animationFillMode: 'both' }}>
                <Button variant="primary" size="lg" fullWidth onClick={onComplete} disabled={saving} isLoading={saving}>
                    Entra nel tuo Idoneo →
                </Button>
            </div>

            <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
    );
}
