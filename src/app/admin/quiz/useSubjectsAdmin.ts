import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/types/database';

// ================== TYPES ==================

type SubjectRow = Database['public']['Tables']['subjects']['Row'];
type QuizRow = Database['public']['Tables']['quizzes']['Row'];

export interface SubjectFormData {
    quizId: string;
    name: string;
    code: string;
    description: string;
    isArchived: boolean;
}

const INITIAL_FORM_DATA: SubjectFormData = {
    quizId: '',
    name: '',
    code: '',
    description: '',
    isArchived: false,
};

// ================== HOOK ==================

export function useSubjectsAdmin() {
    const [searchParams, setSearchParams] = useSearchParams();

    // Data
    const [subjects, setSubjects] = useState<SubjectRow[]>([]);
    const [quizzes, setQuizzes] = useState<QuizRow[]>([]);

    // UI State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showArchived, setShowArchived] = useState(false);

    // Filters
    // We synchronize the filter with the URL query param 'quiz'
    const filterQuizId = searchParams.get('quiz') || '';

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<SubjectFormData>(INITIAL_FORM_DATA);
    const [formSaving, setFormSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);

    // Load Data
    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [sRes, qRes] = await Promise.all([
                supabase.from('subjects').select('*').order('name'),
                supabase.from('quizzes').select('*').order('title'),
            ]);

            if (sRes.error) throw sRes.error;
            if (qRes.error) throw qRes.error;

            setSubjects(sRes.data || []);
            setQuizzes(qRes.data || []);
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

    const setFilterQuizId = (id: string) => {
        if (id) {
            setSearchParams({ quiz: id });
        } else {
            setSearchParams({});
        }
    };

    // Filter Logic
    const visibleSubjects = subjects.filter(s => {
        // Filter by Quiz
        if (filterQuizId && s.quiz_id !== filterQuizId) return false;

        // Filter by Archive
        if (!showArchived && s.is_archived) return false;

        return true;
    });

    // Form Actions
    const startCreate = () => {
        setEditingId(null);
        setFormData({
            ...INITIAL_FORM_DATA,
            quizId: filterQuizId || (quizzes.length > 0 ? quizzes[0].id : ''),
        });
        setFormError(null);
        setFormSuccess(null);
    };

    const startEdit = (subject: SubjectRow) => {
        setEditingId(subject.id);
        setFormData({
            quizId: subject.quiz_id,
            name: subject.name,
            code: subject.code || '',
            description: subject.description || '',
            isArchived: subject.is_archived || false,
        });
        setFormError(null);
        setFormSuccess(null);
    };

    const updateFormField = <K extends keyof SubjectFormData>(field: K, value: SubjectFormData[K]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setFormError(null);
    };

    const saveSubject = async () => {
        setFormSaving(true);
        setFormError(null);
        setFormSuccess(null);

        try {
            if (!formData.name.trim()) throw new Error("Il nome della materia è obbligatorio.");
            if (!formData.quizId) throw new Error("Seleziona un concorso di appartenenza.");

            const payload = {
                quiz_id: formData.quizId,
                name: formData.name.trim(),
                code: formData.code.trim() || null,
                description: formData.description.trim() || null,
                is_archived: formData.isArchived,
            };

            if (editingId) {
                const { error } = await supabase.from('subjects').update(payload).eq('id', editingId);
                if (error) throw error;
                setFormSuccess("Materia aggiornata ✅");
            } else {
                const { error } = await supabase.from('subjects').insert(payload);
                if (error) throw error;
                setFormSuccess("Materia creata ✅");
            }

            await loadData();
            if (!editingId) {
                // Keep the modal open or reset? Usually reset if creating new.
                // Let's reset but keep the quizId selected
                setFormData(prev => ({
                    ...INITIAL_FORM_DATA,
                    quizId: prev.quizId,
                }));
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Errore salvataggio';
            console.error("Save Error:", err);
            setFormError(msg);
        } finally {
            setFormSaving(false);
        }
    };

    const toggleArchive = async (subject: SubjectRow) => {
        try {
            const { error } = await supabase
                .from('subjects')
                .update({ is_archived: !subject.is_archived })
                .eq('id', subject.id);

            if (error) throw error;
            // Optimistic update or reload
            await loadData();
        } catch (err: unknown) {
            console.error(err);
            alert("Errore aggiornamento stato.");
        }
    };

    // Helpers
    const getQuizTitle = (quizId: string) => {
        const q = quizzes.find(x => x.id === quizId);
        return q ? q.title : '???';
    };

    return {
        // Data
        visibleSubjects,
        quizzes,
        loading,
        error,

        // Filters
        filterQuizId,
        setFilterQuizId,
        showArchived,
        setShowArchived,

        // Form
        editingId,
        formData,
        formSaving,
        formError,
        formSuccess,

        // Actions
        startCreate,
        startEdit,
        updateFormField,
        saveSubject,
        toggleArchive,
        getQuizTitle,
    };
}
