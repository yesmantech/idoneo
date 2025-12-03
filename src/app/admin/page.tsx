"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/types/database";

type QuestionRow = Database["public"]["Tables"]["questions"]["Row"];
type SubjectRow = Database["public"]["Tables"]["subjects"]["Row"];
type QuizRow = Database["public"]["Tables"]["quizzes"]["Row"];

type QuestionListItem = QuestionRow & {
  subjects?: SubjectRow | null;
  quizzes?: QuizRow | null;
};

export default function AdminQuestionsPage() {
  const router = useRouter();

  const [questions, setQuestions] = useState<QuestionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const loadQuestions = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("questions")
        .select(
          `
          *,
          subjects(*),
          quizzes(*)
        `
        )
        .order("created_at", { ascending: false })
        .limit(300);

      if (error) {
        console.error("Errore caricando domande:", error);
        setError("Errore nel caricamento delle domande.");
        setQuestions([]);
        return;
      }

      setQuestions((data || []) as QuestionListItem[]);
    } catch (err) {
      console.error("Errore imprevisto caricando domande:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Errore imprevisto nel caricamento delle domande."
      );
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const handleToggleArchived = async (q: QuestionListItem) => {
    const newValue = !q.is_archived;
    try {
      const { error } = await supabase
        .from("questions")
        .update({ is_archived: newValue })
        .eq("id", q.id);

      if (error) {
        console.error("Errore aggiornando is_archived:", error);
        alert("Errore nel cambiare lo stato della domanda.");
        return;
      }

      setQuestions((prev) =>
        prev.map((item) =>
          item.id === q.id ? { ...item, is_archived: newValue } : item
        )
      );
    } catch (err) {
      console.error("Errore imprevisto toggle archiviazione:", err);
      alert("Errore nel cambiare lo stato della domanda.");
    }
  };

  const filteredQuestions = useMemo(() => {
    const term = search.trim().toLowerCase();

    return questions.filter((question) => {
      if (!showArchived && question.is_archived) return false;
      if (!term) return true;

      const text = (question.text || "").toLowerCase();
      const subjName = (question.subjects?.name || "").toLowerCase();
      const quizTitle = (question.quizzes?.title || "").toLowerCase();

      return (
        text.includes(term) ||
        subjName.includes(term) ||
        quizTitle.includes(term)
      );
    });
  }, [questions, search, showArchived]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-xl font-semibold mb-1">Admin – Domande</h1>
        <p className="text-xs text-slate-300 mb-4">
          Gestisci il database delle domande. Da qui puoi archiviare/riattivare
          e <span className="font-semibold text-slate-100">modificare il contenuto delle singole domande</span>
          .
        </p>

        {/* NAV ADMIN */}
        <div className="mb-4 flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={() => router.push("/admin/quiz")}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 hover:border-slate-400"
          >
            Concorsi &amp; materie
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/upload-csv")}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 hover:border-slate-400"
          >
            Import domande da CSV
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/images")}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 hover:border-slate-400"
          >
            Gestione immagini
          </button>
        </div>

        {/* FILTRI */}
        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between text-xs">
          <div className="flex-1">
            <input
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs"
              placeholder="Cerca nel testo domanda, materia o concorso…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-[11px] text-slate-300">
              <input
                type="checkbox"
                className="h-3 w-3"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
              />
              <span>Mostra anche archiviate</span>
            </label>
            <button
              type="button"
              onClick={loadQuestions}
              className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] hover:border-slate-400"
            >
              Ricarica elenco
            </button>
          </div>
        </div>

        {/* LISTA DOMANDE */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3 text-xs">
          {loading ? (
            <p className="text-slate-300 text-sm">
              Caricamento elenco domande…
            </p>
          ) : error ? (
            <p className="text-red-400 text-sm">{error}</p>
          ) : filteredQuestions.length === 0 ? (
            <p className="text-slate-300 text-sm">
              Nessuna domanda trovata con i filtri attuali.
            </p>
          ) : (
            <div className="overflow-x-auto max-h-[70vh]">
              <table className="w-full border-collapse text-[11px]">
                <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-300">
                  <tr>
                    <th className="text-left py-2 px-2 w-[90px]">ID</th>
                    <th className="text-left py-2 px-2">Domanda</th>
                    <th className="text-left py-2 px-2 w-[130px]">Materia</th>
                    <th className="text-left py-2 px-2 w-[160px]">Concorso</th>
                    <th className="text-left py-2 px-2 w-[80px]">
                      Archivio
                    </th>
                    <th className="text-left py-2 px-2 w-[140px]">
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuestions.map((q) => {
                    const shortId = q.id.slice(0, 8);
                    const textPreview = (q.text || "").slice(0, 120);
                    const truncatedText =
                      q.text && q.text.length > 120
                        ? `${textPreview}…`
                        : q.text || "";

                    const subjectLabel =
                      q.subjects?.name || (q.subject_id ? "Materia" : "—");
                    const quizLabel =
                      q.quizzes?.title || (q.quiz_id ? "Concorso" : "—");

                    return (
                      <tr
                        key={q.id}
                        className="border-b border-slate-800 last:border-0 hover:bg-slate-900/70"
                      >
                        <td className="py-2 px-2 align-top font-mono text-[10px] text-slate-400">
                          {shortId}
                        </td>
                        <td className="py-2 px-2 align-top text-slate-100">
                          {truncatedText || (
                            <span className="text-slate-500">
                              (senza testo)
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 align-top text-slate-200">
                          {subjectLabel}
                        </td>
                        <td className="py-2 px-2 align-top text-slate-200">
                          {quizLabel}
                          {q.quizzes?.year && (
                            <span className="text-slate-400">
                              {" "}({q.quizzes.year})
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 align-top">
                          {q.is_archived ? (
                            <span className="inline-flex items-center rounded-full bg-rose-900/40 px-2 py-0.5 text-[10px] text-rose-300">
                              Archiviata
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-emerald-900/40 px-2 py-0.5 text-[10px] text-emerald-300">
                              Attiva
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 align-top">
                          <div className="flex flex-wrap gap-1">
                            {/* Bottone Modifica → /admin/questions/[id] */}
                            <Link
                              href={`/admin/questions/${q.id}`}
                              className="rounded-md border border-slate-600 px-2 py-1 text-[11px] hover:border-slate-400"
                            >
                              Modifica
                            </Link>

                            {/* Toggle archivia / riattiva */}
                            <button
                              type="button"
                              onClick={() => handleToggleArchived(q)}
                              className={`rounded-md px-2 py-1 text-[11px] border ${
                                q.is_archived
                                  ? "border-emerald-600 text-emerald-200 hover:border-emerald-400"
                                  : "border-rose-600 text-rose-200 hover:border-rose-400"
                              }`}
                            >
                              {q.is_archived ? "Riattiva" : "Archivia"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
