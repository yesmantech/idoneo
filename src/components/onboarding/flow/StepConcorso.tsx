/**
 * @file StepConcorso.tsx
 * @description Phase 5 — Concorso Selection.
 * Grid of real categories from DB with multi-select and optional search.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
import { getCategories, type Category } from '@/lib/data';
import { hapticLight } from '@/lib/haptics';

interface StepConcorsoProps {
    selected: string[];
    onChange: (categories: string[]) => void;
    onNext: () => void;
    canAdvance: boolean;
}

export default function StepConcorso({ selected, onChange, onNext, canAdvance }: StepConcorsoProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        getCategories().then(cats => {
            setCategories(cats);
            setLoading(false);
        });
    }, []);

    const filtered = useMemo(() => {
        if (!search.trim()) return categories;
        const q = search.toLowerCase();
        return categories.filter(c =>
            c.title.toLowerCase().includes(q) ||
            (c.subtitle && c.subtitle.toLowerCase().includes(q))
        );
    }, [categories, search]);

    const toggleCategory = (id: string) => {
        hapticLight();
        if (selected.includes(id)) {
            onChange(selected.filter(s => s !== id));
        } else {
            onChange([...selected, id]);
        }
    };

    return (
        <div className="flex-1 flex flex-col px-6 py-6">
            {/* Headline */}
            <div className="mb-4">
                <h2 className="text-2xl font-bold tracking-tight">
                    A quale concorso ti prepari?
                </h2>
                <p className="text-[15px] text-[var(--foreground)] opacity-50 mt-2">
                    Puoi sceglierne anche più di uno
                </p>
            </div>

            {/* Search */}
            <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground)] opacity-30" />
                <input
                    type="text"
                    placeholder="Cerca concorso..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-12 pl-11 pr-4 rounded-2xl bg-slate-50 dark:bg-[#1C1C1E] border border-slate-200 dark:border-slate-700 text-[15px] font-medium text-[var(--foreground)] placeholder:opacity-40 focus:outline-none focus:ring-2 focus:ring-[#00B1FF]/30 transition-all"
                />
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto -mx-1 px-1 pb-4">
                {loading ? (
                    <div className="grid grid-cols-2 gap-3">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {filtered.map((cat) => {
                            const isSelected = selected.includes(cat.id);
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => toggleCategory(cat.id)}
                                    className={`
                                        relative rounded-2xl p-3 text-left transition-all duration-200
                                        border-2 active:scale-[0.97] overflow-hidden
                                        ${isSelected
                                            ? 'border-[#00B1FF] bg-[#00B1FF]/5 dark:bg-[#00B1FF]/10'
                                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1C1C1E]'
                                        }
                                    `}
                                >
                                    {/* Banner image */}
                                    {cat.home_banner_url && (
                                        <div className="w-full h-12 rounded-xl overflow-hidden mb-2 bg-slate-100 dark:bg-slate-800">
                                            <img
                                                src={cat.home_banner_url}
                                                alt=""
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                        </div>
                                    )}
                                    <p className={`text-[13px] font-bold leading-tight line-clamp-2 ${isSelected ? 'text-[#00B1FF]' : 'text-[var(--foreground)]'}`}>
                                        {cat.title}
                                    </p>
                                    {cat.year && (
                                        <p className="text-[11px] text-[var(--foreground)] opacity-40 mt-0.5">{cat.year}</p>
                                    )}
                                    {/* Check */}
                                    {isSelected && (
                                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#00B1FF] flex items-center justify-center animate-in zoom-in duration-150">
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                    {cat.is_new && (
                                        <span className="absolute top-2 left-2 text-[10px] font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">NEW</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* "Non lo so ancora" option */}
                {!search && (
                    <button
                        onClick={() => {
                            onChange([]);
                            onNext();
                        }}
                        className="w-full mt-4 py-3 text-sm font-medium text-[var(--foreground)] opacity-40 hover:opacity-60 transition-opacity"
                    >
                        Non lo so ancora, voglio esplorare →
                    </button>
                )}
            </div>

            {/* CTA */}
            <div className="pt-4 pb-[env(safe-area-inset-bottom)] bg-gradient-to-t from-[var(--background)] via-[var(--background)] to-transparent pt-6">
                <button
                    onClick={onNext}
                    className="w-full h-14 bg-[#00B1FF] hover:bg-[#0099e6] active:scale-[0.98] transition-all text-white font-bold text-[17px] rounded-full shadow-lg shadow-[#00B1FF]/20"
                >
                    {selected.length > 0 ? `Continua (${selected.length} selezionati)` : 'Continua'}
                </button>
            </div>
        </div>
    );
}
