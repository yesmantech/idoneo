import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/types/database';

// ================== TYPES ==================

type QuizRow = Database['public']['Tables']['quizzes']['Row'];
type SubjectRow = Database['public']['Tables']['subjects']['Row'];
type QuizSubjectRuleRow = Database['public']['Tables']['quiz_subject_rules']['Row'];
type RoleRow = { id: string; title: string; category_id: string; slug: string };
type CategoryRow = { id: string; title: string };

export interface QuizFormData {
    title: string;
    slug: string;
    roleId: string;
    year: string;
    description: string;
    timeLimit: string;
    pointsCorrect: string;
    pointsWrong: string;
    pointsBlank: string;
    isArchived: boolean;
    useCustomPassThreshold: boolean;
    minCorrectForPass: string;
    subjectCounts: Record<string, number>;
}

const INITIAL_FORM_DATA: QuizFormData = {
    title: '',
    slug: '',
    roleId: '',
    year: '',
    description: '',
    timeLimit: '60',
    pointsCorrect: '1',
    pointsWrong: '-0.25',
    pointsBlank: '0',
    isArchived: false,
    useCustomPassThreshold: false,
    minCorrectForPass: '',
    subjectCounts: {},
};

// ================== UTILITIES ==================

function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

function parseIntOrNull(val: string): number | null {
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? null : parsed;
}

function parseFloatOrNull(val: string): number | null {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? null : parsed;
}

// ================== HOOK ==================

