/**
 * @file ChipMultiSelect.tsx
 * @description Multi-select chip component for preference mapping.
 * Supports max selection limit with visual feedback.
 */

import React from 'react';
import { hapticLight, hapticWarning } from '@/lib/haptics';

interface ChipOption {
    value: string;
    label: string;
    icon: string;
}

interface ChipMultiSelectProps {
    options: ChipOption[];
    selected: string[];
    onChange: (values: string[]) => void;
    maxSelections?: number;
}

export default function ChipMultiSelect({ options, selected, onChange, maxSelections }: ChipMultiSelectProps) {
    const handleToggle = (value: string) => {
        hapticLight();
        if (selected.includes(value)) {
            onChange(selected.filter(v => v !== value));
        } else {
            if (maxSelections && selected.length >= maxSelections) {
                hapticWarning();
                return;
            }
            onChange([...selected, value]);
        }
    };

    return (
        <div className="flex flex-wrap gap-3">
            {options.map((opt) => {
                const isSelected = selected.includes(opt.value);
                const isDisabled = !isSelected && maxSelections ? selected.length >= maxSelections : false;

                return (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleToggle(opt.value)}
                        disabled={isDisabled}
                        className={`
                            inline-flex items-center gap-2 px-4 py-3 rounded-2xl text-[14px] font-semibold
                            transition-all duration-200 ease-out
                            border-2 active:scale-[0.96]
                            ${isSelected
                                ? 'bg-[#00B1FF]/10 border-[#00B1FF] text-[#00B1FF] dark:bg-[#00B1FF]/20'
                                : isDisabled
                                    ? 'bg-slate-50 dark:bg-[#1C1C1E] border-slate-100 dark:border-slate-800 text-[var(--foreground)] opacity-30 cursor-not-allowed'
                                    : 'bg-white dark:bg-[#1C1C1E] border-slate-200 dark:border-slate-700 text-[var(--foreground)] opacity-80 hover:opacity-100'
                            }
                        `}
                    >
                        <span className="text-lg">{opt.icon}</span>
                        {opt.label}
                    </button>
                );
            })}
            {maxSelections && (
                <p className="w-full text-[12px] text-[var(--foreground)] opacity-40 mt-1">
                    {selected.length}/{maxSelections} selezionati
                </p>
            )}
        </div>
    );
}
