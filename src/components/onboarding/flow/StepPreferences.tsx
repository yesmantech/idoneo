/**
 * @file StepPreferences.tsx
 * @description Phase 4 — Preference Mapping.
 * Multi-select chips for learning style + pill selector for daily time.
 */

import React from 'react';
import ChipMultiSelect from '../ui/ChipMultiSelect';
import PillSelector from '../ui/PillSelector';
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
    return (
        <div className="flex-1 flex flex-col px-6 py-6 overflow-y-auto">
            {/* Headline */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight">
                    Come preferisci prepararti?
                </h2>
                <p className="text-[15px] text-[var(--foreground)] opacity-50 mt-2">
                    Scegli fino a 3 modalità
                </p>
            </div>

            {/* Chips */}
            <div className="mb-10">
                <ChipMultiSelect
                    options={PREFERENCE_OPTIONS}
                    selected={data.preferences}
                    onChange={(v) => onChange({ preferences: v })}
                    maxSelections={3}
                />
            </div>

            {/* Daily Time */}
            <div className="mb-8">
                <label className="text-sm font-bold text-[var(--foreground)] opacity-70 mb-3 block">
                    Quanto tempo al giorno puoi dedicare?
                </label>
                <PillSelector
                    options={TIME_OPTIONS}
                    selected={data.dailyTime}
                    onChange={(v) => onChange({ dailyTime: v })}
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
