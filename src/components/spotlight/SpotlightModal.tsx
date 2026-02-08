/**
 * @file SpotlightModal.tsx
 * @description Global command palette and search interface ("Spotlight").
 *
 * Accessibility-first modal that allows users to search the entire app
 * or perform quick actions. Triggered globally via ⌘K / Ctrl+K.
 *
 * ## Search Capabilities
 *
 * Uses `fuse.js` for fuzzy searching across:
 * - Categories (e.g. "Polizia")
 * - Roles (e.g. "Commissario")
 * - Quizzes (e.g. "2024 Official")
 * - Features (via Quick Actions)
 *
 * ## Navigation
 *
 * - `↑` / `↓` keys to navigate results
 * - `Enter` to select
 * - `Esc` to close
 *
 * ## Data Sources
 *
 * 1. **Results**: `SearchItem` array from `getAllSearchableItems()`
 * 2. **Recently Viewed**: Persisted in `SpotlightContext`
 * 3. **Active Quizzes**: Recent unfinished attempts for quick resume
 * 4. **Quick Actions**: Hardcoded shortcuts (Home, Profile, etc.)
 */

"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    X,
    ChevronRight,
    Command,
    Home,
    User,
    Trophy,
    Settings,
    BookOpen,
    Clock,
    Zap,
    TrendingUp,
    ArrowRight,
    Sparkles,
    Shield,
    MapPin,
    Briefcase,
    Activity
} from 'lucide-react';
import Fuse from 'fuse.js';
import { useSpotlight } from '@/context/SpotlightContext';
import { SearchItem } from '@/lib/data';
import { leaderboardService } from '@/lib/leaderboardService';
import { supabase } from '@/lib/supabaseClient';
import { hapticLight, hapticSelection } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { analytics } from '@/lib/analytics';

// ============================================================================
// TYPES & CONFIG
// ============================================================================

interface SpotlightModalProps {
    items?: SearchItem[];
}

interface QuickAction {
    id: string;
    icon: React.ReactNode;
    label: string;
    description: string;
    url: string;
    color: string;
}

interface ActiveQuiz {
    id: string;
    title: string;
    slug?: string;
    accuracy: number;
    lastPlayed?: string;
    role?: { title: string };
}

const QUICK_ACTIONS: QuickAction[] = [
    {
        id: 'home',
        icon: <Home className="w-5 h-5" />,
        label: 'Home',
        description: 'Torna alla homepage',
        url: '/',
        color: 'from-blue-500 to-cyan-500'
    },
    {
        id: 'profile',
        icon: <User className="w-5 h-5" />,
        label: 'Profilo',
        description: 'Visualizza il tuo profilo',
        url: '/profile',
        color: 'from-violet-500 to-purple-500'
    },
    {
        id: 'leaderboard',
        icon: <Trophy className="w-5 h-5" />,
        label: 'Classifica XP',
        description: 'Classifica globale',
        url: '/leaderboard',
        color: 'from-amber-500 to-orange-500'
    },
    {
        id: 'concorsi',
        icon: <BookOpen className="w-5 h-5" />,
        label: 'Tutti i Concorsi',
        description: 'Esplora tutti i concorsi',
        url: '/concorsi/tutti',
        color: 'from-emerald-500 to-green-500'
    },
    {
        id: 'settings',
        icon: <Settings className="w-5 h-5" />,
        label: 'Impostazioni',
        description: 'Gestisci il tuo account',
        url: '/profile/settings',
        color: 'from-slate-500 to-gray-500'
    }
];

// Fuse.js options for fuzzy search
const FUSE_OPTIONS = {
    keys: ['title'],
    threshold: 0.4,
    distance: 100,
    includeScore: true
};

