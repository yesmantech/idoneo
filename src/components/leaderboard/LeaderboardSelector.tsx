import React, { useState, useRef, useEffect } from 'react';

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
    const [search, setSearch] = useState('');
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
        setSearch(''); // Reset search
    };

    // Helper to get efficient search text
    const getSearchText = (q: QuizOption) => {
        const rTitle = q.roleTitle || q.role?.title || '';
        return (q.title + ' ' + rTitle).toLowerCase();
    }

    // Filter Logic
    const filteredActive = activeQuizzes.filter(q => getSearchText(q).includes(search.toLowerCase()));
    const filteredOther = otherQuizzes.filter(q => getSearchText(q).includes(search.toLowerCase()));

    // Determine Label
    let currentLabel = "Gold League";
    let icon = <span className="text-brand-orange text-2xl">🏆</span>;

    if (currentSelection !== 'xp') {
        const q = [...activeQuizzes, ...otherQuizzes].find(x => x.id === currentSelection);
        if (q) {
            currentLabel = q.roleTitle || q.role?.title || q.title; // Prefer Role Title for label if available
            icon = <span className="text-brand-cyan text-2xl">📊</span>;
        }
    }

    return (

        <div className="relative inline-block" ref={containerRef}>
            {/* Trigger Pill */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-3 px-5 py-3 bg-white rounded-[20px] shadow-[0_4px_12px_rgba(0,0,0,0.05)] 
                           border transition-all duration-300 active:scale-[0.98]
                           ${isOpen
                        ? 'border-[#00B1FF]/30 ring-4 ring-[#00B1FF]/10'
                        : 'border-slate-100 hover:border-slate-200 hover:shadow-[0_6px_16px_rgba(0,0,0,0.08)]'
                    }`}
            >
                {/* Dynamic Icon */}
                <span className="scale-110">{icon}</span>

                <span className="text-[17px] font-bold text-slate-800 tracking-tight min-w-[100px] text-center">
                    {currentLabel}
                </span>

                <svg
                    className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#00B1FF]' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Floating Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[320px] bg-white rounded-[24px] 
                                shadow-xl border border-slate-100 overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200">

                    {/* Search Bar */}
                    <div className="p-3 border-b border-slate-50">
                        <input
                            type="text"
                            placeholder="Cerca concorso..."
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#00B1FF]/20 transition-all font-medium text-slate-700 placeholder:text-slate-400"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 p-2 space-y-2">

                        {/* 1. Global XP */}
                        {search === '' && (
                            <div>
                                <button
                                    onClick={() => handleSelect('xp')}
                                    className={`w-full text-left px-4 py-3.5 rounded-[16px] flex items-center gap-3 transition-all ${currentSelection === 'xp'
                                        ? 'bg-amber-50 text-amber-600 shadow-sm'
                                        : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm border border-black/5 ${currentSelection === 'xp' ? 'bg-amber-100 text-amber-600' : 'bg-white text-slate-400'}`}>
                                        🏆
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-[15px]">Gold League</div>
                                        <div className="text-[11px] uppercase font-bold tracking-wider opacity-60">Classifica Globale</div>
                                    </div>
                                    {currentSelection === 'xp' && <CheckIcon color="text-amber-500" />}
                                </button>
                            </div>
                        )}
                        {search === '' && <div className="h-px bg-slate-100 mx-2" />}

                        {/* 2. My Concorsi */}
                        {filteredActive.length > 0 && (
                            <div>
                                <div className="px-4 py-2 text-[11px] uppercase font-extrabold text-slate-400 tracking-widest">
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
                                <div className="px-4 py-2 text-[11px] uppercase font-extrabold text-slate-400 tracking-widest mt-2">
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
                                <div className="p-4 text-center text-slate-400 text-sm">
                                    Nessun concorso trovato.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}

function OptionRow({ quiz, isSelected, onClick }: { key?: React.Key; quiz: QuizOption, isSelected: boolean, onClick: () => void }) {
    const roleTitle = quiz.roleTitle || quiz.role?.title;

    return (
        <button
            onClick={onClick}
            className={`w-full text-left px-4 py-3 rounded-[16px] flex items-center gap-3 transition-all mb-1 ${isSelected
                ? 'bg-cyan-50 text-cyan-600 shadow-sm'
                : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
        >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black border border-black/5 shadow-sm ${isSelected ? 'bg-cyan-100 text-cyan-600' : 'bg-white text-slate-400'}`}>
                {/* Use Role initial if available, else Title */}
                {(roleTitle || quiz.title).substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
                <div className="font-bold text-[14px] truncate">
                    {/* Show Role Title as main text - User wants "Concorsi" list */}
                    {roleTitle || quiz.title}
                </div>
                {/* Only show subtitle if it's different and relevant, otherwise keep it clean */}
                {roleTitle && roleTitle !== quiz.title && (
                    <div className="text-[11px] text-slate-400 truncate">
                        {quiz.title}
                    </div>
                )}
            </div>
            {isSelected && <CheckIcon color="text-cyan-500" />}
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
