import React, { useState, useRef, useEffect } from 'react';
import { X, Trophy } from 'lucide-react';
import { getCategoryStyle } from '@/lib/categoryIcons';

// Types
export interface QuizOption {
    id: string;
    title: string;
    slug?: string;
    category?: string;
    roleTitle?: string;
    role?: { title: string };
}

interface LeaderboardSelectorProps {
    currentSelection: 'xp' | string;
    onSelect: (value: 'xp' | string) => void;
    activeQuizzes: QuizOption[];
    otherQuizzes: QuizOption[];
}

export default function LeaderboardSelector({
    currentSelection,
    onSelect,
    activeQuizzes,
    otherQuizzes
}: LeaderboardSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [visible, setVisible] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Animate open/close
    useEffect(() => {
        if (isOpen) {
            requestAnimationFrame(() => setVisible(true));
        } else {
            setVisible(false);
        }
    }, [isOpen]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                handleClose();
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isOpen]);

    const handleClose = () => {
        setVisible(false);
        setTimeout(() => setIsOpen(false), 300);
    };

    const handleSelect = (val: 'xp' | string) => {
        onSelect(val);
        handleClose();
        setSearch('');
    };

    const getSearchText = (q: QuizOption) => {
        const rTitle = q.roleTitle || q.role?.title || '';
        return (q.title + ' ' + rTitle).toLowerCase();
    }

    const filteredActive = activeQuizzes.filter(q => getSearchText(q).includes(search.toLowerCase()));
    const filteredOther = otherQuizzes.filter(q => getSearchText(q).includes(search.toLowerCase()));

    let currentLabel = "Gold League";
    let icon = (
        <div className="w-8 h-8 rounded-[10px] flex items-center justify-center bg-amber-500/15">
            <Trophy className="w-4 h-4 text-amber-400" />
        </div>
    );

    if (currentSelection !== 'xp') {
        const q = [...activeQuizzes, ...otherQuizzes].find(x => x.id === currentSelection);
        if (q) {
            currentLabel = q.roleTitle || q.role?.title || q.title;
            const { Icon: CatIcon, color: catColor, bg: catBg, bgLight: catBgLight } = getCategoryStyle(q.category || q.title);
            icon = (
                <div className="w-8 h-8 rounded-[10px] flex items-center justify-center cat-icon-bg" style={{ '--cat-bg-light': catBgLight, '--cat-bg-dark': catBg, backgroundColor: catBgLight } as React.CSSProperties}>
                    <CatIcon className="w-4 h-4" style={{ color: catColor }} />
                </div>
            );
        }
    }

    return (
        <div className="relative inline-block" ref={containerRef}>
            {/* Trigger Pill */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-3 px-5 py-3 bg-[var(--card)] rounded-[20px] shadow-[0_4px_12px_rgba(0,0,0,0.1)] 
                           border transition-all duration-300 active:scale-[0.98]
                           ${isOpen
                        ? 'border-[#00B1FF]/50 ring-4 ring-[#00B1FF]/10'
                        : 'border-[var(--card-border)] hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-lg'
                    }`}
            >
                <span className="scale-110">{icon}</span>
                <span className="text-[17px] font-bold text-[var(--foreground)] tracking-tight min-w-[100px] text-center">
                    {currentLabel}
                </span>
                <svg
                    className={`w-4 h-4 text-[var(--foreground)] opacity-40 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#00B1FF] !opacity-100' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Floating Dropdown — smooth CSS transition */}
            {isOpen && (
                <div
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[320px] z-[100] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
                    style={{
                        opacity: visible ? 1 : 0,
                        transform: `translateX(-50%) translateY(${visible ? '0' : '-12px'}) scale(${visible ? 1 : 0.96})`,
                    }}
                >
                    <div
                        className="rounded-[28px] overflow-hidden backdrop-blur-3xl border border-white/10 shadow-2xl"
                        style={{ backgroundColor: '#1C1C1E' }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 pt-5 pb-1">
                            <h2 className="text-[15px] font-bold text-white/60 tracking-wide">Seleziona classifica</h2>
                            <button
                                onClick={handleClose}
                                className="w-7 h-7 rounded-full flex items-center justify-center bg-[#2C2C2E] active:scale-95 transition-transform"
                            >
                                <X className="w-3.5 h-3.5 text-white/50" strokeWidth={2.5} />
                            </button>
                        </div>

                        <div className="w-[calc(100%-40px)] h-[1px] bg-white/[0.05] mx-5 my-2" />

                        {/* Search Bar */}
                        <div className="px-4 pb-2">
                            <input
                                type="text"
                                placeholder="Cerca concorso..."
                                className="w-full px-4 py-2.5 bg-[#2C2C2E] rounded-xl text-sm outline-none 
                                         focus:ring-2 focus:ring-[#00B1FF]/20 transition-all font-medium 
                                         text-white placeholder:text-white/30"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>

                        {/* Options List */}
                        <div className="max-h-[50vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 px-3 pb-4 space-y-1">

                            {/* 1. Global XP */}
                            {search === '' && (
                                <button
                                    onClick={() => handleSelect('xp')}
                                    className={`w-full text-left px-4 py-3.5 rounded-2xl flex items-center gap-3 transition-all active:scale-[0.98] ${currentSelection === 'xp'
                                        ? 'bg-amber-500/10'
                                        : 'active:bg-white/[0.04]'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center ${currentSelection === 'xp' ? 'bg-amber-500/15' : 'bg-[#2C2C2E]'}`}>
                                        <Trophy className={`w-5 h-5 ${currentSelection === 'xp' ? 'text-amber-400' : 'text-white/40'}`} />
                                    </div>
                                    <div className="flex-1">
                                        <div className={`font-bold text-[15px] ${currentSelection === 'xp' ? 'text-amber-400' : 'text-white'}`}>Gold League</div>
                                        <div className="text-[11px] uppercase font-bold tracking-wider text-white/30">Classifica Globale</div>
                                    </div>
                                    {currentSelection === 'xp' && <CheckIcon color="text-amber-500" />}
                                </button>
                            )}
                            {search === '' && <div className="h-px bg-white/[0.06] mx-2" />}

                            {/* 2. My Concorsi */}
                            {filteredActive.length > 0 && (
                                <div>
                                    <div className="px-4 py-2 text-[11px] uppercase font-extrabold text-white/25 tracking-widest leading-none mt-1">
                                        I Tuoi Concorsi ({filteredActive.length})
                                    </div>
                                    {filteredActive.map(q => (
                                        <OptionRow
                                            key={q.id}
                                            quiz={q}
                                            isSelected={currentSelection === q.id}
                                            onClick={() => handleSelect(q.id)}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* 3. Other Concorsi */}
                            <div>
                                {filteredOther.length > 0 && (
                                    <div className="px-4 py-2 text-[11px] uppercase font-extrabold text-white/25 tracking-widest mt-1">
                                        Tutti i Concorsi ({filteredOther.length})
                                    </div>
                                )}
                                {filteredOther.map(q => (
                                    <OptionRow
                                        key={q.id}
                                        quiz={q}
                                        isSelected={currentSelection === q.id}
                                        onClick={() => handleSelect(q.id)}
                                    />
                                ))}
                                {filteredActive.length === 0 && filteredOther.length === 0 && (
                                    <div className="p-4 text-center text-white/30 text-sm">
                                        Nessun concorso trovato.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function OptionRow({ quiz, isSelected, onClick }: { key?: React.Key; quiz: QuizOption, isSelected: boolean, onClick: () => void }) {
    const roleTitle = quiz.roleTitle || quiz.role?.title;

    return (
        <button
            onClick={onClick}
            className={`w-full text-left px-4 py-3 rounded-2xl flex items-center gap-3 transition-all mb-0.5 active:scale-[0.98] ${isSelected
                ? 'bg-[#00B1FF]/10'
                : 'active:bg-white/[0.04]'
                }`}
        >
            {(() => {
                const { Icon: CatIcon, color: catColor, bg: catBg, bgLight: catBgLight } = getCategoryStyle(quiz.category || quiz.title); return (
                    <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center cat-icon-bg`} style={{ '--cat-bg-light': catBgLight, '--cat-bg-dark': isSelected ? catBg : '#2C2C2E', backgroundColor: isSelected ? catBgLight : '#f1f5f9' } as React.CSSProperties}>
                        <CatIcon className="w-5 h-5" style={{ color: isSelected ? catColor : 'rgba(0,0,0,0.3)' }} />
                    </div>
                );
            })()}
            <div className="flex-1 min-w-0">
                <div className={`font-bold text-[14px] truncate ${isSelected ? 'text-[#00B1FF]' : 'text-white'}`}>
                    {roleTitle || quiz.title}
                </div>
                {roleTitle && roleTitle !== quiz.title && (
                    <div className="text-[11px] text-white/25 truncate">
                        {quiz.title}
                    </div>
                )}
            </div>
            {isSelected && <CheckIcon color="text-[#00B1FF]" />}
        </button>
    );
}

function CheckIcon({ color = "text-amber-500" }: { color?: string }) {
    return (
        <svg className={`w-5 h-5 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
    )
}
