import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useRoleHubData } from "@/hooks/useRoleHubData";
import { ChevronLeft, Trophy, Puzzle, Clock, FileText, ExternalLink, Sparkles, ArrowRight, Play, BookOpen, Download, CheckCircle, Loader2, Users, Calendar, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { offlineService } from "@/lib/offlineService";

// =============================================================================
// ROLE DETAIL PAGE - Tier S Redesign
// "The Mission Control"
// =============================================================================
export default function RolePage() {
  const { category, role } = useParams<{ category: string; role: string }>();
  const navigate = useNavigate();

  const { role: roleData, resources, history, latestQuizId, latestQuizSlug, candidatiCount, loading, error } = useRoleHubData(category || "", role || "");

  // Offline State
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Check offline status on mount
  // Auto-Cache on mount
  useEffect(() => {
    const initAutoCache = async () => {
      if (latestQuizId && !isDownloaded && !downloading) {
        try {
          const alreadyCached = await offlineService.isQuizDownloaded(latestQuizId);
          setIsDownloaded(alreadyCached);

          if (!alreadyCached) {
            setDownloading(true);
            console.log(`[AutoCache] Starting download for ${latestQuizId}...`);
            await offlineService.downloadQuiz(latestQuizId, (p) => setProgress(p));
            setIsDownloaded(true);
            console.log(`[AutoCache] Completed.`);
          }
        } catch (err) {
          console.error("[AutoCache] Failed:", err);
        } finally {
          setDownloading(false);
        }
      }
    };

    initAutoCache();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestQuizId]);


  // Helper for dynamic gradients based on category (Consistent with Hub)
  const getCategoryTheme = (cat: string) => {
    const lower = cat.toLowerCase();
    if (lower.includes('polizia')) return { gradient: 'from-cyan-500 to-blue-600', shadow: 'shadow-cyan-500/20', text: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-400/10', button: 'bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700' };
    if (lower.includes('carabinieri')) return { gradient: 'from-blue-600 to-indigo-700', shadow: 'shadow-blue-500/20', text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-400/10', button: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700' };
    if (lower.includes('finanza')) return { gradient: 'from-amber-400 to-orange-500', shadow: 'shadow-amber-500/20', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-400/10', button: 'bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700' };
    if (lower.includes('esercito')) return { gradient: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-400/10', button: 'bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700' };
    if (lower.includes('sanità')) return { gradient: 'from-rose-500 to-pink-600', shadow: 'shadow-rose-500/20', text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-400/10', button: 'bg-rose-500 hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-700' };
    return { gradient: 'from-slate-500 to-slate-700', shadow: 'shadow-slate-500/20', text: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-400/10', button: 'bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-800' };
  };

  const theme = getCategoryTheme(category || "");

  const handleStartSimulation = async () => {
    if (!latestQuizId) return alert("Nessun simulatore disponibile per questo ruolo.");

    if (!navigator.onLine) {
      const hasOffline = await offlineService.isQuizDownloaded(latestQuizId);
      if (hasOffline) {
        try {
          const localAttemptId = await offlineService.createLocalAttempt(latestQuizId);
          navigate(`/quiz/run/${localAttemptId}`);
          return;
        } catch (e) {
          console.error(e);
          return alert("Errore creazione sessione offline.");
        }
      } else {
        return alert("Sei offline e non hai scaricato questa banca dati.");
      }
    }

    navigate(`/quiz/${latestQuizId}/official`);
  };

  const handleCustomQuiz = () => {
    if (!latestQuizSlug) return alert("Nessun simulatore disponibile.");
    navigate(`/concorsi/${category}/${role}/${latestQuizSlug}/custom`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00B1FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !roleData) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center px-6">
        <div className="text-5xl mb-4">😕</div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Ruolo non trovato</h1>
        <p className="text-slate-500 text-center mb-6">{error || "Questo ruolo non esiste."}</p>
        <Link to="/" className="text-[#00B1FF] font-semibold">← Torna alla Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[var(--background)] pb-24 transition-colors duration-300">
      {/* ===================================================================== */}
      {/* 1. IMMERSIVE HERO HEADER */}
      {/* ===================================================================== */}
      <div className="relative overflow-hidden bg-white dark:bg-[var(--card)] pb-6 md:pb-10 rounded-b-[32px] md:rounded-b-[40px] shadow-sm z-10 transition-colors">
        <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-[0.03] dark:opacity-[0.05]`} />

        {/* Nav */}
        <div className="relative z-20 pt-safe px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="text-[10px] md:text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {category?.replace(/-/g, ' ')}
          </span>
          <div className="w-10" /> {/* Spacer */}
        </div>

        <div className="px-5 md:px-6 pt-2 md:pt-4 relative z-10">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-[var(--foreground)] leading-[1.1] mb-2 md:mb-3">
            {roleData.title}
          </h1>
          <p className="text-[14px] md:text-[15px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl mb-4">
            {roleData.description || "Allenati per questo profilo con i nostri simulatori ufficiali."}
          </p>

          {/* Offline Download Button Removed per user request */}
        </div>
      </div>

      <main className="px-4 md:px-5 max-w-lg mx-auto -mt-6 relative z-20 space-y-5 md:space-y-6">

        {/* ===================================================================== */}
        {/* STATS SECTION (New) */}
        {/* ===================================================================== */}
        {roleData && (
          <StatsSection
            theme={theme}
            candidatiCount={candidatiCount}
            availableSeats={roleData.available_positions}
          />
        )}

        {/* ===================================================================== */}
        {/* 2. PRIMARY ACTIONS (Stacked Cards) */}
        {/* ===================================================================== */}

        {/* OFFICIAL SIMULATION */}
        <div onClick={handleStartSimulation} className="group relative bg-white dark:bg-[var(--card)] rounded-[32px] p-6 shadow-soft cursor-pointer hover:scale-[1.02] transition-all duration-300 overflow-hidden active:scale-[0.98] border border-transparent dark:border-[var(--card-border)]">
          {/* Decorator */}
          <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${theme.gradient} opacity-10 dark:opacity-20 rounded-bl-[100px] transition-transform group-hover:scale-110`} />

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-14 h-14 rounded-2xl ${theme.bg} dark:bg-opacity-10 flex items-center justify-center`}>
                <Trophy className={`w-7 h-7 ${theme.text} dark:text-opacity-80`} fill="currentColor" fillOpacity={0.2} />
              </div>
              <div className={`px-3 py-1 rounded-full ${theme.bg} dark:bg-opacity-10 ${theme.text} bg-opacity-50 text-[11px] font-bold uppercase tracking-wider`}>
                Ufficiale
              </div>
            </div>

            <h2 className="text-xl font-bold text-slate-900 dark:text-[var(--foreground)] mb-1">Simulazione Ufficiale</h2>
            <p className="text-slate-500 dark:text-slate-400 text-[14px] leading-snug mb-6 max-w-[80%]">
              Replica l'esame reale con timer, punteggi e modalità ufficiali.
            </p>

            <button className={`w-full py-3.5 rounded-xl ${theme.button} text-white font-bold text-[15px] shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-transform`}>
              <Play className="w-4 h-4 fill-current" />
              Avvia Simulazione
            </button>
          </div>
        </div>

        {/* CUSTOM PRACTICE */}
        <div onClick={handleCustomQuiz} className="group relative bg-white dark:bg-[var(--card)] rounded-[32px] p-6 shadow-soft cursor-pointer hover:scale-[1.02] transition-all duration-300 overflow-hidden active:scale-[0.98] border border-transparent dark:border-[var(--card-border)]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-400 to-fuchsia-500 opacity-5 dark:opacity-10 rounded-bl-[100px]" />

          <div className="relative z-10 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
              <Puzzle className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-[17px] font-bold text-slate-900 dark:text-[var(--foreground)]">Prova Personalizzata</h2>
              <p className="text-slate-500 dark:text-slate-400 text-[13px] leading-tight mt-1">
                Scegli materie e n. domande.
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 transition-colors">
              <ArrowRight className="w-5 h-5 text-slate-400 dark:text-slate-500 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 3. HISTORY & RESOURCES (Inset Lists) */}
        {/* ===================================================================== */}

        {/* HISTORY SECTION */}
        <div className="space-y-3">
          <h3 className="text-[13px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2">
            Le tue attività
          </h3>
          <div className="bg-white dark:bg-[var(--card)] rounded-[24px] overflow-hidden shadow-sm border border-slate-100/50 dark:border-slate-800">
            {history.length > 0 ? (
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {history.slice(0, 3).map((attempt) => (
                  <Link key={attempt.id} to={`/quiz/results/${attempt.id}`} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${attempt.score >= 18 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                        <span className="text-[13px] font-bold">{attempt.score.toFixed(0)}</span>
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-slate-900 dark:text-[var(--foreground)]">
                          {attempt.is_official_sim ? "Simulazione" : "Pratica"}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          {new Date(attempt.created_at).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-slate-300 dark:text-slate-600 rotate-180" />
                  </Link>
                ))}
                <Link to="#" className="block p-3 text-center text-[13px] font-medium text-[#00B1FF] bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Vedi tutta la cronologia
                </Link>
              </div>
            ) : (
              <div className="p-6 text-center">
                <Clock className="w-8 h-8 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-[13px] text-slate-400 dark:text-slate-500">Nessuna attività recente</p>
              </div>
            )}
          </div>
        </div>

        {/* RESOURCES SECTION */}
        <div className="space-y-3">
          <h3 className="text-[13px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2">
            Materiali & Link
          </h3>
          <div className="bg-white dark:bg-[var(--card)] rounded-[24px] overflow-hidden shadow-sm border border-slate-100/50 dark:border-slate-800">
            {resources.length > 0 ? (
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {resources.map(res => (
                  <a key={res.id} href={res.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-500 dark:text-orange-400">
                      {res.type === 'pdf' ? <FileText className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                    </div>
                    <span className="text-[14px] font-medium text-slate-700 dark:text-slate-300 flex-1 truncate">{res.title}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                  </a>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <BookOpen className="w-8 h-8 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-[13px] text-slate-400 dark:text-slate-500">Nessun materiale disponibile</p>
              </div>
            )}
          </div>

          {roleData.share_bank_link && (
            <a href={roleData.share_bank_link} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-4 rounded-[24px] bg-[#00B1FF]/10 dark:bg-[#00B1FF]/20 text-[#00B1FF] font-bold text-[14px] hover:bg-[#00B1FF]/20 dark:hover:bg-[#00B1FF]/30 transition-colors">
              <Sparkles className="w-4 h-4" />
              Banca Dati Ufficiale
            </a>
          )}
        </div>

      </main>
    </div >
  );
}

// Stats Section Component (Consistent with Hub)
function StatsSection({ theme, candidatiCount, availableSeats }: { theme: any, candidatiCount: number, availableSeats: string | null }) {
  const [selectedStat, setSelectedStat] = useState<{ title: string, desc: string, icon: any, themeBg: string, themeText: string } | null>(null);

  const stats = [
    {
      id: 'candidati',
      value: candidatiCount,
      label: 'Candidati',
      icon: Users,
      themeBg: theme.bg,
      themeText: theme.text,
      description: "Il numero totale di utenti unici che hanno partecipato alle simulazioni per questo profilo."
    },
    {
      id: 'posti',
      value: availableSeats || "N/D",
      label: 'Posti Totali',
      icon: Trophy,
      themeBg: 'bg-emerald-50 dark:bg-emerald-900/30',
      themeText: 'text-emerald-600 dark:text-emerald-400',
      description: "Il numero complessivo di posti messi a bando per questo profilo specifico."
    },
    {
      id: 'edizione',
      value: new Date().getFullYear(), // Could be dynamic based on contest year
      label: 'Edizione',
      icon: Calendar,
      themeBg: 'bg-purple-50 dark:bg-purple-900/30',
      themeText: 'text-purple-600 dark:text-purple-400',
      description: "L'anno di riferimento per i concorsi attualmente attivi per questo profilo."
    }
  ];

  return (
    <>
      <section className="flex md:grid md:grid-cols-3 gap-2.5 md:gap-4 overflow-x-auto md:overflow-visible pb-1 md:pb-0 -mx-4 md:mx-0 px-4 md:px-0 scrollbar-hide snap-x md:snap-none">
        {stats.map((stat) => (
          <div
            key={stat.id}
            onClick={() => setSelectedStat({
              title: stat.label,
              desc: stat.description,
              icon: stat.icon,
              themeBg: stat.themeBg,
              themeText: stat.themeText
            })}
            className="cursor-pointer active:scale-95 transition-transform snap-start flex-1 min-w-[100px] md:w-auto bg-white dark:bg-[var(--card)] rounded-2xl p-3 md:p-4 shadow-soft border border-transparent dark:border-[var(--card-border)] flex flex-col items-center justify-center gap-1 md:gap-2 hover:border-[#00B1FF]/30"
          >
            <div className={`w-8 h-8 rounded-full ${stat.themeBg} flex items-center justify-center mb-1`}>
              <stat.icon className={`w-4 h-4 ${stat.themeText}`} />
            </div>
            <div className="text-center">
              <span className="block text-lg md:text-xl font-bold text-slate-900 dark:text-[var(--foreground)] leading-none mb-1">{stat.value}</span>
              <span className="block text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">{stat.label}</span>
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
              className="relative bg-white dark:bg-[var(--card)] border border-transparent dark:border-[var(--card-border)] rounded-[24px] p-6 max-w-sm w-full shadow-2xl text-center"
            >
              <button
                onClick={() => setSelectedStat(null)}
                className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 opacity-50 hover:opacity-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className={`w-16 h-16 rounded-2xl ${selectedStat.themeBg} flex items-center justify-center mx-auto mb-4`}>
                {React.createElement(selectedStat.icon, { className: `w-8 h-8 ${selectedStat.themeText}` })}
              </div>

              <h3 className="text-xl font-bold text-slate-900 dark:text-[var(--foreground)] mb-2">{selectedStat.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-[15px] leading-relaxed mb-6">
                {selectedStat.desc}
              </p>

              <button
                onClick={() => setSelectedStat(null)}
                className="w-full py-3 bg-slate-900 dark:bg-[var(--foreground)] text-white dark:text-[var(--background)] rounded-xl font-bold hover:opacity-90 transition-opacity"
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
