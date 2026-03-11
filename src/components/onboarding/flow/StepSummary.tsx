/**
 * @file StepSummary.tsx
 * @description Phase 6 — Smart Completion Screen.
 * Premium summary with dynamic recap and confetti-style celebration.
 */

import React, { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import type { OnboardingData } from '@/lib/onboardingService';

interface StepSummaryProps {
    data: OnboardingData;
    onComplete: () => void;
    saving: boolean;
}

// Map values to human-readable labels
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
        // Stagger reveal
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
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 text-center">
            {/* Celebration */}
            <div className="relative mb-8 animate-in zoom-in-75 duration-700">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/20">
                    <Sparkles className="w-12 h-12 text-white" strokeWidth={1.5} />
                </div>
                {/* Confetti dots */}
                <div className="absolute -top-4 left-0 w-3 h-3 rounded-full bg-amber-400 animate-ping" style={{ animationDuration: '2s' }} />
                <div className="absolute -top-2 right-2 w-2 h-2 rounded-full bg-[#00B1FF] animate-ping" style={{ animationDuration: '2.5s' }} />
                <div className="absolute bottom-0 -left-5 w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" style={{ animationDuration: '3s' }} />
                <div className="absolute -bottom-3 right-0 w-2 h-2 rounded-full bg-pink-400 animate-ping" style={{ animationDuration: '1.8s' }} />
            </div>

            {/* Headline */}
            <h1 className="text-2xl font-bold tracking-tight mb-2 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
                Il tuo percorso è pronto! 🎉
            </h1>
            <p className="text-[15px] text-[var(--foreground)] opacity-50 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
                Ecco cosa abbiamo preparato per te
            </p>

            {/* Summary Card */}
            {showContent && (
                <div className="w-full max-w-sm bg-white dark:bg-[#1C1C1E] rounded-3xl border border-slate-100 dark:border-slate-800 p-5 text-left shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="space-y-4">
                        {summaryItems.map((item, i) => (
                            <div
                                key={i}
                                className="flex items-start gap-3 animate-in fade-in slide-in-from-left-4 duration-300"
                                style={{ animationDelay: `${i * 100 + 200}ms`, animationFillMode: 'both' }}
                            >
                                <span className="text-xl shrink-0 mt-0.5">{item.icon}</span>
                                <div>
                                    <p className="text-[12px] font-semibold text-[var(--foreground)] opacity-40 uppercase tracking-wide">
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

            {/* CTA */}
            <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '800ms', animationFillMode: 'both' }}>
                <button
                    onClick={onComplete}
                    disabled={saving}
                    className="w-full h-14 bg-[#00B1FF] hover:bg-[#0099e6] active:scale-[0.98] transition-all text-white font-bold text-[17px] rounded-full shadow-lg shadow-[#00B1FF]/20 flex items-center justify-center disabled:opacity-70"
                >
                    {saving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        'Entra nel tuo Idoneo →'
                    )}
                </button>
            </div>

            {/* Safe area */}
            <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
    );
}
