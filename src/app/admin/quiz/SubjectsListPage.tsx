import React, { useState } from 'react';
import {
    AdminLayout,
    AdminPageHeader,
    AdminTable,
    StatusBadge,
    EmptyState,
    ConfirmDialog
} from '@/components/admin';
import { useSubjectsAdmin } from './useSubjectsAdmin';
import SubjectFormModal from './SubjectFormModal';

export default function SubjectsListPage() {
    const {
        visibleSubjects,
        quizzes,
        loading,
        error,
        filterQuizId,
        setFilterQuizId,
        showArchived,
        setShowArchived,
        editingId,
        formData,
        formSaving,
        formError,
        formSuccess,
        startCreate,
        startEdit,
        updateFormField,
        saveSubject,
        toggleArchive,
        getQuizTitle,
    } = useSubjectsAdmin();

    const [isFormOpen, setIsFormOpen] = useState(false);

    // Create
    const handleCreate = () => {
        startCreate();
        setIsFormOpen(true);
    };

    // Edit
    const handleEdit = (subject: typeof visibleSubjects[0]) => {
        startEdit(subject);
        setIsFormOpen(true);
    };

    // Save
    const handleSave = async () => {
        await saveSubject();
        if (!formError) {
            setIsFormOpen(false);
        }
    };

    // Columns
    const columns = [
        {
            key: 'name',
            label: 'Materia',
            render: (s: typeof visibleSubjects[0]) => (
                <div>
                    <div className="font-medium text-white">{s.name}</div>
                    {s.code && <div className="text-xs text-slate-500 font-mono">{s.code}</div>}
                </div>
            )
        },
        {
            key: 'quiz',
            label: 'Concorso',
            render: (s: typeof visibleSubjects[0]) => (
                <span className="text-slate-400 text-sm">
                    {getQuizTitle(s.quiz_id)}
                </span>
            )
        },
        {
            key: 'status',
            label: 'Stato',
            width: '100px',
            render: (s: typeof visibleSubjects[0]) => (
                <StatusBadge
                    label={s.is_archived ? 'Archiviato' : 'Attivo'}
                    variant={s.is_archived ? 'warning' : 'success'}
                />
            )
        }
    ];

    // Row Actions
    const rowActions = (s: typeof visibleSubjects[0]) => [
        {
            label: 'Modifica',
            icon: '✏️',
            onClick: () => handleEdit(s),
        },
        {
            label: s.is_archived ? 'Ripristina' : 'Archivia',
            icon: s.is_archived ? '📤' : '📁',
            onClick: () => toggleArchive(s),
        }
    ];

    return (
        <AdminLayout>
            <AdminPageHeader
                title="Materie"
                subtitle="Gestisci le materie di studio suddivise per concorso"
                breadcrumb={[
                    { label: 'Quiz', path: '/admin/quiz' },
                    { label: 'Materie' }
                ]}
                action={{
                    label: 'Nuova Materia',
                    icon: '+',
                    onClick: handleCreate
                }}
            />

            {/* Filters Toolbar */}
            <div className="mb-6 p-4 bg-slate-900/50 border border-slate-800 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between">

                {/* Quiz Filter */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <label className="text-sm font-medium text-slate-400 whitespace-nowrap">
                        Filtra per concorso:
                    </label>
                    <select
                        value={filterQuizId}
                        onChange={(e) => setFilterQuizId(e.target.value)}
                        className="bg-slate-950 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none min-w-[200px]"
                    >
                        <option value="">Tutti i concorsi</option>
                        {quizzes.map(q => (
                            <option key={q.id} value={q.id}>
                                {q.title}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Archive Filter */}
                <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showArchived}
                        onChange={(e) => setShowArchived(e.target.checked)}
                        className="rounded bg-slate-800 border-slate-600 text-emerald-500 focus:ring-emerald-500"
                    />
                    Mostra archiviati
                </label>
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
                data={visibleSubjects}
                loading={loading}
                rowKey={s => s.id}
                onRowClick={handleEdit}
                rowActions={rowActions}
                emptyState={
                    <EmptyState
                        icon="📚"
                        title="Nessuna materia trovata"
                        description={filterQuizId
                            ? "Questo concorso non ha ancora materie associate."
                            : "Non hai ancora creato nessuna materia."
                        }
                        action={{
                            label: 'Crea Materia',
                            onClick: handleCreate
                        }}
                    />
                }
            />

            {/* Form Modal */}
            <SubjectFormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                editingId={editingId}
                formData={formData}
                formSaving={formSaving}
                formError={formError}
                formSuccess={formSuccess}
                quizzes={quizzes}
                updateFormField={updateFormField}
                onSave={handleSave}
            />
        </AdminLayout>
    );
}
