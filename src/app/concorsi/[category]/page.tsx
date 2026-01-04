import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useConcorsoData } from '@/hooks/useConcorsoData';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, Info, Trophy, Users, Calendar, ArrowRight, Shield, Sparkles, X, ChevronRight, Stethoscope, Briefcase, Scale, Gavel, GraduationCap, Car } from 'lucide-react';

// =============================================================================
// CONCORSO HUB PAGE - Tier S Redesign
// "The Destination"
// =============================================================================
export default function ConcorsoHubPage() {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { category: categoryData, roles, candidatiCount, loading, error } = useConcorsoData(category || '');

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00B1FF] border-t-transparent rounded-full animate-spin" />
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

  // Helper for dynamic gradients based on category
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
      {/* ===================================================================== */}
      {/* 1. IMMERSIVE HEADER */}
      {/* ===================================================================== */}
      <div className="relative h-[35vh] min-h-[300px] md:h-[45vh] md:min-h-[380px] overflow-hidden">
        {/* Background Image with Zoom Effect */}
        <div className="absolute inset-0">
          {categoryData.inner_banner_url ? (
            <img
              src={categoryData.inner_banner_url}
              alt={categoryData.title}
              className="w-full h-full object-cover animate-in fade-in zoom-in duration-1000 scale-[1.02]"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${theme.gradient}`} />
          )}
          {/* Gradients overlays for text readability */}
          <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/80 to-transparent" />
          <div className="absolute inset-0 bg-black/10" />
        </div>

        {/* Navigation Bar (Absolute) */}
        <div className="absolute top-0 left-0 right-0 z-20 pt-safe px-4">
          <div className="h-14 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-slate-900 border border-white/30 hover:bg-white/40 transition-all shadow-sm"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            {/* Optional: Add search or share button right */}
          </div>
        </div>

        {/* Header Content */}
        <div className="absolute bottom-0 left-0 right-0 z-10 px-6 pb-12 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--card)]/60 backdrop-blur-md border border-[var(--card-border)] shadow-sm mb-4">
            <Sparkles className={`w-3.5 h-3.5 ${theme.text}`} fill="currentColor" />
            <span className={`text-[11px] font-bold uppercase tracking-wider ${theme.text}`}>
              Concorsi Pubblici 2025
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-[var(--foreground)] tracking-tight leading-[1.1] mb-3 drop-shadow-sm">
            {categoryData.title}
          </h1>

          <p className="text-[14px] md:text-[15px] font-medium text-[var(--foreground)] opacity-60 max-w-md mx-auto leading-relaxed line-clamp-2">
            {categoryData.description || "Preparati al meglio per i concorsi di questa categoria con simulazioni ufficiali e materiali dedicati."}
          </p>
        </div>
      </div>

      <main className="px-4 md:px-8 max-w-7xl mx-auto -mt-6 relative z-20 space-y-8">

        {/* ===================================================================== */}
        {/* 2. STATS AT A GLANCE (Responsive: Scroll Mobile / Grid Desktop) */}
        {/* ===================================================================== */}
        <StatsSection
          theme={theme}
          candidatiCount={candidatiCount}
          availableSeats={categoryData.available_seats}
        />

        {/* ===================================================================== */}
        {/* 3. ROLES GRID (Organic) */}
        {/* ===================================================================== */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[17px] md:text-[19px] font-bold text-[var(--foreground)] flex items-center gap-2">
              <GridIcon />
              Scegli il tuo profilo
            </h2>
            <span className="text-[11px] md:text-[13px] font-medium text-[var(--foreground)] opacity-50 bg-[var(--card)] px-2.5 py-1 rounded-full shadow-sm border border-[var(--card-border)]">
              {roles.length} disponibili
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {roles.length > 0 ? (
              roles.map(role => {
                // Initial helper
                const initials = role.title
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase();



                // Dynamic Icon Helper
                const getCategoryIcon = (title: string) => {
                  const lower = title.toLowerCase();
                  if (lower.includes('sanità') || lower.includes('infermier') || lower.includes('medic')) return Stethoscope;
                  if (lower.includes('finanza') || lower.includes('banca') || lower.includes('econom')) return Scale;
                  if (lower.includes('amministra') || lower.includes('comun') || lower.includes('regione')) return Briefcase;
                  if (lower.includes('giustizia') || lower.includes('magistrat')) return Gavel;
                  if (lower.includes('scuola') || lower.includes('docent')) return GraduationCap;
                  if (lower.includes('patente') || lower.includes('guida')) return Car;
                  return Shield; // Default for Police/Military
                };

                const CategoryIcon = getCategoryIcon(categoryData.title);

                return (
                  <Link
                    key={role.id}
                    to={`/concorsi/${category}/${role.slug}`}
                    className="group relative bg-[#1e2330] p-4 rounded-[24px] shadow-sm border border-[var(--card-border)] transition-all duration-300 hover:bg-[#252b3b] overflow-hidden flex items-center gap-4"
                  >
                    {/* Icon Avatar */}
                    <div className="w-12 h-12 rounded-full border border-sky-500/20 bg-[#141820] flex items-center justify-center shrink-0">
                      <CategoryIcon className="w-5 h-5 text-sky-400" />
                    </div>

                    {/* Text Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[16px] font-bold text-white mb-2 leading-snug truncate">
                        {role.title}
                      </h3>

                      {/* Badge Row */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Active Users Badge */}
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#141820] border border-white/5">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-[12px] font-medium text-slate-300">
                            {role.activeUsers || 0} <span className="hidden sm:inline text-slate-500">attivi</span>
                          </span>
                        </div>

                        {/* Seats Badge (if available) - Taking first active contest's seats */}
                        {role.contests[0]?.available_seats && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-[12px] font-medium text-emerald-400">
                              {role.contests[0].available_seats} <span className="hidden sm:inline">posti</span>
                            </span>
                          </div>
                        )}

                        {/* Year Badge */}
                        {role.contests[0]?.year && (
                          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
                            <Calendar className="w-3.5 h-3.5 text-purple-400" />
                            <span className="text-[12px] font-medium text-purple-400">
                              {role.contests[0].year}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Chevy */}
                    <div className="text-slate-500 group-hover:text-white transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="py-12 text-center bg-[var(--card)] rounded-[32px] border border-[var(--card-border)] border-dashed">
                <div className="text-4xl mb-4 opacity-50">📭</div>
                <p className="text-[var(--foreground)] opacity-60 font-medium">
                  Nessun ruolo disponibile per questa categoria al momento.
                </p>
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}



// Stats Section Component with Popups
function StatsSection({ theme, candidatiCount, availableSeats }: { theme: any, candidatiCount: number, availableSeats: string | null }) {
  const [selectedStat, setSelectedStat] = React.useState<{ title: string, desc: string, icon: any } | null>(null);

  const stats = [
    {
      id: 'candidati',
      value: candidatiCount,
      label: 'Candidati',
      icon: Users,
      themeBg: theme.bg,
      themeText: theme.text,
      description: "Il numero totale di utenti unici che hanno partecipato alle simulazioni per i concorsi di questa categoria."
    },
    {
      id: 'posti',
      value: availableSeats || "N/D",
      label: 'Posti Totali',
      icon: Trophy,
      themeBg: 'bg-emerald-50 dark:bg-emerald-900/30',
      themeText: 'text-emerald-600 dark:text-emerald-400',
      description: "Il numero complessivo di posti messi a bando per i concorsi attivi in questa categoria."
    },
    {
      id: 'edizione',
      value: new Date().getFullYear(),
      label: 'Edizione',
      icon: Calendar,
      themeBg: 'bg-purple-50 dark:bg-purple-900/30',
      themeText: 'text-purple-600 dark:text-purple-400',
      description: "L'anno di riferimento per i concorsi attualmente mostrati in questa sezione."
    }
  ];

  return (
    <>
      <section className="flex md:grid md:grid-cols-3 gap-2.5 md:gap-4 overflow-x-auto md:overflow-visible pb-4 md:pb-0 -mx-4 md:mx-0 px-4 md:px-0 scrollbar-hide snap-x md:snap-none">
        {stats.map((stat) => (
          <div
            key={stat.id}
            onClick={() => setSelectedStat({ title: stat.label, desc: stat.description, icon: stat.icon })}
            className="cursor-pointer active:scale-95 transition-transform snap-start flex-1 min-w-[100px] md:w-auto bg-[var(--card)] rounded-2xl p-3 md:p-5 shadow-soft border border-[var(--card-border)] flex flex-col items-center justify-center gap-1 md:gap-2 hover:border-[#00B1FF]/30"
          >
            <div className={`w-7 h-7 md:w-10 md:h-10 rounded-full ${stat.themeBg} flex items-center justify-center mb-1`}>
              <stat.icon className={`w-3.5 h-3.5 md:w-5 md:h-5 ${stat.themeText}`} />
            </div>
            <div className="text-center">
              <span className="block text-xl md:text-3xl font-bold text-[var(--foreground)] leading-none mb-1">{stat.value}</span>
              <span className="block text-[10px] md:text-[12px] font-semibold text-[var(--foreground)] opacity-50 uppercase tracking-wide">{stat.label}</span>
            </div>
          </div>
        ))}
      </section>

      {/* Popup Modal */}
      <AnimatePresence>
        {selectedStat && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 px-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStat(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-[var(--card)] border border-[var(--card-border)] rounded-[24px] p-6 max-w-sm w-full shadow-2xl text-center"
            >
              <button
                onClick={() => setSelectedStat(null)}
                className="absolute top-4 right-4 p-2 bg-[var(--background)] rounded-full text-[var(--foreground)] opacity-50 hover:opacity-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className={`w-16 h-16 rounded-2xl ${selectedStat.themeBg} flex items-center justify-center mx-auto mb-4`}>
                {React.createElement(selectedStat.icon, { className: `w-8 h-8 ${selectedStat.themeText}` })}
              </div>

              <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">{selectedStat.title}</h3>
              <p className="text-[var(--foreground)] opacity-70 text-[15px] leading-relaxed mb-6">
                {selectedStat.desc}
              </p>

              <button
                onClick={() => setSelectedStat(null)}
                className="w-full py-3 bg-[var(--foreground)] text-[var(--background)] rounded-xl font-bold hover:opacity-90 transition-opacity"
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

// Simple Grid Icon Component
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
