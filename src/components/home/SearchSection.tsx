import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, ChevronRight, Command, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SearchItem } from "@/lib/data";
import { hapticLight, hapticSelection } from "@/lib/haptics";
import { cn } from "@/lib/utils";

interface SearchSectionProps {
    items?: SearchItem[];
}

export default function SearchSection({ items = [] }: SearchSectionProps) {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<SearchItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const inputRef = useRef<HTMLInputElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Filter states
    const [showFilters, setShowFilters] = useState(false);
    const [activeType, setActiveType] = useState<'all' | 'contest' | 'category'>('all');
    const [activeEntity, setActiveEntity] = useState<string | null>(null);

    const entities = [
        "Polizia", "Carabinieri", "Esercito", "Marina", "Aeronautica",
        "Finanza", "Vigili del Fuoco", "Penitenziaria"
    ];

    // Filter logic
    useEffect(() => {
        let results = items;

        // 1. Filter by Entity
        if (activeEntity) {
            results = results.filter(item =>
                item.title.toLowerCase().includes(activeEntity.toLowerCase()) ||
                (item.type === 'category' && item.title.toLowerCase().includes(activeEntity.toLowerCase()))
            );
        }

        // 2. Filter by Type
        if (activeType !== 'all') {
            results = results.filter(item => item.type === activeType);
        }

        // 3. Filter by Query
        if (query.trim().length > 0) {
            const lower = query.toLowerCase().trim();
            results = results.filter(c =>
                c.title.toLowerCase().includes(lower) ||
                (c.type === 'category' && lower.includes('concorso'))
            );
        }

        setSuggestions(results.slice(0, 8));
        setSelectedIndex(0);
    }, [query, items, activeType, activeEntity]);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % Math.max(suggestions.length, 1));
            hapticSelection();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + Math.max(suggestions.length, 1)) % Math.max(suggestions.length, 1));
            hapticSelection();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (suggestions[selectedIndex]) {
                handleSelect(suggestions[selectedIndex].url);
            } else if (query.trim()) {
                handleSearch(e as any);
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Allow search if we have filters active, even without text
        if (!query.trim() && !activeEntity && activeType === 'all') return;

        const match = items.find(c => c.title.toLowerCase().includes(query.toLowerCase().trim()));
        if (match && query.length > 2) handleSelect(match.url);
        else handleSelect(`/concorsi/tutti?search=${encodeURIComponent(query)}`);
    };

    const handleSelect = (url: string) => {
        hapticLight();
        setIsOpen(false);
        navigate(url);
    };

    // Prevent body scroll when open & Reset state on close
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            inputRef.current?.focus();
        } else {
            document.body.style.overflow = '';
            setQuery('');
            setActiveType('all');
            setActiveEntity(null);
            setShowFilters(false);
        }
    }, [isOpen]);

    return (
        <div className="w-full" ref={wrapperRef}>
            {/* Initial Input (Triggers Modal) */}
            <div
                onClick={() => { setIsOpen(true); hapticLight(); }}
                className="relative cursor-text group"
            >
                <div className="absolute inset-y-0 left-0 pl-5 lg:pl-6 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 lg:w-6 lg:h-6 text-slate-400 group-hover:text-[#00B1FF] transition-colors" />
                </div>
                <div className="w-full h-[52px] lg:h-[60px] pl-14 lg:pl-16 pr-5 bg-[var(--card)] 
                               text-[15px] lg:text-base font-medium text-[var(--foreground)] opacity-50 flex items-center
                               shadow-soft border border-[var(--card-border)] rounded-[26px] lg:rounded-[30px]
                               group-hover:border-[#00B1FF]/30 transition-all">
                    Cerca concorso...
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[10px] font-bold text-[var(--foreground)] opacity-50 uppercase tracking-tight">
                    <Command className="w-2.5 h-2.5" /> K
                </div>
            </div>

            {/* Spotlight Modal */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[10vh] px-4">
                        {/* Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-md"
                        />

                        {/* Search Window */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-[var(--card)] rounded-[32px] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.18)] border border-[var(--card-border)] overflow-hidden flex flex-col max-h-[85vh]"
                            onKeyDown={handleKeyDown}
                        >
                            {/* Input Area */}
                            <div className="relative border-b border-slate-100 dark:border-slate-700 shrink-0 z-20 bg-[var(--card)]">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-[#00B1FF]" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Scrivi il nome del concorso..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="w-full h-[72px] pl-16 pr-24 bg-transparent text-[19px] font-bold text-[var(--foreground)] placeholder:text-[var(--foreground)] placeholder:opacity-30 focus:outline-none"
                                />

                                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                    {/* Filter Toggle */}
                                    <button
                                        onClick={() => { setShowFilters(!showFilters); hapticLight(); }}
                                        className={cn(
                                            "p-2.5 rounded-xl transition-all duration-200 border",
                                            showFilters || activeEntity || activeType !== 'all'
                                                ? "bg-[#00B1FF] border-[#00B1FF] text-white shadow-lg shadow-blue-500/20"
                                                : "bg-slate-100 dark:bg-slate-800 border-transparent text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                                        )}
                                    >
                                        <SlidersHorizontal className="w-5 h-5" />
                                    </button>

                                    {/* Close */}
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-[var(--foreground)] opacity-50 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            {/* Filters Panel */}
                            <AnimatePresence>
                                {showFilters && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20 overflow-hidden shrink-0"
                                    >
                                        <div className="p-4 space-y-4">
                                            {/* Type Filters */}
                                            <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl w-fit">
                                                {(['all', 'contest', 'category'] as const).map((type) => (
                                                    <button
                                                        key={type}
                                                        onClick={() => { setActiveType(type); hapticSelection(); }}
                                                        className={cn(
                                                            "px-4 py-1.5 rounded-lg text-[13px] font-bold transition-all capitalize",
                                                            activeType === type
                                                                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                                                                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                                        )}
                                                    >
                                                        {type === 'all' ? 'Tutti' : type === 'contest' ? 'Concorsi' : 'Categorie'}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Entity Filters */}
                                            <div>
                                                <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 px-1">
                                                    Filtra per Corpo
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {entities.map(entity => (
                                                        <button
                                                            key={entity}
                                                            onClick={() => {
                                                                setActiveEntity(activeEntity === entity ? null : entity);
                                                                hapticSelection();
                                                            }}
                                                            className={cn(
                                                                "px-3 py-1.5 rounded-xl border text-[13px] font-medium transition-all",
                                                                activeEntity === entity
                                                                    ? "bg-[#00B1FF]/10 border-[#00B1FF] text-[#00B1FF]"
                                                                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                                                            )}
                                                        >
                                                            {entity}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Results Area */}
                            <div className="overflow-y-auto scrollbar-hide py-3 min-h-[100px] flex-1">
                                {suggestions.length > 0 ? (
                                    <div className="px-3 space-y-1">
                                        <div className="px-5 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] flex justify-between">
                                            <span>Risultati</span>
                                            <span className="opacity-50">{suggestions.length} trovati</span>
                                        </div>
                                        {suggestions.map((item, idx) => (
                                            <button
                                                key={item.id}
                                                onClick={() => handleSelect(item.url)}
                                                onMouseEnter={() => {
                                                    if (window.matchMedia("(hover: hover)").matches) {
                                                        setSelectedIndex(idx);
                                                    }
                                                }}
                                                className={cn(
                                                    "w-full text-left px-5 py-4 rounded-[20px] flex items-center gap-4 transition-all duration-200 group relative",
                                                    selectedIndex === idx ? "bg-[#00B1FF]/5 lg:translate-x-1" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors border",
                                                    selectedIndex === idx ? "bg-white dark:bg-slate-800 border-[#00B1FF]/20 text-[#00B1FF] shadow-sm" : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400"
                                                )}>
                                                    <span className="text-[14px] font-black">
                                                        {item.title.substring(0, 2).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className={cn(
                                                        "text-[16px] font-bold truncate transition-colors",
                                                        selectedIndex === idx ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"
                                                    )}>
                                                        {item.title}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
                                                            {item.type === 'category' ? 'Categoria' : 'Concorso'}
                                                        </span>
                                                        {selectedIndex === idx && (
                                                            <span className="hidden lg:inline text-[10px] text-[#00B1FF] font-bold animate-pulse">
                                                                Premi Invio per navigare
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <ChevronRight className={cn(
                                                    "w-5 h-5 text-[#00B1FF] lg:opacity-0 lg:group-hover:opacity-100 transition-all",
                                                    selectedIndex === idx ? "lg:opacity-100 lg:translate-x-1" : ""
                                                )} />
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="px-8 py-10 text-center h-full flex flex-col items-center justify-center">
                                        {query.trim() === '' && !activeEntity && activeType === 'all' ? (
                                            <>
                                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-700">
                                                    <Search className="w-8 h-8 text-slate-300 dark:text-slate-500" />
                                                </div>
                                                <p className="text-[var(--foreground)] opacity-60 font-medium">Cosa stai cercando oggi?</p>
                                                <p className="text-[var(--foreground)] opacity-40 text-xs mt-1">Usa i filtri per affinare la ricerca</p>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-rose-100 dark:border-rose-900/30">
                                                    <Search className="w-8 h-8 text-rose-300 dark:text-rose-400" />
                                                </div>
                                                <p className="text-slate-500 dark:text-slate-400 font-medium">Nessun risultato trovato</p>
                                                <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Prova a cambiare i filtri</p>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Footer - Absolutely hidden on mobile/tablet */}
                            <div className="hidden lg:flex px-6 py-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 items-center justify-between text-[11px] font-bold text-[var(--foreground)] opacity-50 shrink-0">
                                <div className="flex gap-4">
                                    <span className="flex items-center gap-1.5 pointer-events-none">
                                        <kbd className="px-1.5 py-0.5 bg-[var(--card)] border border-[var(--card-border)] rounded-md shadow-sm">Enter</kbd> seleziona
                                    </span>
                                    <span className="flex items-center gap-1.5 pointer-events-none">
                                        <kbd className="px-1.5 py-0.5 bg-[var(--card)] border border-[var(--card-border)] rounded-md shadow-sm">↑↓</kbd> naviga
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <kbd className="px-1.5 py-0.5 bg-[var(--card)] border border-[var(--card-border)] rounded-md shadow-sm">ESC</kbd> chiudi
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
