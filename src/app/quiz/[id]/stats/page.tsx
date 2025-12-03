"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/types/database";

type QuizRow = Database["public"]["Tables"]["quizzes"]["Row"];
type SubjectRow = Database["public"]["Tables"]["subjects"]["Row"];

type AttemptRow = {
  id: string;
  quiz_id: string;
  score: number;
  total_questions?: number | null;
  correct?: number | null;
  wrong?: number | null;
  blank?: number | null;
  duration_seconds?: number | null;
  finished_at?: string | null;
  answers?: any[] | null;
};

type SubjectStat = {
  subjectId: string;
  name: string;
  total: number;
  correct: number;
  wrong: number;
  blank: number;
};

export default function QuizStatsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: quizId } = use(params);
  const router = useRouter();

  const [quiz, setQuiz] = useState<QuizRow | null>(null);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1) Quiz
        const { data: quizData, error: quizError } = await supabase
          .from("quizzes")
          .select("*")
          .eq("id", quizId)
          .single();

        if (quizError || !quizData) {
          console.warn("Errore caricando quiz in stats:", quizError);
          setError("Impossibile caricare il concorso per le statistiche.");
          setQuiz(null);
          setSubjects([]);
          setAttempts([]);
          setLoading(false);
          return;
        }

        setQuiz(quizData as QuizRow);

        // 2) Materie
        const {
          data: subjectsData,
          error: subjectsError,
        } = await supabase.from("subjects").select("*").eq("quiz_id", quizId);

        if (subjectsError) {
          console.warn("Errore caricando subjects in stats:", subjectsError);
          setSubjects([]);
        } else {
          setSubjects((subjectsData || []) as SubjectRow[]);
        }

        // 3) Tentativi (tutti quelli di questo quiz)
        const {
          data: attemptsData,
          error: attemptsError,
        } = await supabase
          .from("quiz_attempts" as any)
          .select("*")
          .eq("quiz_id", quizId)
          .order("finished_at", { ascending: false })
          .limit(200);

        if (attemptsError) {
          console.warn("Errore caricando quiz_attempts in stats:", attemptsError);
          setAttempts([]);
        } else {
          setAttempts((attemptsData || []) as AttemptRow[]);
        }
      } catch (err) {
        console.error("Errore imprevisto in stats:", err);
        setError("Errore nel caricamento delle statistiche del concorso.");
        setQuiz(null);
        setSubjects([]);
        setAttempts([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [quizId]);

  const anyQuiz: any = quiz || {};

  const subjectsMap = useMemo(() => {
    const map: Record<string, SubjectRow> = {};
    subjects.forEach((s) => {
      map[s.id] = s;
    });
    return map;
  }, [subjects]);

  const totalAttempts = attempts.length;

  const scoreStats = useMemo(() => {
    if (!attempts.length) {
      return {
        avg: null as number | null,
        best: null as number | null,
        worst: null as number | null,
      };
    }
    let sum = 0;
    let best = -Infinity;
    let worst = Infinity;
    attempts.forEach((a) => {
      sum += a.score;
      if (a.score > best) best = a.score;
      if (a.score < worst) worst = a.score;
    });
    return {
      avg: sum / attempts.length,
      best,
      worst,
    };
  }, [attempts]);

  const lastAttemptDate = useMemo(() => {
    if (!attempts.length) return null;
    const a = attempts[0];
    return a.finished_at ? new Date(a.finished_at) : null;
  }, [attempts]);

  // 🔹 Dati per grafico punteggio nel tempo (ultimi 20 tentativi, in ordine cronologico)
  const scoreChartData = useMemo(() => {
    if (!attempts.length) {
      return {
        series: [] as AttemptRow[],
        min: null as number | null,
        max: null as number | null,
      };
    }

    const sorted = [...attempts].sort((a, b) => {
      const ta = a.finished_at ? new Date(a.finished_at).getTime() : 0;
      const tb = b.finished_at ? new Date(b.finished_at).getTime() : 0;
      return ta - tb;
    });

    const series = sorted.slice(-20); // ultimi 20

    let min = series[0].score;
    let max = series[0].score;
    series.forEach((a) => {
      if (a.score < min) min = a.score;
      if (a.score > max) max = a.score;
    });

    return { series, min, max };
  }, [attempts]);

  // 🔹 Limite tempo ufficiale (se presente)
  const quizTimeLimitMinutes = useMemo(() => {
    if (!quiz) return null;
    const q: any = quiz;
    return q.time_limit ?? q.time_limit_minutes ?? null;
  }, [quiz]);

  // 🔹 Dati per grafico tempo usato (ultimi 20 con duration)
  const durationChartData = useMemo(() => {
    const withDuration = attempts.filter(
      (a) => a.duration_seconds != null && a.duration_seconds! > 0
    );
    if (!withDuration.length) {
      return { series: [] as AttemptRow[] };
    }

    const sorted = [...withDuration].sort((a, b) => {
      const ta = a.finished_at ? new Date(a.finished_at).getTime() : 0;
      const tb = b.finished_at ? new Date(b.finished_at).getTime() : 0;
      return ta - tb;
    });

    return { series: sorted.slice(-20) };
  }, [attempts]);

  const subjectStats = useMemo<SubjectStat[]>(() => {
    if (!attempts.length || !subjects.length) return [];

    const map: Record<string, SubjectStat> = {};

    const ensureStat = (subjectId: string | null): SubjectStat => {
      const key = subjectId || "_none";
      if (!map[key]) {
        const subj = subjectId ? subjectsMap[subjectId] : null;
        map[key] = {
          subjectId: key,
          name: subj?.name || (subjectId ? "Materia" : "Senza materia"),
          total: 0,
          correct: 0,
          wrong: 0,
          blank: 0,
        };
      }
      return map[key];
    };

    attempts.forEach((att) => {
      const arr = (att.answers || []) as any[];
      if (!Array.isArray(arr)) return;
      arr.forEach((ans) => {
        if (!ans) return;
        const subjectId = (ans.subject_id as string | null) ?? null;
        const stat = ensureStat(subjectId);
        stat.total += 1;

        if (ans.is_correct) {
          stat.correct += 1;
        } else {
          if (ans.chosen_option == null) {
            stat.blank += 1;
          } else {
            stat.wrong += 1;
          }
        }
      });
    });

    return Object.values(map).filter((s) => s.total > 0);
  }, [attempts, subjects, subjectsMap]);

  const weakSubjects = useMemo(() => {
    if (!subjectStats.length) return [];
    return [...subjectStats]
      .map((s) => ({
        ...s,
        accuracy: s.total > 0 ? s.correct / s.total : 0,
      }))
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 3);
  }, [subjectStats]);

  const formatDateTime = (d: Date | null) => {
    if (!d) return "-";
    return d.toLocaleString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPercent = (value: number | null) => {
    if (value === null) return "-";
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <button
          onClick={() => router.push(`/quiz/${quizId}`)}
          className="mb-4 text-xs text-slate-300 hover:text-slate-100"
        >
          ← Torna alla pagina concorso
        </button>

        {loading ? (
          <p className="text-sm text-slate-300">
            Caricamento statistiche del concorso…
          </p>
        ) : error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : !quiz ? (
          <p className="text-sm text-red-400">
            Concorso non trovato. Controlla l&apos;URL.
          </p>
        ) : (
          <>
            {/* HEADER */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 mb-4">
              <h1 className="text-xl font-semibold mb-1">
                Statistiche – {anyQuiz.title || "Concorso"}
              </h1>
              <p className="text-xs text-slate-300 mb-1">
                ID:{" "}
                <span className="font-mono text-slate-100">
                  {quizId.slice(0, 8)}…
                </span>
              </p>
              <p className="text-[11px] text-slate-400">
                Basate sui record salvati in <code>quiz_attempts</code> per
                questo concorso (quiz ufficiali e altre modalità che
                registrano le risposte).
              </p>
            </div>

            {totalAttempts === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <p className="text-sm text-slate-200 mb-1">
                  Nessun tentativo registrato per questo concorso.
                </p>
                <p className="text-xs text-slate-400">
                  Fai almeno un quiz ufficiale per iniziare a vedere le
                  statistiche.
                </p>
              </div>
            ) : (
              <>
                {/* STAT CARDS */}
                <div className="grid gap-4 md:grid-cols-4 mb-4 text-xs">
                  <div className="rounded-xl bg-slate-900 border border-slate-700 p-3">
                    <p className="text-slate-300 mb-1">Tentativi totali</p>
                    <p className="text-2xl font-semibold text-slate-100">
                      {totalAttempts}
                    </p>
                    {lastAttemptDate && (
                      <p className="mt-1 text-[10px] text-slate-400">
                        Ultimo: {formatDateTime(lastAttemptDate)}
                      </p>
                    )}
                  </div>
                  <div className="rounded-xl bg-slate-900 border border-emerald-700 p-3">
                    <p className="text-slate-300 mb-1">Punteggio medio</p>
                    <p className="text-2xl font-semibold text-emerald-400">
                      {scoreStats.avg !== null
                        ? scoreStats.avg.toFixed(2)
                        : "-"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-900 border border-sky-700 p-3">
                    <p className="text-slate-300 mb-1">Miglior punteggio</p>
                    <p className="text-2xl font-semibold text-sky-400">
                      {scoreStats.best !== null
                        ? scoreStats.best.toFixed(2)
                        : "-"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-900 border border-rose-700 p-3">
                    <p className="text-slate-300 mb-1">Peggior punteggio</p>
                    <p className="text-2xl font-semibold text-rose-400">
                      {scoreStats.worst !== null
                        ? scoreStats.worst.toFixed(2)
                        : "-"}
                    </p>
                  </div>
                </div>

                {/* 🔹 Mini grafici */}
                <div className="grid gap-4 md:grid-cols-2 mb-4 text-xs">
                  {/* Andamento punteggio nel tempo */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
                    <h2 className="text-sm font-semibold mb-1">
                      Andamento punteggio nel tempo
                    </h2>
                    <p className="text-[11px] text-slate-400 mb-2">
                      Ultimi {scoreChartData.series.length} tentativi (da
                      sinistra il più vecchio a destra il più recente).
                      Passa il mouse sulle colonne per vedere dettaglio.
                    </p>
                    {scoreChartData.series.length <= 1 ? (
                      <p className="text-[11px] text-slate-400">
                        Fai almeno 2 tentativi per vedere il grafico.
                      </p>
                    ) : (
                      <div className="h-28 flex items-end gap-1">
                        {scoreChartData.series.map((a, index) => {
                          const min = scoreChartData.min!;
                          const max = scoreChartData.max!;
                          const span = max - min || 1;
                          const normalized =
                            min === max
                              ? 0.5
                              : (a.score - min) / span; // 0–1
                          const height = 30 + normalized * 60; // 30–90 px
                          const labelDate = a.finished_at
                            ? new Date(a.finished_at).toLocaleString("it-IT", {
                                day: "2-digit",
                                month: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Data sconosciuta";

                          return (
                            <div
                              key={a.id}
                              className="flex-1 flex flex-col items-center"
                            >
                              <div
                                className="w-full rounded-t-md bg-emerald-500/80 hover:bg-emerald-400 transition-colors"
                                style={{ height: `${height}px` }}
                                title={`Tentativo ${
                                  index + 1
                                }: ${a.score.toFixed(
                                  2
                                )} pt · ${labelDate}`}
                              />
                              <span className="mt-1 text-[9px] text-slate-500">
                                {index + 1}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Tempo usato vs disponibile */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
                    <h2 className="text-sm font-semibold mb-1">
                      Tempo impiegato vs limite
                    </h2>
                    {quizTimeLimitMinutes ? (
                      <p className="text-[11px] text-slate-400 mb-2">
                        Limite ufficiale:{" "}
                        <span className="text-slate-100">
                          {quizTimeLimitMinutes} minuti
                        </span>
                        . Le barre blu mostrano la percentuale di tempo usata
                        per ogni tentativo (ultimi{" "}
                        {durationChartData.series.length}).
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400 mb-2">
                        Limite ufficiale non impostato per questo concorso.
                        Mostro solo il tempo impiegato (in minuti) negli ultimi{" "}
                        {durationChartData.series.length} tentativi.
                      </p>
                    )}

                    {durationChartData.series.length === 0 ? (
                      <p className="text-[11px] text-slate-400">
                        Nessuna informazione sul tempo registrata per i
                        tentativi.
                      </p>
                    ) : (
                      <div className="space-y-1 max-h-40 overflow-auto pr-1">
                        {durationChartData.series.map((a, index) => {
                          const usedMinutes = (a.duration_seconds ?? 0) / 60;
                          const limit = quizTimeLimitMinutes;
                          const ratio = limit
                            ? Math.min(usedMinutes / limit, 1.2)
                            : 1;
                          const labelDate = a.finished_at
                            ? new Date(a.finished_at).toLocaleString("it-IT", {
                                day: "2-digit",
                                month: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Data sconosciuta";

                          return (
                            <div
                              key={a.id}
                              className="flex items-center gap-2 text-[10px]"
                            >
                              <span className="w-4 text-right text-slate-500">
                                {index + 1}.
                              </span>
                              <div
                                className="flex-1 relative h-2 rounded-full bg-slate-800 overflow-hidden"
                                title={
                                  limit
                                    ? `Tentativo ${index + 1}: ${usedMinutes.toFixed(
                                        1
                                      )} min su ${limit} min · ${labelDate}`
                                    : `Tentativo ${index + 1}: ${usedMinutes.toFixed(
                                        1
                                      )} min · ${labelDate}`
                                }
                              >
                                <div
                                  className="absolute inset-y-0 left-0 bg-sky-500"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      ratio * 100
                                    ).toFixed(1)}%`,
                                  }}
                                />
                              </div>
                              <span className="w-12 text-right text-slate-200">
                                {usedMinutes.toFixed(1)}m
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* MATERIE DEBOLI */}
                {weakSubjects.length > 0 && (
                  <div className="rounded-2xl border border-rose-800 bg-rose-950/20 p-4 mb-4">
                    <h2 className="text-sm font-semibold mb-1">
                      Materie più deboli
                    </h2>
                    <p className="text-[11px] text-slate-200 mb-2">
                      Ordinate dalla peggiore alla migliore in base alla
                      percentuale di risposte corrette (tutti i tentativi di
                      questo concorso).
                    </p>
                    <div className="grid gap-3 md:grid-cols-3 text-xs">
                      {weakSubjects.map((s) => {
                        const accuracy =
                          s.total > 0 ? s.correct / s.total : 0;
                        return (
                          <div
                            key={s.subjectId}
                            className="rounded-xl bg-slate-950/80 border border-rose-800/70 p-3"
                          >
                            <p className="text-slate-100 text-xs mb-1">
                              {s.name}
                            </p>
                            <p className="text-[11px] text-slate-300 mb-1">
                              Domande totali:{" "}
                              <span className="font-mono text-slate-100">
                                {s.total}
                              </span>
                            </p>
                            <p className="text-[11px] text-slate-300 mb-1">
                              Corrette:{" "}
                              <span className="font-mono text-emerald-400">
                                {s.correct}
                              </span>{" "}
                              · Errate:{" "}
                              <span className="font-mono text-rose-400">
                                {s.wrong}
                              </span>{" "}
                              · Omesse:{" "}
                              <span className="font-mono text-slate-200">
                                {s.blank}
                              </span>
                            </p>
                            <p className="text-[11px] text-rose-300">
                              Accuratezza: {formatPercent(accuracy)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TABELLA COMPLETA MATERIE */}
                {subjectStats.length > 0 && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                    <h2 className="text-sm font-semibold mb-2">
                      Performance per materia (tutti i tentativi)
                    </h2>
                    <div className="overflow-x-auto text-xs">
                      <table className="w-full">
                        <thead className="border-b border-slate-800 text-slate-300">
                          <tr>
                            <th className="text-left py-1 pr-2">Materia</th>
                            <th className="text-left py-1 px-2">Domande</th>
                            <th className="text-left py-1 px-2">Corrette</th>
                            <th className="text-left py-1 px-2">Errate</th>
                            <th className="text-left py-1 px-2">Omesse</th>
                            <th className="text-left py-1 px-2">
                              Accuratezza
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {subjectStats.map((s) => {
                            const accuracy =
                              s.total > 0 ? s.correct / s.total : 0;
                            return (
                              <tr
                                key={s.subjectId}
                                className="border-t border-slate-800"
                              >
                                <td className="py-1 pr-2 text-slate-100">
                                  {s.name}
                                </td>
                                <td className="py-1 px-2">{s.total}</td>
                                <td className="py-1 px-2 text-emerald-400">
                                  {s.correct}
                                </td>
                                <td className="py-1 px-2 text-rose-400">
                                  {s.wrong}
                                </td>
                                <td className="py-1 px-2 text-slate-200">
                                  {s.blank}
                                </td>
                                <td className="py-1 px-2 text-slate-100">
                                  {formatPercent(accuracy)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">
                      Aggregato su tutti i record presenti in{" "}
                      <code>quiz_attempts</code> per questo concorso.
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
