import React from 'react';
import type { SubjectFormData } from './useSubjectsAdmin';
import { X, BookOpen, Archive, CheckCircle2, Loader2 } from 'lucide-react';

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

    // Input styling
    const inputClass = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B1FF]/30 focus:border-[#00B1FF] transition-all";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-[20px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-violet-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                {editingId ? 'Modifica Materia' : 'Nuova Materia'}
                            </h2>
                            <p className="text-sm text-slate-500">
                                {editingId ? 'Modifica i dettagli della materia' : 'Aggiungi una nuova materia al concorso'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-[#F5F5F7]">

                    {/* Quiz Selector */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Concorso di appartenenza *
                        </label>
                        <select
                            value={formData.quizId}
                            onChange={(e) => updateFormField('quizId', e.target.value)}
                            className={inputClass}
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
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Nome Materia *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => updateFormField('name', e.target.value)}
                            placeholder="Es. Diritto Costituzionale"
                            className={inputClass}
                            required
                        />
                    </div>

                    {/* Code */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Codice (opzionale)
                        </label>
                        <input
                            type="text"
                            value={formData.code}
                            onChange={(e) => updateFormField('code', e.target.value)}
                            placeholder="Es. MAT-01"
                            className={inputClass}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Descrizione
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => updateFormField('description', e.target.value)}
                            rows={3}
                            placeholder="Descrizione opzionale della materia..."
                            className={`${inputClass} resize-none`}
                        />
                    </div>

                    {/* Archive */}
                    <div className="bg-white rounded-xl p-4 border border-slate-100">
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                            <div className="relative flex items-center">
                                <input
                                    type="checkbox"
                                    id="isArchived"
                                    checked={formData.isArchived}
                                    onChange={(e) => updateFormField('isArchived', e.target.checked)}
                                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 transition-all checked:border-orange-500 checked:bg-orange-500"
                                />
                                <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                                    <Archive className="w-3 h-3" />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Archive className="w-4 h-4 text-orange-500" />
                                <span className="text-sm font-medium text-slate-700">
                                    Archivia materia (nascondi dagli elenchi)
                                </span>
                            </div>
                        </label>
                    </div>

                    {/* Feedback */}
                    {formError && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                <X className="w-4 h-4 text-red-500" />
                            </div>
                            {formError}
                        </div>
                    )}
                    {formSuccess && (
                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 text-sm flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            </div>
                            {formSuccess}
                        </div>
                    )}
                </form>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={formSaving}
                        className="px-5 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium rounded-xl transition-colors disabled:opacity-50"
                    >
                        Chiudi
                    </button>
                    <button
                        type="button"
                        onClick={onSave}
                        disabled={formSaving}
                        className="px-6 py-2.5 bg-[#00B1FF] hover:bg-[#00a0e6] text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {formSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Salvataggio...
                            </>
                        ) : editingId ? 'Salva Modifiche' : 'Crea Materia'}
                    </button>
                </div>
            </div>
        </div>
    );
}
