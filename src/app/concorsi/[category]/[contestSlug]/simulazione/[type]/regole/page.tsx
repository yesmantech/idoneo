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
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Rocket, Clock, HelpCircle, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import TierSLoader from "@/components/ui/TierSLoader";
import { hapticLight, hapticSuccess } from "@/lib/haptics";

export default function RulesPage() {
  const { contestSlug } = useParams<{ category: string; contestSlug: string; type: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canStart, setCanStart] = useState(false);

  const [config, setConfig] = useState<{
    id: string;
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
        .select("id, title, time_limit, total_questions, points_correct, points_wrong, points_blank, is_official")
        .eq("slug", contestSlug)
        .maybeSingle();

      if (qError) throw qError;
      if (!quiz) throw new Error("Concorso non trovato.");

      // 2. Fetch Rules to count questions
      const { data: rules } = await supabase
        .from("quiz_subject_rules")
        .select("question_count")
        .eq("quiz_id", quiz.id);

      // Prefer calculated from rules, fallback to configured total
      let totalQuestions = rules?.reduce((a, b) => a + b.question_count, 0) || 0;
      if (totalQuestions === 0 && quiz.total_questions) {
        totalQuestions = quiz.total_questions;
      }

      setConfig({
        id: quiz.id,
        title: quiz.title,
        time_limit: quiz.time_limit || 60,
        total_questions: totalQuestions,
        points_correct: quiz.points_correct ?? 1,
        points_wrong: quiz.points_wrong ?? -0.25,
        points_blank: quiz.points_blank ?? 0,
        is_official: quiz.is_official ?? false
      });

      setCanStart(!!quiz.is_official);

    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      // Small artificial delay for premium feel
      setTimeout(() => setLoading(false), 800);
    }
  };

  const handleStart = () => {
    if (!canStart) return;
    hapticSuccess();
    navigate(`/quiz/${contestSlug}/official`);
  };

  if (loading) return <TierSLoader message="Preparazione simulazione..." submessage="Il tempo è prezioso, stiamo configurando tutto." />;

  if (error) return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[var(--card)] border border-semantic-error/20 p-8 rounded-[32px] shadow-card max-w-sm"
      >
        <div className="w-16 h-16 bg-semantic-error/10 text-semantic-error rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✕</div>
        <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">Errore caricamento</h1>
        <p className="text-[var(--foreground)] opacity-60 mb-6 text-sm">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="w-full py-3 bg-brand-blue text-white font-bold rounded-pill shadow-lg shadow-brand-blue/20"
        >
          Torna indietro
        </button>
      </motion.div>
    </div>
  );

  if (!config) return null;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-brand-blue/20 pb-12 overflow-x-hidden relative">

      {/* Tier S Mesh Gradient Background */}
      <div className="fixed inset-0 pointer-events-none transition-colors duration-1000" style={{
        background: `
              radial-gradient(circle at 10% 10%, rgba(56, 189, 248, 0.08), transparent 40%),
              radial-gradient(circle at 90% 90%, rgba(139, 92, 246, 0.08), transparent 40%)
          `
      }} />

      {/* Glass Navigation Bar */}
      <div className="sticky top-0 z-50 bg-white/60 dark:bg-[#0A0A0B]/60 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5 pt-safe">
        <div className="px-4 h-16 flex items-center justify-between max-w-lg mx-auto">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => { hapticLight(); navigate(-1); }}
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white dark:bg-white/5 shadow-soft border border-slate-200/50 dark:border-white/10 text-slate-600 dark:text-slate-300 active:scale-90 transition-transform"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          <div className="font-black text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
            Briefing (v2.1)
          </div>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="relative z-10 px-6 py-8 md:py-10 max-w-lg mx-auto">
        {/* Header Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <motion.div
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 15, delay: 0.1 }}
            className="w-24 h-24 bg-gradient-to-br from-brand-blue to-cyan-400 rounded-[32px] mx-auto flex items-center justify-center mb-6 shadow-2xl shadow-brand-blue/30 text-white relative group"
          >
            <div className="absolute inset-0 bg-white/20 rounded-[32px] blur-xl opacity-0 group-hover:opacity-50 transition-opacity" />
            <Rocket className="w-12 h-12 relative z-10" />

            {/* Decorative glint */}
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-white/30 to-transparent rounded-[32px] pointer-events-none" />
          </motion.div>

          <h1 className="text-3xl font-black tracking-tight text-[var(--foreground)] mb-3 leading-tight">Pronto a iniziare?</h1>
          <p className="text-[var(--foreground)] opacity-60 leading-relaxed px-4 font-medium">
            Stai per avviare la simulazione ufficiale per <span className="text-[var(--foreground)] font-black opacity-100">{config.title}</span>.
          </p>
        </motion.div>

        {/* Info Banner if unavailable */}
        {!config.is_official && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-500/5 border border-red-500/10 p-5 rounded-[24px] mb-8 flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 text-red-500">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-red-500 text-sm font-black mb-0.5">Simulazione non disponibile</p>
              <p className="text-[var(--foreground)] text-xs opacity-60 font-medium">Questa simulazione è attualmente chiusa o in manutenzione.</p>
            </div>
          </motion.div>
        )}

        {/* Rules Glass Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/60 dark:bg-white/5 backdrop-blur-2xl border border-white/40 dark:border-white/10 rounded-[40px] p-2 shadow-2xl shadow-indigo-500/5 mb-8 overflow-visible"
        >
          <div className="p-6 space-y-8">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col items-center justify-center p-5 bg-slate-50 dark:bg-white/5 rounded-[28px] border border-slate-100 dark:border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-brand-blue/10 blur-2xl rounded-full -mr-8 -mt-8 transition-opacity group-hover:opacity-100 opacity-0" />

                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-brand-blue flex items-center justify-center mb-3">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="text-3xl font-black text-[var(--foreground)] tracking-tight mb-1">{config.time_limit}</div>
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Minuti</div>
              </div>

              <div className="flex flex-col items-center justify-center p-5 bg-slate-50 dark:bg-white/5 rounded-[28px] border border-slate-100 dark:border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-400/10 blur-2xl rounded-full -mr-8 -mt-8 transition-opacity group-hover:opacity-100 opacity-0" />

                <div className="w-10 h-10 rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-500 flex items-center justify-center mb-3">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div className="text-3xl font-black text-[var(--foreground)] tracking-tight mb-1">{config.total_questions}</div>
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Domande</div>
              </div>
            </div>

            {/* Scoring System */}
            <div>
              <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 mb-5 px-2 uppercase tracking-[0.2em] text-center">Punteggi Ufficiali</h3>
              <div className="space-y-3">
                <motion.div
                  initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }}
                  className="flex items-center justify-between p-4 pl-5 rounded-[24px] bg-emerald-500/[0.03] dark:bg-emerald-500/10 border border-emerald-500/10"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm shadow-emerald-500/10">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[var(--foreground)] text-sm">Risposta Esatta</span>
                  </div>
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">+{config.points_correct}</span>
                </motion.div>

                <motion.div
                  initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }}
                  className="flex items-center justify-between p-4 pl-5 rounded-[24px] bg-red-500/[0.03] dark:bg-red-500/10 border border-red-500/10"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center text-red-500 dark:text-red-400 shadow-sm shadow-red-500/10">
                      <XCircle className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[var(--foreground)] text-sm">Risposta Errata</span>
                  </div>
                  <span className="text-xl font-black text-red-500 dark:text-red-400 tracking-tight">{config.points_wrong}</span>
                </motion.div>

                <motion.div
                  initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.6 }}
                  className="flex items-center justify-between p-4 pl-5 rounded-[24px] bg-slate-100/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-slate-200/50 dark:bg-white/10 flex items-center justify-center text-slate-400 dark:text-slate-500">
                      <MinusCircle className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[var(--foreground)] text-sm">Non Risposta</span>
                  </div>
                  <span className="text-xl font-black text-slate-400 dark:text-slate-500 tracking-tight">{config.points_blank}</span>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Warning Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="px-4 text-center"
        >
          <div className="text-[10px] font-bold text-[var(--foreground)] opacity-40 uppercase tracking-widest mb-8 leading-relaxed">
            Il timer startà automaticamente al click. <br /> Concentrazione massima. 🍀
          </div>

          <button
            onClick={handleStart}
            disabled={!canStart}
            className="group w-full relative overflow-hidden py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-lg rounded-[24px] shadow-2xl shadow-slate-900/20 dark:shadow-white/10 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-brand-blue to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative z-10 flex items-center justify-center gap-2">
              {canStart ? (
                <>
                  Inizia Simulazione <Rocket className="w-5 h-5" />
                </>
              ) : "Non disponibile"}
            </span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
