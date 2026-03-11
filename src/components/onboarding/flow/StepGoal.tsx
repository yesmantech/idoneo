/**
 * @file StepGoal.tsx
 * @description Phase 2 — Goal Discovery. Single-select card question.
 */

import React from 'react';
import CardSelector from '../ui/CardSelector';

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
            {/* Headline */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold tracking-tight">
                    Cosa vuoi ottenere?
                </h2>
                <p className="text-[15px] text-[var(--foreground)] opacity-50 mt-2">
                    Scegli ciò che ti rappresenta di più
                </p>
            </div>

            {/* Cards */}
            <CardSelector
                options={GOAL_OPTIONS}
                selected={value}
                onChange={(v) => {
                    onChange(v);
                    // Auto-advance after selection with small delay
                    setTimeout(onNext, 400);
                }}
            />

            {/* Spacer */}
            <div className="flex-1" />

            {/* CTA (hidden when auto-advance works, but fallback) */}
            {canAdvance && (
                <div className="pt-6 pb-[env(safe-area-inset-bottom)]">
                    <button
                        onClick={onNext}
                        className="w-full h-14 bg-[#00B1FF] hover:bg-[#0099e6] active:scale-[0.98] transition-all text-white font-bold text-[17px] rounded-full shadow-lg shadow-[#00B1FF]/20"
                    >
                        Continua
                    </button>
                </div>
            )}
        </div>
    );
}
