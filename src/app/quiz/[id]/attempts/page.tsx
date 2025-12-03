"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/types/database";

type QuizRow = Database["public"]["Tables"]["quizzes"]["Row"];

type QuizAttemptRow = {
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
};

function formatDuration(seconds: number | null) {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default function QuizAttemptsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: quizId } = use(params);
  const router = useRouter();

  const [quiz, setQuiz] = useState<QuizRow | null>(null);
  const [attempts, setAttempts] = useState<QuizAttemptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [
          { data: quizData, error: quizError },
          { data: attemptsData, error: attemptsError },
        ] = await Promise.all([
          supabase.from("quizzes").select("*").eq("id", quizId).single(),
          supabase
            .from("quiz_attempts" as any)
            .select("*")
            .eq("quiz_id", quizId)
            .order("started_at", { ascending: false }),
        ]);

        if (quizError || attemptsError)
          throw quizError || attemptsError;

        setQuiz(quizData as QuizRow);
        setAttempts((attemptsData || []) as QuizAttemptRow[]);
      } catch (err) {
        console.error(err);
        setError("Errore nel caricamento dei tentativi.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [quizId]);

  const anyQuiz: any = quiz || {};

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <button
          onClick={() => router.push(`/quiz/${quizId}`)}
          className="mb-4 text-xs text-slate-300 hover:text-slate-100"
        >
          ← Torna alla pagina concorso
        </button>

        <h1 className="text-lg font-semibold mb-2">
          Storico tentativi – {anyQuiz.title || "Concorso"}
        </h1>

        {loading ? (
          <p className="text-sm text-slate-300">Caricamento tentativi…</p>
        ) : error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : attempts.length === 0 ? (
          <p className="text-sm text-slate-300">
            Non hai ancora effettuato tentativi per questo concorso.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 mt-3">
            <table className="w-full text-xs">
              <thead className="bg-slate-900 text-slate-300">
                <tr>
                  <th className="px-3 py-2 text-left">Data</th>
                  <th className="px-3 py-2 text-left">Domande</th>
                  <th className="px-3 py-2 text-left">Corrette</th>
                  <th className="px-3 py-2 text-left">Errate</th>
                  <th className="px-3 py-2 text-left">Omesse</th>
                  <th className="px-3 py-2 text-left">Punteggio</th>
                  <th className="px-3 py-2 text-left">Durata</th>
                  <th className="px-3 py-2 text-left">Dettaglio</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr
                    key={a.id}
                    className="border-t border-slate-800 hover:bg-slate-900/70"
                  >
                    <td className="px-3 py-2 align-top text-slate-200">
                      {a.finished_at
                        ? new Date(a.finished_at).toLocaleString()
                        : a.started_at
                        ? new Date(a.started_at).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-3 py-2 align-top">
                      {a.total_questions ?? "—"}
                    </td>
                    <td className="px-3 py-2 align-top text-emerald-400">
                      {a.correct ?? 0}
                    </td>
                    <td className="px-3 py-2 align-top text-rose-400">
                      {a.wrong ?? 0}
                    </td>
                    <td className="px-3 py-2 align-top text-slate-200">
                      {a.blank ?? 0}
                    </td>
                    <td className="px-3 py-2 align-top text-sky-400">
                      {a.score != null ? a.score.toFixed(2) : "—"}
                    </td>
                    <td className="px-3 py-2 align-top text-slate-200">
                      {formatDuration(a.duration_seconds)}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <button
                        onClick={() =>
                          router.push(
                            `/quiz/${quizId}/attempts/${a.id}`
                          )
                        }
                        className="rounded-md bg-slate-800 px-2 py-1 text-[11px]"
                      >
                        Vedi errori
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
