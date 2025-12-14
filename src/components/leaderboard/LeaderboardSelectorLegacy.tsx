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

export default function LeaderboardSelectorLegacy({
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
    let icon = <span className="text-brand-orange text-2xl">🏆</span>;

    if (currentSelection !== 'xp') {
        const q = [...activeQuizzes, ...otherQuizzes].find(x => x.id === currentSelection);
        if (q) {
            currentLabel = q.title;
            icon = <span className="text-brand-cyan text-2xl">📊</span>;
        }
    }

    return (
        <div className="relative inline-block" ref={containerRef}>
            {/* Trigger */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-6 py-3 bg-white rounded-pill shadow-soft hover:shadow-card hover:scale-[1.02] transition-all duration-300 border border-transparent hover:border-canvas-light"
            >
                {/* Dynamic Icon */}
                {icon}

                <span className="text-xl font-black text-text-primary tracking-tight">{currentLabel}</span>

                <svg
                    className={`w-5 h-5 text-text-tertiary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-80 bg-white rounded-card shadow-soft border border-transparent overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200">
                    <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">

                        {/* 1. Global XP */}
                        <div className="p-2 border-b border-canvas-light">
                            <button
                                onClick={() => handleSelect('xp')}
                                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${currentSelection === 'xp'
                                    ? 'bg-brand-orange/10 text-brand-orange'
                                    : 'hover:bg-canvas-light text-text-secondary hover:text-text-primary'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-squircle flex items-center justify-center text-lg ${currentSelection === 'xp' ? 'bg-brand-orange text-white' : 'bg-canvas-light text-text-tertiary'}`}>
                                    🏆
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-sm">Gold League</div>
                                    <div className="text-[10px] uppercase font-bold tracking-wider opacity-70">Classifica Globale XP</div>
                                </div>
                                {currentSelection === 'xp' && <CheckIcon color="text-brand-orange" />}
                            </button>
                        </div>

                        {/* 2. My Concorsi */}
                        {activeQuizzes.length > 0 && (
                            <div className="p-2 border-b border-canvas-light">
                                <div className="px-3 py-2 text-[10px] uppercase font-bold text-text-tertiary tracking-widest">I Tuoi Concorsi</div>
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
                            <div className="px-3 py-2 text-[10px] uppercase font-bold text-text-tertiary tracking-widest">
                                Tutti i Concorsi ({otherQuizzes.length})
                            </div>
                            {otherQuizzes.length === 0 && <div className="px-4 py-2 text-xs text-text-tertiary font-medium">Nessun altro concorso</div>}
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
                ? 'bg-brand-cyan/10 text-brand-cyan'
                : 'hover:bg-canvas-light text-text-secondary hover:text-text-primary'
                }`}
        >
            <div className={`w-10 h-10 rounded-squircle flex items-center justify-center text-xs font-black ${isSelected ? 'bg-brand-cyan text-white' : 'bg-canvas-light text-text-tertiary'}`}>
                {quiz.title.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate">{quiz.title}</div>
            </div>
            {isSelected && <CheckIcon color="text-brand-cyan" />}
        </button>
    );
}

function CheckIcon({ color = "text-brand-orange" }: { color?: string }) {
    return (
        <svg className={`w-5 h-5 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
    )
}
