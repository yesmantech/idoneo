/**
 * @file StepProfile.tsx
 * @description Phase 3 — User Profile / Segmentation.
 * Three pill-select questions with Tier S glassmorphic pill styling.
 */

import React from 'react';
import { hapticLight } from '@/lib/haptics';
import { Button } from '@/components/ui/Button';
import type { OnboardingData } from '@/lib/onboardingService';

interface PillOption { value: string; label: string; }

function TierSPills({ options, selected, onChange, columns = 2 }: { options: PillOption[]; selected: string | null; onChange: (v: string) => void; columns?: number }) {
    const gridClass = columns === 3 ? 'grid-cols-3' : 'grid-cols-2';
    return (
        <div className={`grid ${gridClass} gap-2.5`}>
            {options.map(opt => {
                const isSelected = selected === opt.value;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => { hapticLight(); onChange(opt.value); }}
                        className={`
                            px-3 py-3 rounded-2xl text-[14px] font-semibold text-center leading-tight
                            transition-[background-color,border-color,color,box-shadow,transform] duration-300 ease-out
                            border active:scale-[0.97]
                            ${isSelected
                                ? 'bg-[#00B1FF]/10 dark:bg-[#00B1FF]/15 border-[#00B1FF] text-[#00B1FF] shadow-sm shadow-[#00B1FF]/10'
                                : 'bg-white dark:bg-white/[0.04] border-slate-100 dark:border-white/[0.08] text-[var(--foreground)] shadow-soft'
                            }
                        `}
                    >
                        {opt.label}
                    </button>
                );
            })}
        </div>
    );
}

const AGE_OPTIONS: PillOption[] = [
    { value: '16-19', label: '16-19' },
    { value: '20-24', label: '20-24' },
    { value: '25-30', label: '25-30' },
    { value: '31-40', label: '31-40' },
    { value: '40+', label: '40+' },
];

const EXPERIENCE_OPTIONS: PillOption[] = [
    { value: 'beginner', label: 'Mai' },
    { value: 'intermediate', label: 'Sì, uno' },
    { value: 'advanced', label: 'Più di uno' },
    { value: 'expert', label: 'Li faccio spesso' },
];

const MOTIVATION_OPTIONS: PillOption[] = [
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
        <div className="flex-1 flex flex-col px-6 py-6 overflow-y-auto pb-28">
            {/* Headline */}
            <div className="space-y-2 mb-6">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--foreground)] leading-[1.1]">
                    Parlaci di te
                </h1>
                <p className="text-[15px] md:text-[16px] font-medium text-[var(--foreground)] opacity-50">
                    Ci aiuta a personalizzare il tuo percorso
                </p>
            </div>

            {/* Q1: Age */}
            <div className="mb-7">
                <label className="text-[13px] font-bold text-[var(--foreground)] opacity-60 uppercase tracking-wide mb-3 block">
                    Quanti anni hai?
                </label>
                <TierSPills options={AGE_OPTIONS} selected={data.ageRange} onChange={(v) => onChange({ ageRange: v })} columns={3} />
            </div>

            {/* Q2: Experience */}
            <div className="mb-7">
                <label className="text-[13px] font-bold text-[var(--foreground)] opacity-60 uppercase tracking-wide mb-3 block">
                    Hai già provato concorsi pubblici?
                </label>
                <TierSPills options={EXPERIENCE_OPTIONS} selected={data.experience} onChange={(v) => onChange({ experience: v })} />
            </div>

            {/* Q3: Motivation */}
            <div className="mb-7">
                <label className="text-[13px] font-bold text-[var(--foreground)] opacity-60 uppercase tracking-wide mb-3 block">
                    Cosa ti spinge di più?
                </label>
                <TierSPills options={MOTIVATION_OPTIONS} selected={data.motivation} onChange={(v) => onChange({ motivation: v })} />
            </div>

            {/* Fixed CTA at bottom */}
            <div className="fixed bottom-0 left-0 right-0 px-6 pb-safe pt-3 bg-[var(--background)]/95 backdrop-blur-md z-40">
                <Button variant="primary" size="lg" fullWidth onClick={onNext} disabled={!canAdvance}>
                    Continua
                </Button>
            </div>
        </div>
    );
}
