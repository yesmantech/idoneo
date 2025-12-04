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
  duration_seconds: number | null;
  finished_at: string | null;
  answers: any[] | null; // Ideally this should be typed strictly if possible
};

type SubjectStat = {
  subjectId: string;
  name: string;
  total: number;
  correct: number;
  wrong: number;
  blank: number;
  accuracy: number;
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
        const { data: quizData, error: qErr } = await supabase.from("quizzes").select("*").eq("id", quizId).single();
        if (qErr || !quizData) throw new Error("Quiz non trovato");
        setQuiz(quizData as QuizRow);

        const { data: sData } = await supabase.from("subjects").select("*").eq("quiz_id", quizId);
        setSubjects((sData || []) as SubjectRow[]);

        // Load attempts with answers JSON
        const { data: aData, error: aErr } = await supabase
          .from("quiz_attempts" as any)
          .select("*")
          .eq("quiz_id", quizId)
          .not("finished_at", "is", null) // Only finished attempts
          .order("finished_at", { ascending: false })
          .limit(100); // Last 100 attempts for stats

        if (aErr) throw new Error("Errore caricamento statistiche");
        setAttempts((aData || []) as AttemptRow[]);

      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [quizId]);

  // Calculations
  const subjectsMap = useMemo(() => {
    const map: Record<string, SubjectRow> = {};
    subjects.forEach(s => map[s.id] = s);
    return map;
  }, [subjects]);

  const stats = useMemo(() => {
    if (attempts.length === 0) return null;

    // 1. Score trend
    const scores = attempts.map(a => a.score);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);

    // 2. Subject Breakdown
    const subStats: Record<string, SubjectStat> = {};
    
    attempts.forEach(att => {
      if (!att.answers || !Array.isArray(att.answers)) return;
      att.answers.forEach((ans: any) => {
        const sid = ans.subject_id || "unknown";
        if (!subStats[sid]) {
          subStats[sid] = {
            subjectId: sid,
            name: subjectsMap[sid]?.name || "Altro",
            total: 0, correct: 0, wrong: 0, blank: 0, accuracy: 0
          };
        }
        subStats[sid].total++;
        if (ans.is_correct) subStats[sid].correct++;
        else if (ans.chosen_option) subStats[sid].wrong++;
        else subStats[sid].blank++;
      });
    });

    const subjectsList = Object.values(subStats).map(s => ({
      ...s,
      accuracy: s.total > 0 ? (s.correct / s.total) * 100 : 0
    })).sort((a, b) => a.accuracy - b.accuracy); // Sort by accuracy ascending (weakest first)

    return {
      count: attempts.length,
      avgScore,
      maxScore,
      minScore,
      subjectsList,
      history: attempts.slice().reverse() // Oldest first for chart
    };
  }, [attempts, subjectsMap]);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Calcolo statistiche...</div>;
  if (!quiz) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-red-400">Errore</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <button onClick={() => router.push(`/quiz/${quizId}`)} className="text-xs text-slate-400 hover:text-white mb-4">← Torna al concorso</button>
        <h1 className="text-2xl font-bold mb-6 text-slate-100">Statistiche Avanzate</h1>

        {!stats || stats.count === 0 ? (
          <div className="p-8 text-center bg-slate-900 rounded-xl border border-slate-800 text-slate-400">
            Nessun tentativo completato. Fai qualche quiz per vedere le tue statistiche!
          </div>
        ) : (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <div className="text-xs text-slate-500 uppercase">Simulazioni</div>
                <div className="text-2xl font-bold text-slate-100">{stats.count}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <div className="text-xs text-slate-500 uppercase">Media Punti</div>
                <div className="text-2xl font-bold text-sky-400">{stats.avgScore.toFixed(1)}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <div className="text-xs text-slate-500 uppercase">Best Score</div>
                <div className="text-2xl font-bold text-emerald-400">{stats.maxScore.toFixed(1)}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <div className="text-xs text-slate-500 uppercase">Weakest Subj</div>
                <div className="text-sm font-bold text-rose-400 truncate mt-1">
                  {stats.subjectsList[0]?.name || "-"}
                </div>
                <div className="text-[10px] text-slate-500">{stats.subjectsList[0]?.accuracy.toFixed(0)}% accuracy</div>
              </div>
            </div>

            {/* Performance Chart (Simple CSS Bar Chart) */}
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl mb-8">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Andamento Punteggio</h3>
              <div className="h-40 flex items-end gap-1">
                {stats.history.map((h, i) => {
                  const percent = Math.max(0, Math.min(100, (h.score / (quiz.points_correct ? (quiz.total_questions || 100) * quiz.points_correct : 100)) * 100));
                  // Normalize height broadly for visual
                  const height = Math.max(10, Math.min(100, (h.score + 20) / (stats.maxScore + 20) * 100)); 
                  return (
                    <div key={h.id} className="flex-1 flex flex-col justify-end group relative">
                      <div 
                        style={{ height: `${height}%` }} 
                        className={`w-full rounded-t-sm transition-all hover:opacity-80 ${h.score >= stats.avgScore ? 'bg-emerald-500/60' : 'bg-sky-500/60'}`}
                      ></div>
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                        {h.score.toFixed(2)} pts
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Subject Breakdown Table */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800">
                <h3 className="text-sm font-semibold text-slate-300">Dettaglio per Materia</h3>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/50 text-slate-400">
                  <tr>
                    <th className="px-6 py-3 font-medium">Materia</th>
                    <th className="px-6 py-3 font-medium text-center">Domande</th>
                    <th className="px-6 py-3 font-medium text-center">Accuratezza</th>
                    <th className="px-6 py-3 font-medium text-right hidden sm:table-cell">Err/Tot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {stats.subjectsList.map(s => (
                    <tr key={s.subjectId} className="hover:bg-slate-800/20">
                      <td className="px-6 py-3 font-medium text-slate-200">{s.name}</td>
                      <td className="px-6 py-3 text-center text-slate-400">{s.total}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2 max-w-[120px] mx-auto">
                          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${s.accuracy > 70 ? 'bg-emerald-500' : s.accuracy > 40 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${s.accuracy}%` }}></div>
                          </div>
                          <span className="text-[10px] w-8 text-right">{s.accuracy.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right text-slate-500 hidden sm:table-cell">
                        {s.wrong} / {s.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
