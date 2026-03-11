/**
 * @file StepPreferences.tsx
 * @description Phase 4 — Preference Mapping with Tier S chip design.
 * Multi-select chips + time pill selector with glassmorphic styling.
 */

import React from 'react';
import { hapticLight, hapticWarning } from '@/lib/haptics';
import { Button } from '@/components/ui/Button';
import type { OnboardingData } from '@/lib/onboardingService';

const PREFERENCE_OPTIONS = [
    { value: 'quick_quiz', label: 'Quiz veloci', icon: '⚡' },
    { value: 'structured_path', label: 'Percorsi strutturati', icon: '🗺️' },
    { value: 'progressive', label: 'Difficoltà progressiva', icon: '📈' },
    { value: 'gamification', label: 'Gamification', icon: '🏆' },
    { value: 'reminders', label: 'Promemoria', icon: '🔔' },
    { value: 'detailed_stats', label: 'Statistiche', icon: '📊' },
];

const TIME_OPTIONS = [
    { value: '5-10', label: '5-10 min' },
    { value: '15-30', label: '15-30 min' },
    { value: '30-60', label: '30-60 min' },
    { value: '60+', label: '1+ ora' },
];

interface StepPreferencesProps {
    data: OnboardingData;
    onChange: (partial: Partial<OnboardingData>) => void;
    onNext: () => void;
    canAdvance: boolean;
}

export default function StepPreferences({ data, onChange, onNext, canAdvance }: StepPreferencesProps) {
    const togglePref = (value: string) => {
        hapticLight();
        const selected = data.preferences;
        if (selected.includes(value)) {
            onChange({ preferences: selected.filter(v => v !== value) });
        } else {
            if (selected.length >= 3) { hapticWarning(); return; }
            onChange({ preferences: [...selected, value] });
        }
    };

    return (
        <div className="flex-1 flex flex-col px-6 py-6 overflow-y-auto">
            {/* Headline */}
            <div className="space-y-2 mb-6">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--foreground)] leading-[1.1]">
                    Come preferisci prepararti?
                </h1>
                <p className="text-[15px] md:text-[16px] font-medium text-[var(--foreground)] opacity-50">
                    Scegli fino a 3 modalità
                </p>
            </div>

            {/* Chips — Tier S glassmorphic */}
            <div className="flex flex-wrap gap-2.5 mb-3">
                {PREFERENCE_OPTIONS.map(opt => {
                    const isSelected = data.preferences.includes(opt.value);
                    const isDisabled = !isSelected && data.preferences.length >= 3;
                    return (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => togglePref(opt.value)}
                            disabled={isDisabled}
                            className={`
                                inline-flex items-center gap-2 px-4 py-3 rounded-2xl text-[14px] font-semibold
                                transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]
                                border active:scale-[0.97]
                                ${isSelected
                                    ? 'bg-[#00B1FF]/10 dark:bg-[#00B1FF]/15 border-[#00B1FF] text-[#00B1FF]'
                                    : isDisabled
                                        ? 'bg-slate-50 dark:bg-white/[0.02] border-slate-100 dark:border-white/[0.05] text-[var(--foreground)] opacity-30 cursor-not-allowed'
                                        : 'bg-white dark:bg-white/[0.04] border-slate-100 dark:border-white/[0.08] text-[var(--foreground)] opacity-80 hover:opacity-100 shadow-soft'
                                }
                            `}
                        >
                            <span className="text-lg">{opt.icon}</span>
                            {opt.label}
                        </button>
                    );
                })}
            </div>
            <p className="text-[12px] text-[var(--foreground)] opacity-35 mb-8">
                {data.preferences.length}/3 selezionati
            </p>

            {/* Daily Time */}
            <div className="mb-8">
                <label className="text-[13px] font-bold text-[var(--foreground)] opacity-60 uppercase tracking-wide mb-3 block">
                    Quanto tempo al giorno puoi dedicare?
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                    {TIME_OPTIONS.map(opt => {
                        const isSelected = data.dailyTime === opt.value;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => { hapticLight(); onChange({ dailyTime: opt.value }); }}
                                className={`
                                    px-3 py-3 rounded-2xl text-[14px] font-semibold text-center
                                    transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]
                                    border active:scale-[0.97]
                                    ${isSelected
                                        ? 'bg-[#00B1FF]/10 dark:bg-[#00B1FF]/15 border-[#00B1FF] text-[#00B1FF] shadow-sm shadow-[#00B1FF]/10'
                                        : 'bg-white dark:bg-white/[0.04] border-slate-100 dark:border-white/[0.08] text-[var(--foreground)] opacity-80 hover:opacity-100 shadow-soft hover:shadow-md'
                                    }
                                `}
                            >
                                {opt.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* CTA */}
            <div className="pt-4 pb-[env(safe-area-inset-bottom)] sticky bottom-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)] to-transparent pt-8">
                <Button variant="primary" size="lg" fullWidth onClick={onNext} disabled={!canAdvance}>
                    Continua
                </Button>
            </div>
        </div>
    );
}
