"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/types/database";

type QuizRow = Database["public"]["Tables"]["quizzes"]["Row"];
type SubjectRow = Database["public"]["Tables"]["subjects"]["Row"];
type QuestionRow = Database["public"]["Tables"]["questions"]["Row"];

export default function HomePage() {
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [
          { data: qz, error: e1 },
          { data: sbj, error: e2 },
          { data: qs, error: e3 },
        ] = await Promise.all([
          supabase
            .from("quizzes")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase.from("subjects").select("*"),
          supabase.from("questions").select("*"),
        ]);

        if (e1 || e2 || e3) throw e1 || e2 || e3;

        setQuizzes(qz || []);
        setSubjects(sbj || []);
        setQuestions(qs || []);
      } catch (err) {
        console.error(err);
        setError("Errore nel caricamento dei concorsi.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const statsByQuiz = useMemo(() => {
    const sCount: Record<string, number> = {};
    const qCount: Record<string, number> = {};

    subjects.forEach((s) => {
      const anyS: any = s;
      const qid = anyS.quiz_id as string | undefined;
      if (!qid) return;
      sCount[qid] = (sCount[qid] || 0) + 1;
    });

    questions.forEach((q) => {
      const anyQ: any = q;
      const qid = anyQ.quiz_id as string | undefined;
      if (!qid) return;
      qCount[qid] = (qCount[qid] || 0) + 1;
    });

    return { sCount, qCount };
  }, [subjects, questions]);

  // Mostra solo concorsi NON archiviati
  const visibleQuizzes = useMemo(
    () =>
      quizzes.filter((quiz) => {
        const anyQ: any = quiz;
        return !anyQ.is_archived; // se null/undefined ⇒ considerato attivo
      }),
    [quizzes]
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        {/* Banner / Hero */}
        <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-sky-600/20 via-slate-900 to-emerald-500/10 p-6">
          <h1 className="text-2xl md:text-3xl font-semibold mb-2">
            Allenati ai concorsi pubblici in modo intelligente
          </h1>
          <p className="text-sm md:text-base text-slate-200 max-w-2xl">
            Scegli il concorso, le materie e inizia subito a fare quiz
            ufficiali o personalizzati. Statistiche dettagliate, simulazioni
            fedeli al bando e allenamento mirato sugli errori.
          </p>
        </section>

        {/* Lista concorsi */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Concorsi disponibili</h2>

          {loading ? (
            <p className="text-sm text-slate-300">Caricamento concorsi…</p>
          ) : error ? (
            <p className="text-sm text-red-400">{error}</p>
          ) : visibleQuizzes.length === 0 ? (
            <p className="text-sm text-slate-300">
              Non ci sono concorsi attivi. Crea o riattiva un concorso
              dall&apos;area admin.
            </p>
          ) : (
            <div className="space-y-3">
              {visibleQuizzes.map((quiz) => {
                const anyQ: any = quiz;
                const { sCount, qCount } = statsByQuiz;
                const subjectsNum = sCount[quiz.id] || 0;
                const questionsNum = qCount[quiz.id] || 0;

                return (
                  <Link key={quiz.id} href={`/quiz/${quiz.id}`}>
                    <div className="cursor-pointer rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-sky-500 transition-colors">
                      <div className="flex flex-wrap justify-between gap-2">
                        <div>
                          <h3 className="text-sm md:text-base font-semibold">
                            {anyQ.title || "Concorso senza titolo"}
                          </h3>
                          <p className="text-xs text-slate-300">
                            {anyQ.year && <>Anno {anyQ.year} · </>}
                            {subjectsNum} materia
                            {subjectsNum === 1 ? "" : "e"} · {questionsNum} domanda
                            {questionsNum === 1 ? "" : "e"}
                          </p>
                        </div>
                        <div className="text-xs text-slate-400">
                          {anyQ.total_questions && (
                            <div>Domande ufficiali: {anyQ.total_questions}</div>
                          )}
                          {anyQ.time_limit && (
                            <div>Tempo: {anyQ.time_limit} min</div>
                          )}
                        </div>
                      </div>

                      {anyQ.description && (
                        <p className="mt-2 text-xs text-slate-300 line-clamp-2">
                          {anyQ.description}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
