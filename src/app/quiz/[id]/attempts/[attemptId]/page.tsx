"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/types/database";

type QuizRow = Database["public"]["Tables"]["quizzes"]["Row"];
type QuestionRow = Database["public"]["Tables"]["questions"]["Row"];

type AttemptRow = {
  id: string;
  quiz_id: string;
  total_questions: number | null;
  correct: number | null;
  wrong: number | null;
  blank: number | null;
  score: number | null;
  duration_seconds: number | null;
  started_at: string | null;
  finished_at: string | null;
  answers: any[] | null;
};

function formatDuration(seconds: number | null) {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default function AttemptDetailPage({
  params,
}: {
  params: Promise<{ id: string; attemptId: string }>;
}) {
  const { id: quizId, attemptId } = use(params);
  const router = useRouter();

  const [quiz, setQuiz] = useState<QuizRow | null>(null);
  const [attempt, setAttempt] = useState<AttemptRow | null>(null);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [{ data: quizData, error: quizError }, { data: attemptData, error: attemptError }] =
          await Promise.all([
            supabase.from("quizzes").select("*").eq("id", quizId).single(),
            supabase
              .from("quiz_attempts" as any)
              .select("*")
              .eq("id", attemptId)
              .single(),
          ]);

        if (quizError || attemptError)
          throw quizError || attemptError;

        const att = attemptData as AttemptRow;
        setQuiz(quizData as QuizRow);
        setAttempt(att);

        const answers = (att.answers || []) as any[];
        const ids = Array.from(
          new Set(
            answers
              .map((a) => a.question_id as string | undefined)
              .filter(Boolean)
          )
        );

        if (ids.length > 0) {
          const { data: questionsData, error: qError } = await supabase
            .from("questions")
            .select("*")
            .in("id", ids);

          if (qError) throw qError;
          setQuestions((questionsData || []) as QuestionRow[]);
        }
      } catch (err) {
        console.error(err);
        setError("Errore nel caricamento del tentativo.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [quizId, attemptId]);

  const anyQuiz: any = quiz || {};
  const answersList = (attempt?.answers || []) as any[];

  const questionsMap = useMemo(() => {
    const map: Record<string, QuestionRow> = {};
    questions.forEach((q) => {
      map[q.id] = q;
    });
    return map;
  }, [questions]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <button
          onClick={() => router.push(`/quiz/${quizId}/attempts`)}
          className="mb-4 text-xs text-slate-300 hover:text-slate-100"
        >
          ← Torna allo storico tentativi
        </button>

        {loading ? (
          <p className="text-sm text-slate-300">Caricamento tentativo…</p>
        ) : error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : !attempt ? (
          <p className="text-sm text-red-400">
            Tentativo non trovato. Controlla l&apos;URL.
          </p>
        ) : (
          <>
            <h1 className="text-lg font-semibold mb-1">
              Dettaglio tentativo – {anyQuiz.title || "Concorso"}
            </h1>
            <p className="text-xs text-slate-300 mb-3">
              Punteggio:{" "}
              <span className="text-sky-400">
                {attempt.score != null ? attempt.score.toFixed(2) : "—"}
              </span>{" "}
              · Corrette:{" "}
              <span className="text-emerald-400">{attempt.correct ?? 0}</span> ·
              Errate:{" "}
              <span className="text-rose-400">{attempt.wrong ?? 0}</span> ·
              Omesse: <span>{attempt.blank ?? 0}</span> · Durata:{" "}
              {formatDuration(attempt.duration_seconds)}
            </p>

            <div className="space-y-3 mt-4">
              {answersList.length === 0 ? (
                <p className="text-xs text-slate-300">
                  Nessun dettaglio risposte salvato per questo tentativo.
                </p>
              ) : (
                answersList.map((a, idx) => {
                  const q = questionsMap[a.question_id as string] as any;
                  const isCorrect = !!a.is_correct;
                  return (
                    <div
                      key={idx}
                      className={`rounded-xl border p-3 text-xs ${
                        isCorrect
                          ? "border-emerald-600/70 bg-emerald-900/20"
                          : "border-rose-600/70 bg-rose-900/20"
                      }`}
                    >
                      <div className="flex justify-between mb-1">
                        <span className="text-[11px] text-slate-200">
                          Domanda {idx + 1}
                        </span>
                        <span className="text-[11px]">
                          {isCorrect ? (
                            <span className="text-emerald-400">Corretta</span>
                          ) : a.chosen_option ? (
                            <span className="text-rose-400">Errata</span>
                          ) : (
                            <span className="text-slate-200">Omesa</span>
                          )}
                        </span>
                      </div>
                      <p className="mb-2 text-slate-100">
                        {(a.text as string) || q?.text || "Domanda"}
                      </p>
                      <div className="space-y-1">
                        {["A", "B", "C", "D"].map((opt) => {
                          const key = opt as "A" | "B" | "C" | "D";
                          const text =
                            key === "A"
                              ? a.option_a || q?.option_a
                              : key === "B"
                              ? a.option_b || q?.option_b
                              : key === "C"
                              ? a.option_c || q?.option_c
                              : a.option_d || q?.option_d;

                          if (!text) return null;

                          const isChosen = a.chosen_option === key;
                          const isCorrectOpt =
                            a.correct_answer &&
                            text &&
                            String(text).trim() ===
                              String(a.correct_answer).trim();

                          return (
                            <div
                              key={key}
                              className={`rounded-md px-2 py-1 border text-[11px] ${
                                isCorrectOpt
                                  ? "border-emerald-500/70 bg-emerald-500/10"
                                  : isChosen
                                  ? "border-rose-500/70 bg-rose-500/10"
                                  : "border-slate-700 bg-slate-900/80"
                              }`}
                            >
                              <span className="font-semibold mr-1">
                                {key}.
                              </span>
                              <span>{text}</span>
                              {isCorrectOpt && (
                                <span className="ml-2 text-emerald-400">
                                  (corretta)
                                </span>
                              )}
                              {isChosen && !isCorrectOpt && (
                                <span className="ml-2 text-rose-400">
                                  (tua risposta)
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
