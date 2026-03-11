/**
 * @file CardSelector.tsx
 * @description Card-based selector for single-choice questions.
 * Each card has emoji, title, and description. Premium stagger animation.
 */

import React from 'react';
import { hapticLight } from '@/lib/haptics';

interface CardOption {
    value: string;
    emoji: string;
    title: string;
    description: string;
}

interface CardSelectorProps {
    options: CardOption[];
    selected: string | null;
    onChange: (value: string) => void;
}

export default function CardSelector({ options, selected, onChange }: CardSelectorProps) {
    return (
        <div className="flex flex-col gap-3">
            {options.map((opt, i) => {
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
                            relative flex items-center gap-4 p-4 rounded-2xl text-left
                            transition-all duration-200 ease-out
                            border-2 active:scale-[0.98]
                            animate-in slide-in-from-bottom-4 fade-in
                            ${isSelected
                                ? 'bg-[#00B1FF]/8 border-[#00B1FF] shadow-sm shadow-[#00B1FF]/10'
                                : 'bg-white dark:bg-[#1C1C1E] border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
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
                            <div className="shrink-0 w-6 h-6 rounded-full bg-[#00B1FF] flex items-center justify-center animate-in zoom-in duration-200">
                                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
