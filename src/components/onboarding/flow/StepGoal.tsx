/**
 * @file StepGoal.tsx
 * @description Phase 2 — Goal Discovery with Tier S card design.
 * Uses glassmorphic card borders, brand gradient accent, and tactile press feedback.
 */

import React from 'react';
import { hapticLight } from '@/lib/haptics';

const GOAL_OPTIONS = [
    {
        value: 'goal_specific',
        emoji: '🎯',
        title: 'Superare un concorso',
        description: 'Ho un obiettivo preciso e voglio prepararmi al meglio',
    },
    {
        value: 'goal_structured',
        emoji: '📚',
        title: 'Studiare con metodo',
        description: 'Voglio un percorso strutturato e organizzato',
    },
    {
        value: 'goal_quick_practice',
        emoji: '⚡',
        title: 'Esercitarmi velocemente',
        description: 'Quiz rapidi senza fronzoli, subito e ovunque',
    },
    {
        value: 'goal_explore',
        emoji: '🔍',
        title: 'Esplorare e capire',
        description: 'Sono curioso, voglio guardarmi intorno',
    },
];

interface StepGoalProps {
    value: string | null;
    onChange: (goal: string) => void;
    onNext: () => void;
    canAdvance: boolean;
}

export default function StepGoal({ value, onChange, onNext, canAdvance }: StepGoalProps) {
    return (
        <div className="flex-1 flex flex-col px-6 py-6">
            {/* Headline — same typography as login page */}
            <div className="space-y-2 mb-8">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--foreground)] leading-[1.1]">
                    Cosa vuoi ottenere?
                </h1>
                <p className="text-[15px] md:text-[16px] font-medium text-[var(--foreground)] opacity-50">
                    Scegli ciò che ti rappresenta di più
                </p>
            </div>

            {/* Cards — Tier S glassmorphic style */}
            <div className="flex flex-col gap-3">
                {GOAL_OPTIONS.map((opt, i) => {
                    const isSelected = value === opt.value;
                    return (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                                hapticLight();
                                onChange(opt.value);
                                setTimeout(onNext, 400);
                            }}
                            className={`
                                relative flex items-center gap-4 p-4 rounded-2xl text-left
                                transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]
                                border active:scale-[0.97]
                                animate-in slide-in-from-bottom-4 fade-in
                                ${isSelected
                                    ? 'bg-[#00B1FF]/8 dark:bg-[#00B1FF]/10 border-[#00B1FF] shadow-sm shadow-[#00B1FF]/10'
                                    : 'bg-white dark:bg-white/[0.04] border-slate-100 dark:border-white/[0.08] shadow-soft hover:shadow-md hover:scale-[1.01]'
                                }
                            `}
                            style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}
                        >
                            <span className="text-3xl shrink-0">{opt.emoji}</span>
                            <div className="flex-1 min-w-0">
                                <p className={`font-bold text-[15px] ${isSelected ? 'text-[#00B1FF]' : 'text-[var(--foreground)]'}`}>
                                    {opt.title}
                                </p>
                                <p className="text-[13px] text-[var(--foreground)] opacity-50 leading-snug mt-0.5">
                                    {opt.description}
                                </p>
                            </div>
                            {isSelected && (
                                <div className="shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-[#00B1FF] to-[#0066FF] flex items-center justify-center animate-in zoom-in duration-200">
                                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Spacer */}
            <div className="flex-1" />
        </div>
    );
}
