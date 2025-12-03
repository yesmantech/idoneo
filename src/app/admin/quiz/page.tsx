"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/types/database";

type QuizRow = Database["public"]["Tables"]["quizzes"]["Row"];
type SubjectRow = Database["public"]["Tables"]["subjects"]["Row"];

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // ───────────────────── QUIZ FORM STATE ─────────────────────
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

  // ───────────────────── SUBJECT FORM STATE ─────────────────────
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [subjectQuizId, setSubjectQuizId] = useState<string>("");
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectDescription, setSubjectDescription] = useState("");
  const [subjectIsArchived, setSubjectIsArchived] = useState(false);

  const [subjectSaving, setSubjectSaving] = useState(false);
  const [subjectFormError, setSubjectFormError] = useState<string | null>(null);
  const [subjectFormSuccess, setSubjectFormSuccess] =
    useState<string | null>(null);

  // ───────────────────── UTILS ─────────────────────
  const navItemClass = (active: boolean) =>
    [
      "px-4 py-2 rounded-md text-sm font-medium border",
      active
        ? "bg-white text-slate-900 border-white"
        : "bg-slate-900 text-slate-100 border-slate-700 hover:border-sky-500",
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
      const firstActive = quizzes.find((q: any) => !q.is_archived);
      setSubjectQuizId(firstActive ? firstActive.id : quizzes[0].id);
    }
  };

  // ───────────────────── LOAD DATA ─────────────────────
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

      if (e1 || e2) throw e1 || e2;

      setQuizzes(qz || []);
      setSubjects(sbj || []);

      // inizializza select per materie
      if (!subjectQuizId && (qz || []).length > 0) {
        const firstActive = (qz as QuizRow[]).find(
          (q: any) => !q.is_archived
        );
        setSubjectQuizId(
          (firstActive || (qz as QuizRow[])[0] || { id: "" }).id
        );
      }
    } catch (err) {
      console.error(err);
      setGlobalError("Errore nel caricamento di concorsi e materie.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ───────────────────── QUIZ HANDLERS ─────────────────────
  const handleEditQuiz = (quiz: QuizRow) => {
    const anyQ: any = quiz;
    setEditingQuizId(quiz.id);
    setQuizTitle((anyQ.title as string) || "");
    setQuizYear(
      anyQ.year !== null && anyQ.year !== undefined
        ? String(anyQ.year)
        : ""
    );
    setQuizDescription((anyQ.description as string) || "");
    setQuizTotalQuestions(
      anyQ.total_questions !== null && anyQ.total_questions !== undefined
        ? String(anyQ.total_questions)
        : ""
    );
    setQuizTimeLimit(
      anyQ.time_limit !== null && anyQ.time_limit !== undefined
        ? String(anyQ.time_limit)
        : ""
    );
    setQuizPointsCorrect(
      anyQ.points_correct !== null && anyQ.points_correct !== undefined
        ? String(anyQ.points_correct)
        : "1"
    );
    setQuizPointsWrong(
      anyQ.points_wrong !== null && anyQ.points_wrong !== undefined
        ? String(anyQ.points_wrong)
        : "-0.33"
    );
    setQuizPointsBlank(
      anyQ.points_blank !== null && anyQ.points_blank !== undefined
        ? String(anyQ.points_blank)
        : "0"
    );
    setQuizIsArchived(Boolean(anyQ.is_archived));
    setQuizFormError(null);
    setQuizFormSuccess(null);
  };

  const handleToggleArchiveQuiz = async (quiz: QuizRow) => {
    const anyQ: any = quiz;
    const newArchived = !Boolean(anyQ.is_archived);

    try {
      const { error } = await supabase
        .from("quizzes")
        .update({ is_archived: newArchived })
        .eq("id", quiz.id);

      if (error) {
        console.error("Supabase error toggling quiz archive:", error);
        alert(
          (error as any).message ||
            (error as any).details ||
            "Errore nell'aggiornare lo stato del concorso."
        );
        return;
      }

      await loadData();
    } catch (err) {
      console.error(err);
      alert("Errore inatteso nell'aggiornare lo stato del concorso.");
    }
  };

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuizFormError(null);
    setQuizFormSuccess(null);
    setQuizSaving(true);

    try {
      if (!quizTitle.trim()) {
        setQuizFormError("Il titolo del concorso è obbligatorio.");
        setQuizSaving(false);
        return;
      }

      const payload: any = {
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
        payload.id = editingQuizId;
      }

      const { data, error } = await supabase
        .from("quizzes")
        .upsert(payload)
        .select()
        .single();

      if (error) {
        console.error("Supabase error saving quiz RAW:", error, {
          message: (error as any).message,
          details: (error as any).details,
          hint: (error as any).hint,
          code: (error as any).code,
        });

        setQuizFormError(
          (error as any).message ||
            (error as any).details ||
            (error as any).hint ||
            (error as any).code ||
            JSON.stringify(error) ||
            "Errore nel salvataggio del concorso (nessun dettaglio)."
        );
        return;
      }

      setQuizFormSuccess(
        editingQuizId
          ? "Concorso aggiornato correttamente ✅"
          : "Concorso creato correttamente ✅"
      );
      await loadData();
      // se vuoi, puoi tenere il form in modalità edit; per ora resetto
      resetQuizForm();
    } catch (err: any) {
      console.error("Unexpected error saving quiz:", err);
      setQuizFormError(
        err?.message || "Errore inatteso nel salvataggio del concorso."
      );
    } finally {
      setQuizSaving(false);
    }
  };

  // ───────────────────── SUBJECT HANDLERS ─────────────────────
  const handleEditSubject = (subject: SubjectRow) => {
    const anyS: any = subject;
    setEditingSubjectId(subject.id);
    setSubjectQuizId(anyS.quiz_id as string);
    setSubjectName(anyS.name || "");
    setSubjectCode(anyS.code || "");
    setSubjectDescription(anyS.description || "");
    setSubjectIsArchived(Boolean(anyS.is_archived));
    setSubjectFormError(null);
    setSubjectFormSuccess(null);
  };

  const handleToggleArchiveSubject = async (subject: SubjectRow) => {
    const anyS: any = subject;
    const newArchived = !Boolean(anyS.is_archived);

    try {
      const { error } = await supabase
        .from("subjects")
        .update({ is_archived: newArchived })
        .eq("id", subject.id);

      if (error) {
        console.error("Supabase error toggling subject archive:", error);
        alert(
          (error as any).message ||
            (error as any).details ||
            "Errore nell'aggiornare lo stato della materia."
        );
        return;
      }

      await loadData();
    } catch (err) {
      console.error(err);
      alert("Errore inatteso nell'aggiornare lo stato della materia.");
    }
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubjectFormError(null);
    setSubjectFormSuccess(null);
    setSubjectSaving(true);

    try {
      if (!subjectQuizId) {
        setSubjectFormError("Devi selezionare un concorso.");
        setSubjectSaving(false);
        return;
      }
      if (!subjectName.trim()) {
        setSubjectFormError("Il nome della materia è obbligatorio.");
        setSubjectSaving(false);
        return;
      }

      const payload: any = {
        quiz_id: subjectQuizId,
        name: subjectName.trim(),
        code: subjectCode.trim() || null,
        description: subjectDescription.trim() || null,
        is_archived: subjectIsArchived,
      };

      if (editingSubjectId) {
        payload.id = editingSubjectId;
      }

      const { error } = await supabase.from("subjects").upsert(payload);

      if (error) {
        console.error("Supabase error saving subject:", error, {
          message: (error as any).message,
          details: (error as any).details,
          hint: (error as any).hint,
          code: (error as any).code,
        });

        setSubjectFormError(
          (error as any).message ||
            (error as any).details ||
            (error as any).hint ||
            (error as any).code ||
            JSON.stringify(error) ||
            "Errore nel salvataggio della materia (nessun dettaglio)."
        );
        return;
      }

      setSubjectFormSuccess(
        editingSubjectId
          ? "Materia aggiornata correttamente ✅"
          : "Materia creata correttamente ✅"
      );
      await loadData();
      resetSubjectForm();
    } catch (err: any) {
      console.error("Unexpected error saving subject:", err);
      setSubjectFormError(
        err?.message || "Errore inatteso nel salvataggio della materia."
      );
    } finally {
      setSubjectSaving(false);
    }
  };

  // ───────────────────── DERIVED ─────────────────────
  const subjectCountByQuiz = useMemo(() => {
    const map: Record<string, number> = {};
    subjects.forEach((s: any) => {
      const qid = s.quiz_id as string | undefined;
      if (!qid) return;
      map[qid] = (map[qid] || 0) + 1;
    });
    return map;
  }, [subjects]);

  const quizzesById = useMemo(() => {
    const map: Record<string, QuizRow> = {};
    quizzes.forEach((q) => {
      map[q.id] = q;
    });
    return map;
  }, [quizzes]);

  const subjectsSorted = useMemo(() => {
    return [...subjects].sort((a, b) => {
      const anyA: any = a;
      const anyB: any = b;
      return (anyA.name || "").localeCompare(anyB.name || "");
    });
  }, [subjects]);

  // ───────────────────── RENDER ─────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold mb-4">Admin Dashboard</h1>

        {/* NAV */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Link href="/admin">
            <button className={navItemClass(false)}>Domande</button>
          </Link>
          <Link href="/admin/quiz">
            <button className={navItemClass(true)}>Concorsi &amp; Materie</button>
          </Link>
          <Link href="/admin/images">
            <button className={navItemClass(false)}>Immagini</button>
          </Link>
          <Link href="/admin/upload-csv">
            <button className={navItemClass(false)}>Upload CSV</button>
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-slate-300">Caricamento concorsi…</p>
        ) : globalError ? (
          <p className="text-sm text-red-400 mb-4">{globalError}</p>
        ) : null}

        {/* ───────── FORM CONCORSO ───────── */}
        <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-semibold">
              {editingQuizId ? "Modifica concorso" : "Nuovo concorso"}
            </h2>
            {editingQuizId && (
              <button
                type="button"
                onClick={resetQuizForm}
                className="text-[11px] text-slate-300 hover:text-white"
              >
                Reset form
              </button>
            )}
          </div>

          <form
            onSubmit={handleSaveQuiz}
            className="grid gap-3 md:grid-cols-2 text-xs"
          >
            <div className="space-y-2">
              <div>
                <label className="mb-1 block text-slate-200">
                  Nome concorso *
                </label>
                <input
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="Es. Allievo Maresciallo Guardia di Finanza 2025"
                />
              </div>

              <div>
                <label className="mb-1 block text-slate-200">Anno</label>
                <input
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs"
                  value={quizYear}
                  onChange={(e) => setQuizYear(e.target.value)}
                  placeholder="Es. 2025"
                />
              </div>

              <div>
                <label className="mb-1 block text-slate-200">
                  Domande ufficiali (bando)
                </label>
                <input
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs"
                  value={quizTotalQuestions}
                  onChange={(e) => setQuizTotalQuestions(e.target.value)}
                  placeholder="Es. 100"
                />
              </div>

              <div>
                <label className="mb-1 block text-slate-200">
                  Tempo (minuti)
                </label>
                <input
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs"
                  value={quizTimeLimit}
                  onChange={(e) => setQuizTimeLimit(e.target.value)}
                  placeholder="Es. 60"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <label className="mb-1 block text-slate-200">
                  Descrizione / info
                </label>
                <textarea
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs h-24"
                  value={quizDescription}
                  onChange={(e) => setQuizDescription(e.target.value)}
                  placeholder="Informazioni sul concorso, corpo, numero posti, note..."
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="mb-1 block text-slate-200 text-[11px]">
                    Punti corretta
                  </label>
                  <input
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-[11px]"
                    value={quizPointsCorrect}
                    onChange={(e) => setQuizPointsCorrect(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-slate-200 text-[11px]">
                    Punti errata
                  </label>
                  <input
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-[11px]"
                    value={quizPointsWrong}
                    onChange={(e) => setQuizPointsWrong(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-slate-200 text-[11px]">
                    Punti omessa
                  </label>
                  <input
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-[11px]"
                    value={quizPointsBlank}
                    onChange={(e) => setQuizPointsBlank(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <input
                  id="quiz-archived"
                  type="checkbox"
                  className="h-3 w-3"
                  checked={quizIsArchived}
                  onChange={(e) => setQuizIsArchived(e.target.checked)}
                />
                <label
                  htmlFor="quiz-archived"
                  className="text-[11px] text-slate-300"
                >
                  Concorso archiviato (non visibile in home)
                </label>
              </div>
            </div>

            <div className="md:col-span-2 flex flex-col gap-2 mt-2">
              {quizFormError && (
                <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {quizFormError}
                </div>
              )}
              {quizFormSuccess && (
                <div className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-xs text-green-700">
                  {quizFormSuccess}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={quizSaving}
                  className="rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white disabled:opacity-60"
                >
                  {quizSaving
                    ? "Salvataggio…"
                    : editingQuizId
                    ? "Salva modifiche"
                    : "Crea concorso"}
                </button>
                {editingQuizId && (
                  <button
                    type="button"
                    onClick={resetQuizForm}
                    className="rounded-md bg-slate-800 px-3 py-2 text-xs font-medium text-white"
                  >
                    Annulla modifica
                  </button>
                )}
              </div>
            </div>
          </form>
        </section>

        {/* ───────── LISTA CONCORSI ───────── */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold mb-2">Concorsi</h2>
          {quizzes.length === 0 ? (
            <p className="text-xs text-slate-300">
              Nessun concorso presente. Crea il primo usando il form qui sopra.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
              <table className="w-full text-xs">
                <thead className="bg-slate-900 text-slate-300">
                  <tr>
                    <th className="px-3 py-2 text-left">Titolo</th>
                    <th className="px-3 py-2 text-left">Anno</th>
                    <th className="px-3 py-2 text-left">Materie</th>
                    <th className="px-3 py-2 text-left">Domande ufficiali</th>
                    <th className="px-3 py-2 text-left">Tempo</th>
                    <th className="px-3 py-2 text-left">Stato</th>
                    <th className="px-3 py-2 text-left">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {quizzes.map((quiz) => {
                    const anyQ: any = quiz;
                    const subjectsNum = subjectCountByQuiz[quiz.id] || 0;
                    const archived = Boolean(anyQ.is_archived);
                    return (
                      <tr
                        key={quiz.id}
                        className="border-t border-slate-800 hover:bg-slate-900/70"
                      >
                        <td className="px-3 py-2 align-top">
                          <div className="font-medium text-slate-100">
                            {anyQ.title || "Senza titolo"}
                          </div>
                          {anyQ.description && (
                            <div className="text-[11px] text-slate-400 line-clamp-2">
                              {anyQ.description}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 align-top text-slate-200">
                          {anyQ.year ?? "—"}
                        </td>
                        <td className="px-3 py-2 align-top text-slate-200">
                          {subjectsNum}
                        </td>
                        <td className="px-3 py-2 align-top text-slate-200">
                          {anyQ.total_questions ?? "—"}
                        </td>
                        <td className="px-3 py-2 align-top text-slate-200">
                          {anyQ.time_limit
                            ? `${anyQ.time_limit} min`
                            : "—"}
                        </td>
                        <td className="px-3 py-2 align-top">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] ${
                              archived
                                ? "bg-slate-900 text-slate-300 border border-slate-600"
                                : "bg-emerald-600/20 text-emerald-300 border border-emerald-500/40"
                            }`}
                          >
                            {archived ? "Archiviato" : "Attivo"}
                          </span>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <div className="flex flex-wrap gap-1">
                            <button
                              type="button"
                              onClick={() => handleEditQuiz(quiz)}
                              className="rounded-md bg-slate-800 px-2 py-1 text-[11px]"
                            >
                              Modifica
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleArchiveQuiz(quiz)}
                              className="rounded-md bg-slate-800 px-2 py-1 text-[11px]"
                            >
                              {archived ? "Riattiva" : "Archivia"}
                            </button>
                            <Link href={`/admin/quiz/${quiz.id}`}>
                              <button
                                type="button"
                                className="rounded-md bg-sky-700 px-2 py-1 text-[11px]"
                              >
                                Regole concorso
                              </button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ───────── FORM MATERIA ───────── */}
        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-semibold">
              {editingSubjectId ? "Modifica materia" : "Nuova materia"}
            </h2>
            {editingSubjectId && (
              <button
                type="button"
                onClick={resetSubjectForm}
                className="text-[11px] text-slate-300 hover:text-white"
              >
                Reset form
              </button>
            )}
          </div>

          {quizzes.length === 0 ? (
            <p className="text-xs text-slate-300">
              Crea prima almeno un concorso per poter aggiungere materie.
            </p>
          ) : (
            <form
              onSubmit={handleSaveSubject}
              className="grid gap-3 md:grid-cols-2 text-xs"
            >
              <div className="space-y-2">
                <div>
                  <label className="mb-1 block text-slate-200">
                    Concorso *
                  </label>
                  <select
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs"
                    value={subjectQuizId}
                    onChange={(e) => setSubjectQuizId(e.target.value)}
                  >
                    {quizzes.map((q) => {
                      const anyQ: any = q;
                      return (
                        <option key={q.id} value={q.id}>
                          {anyQ.title || "Senza titolo"}
                          {anyQ.year ? ` (${anyQ.year})` : ""}
                          {anyQ.is_archived ? " [ARCHIVIATO]" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-slate-200">
                    Nome materia *
                  </label>
                  <input
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    placeholder="Es. Logica, Informatica, Diritto..."
                  />
                </div>

                <div>
                  <label className="mb-1 block text-slate-200">Codice</label>
                  <input
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs"
                    value={subjectCode}
                    onChange={(e) => setSubjectCode(e.target.value)}
                    placeholder="Es. LOG, INF, DIR..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="mb-1 block text-slate-200">
                    Descrizione
                  </label>
                  <textarea
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs h-24"
                    value={subjectDescription}
                    onChange={(e) => setSubjectDescription(e.target.value)}
                    placeholder="Descrizione sintetica della materia..."
                  />
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <input
                    id="subject-archived"
                    type="checkbox"
                    className="h-3 w-3"
                    checked={subjectIsArchived}
                    onChange={(e) =>
                      setSubjectIsArchived(e.target.checked)
                    }
                  />
                  <label
                    htmlFor="subject-archived"
                    className="text-[11px] text-slate-300"
                  >
                    Materia archiviata
                  </label>
                </div>
              </div>

              <div className="md:col-span-2 flex flex-col gap-2 mt-2">
                {subjectFormError && (
                  <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {subjectFormError}
                  </div>
                )}
                {subjectFormSuccess && (
                  <div className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-xs text-green-700">
                    {subjectFormSuccess}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={subjectSaving}
                    className="rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white disabled:opacity-60"
                  >
                    {subjectSaving
                      ? "Salvataggio…"
                      : editingSubjectId
                      ? "Salva materia"
                      : "Crea materia"}
                  </button>
                  {editingSubjectId && (
                    <button
                      type="button"
                      onClick={resetSubjectForm}
                      className="rounded-md bg-slate-800 px-3 py-2 text-xs font-medium text-white"
                    >
                      Annulla modifica
                    </button>
                  )}
                </div>
              </div>
            </form>
          )}
        </section>

        {/* ───────── LISTA MATERIE ───────── */}
        <section className="mb-4">
          <h2 className="text-sm font-semibold mb-2">Materie</h2>
          {subjects.length === 0 ? (
            <p className="text-xs text-slate-300">
              Non ci sono ancora materie. Creane una usando il form qui sopra.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
              <table className="w-full text-xs">
                <thead className="bg-slate-900 text-slate-300">
                  <tr>
                    <th className="px-3 py-2 text-left">Materia</th>
                    <th className="px-3 py-2 text-left">Codice</th>
                    <th className="px-3 py-2 text-left">Concorso</th>
                    <th className="px-3 py-2 text-left">Stato</th>
                    <th className="px-3 py-2 text-left">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectsSorted.map((subject) => {
                    const anyS: any = subject;
                    const quiz = anyS.quiz_id
                      ? quizzesById[anyS.quiz_id as string]
                      : null;
                    const archived = Boolean(anyS.is_archived);

                    return (
                      <tr
                        key={subject.id}
                        className="border-t border-slate-800 hover:bg-slate-900/70"
                      >
                        <td className="px-3 py-2 align-top">
                          <div className="font-medium text-slate-100">
                            {anyS.name || "Senza nome"}
                          </div>
                          {anyS.description && (
                            <div className="text-[11px] text-slate-400 line-clamp-2">
                              {anyS.description}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 align-top text-slate-200">
                          {anyS.code || "—"}
                        </td>
                        <td className="px-3 py-2 align-top text-slate-200">
                          {quiz ? (quiz as any).title || "—" : "—"}
                        </td>
                        <td className="px-3 py-2 align-top">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] ${
                              archived
                                ? "bg-slate-900 text-slate-300 border border-slate-600"
                                : "bg-emerald-600/20 text-emerald-300 border border-emerald-500/40"
                            }`}
                          >
                            {archived ? "Archiviata" : "Attiva"}
                          </span>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <div className="flex flex-wrap gap-1">
                            <button
                              type="button"
                              onClick={() => handleEditSubject(subject)}
                              className="rounded-md bg-slate-800 px-2 py-1 text-[11px]"
                            >
                              Modifica
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleArchiveSubject(subject)
                              }
                              className="rounded-md bg-slate-800 px-2 py-1 text-[11px]"
                            >
                              {archived ? "Riattiva" : "Archivia"}
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
        </section>
      </div>
    </div>
  );
}
