import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AdminLayout,
    AdminPageHeader,
    AdminTable,
    StatusBadge,
    EmptyState,
    ConfirmDialog,
} from '@/components/admin';
import { useQuizAdmin } from './useQuizAdmin';
import QuizFormModal from './QuizFormModal';

// ================== MAIN COMPONENT ==================

export default function AdminQuizzesPage() {
    const navigate = useNavigate();
    const {
        visibleQuizzes,
        subjects,
        roles,
        loading,
        error,
        showArchived,
        setShowArchived,
        editingId,
        formData,
        formSaving,
        formError,
        formSuccess,
        startEdit,
        resetForm,
        updateFormField,
        saveQuiz,
        toggleArchive,
        getRoleTitle,
        getSubjectsForQuiz,
    } = useQuizAdmin();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; quiz: typeof visibleQuizzes[0] | null }>({
        open: false,
        quiz: null,
    });

    const handleCreate = () => {
        resetForm();
        setIsFormOpen(true);
    };

    const handleEdit = (quiz: typeof visibleQuizzes[0]) => {
        startEdit(quiz);
        setIsFormOpen(true);
    };

    const handleSave = async () => {
        await saveQuiz();
        if (!formError) {
            setIsFormOpen(false);
        }
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        resetForm();
    };

    // Table columns
    const columns = [
        {
            key: 'title',
            label: 'Titolo',
            render: (quiz: typeof visibleQuizzes[0]) => (
                <div>
                    <div className="font-medium text-white">{quiz.title}</div>
                    {quiz.year && (
                        <div className="text-xs text-slate-500">Anno {quiz.year}</div>
                    )}
                </div>
            ),
        },
        {
            key: 'role',
            label: 'Ruolo',
            width: '150px',
            render: (quiz: typeof visibleQuizzes[0]) => {
                const q = quiz as typeof quiz & { role_id?: string };
                return <span className="text-slate-400">{getRoleTitle(q.role_id || null)}</span>;
            },
        },
        {
            key: 'subjects',
            label: 'Materie',
            width: '80px',
            align: 'center' as const,
            render: (quiz: typeof visibleQuizzes[0]) => {
                const count = getSubjectsForQuiz(quiz.id).length;
                return (
                    <span className="text-slate-400">
                        {count}
                    </span>
                );
            },
        },
        {
            key: 'questions',
            label: 'Domande',
            width: '80px',
            align: 'center' as const,
            render: (quiz: typeof visibleQuizzes[0]) => (
                <span className="text-slate-400">
                    {quiz.total_questions || 0}
                </span>
            ),
        },
        {
            key: 'status',
            label: 'Stato',
            width: '100px',
            render: (quiz: typeof visibleQuizzes[0]) => (
                <StatusBadge
                    label={quiz.is_archived ? 'Archiviato' : 'Attivo'}
                    variant={quiz.is_archived ? 'warning' : 'success'}
                />
            ),
        },
    ];

    const rowActions = (quiz: typeof visibleQuizzes[0]) => [
        {
            label: 'Modifica',
            icon: '✏️',
            onClick: () => handleEdit(quiz),
        },
        {
            label: 'Gestisci Materie',
            icon: '📚',
            onClick: () => navigate(`/admin/quiz/materie?quiz=${quiz.id}`),
        },
        {
            label: 'Regole Simulazione',
            icon: '⚙️',
            onClick: () => navigate(`/admin/rules?quiz=${quiz.id}`),
        },
        {
            label: quiz.is_archived ? 'Ripristina' : 'Archivia',
            icon: quiz.is_archived ? '📤' : '📁',
            onClick: () => toggleArchive(quiz),
        },
    ];

    return (
        <AdminLayout>
            <AdminPageHeader
                title="Concorsi"
                subtitle="Gestisci i concorsi e le loro configurazioni"
                action={{
                    label: 'Nuovo Concorso',
                    icon: '+',
                    onClick: handleCreate,
                }}
            />

            {/* Filters */}
            <div className="mb-4 flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showArchived}
                        onChange={(e) => setShowArchived(e.target.checked)}
                        className="rounded bg-slate-800 border-slate-600"
                    />
                    Mostra archiviati
                </label>
                <div className="text-sm text-slate-500">
                    {visibleQuizzes.length} concors{visibleQuizzes.length === 1 ? 'o' : 'i'}
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400">
                    {error}
                </div>
            )}

            {/* Table */}
            <AdminTable
                columns={columns}
                data={visibleQuizzes}
                loading={loading}
                rowKey={(quiz) => quiz.id}
                onRowClick={handleEdit}
                rowActions={rowActions}
                emptyState={
                    <EmptyState
                        icon="🏆"
                        title="Nessun concorso"
                        description={showArchived
                            ? "Non ci sono concorsi archiviati."
                            : "Non hai ancora creato nessun concorso."
                        }
                        action={!showArchived ? {
                            label: 'Crea il primo concorso',
                            onClick: handleCreate,
                        } : undefined}
                    />
                }
            />

            {/* Form Modal */}
            {isFormOpen && (
                <QuizFormModal
                    isOpen={isFormOpen}
                    onClose={handleCloseForm}
                    editingId={editingId}
                    formData={formData}
                    formSaving={formSaving}
                    formError={formError}
                    formSuccess={formSuccess}
                    roles={roles}
                    subjects={subjects}
                    updateFormField={updateFormField}
                    onSave={handleSave}
                />
            )}

            {/* Delete Confirmation */}
            <ConfirmDialog
                open={deleteConfirm.open}
                onClose={() => setDeleteConfirm({ open: false, quiz: null })}
                title="Archiviare questo concorso?"
                description={`Il concorso "${deleteConfirm.quiz?.title}" verrà archiviato.`}
                confirmLabel="Archivia"
                onConfirm={() => {
                    if (deleteConfirm.quiz) {
                        toggleArchive(deleteConfirm.quiz);
                    }
                }}
            />
        </AdminLayout>
    );
}
