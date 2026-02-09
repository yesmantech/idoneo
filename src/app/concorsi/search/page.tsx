import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    ChevronLeft,
    Filter,
    X,
    Trophy,
    Calendar,
    ArrowRight,
    Shield,
    Sparkles,
    CheckCircle2
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import {
    searchQuizzes,
    ConcorsoQuiz,
    ConcorsoFilters,
    fetchAllCategories
} from '@/lib/concorsoService';
import TierSLoader from '@/components/ui/TierSLoader';
import SEOHead from '@/components/seo/SEOHead';

// ============================================
// CONCORSI SEARCH PAGE - Tier S
// ============================================

export default function ConcorsiSearchPage() {
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState<ConcorsoQuiz[]>([]);
    const [categories, setCategories] = useState<{ id: string, title: string, slug: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    const [filters, setFilters] = useState<ConcorsoFilters>({
        search: '',
        categorySlug: undefined,
        year: undefined,
        isOfficial: undefined,
        limit: 20,
        offset: 0
    });

    const [totalCount, setTotalCount] = useState(0);

    // Initial load
    useEffect(() => {
        loadInitialData();
    }, []);

    // Load when filters change (debounced search handled by form submission or explicit action)
    useEffect(() => {
        if (!loading) {
            loadData(filters);
        }
    }, [filters.categorySlug, filters.year, filters.isOfficial]);

    const loadInitialData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [quizzesResult, catsResult] = await Promise.all([
                searchQuizzes(filters),
                fetchAllCategories()
            ]);
            setQuizzes(quizzesResult.data);
            setTotalCount(quizzesResult.count);
            setCategories(catsResult);
        } catch (err) {
            console.error('Error loading concorsi:', err);
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    };

    const loadData = async (newFilters: ConcorsoFilters) => {
        if (newFilters.offset === 0) {
            setLoading(true);
            setError(null);
        }
        else setLoadingMore(true);

        try {
            const result = await searchQuizzes(newFilters);
            if (newFilters.offset === 0) {
                setQuizzes(result.data);
            } else {
                setQuizzes(prev => [...prev, ...result.data]);
            }
            setTotalCount(result.count);
        } catch (err) {
            console.error('Error loading concorsi:', err);
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadData({ ...filters, offset: 0 });
    };

    const handleLoadMore = () => {
        if (!loadingMore && quizzes.length < totalCount) {
            const nextOffset = (filters.offset || 0) + (filters.limit || 20);
            setFilters(prev => ({ ...prev, offset: nextOffset }));
        }
    };

    const toggleCategory = (slug: string) => {
        setFilters(prev => ({
            ...prev,
            categorySlug: prev.categorySlug === slug ? undefined : slug,
            offset: 0
        }));
    };

    const activeFiltersCount = [
        filters.categorySlug,
        filters.year,
        filters.isOfficial
    ].filter(Boolean).length;

    return (
        <div className="min-h-screen bg-[var(--background)] pb-24">
            <SEOHead
                title="Ricerca Avanzata Concorsi | Idoneo"
                description="Trova il tuo concorso ideale tra centinaia di simulatori ufficiali e quiz commentati."
            />



            {/* Desktop / Mobile Header */}
            <header className="sticky top-0 z-40 bg-[var(--background)] backdrop-blur-xl border-b border-[var(--card-border)] pt-safe">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-[var(--card-border)] text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="flex-1">
                        <h1 className="text-xl font-black text-[var(--foreground)] tracking-tight">Ricerca Concorsi</h1>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                            {totalCount} quiz disponibili
                        </p>
                    </div>

                    <button
                        onClick={() => setShowFilters(true)}
                        className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all border relative ${activeFiltersCount > 0
                            ? 'bg-brand-blue text-white border-brand-blue'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-[var(--card-border)] shadow-sm'
                            }`}
                    >
                        <Filter className="w-5 h-5" />
                        {activeFiltersCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full border-2 border-[var(--background)] flex items-center justify-center">
                                {activeFiltersCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Search Bar & Categories Chips */}
                <div className="max-w-7xl mx-auto px-4 pb-4 space-y-4">
                    <form onSubmit={handleSearch} className="relative group">
                        {/* Search Icon */}
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <Search className="w-5 h-5 text-slate-400 group-focus-within:text-brand-blue transition-colors" />
                        </div>

                        {/* Premium Search Input */}
                        <input
                            type="text"
                            placeholder="Cerca concorso..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            className="w-full h-[52px] pl-14 pr-5 bg-[var(--card)] 
                                       text-[15px] font-medium text-[var(--foreground)] placeholder:text-slate-400/70
                                       shadow-soft border border-[var(--card-border)] rounded-[26px]
                                       focus:border-brand-blue/30 focus:shadow-lg focus:shadow-brand-blue/5 
                                       outline-none transition-all duration-200"
                        />
                    </form>

                    {/* Category Scroll */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 snap-x">
                        <button
                            onClick={() => setFilters(prev => ({ ...prev, categorySlug: undefined, offset: 0 }))}
                            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border snap-start ${!filters.categorySlug
                                ? 'bg-brand-blue text-white border-brand-blue shadow-lg shadow-brand-blue/20'
                                : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                                }`}
                        >
                            Tutti
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => toggleCategory(cat.slug)}
                                className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border snap-start ${filters.categorySlug === cat.slug
                                    ? 'bg-brand-blue text-white border-brand-blue shadow-lg shadow-brand-blue/20'
                                    : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                                    }`}
                            >
                                {cat.title}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Results */}
            <main className="max-w-7xl mx-auto px-4 pt-6">
                {loading ? (
                    <div className="py-20 flex flex-col items-center">
                        <TierSLoader message="Ricerca in corso..." />
                    </div>
                ) : error ? (
                    <div className="py-20 text-center space-y-4">
                        <div className="text-5xl">😭</div>
                        <h2 className="text-xl font-bold text-[var(--foreground)]">{error || "Si è verificato un errore"}</h2>
                        <button
                            onClick={loadInitialData}
                            className="px-6 py-3 bg-brand-blue text-white rounded-2xl font-bold"
                        >
                            Riprova
                        </button>
                    </div>
                ) : quizzes.length === 0 ? (
                    <div className="py-20 text-center space-y-4">
                        <div className="text-5xl opacity-40">🔍</div>
                        <h2 className="text-xl font-bold text-slate-400">Nessun risultato trovato</h2>
                        <button
                            onClick={() => setFilters({ ...filters, search: '', categorySlug: undefined, offset: 0 })}
                            className="text-brand-blue font-bold"
                        >
                            Reset filtri
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <AnimatePresence mode="popLayout">
                            {quizzes.map((quiz, i) => (
                                <motion.div
                                    key={quiz.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: Math.min(i * 0.05, 0.4) }}
                                    layout
                                >
                                    <QuizSearchCard quiz={quiz} />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {/* Load More */}
                {!loading && quizzes.length < totalCount && (
                    <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="w-full mt-8 py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-[28px] font-bold text-slate-600 dark:text-slate-300 shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 group"
                    >
                        {loadingMore ? 'Caricamento...' : (
                            <>
                                Mostra altri
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                )}
            </main>

            {/* Premium Filter Modal */}
            <TierSFilterModal
                isOpen={showFilters}
                onClose={() => setShowFilters(false)}
                filters={filters}
                setFilters={setFilters}
                categories={categories}
            />
        </div>
    );
}

// ============================================
// QUIZ SEARCH CARD
// ============================================

function QuizSearchCard({ quiz }: { quiz: ConcorsoQuiz }) {
    // Dynamic styling based on category
    const getStyle = (title?: string) => {
        if (!title) return 'from-brand-blue to-brand-cyan';
        const lower = title.toLowerCase();
        if (lower.includes('forze-armate') || lower.includes('militari') || lower.includes('polizia')) return 'from-blue-500 to-indigo-600';
        if (lower.includes('sanita')) return 'from-rose-500 to-pink-600';
        if (lower.includes('amministrativi')) return 'from-brand-purple to-indigo-700';
        if (lower.includes('enti-locali')) return 'from-brand-orange to-orange-700';
        return 'from-brand-blue to-brand-cyan';
    };

    const gradient = getStyle(quiz.role?.category?.slug);

    return (
        <Link
            to={`/concorsi/${quiz.role?.category?.slug || 'unknown'}/${quiz.role?.slug || 'unknown'}`}
            className="group block bg-[var(--card)] rounded-[32px] border border-[var(--card-border)] overflow-hidden hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-300"
        >
            <div className="p-5 flex gap-4">
                {/* Visual Icon */}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-lg shadow-black/5`}>
                    <Shield className="w-6 h-6 text-white" strokeWidth={1.5} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest">
                            {quiz.role?.category?.title || 'Concorso'}
                        </span>
                        {quiz.is_official && (
                            <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded-full text-[9px] font-bold">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                Ufficiale
                            </div>
                        )}
                    </div>

                    <h3 className="text-[16px] font-black text-[var(--foreground)] leading-[1.2] line-clamp-2 group-hover:text-brand-blue transition-colors mb-2">
                        {quiz.title}
                    </h3>

                    <div className="flex flex-wrap gap-2">
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 text-slate-500">
                            <Calendar className="w-3 h-3" />
                            <span className="text-[11px] font-bold">{quiz.year}</span>
                        </div>

                        {quiz.available_seats && (
                            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-blue/5 border border-brand-blue/10 text-brand-blue">
                                <Trophy className="w-3 h-3" />
                                <span className="text-[11px] font-bold">{quiz.available_seats}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="px-5 py-3 bg-slate-50 dark:bg-white/5 border-t border-[var(--card-border)] flex items-center justify-between">
                <span className="text-[12px] font-medium text-slate-500 truncate pr-4">
                    {quiz.role?.title || 'Ruolo non specificato'}
                </span>
                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-brand-blue shadow-sm transition-all group-hover:translate-x-1">
                    <ArrowRight className="w-4 h-4" />
                </div>
            </div>
        </Link>
    );
}

