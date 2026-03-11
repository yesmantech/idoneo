/**
 * @file StepProfile.tsx
 * @description Phase 3 — User Profile / Segmentation.
 * Three pill-select questions on one scrollable screen: age, experience, motivation.
 */

import React from 'react';
import PillSelector from '../ui/PillSelector';
import type { OnboardingData } from '@/lib/onboardingService';

const AGE_OPTIONS = [
    { value: '16-19', label: '16-19' },
    { value: '20-24', label: '20-24' },
    { value: '25-30', label: '25-30' },
    { value: '31-40', label: '31-40' },
    { value: '40+', label: '40+' },
];

const EXPERIENCE_OPTIONS = [
    { value: 'beginner', label: 'Mai' },
    { value: 'intermediate', label: 'Sì, uno' },
    { value: 'advanced', label: 'Più di uno' },
    { value: 'expert', label: 'Li faccio spesso' },
];

const MOTIVATION_OPTIONS = [
    { value: 'career', label: 'Lavoro stabile 💼' },
    { value: 'passion', label: 'Passione 🔥' },
    { value: 'challenge', label: 'Sfida personale 🏆' },
    { value: 'social', label: 'Lo fanno amici 👥' },
];

interface StepProfileProps {
    data: OnboardingData;
    onChange: (partial: Partial<OnboardingData>) => void;
    onNext: () => void;
    canAdvance: boolean;
}

export default function StepProfile({ data, onChange, onNext, canAdvance }: StepProfileProps) {
    return (
        <div className="flex-1 flex flex-col px-6 py-6 overflow-y-auto">
            {/* Headline */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight">
                    Parlaci di te
                </h2>
                <p className="text-[15px] text-[var(--foreground)] opacity-50 mt-2">
                    Ci aiuta a personalizzare il tuo percorso
                </p>
            </div>

            {/* Q1: Age */}
            <div className="mb-8">
                <label className="text-sm font-bold text-[var(--foreground)] opacity-70 mb-3 block">
                    Quanti anni hai?
                </label>
                <PillSelector
                    options={AGE_OPTIONS}
                    selected={data.ageRange}
                    onChange={(v) => onChange({ ageRange: v })}
                    columns={3}
                />
            </div>

            {/* Q2: Experience */}
            <div className="mb-8">
                <label className="text-sm font-bold text-[var(--foreground)] opacity-70 mb-3 block">
                    Hai già provato concorsi pubblici?
                </label>
                <PillSelector
                    options={EXPERIENCE_OPTIONS}
                    selected={data.experience}
                    onChange={(v) => onChange({ experience: v })}
                    columns={2}
                />
            </div>

            {/* Q3: Motivation */}
            <div className="mb-8">
                <label className="text-sm font-bold text-[var(--foreground)] opacity-70 mb-3 block">
                    Cosa ti spinge di più?
                </label>
                <PillSelector
                    options={MOTIVATION_OPTIONS}
                    selected={data.motivation}
                    onChange={(v) => onChange({ motivation: v })}
                    columns={2}
                />
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* CTA */}
            <div className="pt-4 pb-[env(safe-area-inset-bottom)] sticky bottom-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)] to-transparent pt-8">
                <button
                    onClick={onNext}
                    disabled={!canAdvance}
                    className="w-full h-14 bg-[#00B1FF] hover:bg-[#0099e6] active:scale-[0.98] transition-all text-white font-bold text-[17px] rounded-full shadow-lg shadow-[#00B1FF]/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Continua
                </button>
            </div>
        </div>
    );
}
