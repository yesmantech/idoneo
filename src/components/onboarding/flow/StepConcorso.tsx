/**
 * @file StepConcorso.tsx
 * @description Phase 5 — Concorso Selection with Tier S card grid.
 * Real categories from DB with glassmorphic multi-select cards.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
import { getCategories, type Category } from '@/lib/data';
import { hapticLight } from '@/lib/haptics';
import { Button } from '@/components/ui/Button';

interface StepConcorsoProps {
    selected: string[];
    onChange: (categories: string[]) => void;
    onNext: () => void;
    canAdvance: boolean;
}

export default function StepConcorso({ selected, onChange, onNext }: StepConcorsoProps) {
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
            <div className="space-y-2 mb-4">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--foreground)] leading-[1.1]">
                    A quale concorso ti prepari?
                </h1>
                <p className="text-[15px] md:text-[16px] font-medium text-[var(--foreground)] opacity-50">
                    Puoi sceglierne anche più di uno
                </p>
            </div>

            {/* Search — matching login input style */}
            <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground)] opacity-30" />
                <input
                    type="text"
                    placeholder="Cerca concorso..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white dark:bg-[#111] border border-slate-100 dark:border-slate-700 text-[15px] font-medium text-[var(--foreground)] placeholder:opacity-40 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 transition-all shadow-soft"
                />
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto -mx-1 px-1 pb-4">
                {loading ? (
                    <div className="grid grid-cols-2 gap-3">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-white/[0.04] animate-pulse" />
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
                                        relative rounded-2xl p-3 text-left
                                        transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]
                                        border active:scale-[0.97] overflow-hidden
                                        ${isSelected
                                            ? 'border-[#00B1FF] bg-[#00B1FF]/5 dark:bg-[#00B1FF]/10 shadow-sm shadow-[#00B1FF]/10'
                                            : 'border-slate-100 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] shadow-soft hover:shadow-md hover:scale-[1.01]'
                                        }
                                    `}
                                >
                                    {cat.home_banner_url && (
                                        <div className="w-full h-12 rounded-xl overflow-hidden mb-2 bg-slate-100 dark:bg-white/[0.04]">
                                            <img src={cat.home_banner_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                                        </div>
                                    )}
                                    <p className={`text-[13px] font-bold leading-tight line-clamp-2 ${isSelected ? 'text-[#00B1FF]' : 'text-[var(--foreground)]'}`}>
                                        {cat.title}
                                    </p>
                                    {cat.year && (
                                        <p className="text-[11px] text-[var(--foreground)] opacity-40 mt-0.5">{cat.year}</p>
                                    )}
                                    {isSelected && (
                                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gradient-to-br from-[#00B1FF] to-[#0066FF] flex items-center justify-center animate-in zoom-in duration-150">
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                    {cat.is_new && (
                                        <span className="absolute top-2 left-2 text-[10px] font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-1.5 py-0.5 rounded-full">NEW</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}

                {!search && (
                    <button
                        onClick={() => { onChange([]); onNext(); }}
                        className="w-full mt-4 py-3 text-sm font-medium text-[var(--foreground)] opacity-40 hover:opacity-60 transition-opacity"
                    >
                        Non lo so ancora, voglio esplorare →
                    </button>
                )}
            </div>

            {/* CTA */}
            <div className="pt-4 pb-[env(safe-area-inset-bottom)] bg-gradient-to-t from-[var(--background)] via-[var(--background)] to-transparent pt-6">
                <Button variant="primary" size="lg" fullWidth onClick={onNext}>
                    {selected.length > 0 ? `Continua (${selected.length} selezionati)` : 'Continua'}
                </Button>
            </div>
        </div>
    );
}
