/**
 * @file QuizAdmin.tsx (AdminQuizzesPage)
 * @description Master control panel for creating and managing quizzes.
 *
 * This is the central hub for:
 * - Creating/Editing Quizzes (Contests)
 * - Assigning Roles to Quizzes
 * - Configuring Simulation Parameters (time, points, subjects distribution)
 * - Creating/Managing Subjects (which are linked to quizzes)
 * - Archiving old quizzes/subjects
 *
 * ## Components Structure
 * - `QuizForm`: Handles creation/editing of quizzes + simulation rules
 * - `QuizList`: Displays table of quizzes
 * - `SubjectManager`: Handles creation/listing of subjects
 */

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/types/database";
import { AdminLayout } from "@/components/admin";
import QuizOfficialRulesEditor from "./QuizOfficialRulesEditor";

// Sub-Components
import QuizList from "./components/QuizList";
import QuizForm from "./components/QuizForm";
import SubjectManager from "./components/SubjectManager";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type QuizRow = Database["public"]["Tables"]["quizzes"]["Row"];
type SubjectRow = Database["public"]["Tables"]["subjects"]["Row"];
type RuleRow = Database["public"]["Tables"]["simulation_rules"]["Row"];
type QuizSubjectRuleRow = Database["public"]["Tables"]["quiz_subject_rules"]["Row"];
type CategoryRow = { id: string; title: string };

type JoinedSubject = SubjectRow & {
  quiz_title?: string;
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [subjects, setSubjects] = useState<JoinedSubject[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [rules, setRules] = useState<RuleRow[]>([]);
  const [quizSubjectRules, setQuizSubjectRules] = useState<QuizSubjectRuleRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Filter State
  const [showArchivedQuizzes, setShowArchivedQuizzes] = useState(false);

  // Edit State
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [editingRulesQuiz, setEditingRulesQuiz] = useState<QuizRow | null>(null);

  // ──────────────────────── LOAD DATA ────────────────────────
  const loadData = async () => {
    setLoading(true);
    setGlobalError(null);
    try {
      const [qRes, sRes, cRes, ruleRes, qsrRes] = await Promise.all([
        supabase.from("quizzes").select("*").order("created_at", { ascending: false }),
        supabase.from("subjects").select("*").order("name"),
        supabase.from("categories").select("*"),
        supabase.from("simulation_rules").select("*").order("title"),
        supabase.from("quiz_subject_rules").select("*")
      ]);

      if (qRes.error) throw qRes.error;
      if (sRes.error) throw sRes.error;

      setQuizzes(qRes.data || []);
      setSubjects(sRes.data || []);
      setCategories((cRes.data || []) as CategoryRow[]);
      setRules((ruleRes.data || []) as RuleRow[]);
      setQuizSubjectRules((qsrRes.data || []) as QuizSubjectRuleRow[]);

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

  // ──────────────────────── HANDLERS ────────────────────────

  const handleSaveQuiz = async (quizPayload: any, subjectCounts: Record<string, number>, isEdit: boolean) => {
    let qId = isEdit ? editingQuizId : null;

    if (qId) {
      const { error } = await supabase.from("quizzes").update(quizPayload).eq("id", qId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase.from("quizzes").insert(quizPayload).select().single();
      if (error) throw error;
      qId = data.id;
    }

    // Save Subject Rules
    if (qId) {
      const ruleUpserts = Object.keys(subjectCounts).map(subjectId => ({
        quiz_id: qId,
        subject_id: subjectId,
        question_count: subjectCounts[subjectId] || 0
      }));

      if (ruleUpserts.length > 0) {
        const { error: rulesError } = await supabase.from("quiz_subject_rules").upsert(ruleUpserts as any, { onConflict: 'quiz_id, subject_id' });
        if (rulesError) console.error("Error saving rules:", rulesError);
      }
    }

    await loadData();
    if (isEdit) {
      setEditingQuizId(null);
    }
  };

  const handleToggleArchiveQuiz = async (quiz: QuizRow) => {
    try {
      const { error } = await supabase
        .from("quizzes")
        .update({ is_archived: !quiz.is_archived })
        .eq("id", quiz.id);

      if (error) throw error;
      setQuizzes(prev => prev.map(q => q.id === quiz.id ? { ...q, is_archived: !quiz.is_archived } : q));
    } catch (err: any) {
      alert(err.message || "Errore aggiornamento.");
    }
  };

  // Subject Handlers
  const handleSaveSubject = async (subjectPayload: any, isEdit: boolean, id?: string) => {
    if (isEdit && id) {
      const { error } = await supabase.from("subjects").update(subjectPayload).eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("subjects").insert(subjectPayload);
      if (error) throw error;
    }
    await loadData();
  };

  const handleArchiveSubject = async (id: string, archive: boolean) => {
    const { error } = await supabase.from("subjects").update({ is_archived: archive }).eq("id", id);
    if (!error) loadData();
  };

  // ──────────────────────── COMPUTED ────────────────────────

  const editingQuiz = useMemo(() => {
    if (!editingQuizId) return null;
    return quizzes.find(q => q.id === editingQuizId) || null;
  }, [quizzes, editingQuizId]);

  const activeSubjectsForEditingQuiz = useMemo(() => {
    if (!editingQuizId) return [];
    return subjects.filter(s => s.quiz_id === editingQuizId && !s.is_archived);
  }, [editingQuizId, subjects]);

  const initialSubjectCounts = useMemo(() => {
    if (!editingQuizId) return {};
    const rulesForQuiz = quizSubjectRules.filter(r => r.quiz_id === editingQuizId);
    const counts: Record<string, number> = {};
    rulesForQuiz.forEach(r => {
      counts[r.subject_id] = r.question_count;
    });
    return counts;
  }, [editingQuizId, quizSubjectRules]);

  return (
    <AdminLayout>
      {loading && <p className="text-sm text-[var(--foreground)] opacity-40 animate-pulse text-center py-4">Caricamento...</p>}
      {globalError && <p className="text-rose-400 mb-4 bg-rose-500/10 p-3 rounded-lg border border-rose-500/30 font-medium">{globalError}</p>}

      {/* ─── QUIZ FORM ─── */}
      <QuizForm
        initialData={editingQuiz}
        categories={categories}
        rules={rules}
        availableSubjects={activeSubjectsForEditingQuiz}
        initialSubjectCounts={initialSubjectCounts}
        onSave={handleSaveQuiz}
        onCancel={() => setEditingQuizId(null)}
      />

      {/* ─── QUIZ LIST ─── */}
      <QuizList
        quizzes={quizzes}
        categories={categories}
        showArchived={showArchivedQuizzes}
        onToggleShowArchived={setShowArchivedQuizzes}
        onEditQuiz={(q) => {
          setEditingQuizId(q.id);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onEditRules={setEditingRulesQuiz}
        onToggleArchive={handleToggleArchiveQuiz}
      />

      {/* ─── SUBJECT MANAGER ─── */}
      <SubjectManager
        quizzes={quizzes}
        subjects={subjects}
        onSave={handleSaveSubject}
        onArchive={handleArchiveSubject}
      />

      {/* RULES EDITOR MODAL (Legacy/Independent) */}
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