export default function SpotlightModal({ items: propItems = [] }: SpotlightModalProps) {
    const navigate = useNavigate();
    const { isOpen, close, recentSearches, addRecentSearch } = useSpotlight();

    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [activeQuizzes, setActiveQuizzes] = useState<ActiveQuiz[]>([]);
    const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(false);
    const [activeSection, setActiveSection] = useState<'search' | 'actions' | 'recent' | 'continue'>('search');
    const [searchItems, setSearchItems] = useState<SearchItem[]>(propItems);

    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Fetch search items when modal opens (with caching)
    useEffect(() => {
        if (!isOpen) return;
        if (searchItems.length > 0) return; // Already loaded

        const loadSearchItems = async () => {
            try {
                // Import dynamically to avoid circular deps
                const { getAllSearchableItems } = await import('@/lib/data');
                const items = await getAllSearchableItems();
                setSearchItems(items);
            } catch (e) {
                console.warn('Failed to load search items:', e);
            }
        };

        loadSearchItems();
    }, [isOpen, searchItems.length]);

    // Initialize Fuse for fuzzy search (use loaded items)
    const fuse = useMemo(() => new Fuse(searchItems, FUSE_OPTIONS), [searchItems]);

    // Fuzzy search results
    const searchResults = useMemo(() => {
        if (!query.trim()) return [];
        return fuse.search(query).slice(0, 8).map(result => result.item);
    }, [query, fuse]);

    // Combined results for navigation
    const allNavigableItems = useMemo(() => {
        if (query.trim()) {
            return searchResults.map(item => ({
                type: 'search' as const,
                data: item
            }));
        }

        const items: Array<{
            type: 'continue' | 'recent' | 'action';
            data: ActiveQuiz | string | QuickAction;
        }> = [];

        // Active quizzes
        activeQuizzes.slice(0, 3).forEach(quiz => {
            items.push({ type: 'continue', data: quiz });
        });

        // Recent searches
        recentSearches.slice(0, 3).forEach(search => {
            items.push({ type: 'recent', data: search });
        });

        // Quick actions
        QUICK_ACTIONS.forEach(action => {
            items.push({ type: 'action', data: action });
        });

        return items;
    }, [query, searchResults, activeQuizzes, recentSearches]);

    // Load active quizzes when modal opens
    useEffect(() => {
        if (!isOpen) return;

        const loadActiveQuizzes = async () => {
            setIsLoadingQuizzes(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const quizzes = await leaderboardService.getUserActiveQuizzes(user.id);
                    setActiveQuizzes(quizzes.slice(0, 5));
                }
            } catch (e) {
                console.warn('Failed to load active quizzes:', e);
            } finally {
                setIsLoadingQuizzes(false);
            }
        };

        loadActiveQuizzes();
    }, [isOpen]);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }, [isOpen]);

    // Keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        const maxIndex = allNavigableItems.length - 1;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, maxIndex));
            hapticSelection();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
            hapticSelection();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const selected = allNavigableItems[selectedIndex];
            if (selected) {
                handleSelectItem(selected);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            close();
        }
    }, [allNavigableItems, selectedIndex, close]);

    // Scroll selected item into view
    useEffect(() => {
        const selected = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
        selected?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, [selectedIndex]);

    const handleSelectItem = (item: typeof allNavigableItems[0]) => {
        hapticLight();

        switch (item.type) {
            case 'search':
                const searchItem = item.data as SearchItem;
                analytics.track('search_result_selected', {
                    item_title: searchItem.title,
                    item_type: searchItem.type,
                    query: query
                });
                addRecentSearch(searchItem.title);
                close();
                navigate(searchItem.url);
                break;
            case 'continue':
                const quiz = item.data as ActiveQuiz;
                close();
                navigate(`/quiz/${quiz.slug || quiz.id}`);
                break;
            case 'recent':
                setQuery(item.data as string);
                break;
            case 'action':
                const action = item.data as QuickAction;
                close();
                navigate(action.url);
                break;
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchResults[0]) {
            analytics.track('search_used', {
                query: query,
                results_count: searchResults.length,
                context: 'spotlight_keyboard_enter'
            });
            addRecentSearch(query);
            close();
            navigate(searchResults[0].url);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'category': return '📁';
            case 'role': return '👤';
            case 'contest': return '📝';
            default: return '📄';
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'category': return 'Categoria';
            case 'role': return 'Profilo';
            case 'contest': return 'Concorso';
            default: return type;
        }
    };

    if (!isOpen) return null;

    let currentIndex = 0;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[8vh] sm:pt-[12vh] px-4">
                {/* Backdrop with blur */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    onClick={close}
                    className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl"
                />

                {/* Spotlight Window */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                    className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[28px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] border border-slate-200/50 dark:border-slate-700/50 overflow-hidden flex flex-col max-h-[70vh]"
                    onKeyDown={handleKeyDown}
                >
                    {/* Decorative gradient border */}
                    <div className="absolute inset-0 rounded-[28px] p-[1px] bg-gradient-to-br from-[#00B1FF]/20 via-transparent to-[#00B1FF]/10 pointer-events-none" />

                    {/* Search Input */}
                    <form onSubmit={handleSearch} className="relative shrink-0">
                        <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                            <div className="relative">
                                <Search className="w-6 h-6 text-[#00B1FF]" />
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute inset-0 bg-[#00B1FF]/20 rounded-full blur-md"
                                />
                            </div>
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Cerca concorsi, profili, azioni..."
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setSelectedIndex(0);
                                }}
                                className="flex-1 bg-transparent text-lg font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                            />
                            <div className="flex items-center gap-2">
                                {/* Keyboard hint */}
                                <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                    <kbd className="text-[10px] font-bold text-slate-500 dark:text-slate-400">ESC</kbd>
                                </div>
                                <button
                                    type="button"
                                    onClick={close}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                                >
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>
                        </div>
                    </form>

                    {/* Results Area */}
                    <div
                        ref={listRef}
                        className="flex-1 overflow-y-auto overscroll-contain py-3 scrollbar-hide"
                    >
                        {query.trim() ? (
                            /* Search Results */
                            searchResults.length > 0 ? (
                                <div className="px-3">
                                    <div className="px-4 py-2 flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            Risultati
                                        </span>
                                        <span className="text-[10px] font-medium text-slate-400">
                                            {searchResults.length} trovati
                                        </span>
                                    </div>
                                    {searchResults.map((item, idx) => {
                                        const itemIndex = currentIndex++;
                                        return (
                                            <button
                                                key={item.id}
                                                data-index={itemIndex}
                                                onClick={() => handleSelectItem({ type: 'search', data: item })}
                                                className={cn(
                                                    "w-full text-left px-4 py-3.5 rounded-2xl flex items-center gap-4 transition-all duration-150 group",
                                                    selectedIndex === itemIndex
                                                        ? "bg-[#00B1FF]/10 dark:bg-[#00B1FF]/15"
                                                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-xl transition-all",
                                                    selectedIndex === itemIndex
                                                        ? "bg-white dark:bg-slate-800 shadow-md"
                                                        : "bg-slate-100 dark:bg-slate-800"
                                                )}>
                                                    {getTypeIcon(item.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className={cn(
                                                        "text-[15px] font-bold truncate transition-colors",
                                                        selectedIndex === itemIndex ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"
                                                    )}>
                                                        {item.title}
                                                    </div>
                                                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                                        {getTypeLabel(item.type)}
                                                    </div>
                                                </div>
                                                <ChevronRight className={cn(
                                                    "w-5 h-5 transition-all",
                                                    selectedIndex === itemIndex
                                                        ? "text-[#00B1FF] opacity-100 translate-x-0"
                                                        : "text-slate-300 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                                                )} />
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="px-6 py-12 text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                        <Search className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                                        Nessun risultato per "{query}"
                                    </p>
                                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                                        Prova con un termine diverso
                                    </p>
                                </div>
                            )
                        ) : (
                            /* Default State: Continue, Recent, Actions */
                            <div className="space-y-6">
                                {/* Continue Section */}
                                {activeQuizzes.length > 0 && (
                                    <div className="px-3">
                                        <div className="px-4 py-2 flex items-center gap-2">
                                            <Zap className="w-4 h-4 text-amber-500" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                Continua a prepararti
                                            </span>
                                        </div>
                                        {activeQuizzes.slice(0, 3).map((quiz) => {
                                            const itemIndex = currentIndex++;
                                            return (
                                                <button
                                                    key={quiz.id}
                                                    data-index={itemIndex}
                                                    onClick={() => handleSelectItem({ type: 'continue', data: quiz })}
                                                    className={cn(
                                                        "w-full text-left px-4 py-3.5 rounded-2xl flex items-center gap-4 transition-all duration-150 group",
                                                        selectedIndex === itemIndex
                                                            ? "bg-amber-50 dark:bg-amber-900/20"
                                                            : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all",
                                                        selectedIndex === itemIndex
                                                            ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/25"
                                                            : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                                                    )}>
                                                        <TrendingUp className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-[15px] font-bold text-slate-900 dark:text-white truncate">
                                                            {quiz.title}
                                                        </div>
                                                        {quiz.role?.title && (
                                                            <div className="text-[11px] font-medium text-slate-400 truncate">
                                                                {quiz.role.title}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className={cn(
                                                        "px-2.5 py-1 rounded-lg text-[12px] font-black",
                                                        quiz.accuracy >= 80
                                                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                                                            : quiz.accuracy >= 60
                                                                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                                                                : "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
                                                    )}>
                                                        {quiz.accuracy}%
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Recent Searches */}
                                {recentSearches.length > 0 && (
                                    <div className="px-3">
                                        <div className="px-4 py-2 flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-slate-400" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                Ricerche recenti
                                            </span>
                                        </div>
                                        {recentSearches.slice(0, 3).map((search) => {
                                            const itemIndex = currentIndex++;
                                            return (
                                                <button
                                                    key={search}
                                                    data-index={itemIndex}
                                                    onClick={() => handleSelectItem({ type: 'recent', data: search })}
                                                    className={cn(
                                                        "w-full text-left px-4 py-3 rounded-2xl flex items-center gap-4 transition-all duration-150 group",
                                                        selectedIndex === itemIndex
                                                            ? "bg-slate-100 dark:bg-slate-800"
                                                            : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                                    )}
                                                >
                                                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                                        <Clock className="w-4 h-4 text-slate-400" />
                                                    </div>
                                                    <span className="text-[14px] font-medium text-slate-600 dark:text-slate-300 truncate">
                                                        {search}
                                                    </span>
                                                    <ArrowRight className="w-4 h-4 text-slate-300 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Smart Browse Section (Tier S) */}
                                <div className="px-3">
                                    <div className="px-4 py-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-brand-cyan" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                Esplora Concorsi
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        {/* Advanced Search - Tier S Button */}
                                        <button
                                            onClick={() => {
                                                close();
                                                navigate('/concorsi/search');
                                            }}
                                            className="col-span-2 p-4 rounded-2xl bg-gradient-to-br from-brand-blue via-brand-cyan to-brand-blue text-white shadow-lg shadow-brand-blue/25 flex items-center justify-between group relative overflow-hidden"
                                        >
                                            {/* Animated shine effect */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                                            <div className="flex items-center gap-3 relative z-10">
                                                <div className="w-10 h-10 rounded-[18%] bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                                    <Search className="w-5 h-5 text-white" />
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-bold text-lg">Ricerca Avanzata</div>
                                                    <div className="text-white/80 text-xs font-medium">Trova il tuo concorso ideale</div>
                                                </div>
                                            </div>
                                            <ArrowRight className="w-5 h-5 text-white/70 group-hover:translate-x-1 transition-transform relative z-10" />
                                        </button>

                                        {/* Quick Category Filters - Updated style */}
                                        <button
                                            onClick={() => { close(); navigate('/concorsi/forze-armate'); }}
                                            className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-brand-blue/50 hover:shadow-md hover:shadow-brand-blue/5 transition-all text-left flex items-center gap-3 group"
                                        >
                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 text-blue-600 flex items-center justify-center group-hover:from-blue-500 group-hover:to-blue-600 group-hover:text-white transition-all">
                                                <Shield className="w-4 h-4" />
                                            </div>
                                            <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">Militari</span>
                                        </button>

                                        <button
                                            onClick={() => { close(); navigate('/concorsi/amministrativi'); }}
                                            className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-brand-purple/50 hover:shadow-md hover:shadow-brand-purple/5 transition-all text-left flex items-center gap-3 group"
                                        >
                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/10 text-purple-600 flex items-center justify-center group-hover:from-purple-500 group-hover:to-purple-600 group-hover:text-white transition-all">
                                                <Briefcase className="w-4 h-4" />
                                            </div>
                                            <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">Amministrativi</span>
                                        </button>

                                        <button
                                            onClick={() => { close(); navigate('/concorsi/enti-locali'); }}
                                            className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-brand-orange/50 hover:shadow-md hover:shadow-brand-orange/5 transition-all text-left flex items-center gap-3 group"
                                        >
                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/10 text-orange-600 flex items-center justify-center group-hover:from-orange-500 group-hover:to-orange-600 group-hover:text-white transition-all">
                                                <MapPin className="w-4 h-4" />
                                            </div>
                                            <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">Enti Locali</span>
                                        </button>

                                        <button
                                            onClick={() => { close(); navigate('/concorsi/sanita'); }}
                                            className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-rose-500/50 hover:shadow-md hover:shadow-rose-500/5 transition-all text-left flex items-center gap-3 group"
                                        >
                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500/10 to-rose-600/10 text-rose-600 flex items-center justify-center group-hover:from-rose-500 group-hover:to-rose-600 group-hover:text-white transition-all">
                                                <Activity className="w-4 h-4" />
                                            </div>
                                            <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">Sanità</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer with keyboard hints */}
                    <div className="hidden sm:flex px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 items-center justify-between text-[11px] font-bold text-slate-400 shrink-0">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5">
                                <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded shadow-sm">↑</kbd>
                                <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded shadow-sm">↓</kbd>
                                <span className="ml-1">naviga</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                                <kbd className="px-2 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded shadow-sm">↵</kbd>
                                <span className="ml-1">seleziona</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Command className="w-3 h-3" />
                            <span>K per aprire</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