export function useQuizAdmin() {
    // Data
    const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
    const [subjects, setSubjects] = useState<SubjectRow[]>([]);
    const [roles, setRoles] = useState<RoleRow[]>([]);
    const [categories, setCategories] = useState<CategoryRow[]>([]);
    const [quizSubjectRules, setQuizSubjectRules] = useState<QuizSubjectRuleRow[]>([]);

    // UI State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showArchived, setShowArchived] = useState(false);

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<QuizFormData>(INITIAL_FORM_DATA);
    const [formSaving, setFormSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);

    // Load Data
    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [qRes, sRes, rRes, cRes, rulesRes] = await Promise.all([
                supabase.from('quizzes').select('*').order('title'),
                supabase.from('subjects').select('*').order('name'),
                supabase.from('roles').select('id, title, category_id, slug').order('title'),
                supabase.from('categories').select('id, title').order('title'),
                supabase.from('quiz_subject_rules').select('*'),
            ]);

            if (qRes.error) throw qRes.error;
            if (sRes.error) throw sRes.error;
            if (rRes.error) throw rRes.error;
            if (cRes.error) throw cRes.error;
            if (rulesRes.error) throw rulesRes.error;

            setQuizzes(qRes.data || []);
            setSubjects(sRes.data || []);
            setRoles(rRes.data || []);
            setCategories(cRes.data || []);
            setQuizSubjectRules(rulesRes.data || []);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Errore nel caricamento';
            console.error(err);
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Form Actions
    const resetForm = useCallback(() => {
        setEditingId(null);
        setFormData(INITIAL_FORM_DATA);
        setFormError(null);
        setFormSuccess(null);
    }, []);

    const startEdit = useCallback((quiz: QuizRow) => {
        setEditingId(quiz.id);

        // Build subjectCounts from quizSubjectRules
        const counts: Record<string, number> = {};
        quizSubjectRules
            .filter(r => r.quiz_id === quiz.id)
            .forEach(r => {
                counts[r.subject_id] = r.question_count;
            });

        setFormData({
            title: quiz.title || '',
            slug: quiz.slug || '',
            roleId: quiz.role_id || '',
            year: quiz.year !== null ? String(quiz.year) : '',
            description: quiz.description || '',
            timeLimit: quiz.time_limit !== null ? String(quiz.time_limit) : '60',
            pointsCorrect: quiz.points_correct !== null ? String(quiz.points_correct) : '1',
            pointsWrong: quiz.points_wrong !== null ? String(quiz.points_wrong) : '-0.25',
            pointsBlank: quiz.points_blank !== null ? String(quiz.points_blank) : '0',
            isArchived: !!quiz.is_archived,
            useCustomPassThreshold: !!quiz.use_custom_pass_threshold,
            minCorrectForPass: quiz.min_correct_for_pass !== null ? String(quiz.min_correct_for_pass) : '',
            subjectCounts: counts,
        });
        setFormError(null);
        setFormSuccess(null);
    }, [quizSubjectRules]);

    const updateFormField = useCallback(<K extends keyof QuizFormData>(field: K, value: QuizFormData[K]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setFormError(null);
    }, []);

    const saveQuiz = useCallback(async () => {
        setFormSaving(true);
        setFormError(null);
        setFormSuccess(null);

        try {
            if (!formData.title.trim()) {
                throw new Error("Il titolo è obbligatorio.");
            }

            // Calculate total questions from subjectCounts
            const totalQuestions = Object.values(formData.subjectCounts).reduce((sum: number, c: number) => sum + c, 0);

            const payload = {
                title: formData.title.trim(),
                slug: formData.slug.trim() || generateSlug(formData.title),
                role_id: formData.roleId || null,
                description: formData.description.trim() || null,
                year: parseIntOrNull(formData.year),
                time_limit: parseIntOrNull(formData.timeLimit),
                points_correct: parseFloatOrNull(formData.pointsCorrect),
                points_wrong: parseFloatOrNull(formData.pointsWrong),
                points_blank: parseFloatOrNull(formData.pointsBlank),
                total_questions: totalQuestions,
                is_archived: formData.isArchived,
                use_custom_pass_threshold: formData.useCustomPassThreshold,
                min_correct_for_pass: parseIntOrNull(formData.minCorrectForPass),
            };

            let quizId = editingId;

            if (quizId) {
                const { error } = await supabase.from('quizzes').update(payload).eq('id', quizId);
                if (error) throw error;
            } else {
                const { data, error } = await supabase.from('quizzes').insert(payload).select().single();
                if (error) throw error;
                quizId = data.id;
            }

            // Save subject rule counts
            if (quizId && Object.keys(formData.subjectCounts).length > 0) {
                const ruleUpserts = Object.entries(formData.subjectCounts).map(([subjectId, count]) => ({
                    quiz_id: quizId,
                    subject_id: subjectId,
                    question_count: count || 0,
                }));

                const { error: rulesError } = await supabase
                    .from('quiz_subject_rules')
                    .upsert(ruleUpserts, { onConflict: 'quiz_id,subject_id' });

                if (rulesError) console.error('Error saving rules:', rulesError);
            }

            setFormSuccess(editingId ? 'Concorso aggiornato ✅' : 'Concorso creato ✅');
            await loadData();

            if (!editingId) resetForm();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Errore salvataggio';
            console.error(err);
            setFormError(message);
        } finally {
            setFormSaving(false);
        }
    }, [formData, editingId, loadData, resetForm]);

    const toggleArchive = useCallback(async (quiz: QuizRow) => {
        try {
            const { data, error } = await supabase
                .from('quizzes')
                .update({ is_archived: !quiz.is_archived })
                .eq('id', quiz.id)
                .select()
                .single();

            if (error) throw error;
            if (data) {
                setQuizzes(prev => prev.map(q => q.id === quiz.id ? (data as QuizRow) : q));
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Errore aggiornamento';
            console.error(err);
            alert(message);
        }
    }, []);

    // Computed values
    const visibleQuizzes = showArchived
        ? quizzes
        : quizzes.filter(q => !q.is_archived);

    const getSubjectsForQuiz = useCallback((quizId: string) => {
        return subjects.filter(s => s.quiz_id === quizId && !s.is_archived);
    }, [subjects]);

    const getRoleTitle = useCallback((roleId: string | null) => {
        if (!roleId) return '-';
        const role = roles.find(r => r.id === roleId);
        return role?.title || '-';
    }, [roles]);

    return {
        quizzes,
        subjects,
        roles,
        categories,
        quizSubjectRules,
        loading,
        error,
        showArchived,
        setShowArchived,
        editingId,
        formData,
        formSaving,
        formError,
        formSuccess,
        loadData,
        startEdit,
        resetForm,
        updateFormField,
        saveQuiz,
        toggleArchive,
        visibleQuizzes,
        getSubjectsForQuiz,
        getRoleTitle,
    };
}