// ============================================
// PREMIUM FILTER MODAL
// ============================================

function TierSFilterModal({
    isOpen,
    onClose,
    filters,
    setFilters,
    categories
}: {
    isOpen: boolean;
    onClose: () => void;
    filters: ConcorsoFilters;
    setFilters: React.Dispatch<React.SetStateAction<ConcorsoFilters>>;
    categories: { id: string, title: string, slug: string }[];
}) {
    const years = [2025, 2024, 2023, 2022, 2021];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-4 focus:outline-none">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="relative w-full max-w-lg bg-[var(--background)] rounded-[40px] shadow-2xl overflow-hidden border border-[var(--card-border)]"
                >
                    <div className="p-8 pb-10">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black text-[var(--foreground)] tracking-tight">Filtri Avanzati</h2>
                            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-8">
                            {/* Categories */}
                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Categoria</h3>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setFilters(f => ({ ...f, categorySlug: undefined, offset: 0 }))}
                                        className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all border ${!filters.categorySlug
                                            ? 'bg-brand-blue text-white border-brand-blue shadow-lg shadow-brand-blue/20'
                                            : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-100 dark:border-slate-800'}`}
                                    >
                                        Tutti
                                    </button>
                                    {categories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setFilters(f => ({ ...f, categorySlug: cat.slug, offset: 0 }))}
                                            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all border ${filters.categorySlug === cat.slug
                                                ? 'bg-brand-blue text-white border-brand-blue shadow-lg shadow-brand-blue/20'
                                                : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-100 dark:border-slate-800'}`}
                                        >
                                            {cat.title}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Years */}
                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Anno di pubblicazione</h3>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setFilters(f => ({ ...f, year: undefined, offset: 0 }))}
                                        className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all border ${!filters.year
                                            ? 'bg-brand-blue text-white border-brand-blue shadow-lg shadow-brand-blue/20'
                                            : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-100 dark:border-slate-800'}`}
                                    >
                                        Tutti
                                    </button>
                                    {years.map(y => (
                                        <button
                                            key={y}
                                            onClick={() => setFilters(f => ({ ...f, year: y, offset: 0 }))}
                                            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all border ${filters.year === y
                                                ? 'bg-brand-blue text-white border-brand-blue shadow-lg shadow-brand-blue/20'
                                                : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-100 dark:border-slate-800'}`}
                                        >
                                            {y}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Toggles */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 rounded-3xl bg-slate-50 dark:bg-white/5 border border-[var(--card-border)]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-black text-[var(--foreground)] tracking-tight">Solo Ufficiali</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bandi Ministeriali</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setFilters(f => ({ ...f, isOfficial: f.isOfficial === true ? undefined : true, offset: 0 }))}
                                        className={`w-12 h-7 rounded-full transition-all relative ${filters.isOfficial === true ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                                    >
                                        <motion.div
                                            animate={{ x: filters.isOfficial === true ? 20 : 4 }}
                                            className="absolute top-1 left-0 w-5 h-5 bg-white rounded-full shadow-sm"
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-10">
                            <button
                                onClick={() => {
                                    setFilters({ search: '', categorySlug: undefined, offset: 0 });
                                    onClose();
                                }}
                                className="py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-[24px] font-black text-sm hover:bg-slate-200 transition-all"
                            >
                                Reset
                            </button>
                            <button
                                onClick={onClose}
                                className="py-4 bg-gradient-to-r from-brand-blue to-brand-cyan text-white rounded-[24px] font-black text-sm shadow-xl shadow-brand-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                Applica
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
