"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/types/database";

type QuizRow = Database["public"]["Tables"]["quizzes"]["Row"];
type SubjectRow = Database["public"]["Tables"]["subjects"]["Row"];
type QuestionRow = Database["public"]["Tables"]["questions"]["Row"];

type AnswerOption = "A" | "B" | "C" | "D";

type SubjectStat = {
  subjectId: string;
  name: string;
  total: number;
  correct: number;
  wrong: number;
  blank: number;
};

type CustomMode = "standard" | "errors_recent" | "most_wrong";

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}

function formatTime(seconds: number | null) {
  if (seconds === null || seconds < 0) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const mm = m.toString().padStart(2, "0");
  const ss = s.toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function CustomQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: quizId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  const paramModeRaw = searchParams.get("mode");
  const paramMode: CustomMode =
    paramModeRaw === "errors_recent" || paramModeRaw === "most_wrong"
      ? paramModeRaw
      : "standard";

  const paramMinutes = searchParams.get("minutes");
  const paramSubjects = searchParams.get("subjects");
  const paramDist = searchParams.get("dist");
  const paramAttempts = searchParams.get("attempts");
  const paramLimit = searchParams.get("limit");

  const selectedSubjectIds = useMemo(
    () =>
      paramSubjects
        ? paramSubjects
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    [paramSubjects]
  );

  const distributionMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (!paramDist) return map;
    const chunks = paramDist.split(",").map((c) => c.trim());
    chunks.forEach((chunk) => {
      const [id, raw] = chunk.split(":");
      if (!id || !raw) return;
      const n = Number.parseInt(raw, 10);
      if (!Number.isFinite(n) || n <= 0) return;
      map[id] = n;
    });
    return map;
  }, [paramDist]);

  const [quiz, setQuiz] = useState<QuizRow | null>(null);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<QuestionRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerOption | null>>(
    {}
  );
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState<{
    correct: number;
    wrong: number;
    blank: number;
    score: number;
  } | null>(null);

  const [subjectBreakdown, setSubjectBreakdown] = useState<SubjectStat[]>([]);

  const [customTimeLimit, setCustomTimeLimit] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const needAttempts =
          paramMode === "errors_recent" || paramMode === "most_wrong";
        const recentAttemptsLimit = (() => {
          const n = paramAttempts ? Number.parseInt(paramAttempts, 10) : NaN;
          if (Number.isFinite(n) && n > 0) return n;
          return 10; // default: ultimi 10 tentativi per "solo errori"
        })();
        const mostWrongLimit = (() => {
          const n = paramLimit ? Number.parseInt(paramLimit, 10) : NaN;
          if (Number.isFinite(n) && n > 0) return n;
          return 50; // default: max 50 domande "più sbagliate"
        })();

        const [
          { data: quizData, error: quizError },
          { data: subjectsData, error: subjectsError },
          { data: questionsData, error: questionsError },
          attemptsRes,
        ] = await Promise.all([
          supabase.from("quizzes").select("*").eq("id", quizId).single(),
          supabase.from("subjects").select("*").eq("quiz_id", quizId),
          supabase.from("questions").select("*").eq("quiz_id", quizId),
          needAttempts
            ? supabase
                .from("quiz_attempts" as any)
                .select("id, answers, finished_at")
                .eq("quiz_id", quizId)
                .order("finished_at", { ascending: false })
                .limit(
                  paramMode === "errors_recent"
                    ? recentAttemptsLimit
                    : mostWrongLimit
                )
            : Promise.resolve({ data: null, error: null } as any),
        ]);

        if (quizError || subjectsError || questionsError) {
          throw quizError || subjectsError || questionsError;
        }

        const attemptsError =
          "error" in attemptsRes && attemptsRes.error
            ? attemptsRes.error
            : null;
        if (attemptsError) {
          throw attemptsError;
        }

        const attemptsData = ((attemptsRes as any).data || []) as any[];

        const qz = quizData as QuizRow;
        const sbj = (subjectsData || []) as SubjectRow[];
        const qs = (questionsData || []) as QuestionRow[];

        // domande attive
        let activeQuestions = qs.filter((q: any) => !q.is_archived);

        // filtra per materie selezionate (se presenti)
        if (selectedSubjectIds.length > 0) {
          activeQuestions = activeQuestions.filter((q: any) =>
            q.subject_id && selectedSubjectIds.includes(q.subject_id as string)
          );
        }

        if (activeQuestions.length === 0) {
          setError(
            selectedSubjectIds.length > 0
              ? "Non ci sono domande attive nelle materie selezionate. Modifica le materie o aggiungi domande dall'area admin."
              : "Non ci sono domande attive per questo concorso. Aggiungile dall'area admin."
          );
          setLoading(false);
          return;
        }

        const activeById: Record<string, QuestionRow> = {};
        activeQuestions.forEach((q) => {
          activeById[q.id] = q;
        });

        if (needAttempts && attemptsData.length === 0) {
          setError(
            "Non ci sono ancora tentativi registrati per questo concorso. Fai prima almeno un quiz ufficiale per usare la modalità basata sugli errori."
          );
          setLoading(false);
          return;
        }

        const selected: QuestionRow[] = [];

        if (paramMode === "standard") {
          if (Object.keys(distributionMap).length === 0) {
            setError(
              "Non è stata definita alcuna distribuzione per il quiz personalizzato. Torna alla pagina concorso e imposta il numero di domande per materia."
            );
            setLoading(false);
            return;
          }

          const bySubject: Record<string, QuestionRow[]> = {};
          activeQuestions.forEach((q: any) => {
            const sid = q.subject_id as string | undefined;
            if (!sid) return;
            if (!bySubject[sid]) bySubject[sid] = [];
            bySubject[sid].push(q as QuestionRow);
          });

          Object.entries(distributionMap).forEach(([subjectId, count]) => {
            const pool = bySubject[subjectId] || [];
            if (pool.length === 0) return;
            const n = Math.min(count, pool.length);
            const subset = shuffle(pool).slice(0, n);
            subset.forEach((q) => selected.push(q));
          });
        } else if (paramMode === "errors_recent") {
          // SOLO ERRORI RECENTI: domande sbagliate negli ultimi N tentativi (senza duplicati), in ordine di recenza
          const seen = new Set<string>();
          const maxQuestions = mostWrongLimit || 100; // usiamo mostWrongLimit come cap generico

          outer: for (const att of attemptsData) {
            const arr = (att.answers || []) as any[];
            if (!Array.isArray(arr)) continue;
            for (const ans of arr) {
              if (!ans) continue;
              const qid = ans.question_id as string | undefined;
              if (!qid) continue;
              if (seen.has(qid)) continue;
              if (ans.is_correct) continue;

              const q = activeById[qid];
              if (!q) continue; // domanda non attiva o materia esclusa

              seen.add(qid);
              selected.push(q);

              if (selected.length >= maxQuestions) {
                break outer;
              }
            }
          }
        } else if (paramMode === "most_wrong") {
          // DOMANDE PIÙ SBAGLIATE: calcola quante volte hai sbagliato ogni domanda
          const statsMap: Record<
            string,
            { wrong: number; total: number }
          > = {};

          for (const att of attemptsData) {
            const arr = (att.answers || []) as any[];
            if (!Array.isArray(arr)) continue;
            for (const ans of arr) {
              if (!ans) continue;
              const qid = ans.question_id as string | undefined;
              if (!qid) continue;
              if (!activeById[qid]) continue; // ignoriamo domande non attive o fuori materie

              if (!statsMap[qid]) {
                statsMap[qid] = { wrong: 0, total: 0 };
              }
              statsMap[qid].total += 1;
              if (!ans.is_correct) {
                statsMap[qid].wrong += 1;
              }
            }
          }

          const limit = (() => {
            const n = paramLimit ? Number.parseInt(paramLimit, 10) : NaN;
            if (Number.isFinite(n) && n > 0) return n;
            return 50;
          })();

          const sorted = Object.entries(statsMap)
            .filter(([, st]) => st.wrong > 0)
            .sort((a, b) => b[1].wrong - a[1].wrong);

          for (const [qid] of sorted.slice(0, limit)) {
            if (!activeById[qid]) continue;
            selected.push(activeById[qid]);
          }
        }

        if (selected.length === 0) {
          setError(
            paramMode === "standard"
              ? "Non è stato possibile generare il quiz con la distribuzione scelta. Controlla che ci siano domande per le materie selezionate."
              : "Non ci sono domande sufficienti dagli errori registrati per generare il quiz. Prova a fare altri quiz ufficiali."
          );
          setLoading(false);
          return;
        }

        const initialAnswers: Record<string, AnswerOption | null> = {};
        selected.forEach((q) => {
          initialAnswers[q.id] = null;
        });

        const requestedMinutes = paramMinutes
          ? Number.parseInt(paramMinutes, 10)
          : NaN;
        const anyQuiz: any = qz;
        const minutes =
          Number.isFinite(requestedMinutes) && requestedMinutes > 0
            ? requestedMinutes
            : anyQuiz.time_limit || null;

        setQuiz(qz);
        setSubjects(sbj);
        setQuestions(activeQuestions);
        setSelectedQuestions(selected);
        setAnswers(initialAnswers);
        setCustomTimeLimit(minutes);

        if (minutes) {
          setRemainingSeconds(minutes * 60);
          setTimerActive(true);
        }
      } catch (err) {
        console.error(err);
        setError("Errore nel caricamento del quiz personalizzato.");
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    quizId,
    paramMinutes,
    paramMode,
    paramSubjects,
    paramDist,
    paramAttempts,
    paramLimit,
  ]);

  const anyQuiz: any = quiz || {};

  const subjectsMap = useMemo(() => {
    const map: Record<string, SubjectRow> = {};
    subjects.forEach((s) => {
      map[s.id] = s;
    });
    return map;
  }, [subjects]);

  const totalQuestions = selectedQuestions.length;
  const currentQuestion = selectedQuestions[currentIndex] as any;

  // timer countdown
  useEffect(() => {
    if (!timerActive) return;
    if (finished) return;
    if (remainingSeconds === null) return;
    if (remainingSeconds <= 0) return;

    const id = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null || prev <= 0) return prev;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [timerActive, finished, remainingSeconds]);

  // auto finish quando tempo finisce
  useEffect(() => {
    if (!timerActive) return;
    if (finished) return;
    if (remainingSeconds === null) return;
    if (remainingSeconds > 0) return;

    handleFinish(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds, timerActive, finished]);

  const handleSelectAnswer = (questionId: string, option: AnswerOption) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleFinish = (auto = false) => {
    if (!quiz) return;
    if (finished) return;

    let correct = 0;
    let wrong = 0;
    let blank = 0;

    const sbMap: Record<string, SubjectStat> = {};

    const ensureStat = (subjectId: string | null): SubjectStat => {
      const key = subjectId || "_none";
      if (!sbMap[key]) {
        const name =
          subjectId && subjectsMap[subjectId]
            ? (subjectsMap[subjectId] as any).name || "Materia"
            : "Senza materia";
        sbMap[key] = {
          subjectId: key,
          name,
          total: 0,
          correct: 0,
          wrong: 0,
          blank: 0,
        };
      }
      return sbMap[key];
    };

    selectedQuestions.forEach((q: any) => {
      const chosen = answers[q.id];
      let chosenText: string | null = null;

      if (chosen === "A") chosenText = q.option_a;
      else if (chosen === "B") chosenText = q.option_b;
      else if (chosen === "C") chosenText = q.option_c;
      else if (chosen === "D") chosenText = q.option_d;

      const correctAnswer = (q.correct_answer || "").trim() || null;
      const stat = ensureStat(q.subject_id as string | null);
      stat.total += 1;

      if (!chosen) {
        blank++;
        stat.blank += 1;
      } else {
        if (
          chosenText &&
          correctAnswer &&
          chosenText.trim() === correctAnswer
        ) {
          correct++;
          stat.correct += 1;
        } else {
          wrong++;
          stat.wrong += 1;
        }
      }
    });

    const pc = anyQuiz.points_correct ?? 1;
    const pw = anyQuiz.points_wrong ?? -0.33;
    const pb = anyQuiz.points_blank ?? 0;

    const score = correct * pc + wrong * pw + blank * pb;

    setResult({ correct, wrong, blank, score });
    setSubjectBreakdown(Object.values(sbMap));
    setFinished(true);
    setTimerActive(false);

    if (auto) {
      console.log("Quiz personalizzato terminato per tempo scaduto.");
    }
  };

  const answeredCount = useMemo(
    () =>
      Object.values(answers).filter((v) => v !== null && v !== undefined).length,
    [answers]
  );

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
            Preparazione quiz personalizzato…
          </p>
        ) : error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : !quiz ? (
          <p className="text-sm text-red-400">
            Concorso non trovato. Controlla l&apos;URL.
          </p>
        ) : totalQuestions === 0 ? (
          <p className="text-sm text-slate-300">
            Non ci sono domande sufficienti per generare il quiz
            personalizzato.
          </p>
        ) : finished && result ? (
          // RISULTATO
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <h1 className="text-lg font-semibold mb-1">
                Risultato quiz personalizzato
              </h1>
              <p className="text-xs text-slate-300 mb-3">
                {anyQuiz.title || "Concorso"} · Domande: {totalQuestions} ·{" "}
                Risposte date: {answeredCount}
                {paramMode !== "standard" && (
                  <>
                    {" "}
                    · Modalità:{" "}
                    <span className="text-slate-100">
                      {paramMode === "errors_recent"
                        ? "solo errori recenti"
                        : "domande più sbagliate"}
                    </span>
                  </>
                )}
              </p>

              <div className="grid gap-4 md:grid-cols-4 text-xs">
                <div className="rounded-lg bg-slate-900 border border-emerald-600/60 p-3">
                  <p className="text-slate-300 mb-1">Corrette</p>
                  <p className="text-xl font-semibold text-emerald-400">
                    {result.correct}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-900 border border-rose-600/60 p-3">
                  <p className="text-slate-300 mb-1">Errate</p>
                  <p className="text-xl font-semibold text-rose-400">
                    {result.wrong}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-900 border border-slate-600/60 p-3">
                  <p className="text-slate-300 mb-1">Omesse</p>
                  <p className="text-xl font-semibold text-slate-100">
                    {result.blank}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-900 border border-sky-600/60 p-3">
                  <p className="text-slate-300 mb-1">Punteggio</p>
                  <p className="text-xl font-semibold text-sky-400">
                    {result.score.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Breakdown per materia */}
            {subjectBreakdown.length > 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <h2 className="text-sm font-semibold mb-2">
                  Dettaglio per materia
                </h2>
                <div className="overflow-x-auto text-xs">
                  <table className="w-full">
                    <thead className="text-slate-300 border-b border-slate-800">
                      <tr>
                        <th className="text-left py-1 pr-2">Materia</th>
                        <th className="text-left py-1 px-2">Domande</th>
                        <th className="text-left py-1 px-2">Corrette</th>
                        <th className="text-left py-1 px-2">Errate</th>
                        <th className="text-left py-1 px-2">Omesse</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjectBreakdown.map((s) => (
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setFinished(false);
                setResult(null);
                setCurrentIndex(0);
              }}
              className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white"
            >
              Rivedi le domande
            </button>
          </div>
        ) : (
          // QUIZ IN CORSO
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <h1 className="text-lg font-semibold">
                Quiz personalizzato – {anyQuiz.title || "Concorso"}
              </h1>
              <p className="text-xs text-slate-300 mt-1">
                Domanda {currentIndex + 1} di {totalQuestions} · Risposte
                date: {answeredCount}
              </p>
              {customTimeLimit && (
                <p className="text-[11px] text-slate-200 mt-1 flex items-center gap-2">
                  Tempo: {customTimeLimit} minuti
                  <span className="inline-flex items-center rounded-full bg-slate-900 px-2 py-0.5 font-mono text-[11px] border border-slate-700">
                    {formatTime(remainingSeconds)}
                  </span>
                </p>
              )}
              {paramMode !== "standard" && (
                <p className="text-[11px] text-slate-400 mt-1">
                  Modalità:{" "}
                  {paramMode === "errors_recent"
                    ? "solo errori recenti (domande sbagliate negli ultimi tentativi)"
                    : "domande più sbagliate (quelle dove hai sbagliato più volte)"}
                </p>
              )}
            </div>

            {currentQuestion && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="mb-2 text-[11px] text-slate-400">
                  {currentQuestion.subject_id &&
                    subjectsMap[currentQuestion.subject_id] && (
                      <>
                        Materia:{" "}
                        <span className="text-slate-200">
                          {subjectsMap[currentQuestion.subject_id].name}
                        </span>
                      </>
                    )}
                </div>

                <p className="text-sm text-slate-100 mb-3">
                  {currentQuestion.text}
                </p>

                <div className="space-y-2 text-xs">
                  {["A", "B", "C", "D"].map((opt) => {
                    const key = opt as AnswerOption;
                    const text =
                      key === "A"
                        ? currentQuestion.option_a
                        : key === "B"
                        ? currentQuestion.option_b
                        : key === "C"
                        ? currentQuestion.option_c
                        : currentQuestion.option_d;

                    if (!text) return null;

                    const checked = answers[currentQuestion.id] === key;

                    return (
                      <label
                        key={key}
                        className={`flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer ${
                          checked
                            ? "border-sky-500 bg-sky-500/10"
                            : "border-slate-700 bg-slate-900"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${currentQuestion.id}`}
                          className="h-3 w-3"
                          checked={checked}
                          onChange={() =>
                            handleSelectAnswer(currentQuestion.id, key)
                          }
                        />
                        <span className="font-semibold">{key}.</span>
                        <span>{text}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
              >
                ← Indietro
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => handleFinish(false)}
                  className="rounded-md bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white"
                >
                  Termina quiz
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentIndex === totalQuestions - 1}
                  className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
                >
                  Avanti →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
