"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
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

export default function OfficialQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: quizId } = use(params);
  const router = useRouter();

  const [quiz, setQuiz] = useState<QuizRow | null>(null);
  const [questions, setQuestions] = useState<FullQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<
    { selectedOption: "a" | "b" | "c" | "d" | null }[]
  >([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);

  // timer in secondi
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  // 🔧 Modalità controllate dall'utente (quiz ufficiale)
  const [autoNext, setAutoNext] = useState(false); // auto avanzamento
  const [instantCheck, setInstantCheck] = useState(false); // verifica istantanea

  // Navigabilità: per i quiz ufficiali viene dal concorso (admin)
  const [navigable, setNavigable] = useState(true);

  // Conferma per modalità non navigabile (solo se il concorso lo impone)
  const [navLockConfirmed, setNavLockConfirmed] = useState(false);
  const [showNavLockModal, setShowNavLockModal] = useState(false);
  const [pendingOption, setPendingOption] = useState<
    "a" | "b" | "c" | "d" | null
  >(null);

  // Feedback di verifica istantanea per domanda
  const [feedbackByQuestion, setFeedbackByQuestion] = useState<
    { correct: boolean | null }[]
  >([]);
  const autoNextTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Risultati finali
  const [results, setResults] = useState<{
    correct: number;
    wrong: number;
    skipped: number;
  } | null>(null);

  // caricamento dati quiz + domande
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1) quiz
        const { data: quizData, error: quizError } = await supabase
          .from("quizzes")
          .select("*")
          .eq("id", quizId)
          .single();

        if (quizError || !quizData) {
          console.error("Errore caricando quiz:", quizError);
          setError("Concorso non trovato.");
          setLoading(false);
          return;
        }

        const qz = quizData as QuizRow;
        setQuiz(qz);

        // 2) regole per materia (tolleranti all'errore)
        const {
          data: rulesData,
          error: rulesErrorRaw,
        } = await supabase
          .from("quiz_subject_rules")
          .select("*")
          .eq("quiz_id", quizId)
          .order("created_at", { ascending: true });

        let rulesList: RuleRow[] = [];

        if (rulesErrorRaw) {
          console.warn(
            "Quiz ufficiale: impossibile leggere le regole, userò tutte le domande:",
            {
              message: (rulesErrorRaw as any)?.message,
              details: (rulesErrorRaw as any)?.details,
              hint: (rulesErrorRaw as any)?.hint,
              code: (rulesErrorRaw as any)?.code,
            }
          );
          rulesList = [];
        } else {
          rulesList = (rulesData || []) as RuleRow[];
        }

        // 3) domande con info materia
        const { data: questionsData, error: questionsError } = await supabase
          .from("questions")
          .select(
            `
            *,
            subject:subjects(*)
          `
          )
          .eq("quiz_id", quizId)
          .eq("is_archived", false);

        if (questionsError) {
          console.error("Errore caricando domande:", questionsError);
          setError("Errore nel caricamento delle domande.");
          setLoading(false);
          return;
        }

        let fullQuestions = (questionsData || []) as FullQuestion[];

        // 4) applica regole concorso (distribuzione per materia) SE le ho
        if (rulesList.length > 0) {
          const bySubject = new Map<string, FullQuestion[]>();
          for (const q of fullQuestions) {
            const sid = (q.subject_id as string | null) || "";
            if (!sid) continue;
            if (!bySubject.has(sid)) bySubject.set(sid, []);
            bySubject.get(sid)!.push(q);
          }

          const selected: FullQuestion[] = [];

          const shuffle = <T,>(arr: T[]): T[] => {
            const copy = [...arr];
            for (let i = copy.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [copy[i], copy[j]] = [copy[j], copy[i]];
            }
            return copy;
          };

          for (const rule of rulesList) {
            const sid = rule.subject_id as string | null;
            if (!sid) continue;
            const pool = bySubject.get(sid) || [];
            if (pool.length === 0) continue;

            const shuffled = shuffle(pool);
            const count = rule.question_count ?? 0;
            const take = Math.min(count, shuffled.length);
            selected.push(...shuffled.slice(0, take));
          }

          if (selected.length > 0) {
            const shuffleFinal = <T,>(arr: T[]): T[] => {
              const copy = [...arr];
              for (let i = copy.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [copy[i], copy[j]] = [copy[j], copy[i]];
              }
              return copy;
            };
            fullQuestions = shuffleFinal(selected);
          }
        }

        setQuestions(fullQuestions);
        setAnswers(
          Array.from({ length: fullQuestions.length }, () => ({
            selectedOption: null,
          }))
        );
        setFeedbackByQuestion(
          Array.from({ length: fullQuestions.length }, () => ({ correct: null }))
        );

        // timer: se il quiz ha time_limit (minuti) lo convertiamo in secondi
        if (qz.time_limit && qz.time_limit > 0) {
          setRemainingSeconds(qz.time_limit * 60);
        } else {
          setRemainingSeconds(null);
        }

        setStartedAt(Date.now());
      } catch (err) {
        console.error("Errore imprevisto caricando quiz ufficiale:", err);
        setError("Errore nel caricamento del concorso.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [quizId]);

  // Imposta la navigabilità in base al concorso (campo admin: official_non_navigable)
  useEffect(() => {
    if (!quiz) return;
    const forcedNonNavigable = Boolean(
      (quiz as any)?.official_non_navigable ?? false
    );
    setNavigable(!forcedNonNavigable);
    setNavLockConfirmed(false);
  }, [quiz]);

  // gestione timer
  useEffect(() => {
    if (remainingSeconds === null || finished) return;
    if (remainingSeconds <= 0) {
      // tempo scaduto → finisci il quiz
      handleFinish(true);
      return;
    }

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds, finished]);

  useEffect(() => {
    return () => {
      clearAutoNextTimeout();
    };
  }, []);

  const currentQuestion = useMemo(() => {
    if (currentIndex < 0 || currentIndex >= questions.length) return null;
    return questions[currentIndex];
  }, [questions, currentIndex]);

  const totalQuestions = questions.length;
  const currentAnswer = answers[currentIndex]?.selectedOption ?? null;

  const resolveCorrectKey = (
    question: FullQuestion | null
  ): "a" | "b" | "c" | "d" | null => {
    if (!question) return null;

    const raw = (question as any).correct_option as string | null;
    const trimmed = raw?.trim().toLowerCase?.() ?? null;

    if (trimmed) {
      if (["a", "b", "c", "d"].includes(trimmed)) {
        return trimmed as "a" | "b" | "c" | "d";
      }

      if (trimmed.startsWith("option_")) {
        const candidate = trimmed.replace("option_", "");
        if (["a", "b", "c", "d"].includes(candidate)) {
          return candidate as "a" | "b" | "c" | "d";
        }
      }
    }

    // fallback: confronta il testo dell'opzione corretta con quello della domanda
    const optionsMap: Record<"a" | "b" | "c" | "d", string | null> = {
      a: (question as any).option_a ?? null,
      b: (question as any).option_b ?? null,
      c: (question as any).option_c ?? null,
      d: (question as any).option_d ?? null,
    };

    if (trimmed) {
      for (const [key, value] of Object.entries(optionsMap)) {
        if (value && value.trim().toLowerCase() === trimmed) {
          return key as "a" | "b" | "c" | "d";
        }
      }
    }

    return null;
  };

  const clearAutoNextTimeout = () => {
    if (autoNextTimeoutRef.current) {
      clearTimeout(autoNextTimeoutRef.current);
      autoNextTimeoutRef.current = null;
    }
  };

  const handlePrev = () => {
    // nei quiz ufficiali, se il concorso è non navigabile, non puoi tornare indietro
    if (!navigable) return;
    clearAutoNextTimeout();
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    clearAutoNextTimeout();
    setCurrentIndex((prev) =>
      Math.min(totalQuestions - 1, prev + 1)
    );
  };

  const computeResults = () => {
    let correct = 0;
    let wrong = 0;
    let skipped = 0;

    questions.forEach((q, idx) => {
      const ans = answers[idx]?.selectedOption;
      if (!ans) {
        skipped++;
        return;
      }
      if (ans === (q.correct_option as any)) {
        correct++;
      } else {
        wrong++;
      }
    });

    return { correct, wrong, skipped };
  };

  const handleFinish = (autoByTime = false) => {
    if (finished) return;
    clearAutoNextTimeout();
    setFinished(true);
    setRemainingSeconds(0);

    const res = computeResults();
    setResults(res);

    console.log("Quiz ufficiale terminato", {
      quizId,
      autoByTime,
      ...res,
    });
  };

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "∞";
    if (seconds < 0) seconds = 0;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  };

  // 🔁 funzione centrale che applica la selezione di una risposta
  const applyOptionSelection = (opt: "a" | "b" | "c" | "d") => {
    if (!currentQuestion || finished) return;

    clearAutoNextTimeout();

    const correctKey = resolveCorrectKey(currentQuestion);

    setAnswers((prev) => {
      const copy = [...prev];
      if (!copy[currentIndex]) {
        copy[currentIndex] = { selectedOption: opt };
      } else {
        copy[currentIndex] = { ...copy[currentIndex], selectedOption: opt };
      }
      return copy;
    });

    const isCorrect = correctKey ? opt === (correctKey as any) : null;

    setFeedbackByQuestion((prev) => {
      const copy = [...prev];
      copy[currentIndex] = { correct: isCorrect };
      return copy;
    });

    const goNext = () => {
      if (currentIndex >= totalQuestions - 1) {
        handleFinish(false);
        return;
      }
      setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1));
    };

    if (autoNext) {
      if (instantCheck) {
        // auto-next + verifica istantanea:
        // mostra il colore per ~1.2s, poi avanza
        autoNextTimeoutRef.current = setTimeout(goNext, 1200);
      } else {
        // solo auto-next, nessun delay
        goNext();
      }
    }
  };

  const handleSelectOption = (opt: "a" | "b" | "c" | "d") => {
    const forcedNonNavigable = Boolean(
      (quiz as any)?.official_non_navigable ?? false
    );

    if (forcedNonNavigable && !navLockConfirmed) {
      // prima volta in modalità non navigabile → chiedi conferma
      setPendingOption(opt);
      setShowNavLockModal(true);
      return;
    }

    applyOptionSelection(opt);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-sm text-slate-200">Caricamento quiz ufficiale…</p>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="max-w-md px-4">
          <p className="text-sm text-red-400 mb-2">
            {error || "Concorso non trovato."}
          </p>
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

  if (finished && results) {
    const total = totalQuestions || 1;
    const scorePercent = Math.round((results.correct / total) * 100);

    let timeSpentSeconds: number | null = null;
    if (startedAt) {
      timeSpentSeconds = Math.floor((Date.now() - startedAt) / 1000);
    }

    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <button
            onClick={() => router.push(`/quiz/${quizId}`)}
            className="mb-4 text-xs text-slate-300 hover:text-slate-100"
          >
            ← Torna alla pagina concorso
          </button>

          <h1 className="text-xl font-semibold mb-1">
            Risultato quiz ufficiale
          </h1>
          <p className="text-xs text-slate-300 mb-4">
            {quiz.title || "Concorso"}{" "}
            {quiz.year ? `· ${quiz.year}` : ""}
          </p>

          <div className="grid gap-3 md:grid-cols-3 text-xs">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
              <p className="text-[11px] text-slate-400 mb-1">
                Punteggio
              </p>
              <p className="text-2xl font-semibold text-slate-50">
                {scorePercent}%
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {results.correct} corrette su {totalQuestions}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
              <p className="text-[11px] text-slate-400 mb-1">
                Dettaglio risposte
              </p>
              <p className="text-sm text-emerald-400">
                ✓ Corrette: {results.correct}
              </p>
              <p className="text-sm text-rose-400">
                ✗ Errate: {results.wrong}
              </p>
              <p className="text-sm text-slate-300">
                • Non risposte: {results.skipped}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
              <p className="text-[11px] text-slate-400 mb-1">
                Tempo impiegato
              </p>
              <p className="text-sm text-slate-50">
                {timeSpentSeconds !== null
                  ? `${Math.floor(timeSpentSeconds / 60)} min ${
                      timeSpentSeconds % 60
                    } sec`
                  : "N/A"}
              </p>
              {quiz.time_limit && (
                <p className="text-[11px] text-slate-400 mt-1">
                  Limite: {quiz.time_limit} min
                </p>
              )}
            </div>
          </div>

          <div className="mt-5 flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => router.push(`/quiz/${quizId}`)}
              className="rounded-md bg-sky-600 px-4 py-2 text-xs font-medium text-white hover:bg-sky-500"
            >
              Torna alla pagina concorso
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-md border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-100 hover:border-slate-500"
            >
              Rifai il quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="max-w-md px-4">
          <p className="text-sm text-slate-300 mb-2">
            Nessuna domanda disponibile per questo concorso.
          </p>
          <button
            onClick={() => router.push(`/quiz/${quizId}`)}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs hover:border-slate-500"
          >
            Torna alla pagina concorso
          </button>
        </div>
      </div>
    );
  }

  const progressPercent =
    totalQuestions > 0
      ? Math.round(((currentIndex + 1) / totalQuestions) * 100)
      : 0;

  // URL immagine con fallback
  const rawImgUrl =
    (currentQuestion as any).image_url ||
    (currentQuestion as any).image ||
    null;

  const correctKey =
    resolveCorrectKey(currentQuestion);

  const forcedNonNavigable = Boolean(
    (quiz as any)?.official_non_navigable ?? false
  );

  const feedbackForCurrent = feedbackByQuestion[currentIndex];

  const currentValidation = (() => {
    const derivedCorrectness =
      currentAnswer && correctKey ? currentAnswer === (correctKey as any) : null;

    if (!feedbackForCurrent) return derivedCorrectness;

    return feedbackForCurrent.correct ?? derivedCorrectness;
  })();

  const showValidation = instantCheck && currentValidation !== null;

  const isCurrentCorrect = showValidation && currentValidation === true;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-3xl px-4 py-6">
        {/* Header con titolo, timer e modalità */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <button
              onClick={() => router.push(`/quiz/${quizId}`)}
              className="mb-1 text-[11px] text-slate-300 hover:text-slate-100"
            >
              ← Torna alla pagina concorso
            </button>
            <h1 className="text-lg font-semibold">
              Quiz ufficiale – {quiz.title || "Concorso"}
            </h1>
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

            {/* Pannellino modalità (Auto-next + Verifica istantanea) */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-[10px] space-y-1 max-w-[230px]">
              <p className="font-semibold text-slate-100 text-[11px]">
                Modalità quiz
              </p>
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
                <p className="mt-1 text-[10px] text-amber-300">
                  • Domande non navigabili (impostato dal concorso)
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Barra progresso */}
        <div className="mb-4">
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>Progresso</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-900 overflow-hidden">
            <div
              className="h-full bg-sky-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* DOMANDA + IMMAGINE */}
        <div className="mb-4">
          <p className="text-sm md:text-base text-slate-100 mb-3">
            {(currentQuestion as any).text}
          </p>

          {rawImgUrl && (
            <div className="mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={rawImgUrl as string}
                alt="Immagine domanda"
                className="max-h-64 w-full rounded-xl border border-slate-800 object-contain bg-slate-900"
              />
            </div>
          )}

          {currentQuestion.subject && (
            <p className="mt-1 text-[11px] text-slate-400">
              Materia:{" "}
              <span className="text-slate-200">
                {(currentQuestion.subject as any).name || "—"}
              </span>
            </p>
          )}
        </div>

        {/* OPZIONI DI RISPOSTA */}
        <div className="space-y-2 mb-3">
          {(["a", "b", "c", "d"] as const).map((optKey) => {
            const labelMap: Record<"a" | "b" | "c" | "d", string | null> = {
              a: (currentQuestion as any).option_a ?? null,
              b: (currentQuestion as any).option_b ?? null,
              c: (currentQuestion as any).option_c ?? null,
              d: (currentQuestion as any).option_d ?? null,
            };

            const optionText = labelMap[optKey];
            if (!optionText) return null;

            const isSelected = currentAnswer === optKey;

            const base =
              "w-full rounded-xl border px-3 py-2 text-left text-xs md:text-sm transition ";
            let style = "";

            if (showValidation && correctKey) {
              if (optKey === correctKey) {
                // opzione corretta
                style = isSelected
                  ? "border-emerald-500 bg-emerald-900/40 text-emerald-50"
                  : "border-emerald-600/70 bg-emerald-900/20 text-emerald-100";
              } else if (isSelected && optKey !== correctKey) {
                // opzione sbagliata selezionata
                style =
                  "border-rose-500 bg-rose-900/40 text-rose-50 line-through";
              } else {
                style =
                  "border-slate-700 bg-slate-900 hover:border-slate-500 hover:bg-slate-900/80";
              }
            } else {
              // modalità normale, niente colore corretto/sbagliato
              style = isSelected
                ? "border-sky-500 bg-sky-900/40 text-sky-100"
                : "border-slate-700 bg-slate-900 hover:border-slate-500 hover:bg-slate-900/80";
            }

            return (
              <button
                key={optKey}
                type="button"
                onClick={() => handleSelectOption(optKey)}
                className={base + style}
              >
                <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-500 text-[10px] font-semibold text-slate-200">
                  {optKey.toUpperCase()}
                </span>
                <span>{optionText}</span>
              </button>
            );
          })}
        </div>

        {/* Messaggio di feedback esplicito per la verifica istantanea */}
        {showValidation && correctKey && (
          <div className="mb-4 text-[11px]">
            {isCurrentCorrect ? (
              <span className="text-emerald-400">
                ✅ Risposta corretta
              </span>
            ) : (
              <span className="text-rose-400">
                ❌ Risposta errata. Corretta:{" "}
                <span className="font-semibold uppercase">
                  {correctKey}
                </span>
              </span>
            )}
          </div>
        )}

        {/* NAV + AZIONI */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0 || !navigable}
              className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 hover:border-slate-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Precedente
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex === totalQuestions - 1}
              className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 hover:border-slate-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Successiva →
            </button>
          </div>
          <button
            type="button"
            onClick={() => handleFinish(false)}
            className="rounded-md bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
          >
            Termina prova
          </button>
        </div>
      </div>

      {/* Modale conferma per modalità non navigabile (solo se il concorso la impone) */}
      {showNavLockModal && forcedNonNavigable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="max-w-sm rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-xs">
            <p className="mb-1 text-slate-100 font-semibold">
              Domande non navigabili
            </p>
            <p className="mb-3 text-[11px] text-slate-300">
              In questa modalità, impostata dal concorso, non potrai tornare
              indietro a cambiare le risposte delle domande già viste. Sei
              sicuro di voler procedere?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowNavLockModal(false);
                  setPendingOption(null);
                }}
                className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] text-slate-100 hover:border-slate-500"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={() => {
                  setNavLockConfirmed(true);
                  setShowNavLockModal(false);
                  if (pendingOption) {
                    applyOptionSelection(pendingOption);
                    setPendingOption(null);
                  }
                }}
                className="rounded-md bg-emerald-600 px-3 py-1 text-[11px] font-medium text-white hover:bg-emerald-500"
              >
                Sì, procedi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
