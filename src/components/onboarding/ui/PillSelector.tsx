/**
 * @file PillSelector.tsx
 * @description Horizontal pill selector for single-choice questions.
 * Premium design with haptic feedback and smooth selection animation.
 */

import React from 'react';
import { hapticLight } from '@/lib/haptics';

interface PillOption {
    value: string;
    label: string;
}

interface PillSelectorProps {
    options: PillOption[];
    selected: string | null;
    onChange: (value: string) => void;
    columns?: 2 | 3 | 4;
}

export default function PillSelector({ options, selected, onChange, columns = 2 }: PillSelectorProps) {
    const gridClass = columns === 3
        ? 'grid-cols-3'
        : columns === 4
            ? 'grid-cols-4'
            : 'grid-cols-2';

    return (
        <div className={`grid ${gridClass} gap-3`}>
            {options.map((opt) => {
                const isSelected = selected === opt.value;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                            hapticLight();
                            onChange(opt.value);
                        }}
                        className={`
                            relative px-4 py-3.5 rounded-2xl text-[15px] font-semibold
                            transition-all duration-200 ease-out
                            border-2 text-center leading-tight
                            active:scale-[0.96]
                            ${isSelected
                                ? 'bg-[#00B1FF]/10 border-[#00B1FF] text-[#00B1FF] dark:bg-[#00B1FF]/20 shadow-sm shadow-[#00B1FF]/10'
                                : 'bg-white dark:bg-[#1C1C1E] border-slate-200 dark:border-slate-700 text-[var(--foreground)] opacity-80 hover:opacity-100 hover:border-slate-300 dark:hover:border-slate-600'
                            }
                        `}
                    >
                        {opt.label}
                        {isSelected && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#00B1FF] animate-in zoom-in duration-200" />
                        )}
                    </button>
                );
            })}
        </div>
    );
}
