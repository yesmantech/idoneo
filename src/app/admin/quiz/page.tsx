import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/types/database";
import { AdminLayout } from "@/components/admin";
import QuizOfficialRulesEditor from "./QuizOfficialRulesEditor";

type QuizRow = Database["public"]["Tables"]["quizzes"]["Row"];
type SubjectRow = Database["public"]["Tables"]["subjects"]["Row"];
type RuleRow = Database["public"]["Tables"]["simulation_rules"]["Row"];
type QuizSubjectRuleRow = Database["public"]["Tables"]["quiz_subject_rules"]["Row"];
type RoleRow = { id: string; title: string; category_id: string; slug: string };
type CategoryRow = { id: string; title: string };

type JoinedSubject = SubjectRow & {
  quiz_title?: string;
};

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [subjects, setSubjects] = useState<JoinedSubject[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [rules, setRules] = useState<RuleRow[]>([]);
  const [quizSubjectRules, setQuizSubjectRules] = useState<QuizSubjectRuleRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // ──────────────────────── QUIZ FORM STATE ────────────────────────
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizSlug, setQuizSlug] = useState("");
  const [quizRoleId, setQuizRoleId] = useState("");
  // We keep rule_id just as a "Preset" selector, but we store values in the quiz itself
  const [selectedPresetId, setSelectedPresetId] = useState("");

  const [quizYear, setQuizYear] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [quizIsArchived, setQuizIsArchived] = useState(false);

  // SIMULATION CONFIG (Global)
  const [quizTimeLimit, setQuizTimeLimit] = useState("");
  const [quizPointsCorrect, setQuizPointsCorrect] = useState("1");
  const [quizPointsWrong, setQuizPointsWrong] = useState("-0.25");
  const [quizPointsBlank, setQuizPointsBlank] = useState("0");

  // SIMULATION CONFIG (Per Subject)
  // Map subject_id -> count
  const [subjectCounts, setSubjectCounts] = useState<Record<string, number>>({});

  const [quizSaving, setQuizSaving] = useState(false);
  const [quizFormError, setQuizFormError] = useState<string | null>(null);
  const [quizFormSuccess, setQuizFormSuccess] = useState<string | null>(null);

  // ──────────────────────── FILTER STATE ────────────────────────
  const [showArchivedQuizzes, setShowArchivedQuizzes] = useState(false);
  // Subject Archive Toggle
  const [showArchivedSubjects, setShowArchivedSubjects] = useState(false);
  // Modal State
  const [editingRulesQuiz, setEditingRulesQuiz] = useState<QuizRow | null>(null);

  // ──────────────────────── RULES HANDLERS ────────────────────────
  const handleEditRules = (quiz: QuizRow) => {
    setEditingRulesQuiz(quiz);
  };


  // ──────────────────────── SUBJECT FORM STATE ────────────────────────
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [subjectQuizId, setSubjectQuizId] = useState<string>("");
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectDescription, setSubjectDescription] = useState("");
  const [subjectIsArchived, setSubjectIsArchived] = useState(false); // internal form state

  const [subjectSaving, setSubjectSaving] = useState(false);
  const [subjectFormError, setSubjectFormError] = useState<string | null>(null);
  const [subjectFormSuccess, setSubjectFormSuccess] = useState<string | null>(null);

  // ──────────────────────── UTILS ────────────────────────
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
    setQuizSlug("");
    setQuizRoleId("");
    setSelectedPresetId("");
    setQuizYear("");
    setQuizDescription("");
    setQuizTimeLimit("60");
    setQuizPointsCorrect("1");
    setQuizPointsWrong("-0.25");
    setQuizPointsBlank("0");
    setQuizIsArchived(false);
    setSubjectCounts({});
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
    if (quizzes.length > 0 && !subjectQuizId) {
      // keep current subjectQuizId if present, else default
      const firstActive = quizzes.find((q) => !q.is_archived);
      setSubjectQuizId(firstActive ? firstActive.id : quizzes[0].id);
    }
  };

  // ──────────────────────── LOAD DATA ────────────────────────
  const loadData = async () => {
    setLoading(true);
    setGlobalError(null);
    try {
      const [qRes, sRes, rRes, cRes, ruleRes, qsrRes] = await Promise.all([
        supabase.from("quizzes").select("*").order("created_at", { ascending: false }),
        supabase.from("subjects").select("*").order("name"),
        supabase.from("roles").select("*"),
        supabase.from("categories").select("*"),
        supabase.from("simulation_rules").select("*").order("title"),
        supabase.from("quiz_subject_rules").select("*")
      ]);

      if (qRes.error) throw qRes.error;
      if (sRes.error) throw sRes.error;

      setQuizzes(qRes.data || []);
      setSubjects(sRes.data || []);
      setRoles((rRes.data || []) as RoleRow[]);
      setCategories((cRes.data || []) as CategoryRow[]);
      setRules((ruleRes.data || []) as RuleRow[]);
      setQuizSubjectRules((qsrRes.data || []) as QuizSubjectRuleRow[]);

      if (!subjectQuizId && (qRes.data || []).length > 0) {
        setSubjectQuizId((qRes.data![0]).id);
      }
    } catch (err: any) {
      console.error(err);
      setGlobalError(err.message || "Errore nel caricamento.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Auto-Repair Missing Slugs
  useEffect(() => {
    if (loading || quizzes.length === 0) return;

    const repairSlugs = async () => {
      const toFix = quizzes.filter(q => !q.slug || q.slug.trim() === "");
      if (toFix.length === 0) return;

      console.log(`Auto-repairing ${toFix.length} quizzes with missing slugs...`);
      let fixedCount = 0;

      for (const q of toFix) {
        const autoSlug = q.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        const { error } = await supabase.from("quizzes").update({ slug: autoSlug }).eq("id", q.id);
        if (!error) fixedCount++;
      }

      if (fixedCount > 0) {
        alert(`Sistema: ${fixedCount} concorsi avevano slug mancanti e sono stati corretti automaticamente.`);
        loadData(); // Reload to reflect changes
      }
    };
    repairSlugs();
  }, [quizzes, loading]);

  // ──────────────────────── QUIZ HANDLERS ────────────────────────
  const handleEditQuiz = (quiz: QuizRow) => {
    const q: any = quiz;
    setEditingQuizId(quiz.id);
    setQuizTitle(quiz.title || "");
    setQuizSlug(q.slug || "");
    setQuizRoleId(q.role_id || "");
    setSelectedPresetId(""); // Reset preset selector, we use stored values
    setQuizYear(quiz.year !== null ? String(quiz.year) : "");
    setQuizDescription(quiz.description || "");

    // Simulation Props
    setQuizTimeLimit(quiz.time_limit !== null ? String(quiz.time_limit) : "60");
    setQuizPointsCorrect(quiz.points_correct !== null ? String(quiz.points_correct) : "1");
    setQuizPointsWrong(quiz.points_wrong !== null ? String(quiz.points_wrong) : "-0.25");
    setQuizPointsBlank(quiz.points_blank !== null ? String(quiz.points_blank) : "0");

    setQuizIsArchived(!!quiz.is_archived);

    // Load subject distribution
    const rulesForQuiz = quizSubjectRules.filter(r => r.quiz_id === quiz.id);
    const counts: Record<string, number> = {};
    rulesForQuiz.forEach(r => {
      counts[r.subject_id] = r.question_count;
    });
    setSubjectCounts(counts);

    setQuizFormError(null);
    setQuizFormSuccess(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleApplyPreset = (ruleId: string) => {
    const r = rules.find(rule => rule.id === ruleId);
    if (!r) return;
    setQuizTimeLimit(String(r.time_minutes));
    setQuizPointsCorrect(String(r.points_correct));
    setQuizPointsWrong(String(r.points_wrong));
    setQuizPointsBlank(String(r.points_blank));
    // Note: Presets don't map subjects to counts currently, as they are generic.
    // If we wanted, we could store generic subject names in rules, but that's complex.
    // For now, Presets only apply GLOBAL settings.
    setSelectedPresetId(ruleId);
  };

  const handleToggleArchiveQuiz = async (quiz: QuizRow) => {
    const newArchived = !quiz.is_archived;
    try {
      const { data, error } = await supabase
        .from("quizzes")
        .update({ is_archived: newArchived })
        .eq("id", quiz.id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setQuizzes(prev => prev.map(q => q.id === quiz.id ? (data as QuizRow) : q));
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Errore aggiornamento.");
    }
  };

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuizFormError(null);
    setQuizFormSuccess(null);
    setQuizSaving(true);

    try {
      if (!quizTitle.trim()) throw new Error("Titolo obbligatorio.");

      const totalQuestions = Object.values(subjectCounts).reduce((a: number, b: number) => a + b, 0);

      const autoSlug = quizTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const payload = {
        title: quizTitle.trim(),
        slug: quizSlug.trim() || autoSlug,
        role_id: quizRoleId || null,
        description: quizDescription.trim() || null,
        year: parseIntOrNull(quizYear),

        // Sim Config
        time_limit: parseIntOrNull(quizTimeLimit),
        points_correct: parseFloatOrNull(quizPointsCorrect),
        points_wrong: parseFloatOrNull(quizPointsWrong),
        points_blank: parseFloatOrNull(quizPointsBlank),
        total_questions: totalQuestions, // Calculated sum

        is_archived: quizIsArchived,
      };

      let qId = editingQuizId;

      if (qId) {
        const { error } = await supabase.from("quizzes").update(payload).eq("id", qId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("quizzes").insert(payload).select().single();
        if (error) throw error;
        qId = data.id;
      }

      // Save Subject Rule Counts
      // We upsert per subject.
      // Filter only subjects that have entries
      if (qId) {
        const ruleUpserts = Object.keys(subjectCounts).map(subjectId => ({
          quiz_id: qId,
          subject_id: subjectId,
          question_count: subjectCounts[subjectId] || 0
        }));

        if (ruleUpserts.length > 0) {
          const { error: rulesError } = await supabase.from("quiz_subject_rules").upsert(ruleUpserts, { onConflict: 'quiz_id, subject_id' });
          if (rulesError) console.error("Error saving rules:", rulesError);
        }
      }

      setQuizFormSuccess(editingQuizId ? "Concorso e Regole aggiornati ✅" : "Concorso creato ✅");
      await loadData();
      if (!editingQuizId) resetQuizForm();
    } catch (err: any) {
      console.error("Save Error:", err);
      setQuizFormError(err.message || "Errore salvataggio.");
    } finally {
      setQuizSaving(false);
    }
  };

  // ──────────────────────── SUBJECT HANDLERS ────────────────────────
  const handleEditSubject = (subj: JoinedSubject) => {
    setEditingSubjectId(subj.id);
    setSubjectQuizId(subj.quiz_id || "");
    setSubjectName(subj.name || "");
    setSubjectCode(subj.code || "");
    setSubjectDescription(subj.description || "");
    setSubjectIsArchived(!!subj.is_archived);
    setSubjectFormError(null);
    setSubjectFormSuccess(null);
    document.getElementById("subject-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubjectSaving(true);
    try {
      if (!subjectName.trim()) throw new Error("Nome materia obbligatorio.");
      if (!subjectQuizId) throw new Error("Devi selezionare un concorso.");

      const payload = {
        quiz_id: subjectQuizId,
        name: subjectName.trim(),
        code: subjectCode.trim() || null,
        description: subjectDescription.trim() || null,
        is_archived: subjectIsArchived // Use form state
      };

      if (editingSubjectId) {
        const { error } = await supabase.from("subjects").update(payload).eq("id", editingSubjectId);
        if (error) throw error;
        setSubjectFormSuccess("Materia aggiornata ✅");
      } else {
        const { error } = await supabase.from("subjects").insert(payload);
        if (error) throw error;
        setSubjectFormSuccess("Materia creata ✅");
      }
      await loadData();
      resetSubjectForm();
    } catch (err: any) {
      setSubjectFormError(err.message);
    } finally {
      setSubjectSaving(false);
    }
  };

  const handleArchiveSubject = async (id: string, archive: boolean) => {
    const { error } = await supabase.from("subjects").update({ is_archived: archive }).eq("id", id);
    if (!error) loadData();
  };

  // ──────────────────────── COMPUTED ────────────────────────
  const visibleQuizzes = useMemo(() => {
    if (showArchivedQuizzes) return quizzes;
    return quizzes.filter(q => !q.is_archived);
  }, [quizzes, showArchivedQuizzes]);

  // Subjects for the Subject List Section (filtered by selected quiz in that section)
  const filteredSubjects = useMemo(() => {
    let list = subjects.map(s => {
      const q = quizzes.find(q => q.id === s.quiz_id);
      return { ...s, quiz_title: q ? q.title : "N/A" };
    });

    // Filter by Quiz Selection
    if (subjectQuizId) list = list.filter(s => s.quiz_id === subjectQuizId);

    // Filter by Archive Status
    if (!showArchivedSubjects) list = list.filter(s => !s.is_archived);
    else list = list.filter(s => s.is_archived);

    return list;
  }, [subjects, quizzes, subjectQuizId, showArchivedSubjects]);

  // Active Subjects for the CURRENTLY EDITING QUIZ (for the Rules Table)
  const activeSubjectsForEditingQuiz = useMemo(() => {
    if (!editingQuizId) return [];
    return subjects.filter(s => s.quiz_id === editingQuizId && !s.is_archived);
  }, [editingQuizId, subjects]);

  const currentTotalQuestions = useMemo(() => {
    return Object.values(subjectCounts).reduce((a: number, b: number) => a + b, 0);
  }, [subjectCounts]);

  return (
    <AdminLayout>
      {loading && <p className="text-sm text-slate-400 animate-pulse">Caricamento...</p>}
      {globalError && <p className="text-red-400 mb-4">{globalError}</p>}

      {/* ─── QUIZ FORM ─── */}
      <section className="mb-10 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
          <h2 className="text-xl font-bold text-slate-100">{editingQuizId ? "Modifica Concorso & Regole" : "Nuovo Concorso"}</h2>
          {editingQuizId && <button onClick={resetQuizForm} className="text-xs text-sky-400 hover:text-white transition-colors bg-slate-800 px-3 py-1 rounded">Crea Nuovo invece</button>}
        </div>

        <form onSubmit={handleSaveQuiz} className="grid md:grid-cols-2 gap-8 text-sm">
          {/* LEFT: INFO BASI */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-sky-400 uppercase tracking-wider mb-2">1. Dettagli Generali</h3>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="mb-1 block text-slate-400">Titolo *</label>
                <input required className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:border-sky-500 outline-none" value={quizTitle} onChange={e => setQuizTitle(e.target.value)} placeholder="Es. Allievo Maresciallo 2025" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-slate-400">Ruolo</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-2 text-slate-100"
                    value={quizRoleId}
                    onChange={e => setQuizRoleId(e.target.value)}
                  >
                    <option value="">Seleziona...</option>
                    {roles.map(r => {
                      const catName = categories.find(c => c.id === r.category_id)?.title || "...";
                      return <option key={r.id} value={r.id}>{catName} &gt; {r.title}</option>
                    })}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-slate-400">Anno</label>
                  <input className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100" value={quizYear} onChange={e => setQuizYear(e.target.value)} placeholder="YYYY" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-slate-400">Slug URL</label>
                <input className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 font-mono text-xs" value={quizSlug} onChange={e => setQuizSlug(e.target.value)} placeholder="slug-url-concorso" />
              </div>

              <div>
                <label className="mb-1 block text-slate-400">Descrizione</label>
                <textarea className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 h-20" value={quizDescription} onChange={e => setQuizDescription(e.target.value)} />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="arch_q" className="w-4 h-4" checked={quizIsArchived} onChange={e => setQuizIsArchived(e.target.checked)} />
                <label htmlFor="arch_q" className="text-slate-300 select-none cursor-pointer">Segna come Archiviato (Nascosto)</label>
              </div>
            </div>
          </div>

          {/* RIGHT: SIMULATION CONFIG */}
          <div className="space-y-4 border-l border-slate-800 pl-8">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-2">2. Configurazione Simulazione</h3>
              <select
                className="text-xs bg-slate-900 border border-purple-900/50 text-purple-300 rounded px-2 py-1"
                value={selectedPresetId}
                onChange={(e) => handleApplyPreset(e.target.value)}
              >
                <option value="">Applica Preset...</option>
                {rules.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-950/50 p-4 rounded-lg border border-slate-800">
              <div>
                <label className="block text-slate-400 text-xs mb-1">Tempo (minuti)</label>
                <input className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono" value={quizTimeLimit} onChange={e => setQuizTimeLimit(e.target.value)} />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1">Totale Domande</label>
                <div className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-center font-mono text-slate-300 opacity-80 cursor-not-allowed" title="Calcolato automaticamente">
                  {currentTotalQuestions}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div><label className="block text-[10px] text-slate-500 uppercase">Punti Esatta</label><input className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-center text-emerald-400 font-bold" value={quizPointsCorrect} onChange={e => setQuizPointsCorrect(e.target.value)} /></div>
              <div><label className="block text-[10px] text-slate-500 uppercase">Punti Errata</label><input className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-center text-rose-400 font-bold" value={quizPointsWrong} onChange={e => setQuizPointsWrong(e.target.value)} /></div>
              <div><label className="block text-[10px] text-slate-500 uppercase">Punti Omessa</label><input className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-center text-slate-400 font-bold" value={quizPointsBlank} onChange={e => setQuizPointsBlank(e.target.value)} /></div>
            </div>

            <div className="mt-4">
              <h4 className="text-xs font-bold text-slate-300 mb-2">Distribuzione Materie</h4>
              {!editingQuizId ? (
                <p className="text-xs text-slate-500 italic">Salva il concorso prima di configurare le materie.</p>
              ) : (
                <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                  {activeSubjectsForEditingQuiz.length === 0 && <p className="p-4 text-xs text-slate-500 text-center">Nessuna materia attiva associata.</p>}
                  <table className="w-full text-xs">
                    <thead className="bg-slate-900 text-slate-400">
                      <tr>
                        <th className="px-3 py-2 text-left">Materia</th>
                        <th className="px-3 py-2 w-24 text-center"># Domande</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {activeSubjectsForEditingQuiz.map(s => (
                        <tr key={s.id}>
                          <td className="px-3 py-2 text-slate-300">{s.name}</td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="number"
                              className="w-16 bg-slate-900 border border-slate-700 rounded px-1 py-1 text-center text-white focus:border-purple-500 outline-none"
                              value={subjectCounts[s.id] || 0}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setSubjectCounts(prev => ({ ...prev, [s.id]: val }));
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

          {/* ACTIONS */}
          <div className="md:col-span-2 border-t border-slate-800 pt-4 flex items-center justify-between">
            <div className="text-xs">
              {quizFormError && <p className="text-red-400 font-bold">{quizFormError}</p>}
              {quizFormSuccess && <p className="text-emerald-400 font-bold">{quizFormSuccess}</p>}
            </div>
            <button type="submit" disabled={quizSaving} className="rounded-lg bg-sky-600 px-8 py-3 font-bold text-white shadow hover:bg-sky-500 disabled:opacity-50 transition-all">
              {quizSaving ? "Salvataggio..." : "Salva Configurazione"}
            </button>
          </div>
        </form>
      </section>

      {/* ─── QUIZ LIST ─── */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-semibold text-slate-300">ELENCO CONCORSI</h2>
          <label className="flex gap-2 text-xs cursor-pointer text-slate-400 hover:text-white"><input type="checkbox" checked={showArchivedQuizzes} onChange={e => setShowArchivedQuizzes(e.target.checked)} /> Mostra archiviati</label>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
          {visibleQuizzes.length === 0 && <p className="p-6 text-center text-sm text-slate-500">Nessun concorso trovato.</p>}
          {visibleQuizzes.length > 0 && (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase">
                <tr>
                  <th className="px-4 py-3">Titolo</th>
                  <th className="px-4 py-3">Ruolo</th>
                  <th className="px-4 py-3">Impostazioni</th>
                  <th className="px-4 py-3 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {visibleQuizzes.map(q => {
                  const anyQ = q as any;
                  const roleName = roles.find(r => r.id === anyQ.role_id)?.title || "-";
                  // Show summary of rules
                  return (
                    <tr key={q.id} className={`hover:bg-slate-800/30 transition-colors ${q.is_archived ? "opacity-50 bg-slate-900/50" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-200">{q.title}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{anyQ.slug}</div>
                      </td>
                      <td className="px-4 py-3 text-sky-400">{roleName}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 text-[10px]">
                          <span className="bg-purple-900/30 text-purple-300 px-2 py-0.5 rounded border border-purple-900/50">{q.time_limit || 0} min</span>
                          <span className="bg-emerald-900/30 text-emerald-300 px-2 py-0.5 rounded border border-emerald-900/50">{q.total_questions || 0} quest</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleEditRules(q)} className="text-purple-400 hover:text-purple-300 mr-3 font-semibold text-[10px] uppercase border border-purple-900/50 px-2 py-1 rounded hover:bg-purple-900/20">Regole Sim.</button>
                        <button onClick={() => handleEditQuiz(q)} className="text-sky-400 hover:text-sky-300 mr-3 font-semibold">Gestisci</button>
                        <button onClick={() => handleToggleArchiveQuiz(q)} className="text-slate-500 hover:text-white">{q.is_archived ? "Attiva" : "Archivia"}</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ─── SUBJECTS SECTION ─── */}
      <section id="subject-form" className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-bold mb-4 text-emerald-400 flex items-center gap-2">
          Gestione Materie
          <span className="text-xs font-normal text-slate-500 ml-2">(Create qui, poi configurate nel Concorso)</span>
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {/* SUBJECT FORM */}
          <div className="md:col-span-1">
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">{editingSubjectId ? "Modifica Materia" : "Nuova Materia"}</h3>
              <form onSubmit={handleSaveSubject} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Concorso Afferenza *</label>
                  <select className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" value={subjectQuizId} onChange={e => setSubjectQuizId(e.target.value)}>
                    {quizzes.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Nome Materia *</label>
                  <input required className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" value={subjectName} onChange={e => setSubjectName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Codice (opz)</label>
                  <input className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" value={subjectCode} onChange={e => setSubjectCode(e.target.value)} />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Descrizione</label>
                  <textarea className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white h-16" value={subjectDescription} onChange={e => setSubjectDescription(e.target.value)} />
                </div>

                <div className="flex gap-2 pt-2">
                  {editingSubjectId && <button type="button" onClick={resetSubjectForm} className="bg-slate-800 text-slate-300 px-3 py-2 rounded flex-1 hover:bg-slate-700">Annulla</button>}
                  <button type="submit" disabled={subjectSaving} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded font-bold flex-1">
                    {subjectSaving ? "..." : (editingSubjectId ? "Aggiorna" : "Crea")}
                  </button>
                </div>
                {subjectFormError && <p className="text-red-400">{subjectFormError}</p>}
                {subjectFormSuccess && <p className="text-emerald-400">{subjectFormSuccess}</p>}
              </form>
            </div>
          </div>

          {/* SUBJECT LIST */}
          <div className="md:col-span-2">
            <div className="flex justify-between items-end mb-3">
              <h3 className="text-sm font-semibold text-slate-300">
                Elenco Materie
                <span className="text-xs text-slate-500 ml-2 font-normal">
                  Filtrate per: {quizzes.find(q => q.id === subjectQuizId)?.title || "..."}
                </span>
              </h3>

              {/* Filter Tabs */}
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-[10px]">
                <button
                  onClick={() => setShowArchivedSubjects(false)}
                  className={`px-3 py-1 rounded ${!showArchivedSubjects ? "bg-slate-800 text-white shadow" : "text-slate-500 hover:text-slate-300"}`}
                >
                  Attive
                </button>
                <button
                  onClick={() => setShowArchivedSubjects(true)}
                  className={`px-3 py-1 rounded ${showArchivedSubjects ? "bg-slate-800 text-white shadow" : "text-slate-500 hover:text-slate-300"}`}
                >
                  Archiviate
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950 overflow-hidden min-h-[200px]">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-slate-400">
                  <tr>
                    <th className="p-3">Nome / Codice</th>
                    <th className="p-3">Descrizione</th>
                    <th className="p-3 text-right">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredSubjects.length === 0 && (
                    <tr><td colSpan={3} className="p-8 text-center text-slate-500">
                      {showArchivedSubjects ? "Nessuna materia archiviata." : "Nessuna materia attiva per questo concorso."}
                    </td></tr>
                  )}
                  {filteredSubjects.map(s => (
                    <tr key={s.id} className="hover:bg-slate-900/50 group">
                      <td className="p-3">
                        <div className="font-bold text-slate-200">{s.name}</div>
                        <div className="text-[10px] text-slate-500 mono">{s.code}</div>
                      </td>
                      <td className="p-3 text-slate-400 truncate max-w-[200px]">{s.description || "-"}</td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end items-center gap-3">
                          {/* Edit */}
                          <button onClick={() => handleEditSubject(s)} className="text-sky-500 hover:text-sky-400 font-medium">Edit</button>

                          {/* Archive/Restore Action */}
                          {s.is_archived ? (
                            <button onClick={() => handleArchiveSubject(s.id, false)} className="text-emerald-500 hover:text-emerald-400 flex items-center gap-1">
                              <span>⟲</span> Ripristina
                            </button>
                          ) : (
                            <button onClick={() => handleArchiveSubject(s.id, true)} className="text-slate-500 hover:text-rose-500 flex items-center gap-1 group-hover:visible">
                              <span>×</span> Archivia
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* RULES EDITOR MODAL */}
      {editingRulesQuiz && (
        <QuizOfficialRulesEditor
          quiz={editingRulesQuiz}
          onClose={() => setEditingRulesQuiz(null)}
          onUpdate={loadData}
        />
      )}
    </AdminLayout>
  );
}
