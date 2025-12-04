"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/types/database";

type QuizRow = Database["public"]["Tables"]["quizzes"]["Row"];
type SubjectRow = Database["public"]["Tables"]["subjects"]["Row"];

// Extended type for Subjects joined with Quiz ID logic in UI
type JoinedSubject = SubjectRow & {
  quiz_title?: string;
};

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [subjects, setSubjects] = useState<JoinedSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // ──────────────────────── QUIZ FORM STATE ────────────────────────
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizYear, setQuizYear] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [quizTotalQuestions, setQuizTotalQuestions] = useState("");
  const [quizTimeLimit, setQuizTimeLimit] = useState("");
  const [quizPointsCorrect, setQuizPointsCorrect] = useState("1");
  const [quizPointsWrong, setQuizPointsWrong] = useState("-0.33");
  const [quizPointsBlank, setQuizPointsBlank] = useState("0");
  const [quizIsArchived, setQuizIsArchived] = useState(false);

  const [quizSaving, setQuizSaving] = useState(false);
  const [quizFormError, setQuizFormError] = useState<string | null>(null);
  const [quizFormSuccess, setQuizFormSuccess] = useState<string | null>(null);

  // ──────────────────────── SUBJECT FORM STATE ────────────────────────
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [subjectQuizId, setSubjectQuizId] = useState<string>("");
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectDescription, setSubjectDescription] = useState("");
  const [subjectIsArchived, setSubjectIsArchived] = useState(false);

  const [subjectSaving, setSubjectSaving] = useState(false);
  const [subjectFormError, setSubjectFormError] = useState<string | null>(null);
  const [subjectFormSuccess, setSubjectFormSuccess] = useState<string | null>(
    null
  );

  // ──────────────────────── UTILS ────────────────────────
  const navItemClass = (active: boolean) =>
    [
      "px-4 py-2 rounded-md text-sm font-medium border transition-colors",
      active
        ? "bg-white text-slate-900 border-white shadow-sm"
        : "bg-slate-900 text-slate-300 border-slate-700 hover:border-sky-500 hover:text-white",
    ].join(" ");

  const parseIntOrNull = (value: string): number | null => {
    const v = value.trim();
    if (!v) return null;
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  };

  const parseFloatOrNull = (value: string): number | null => {
    const v = value.trim().replace(",", ".");
    if (!v) return null;
    const n = Number.parseFloat(v);
    return Number.isFinite(n) ? n : null;
  };

  const resetQuizForm = () => {
    setEditingQuizId(null);
    setQuizTitle("");
    setQuizYear("");
    setQuizDescription("");
    setQuizTotalQuestions("");
    setQuizTimeLimit("");
    setQuizPointsCorrect("1");
    setQuizPointsWrong("-0.33");
    setQuizPointsBlank("0");
    setQuizIsArchived(false);
    setQuizFormError(null);
    setQuizFormSuccess(null);
  };

  const resetSubjectForm = () => {
    setEditingSubjectId(null);
    setSubjectName("");
    setSubjectCode("");
    setSubjectDescription("");
    setSubjectIsArchived(false);
    setSubjectFormError(null);
    setSubjectFormSuccess(null);
    if (quizzes.length > 0) {
      // Default to first active quiz
      const firstActive = quizzes.find((q) => !q.is_archived);
      setSubjectQuizId(firstActive ? firstActive.id : quizzes[0].id);
    }
  };

  // ──────────────────────── LOAD DATA ────────────────────────
  const loadData = async () => {
    setLoading(true);
    setGlobalError(null);
    try {
      const [{ data: qz, error: e1 }, { data: sbj, error: e2 }] =
        await Promise.all([
          supabase
            .from("quizzes")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase.from("subjects").select("*"),
        ]);

      if (e1) throw e1;
      if (e2) throw e2;

      const quizzesData = qz || [];
      const subjectsData = sbj || [];

      setQuizzes(quizzesData);
      setSubjects(subjectsData); // We'll map quiz titles in useMemo for UI

      // Initialize subject dropdown
      if (!subjectQuizId && quizzesData.length > 0) {
        const firstActive = quizzesData.find((q) => !q.is_archived);
        setSubjectQuizId(firstActive ? firstActive.id : quizzesData[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setGlobalError(
        err.message || "Errore nel caricamento di concorsi e materie."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ──────────────────────── QUIZ HANDLERS ────────────────────────
  const handleEditQuiz = (quiz: QuizRow) => {
    setEditingQuizId(quiz.id);
    setQuizTitle(quiz.title || "");
    setQuizYear(quiz.year !== null ? String(quiz.year) : "");
    setQuizDescription(quiz.description || "");
    setQuizTotalQuestions(
      quiz.total_questions !== null ? String(quiz.total_questions) : ""
    );
    setQuizTimeLimit(
      quiz.time_limit !== null ? String(quiz.time_limit) : ""
    );
    setQuizPointsCorrect(
      quiz.points_correct !== null ? String(quiz.points_correct) : "1"
    );
    setQuizPointsWrong(
      quiz.points_wrong !== null ? String(quiz.points_wrong) : "-0.33"
    );
    setQuizPointsBlank(
      quiz.points_blank !== null ? String(quiz.points_blank) : "0"
    );
    setQuizIsArchived(!!quiz.is_archived);
    setQuizFormError(null);
    setQuizFormSuccess(null);
  };

  const handleToggleArchiveQuiz = async (quiz: QuizRow) => {
    const newArchived = !quiz.is_archived;
    try {
      const { error } = await supabase
        .from("quizzes")
        .update({ is_archived: newArchived })
        .eq("id", quiz.id);

      if (error) throw error;
      await loadData();
    } catch (err: any) {
      console.error(err);
      alert(
        err.message || "Errore inatteso nell'aggiornare lo stato del concorso."
      );
    }
  };

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuizFormError(null);
    setQuizFormSuccess(null);
    setQuizSaving(true);

    try {
      if (!quizTitle.trim()) {
        throw new Error("Il titolo del concorso è obbligatorio.");
      }

      // Explicitly construct the payload to match DB types
      const payload = {
        title: quizTitle.trim(),
        description: quizDescription.trim() || null,
        year: parseIntOrNull(quizYear),
        total_questions: parseIntOrNull(quizTotalQuestions),
        time_limit: parseIntOrNull(quizTimeLimit),
        points_correct: parseFloatOrNull(quizPointsCorrect),
        points_wrong: parseFloatOrNull(quizPointsWrong),
        points_blank: parseFloatOrNull(quizPointsBlank),
        is_archived: quizIsArchived,
      };

      if (editingQuizId) {
        // UPDATE
        const { error } = await supabase
          .from("quizzes")
          .update(payload)
          .eq("id", editingQuizId);
        if (error) throw error;
        setQuizFormSuccess("Concorso aggiornato correttamente ✅");
      } else {
        // INSERT
        const { error } = await supabase.from("quizzes").insert(payload);
        if (error) throw error;
        setQuizFormSuccess("Concorso creato correttamente ✅");
      }

      await loadData();
      resetQuizForm();
    } catch (err: any) {
      console.error("Save Quiz Error:", err);
      setQuizFormError(err.message || "Errore nel salvataggio del concorso.");
    } finally {
      setQuizSaving(false);
    }
  };

  // ──────────────────────── SUBJECT HANDLERS ────────────────────────
  const handleEditSubject = (subject: SubjectRow) => {
    setEditingSubjectId(subject.id);
    setSubjectQuizId(subject.quiz_id || "");
    setSubjectName(subject.name || "");
    setSubjectCode(subject.code || "");
    setSubjectDescription(subject.description || "");
    setSubjectIsArchived(!!subject.is_archived);
    setSubjectFormError(null);
    setSubjectFormSuccess(null);
  };

  const handleToggleArchiveSubject = async (subject: SubjectRow) => {
    const newArchived = !subject.is_archived;
    try {
      const { error } = await supabase
        .from("subjects")
        .update({ is_archived: newArchived })
        .eq("id", subject.id);

      if (error) throw error;
      await loadData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Errore nell'aggiornare lo stato della materia.");
    }
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubjectFormError(null);
    setSubjectFormSuccess(null);
    setSubjectSaving(true);

    try {
      if (!subjectQuizId) throw new Error("Devi selezionare un concorso.");
      if (!subjectName.trim())
        throw new Error("Il nome della materia è obbligatorio.");

      const payload = {
        quiz_id: subjectQuizId,
        name: subjectName.trim(),
        code: subjectCode.trim() || null,
        description: subjectDescription.trim() || null,
        is_archived: subjectIsArchived,
      };

      if (editingSubjectId) {
        // UPDATE
        const { error } = await supabase
          .from("subjects")
          .update(payload)
          .eq("id", editingSubjectId);
        if (error) throw error;
        setSubjectFormSuccess("Materia aggiornata correttamente ✅");
      } else {
        // INSERT
        const { error } = await supabase.from("subjects").insert(payload);
        if (error) throw error;
        setSubjectFormSuccess("Materia creata correttamente ✅");
      }

      await loadData();
      resetSubjectForm();
    } catch (err: any) {
      console.error("Save Subject Error:", err);
      setSubjectFormError(err.message || "Errore nel salvataggio della materia.");
    } finally {
      setSubjectSaving(false);
    }
  };

  // ──────────────────────── COMPUTED DATA ────────────────────────
  const quizzesById = useMemo(() => {
    const map: Record<string, QuizRow> = {};
    quizzes.forEach((q) => {
      map[q.id] = q;
    });
    return map;
  }, [quizzes]);

  // Join subjects with quiz titles for display
  const subjectsWithQuizTitle = useMemo(() => {
    return subjects.map((s) => ({
      ...s,
      quiz_title: s.quiz_id ? quizzesById[s.quiz_id]?.title || "N/A" : "N/A",
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [subjects, quizzesById]);

  const subjectCountByQuiz = useMemo(() => {
    const map: Record<string, number> = {};
    subjects.forEach((s) => {
      if (s.quiz_id) {
        map[s.quiz_id] = (map[s.quiz_id] || 0) + 1;
      }
    });
    return map;
  }, [subjects]);

  // ──────────────────────── RENDER ────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold mb-6">Admin Dashboard</h1>

        {/* NAV */}
        <nav className="mb-8 flex flex-wrap gap-2">
          <Link href="/admin"><button className={navItemClass(false)}>Domande</button></Link>
          <Link href="/admin/quiz"><button className={navItemClass(true)}>Concorsi &amp; Materie</button></Link>
          <Link href="/admin/images"><button className={navItemClass(false)}>Immagini</button></Link>
          <Link href="/admin/upload-csv"><button className={navItemClass(false)}>Upload CSV</button></Link>
        </nav>

        {loading && <p className="text-sm text-slate-400 animate-pulse">Caricamento dati...</p>}
        {globalError && <p className="text-sm text-red-400 mb-4 bg-red-900/20 p-3 rounded-md border border-red-800">{globalError}</p>}

        {/* ─── QUIZ FORM ─── */}
        <section className="mb-10 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-semibold text-slate-100">
              {editingQuizId ? "Modifica concorso" : "Nuovo concorso"}
            </h2>
            {editingQuizId && (
              <button
                type="button"
                onClick={resetQuizForm}
                className="text-xs text-sky-400 hover:text-sky-300 underline"
              >
                Annulla modifica / Nuovo
              </button>
            )}
          </div>

          <form onSubmit={handleSaveQuiz} className="grid gap-4 md:grid-cols-2 text-xs">
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-slate-400">Nome concorso *</label>
                <input
                  required
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 placeholder-slate-600 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="Es. Allievo Maresciallo GdF 2025"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-slate-400">Anno</label>
                  <input
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                    value={quizYear}
                    onChange={(e) => setQuizYear(e.target.value)}
                    placeholder="2025"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-slate-400">Tempo (min)</label>
                  <input
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                    value={quizTimeLimit}
                    onChange={(e) => setQuizTimeLimit(e.target.value)}
                    placeholder="60"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-slate-400">Domande ufficiali (Totale bando)</label>
                <input
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                  value={quizTotalQuestions}
                  onChange={(e) => setQuizTotalQuestions(e.target.value)}
                  placeholder="Es. 100"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-slate-400">Descrizione</label>
                <textarea
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 h-20 resize-none"
                  value={quizDescription}
                  onChange={(e) => setQuizDescription(e.target.value)}
                  placeholder="Dettagli aggiuntivi..."
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-slate-400">Punti OK</label>
                  <input
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-2 text-slate-100 text-center"
                    value={quizPointsCorrect}
                    onChange={(e) => setQuizPointsCorrect(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-slate-400">Punti KO</label>
                  <input
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-2 text-slate-100 text-center"
                    value={quizPointsWrong}
                    onChange={(e) => setQuizPointsWrong(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-slate-400">Punti Omessa</label>
                  <input
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-2 text-slate-100 text-center"
                    value={quizPointsBlank}
                    onChange={(e) => setQuizPointsBlank(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  id="quiz-archived"
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-sky-600 focus:ring-sky-600"
                  checked={quizIsArchived}
                  onChange={(e) => setQuizIsArchived(e.target.checked)}
                />
                <label htmlFor="quiz-archived" className="text-slate-300 select-none">
                  Archiviato (nascosto in home)
                </label>
              </div>
            </div>

            <div className="md:col-span-2 pt-2">
              {quizFormError && (
                <div className="mb-3 rounded-md bg-red-900/20 border border-red-800 p-2 text-red-300">
                  {quizFormError}
                </div>
              )}
              {quizFormSuccess && (
                <div className="mb-3 rounded-md bg-emerald-900/20 border border-emerald-800 p-2 text-emerald-300">
                  {quizFormSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={quizSaving}
                className="w-full md:w-auto rounded-md bg-sky-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-60 transition-all shadow-md shadow-sky-900/20"
              >
                {quizSaving ? "Salvataggio..." : editingQuizId ? "Salva Modifiche" : "Crea Concorso"}
              </button>
            </div>
          </form>
        </section>

        {/* ─── QUIZ LIST ─── */}
        <section className="mb-12">
          <h2 className="text-sm font-semibold mb-3 text-slate-300 uppercase tracking-wider">Elenco Concorsi</h2>
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-medium border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Titolo</th>
                    <th className="px-4 py-3 w-16">Anno</th>
                    <th className="px-4 py-3 w-16">Mat.</th>
                    <th className="px-4 py-3 w-20">Domande</th>
                    <th className="px-4 py-3 w-20">Tempo</th>
                    <th className="px-4 py-3 w-24">Stato</th>
                    <th className="px-4 py-3 w-48 text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {quizzes.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-200">
                        {q.title}
                        {q.description && <p className="text-[10px] text-slate-500 font-normal truncate max-w-xs">{q.description}</p>}
                      </td>
                      <td className="px-4 py-3 text-slate-400">{q.year ?? "-"}</td>
                      <td className="px-4 py-3 text-slate-400">{subjectCountByQuiz[q.id] || 0}</td>
                      <td className="px-4 py-3 text-slate-400">{q.total_questions ?? "-"}</td>
                      <td className="px-4 py-3 text-slate-400">{q.time_limit ? `${q.time_limit}'` : "-"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${
                          q.is_archived 
                            ? "bg-slate-800 text-slate-400 border-slate-700" 
                            : "bg-emerald-900/30 text-emerald-400 border-emerald-800"
                        }`}>
                          {q.is_archived ? "Archiviato" : "Attivo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => handleEditQuiz(q)}
                          className="text-sky-400 hover:text-sky-300 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleArchiveQuiz(q)}
                          className={`${q.is_archived ? "text-emerald-400 hover:text-emerald-300" : "text-rose-400 hover:text-rose-300"} font-medium`}
                        >
                          {q.is_archived ? "Attiva" : "Archivia"}
                        </button>
                        <Link href={`/admin/quiz/${q.id}`} className="text-slate-400 hover:text-white font-medium ml-2">
                          Regole →
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {quizzes.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                        Nessun concorso trovato.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ─── SUBJECT FORM ─── */}
        <section className="mb-10 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-semibold text-slate-100">
              {editingSubjectId ? "Modifica materia" : "Nuova materia"}
            </h2>
            {editingSubjectId && (
              <button
                type="button"
                onClick={resetSubjectForm}
                className="text-xs text-sky-400 hover:text-sky-300 underline"
              >
                Annulla / Nuova
              </button>
            )}
          </div>

          <form onSubmit={handleSaveSubject} className="grid gap-4 md:grid-cols-2 text-xs">
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-slate-400">Concorso di appartenenza *</label>
                <select
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-sky-500"
                  value={subjectQuizId}
                  onChange={(e) => setSubjectQuizId(e.target.value)}
                  disabled={quizzes.length === 0}
                >
                  {quizzes.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.title} {q.year ? `(${q.year})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-slate-400">Nome materia *</label>
                <input
                  required
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-sky-500"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="Es. Diritto Costituzionale"
                />
              </div>
              <div>
                <label className="mb-1 block text-slate-400">Codice (opzionale)</label>
                <input
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-sky-500"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  placeholder="Es. DIR-COST"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-slate-400">Descrizione</label>
                <textarea
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 h-20 resize-none"
                  value={subjectDescription}
                  onChange={(e) => setSubjectDescription(e.target.value)}
                  placeholder="Note sulla materia..."
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  id="subject-archived"
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-sky-600 focus:ring-sky-600"
                  checked={subjectIsArchived}
                  onChange={(e) => setSubjectIsArchived(e.target.checked)}
                />
                <label htmlFor="subject-archived" className="text-slate-300 select-none">
                  Archiviata (non usata nei quiz)
                </label>
              </div>
            </div>

            <div className="md:col-span-2 pt-2">
              {subjectFormError && (
                <div className="mb-3 rounded-md bg-red-900/20 border border-red-800 p-2 text-red-300">
                  {subjectFormError}
                </div>
              )}
              {subjectFormSuccess && (
                <div className="mb-3 rounded-md bg-emerald-900/20 border border-emerald-800 p-2 text-emerald-300">
                  {subjectFormSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={subjectSaving || quizzes.length === 0}
                className="w-full md:w-auto rounded-md bg-sky-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-60 transition-all shadow-md shadow-sky-900/20"
              >
                {subjectSaving ? "Salvataggio..." : editingSubjectId ? "Salva Materia" : "Crea Materia"}
              </button>
            </div>
          </form>
        </section>

        {/* ─── SUBJECT LIST ─── */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold mb-3 text-slate-300 uppercase tracking-wider">Elenco Materie</h2>
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-medium border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Materia</th>
                    <th className="px-4 py-3 w-24">Codice</th>
                    <th className="px-4 py-3 w-1/3">Concorso</th>
                    <th className="px-4 py-3 w-24">Stato</th>
                    <th className="px-4 py-3 w-32 text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {subjectsWithQuizTitle.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-200">{s.name}</td>
                      <td className="px-4 py-3 text-slate-400 font-mono">{s.code || "-"}</td>
                      <td className="px-4 py-3 text-slate-400 truncate max-w-xs" title={s.quiz_title}>
                        {s.quiz_title}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${
                          s.is_archived 
                            ? "bg-slate-800 text-slate-400 border-slate-700" 
                            : "bg-emerald-900/30 text-emerald-400 border-emerald-800"
                        }`}>
                          {s.is_archived ? "Archiviata" : "Attiva"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => handleEditSubject(s)}
                          className="text-sky-400 hover:text-sky-300 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleArchiveSubject(s)}
                          className={`${s.is_archived ? "text-emerald-400 hover:text-emerald-300" : "text-rose-400 hover:text-rose-300"} font-medium`}
                        >
                          {s.is_archived ? "Attiva" : "Archivia"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {subjects.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        Nessuna materia presente.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}