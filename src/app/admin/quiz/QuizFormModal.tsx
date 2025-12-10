import React from 'react';
import type { QuizFormData } from './useQuizAdmin';
import type { Database } from '@/types/database';

type SubjectRow = Database['public']['Tables']['subjects']['Row'];

// ================== TYPES ==================

interface QuizFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingId: string | null;
    formData: QuizFormData;
    formSaving: boolean;
    formError: string | null;
    formSuccess: string | null;
    roles: { id: string; title: string }[];
    subjects: SubjectRow[];
    updateFormField: <K extends keyof QuizFormData>(field: K, value: QuizFormData[K]) => void;
    onSave: () => void;
}

// ================== COMPONENT ==================

export default function QuizFormModal({
    isOpen,
    onClose,
    editingId,
    formData,
    formSaving,
    formError,
    formSuccess,
    roles,
    subjects,
    updateFormField,
    onSave,
}: QuizFormModalProps) {
    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave();
    };

    // Filter subjects for this quiz
    const quizSubjects = React.useMemo(() => {
        if (!editingId) return [];
        return subjects.filter(s => s.quiz_id === editingId && !s.is_archived);
    }, [subjects, editingId]);

    const handleSubjectCountChange = (subjectId: string, value: string) => {
        const count = parseInt(value) || 0;
        updateFormField('subjectCounts', {
            ...formData.subjectCounts,
            [subjectId]: count
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">
                        {editingId ? 'Modifica Concorso' : 'Nuovo Concorso'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white text-xl"
                    >
                        ×
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                            Informazioni Base
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm text-slate-400 mb-1">
                                    Titolo *
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => updateFormField('title', e.target.value)}
                                    placeholder="Es. Concorso Carabinieri 2024"
                                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-1">
                                    Slug URL
                                </label>
                                <input
                                    type="text"
                                    value={formData.slug}
                                    onChange={(e) => updateFormField('slug', e.target.value)}
                                    placeholder="auto-generato"
                                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-1">
                                    Anno
                                </label>
                                <input
                                    type="number"
                                    value={formData.year}
                                    onChange={(e) => updateFormField('year', e.target.value)}
                                    placeholder="2024"
                                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm text-slate-400 mb-1">
                                    Ruolo / Categoria
                                </label>
                                <select
                                    value={formData.roleId}
                                    onChange={(e) => updateFormField('roleId', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="">Nessun ruolo</option>
                                    {roles.map(role => (
                                        <option key={role.id} value={role.id}>
                                            {role.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm text-slate-400 mb-1">
                                    Descrizione
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => updateFormField('description', e.target.value)}
                                    placeholder="Descrizione opzionale..."
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Simulation Settings */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                            Configurazione Simulazione
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">
                                    Tempo Limite (minuti)
                                </label>
                                <input
                                    type="number"
                                    value={formData.timeLimit}
                                    onChange={(e) => updateFormField('timeLimit', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-1">
                                    Punti Risposta Corretta
                                </label>
                                <input
                                    type="text"
                                    value={formData.pointsCorrect}
                                    onChange={(e) => updateFormField('pointsCorrect', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-1">
                                    Punti Risposta Errata
                                </label>
                                <input
                                    type="text"
                                    value={formData.pointsWrong}
                                    onChange={(e) => updateFormField('pointsWrong', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-1">
                                    Punti Non Risposta
                                </label>
                                <input
                                    type="text"
                                    value={formData.pointsBlank}
                                    onChange={(e) => updateFormField('pointsBlank', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Pass/Fail Criteria */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                            Criteri di Superamento (Idoneità)
                        </h3>

                        <label className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.useCustomPassThreshold}
                                onChange={(e) => updateFormField('useCustomPassThreshold', e.target.checked)}
                                className="rounded bg-slate-700 border-slate-600 focus:ring-emerald-500 text-emerald-600"
                            />
                            <div className="flex-1">
                                <div className="font-medium text-white">Abilita Soglia di Superamento</div>
                                <div className="text-sm text-slate-400">
                                    Se attivo, il sistema calcolerà se l'utente è "Idoneo" o "Non Idoneo"
                                </div>
                            </div>
                        </label>

                        {formData.useCustomPassThreshold && (
                            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">
                                        Minimo Risposte Corrette
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.minCorrectForPass}
                                        onChange={(e) => updateFormField('minCorrectForPass', e.target.value)}
                                        placeholder="Es. 18"
                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        Numero minimo di risposte esatte per ottenere l'idoneità.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Subject Distribution (Only if editing and has subjects) */}
                    {editingId && quizSubjects.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                                <span>Distribuzione Domande ({Object.values(formData.subjectCounts).reduce((a, b) => a + b, 0)})</span>
                                <span className="text-xs text-slate-500 font-normal normal-case">
                                    Definisci quante domande estrarre per materia
                                </span>
                            </h3>

                            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-900/50 text-slate-400 font-medium">
                                        <tr>
                                            <th className="px-4 py-2">Materia</th>
                                            <th className="px-4 py-2 w-32 text-center">N. Domande</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/50">
                                        {quizSubjects.map(subject => (
                                            <tr key={subject.id} className="hover:bg-slate-700/30">
                                                <td className="px-4 py-2 text-slate-200">
                                                    {subject.name}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={formData.subjectCounts[subject.id] || 0}
                                                        onChange={(e) => handleSubjectCountChange(subject.id, e.target.value)}
                                                        className="w-full px-2 py-1 bg-slate-900 border border-slate-600 rounded text-center text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Archive Toggle */}
                    <div>
                        <label className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.isArchived}
                                onChange={(e) => updateFormField('isArchived', e.target.checked)}
                                className="rounded bg-slate-700 border-slate-600"
                            />
                            <div>
                                <div className="font-medium text-white">Archivia Concorso</div>
                                <div className="text-sm text-slate-400">
                                    I concorsi archiviati non sono visibili agli utenti
                                </div>
                            </div>
                        </label>
                    </div>

                    {/* Error/Success Messages */}
                    {formError && (
                        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400                       text-sm">
                            ❌ {formError}
                        </div>
                    )}
                    {formSuccess && (
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm">
                            {formSuccess}
                        </div>
                    )}
                </form>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={formSaving}
                        className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                        Annulla
                    </button>
                    <button
                        type="button"
                        onClick={onSave}
                        disabled={formSaving}
                        className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
                    >
                        {formSaving ? 'Salvataggio...' : editingId ? 'Salva Modifiche' : 'Crea Concorso'}
                    </button>
                </div>
            </div>
        </div>
    );
}
