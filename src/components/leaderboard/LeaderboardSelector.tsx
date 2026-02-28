import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
        setSearch('');
    };

    const getSearchText = (q: QuizOption) => {
        const rTitle = q.roleTitle || q.role?.title || '';
        return (q.title + ' ' + rTitle).toLowerCase();
    }

    const filteredActive = activeQuizzes.filter(q => getSearchText(q).includes(search.toLowerCase()));
    const filteredOther = otherQuizzes.filter(q => getSearchText(q).includes(search.toLowerCase()));

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
        <div className="relative inline-block" ref={containerRef}>
            {/* Trigger Pill */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileTap={{ scale: 0.96 }}
                className={`flex items-center gap-3 px-5 py-3 bg-white dark:bg-[#1C1C1E] rounded-full shadow-sm
                           transition-all duration-200
                           ${isOpen
                        ? 'ring-2 ring-[#00B1FF]/30'
                        : ''
                    }`}
            >
                <span className="scale-105">{icon}</span>
                <span className="text-[17px] font-bold text-slate-900 dark:text-white tracking-tight min-w-[100px] text-center">
                    {currentLabel}
                </span>
                <motion.svg
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className={`w-4 h-4 ${isOpen ? 'text-[#00B1FF]' : 'text-slate-400 dark:text-white/30'}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </motion.svg>
            </motion.button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.8 }}
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[320px] bg-white dark:bg-[#1C1C1E] rounded-2xl
                                    shadow-2xl overflow-hidden z-[100]"
                    >
                        {/* Search Bar */}
                        <div className="p-3 border-b border-slate-100 dark:border-white/[0.06]">
                            <input
                                type="text"
                                placeholder="Cerca concorso..."
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/[0.04] rounded-xl text-sm outline-none 
                                         focus:ring-2 focus:ring-[#00B1FF]/20 transition-all font-medium 
                                         text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1">

                            {/* 1. Global XP */}
                            {search === '' && (
                                <motion.button
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.03 }}
                                    onClick={() => handleSelect('xp')}
                                    className={`w-full text-left px-4 py-3.5 rounded-2xl flex items-center gap-3 transition-colors ${currentSelection === 'xp'
                                        ? 'bg-amber-500/10'
                                        : 'active:bg-slate-50 dark:active:bg-white/[0.04]'
                                        }`}
                                >
                                    <div className={`w-11 h-11 rounded-[14px] flex items-center justify-center text-lg ${currentSelection === 'xp' ? 'bg-amber-500/15' : 'bg-slate-100 dark:bg-white/[0.04]'}`}>
                                        🏆
                                    </div>
                                    <div className="flex-1">
                                        <div className={`font-bold text-[15px] ${currentSelection === 'xp' ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>Gold League</div>
                                        <div className="text-[11px] uppercase font-bold tracking-widest text-slate-400 dark:text-white/30">Classifica Globale</div>
                                    </div>
                                    {currentSelection === 'xp' && <CheckIcon color="text-amber-500" />}
                                </motion.button>
                            )}

                            {search === '' && <div className="h-px bg-slate-100 dark:bg-white/[0.06] mx-3" />}

                            {/* 2. My Concorsi */}
                            {filteredActive.length > 0 && (
                                <div>
                                    <div className="px-4 py-2 text-[10px] uppercase font-bold text-slate-400 dark:text-white/25 tracking-widest mt-1">
                                        I Tuoi Concorsi ({filteredActive.length})
                                    </div>
                                    {filteredActive.map((q, i) => (
                                        <OptionRow
                                            key={q.id}
                                            quiz={q}
                                            isSelected={currentSelection === q.id}
                                            onClick={() => handleSelect(q.id)}
                                            index={i}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* 3. Other Concorsi */}
                            <div>
                                {filteredOther.length > 0 && (
                                    <div className="px-4 py-2 text-[10px] uppercase font-bold text-slate-400 dark:text-white/25 tracking-widest mt-1">
                                        Tutti i Concorsi ({filteredOther.length})
                                    </div>
                                )}
                                {filteredOther.map((q, i) => (
                                    <OptionRow
                                        key={q.id}
                                        quiz={q}
                                        isSelected={currentSelection === q.id}
                                        onClick={() => handleSelect(q.id)}
                                        index={i + filteredActive.length}
                                    />
                                ))}
                                {filteredActive.length === 0 && filteredOther.length === 0 && (
                                    <div className="p-4 text-center text-slate-400 dark:text-white/30 text-sm">
                                        Nessun concorso trovato.
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function OptionRow({ quiz, isSelected, onClick, index = 0 }: { key?: React.Key; quiz: QuizOption, isSelected: boolean, onClick: () => void, index?: number }) {
    const roleTitle = quiz.roleTitle || quiz.role?.title;

    return (
        <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.04 + index * 0.03 }}
            onClick={onClick}
            className={`w-full text-left px-4 py-3 rounded-2xl flex items-center gap-3 transition-colors mb-0.5 ${isSelected
                ? 'bg-[#00B1FF]/10'
                : 'active:bg-slate-50 dark:active:bg-white/[0.04]'
                }`}
        >
            <div className={`w-11 h-11 rounded-[14px] flex items-center justify-center text-xs font-black ${isSelected ? 'bg-[#00B1FF]/15 text-[#00B1FF]' : 'bg-slate-100 dark:bg-white/[0.04] text-slate-400 dark:text-white/30'}`}>
                {(roleTitle || quiz.title).substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
                <div className={`font-bold text-[14px] truncate ${isSelected ? 'text-[#00B1FF]' : 'text-slate-900 dark:text-white'}`}>
                    {roleTitle || quiz.title}
                </div>
                {roleTitle && roleTitle !== quiz.title && (
                    <div className="text-[11px] text-slate-400 dark:text-white/25 truncate">
                        {quiz.title}
                    </div>
                )}
            </div>
            {isSelected && <CheckIcon color="text-[#00B1FF]" />}
        </motion.button>
    );
}

function CheckIcon({ color = "text-amber-500" }: { color?: string }) {
    return (
        <motion.svg
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
            className={`w-5 h-5 ${color}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </motion.svg>
    )
}
