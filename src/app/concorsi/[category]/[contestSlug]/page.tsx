import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getContestBySlug, type Contest } from "@/lib/data";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import {
  ChevronLeft, Trophy, Puzzle, Clock, Clipboard,
  BookOpen, Share2
} from "lucide-react";
import ReadinessCard from "@/components/role/ReadinessCard";
import { Button } from "@/components/ui/Button";
import { useQuery } from "@tanstack/react-query";

export default function ContestPage() {
  const { category, contestSlug } = useParams<{ category: string; contestSlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Contest data — cached for 5 min, instant on repeat visits
  const { data: contest, isLoading: loading } = useQuery({
    queryKey: ['contest', contestSlug],
    queryFn: () => getContestBySlug(contestSlug || ''),
    enabled: !!contestSlug,
    staleTime: 1000 * 60 * 5,
  });

  // Attempts — cached separately, loads independently
  const { data: attempts = [] } = useQuery({
    queryKey: ['contest-attempts', contest?.id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('quiz_id', contest!.id)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!contest?.id && !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-black pb-20 font-sans text-slate-900 dark:text-white">
      <div className="sticky top-0 z-30 bg-[#F8FAFC]/90 dark:bg-black/90 backdrop-blur-md px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4 flex items-center gap-1">
        <div className="w-20 h-5 bg-slate-200 dark:bg-white/[0.06] rounded-full animate-pulse" />
      </div>
      <div className="px-5 space-y-6">
        <div className="w-3/4 h-8 bg-slate-200 dark:bg-white/[0.06] rounded-lg animate-pulse" />
        <div className="bg-white dark:bg-[#1C1C1E] rounded-[20px] p-5 shadow-sm border border-slate-100/50 dark:border-white/[0.06] space-y-2">
          <div className="w-full h-4 bg-slate-100 dark:bg-white/[0.04] rounded animate-pulse" />
          <div className="w-2/3 h-4 bg-slate-100 dark:bg-white/[0.04] rounded animate-pulse" />
        </div>
        <div className="bg-white dark:bg-[#1C1C1E] rounded-[24px] p-6 shadow-sm border border-slate-100 dark:border-white/[0.06] space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/[0.04] animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="w-40 h-5 bg-slate-100 dark:bg-white/[0.04] rounded animate-pulse" />
              <div className="w-60 h-4 bg-slate-50 dark:bg-white/[0.04] rounded animate-pulse" />
            </div>
          </div>
          <div className="w-full h-12 bg-slate-100 dark:bg-white/[0.04] rounded-2xl animate-pulse" />
        </div>
        <div className="bg-white dark:bg-[#1C1C1E] rounded-[24px] p-6 shadow-sm border border-slate-100 dark:border-white/[0.06] space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/[0.04] animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="w-36 h-5 bg-slate-100 dark:bg-white/[0.04] rounded animate-pulse" />
              <div className="w-52 h-4 bg-slate-50 dark:bg-white/[0.04] rounded animate-pulse" />
            </div>
          </div>
          <div className="w-full h-12 bg-slate-100 dark:bg-white/[0.04] rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  );

  if (!contest) return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-black flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Concorso non trovato</h1>
      <button onClick={() => navigate(-1)} className="text-[#00B1FF] font-medium hover:underline">
        ← Torna indietro
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-black pb-20 font-sans text-slate-900 dark:text-white">

      {/* 1. TOP BAR */}
      <div className="sticky top-0 z-30 bg-[#F8FAFC]/90 dark:bg-black/90 backdrop-blur-md px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4 flex items-center gap-1 border-b border-transparent transition-all">
        <button
          onClick={() => navigate(-1)}
          className="p-1 -ml-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-white/[0.06] transition-colors flex items-center text-slate-500 dark:text-white/50"
        >
          <ChevronLeft className="w-6 h-6" />
          <span className="text-[15px] font-medium uppercase tracking-wide ml-1">
            Indietro
          </span>
        </button>
      </div>

      <div className="px-5 space-y-6">

        {/* 2. HEADER */}
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A] dark:text-white tracking-tight leading-tight">
            {contest.title}
          </h1>
        </div>

        {/* 3. DESCRIPTION CARD */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-[20px] p-5 shadow-[0_2px_15px_rgba(0,0,0,0.03)] dark:shadow-none border border-slate-100/50 dark:border-white/[0.06]">
          <p className={`${contest.description ? 'text-slate-600 dark:text-white/50' : 'text-slate-400 dark:text-white/25 italic'} text-[15px] leading-relaxed`}>
            {contest.description || "Nessuna descrizione inserita."}
          </p>
        </div>

        {/* 3.5 READINESS CARD */}
        {user && (
          <ReadinessCard
            history={attempts}
            theme={{ gradient: "from-[#00B1FF] to-[#00B1FF]" }}
          />
        )}

        {/* 4. ACTIONS */}
        <div className="space-y-4">

          {/* Official Simulation Card */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-white/[0.06] transition-transform active:scale-[0.99]">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-cyan-50 dark:bg-[#00B1FF]/10 flex items-center justify-center flex-shrink-0">
                <Trophy className="w-7 h-7 text-cyan-500 dark:text-[#00B1FF]" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Simulazione Ufficiale</h3>
                <p className="text-[14px] text-slate-500 dark:text-white/40 leading-snug">
                  Replica l'esame reale con timer e pesi ufficiali.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              fullWidth
              className="rounded-2xl"
              onClick={() => navigate(`/quiz/${contestSlug}/official`)}
            >
              Avvia Simulazione
            </Button>
          </div>

          {/* Custom Test Card */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-white/[0.06] transition-transform active:scale-[0.99]">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-[#8B5CF6]/10 flex items-center justify-center flex-shrink-0">
                <Puzzle className="w-7 h-7 text-purple-500 dark:text-[#8B5CF6]" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Prova Personalizzata</h3>
                <p className="text-[14px] text-slate-500 dark:text-white/40 leading-snug">
                  Allenati su argomenti specifici senza limiti di tempo.
                </p>
              </div>
            </div>
            <Button
              variant="vibrant-purple"
              fullWidth
              className="rounded-2xl"
              onClick={() => navigate(`/concorsi/${category}/${contestSlug}/custom`)}
            >
              Configura Prova
            </Button>
          </div>

        </div>

        {/* 5. HISTORY */}
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-slate-400 dark:text-white/30" />
            <h3 className="text-[17px] font-bold text-slate-900 dark:text-white">Registro Esercitazioni</h3>
          </div>

          <div className="bg-white dark:bg-[#1C1C1E] rounded-[24px] border border-slate-100 dark:border-white/[0.06] shadow-[0_2px_15px_rgba(0,0,0,0.03)] dark:shadow-none overflow-hidden min-h-[160px] flex flex-col justify-center">
            {attempts.length > 0 ? (
              <div className="divide-y divide-slate-50 dark:divide-white/[0.04]">
                {attempts.slice(0, 5).map((attempt) => (
                  <Link
                    key={attempt.id}
                    to={`/quiz/results/${attempt.id}`}
                    className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${attempt.score >= 18 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <div>
                        <div className="text-[15px] font-bold text-slate-900 dark:text-white">
                          {attempt.score >= 18 ? 'Idoneo' : 'Non Idoneo'}
                        </div>
                        <div className="text-[13px] text-slate-400 dark:text-white/30">
                          {new Date(attempt.created_at).toLocaleDateString('it-IT')} · {attempt.score}/30
                        </div>
                      </div>
                    </div>
                    <span className="text-slate-300 dark:text-white/20 text-lg">›</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="mb-3 opacity-60">
                  <Clipboard className="w-8 h-8 text-[#C4B598] dark:text-white/20" strokeWidth={1.5} />
                </div>
                <p className="text-[14px] text-slate-400 dark:text-white/30 font-medium px-4">
                  Non hai ancora effettuato esercitazioni per questo ruolo.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 6. MATERIALS HEADER */}
        <div className="pt-2 pb-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-slate-400 dark:text-white/30" />
            <h3 className="text-[17px] font-bold text-slate-900 dark:text-white">Materiali & Strumenti</h3>
          </div>
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[20px] p-5 border border-slate-100 dark:border-white/[0.06] shadow-sm dark:shadow-none opacity-50">
            <p className="text-sm text-slate-400 dark:text-white/30">Nessun materiale disponibile al momento.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
