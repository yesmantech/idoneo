/**
 * @file RulesPage.tsx
 * @description Pre-simulation briefing screen ("The Rules").
 *
 * Displays the official rules for the selected simulation type before starting.
 * Fetches configuration from the quiz and subject rules to show:
 * - Time limit
 * - Total questions
 * - Scoring system (correct/wrong/blank)
 *
 * ## Features
 *
 * - **Dynamic Configuration**: Loads rules from `quizzes` and `quiz_subject_rules`
 * - **Scoring Table**: Visual breakdown of points
 * - **Safety Check**: Prevents starting if `is_official` is false (unless testing)
 *
 * ## Route Parameters
 *
 * - `contestSlug`: The slug of the quiz (e.g. `allievi-marescialli-2025`)
 * - `type`: The simulation type (e.g. `official`, `infinite`, `training`)
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

export default function RulesPage() {
  const { contestSlug, type } = useParams<{ category: string; role: string; contestSlug: string; type: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canStart, setCanStart] = useState(false);

  const [config, setConfig] = useState<{
    title: string;
    time_limit: number;
    total_questions: number;
    points_correct: number;
    points_wrong: number;
    points_blank: number;
    is_official: boolean;
  } | null>(null);

  useEffect(() => {
    loadConfig();
  }, [contestSlug]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      // 1. Fetch Quiz by Slug
      const { data: quiz, error: qError } = await supabase
        .from("quizzes")
        .select("*")
        .eq("slug", contestSlug)
        .maybeSingle();

      if (qError) throw qError;
      if (!quiz) throw new Error("Concorso non trovato.");

      // 2. Fetch Rules to count questions
      const { data: rules } = await supabase
        .from("quiz_subject_rules")
        .select("question_count")
        .eq("quiz_id", quiz.id);

      const totalQuestions = rules?.reduce((a, b) => a + b.question_count, 0) || 0;

      setConfig({
        title: quiz.title,
        time_limit: quiz.time_limit || 60,
        total_questions: totalQuestions,
        points_correct: quiz.points_correct ?? 1,
        points_wrong: quiz.points_wrong ?? -0.25,
        points_blank: quiz.points_blank ?? 0,
        is_official: quiz.is_official ?? false // Check field name consistency
      });

      // Only allow start if official is enabled (or if we are testing)
      // For now, if "is_official" is false, we might want to block.
      setCanStart(!!quiz.is_official);

    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    if (!canStart) return;
    navigate(`/quiz/${contestSlug}/official`);
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <h1 className="text-xl font-bold text-rose-600 mb-2">Errore caricamento</h1>
      <p className="text-slate-500">{error}</p>
    </div>
  );

  if (!config) return <div className="min-h-screen flex items-center justify-center">Impossibile caricare configurazione.</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Simple Top Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            <span className="text-sm font-medium">Torna indietro</span>
          </button>
          <div className="font-bold text-slate-900 truncate max-w-[200px] md:max-w-md">
            Regole della simulazione
          </div>
          <div className="w-8"></div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-lg mt-8">

        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-slate-900 rounded-3xl mx-auto flex items-center justify-center text-4xl mb-6 shadow-xl shadow-slate-200">
            🚀
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Pronto a iniziare?</h1>
          <p className="text-slate-500">
            Stai per avviare la simulazione ufficiale per <strong>{config.title}</strong>. Ecco le regole che dovrai seguire.
          </p>
        </div>

        {!config.is_official && (
          <div className="w-full bg-rose-50 border border-rose-200 p-4 rounded-xl mb-6 flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-rose-800 text-sm font-bold">Simulazione non disponibile</p>
              <p className="text-rose-700 text-xs">Questa simulazione è attualmente chiusa o in manutenzione.</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm mb-6 space-y-6">
          {/* Key Stats */}
          <div className="grid grid-cols-2 gap-4 pb-6 border-b border-slate-100">
            <div className="text-center p-4 bg-slate-50 rounded-2xl">
              <div className="text-2xl font-bold text-slate-900">{config.time_limit}</div>
              <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">Minuti</div>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-2xl">
              <div className="text-2xl font-bold text-slate-900">{config.total_questions}</div>
              <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">Domande</div>
            </div>
          </div>

          {/* Scoring Rules */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wide">Punteggi</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm">✓</div>
                  <span className="font-medium text-slate-700">Risposta Esatta</span>
                </div>
                <span className="font-bold text-emerald-600">+{config.points_correct}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-sm">✕</div>
                  <span className="font-medium text-slate-700">Risposta Errata</span>
                </div>
                <span className="font-bold text-rose-600">{config.points_wrong}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-sm">-</div>
                  <span className="font-medium text-slate-700">Risposta Omessa</span>
                </div>
                <span className="font-bold text-slate-500">{config.points_blank}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400 mb-8 px-8">
          Il tempo inizierà a scorrere non appena cliccherai sul pulsante qui sotto. Buona fortuna! 🍀
        </div>

        <button
          onClick={handleStart}
          disabled={!canStart}
          className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-xl shadow-slate-900/20 hover:shadow-slate-900/40 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {canStart ? "Inizia la prova" : "Attualmente non disponibile"}
        </button>

      </div>
    </div>
  );
}
