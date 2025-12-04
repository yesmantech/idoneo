
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

        if (e1) throw e1;
        if (e2) throw e2;
        if (e3) throw e3;

        setQuizzes(qz || []);
        setSubjects(sbj || []);
        setQuestions(qs || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Errore nel caricamento dei concorsi.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const statsByQuiz = useMemo(() => {
    const subjectCount: Record<string, number> = {};
    subjects.forEach((subject) => {
      if (subject.quiz_id) {
        subjectCount[subject.quiz_id] = (subjectCount[subject.quiz_id] || 0) + 1;
      }
    });

    const questionCount: Record<string, number> = {};
    questions.forEach((question) => {
      if (question.quiz_id) {
        questionCount[question.quiz_id] = (questionCount[question.quiz_id] || 0) + 1;
      }
    });

    return { subjectCount, questionCount };
  }, [subjects, questions]);

  // Mostra solo concorsi NON archiviati
  const visibleQuizzes = useMemo(
    () => quizzes.filter((quiz) => !quiz.is_archived),
    [quizzes]
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main className="mx-auto max-w-5xl px-4 py-8 space-y-10">
        {/* Banner / Hero */}
        <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-sky-900/20 via-slate-900 to-emerald-900/10 p-8 shadow-xl shadow-sky-900/5">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 text-slate-100">
            Allenati ai concorsi pubblici
          </h1>
          <p className="text-base md:text-lg text-slate-400 max-w-2xl leading-relaxed">
            Scegli il concorso, le materie e inizia subito a fare quiz
            ufficiali o personalizzati. Monitora le tue performance e supera la prova.
          </p>
          <div className="mt-6 flex gap-3">
             <Link href="/me">
                <button className="rounded-full bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 transition-colors shadow-lg shadow-sky-900/20">
                  Vai alla Dashboard
                </button>
             </Link>
          </div>
        </section>

        {/* Lista concorsi */}
        <section>
          <h2 className="text-xl font-semibold mb-5 text-slate-200 flex items-center gap-2">
            <span className="w-1 h-6 rounded-full bg-emerald-500"></span>
            Concorsi disponibili
          </h2>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
               {[1, 2, 3].map(i => (
                 <div key={i} className="h-32 rounded-2xl bg-slate-900/50 border border-slate-800 animate-pulse"></div>
               ))}
            </div>
          ) : error ? (
            <p className="text-sm text-red-400 bg-red-900/10 p-4 rounded-xl border border-red-900/20">{error}</p>
          ) : visibleQuizzes.length === 0 ? (
            <p className="text-sm text-slate-400 italic">
              Non ci sono concorsi attivi al momento.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {visibleQuizzes.map((quiz) => {
                const { subjectCount, questionCount } = statsByQuiz;
                const subjectsNum = subjectCount[quiz.id] || 0;
                const questionsNum = questionCount[quiz.id] || 0;

                const quizTitle = quiz.title || "Concorso senza titolo";
                const quizDescription = quiz.description || "";
                const quizYear = quiz.year ? `${quiz.year}` : null;

                return (
                  <Link key={quiz.id} href={`/quiz/${quiz.id}`}>
                    <div className="group h-full cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/40 p-5 hover:bg-slate-900/80 hover:border-sky-500/50 transition-all duration-200">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                             {quizYear && (
                               <span className="inline-flex items-center rounded-md bg-slate-800 px-2 py-1 text-[10px] font-medium text-slate-300 ring-1 ring-inset ring-slate-700/10">
                                 {quizYear}
                               </span>
                             )}
                             {quiz.total_questions && (
                                <span className="inline-flex items-center rounded-md bg-slate-800 px-2 py-1 text-[10px] font-medium text-slate-300 ring-1 ring-inset ring-slate-700/10">
                                  {quiz.total_questions} quesiti
                                </span>
                             )}
                          </div>
                          <h3 className="text-lg font-semibold text-slate-100 group-hover:text-sky-400 transition-colors">
                            {quizTitle}
                          </h3>
                        </div>
                        <div className="text-slate-500">
                           <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                           </svg>
                        </div>
                      </div>

                      {quizDescription && (
                        <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                          {quizDescription}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium border-t border-slate-800/50 pt-3 mt-auto">
                        <span className="flex items-center gap-1.5">
                           <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                           {subjectsNum} Materie
                        </span>
                        <span className="flex items-center gap-1.5">
                           <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                           {questionsNum} Domande
                        </span>
                        {quiz.time_limit && (
                           <span className="flex items-center gap-1.5">
                             <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                             {quiz.time_limit} min
                           </span>
                        )}
                      </div>
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
