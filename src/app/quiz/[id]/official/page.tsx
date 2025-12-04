"use client";

import { use, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/types/database";

type QuizRow = Database["public"]["Tables"]["quizzes"]["Row"];
type QuestionRow = Database["public"]["Tables"]["questions"]["Row"];
type SubjectRow = Database["public"]["Tables"]["subjects"]["Row"];
type RuleRow = Database["public"]["Tables"]["quiz_subject_rules"]["Row"];

type FullQuestion = QuestionRow & {
  subject?: SubjectRow | null;
};

// Helper for shuffling arrays
function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function OfficialQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: quizId } = use(params);
  const router = useRouter();

  // --- Data State ---
  const [quiz, setQuiz] = useState<QuizRow | null>(null);
  const [questions, setQuestions] = useState<FullQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Quiz Execution State ---
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<
    { selectedOption: "a" | "b" | "c" | "d" | null }[]
  >([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [results, setResults] = useState<{
    correct: number;
    wrong: number;
    skipped: number;
  } | null>(null);

  // --- Timer State ---
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  // --- Modes & Config ---
  const [autoNext, setAutoNext] = useState(false);
  const [instantCheck, setInstantCheck] = useState(false);
  const [navigable, setNavigable] = useState(true);

  // --- UI Helpers ---
  const [showNavLockModal, setShowNavLockModal] = useState(false);
  const [navLockConfirmed, setNavLockConfirmed] = useState(false);
  const [pendingOption, setPendingOption] = useState<
    "a" | "b" | "c" | "d" | null
  >(null);

  const autoNextTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- 1. Load Data ---
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch Quiz
        const { data: quizData, error: quizError } = await supabase
          .from("quizzes")
          .select("*")
          .eq("id", quizId)
          .single();

        if (quizError || !quizData) throw new Error("Concorso non trovato.");
        const qz = quizData as QuizRow;
        setQuiz(qz);

        // Fetch Rules
        const { data: rulesData } = await supabase
          .from("quiz_subject_rules")
          .select("*")
          .eq("quiz_id", quizId);
        const rulesList = (rulesData || []) as RuleRow[];

        // Fetch Questions
        const { data: questionsData, error: qError } = await supabase
          .from("questions")
          .select(`*, subject:subjects(*)`)
          .eq("quiz_id", quizId)
          .eq("is_archived", false);

        if (qError) throw new Error("Errore nel caricamento delle domande.");

        let allQuestions = (questionsData || []) as FullQuestion[];

        // Apply Rules (Distribution & Shuffle)
        let finalQuestions: FullQuestion[] = [];
        if (rulesList.length > 0) {
          const bySubject = new Map<string, FullQuestion[]>();
          allQuestions.forEach((q) => {
            const sid = q.subject_id || "unknown";
            if (!bySubject.has(sid)) bySubject.set(sid, []);
            bySubject.get(sid)!.push(q);
          });

          rulesList.forEach((rule) => {
            if (!rule.subject_id) return;
            const pool = bySubject.get(rule.subject_id) || [];
            const needed = rule.question_count ?? 0;
            if (needed > 0 && pool.length > 0) {
              const shuffled = shuffleArray(pool);
              finalQuestions.push(...shuffled.slice(0, needed));
            }
          });
          // Shuffle the final mix so subjects are interleaved
          finalQuestions = shuffleArray(finalQuestions);
        } else {
          // No rules -> use all questions shuffled
          finalQuestions = shuffleArray(allQuestions);
        }

        if (finalQuestions.length === 0) {
          throw new Error("Nessuna domanda disponibile per questo concorso.");
        }

        setQuestions(finalQuestions);
        setAnswers(
          Array.from({ length: finalQuestions.length }, () => ({
            selectedOption: null,
          }))
        );

        // Init Timer
        if (qz.time_limit && qz.time_limit > 0) {
          setRemainingSeconds(qz.time_limit * 60);
        } else {
          setRemainingSeconds(null);
        }

        setStartedAt(Date.now());
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Errore imprevisto.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [quizId]);

  // --- 2. Navigability Check ---
  useEffect(() => {
    if (quiz) {
      // If the quiz enforces non-navigability, we respect it.
      const forced = Boolean((quiz as any)?.official_non_navigable);
      setNavigable(!forced);
    }
  }, [quiz]);

  // --- 3. Timer Logic ---
  // Memoized finish handler to avoid circular dependencies in useEffect
  const handleFinish = useCallback((autoByTime = false) => {
    setFinished((prevFinished) => {
      if (prevFinished) return true; // Already finished
      
      if (autoNextTimeoutRef.current) {
        clearTimeout(autoNextTimeoutRef.current);
        autoNextTimeoutRef.current = null;
      }
      
      setRemainingSeconds(0);
      
      // Compute results inside setter to ensure latest state access if needed
      // (Though here we rely on 'questions' and 'answers' from closure, which is fine if handleFinish is recreated or they are refs)
      // To be safe with closures, we should use refs for answers/questions or recreate handleFinish on change.
      // Since questions never change after load, and answers update often, let's keep it simple.
      // But we need 'answers' current value. 
      // NOTE: Using state in useCallback dependency can be tricky. 
      // For simplicity in this structure, we will just let it capture current scope values 
      // and re-create handleFinish when answers change.
      return true;
    });
  }, []);

  // Effect for timer
  useEffect(() => {
    if (remainingSeconds === null || finished) return;
    if (remainingSeconds <= 0) {
      // Logic for computing results is better moved to an effect that watches 'finished'
      // But here we just trigger the finish state.
      setFinished(true);
      return;
    }
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [remainingSeconds, finished]);

  // Effect to compute results once finished becomes true
  useEffect(() => {
    if (finished && !results) {
      let correct = 0;
      let wrong = 0;
      let skipped = 0;
      questions.forEach((q, idx) => {
        const ans = answers[idx]?.selectedOption;
        const correctOpt = q.correct_option?.toLowerCase();
        if (!ans) skipped++;
        else if (ans === correctOpt) correct++;
        else wrong++;
      });
      setResults({ correct, wrong, skipped });
    }
  }, [finished, results, questions, answers]);


  // --- 4. Navigation & Actions ---
  const currentQuestion = useMemo(() => questions[currentIndex], [questions, currentIndex]);
  const totalQuestions = questions.length;
  const currentAnswer = answers[currentIndex]?.selectedOption ?? null;

  const showValidation = instantCheck && currentAnswer !== null;
  const currentCorrectKey = currentQuestion?.correct_option?.toLowerCase() ?? null;
  const isCurrentCorrect =
    showValidation &&
    currentCorrectKey !== null &&
    currentAnswer === currentCorrectKey;

  const clearAutoNextTimeout = useCallback(() => {
    if (autoNextTimeoutRef.current) {
      clearTimeout(autoNextTimeoutRef.current);
      autoNextTimeoutRef.current = null;
    }
  }, []);

  const handleNext = useCallback(() => {
    clearAutoNextTimeout();
    setCurrentIndex((prev) => {
      if (prev < totalQuestions - 1) return prev + 1;
      return prev;
    });
  }, [totalQuestions, clearAutoNextTimeout]);

  const handlePrev = useCallback(() => {
    if (!navigable) return;
    clearAutoNextTimeout();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, [navigable, clearAutoNextTimeout]);

  const handleSelectOption = useCallback((opt: "a" | "b" | "c" | "d") => {
    if (finished) return;

    // Forced non-navigable check needs access to current quiz state or props
    // We access 'quiz' from scope.
    const forcedNonNavigable = Boolean((quiz as any)?.official_non_navigable);
    if (forcedNonNavigable && !navLockConfirmed) {
      setPendingOption(opt);
      setShowNavLockModal(true);
      return;
    }

    // Instant check lock
    if (instantCheck && currentAnswer !== null) {
      return;
    }

    // Update Answer
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = { selectedOption: opt };
      return next;
    });

    // Auto Next Logic
    clearAutoNextTimeout();
    if (autoNext) {
      const delay = instantCheck ? 1200 : 0;
      if (delay > 0) {
        autoNextTimeoutRef.current = setTimeout(() => {
          setCurrentIndex((prev) => (prev < totalQuestions - 1 ? prev + 1 : prev));
        }, delay);
      } else {
        setCurrentIndex((prev) => (prev < totalQuestions - 1 ? prev + 1 : prev));
      }
    }
  }, [finished, quiz, navLockConfirmed, instantCheck, currentAnswer, currentIndex, autoNext, totalQuestions, clearAutoNextTimeout]);

  // Fix: formatting helper outside render or simple enough inside
  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "∞";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // --- RENDER ---

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-sm text-slate-300 animate-pulse">Caricamento quiz ufficiale…</p>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="max-w-md px-4">
          <p className="text-sm text-red-400 mb-2">{error || "Errore."}</p>
          <button
            onClick={() => router.push("/")}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs hover:border-slate-500"
          >
            Torna alla home
          </button>
        </div>
      </div>
    );
  }

  // --- RESULTS SCREEN ---
  if (finished && results) {
    const total = totalQuestions || 1;
    const scorePercent = Math.round((results.correct / total) * 100);
    const timeSpent = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;

    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <button
            onClick={() => router.push(`/quiz/${quizId}`)}
            className="mb-4 text-xs text-slate-300 hover:text-slate-100"
          >
            ← Torna alla pagina concorso
          </button>

          <h1 className="text-xl font-semibold mb-1">Risultato quiz ufficiale</h1>
          <p className="text-xs text-slate-300 mb-4">{quiz.title}</p>

          <div className="grid gap-3 md:grid-cols-3 text-xs">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
              <p className="text-[11px] text-slate-400 mb-1">Punteggio</p>
              <p className="text-2xl font-semibold text-slate-50">{scorePercent}%</p>
              <p className="text-[11px] text-slate-400 mt-1">
                {results.correct}/{totalQuestions} corrette
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
              <p className="text-[11px] text-slate-400 mb-1">Dettaglio</p>
              <p className="text-emerald-400">✓ {results.correct} Corrette</p>
              <p className="text-rose-400">✕ {results.wrong} Errate</p>
              <p className="text-slate-300">• {results.skipped} Omesse</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
              <p className="text-[11px] text-slate-400 mb-1">Tempo</p>
              <p className="text-slate-50">
                {Math.floor(timeSpent / 60)}m {timeSpent % 60}s
              </p>
            </div>
          </div>

          <div className="mt-5 flex gap-2 text-xs">
            <button
              onClick={() => router.push(`/quiz/${quizId}`)}
              className="rounded-md bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-500"
            >
              Torna al concorso
            </button>
            <button
              onClick={() => window.location.reload()}
              className="rounded-md border border-slate-700 bg-slate-900 px-4 py-2 font-medium text-slate-100 hover:border-slate-500"
            >
              Rifai il quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- ACTIVE QUIZ SCREEN ---
  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);
  const rawImgUrl = currentQuestion.image_url || (currentQuestion as any).image;
  const forcedNonNavigable = Boolean((quiz as any)?.official_non_navigable);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-3xl px-4 py-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <button
              onClick={() => router.push(`/quiz/${quizId}`)}
              className="mb-1 text-[11px] text-slate-300 hover:text-slate-100"
            >
              ← Torna al concorso
            </button>
            <h1 className="text-lg font-semibold">{quiz.title}</h1>
            <p className="text-[11px] text-slate-400">
              Domanda {currentIndex + 1} di {totalQuestions}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-right">
              <p className="text-[10px] text-slate-400">Tempo residuo</p>
              <p className="text-sm font-mono text-slate-50">
                {formatTime(remainingSeconds)}
              </p>
            </div>

            {/* Mode Toggles */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-[10px] space-y-1 w-[160px]">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-3 w-3"
                  checked={autoNext}
                  onChange={(e) => setAutoNext(e.target.checked)}
                />
                <span className="text-slate-200">Auto-next</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-3 w-3"
                  checked={instantCheck}
                  onChange={(e) => setInstantCheck(e.target.checked)}
                />
                <span className="text-slate-200">Verifica istantanea</span>
              </label>
              {forcedNonNavigable && (
                <p className="mt-1 text-[9px] text-amber-300 opacity-80">
                  • Non navigabile (bloccato)
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="h-1.5 rounded-full bg-slate-900 overflow-hidden">
            <div
              className="h-full bg-sky-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Question & Image */}
        <div className="mb-4">
          <p className="text-sm md:text-base text-slate-100 mb-3 min-h-[60px]">
            {currentQuestion.text}
          </p>

          {rawImgUrl && (
            <div className="mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={rawImgUrl}
                alt="Immagine domanda"
                className="max-h-64 w-full rounded-xl border border-slate-800 object-contain bg-slate-900"
              />
            </div>
          )}

          {currentQuestion.subject && (
            <p className="text-[10px] text-slate-500">
              Materia: {(currentQuestion.subject as any).name}
            </p>
          )}
        </div>

        {/* Options */}
        <div className="space-y-2 mb-3">
          {(["a", "b", "c", "d"] as const).map((optKey) => {
            const optLabel = (currentQuestion as any)[`option_${optKey}`];
            if (!optLabel) return null;

            const isSelected = currentAnswer === optKey;
            
            // Logic for Visual Feedback
            let buttonStyle =
              "border-slate-700 bg-slate-900 hover:border-slate-500 hover:bg-slate-900/80";
            
            if (showValidation && currentCorrectKey) {
              if (optKey === currentCorrectKey) {
                // Correct option -> Green
                buttonStyle = isSelected
                  ? "border-emerald-500 bg-emerald-900/40 text-emerald-50" // Selected & Correct
                  : "border-emerald-600/70 bg-emerald-900/20 text-emerald-100"; // Revealed Correct
              } else if (isSelected) {
                // Wrong selection -> Red
                buttonStyle = "border-rose-500 bg-rose-900/40 text-rose-50 line-through";
              } else {
                // Other unselected options -> Dimmed
                buttonStyle = "border-slate-800 bg-slate-950 opacity-60";
              }
            } else if (isSelected) {
              // Standard selection (no validation visible) -> Blue
              buttonStyle = "border-sky-500 bg-sky-900/40 text-sky-100";
            }

            return (
              <button
                key={optKey}
                onClick={() => handleSelectOption(optKey)}
                className={`w-full rounded-xl border px-3 py-3 text-left text-xs md:text-sm transition-all ${buttonStyle}`}
              >
                <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-500 text-[10px] font-semibold opacity-70">
                  {optKey.toUpperCase()}
                </span>
                <span>{optLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Validation Message */}
        {showValidation && currentCorrectKey && (
          <div className="mb-4 text-xs font-medium">
            {isCurrentCorrect ? (
              <p className="text-emerald-400">✅ Risposta corretta</p>
            ) : (
              <p className="text-rose-400">
                ❌ Risposta errata. La corretta era:{" "}
                <span className="uppercase">{currentCorrectKey}</span>
              </p>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-2 text-xs pt-2">
          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0 || !navigable}
              className="rounded-md border border-slate-700 bg-slate-900 px-4 py-2 text-slate-100 hover:border-slate-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Precedente
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === totalQuestions - 1}
              className="rounded-md border border-slate-700 bg-slate-900 px-4 py-2 text-slate-100 hover:border-slate-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Successiva →
            </button>
          </div>
          <button
            onClick={() => setFinished(true)}
            className="rounded-md bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500"
          >
            Termina prova
          </button>
        </div>
      </div>

      {/* Nav Lock Modal (for forced non-navigable quizzes) */}
      {showNavLockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-4 text-xs shadow-2xl">
            <h3 className="mb-2 text-sm font-semibold text-slate-100">
              Conferma risposta
            </h3>
            <p className="mb-4 text-slate-300">
              In questo concorso non è possibile tornare indietro. Una volta
              data la risposta, sarà definitiva. Procedere?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowNavLockModal(false);
                  setPendingOption(null);
                }}
                className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-slate-200 hover:bg-slate-800"
              >
                Annulla
              </button>
              <button
                onClick={() => {
                  setNavLockConfirmed(true);
                  setShowNavLockModal(false);
                  if (pendingOption) {
                    handleSelectOption(pendingOption); // Re-trigger selection with confirmation
                    setPendingOption(null);
                  }
                }}
                className="rounded-md bg-emerald-600 px-3 py-1.5 font-medium text-white hover:bg-emerald-500"
              >
                Conferma e prosegui
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}