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
    const subjectCount = subjects.reduce<Record<string, number>>((acc, subject) => {
      const quizId = subject.quiz_id;
      if (quizId) {
        acc[quizId] = (acc[quizId] || 0) + 1;
      }
      return acc;
    }, {});

    const questionCount = questions.reduce<Record<string, number>>((acc, question) => {
      const quizId = question.quiz_id;
      if (quizId) {
        acc[quizId] = (acc[quizId] || 0) + 1;
      }
      return acc;
    }, {});

    return { subjectCount, questionCount };
  }, [subjects, questions]);

  // Mostra solo concorsi NON archiviati
  const visibleQuizzes = useMemo(
    () => quizzes.filter((quiz) => !quiz.is_archived),
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
                const { subjectCount, questionCount } = statsByQuiz;
                const subjectsNum = subjectCount[quiz.id] || 0;
                const questionsNum = questionCount[quiz.id] || 0;

                const quizTitle = quiz.title || "Concorso senza titolo";
                const quizDescription = quiz.description || "";
                const quizYear = quiz.year ? `Anno ${quiz.year}` : null;

                return (
                  <Link key={quiz.id} href={`/quiz/${quiz.id}`}>
                    <div className="cursor-pointer rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-sky-500 transition-colors">
                      <div className="flex flex-wrap justify-between gap-2">
                        <div>
                          <h3 className="text-sm md:text-base font-semibold">
                            {quizTitle}
                          </h3>
                          <p className="text-xs text-slate-300">
                            {quizYear && <>{quizYear} · </>}
                            {subjectsNum} materia
                            {subjectsNum === 1 ? "" : "e"} · {questionsNum} domanda
                            {questionsNum === 1 ? "" : "e"}
                          </p>
                        </div>
                        <div className="text-xs text-slate-400">
                          {quiz.total_questions && (
                            <div>Domande ufficiali: {quiz.total_questions}</div>
                          )}
                          {quiz.time_limit && (
                            <div>Tempo: {quiz.time_limit} min</div>
                          )}
                        </div>
                      </div>

                      {quizDescription && (
                        <p className="mt-2 text-xs text-slate-300 line-clamp-2">
                          {quizDescription}
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
