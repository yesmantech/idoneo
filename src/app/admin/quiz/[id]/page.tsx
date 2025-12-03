"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/types/database";

type QuizRow = Database["public"]["Tables"]["quizzes"]["Row"];
type SubjectRow = Database["public"]["Tables"]["subjects"]["Row"];
type RuleRow = Database["public"]["Tables"]["quiz_subject_rules"]["Row"];

export default function AdminQuizRulesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: quizId } = use(params);
  const router = useRouter();

  const [quiz, setQuiz] = useState<QuizRow | null>(null);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [rules, setRules] = useState<RuleRow[]>([]);
  const [rulesMap, setRulesMap] = useState<Record<string, number>>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rulesError, setRulesError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Carica quiz, materie, regole
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      setRulesError(null);
      setSaveSuccess(null);

      try {
        // 1) Quiz
        const { data: quizData, error: quizError } = await supabase
          .from("quizzes")
          .select("*")
          .eq("id", quizId)
          .single();

        if (quizError || !quizData) {
          console.warn("Errore caricando quiz:", quizError);
          setError("Concorso non trovato.");
          setLoading(false);
          return;
        }

        const qz = quizData as QuizRow;
        setQuiz(qz);

        // 2) Materie del concorso
        const { data: subjectsData, error: subjectsError } = await supabase
          .from("subjects")
          .select("*")
          .eq("quiz_id", quizId)
          .order("created_at", { ascending: true });

        if (subjectsError) {
          console.warn("Errore caricando materie:", subjectsError);
          setError("Errore nel caricamento delle materie del concorso.");
          setLoading(false);
          return;
        }

        const subjList = (subjectsData || []) as SubjectRow[];
        setSubjects(subjList);

        // 3) Regole per materia
        const { data: rulesData, error: rulesErrorRaw } = await supabase
          .from("quiz_subject_rules")
          .select("*")
          .eq("quiz_id", quizId)
          .order("created_at", { ascending: true });

        if (rulesErrorRaw) {
          console.warn(
            "Quiz admin: impossibile leggere le regole, userò lista vuota:",
            {
              message: (rulesErrorRaw as any)?.message,
              details: (rulesErrorRaw as any)?.details,
              hint: (rulesErrorRaw as any)?.hint,
              code: (rulesErrorRaw as any)?.code,
            }
          );
          setRules([]);
          setRulesError(
            "Impossibile leggere le regole dal database. Se stai usando Supabase, controlla la RLS/policy sulla tabella quiz_subject_rules."
          );
        } else {
          const rulesList = (rulesData || []) as RuleRow[];
          setRules(rulesList);
        }
      } catch (err: any) {
        console.warn("Errore imprevisto caricando pagina admin quiz:", err);
        setError(
          err?.message || "Errore imprevisto nel caricamento del concorso."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [quizId]);

  // Mappa subject_id -> question_count
  useEffect(() => {
    const map: Record<string, number> = {};
    for (const r of rules) {
      const sid = r.subject_id as string | null;
      if (!sid) continue;
      map[sid] = r.question_count ?? 0;
    }
    // materie senza regola → 0 di default
    for (const s of subjects) {
      if (!map[s.id]) {
        map[s.id] = 0;
      }
    }
    setRulesMap(map);
  }, [rules, subjects]);

  const totalQuestionsFromRules = useMemo(() => {
    return Object.values(rulesMap).reduce((acc, v) => acc + (v || 0), 0);
  }, [rulesMap]);

  const handleChangeRule = (subjectId: string, value: string) => {
    const n = parseInt(value, 10);
    const safe = isNaN(n) || n < 0 ? 0 : n;
    setRulesMap((prev) => ({
      ...prev,
      [subjectId]: safe,
    }));
  };

  /**
   * Salvataggio semplificato:
   * - DELETE di tutte le regole del quiz
   * - INSERT di quelle nuove (solo dove question_count > 0)
   * In questo modo non avremo MAI violazioni del vincolo unique (quiz_id, subject_id).
   */
  const handleSave = async () => {
    if (!quiz) return;
    setSaving(true);
    setSaveSuccess(null);
    setError(null);

    try {
      // 1) Cancella tutte le regole esistenti per questo quiz
      const { error: delError } = await supabase
        .from("quiz_subject_rules")
        .delete()
        .eq("quiz_id", quizId);

      if (delError) {
        console.warn("Errore cancellando vecchie regole:", delError, {
          message: (delError as any)?.message,
          details: (delError as any)?.details,
          hint: (delError as any)?.hint,
          code: (delError as any)?.code,
        });
        setError(
          delError.message ||
            delError.details ||
            "Errore durante l'eliminazione delle regole esistenti."
        );
        setSaving(false);
        return;
      }

      // 2) Prepara le nuove regole (solo quelle con count > 0)
      const toInsert = subjects
        .map((s) => ({
          quiz_id: quizId,
          subject_id: s.id,
          question_count: rulesMap[s.id] ?? 0,
        }))
        .filter((r) => r.question_count > 0);

      // Se sono tutte 0, abbiamo semplicemente eliminato tutte le regole
      if (toInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("quiz_subject_rules")
          .insert(toInsert);

        if (insertError) {
          console.warn("Errore inserendo nuove regole:", insertError, {
            message: (insertError as any)?.message,
            details: (insertError as any)?.details,
            hint: (insertError as any)?.hint,
            code: (insertError as any)?.code,
          });
          setError(
            insertError.message ||
              insertError.details ||
              "Errore durante il salvataggio delle regole."
          );
          setSaving(false);
          return;
        }
      }

      // 3) Ricarica le regole per avere stato aggiornato
      const { data: rulesData, error: reloadError } = await supabase
        .from("quiz_subject_rules")
        .select("*")
        .eq("quiz_id", quizId)
        .order("created_at", { ascending: true });

      if (reloadError) {
        console.warn(
          "Errore ricaricando regole dopo salvataggio (uso comunque quelle in memoria):",
          {
            message: (reloadError as any)?.message,
            details: (reloadError as any)?.details,
            hint: (reloadError as any)?.hint,
            code: (reloadError as any)?.code,
          }
        );
      } else {
        setRules((rulesData || []) as RuleRow[]);
      }

      setSaveSuccess("Regole salvate correttamente.");
    } catch (err: any) {
      console.warn("Errore imprevisto salvataggio regole:", err);
      setError(
        err?.message || "Errore imprevisto durante il salvataggio delle regole."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleBackToList = () => {
    router.push("/admin/quiz");
  };

  const handleGoPublicQuizPage = () => {
    router.push(`/quiz/${quizId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-sm text-slate-200">Caricamento concorso…</p>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="max-w-md px-4 text-xs">
          <p className="text-sm text-red-400 mb-2">
            {error || "Concorso non trovato."}
          </p>
          <button
            type="button"
            onClick={handleBackToList}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs hover:border-slate-500"
          >
            Torna alla lista concorsi
          </button>
        </div>
      </div>
    );
  }

  // 🔍 Check mismatch tra somma regole e totale previsto del concorso
  const expectedTotal = quiz.total_questions ?? null;
  const hasMismatch =
    expectedTotal !== null && totalQuestionsFromRules !== expectedTotal;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-6 text-xs md:text-sm">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <button
              type="button"
              onClick={handleBackToList}
              className="mb-1 text-[11px] text-slate-300 hover:text-slate-100"
            >
              ← Torna alla lista concorsi
            </button>
            <h1 className="text-lg font-semibold">
              Regole concorso – {quiz.title || "Concorso"}
            </h1>
            <p className="text-[11px] text-slate-400">
              ID:{" "}
              <span className="font-mono text-slate-200">
                {quizId}
              </span>
              {quiz.year ? ` · ${quiz.year}` : ""}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={handleGoPublicQuizPage}
              className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] hover:border-slate-500"
            >
              Vai alla pagina concorso pubblica
            </button>
            <div className="text-[11px] text-slate-400 text-right">
              Domande totali da regole:{" "}
              <span
                className={
                  hasMismatch
                    ? "font-semibold text-amber-300"
                    : "font-semibold text-slate-100"
                }
              >
                {totalQuestionsFromRules}
              </span>
              {expectedTotal !== null && (
                <>
                  {" "}
                  · Totale previsto:{" "}
                  <span
                    className={
                      hasMismatch
                        ? "font-semibold text-amber-300"
                        : "font-semibold text-slate-100"
                    }
                  >
                    {expectedTotal}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Alerts */}
        {rulesError && (
          <div className="mb-3 rounded-md border border-amber-600 bg-amber-900/40 px-3 py-2 text-[11px] text-amber-100">
            ⚠️ {rulesError}
          </div>
        )}

        {error && (
          <div className="mb-3 rounded-md border border-rose-600 bg-rose-900/40 px-3 py-2 text-[11px] text-rose-100">
            {error}
          </div>
        )}

        {saveSuccess && (
          <div className="mb-3 rounded-md border border-emerald-600 bg-emerald-900/30 px-3 py-2 text-[11px] text-emerald-100">
            ✅ {saveSuccess}
          </div>
        )}

        {/* 🔥 Warning mismatch regole vs totale concorso */}
        {hasMismatch && (
          <div className="mb-3 rounded-md border border-amber-500 bg-amber-900/40 px-3 py-2 text-[11px] text-amber-100">
            ⚠️ Attenzione: la somma delle domande impostate nelle regole (
            <span className="font-semibold">{totalQuestionsFromRules}</span>) è
            diversa dal totale previsto del concorso{" "}
            <span className="font-semibold">{expectedTotal}</span>. <br />
            Il quiz ufficiale userà comunque le regole qui sopra, ma è
            consigliato allineare i numeri per non confondere gli utenti.
          </div>
        )}

        {/* Card regole */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[11px] text-slate-300 mb-3">
            Qui definisci quante domande devono essere estratte da ogni materia
            nella modalità <span className="font-semibold">quiz ufficiale</span>.
            Se metti <span className="font-semibold">0</span>, la materia viene
            ignorata per il sorteggio.
          </p>

          {subjects.length === 0 ? (
            <p className="text-sm text-slate-300">
              Nessuna materia trovata per questo concorso. Crea prima le materie
              da <span className="underline">Admin → Concorsi &amp; materie</span>.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px] md:text-xs">
                <thead className="border-b border-slate-800 text-slate-300 bg-slate-900">
                  <tr>
                    <th className="py-2 px-2 text-left">Materia</th>
                    <th className="py-2 px-2 text-left w-[100px]">
                      Domande da estrarre
                    </th>
                    <th className="py-2 px-2 text-left w-[120px]">
                      Note
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((s) => {
                    const anyS: any = s;
                    const value = rulesMap[s.id] ?? 0;

                    return (
                      <tr
                        key={s.id}
                        className="border-b border-slate-800 last:border-0 hover:bg-slate-900/60"
                      >
                        <td className="py-2 px-2 align-top">
                          <div className="text-slate-100">
                            {anyS.name || "Materia"}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            ID: <span className="font-mono">{s.id}</span>
                            {anyS.code ? ` · ${anyS.code}` : ""}
                          </div>
                        </td>
                        <td className="py-2 px-2 align-top">
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={value}
                            onChange={(e) =>
                              handleChangeRule(s.id, e.target.value)
                            }
                            className="w-24 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-[11px]"
                          />
                        </td>
                        <td className="py-2 px-2 align-top text-[10px] text-slate-400">
                          Metti 0 per non estrarre domande da questa materia. Le
                          domande vengono comunque scelte in modo casuale dal
                          pool disponibile.
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || subjects.length === 0}
              className="rounded-md bg-emerald-600 px-4 py-1.5 text-[11px] font-medium text-white hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? "Salvataggio…" : "Salva regole concorso"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
