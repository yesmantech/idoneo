import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ChevronRight } from 'lucide-react';
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
        sortBy: 'deadline',
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
            sortBy: 'deadline',
            limit: 20,
            offset: 0
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 sticky top-0 z-30 border-b border-slate-100 dark:border-slate-800">
                <div className="px-4 py-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bandi</h1>
                    <div className="flex items-center gap-2">
                        <Link
                            to="/bandi/alerts"
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            title="Gestisci notifiche"
                        >
                            <Bell className="w-5 h-5" />
                        </Link>
                        <Link
                            to="/bandi/watchlist"
                            className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
                        >
                            Salvati
                        </Link>
                    </div>
                </div>

                <div className="px-4 pb-4">
                    <BandiFiltersBar
                        filters={filters}
                        onFiltersChange={handleFiltersChange}
                        totalResults={loading ? undefined : totalCount}
                    />
                </div>
            </div>

            {/* Content */}
            <div className="px-4 py-4 space-y-6">
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
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                        🔥 In scadenza
                                    </h2>
                                    <Link
                                        to="/bandi?deadline_within_days=7"
                                        className="text-sm text-emerald-500 font-medium flex items-center"
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
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
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
                                    className="w-full mt-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-700 dark:text-slate-200"
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
