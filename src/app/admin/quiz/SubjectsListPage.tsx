import React, { useState } from 'react';
import {
    AdminLayout,
    AdminPageHeader,
    AdminTable,
    StatusBadge,
    EmptyState,
} from '@/components/admin';
import { useSubjectsAdmin } from './useSubjectsAdmin';
import SubjectFormModal from './SubjectFormModal';
import { BookOpen, Filter, ChevronDown } from 'lucide-react';

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
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-violet-500" />
                    </div>
                    <div>
                        <div className="font-semibold text-slate-900">{s.name}</div>
                        {s.code && <div className="text-xs text-slate-400 font-mono">{s.code}</div>}
                    </div>
                </div>
            )
        },
        {
            key: 'quiz',
            label: 'Concorso',
            render: (s: typeof visibleSubjects[0]) => (
                <span className="text-slate-600 text-sm font-medium">
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

            {/* Filters Toolbar - Light Theme */}
            <div className="mb-6 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">

                {/* Quiz Filter */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                        <Filter className="w-4 h-4" />
                        <span>Concorso:</span>
                    </div>
                    <div className="relative">
                        <select
                            value={filterQuizId}
                            onChange={(e) => setFilterQuizId(e.target.value)}
                            className="appearance-none bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 pr-10 focus:ring-2 focus:ring-[#00B1FF]/30 focus:border-[#00B1FF] outline-none min-w-[220px] font-medium transition-all"
                        >
                            <option value="">Tutti i concorsi</option>
                            {quizzes.map(q => (
                                <option key={q.id} value={q.id}>
                                    {q.title}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {/* Stats + Archive Filter */}
                <div className="flex items-center gap-6">
                    <div className="text-sm text-slate-500">
                        <span className="font-bold text-slate-900">{visibleSubjects.length}</span> materi{visibleSubjects.length === 1 ? 'a' : 'e'}
                    </div>

                    <label className="flex items-center gap-2.5 text-sm text-slate-600 cursor-pointer select-none">
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                checked={showArchived}
                                onChange={(e) => setShowArchived(e.target.checked)}
                                className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 transition-all checked:border-[#00B1FF] checked:bg-[#00B1FF]"
                            />
                            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                                <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none">
                                    <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>
                        Mostra archiviati
                    </label>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                    ❌ {error}
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
