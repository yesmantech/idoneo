/**
 * @file ConcorsoHubPage.tsx
 * @description The main landing page for a specific competition category (e.g. "Polizia").
 */

import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useConcorsoData } from '@/hooks/useConcorsoData';
import { getContestBySlug } from '@/lib/data';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, Info, Trophy, Users, Calendar, ArrowRight, Sparkles, X, ChevronRight } from 'lucide-react';
import { getCategoryStyle } from '@/lib/categoryIcons';
import TierSLoader from '@/components/ui/TierSLoader';
import SEOHead from '@/components/seo/SEOHead';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export default function ConcorsoHubPage() {
  const queryClient = useQueryClient();
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { category: categoryData, quizzes: allQuizzes, candidatiCount, loading, error } = useConcorsoData(category || '');

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] pb-24">
        {/* Skeleton Hero Banner */}
        <div className="relative h-[35vh] min-h-[300px] overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 animate-pulse">
          <div className="absolute bottom-0 left-0 right-0 z-10 px-6 pb-12 text-center space-y-3">
            <div className="w-40 h-6 bg-white/30 rounded-full mx-auto" />
            <div className="w-64 h-10 bg-white/20 rounded-lg mx-auto" />
            <div className="w-48 h-4 bg-white/15 rounded mx-auto" />
          </div>
        </div>
        <main className="px-4 max-w-7xl mx-auto -mt-6 relative z-20 space-y-8">
          {/* Skeleton Stats */}
          <div className="flex gap-2.5">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex-1 bg-[var(--card)] rounded-2xl p-4 border border-[var(--card-border)] flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse" />
                <div className="w-12 h-6 bg-slate-100 rounded animate-pulse" />
                <div className="w-16 h-3 bg-slate-50 rounded animate-pulse" />
              </div>
            ))}
          </div>
          {/* Skeleton Quiz Cards */}
          <div className="space-y-3">
            <div className="w-48 h-6 bg-slate-200 rounded-lg animate-pulse" />
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-[#1e2330] p-4 rounded-[24px] border border-slate-200/60 flex items-center gap-4 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="w-40 h-5 bg-slate-100 rounded" />
                  <div className="w-24 h-4 bg-slate-50 rounded" />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (error || !categoryData) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center px-6">
        <div className="text-5xl mb-4">😕</div>
        <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">Categoria non trovata</h1>
        <p className="text-[var(--foreground)] opacity-50 text-center mb-6">{error || "Questa categoria non esiste o è stata rimossa."}</p>
        <Link to="/" className="text-[#00B1FF] font-semibold hover:underline">← Torna alla Home</Link>
      </div>
    );
  }

  const getCategoryTheme = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes('polizia')) return { gradient: 'from-cyan-400 to-blue-500', shadow: 'shadow-cyan-500/20', text: 'text-cyan-600', bg: 'bg-cyan-50' };
    if (lower.includes('carabinieri')) return { gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/20', text: 'text-blue-600', bg: 'bg-blue-50' };
    if (lower.includes('finanza')) return { gradient: 'from-amber-400 to-orange-500', shadow: 'shadow-amber-500/20', text: 'text-amber-600', bg: 'bg-amber-50' };
    if (lower.includes('esercito')) return { gradient: 'from-emerald-400 to-green-600', shadow: 'shadow-emerald-500/20', text: 'text-emerald-600', bg: 'bg-emerald-50' };
    if (lower.includes('sanità')) return { gradient: 'from-rose-400 to-pink-600', shadow: 'shadow-rose-500/20', text: 'text-rose-600', bg: 'bg-rose-50' };
    return { gradient: 'from-slate-400 to-slate-600', shadow: 'shadow-slate-500/20', text: 'text-slate-600', bg: 'bg-slate-50' };
  };

  const theme = getCategoryTheme(categoryData.title);

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24 transition-colors duration-300">
      <SEOHead
        title={`${categoryData.title} | Concorsi 2026`}
        description={`Scopri tutti i concorsi per ${categoryData.title}. Preparati con simulatori ufficiali e statistiche avanzate.`}
        url={`/concorsi/${category}`}
      />
      <div className="relative h-[25vh] min-h-[200px] md:h-[40vh] md:min-h-[340px] overflow-hidden">
        {/* Category gradient background — always visible */}
        <div className="absolute inset-0">
          <div className={`w-full h-full bg-gradient-to-br ${theme.gradient}`} />
          <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/80 to-transparent" />
          <div className="absolute inset-0 bg-black/5" />
        </div>

        {/* Back button */}
        <div className="absolute top-0 left-0 right-0 z-20 pt-safe px-4">
          <div className="h-14 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/40 text-white border border-white/30 hover:bg-white/50 transition-all shadow-sm"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Logo + text content */}
        <div className="absolute bottom-0 left-0 right-0 z-10 px-6 pb-8 text-center">
          {/* Uploaded logo image */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 border border-white/20 shadow-sm mb-3">
            <Sparkles className="w-3.5 h-3.5 text-white" fill="currentColor" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-white">
              Concorsi Pubblici 2026
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-[var(--foreground)] tracking-tight leading-[1.1] mb-2 drop-shadow-sm">
            {categoryData.title}
          </h1>
          <p className="text-[14px] md:text-[15px] font-medium text-[var(--foreground)] opacity-60 max-w-md mx-auto leading-relaxed line-clamp-2">
            {categoryData.description || "Preparati al meglio per i concorsi di questa categoria con simulazioni ufficiali e materiali dedicati."}
          </p>
        </div>
      </div>

      <main className="px-4 md:px-8 max-w-7xl mx-auto -mt-6 relative z-20 space-y-8">
        <StatsSection
          theme={theme}
          candidatiCount={candidatiCount}
          availableSeats={String(categoryData.available_seats || 0)}
        />

        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] md:text-[19px] font-bold text-[var(--foreground)] flex items-center gap-2">
                <GridIcon />
                Scegli il tuo concorso
              </h2>
              <span className="text-[11px] md:text-[13px] font-medium text-[var(--foreground)] opacity-50 bg-[var(--card)] px-2.5 py-1 rounded-full shadow-sm border border-[var(--card-border)]">
                {allQuizzes.length}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {(() => {
              const catStyle = getCategoryStyle(category.replace(/-/g, ' '));
              const CategoryIcon = catStyle.Icon;
              return allQuizzes.length > 0 ? (
                allQuizzes.map(quiz => {

                  return (
                    <Link
                      key={quiz.id}
                      to={`/concorsi/${category}/${quiz.slug}`}
                      onMouseEnter={() => {
                        queryClient.prefetchQuery({
                          queryKey: ['contest', quiz.slug],
                          queryFn: () => getContestBySlug(quiz.slug),
                          staleTime: 1000 * 60 * 5,
                        });
                      }}
                      className="group relative bg-white dark:bg-[#1e2330] p-4 rounded-[20px] border border-slate-200/60 dark:border-white/[0.06] transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] shadow-[0_1px_12px_-3px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_12px_-3px_rgba(0,0,0,0.25)] hover:shadow-[0_4px_24px_-6px_rgba(0,177,255,0.15)] dark:hover:shadow-[0_4px_24px_-6px_rgba(0,177,255,0.1)] overflow-hidden flex items-center gap-4"
                    >
                      {/* Accent gradient line */}
                      <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-gradient-to-b from-[#00B1FF] to-[#0066FF] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300"
                        style={{ backgroundColor: catStyle.bgLight }}
                      >
                        <CategoryIcon className="w-5 h-5" style={{ color: catStyle.color }} strokeWidth={1.8} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[15px] font-bold text-slate-900 dark:text-white mb-1.5 leading-snug truncate">
                          {quiz.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100/80 dark:bg-white/[0.06] border border-slate-200/50 dark:border-white/[0.04]">
                            <Users className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                              {(quiz as any).activeUsers || 0}
                            </span>
                          </div>
                          {quiz.available_seats && (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50/80 dark:bg-emerald-500/[0.08] border border-emerald-100/50 dark:border-emerald-500/10">
                              <Trophy className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                {quiz.available_seats} {Number(quiz.available_seats) === 1 ? 'posto' : 'posti'}
                              </span>
                            </div>
                          )}
                          {quiz.year && (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50/80 dark:bg-violet-500/[0.08] border border-violet-100/50 dark:border-violet-500/10">
                              <Calendar className="w-3 h-3 text-violet-500 dark:text-violet-400" />
                              <span className="text-[11px] font-semibold text-violet-600 dark:text-violet-400">
                                {quiz.year}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-slate-300 dark:text-slate-600 group-hover:text-[#00B1FF] transition-colors duration-300">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="py-12 text-center bg-[var(--card)] rounded-[32px] border border-[var(--card-border)] border-dashed">
                  <div className="text-4xl mb-4 opacity-50">📭</div>
                  <p className="text-[var(--foreground)] opacity-60 font-medium">
                    Nessun concorso disponibile per questa categoria al momento.
                  </p>
                </div>
              )
            })()}
          </div>
        </section>
      </main>
    </div>
  );
}

function StatsSection({ theme, candidatiCount, availableSeats }: { theme: any, candidatiCount: number, availableSeats: string | undefined }) {
  const [selectedStat, setSelectedStat] = React.useState<{ title: string, desc: string, icon: any, iconBg: string, iconColor: string } | null>(null);

  // Lock body scroll when modal is open (iOS Safari fix)
  React.useEffect(() => {
    if (selectedStat) {
      const scrollY = window.scrollY;
      const html = document.documentElement;
      html.style.overflow = 'hidden';
      html.style.height = '100%';
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100%';
      return () => {
        html.style.overflow = '';
        html.style.height = '';
        document.body.style.overflow = '';
        document.body.style.height = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [selectedStat]);

  const stats = [
    {
      id: 'candidati',
      value: candidatiCount,
      label: 'Candidati',
      icon: Users,
      gradient: 'from-sky-400 to-blue-500',
      iconBg: 'bg-gradient-to-br from-sky-400/15 to-blue-500/15 dark:from-sky-400/20 dark:to-blue-500/20',
      iconColor: 'text-sky-500 dark:text-sky-400',
      description: "Il numero totale di utenti unici che hanno partecipato alle simulazioni per i concorsi di questa categoria.",
      themeBg: theme.bg,
      themeText: theme.text,
    },
    {
      id: 'posti',
      value: availableSeats || "N/D",
      label: 'Posti Totali',
      icon: Trophy,
      gradient: 'from-emerald-400 to-green-500',
      iconBg: 'bg-gradient-to-br from-emerald-400/15 to-green-500/15 dark:from-emerald-400/20 dark:to-green-500/20',
      iconColor: 'text-emerald-500 dark:text-emerald-400',
      description: "Il numero complessivo di posti messi a bando per i concorsi attivi in questa categoria.",
      themeBg: 'bg-emerald-50 dark:bg-emerald-900/30',
      themeText: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      id: 'edizione',
      value: new Date().getFullYear(),
      label: 'Ultima Edizione',
      icon: Calendar,
      gradient: 'from-violet-400 to-purple-500',
      iconBg: 'bg-gradient-to-br from-violet-400/15 to-purple-500/15 dark:from-violet-400/20 dark:to-purple-500/20',
      iconColor: 'text-violet-500 dark:text-violet-400',
      description: "L'anno di riferimento per i concorsi attualmente mostrati in questa sezione.",
      themeBg: 'bg-purple-50 dark:bg-purple-900/30',
      themeText: 'text-purple-600 dark:text-purple-400',
    }
  ];

  return (
    <>
      <section className="flex md:grid md:grid-cols-3 gap-3 md:gap-4 overflow-x-auto md:overflow-visible pb-4 md:pb-0 -mx-4 md:mx-0 px-4 md:px-0 scrollbar-hide snap-x md:snap-none">
        {stats.map((stat) => (
          <div
            key={stat.id}
            onClick={() => setSelectedStat({
              title: stat.label,
              desc: stat.description,
              icon: stat.icon,
              iconBg: stat.iconBg,
              iconColor: stat.iconColor
            })}
            className="cursor-pointer active:scale-[0.97] transition-all duration-200 snap-start flex-1 min-w-[110px] md:w-auto rounded-2xl p-4 md:p-5 flex flex-col items-center justify-center gap-2 md:gap-3 bg-white dark:bg-[#1a1a2e] border border-slate-200/60 dark:border-white/[0.08] shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_16px_-4px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]"
          >
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl ${stat.iconBg} flex items-center justify-center`}>
              <stat.icon className={`w-5 h-5 md:w-6 md:h-6 ${stat.iconColor}`} strokeWidth={1.8} />
            </div>
            <div className="text-center">
              <span className="block text-2xl md:text-3xl font-extrabold text-[var(--foreground)] leading-none mb-1 tracking-tight">{stat.value}</span>
              <span className="block text-[10px] md:text-[11px] font-bold text-[var(--foreground)]/40 uppercase tracking-widest">{stat.label}</span>
            </div>
          </div>
        ))}
      </section>

      <AnimatePresence>
        {selectedStat && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 px-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStat(null)}
              className="absolute inset-0 bg-black/60"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="relative bg-white dark:bg-[#1a1a2e] border border-slate-200/60 dark:border-white/[0.08] rounded-[28px] p-8 max-w-sm w-full shadow-[0_24px_80px_-12px_rgba(0,0,0,0.25)] dark:shadow-[0_24px_80px_-12px_rgba(0,0,0,0.6)] text-center"
            >
              <button
                onClick={() => setSelectedStat(null)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/[0.08] hover:bg-black/10 dark:hover:bg-white/[0.15] transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>

              <div className={`w-16 h-16 rounded-3xl ${selectedStat.iconBg} flex items-center justify-center mx-auto mb-5 shadow-sm`}>
                {React.createElement(selectedStat.icon, { className: `w-8 h-8 ${selectedStat.iconColor}`, strokeWidth: 1.8 })}
              </div>

              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">{selectedStat.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-[15px] leading-relaxed mb-8">
                {selectedStat.desc}
              </p>

              <button
                onClick={() => setSelectedStat(null)}
                className="w-full py-3.5 bg-brand-blue text-white rounded-2xl font-bold text-[15px] hover:opacity-90 active:scale-[0.98] transition-all duration-200"
              >
                Ho capito
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function GridIcon() {
  return (
    <svg className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
    </svg>
  );
}
