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
    Activity,
    SlidersHorizontal
} from 'lucide-react';
import Fuse from 'fuse.js';
import { useSpotlight } from '@/context/SpotlightContext';
import { SearchItem } from '@/lib/data';
import { leaderboardService } from '@/lib/leaderboardService';
import { supabase } from '@/lib/supabaseClient';
import { hapticLight, hapticSelection } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { analytics } from '@/lib/analytics';
import { getCategoryStyle } from '@/lib/categoryIcons';
import { useWindowHeight } from '@/hooks/useKeyboardHeight';

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
    const keyboardHeight = useWindowHeight();

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

    const renderItemIcon = (item: SearchItem, isSelected: boolean) => {
        const style = getCategoryStyle(item.title);
        const Icon = style.Icon;
        return (
            <div
                className={cn(
                    "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all",
                    isSelected
                        ? "shadow-md"
                        : ""
                )}
                style={{ backgroundColor: isSelected ? style.bgLight : style.bgLight + '80' }}
            >
                <Icon className="w-5 h-5" style={{ color: style.color }} strokeWidth={1.8} />
            </div>
        );
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
            <div
                className="fixed inset-0 z-[9999] flex items-end sm:items-start sm:justify-center sm:pt-[10vh] sm:px-4"
            >
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={close}
                    className="absolute inset-0 bg-black/40 dark:bg-black/60"
                />

                {/* Spotlight Sheet */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 40 }}
                    transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                    className="relative w-full sm:max-w-xl bg-[var(--card)] rounded-t-[32px] sm:rounded-[28px] shadow-2xl flex flex-col overflow-hidden"
                    style={{
                        maxHeight: keyboardHeight > 0 ? `calc(100dvh - ${keyboardHeight}px)` : '82dvh',
                        border: '1px solid var(--card-border)',
                        transition: 'max-height 0.28s cubic-bezier(0.33, 1, 0.68, 1)',
                    }}
                    onKeyDown={handleKeyDown}
                >
                    {/* Drag handle (mobile only) */}
                    <div className="sm:hidden w-10 h-1 rounded-full bg-[var(--foreground)] opacity-10 mx-auto mt-3 mb-0 shrink-0" />

                    {/* ── SEARCH BAR ── */}
                    <form onSubmit={handleSearch} className="shrink-0 px-4 pt-4 pb-3">
                        <div
                            className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                            style={{ background: 'var(--background)' }}
                        >
                            <Search className="w-5 h-5 shrink-0" style={{ color: '#00B1FF' }} />
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Cerca concorsi, profili..."
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setSelectedIndex(0);
                                }}
                                className="flex-1 bg-transparent text-[17px] font-semibold text-[var(--foreground)] placeholder:text-[var(--foreground)] placeholder:opacity-30 focus:outline-none"
                            />
                            {query ? (
                                <button
                                    type="button"
                                    onClick={() => setQuery('')}
                                    className="p-1 rounded-full"
                                    style={{ background: 'var(--card-border)' }}
                                >
                                    <X className="w-3.5 h-3.5 text-[var(--foreground)] opacity-60" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => { close(); navigate('/concorsi/search'); }}
                                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors active:scale-95"
                                    style={{ background: 'var(--background)' }}
                                >
                                    <SlidersHorizontal className="w-[18px] h-[18px]" style={{ color: '#00B1FF' }} />
                                </button>
                            )}
                        </div>
                    </form>

                    {/* ── RESULTS ── */}
                    <div
                        ref={listRef}
                        className="flex-1 overflow-y-auto overscroll-contain scrollbar-hide pb-safe"
                    >
                        {query.trim() ? (
                            /* Search Results */
                            searchResults.length > 0 ? (
                                <div>
                                    <div className="px-6 py-2">
                                        <span className="text-[10px] font-black text-[var(--foreground)] opacity-40 uppercase tracking-widest">
                                            {searchResults.length} Risultati
                                        </span>
                                    </div>
                                    {searchResults.map((item) => {
                                        const itemIndex = currentIndex++;
                                        const isSelected = selectedIndex === itemIndex;
                                        return (
                                            <button
                                                key={item.id}
                                                data-index={itemIndex}
                                                onClick={() => handleSelectItem({ type: 'search', data: item })}
                                                className="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors"
                                                style={isSelected ? { background: 'var(--background)' } : {}}
                                            >
                                                {renderItemIcon(item, isSelected)}
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[15px] font-bold text-[var(--foreground)] truncate">{item.title}</div>
                                                    <div className="text-[11px] font-semibold text-[var(--foreground)] opacity-40 uppercase tracking-wide">{getTypeLabel(item.type)}</div>
                                                </div>
                                                <ChevronRight className="w-4 h-4 opacity-30 shrink-0" style={{ color: 'var(--foreground)' }} />
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="px-6 py-14 text-center">
                                    <div
                                        className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                                        style={{ background: 'var(--background)' }}
                                    >
                                        <Search className="w-6 h-6 text-[var(--foreground)] opacity-25" />
                                    </div>
                                    <p className="text-[15px] font-semibold text-[var(--foreground)] opacity-50">Nessun risultato</p>
                                    <p className="text-[13px] text-[var(--foreground)] opacity-30 mt-1">Prova con un termine diverso</p>
                                </div>
                            )
                        ) : (
                            /* Default: Continue, Recent, Explore */
                            <div className="space-y-0">
                                {/* Continue Section */}
                                {activeQuizzes.length > 0 && (
                                    <div>
                                        <div className="px-6 py-2 pt-1">
                                            <span className="text-[10px] font-black text-[var(--foreground)] opacity-40 uppercase tracking-widest flex items-center gap-1.5">
                                                <Zap className="w-3.5 h-3.5 text-amber-500" />
                                                Continua a prepararti
                                            </span>
                                        </div>
                                        {activeQuizzes.slice(0, 3).map((quiz) => {
                                            const itemIndex = currentIndex++;
                                            const isSelected = selectedIndex === itemIndex;
                                            return (
                                                <button
                                                    key={quiz.id}
                                                    data-index={itemIndex}
                                                    onClick={() => handleSelectItem({ type: 'continue', data: quiz })}
                                                    className="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors"
                                                    style={isSelected ? { background: 'var(--background)' } : {}}
                                                >
                                                    <div className="w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 bg-amber-100 dark:bg-amber-900/30">
                                                        <TrendingUp className="w-5 h-5 text-amber-500" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-[15px] font-bold text-[var(--foreground)] truncate">{quiz.title}</div>
                                                        {quiz.role?.title && (
                                                            <div className="text-[12px] text-[var(--foreground)] opacity-40 truncate">{quiz.role.title}</div>
                                                        )}
                                                    </div>
                                                    <div className={cn(
                                                        "px-2 py-0.5 rounded-full text-[12px] font-black",
                                                        quiz.accuracy >= 80 ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" :
                                                        quiz.accuracy >= 60 ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600" :
                                                        "bg-rose-100 dark:bg-rose-900/30 text-rose-500"
                                                    )}>{quiz.accuracy}%</div>
                                                </button>
                                            );
                                        })}
                                        <div className="h-px mx-4 my-1" style={{ background: 'var(--card-border)' }} />
                                    </div>
                                )}

                                {/* Recent Searches */}
                                {recentSearches.length > 0 && (
                                    <div>
                                        <div className="px-6 py-2">
                                            <span className="text-[10px] font-black text-[var(--foreground)] opacity-40 uppercase tracking-widest flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5" />
                                                Ricerche recenti
                                            </span>
                                        </div>
                                        {recentSearches.slice(0, 4).map((search) => {
                                            const itemIndex = currentIndex++;
                                            const isSelected = selectedIndex === itemIndex;
                                            return (
                                                <button
                                                    key={search}
                                                    data-index={itemIndex}
                                                    onClick={() => handleSelectItem({ type: 'recent', data: search })}
                                                    className="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors"
                                                    style={isSelected ? { background: 'var(--background)' } : {}}
                                                >
                                                    <div
                                                        className="w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0"
                                                        style={{ background: 'var(--background)' }}
                                                    >
                                                        <Clock className="w-4 h-4 text-[var(--foreground)] opacity-40" />
                                                    </div>
                                                    <span className="text-[15px] font-medium text-[var(--foreground)] opacity-70 truncate flex-1">{search}</span>
                                                    <ArrowRight className="w-4 h-4 opacity-20 shrink-0" style={{ color: 'var(--foreground)' }} />
                                                </button>
                                            );
                                        })}
                                        <div className="h-px mx-4 my-1" style={{ background: 'var(--card-border)' }} />
                                    </div>
                                )}

                                {/* Explore Concorsi */}
                                <div className="px-4 py-3">
                                    <div className="px-2 pb-2">
                                        <span className="text-[10px] font-black text-[var(--foreground)] opacity-40 uppercase tracking-widest flex items-center gap-1.5">
                                            <Sparkles className="w-3.5 h-3.5 text-[#00B1FF]" />
                                            Esplora Concorsi
                                        </span>
                                    </div>

                                    {/* Advanced Search CTA */}
                                    <button
                                        onClick={() => { close(); navigate('/concorsi/search'); }}
                                        className="w-full mb-3 p-4 rounded-[20px] flex items-center justify-between group transition-all active:scale-[0.98]"
                                        style={{ background: '#00B1FF' }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-[12px] bg-white/20 flex items-center justify-center">
                                                <Search className="w-4.5 h-4.5 text-white" />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-bold text-white text-[15px]">Ricerca Avanzata</div>
                                                <div className="text-white/70 text-[12px] font-medium">Filtra per categoria e tipo</div>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-white/70 group-hover:translate-x-0.5 transition-transform" />
                                    </button>

                                    {/* Quick category chips */}
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { label: 'Militari', url: '/concorsi/forze-armate', Icon: Shield, color: '#3B82F6' },
                                            { label: 'Amministrativi', url: '/concorsi/amministrativi', Icon: Briefcase, color: '#8B5CF6' },
                                            { label: 'Enti Locali', url: '/concorsi/enti-locali', Icon: MapPin, color: '#F97316' },
                                            { label: 'Sanità', url: '/concorsi/sanita', Icon: Activity, color: '#F43F5E' },
                                        ].map(({ label, url, Icon, color }) => (
                                            <button
                                                key={label}
                                                onClick={() => { close(); navigate(url); }}
                                                className="p-3 rounded-[16px] flex items-center gap-2.5 text-left transition-all active:scale-[0.97]"
                                                style={{ background: 'var(--background)', border: '1px solid var(--card-border)' }}
                                            >
                                                <div
                                                    className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0"
                                                    style={{ background: color + '18' }}
                                                >
                                                    <Icon className="w-4 h-4" style={{ color }} />
                                                </div>
                                                <span className="text-[13px] font-semibold text-[var(--foreground)]">{label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
