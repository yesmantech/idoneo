import { useState, useCallback } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Bell, Bookmark, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Button } from '@/components/ui/Button';
import SEOHead from '@/components/seo/SEOHead';

export default function BandiListPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [filters, setFilters] = useState<BandiFilters>({
        status: 'open',
        sortBy: 'relevance',
        limit: 20,
    }); // Removed offset from base filters as React Query manages it

    // --- Queries ---

    // 1. Main Infinite List
    const {
        data: infiniteData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isMainLoading,
        isError: isMainError,
        refetch: refetchMain
    } = useInfiniteQuery({
        queryKey: ['bandi', filters],
        queryFn: ({ pageParam = 0 }) => fetchBandi({ ...filters, offset: pageParam as number }),
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            const currentTotal = allPages.reduce((acc, page) => acc + page.data.length, 0);
            return currentTotal < lastPage.count ? currentTotal : undefined;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const bandi = infiniteData?.pages.flatMap(page => page.data) || [];
    const totalCount = infiniteData?.pages[0]?.count || 0;

    // 2. Closing Soon (Only on first page, no search)
    const showClosingSoon = !filters.search && bandi.length > 0;
    const { data: closingSoon = [] } = useQuery({
        queryKey: ['bandi-closing-soon'],
        queryFn: () => fetchClosingSoonBandi(7, 10),
        enabled: showClosingSoon,
        staleTime: 1000 * 60 * 15, // 15 minutes
    });

    // 3. Saved IDs Map
    const { data: savedIds = new Set<string>() } = useQuery({
        queryKey: ['saved-bandi-ids', user?.id],
        queryFn: async () => {
            if (!user) return new Set<string>();
            const saved = await fetchUserSavedBandi();
            return new Set(saved.map(b => b.id));
        },
        enabled: !!user,
        staleTime: Infinity, // Mutated directly
    });

    // --- Mutations ---

    const saveMutation = useMutation({
        mutationFn: async ({ bandoId, save }: { bandoId: string, save: boolean }) => {
            if (!user) throw new Error("Not logged in");
            if (save) await saveBando(bandoId);
            else await unsaveBando(bandoId);
            return { bandoId, save };
        },
        onMutate: async ({ bandoId, save }) => {
            await queryClient.cancelQueries({ queryKey: ['saved-bandi-ids', user?.id] });
            const previousSaved = queryClient.getQueryData<Set<string>>(['saved-bandi-ids', user?.id]);

            // Optimistic Update
            queryClient.setQueryData<Set<string>>(['saved-bandi-ids', user?.id], old => {
                const next = new Set(old);
                if (save) next.add(bandoId);
                else next.delete(bandoId);
                return next;
            });
            return { previousSaved };
        },
        onError: (err, variables, context) => {
            console.error("Save toggle error:", err);
            if (context?.previousSaved) {
                queryClient.setQueryData(['saved-bandi-ids', user?.id], context.previousSaved);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['saved-bandi-ids', user?.id] });
        }
    });

    // --- Handlers ---

    const handleFiltersChange = useCallback((newFilters: BandiFilters) => {
        // Strip offset when setting filters so we start fresh
        const { offset, ...cleanFilters } = newFilters;
        setFilters(cleanFilters);
    }, []);

    const handleSaveToggle = useCallback((bandoId: string, save: boolean) => {
        if (!user) return;
        saveMutation.mutate({ bandoId, save });
    }, [user, saveMutation]);

    const handleLoadMore = () => {
        if (hasNextPage) {
            fetchNextPage();
        }
    };

    const clearFilters = () => {
        setFilters({
            status: 'open',
            sortBy: 'relevance',
            limit: 20,
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
                        <Link to="/bandi/alerts">
                            <Button
                                variant="secondary"
                                size="sm"
                                className="w-10 h-10 p-0 rounded-2xl"
                                title="Gestisci notifiche"
                                icon={<Bell className="w-[18px] h-[18px] opacity-50" />}
                            />
                        </Link>
                        <Link to="/bandi/watchlist">
                            <Button
                                variant="gradient"
                                size="sm"
                                className="px-4 py-2.5 rounded-2xl"
                                icon={<Bookmark className="w-4 h-4" fill="currentColor" />}
                            >
                                Salvati
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 lg:px-8 pb-4">
                    <BandiFiltersBar
                        filters={filters}
                        onFiltersChange={handleFiltersChange}
                        totalResults={isMainLoading ? undefined : totalCount}
                    />
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">


                {isMainLoading ? (
                    <BandoCardSkeletonList count={6} />
                ) : isMainError ? (
                    <BandiEmptyState type="error" onRetry={() => refetchMain()} />
                ) : bandi.length === 0 ? (
                    <BandiEmptyState
                        type="no-results"
                        searchQuery={filters.search}
                        onClearFilters={clearFilters}
                    />
                ) : (
                    <>
                        {/* Closing soon carousel (only on first page with no active search) */}
                        {showClosingSoon && closingSoon.length > 0 && (
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
                                <div className="flex gap-4 overflow-x-auto p-8 -mx-8 px-8 scrollbar-hide snap-x">
                                    {closingSoon.slice(0, 5).map((bando: Bando, i: number) => (
                                        <m.div
                                            key={bando.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                        >
                                            <BandoCard
                                                bando={bando}
                                                variant="featured"
                                            />
                                        </m.div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Main list */}
                        <section>
                            {showClosingSoon && closingSoon.length > 0 && (
                                <h2 className="text-[17px] font-black text-[var(--foreground)] tracking-tight mb-4">
                                    Tutti i bandi
                                </h2>
                            )}
                            <div className="space-y-3">
                                <AnimatePresence mode="popLayout">
                                    {bandi.map((bando: Bando, i: number) => (
                                        <m.div
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
                                        </m.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            {/* Load more */}
                            {hasNextPage && (
                                <Button
                                    variant="secondary"
                                    size="lg"
                                    fullWidth
                                    className="mt-6 border-slate-200 dark:border-slate-800"
                                    onClick={handleLoadMore}
                                    isLoading={isFetchingNextPage}
                                >
                                    Carica altri ({totalCount - bandi.length} rimasti)
                                </Button>
                            )}
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}
