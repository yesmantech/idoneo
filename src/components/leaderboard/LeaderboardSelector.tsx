import React, { useState, useRef, useEffect } from 'react';

// Types
export interface QuizOption {
    id: string;
    title: string;
    slug?: string;
    category?: string;
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
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (val: 'xp' | string) => {
        onSelect(val);
        setIsOpen(false);
    };

    // Determine Label
    let currentLabel = "Gold League";
    if (currentSelection !== 'xp') {
        const q = [...activeQuizzes, ...otherQuizzes].find(x => x.id === currentSelection);
        if (q) currentLabel = q.title;
    }

    return (
        <div className="relative inline-block" ref={containerRef}>
            {/* Trigger */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-2xl font-bold hover:opacity-80 transition-opacity text-slate-900 dark:text-white"
            >
                {/* Dynamic Icon based on selection */}
                {currentSelection === 'xp' ? (
                    <span className="text-amber-500">🏆</span>
                ) : (
                    <span className="text-emerald-500">📊</span>
                )}

                <span>{currentLabel}</span>

                <svg
                    className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="max-h-[80vh] overflow-y-auto scrollbar-thin">

                        {/* 1. Global XP */}
                        <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                            <button
                                onClick={() => handleSelect('xp')}
                                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${currentSelection === 'xp'
                                    ? 'bg-amber-50 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200'
                                    }`}
                            >
                                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 text-sm">🏆</div>
                                <div>
                                    <div className="font-bold text-sm">Gold League</div>
                                    <div className="text-xs opacity-70">Classifica Globale XP</div>
                                </div>
                                {currentSelection === 'xp' && <CheckIcon />}
                            </button>
                        </div>

                        {/* 2. My Concorsi */}
                        {activeQuizzes.length > 0 && (
                            <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                                <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">I Tuoi Concorsi</div>
                                {activeQuizzes.map(q => (
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
                        <div className="p-2">
                            <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tutti i Concorsi</div>
                            {otherQuizzes.length === 0 && <div className="px-4 py-2 text-xs text-slate-400">Nessun altro concorso</div>}
                            {otherQuizzes.map(q => (
                                <OptionRow
                                    key={q.id}
                                    quiz={q}
                                    isSelected={currentSelection === q.id}
                                    onClick={() => handleSelect(q.id)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function OptionRow({ quiz, isSelected, onClick }: { key?: React.Key; quiz: QuizOption, isSelected: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`w-full text-left px-4 py-2.5 rounded-xl flex items-center gap-3 transition-colors mb-1 ${isSelected
                ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200'
                : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200'
                }`}
        >
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500">
                {quiz.title.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate">{quiz.title}</div>
            </div>
            {isSelected && <CheckIcon color="text-emerald-600" />}
        </button>
    );
}

function CheckIcon({ color = "text-amber-600" }: { color?: string }) {
    return (
        <svg className={`w-5 h-5 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
    )
}
