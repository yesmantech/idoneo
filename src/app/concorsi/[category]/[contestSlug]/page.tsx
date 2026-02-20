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
import TierSLoader from "@/components/ui/TierSLoader";

export default function ContestPage() {
  const { category, contestSlug } = useParams<{ category: string; contestSlug: string }>();
  const navigate = useNavigate();

  const { user } = useAuth();
  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<any[]>([]);

  useEffect(() => {
    if (!contestSlug) return;

    async function loadData() {
      setLoading(true);
      const data = await getContestBySlug(contestSlug || '');
      setContest(data);

      if (data && user) {
        const { data: myAttempts } = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('quiz_id', data.id)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (myAttempts) {
          setAttempts(myAttempts);
        }
      }
      setLoading(false);
    }

    loadData();
  }, [contestSlug, user]);

  if (loading) return (
    <TierSLoader message="Caricamento concorso..." />
  );

  if (!contest) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">Concorso non trovato</h1>
      <button onClick={() => navigate(-1)} className="text-[#00B1FF] font-medium hover:underline">
        ← Torna indietro
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans text-slate-900">

      {/* 1. TOP BAR */}
      <div className="sticky top-0 z-30 bg-[#F8FAFC]/90 backdrop-blur-md px-4 py-4 flex items-center gap-1">
        <button
          onClick={() => navigate(-1)}
          className="p-1 -ml-2 rounded-full hover:bg-slate-200/50 transition-colors flex items-center text-slate-500"
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
          <h1 className="text-3xl font-bold text-[#0F172A] tracking-tight leading-tight">
            {contest.title}
          </h1>
        </div>

        {/* 3. DESCRIPTION CARD */}
        <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-slate-100/50">
          <p className={`${contest.description ? 'text-slate-600' : 'text-slate-400 italic'} text-[15px] leading-relaxed`}>
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
          <div className="bg-white rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-slate-100 transition-transform active:scale-[0.99]">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-cyan-50 flex items-center justify-center flex-shrink-0">
                <Trophy className="w-7 h-7 text-cyan-500" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Simulazione Ufficiale</h3>
                <p className="text-[14px] text-slate-500 leading-snug">
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
          <div className="bg-white rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-slate-100 transition-transform active:scale-[0.99]">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                <Puzzle className="w-7 h-7 text-purple-500" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Prova Personalizzata</h3>
                <p className="text-[14px] text-slate-500 leading-snug">
                  Allenati su argomenti specifici senza limiti di tempo.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
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
            <Clock className="w-5 h-5 text-slate-400" />
            <h3 className="text-[17px] font-bold text-slate-900">Registro Esercitazioni</h3>
          </div>

          <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.03)] overflow-hidden min-h-[160px] flex flex-col justify-center">
            {attempts.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {attempts.slice(0, 5).map((attempt) => (
                  <Link
                    key={attempt.id}
                    to={`/quiz/results/${attempt.id}`}
                    className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${attempt.score >= 18 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <div>
                        <div className="text-[15px] font-bold text-slate-900">
                          {attempt.score >= 18 ? 'Idoneo' : 'Non Idoneo'}
                        </div>
                        <div className="text-[13px] text-slate-400">
                          {new Date(attempt.created_at).toLocaleDateString('it-IT')} · {attempt.score}/30
                        </div>
                      </div>
                    </div>
                    <span className="text-slate-300 text-lg">›</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="mb-3 opacity-60">
                  <Clipboard className="w-8 h-8 text-[#C4B598]" strokeWidth={1.5} />
                </div>
                <p className="text-[14px] text-slate-400 font-medium px-4">
                  Non hai ancora effettuato esercitazioni per questo ruolo.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 6. MATERIALS HEADER */}
        <div className="pt-2 pb-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-slate-400" />
            <h3 className="text-[17px] font-bold text-slate-900">Materiali & Strumenti</h3>
          </div>
          {/* Placeholder for materials content if added later */}
          <div className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-sm opacity-50">
            <p className="text-sm text-slate-400">Nessun materiale disponibile al momento.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
