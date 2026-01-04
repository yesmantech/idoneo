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
      {loading && <p className="text-sm text-[var(--foreground)] opacity-40 animate-pulse text-center py-4">Caricamento...</p>}
      {globalError && <p className="text-rose-400 mb-4 bg-rose-500/10 p-3 rounded-lg border border-rose-500/30 font-medium">{globalError}</p>}

      {/* ─── QUIZ FORM ─── */}
      <section className="mb-8 rounded-[24px] border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-sm transition-colors">
        <div className="flex justify-between items-center mb-6 border-b border-[var(--card-border)] pb-4">
          <h2 className="text-xl font-black text-[var(--foreground)] tracking-tight flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            {editingQuizId ? "Modifica Concorso & Regole" : "Nuovo Concorso"}
          </h2>
          {editingQuizId && (
            <button
              onClick={resetQuizForm}
              className="text-xs font-bold text-[var(--foreground)] opacity-50 hover:text-brand-cyan hover:opacity-100 hover:bg-brand-cyan/5 transition-all px-3 py-1.5 rounded-lg border border-transparent hover:border-brand-cyan/20"
            >
              + Crea Nuovo invece
            </button>
          )}
        </div>

        <form onSubmit={handleSaveQuiz} className="grid md:grid-cols-2 gap-8 text-sm">
          {/* LEFT: INFO BASI */}
          <div className="space-y-5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-slate-800 text-slate-400 flex items-center justify-center text-[10px]">1</span>
              Dettagli Generali
            </h3>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="mb-1.5 block font-bold text-[var(--foreground)] opacity-40">Titolo *</label>
                <input required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-[var(--foreground)] focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none transition-all placeholder:text-[var(--foreground)] placeholder:opacity-40 font-bold" value={quizTitle} onChange={e => setQuizTitle(e.target.value)} placeholder="Es. Allievo Maresciallo 2025" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block font-bold text-[var(--foreground)] opacity-40">Ruolo</label>
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-3 text-[var(--foreground)] focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none transition-all"
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
                  <label className="mb-1.5 block font-bold text-[var(--foreground)] opacity-40">Anno</label>
                  <input className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-[var(--foreground)] focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none transition-all" value={quizYear} onChange={e => setQuizYear(e.target.value)} placeholder="YYYY" />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block font-bold text-[var(--foreground)] opacity-40">Slug URL</label>
                <input className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-[var(--foreground)] opacity-50 font-mono text-xs focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none transition-all" value={quizSlug} onChange={e => setQuizSlug(e.target.value)} placeholder="slug-url-concorso" />
              </div>

              <div>
                <label className="mb-1.5 block font-bold text-[var(--foreground)] opacity-40">Descrizione</label>
                <textarea className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-[var(--foreground)] focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none transition-all h-24" value={quizDescription} onChange={e => setQuizDescription(e.target.value)} />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input type="checkbox" id="arch_q" className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-brand-cyan focus:ring-brand-cyan" checked={quizIsArchived} onChange={e => setQuizIsArchived(e.target.checked)} />
                <label htmlFor="arch_q" className="text-[var(--foreground)] opacity-50 font-medium select-none cursor-pointer">Segna come Archiviato (Nascosto)</label>
              </div>
            </div>
          </div>

          {/* RIGHT: SIMULATION CONFIG */}
          <div className="space-y-5 md:border-l md:border-slate-800 md:pl-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-purple-500/10 text-purple-400 flex items-center justify-center text-[10px] border border-purple-500/20">2</span>
                Configurazione Simulazione
              </h3>
              <select
                className="text-xs bg-purple-500/10 border border-purple-500/20 text-purple-300 font-bold rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                value={selectedPresetId}
                onChange={(e) => handleApplyPreset(e.target.value)}
              >
                <option value="">Applica Preset...</option>
                {rules.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-purple-500/5 p-5 rounded-2xl border border-purple-500/10">
              <div>
                <label className="block text-[var(--foreground)] opacity-40 font-bold text-xs mb-1.5">Tempo (minuti)</label>
                <div className="relative">
                  <input className="w-full bg-slate-50 dark:bg-slate-950 border border-purple-500/20 rounded-xl px-3 py-2 text-center font-mono font-bold text-[var(--foreground)] focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20" value={quizTimeLimit} onChange={e => setQuizTimeLimit(e.target.value)} />
                  <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[var(--foreground)] opacity-20 text-[10px] pointer-events-none">min</span>
                </div>
              </div>
              <div>
                <label className="block text-[var(--foreground)] opacity-40 font-bold text-xs mb-1.5">Totale Domande</label>
                <div className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-center font-mono font-bold text-[var(--foreground)] opacity-30 cursor-not-allowed flex items-center justify-center gap-1" title="Calcolato automaticamente">
                  <span>∑</span> {currentTotalQuestions}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div><label className="block text-[10px] font-bold text-emerald-500 uppercase mb-1">Punti Esatta</label><input className="w-full bg-slate-50 dark:bg-slate-950 border border-emerald-500/20 rounded-xl p-2.5 text-center text-emerald-500 font-bold focus:outline-none focus:border-emerald-500" value={quizPointsCorrect} onChange={e => setQuizPointsCorrect(e.target.value)} /></div>
              <div><label className="block text-[10px] font-bold text-rose-500 uppercase mb-1">Punti Errata</label><input className="w-full bg-slate-50 dark:bg-slate-950 border border-rose-500/20 rounded-xl p-2.5 text-center text-rose-500 font-bold focus:outline-none focus:border-rose-500" value={quizPointsWrong} onChange={e => setQuizPointsWrong(e.target.value)} /></div>
              <div><label className="block text-[10px] font-bold text-[var(--foreground)] opacity-30 uppercase mb-1">Punti Omessa</label><input className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-center text-[var(--foreground)] opacity-50 font-bold focus:outline-none focus:border-slate-500" value={quizPointsBlank} onChange={e => setQuizPointsBlank(e.target.value)} /></div>
            </div>

            <div className="mt-6">
              <h4 className="text-xs font-bold text-[var(--foreground)] opacity-70 mb-3 flex items-center gap-2">
                <span>📚</span> Distribuzione Materie
              </h4>
              {!editingQuizId ? (
                <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-500">Salva il concorso prima di configurare le materie.</p>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto shadow-sm">
                  {activeSubjectsForEditingQuiz.length === 0 && <p className="p-6 text-xs text-slate-500 text-center italic">Nessuna materia attiva associata.</p>}
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-950 text-[var(--foreground)] opacity-40 font-bold border-b border-[var(--card-border)]">
                      <tr>
                        <th className="px-4 py-3 text-left">Materia</th>
                        <th className="px-4 py-3 w-32 text-center"># Domande</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--card-border)]">
                      {activeSubjectsForEditingQuiz.map(s => (
                        <tr key={s.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3 text-[var(--foreground)] opacity-80 font-medium">{s.name}</td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              className="w-20 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-center text-[var(--foreground)] font-bold focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
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
          <div className="md:col-span-2 border-t border-slate-800 pt-6 flex items-center justify-between">
            <div className="text-sm">
              {quizFormError && <p className="text-rose-400 font-bold flex items-center gap-2"><span>⚠️</span> {quizFormError}</p>}
              {quizFormSuccess && <p className="text-emerald-400 font-bold flex items-center gap-2"><span>✅</span> {quizFormSuccess}</p>}
            </div>
            <button type="submit" disabled={quizSaving} className="rounded-full bg-brand-cyan hover:bg-brand-cyan/90 px-8 py-3 font-bold text-slate-900 shadow-[0_0_20px_rgba(6,214,211,0.3)] hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0">
              {quizSaving ? "Salvataggio..." : "Salva Configurazione"}
            </button>
          </div>
        </form>
      </section>

      {/* ─── QUIZ LIST ─── */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-bold text-[var(--foreground)] opacity-40 uppercase tracking-wider">ELENCO CONCORSI</h2>
          <label className="flex gap-2 text-xs cursor-pointer text-[var(--foreground)] opacity-50 hover:opacity-100 font-medium bg-[var(--card)] px-3 py-1.5 rounded-full border border-[var(--card-border)] shadow-sm transition-all hover:bg-slate-100 dark:hover:bg-slate-800">
            <input type="checkbox" className="rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-brand-cyan focus:ring-brand-cyan" checked={showArchivedQuizzes} onChange={e => setShowArchivedQuizzes(e.target.checked)} />
            Mostra archiviati
          </label>
        </div>
        <div className="overflow-x-auto rounded-[24px] border border-[var(--card-border)] bg-[var(--card)] shadow-sm transition-colors">
          {visibleQuizzes.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-slate-500 mb-2 text-2xl">📭</p>
              <p className="text-sm text-slate-500 font-medium">Nessun concorso trovato.</p>
            </div>
          )}
          {visibleQuizzes.length > 0 && (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-950 text-[var(--foreground)] opacity-40 font-bold border-b border-[var(--card-border)] uppercase tracking-widest text-[10px]">
                <tr>
                  <th className="px-6 py-4">Titolo</th>
                  <th className="px-6 py-4">Ruolo</th>
                  <th className="px-6 py-4">Impostazioni</th>
                  <th className="px-6 py-4 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]">
                {visibleQuizzes.map(q => {
                  const anyQ = q as any;
                  const roleName = roles.find(r => r.id === anyQ.role_id)?.title || "-";
                  const isArchived = q.is_archived;
                  // Show summary of rules
                  return (
                    <tr key={q.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group ${isArchived ? "bg-slate-50/50 dark:bg-slate-900/50 grayscale opacity-40" : ""}`}>
                      <td className="px-6 py-4">
                        <div className="font-bold text-[var(--foreground)] opacity-80 text-sm mb-0.5">{q.title}</div>
                        <div className="text-[10px] text-[var(--foreground)] opacity-40 font-mono bg-slate-100 dark:bg-slate-950 inline-block px-1.5 rounded border border-slate-200 dark:border-slate-800">{anyQ.slug}</div>
                      </td>
                      <td className="px-6 py-4 text-[var(--foreground)] opacity-50 font-medium">{roleName}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 text-[10px] font-bold">
                          <span className="bg-purple-500/10 text-purple-400 px-2 py-1 rounded-md border border-purple-500/20">{q.time_limit || 0} min</span>
                          <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md border border-emerald-500/20">{q.total_questions || 0} quest</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEditRules(q)} className="text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all">Regole Sim.</button>
                          <button onClick={() => handleEditQuiz(q)} className="text-brand-cyan hover:text-cyan-300 bg-brand-cyan/10 hover:bg-brand-cyan/20 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all">Gestisci</button>
                          <button onClick={() => handleToggleArchiveQuiz(q)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${q.is_archived ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"}`}>
                            {q.is_archived ? "Attiva" : "Archivia"}
                          </button>
                        </div>
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
      <section id="subject-form" className="bg-[var(--card)] border border-[var(--card-border)] rounded-[24px] p-8 shadow-sm transition-colors">
        <h2 className="text-lg font-black text-[var(--foreground)] mb-6 flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center text-sm border border-amber-500/20">📚</span>
          Gestione Materie
          <span className="text-xs font-medium text-[var(--foreground)] opacity-40 bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded-full border border-slate-200 dark:border-slate-800 self-center mt-0.5">(Create qui, poi configurate nel Concorso)</span>
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {/* SUBJECT FORM */}
          <div className="md:col-span-1">
            <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 sticky top-4">
              <h3 className="text-sm font-bold text-[var(--foreground)] opacity-80 mb-4">{editingSubjectId ? "Modifica Materia" : "Nuova Materia"}</h3>
              <form onSubmit={handleSaveSubject} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-[var(--foreground)] opacity-40 mb-1.5">Concorso Afferenza *</label>
                  <select className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-[var(--foreground)] focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan outline-none font-medium" value={subjectQuizId} onChange={e => setSubjectQuizId(e.target.value)}>
                    {quizzes.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[var(--foreground)] opacity-40 mb-1.5">Nome Materia *</label>
                  <input required className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-[var(--foreground)] focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan outline-none font-medium placeholder:text-[var(--foreground)] placeholder:opacity-40" value={subjectName} onChange={e => setSubjectName(e.target.value)} placeholder="es. Diritto Costituzionale" />
                </div>
                <div>
                  <label className="block font-bold text-[var(--foreground)] opacity-40 mb-1.5">Codice (opz)</label>
                  <input className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-[var(--foreground)] focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan outline-none font-mono text-xs" value={subjectCode} onChange={e => setSubjectCode(e.target.value)} placeholder="DIR-COST" />
                </div>
                <div>
                  <label className="block font-bold text-[var(--foreground)] opacity-40 mb-1.5">Descrizione</label>
                  <textarea className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-[var(--foreground)] focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan outline-none h-20" value={subjectDescription} onChange={e => setSubjectDescription(e.target.value)} />
                </div>

                <div className="flex gap-3 pt-2">
                  {editingSubjectId && <button type="button" onClick={resetSubjectForm} className="bg-slate-900 border border-slate-700 text-slate-500 font-bold px-4 py-2.5 rounded-xl flex-1 hover:bg-slate-800 hover:text-slate-300 transition-colors">Annulla</button>}
                  <button type="submit" disabled={subjectSaving} className="bg-brand-cyan hover:bg-brand-cyan/90 text-slate-900 px-4 py-2.5 rounded-xl font-bold flex-1 shadow-soft hover:shadow-md transition-all">
                    {subjectSaving ? "..." : (editingSubjectId ? "Aggiorna" : "Crea")}
                  </button>
                </div>
                <div className="min-h-[20px]">
                  {subjectFormError && <p className="text-rose-400 font-bold">{subjectFormError}</p>}
                  {subjectFormSuccess && <p className="text-emerald-400 font-bold">{subjectFormSuccess}</p>}
                </div>
              </form>
            </div>
          </div>

          {/* SUBJECT LIST */}
          <div className="md:col-span-2">
            <div className="flex justify-between items-end mb-4">
              <h3 className="text-sm font-bold text-[var(--foreground)] opacity-40 uppercase tracking-wider">
                Elenco Materie
                <span className="text-[10px] text-[var(--foreground)] opacity-30 ml-2 font-normal normal-case break-all block sm:inline">
                  per: <strong className="text-[var(--foreground)] opacity-50">{quizzes.find(q => q.id === subjectQuizId)?.title || "..."}</strong>
                </span>
              </h3>

              {/* Filter Tabs */}
              <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-[10px] font-bold">
                <button
                  onClick={() => setShowArchivedSubjects(false)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${!showArchivedSubjects ? "bg-white dark:bg-slate-800 text-[var(--foreground)] shadow-sm" : "text-[var(--foreground)] opacity-40 hover:opacity-100"}`}
                >
                  Attive
                </button>
                <button
                  onClick={() => setShowArchivedSubjects(true)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${showArchivedSubjects ? "bg-white dark:bg-slate-800 text-[var(--foreground)] shadow-sm" : "text-[var(--foreground)] opacity-40 hover:opacity-100"}`}
                >
                  Archiviate
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden min-h-[300px] shadow-sm">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/50 dark:bg-slate-950 text-[var(--foreground)] opacity-40 border-b border-[var(--card-border)]">
                  <tr>
                    <th className="p-4 font-bold uppercase tracking-widest text-[10px]">Nome / Codice</th>
                    <th className="p-4 font-bold uppercase tracking-widest text-[10px]">Descrizione</th>
                    <th className="p-4 font-bold uppercase tracking-widest text-[10px] text-right">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)]">
                  {filteredSubjects.length === 0 && (
                    <tr><td colSpan={3} className="p-12 text-center text-slate-500">
                      {showArchivedSubjects ? "Nessuna materia archiviata." : "Nessuna materia attiva per questo concorso."}
                    </td></tr>
                  )}
                  {filteredSubjects.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="p-4">
                        <div className="font-bold text-[var(--foreground)] opacity-80 text-sm">{s.name}</div>
                        {s.code && <div className="text-[10px] text-[var(--foreground)] opacity-40 font-mono bg-slate-100 dark:bg-slate-950 inline-block px-1 rounded mt-1 border border-slate-200 dark:border-slate-800">{s.code}</div>}
                      </td>
                      <td className="p-4 text-[var(--foreground)] opacity-40 truncate max-w-[200px]">{s.description || "-"}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          {/* Edit */}
                          <button onClick={() => handleEditSubject(s)} className="text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 px-3 py-1.5 rounded-lg font-bold transition-all">Edit</button>

                          {/* Archive/Restore Action */}
                          {s.is_archived ? (
                            <button onClick={() => handleArchiveSubject(s.id, false)} className="text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all">
                              <span>⟲</span> Ripristina
                            </button>
                          ) : (
                            <button onClick={() => handleArchiveSubject(s.id, true)} className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all">
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
