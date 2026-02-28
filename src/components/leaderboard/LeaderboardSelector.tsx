import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

// Types
export interface QuizOption {
    id: string;
    title: string;
    slug?: string;
    category?: string;
    roleTitle?: string;
    role?: { title: string }; // Handle nested form from activeQuizzes
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

    // Animate open
    useEffect(() => {
        if (isOpen) {
            requestAnimationFrame(() => setVisible(true));
        } else {
            setVisible(false);
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

    // Determine Label
    let currentLabel = "Gold League";
    let icon = <span className="text-2xl">🏆</span>;

    if (currentSelection !== 'xp') {
        const q = [...activeQuizzes, ...otherQuizzes].find(x => x.id === currentSelection);
        if (q) {
            currentLabel = q.roleTitle || q.role?.title || q.title;
            icon = <span className="text-2xl">📊</span>;
        }
    }

    return (
        <>
            {/* Trigger Pill */}
            <button
                onClick={() => setIsOpen(true)}
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

            {/* Bottom Sheet Modal — Same animation as ThemeSelectorModal */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-8">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 transition-colors duration-300"
                        style={{ backgroundColor: visible ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0)' }}
                        onClick={handleClose}
                    />

                    {/* Floating Bottom Sheet */}
                    <div
                        className="relative w-full max-w-[400px] transition-transform duration-400 ease-[cubic-bezier(0.32,0.72,0,1)]"
                        style={{
                            transform: visible ? 'translateY(0) scale(1)' : 'translateY(120%) scale(0.95)',
                        }}
                    >
                        <div
                            className="rounded-[32px] overflow-hidden backdrop-blur-3xl border border-white/10 shadow-2xl"
                            style={{ backgroundColor: '#1C1C1E' }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 pt-6 pb-2">
                                <h2 className="text-[17px] font-bold text-white tracking-wide">Classifica</h2>
                                <button
                                    onClick={handleClose}
                                    className="w-8 h-8 rounded-full flex items-center justify-center bg-[#2C2C2E] active:scale-95 transition-transform"
                                >
                                    <X className="w-4 h-4 text-white/60" strokeWidth={2.5} />
                                </button>
                            </div>

                            <div className="w-[calc(100%-48px)] h-[1px] bg-white/[0.05] mx-6 my-2" />

                            {/* Search Bar */}
                            <div className="px-6 pb-3">
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
                            <div className="max-h-[50vh] overflow-y-auto px-4 pb-6 space-y-1">

                                {/* 1. Global XP */}
                                {search === '' && (
                                    <button
                                        onClick={() => handleSelect('xp')}
                                        className={`w-full text-left px-4 py-3.5 rounded-2xl flex items-center gap-3 transition-all active:scale-[0.98] ${currentSelection === 'xp'
                                            ? 'bg-amber-500/10'
                                            : 'active:bg-white/[0.04]'
                                            }`}
                                    >
                                        <div className={`w-11 h-11 rounded-[14px] flex items-center justify-center text-lg ${currentSelection === 'xp' ? 'bg-amber-500/15' : 'bg-[#2C2C2E]'}`}>
                                            🏆
                                        </div>
                                        <div className="flex-1">
                                            <div className={`font-bold text-[15px] ${currentSelection === 'xp' ? 'text-amber-400' : 'text-white'}`}>Gold League</div>
                                            <div className="text-[11px] uppercase font-bold tracking-widest text-white/30">Classifica Globale</div>
                                        </div>
                                        {currentSelection === 'xp' && <CheckIcon color="text-amber-500" />}
                                    </button>
                                )}
                                {search === '' && <div className="h-px bg-white/[0.06] mx-2" />}

                                {/* 2. My Concorsi */}
                                {filteredActive.length > 0 && (
                                    <div>
                                        <div className="px-4 py-2 text-[10px] uppercase font-bold text-white/25 tracking-widest mt-1">
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
                                        <div className="px-4 py-2 text-[10px] uppercase font-bold text-white/25 tracking-widest mt-1">
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
                </div>
            )}
        </>
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
            <div className={`w-11 h-11 rounded-[14px] flex items-center justify-center text-xs font-black ${isSelected ? 'bg-[#00B1FF]/15 text-[#00B1FF]' : 'bg-[#2C2C2E] text-white/40'}`}>
                {(roleTitle || quiz.title).substring(0, 2).toUpperCase()}
            </div>
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
