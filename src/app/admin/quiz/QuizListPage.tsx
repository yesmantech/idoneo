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
        categories,
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
        getCategoryTitle,
        getSubjectsForQuiz,
        searchTerm,
        setSearchTerm,
        selectedCatId,
        setSelectedCatId,
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
                    <div className="font-medium text-[var(--foreground)]">{quiz.title}</div>
                    {quiz.year && (
                        <div className="text-xs text-slate-500">Anno {quiz.year}</div>
                    )}
                </div>
            ),
        },
        {
            key: 'category',
            label: 'Categoria',
            width: '150px',
            render: (quiz: typeof visibleQuizzes[0]) => {
                const q = quiz as typeof quiz & { category_id?: string };
                return <span className="text-slate-400">{getCategoryTitle(q.category_id || null)}</span>;
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
            <div className="mb-6 flex flex-col md:flex-row items-center gap-4">
                {/* Search Bar */}
                <div className="relative flex-1 w-full">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                    <input
                        type="text"
                        placeholder="Cerca concorso..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue transition-all"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Category Filter */}
                <select
                    value={selectedCatId || ""}
                    onChange={(e) => setSelectedCatId(e.target.value || null)}
                    className="w-full md:w-[220px] bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue transition-all appearance-none cursor-pointer"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23a1a1aa\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '14px' }}
                >
                    <option value="">Tutte le categorie</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.title}</option>
                    ))}
                </select>

                {/* Counter & Archive Toggle */}
                <div className="flex items-center gap-4 shrink-0 px-1">
                    <label className="flex items-center gap-2 text-xs text-slate-500 font-medium cursor-pointer hover:text-slate-700 transition-colors">
                        <input
                            type="checkbox"
                            checked={showArchived}
                            onChange={(e) => setShowArchived(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue/20"
                        />
                        Archiviati
                    </label>
                    <div className="h-4 w-px bg-slate-200" />
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                        {visibleQuizzes.length} RISULTATI
                    </div>
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
                    categories={categories}
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
