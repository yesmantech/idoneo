import React from 'react';
import type { SubjectFormData } from './useSubjectsAdmin';

// ================== TYPES ==================

interface SubjectFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingId: string | null;
    formData: SubjectFormData;
    formSaving: boolean;
    formError: string | null;
    formSuccess: string | null;
    quizzes: { id: string; title: string, is_archived: boolean }[];
    updateFormField: <K extends keyof SubjectFormData>(field: K, value: SubjectFormData[K]) => void;
    onSave: () => void;
}

// ================== COMPONENT ==================

export default function SubjectFormModal({
    isOpen,
    onClose,
    editingId,
    formData,
    formSaving,
    formError,
    formSuccess,
    quizzes,
    updateFormField,
    onSave,
}: SubjectFormModalProps) {
    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave();
    };

    // Filter active quizzes for dropdown unless the currently selected one is archived
    const quizOptions = quizzes.filter(q => !q.is_archived || q.id === formData.quizId);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
                    <h2 className="text-lg font-bold text-white">
                        {editingId ? 'Modifica Materia' : 'Nuova Materia'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white text-xl"
                    >
                        ×
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    {/* Quiz Selector */}
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">
                            Concorso di appartenenza *
                        </label>
                        <select
                            value={formData.quizId}
                            onChange={(e) => updateFormField('quizId', e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            required
                        >
                            <option value="" disabled>Seleziona un concorso...</option>
                            {quizOptions.map(q => (
                                <option key={q.id} value={q.id}>
                                    {q.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">
                            Nome Materia *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => updateFormField('name', e.target.value)}
                            placeholder="Es. Diritto Costituzionale"
                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            required
                        />
                    </div>

                    {/* Code */}
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">
                            Codice (opzionale)
                        </label>
                        <input
                            type="text"
                            value={formData.code}
                            onChange={(e) => updateFormField('code', e.target.value)}
                            placeholder="Es. MAT-01"
                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">
                            Descrizione
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => updateFormField('description', e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                        />
                    </div>

                    {/* Archive */}
                    <div className="flex items-center gap-3 pt-2">
                        <input
                            type="checkbox"
                            id="isArchived"
                            checked={formData.isArchived}
                            onChange={(e) => updateFormField('isArchived', e.target.checked)}
                            className="rounded bg-slate-700 border-slate-600 w-4 h-4 text-emerald-500 focus:ring-emerald-500"
                        />
                        <label htmlFor="isArchived" className="text-sm font-medium text-slate-300 cursor-pointer select-none">
                            Archivia materia (nascondi dagli elenchi)
                        </label>
                    </div>

                    {/* Feedback */}
                    {formError && (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm">
                            ❌ {formError}
                        </div>
                    )}
                    {formSuccess && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm">
                            {formSuccess}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="pt-2 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={formSaving}
                            className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                            Chiudi
                        </button>
                        <button
                            type="submit"
                            disabled={formSaving}
                            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
                        >
                            {formSaving ? 'Salvataggio...' : editingId ? 'Salva Modifiche' : 'Crea Materia'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
