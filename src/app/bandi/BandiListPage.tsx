import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Bookmark, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
    fetchBandi,
    fetchClosingSoonBandi,
    saveBando,
    unsaveBando,
    fetchUserSavedBandi,
    Bando,
    BandiFilters
} from '@/lib/bandiService';
import BandoCard from '@/components/bandi/BandoCard';
import BandiFiltersBar from '@/components/bandi/BandiFilters';
import BandiEmptyState from '@/components/bandi/BandiEmptyState';
import { BandoCardSkeletonList } from '@/components/bandi/BandoSkeleton';
import { useAuth } from '@/context/AuthContext';
import SEOHead from '@/components/seo/SEOHead';

export default function BandiListPage() {
    const { user } = useAuth();
    const [bandi, setBandi] = useState<Bando[]>([]);
    const [closingSoon, setClosingSoon] = useState<Bando[]>([]);
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(false);
    const [filters, setFilters] = useState<BandiFilters>({
        status: 'open',
        sortBy: 'relevance',
        limit: 20,
        offset: 0
    });

    // Initial load
    useEffect(() => {
        loadInitialData();
    }, []);

    // Reload when filters change
    useEffect(() => {
        if (!loading) {
            loadBandi(filters);
        }
    }, [filters]);

    const loadInitialData = async () => {
        setLoading(true);
        setError(false);
        try {
            const [bandiResult, closingSoonResult, savedResult] = await Promise.all([
                fetchBandi(filters),
                fetchClosingSoonBandi(7, 10),
                user ? fetchUserSavedBandi() : Promise.resolve([])
            ]);

            setBandi(bandiResult.data);
            setTotalCount(bandiResult.count);
            setClosingSoon(closingSoonResult);
            setSavedIds(new Set(savedResult.map(b => b.id)));
        } catch (err) {
            console.error('Error loading bandi:', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const loadBandi = async (newFilters: BandiFilters) => {
        if (newFilters.offset === 0) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const result = await fetchBandi(newFilters);
            if (newFilters.offset === 0) {
                setBandi(result.data);
            } else {
                setBandi(prev => [...prev, ...result.data]);
            }
            setTotalCount(result.count);
        } catch (err) {
            console.error('Error loading bandi:', err);
            setError(true);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const handleFiltersChange = useCallback((newFilters: BandiFilters) => {
        setFilters(newFilters);
    }, []);

    const handleSaveToggle = useCallback(async (bandoId: string, save: boolean) => {
        if (!user) return;

        const success = save ? await saveBando(bandoId) : await unsaveBando(bandoId);
        if (success) {
            setSavedIds(prev => {
                const next = new Set(prev);
                if (save) {
                    next.add(bandoId);
                } else {
                    next.delete(bandoId);
                }
                return next;
            });
        }
    }, [user]);

    const handleLoadMore = () => {
        if (!loadingMore && bandi.length < totalCount) {
            setFilters(prev => ({ ...prev, offset: (prev.offset || 0) + (prev.limit || 20) }));
        }
    };

    const clearFilters = () => {
        setFilters({
            status: 'open',
            sortBy: 'relevance',
            limit: 20,
            offset: 0
        });
    };

    return (
        <div className="min-h-screen bg-[var(--background)] pb-24">
            <SEOHead
                title="Bandi e Concorsi Pubblici"
                description="Scopri tutti i bandi e concorsi pubblici attivi. Cerca per categoria, ente e scadenza. Preparati con Idoneo."
                url="/bandi"
            />
            {/* Tier S Header */}
            <div className="bg-[var(--background)] sticky top-0 z-30 border-b border-[var(--card-border)] pt-safe">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
                    <div>
                        <h1 className="text-[22px] font-black text-[var(--foreground)] tracking-tight">Bandi</h1>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                            Concorsi pubblici
                        </p>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <Link
                            to="/bandi/alerts"
                            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-[var(--card)] border border-[var(--card-border)] text-slate-400 hover:text-brand-blue hover:border-brand-blue/30 transition-all shadow-sm"
                            title="Gestisci notifiche"
                        >
                            <Bell className="w-[18px] h-[18px]" />
                        </Link>
                        <Link
                            to="/bandi/watchlist"
                            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-brand-blue to-brand-cyan text-white text-[13px] font-bold shadow-lg shadow-brand-blue/20 hover:scale-[1.03] active:scale-[0.97] transition-all"
                        >
                            <Bookmark className="w-4 h-4" fill="currentColor" />
                            Salvati
                        </Link>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 lg:px-8 pb-4">
                    <BandiFiltersBar
                        filters={filters}
                        onFiltersChange={handleFiltersChange}
                        totalResults={loading ? undefined : totalCount}
                    />
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">


                {loading ? (
                    <BandoCardSkeletonList count={6} />
                ) : error ? (
                    <BandiEmptyState type="error" onRetry={loadInitialData} />
                ) : bandi.length === 0 ? (
                    <BandiEmptyState
                        type="no-results"
                        searchQuery={filters.search}
                        onClearFilters={clearFilters}
                    />
                ) : (
                    <>
                        {/* Closing soon carousel (only on first page with no active search) */}
                        {!filters.search && filters.offset === 0 && closingSoon.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-[17px] font-black text-[var(--foreground)] tracking-tight flex items-center gap-2">
                                        🔥 In scadenza
                                    </h2>
                                    <Link
                                        to="/bandi?deadline_within_days=7"
                                        className="text-[13px] text-brand-blue font-bold flex items-center hover:opacity-80 transition-opacity"
                                    >
                                        Vedi tutti <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>
                                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                                    {closingSoon.slice(0, 5).map((bando, i) => (
                                        <motion.div
                                            key={bando.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                        >
                                            <BandoCard
                                                bando={bando}
                                                variant="featured"
                                            />
                                        </motion.div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Main list */}
                        <section>
                            {!filters.search && filters.offset === 0 && closingSoon.length > 0 && (
                                <h2 className="text-[17px] font-black text-[var(--foreground)] tracking-tight mb-4">
                                    Tutti i bandi
                                </h2>
                            )}
                            <div className="space-y-3">
                                <AnimatePresence mode="popLayout">
                                    {bandi.map((bando, i) => (
                                        <motion.div
                                            key={bando.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: Math.min(i * 0.03, 0.3) }}
                                            layout
                                        >
                                            <BandoCard
                                                bando={bando}
                                                isSaved={savedIds.has(bando.id)}
                                                onSaveToggle={handleSaveToggle}
                                            />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            {/* Load more */}
                            {bandi.length < totalCount && (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    className="w-full mt-6 py-4 rounded-[20px] bg-[var(--card)] border border-[var(--card-border)] font-bold text-[14px] text-slate-500 shadow-sm hover:shadow-md transition-all"
                                >
                                    {loadingMore ? 'Caricamento...' : `Carica altri (${totalCount - bandi.length} rimasti)`}
                                </motion.button>
                            )}
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}
