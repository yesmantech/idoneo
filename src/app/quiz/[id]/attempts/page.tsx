"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/types/database";

type QuizRow = Database["public"]["Tables"]["quizzes"]["Row"];

type QuizAttemptRow = {
  id: string;
  quiz_id: string;
  score: number | null;
  total_questions: number | null;
  correct: number | null;
  wrong: number | null;
  blank: number | null;
  duration_seconds: number | null;
  started_at: string | null;
  finished_at: string | null;
};

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

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: qData } = await supabase.from("quizzes").select("*").eq("id", quizId).single();
      setQuiz(qData as QuizRow);

      const { data: aData } = await supabase
        .from("quiz_attempts" as any)
        .select("*")
        .eq("quiz_id", quizId)
        .order("started_at", { ascending: false });
      
      setAttempts((aData || []) as QuizAttemptRow[]);
      setLoading(false);
    };
    load();
  }, [quizId]);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Caricamento...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <button onClick={() => router.push(`/quiz/${quizId}`)} className="text-xs text-slate-400 hover:text-white mb-4">← Torna al concorso</button>
        <h1 className="text-2xl font-bold mb-6 text-slate-100">Storico Tentativi</h1>

        {attempts.length === 0 ? (
          <div className="text-slate-500 text-center p-8 bg-slate-900/50 rounded-xl border border-slate-800">
            Nessun tentativo trovato.
          </div>
        ) : (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/50 text-slate-400 border-b border-slate-800 uppercase font-medium">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3 text-center">Punteggio</th>
                  <th className="px-4 py-3 text-center hidden sm:table-cell">Corrette</th>
                  <th className="px-4 py-3 text-center hidden sm:table-cell">Errate</th>
                  <th className="px-4 py-3 text-center hidden sm:table-cell">Durata</th>
                  <th className="px-4 py-3 text-right">Dettaglio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {attempts.map(a => (
                  <tr key={a.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-slate-300">
                      {new Date(a.started_at!).toLocaleDateString('it-IT')}
                      <span className="block text-[10px] text-slate-500">
                        {new Date(a.started_at!).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-sky-400">
                      {a.score != null ? a.score.toFixed(2) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center text-emerald-400 font-medium hidden sm:table-cell">
                      {a.correct}
                    </td>
                    <td className="px-4 py-3 text-center text-rose-400 font-medium hidden sm:table-cell">
                      {a.wrong}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-500 hidden sm:table-cell">
                      {a.duration_seconds ? `${Math.floor(a.duration_seconds/60)}m` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => router.push(`/quiz/${quizId}/attempts/${a.id}`)}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Vedi Errori
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
