import React from 'react';
import type { QuizFormData } from './useQuizAdmin';
import type { Database } from '@/types/database';
import { X, FileText, Clock, Trophy, CheckCircle2, BookOpen, Archive, Loader2 } from 'lucide-react';

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
    categories: { id: string; title: string }[];
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
    categories,
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

    // Input class for consistent styling
    const inputClass = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B1FF]/30 focus:border-[#00B1FF] transition-all";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-[20px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">
                            {editingId ? 'Modifica Concorso' : 'Nuovo Concorso'}
                        </h2>
                        <p className="text-sm text-slate-500 mt-0.5">
                            {editingId ? 'Modifica le informazioni del concorso' : 'Crea un nuovo concorso per gli utenti'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F5F5F7]">

                    {/* Basic Info Section */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center">
                                <FileText className="w-4 h-4 text-sky-500" />
                            </div>
                            <h3 className="font-bold text-slate-900">Informazioni Base</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Titolo *
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => updateFormField('title', e.target.value)}
                                    placeholder="Es. Concorso Carabinieri 2024"
                                    className={inputClass}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Slug URL
                                </label>
                                <input
                                    type="text"
                                    value={formData.slug}
                                    onChange={(e) => updateFormField('slug', e.target.value)}
                                    placeholder="auto-generato"
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Anno
                                </label>
                                <input
                                    type="number"
                                    value={formData.year}
                                    onChange={(e) => updateFormField('year', e.target.value)}
                                    placeholder="2024"
                                    className={inputClass}
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Ruolo / Categoria
                                </label>
                                <select
                                    value={formData.categoryId}
                                    onChange={(e) => updateFormField('categoryId', e.target.value)}
                                    className={inputClass}
                                    required
                                >
                                    <option value="">Seleziona categoria...</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Descrizione
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => updateFormField('description', e.target.value)}
                                    placeholder="Descrizione opzionale..."
                                    rows={3}
                                    className={`${inputClass} resize-none`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Simulation Settings Section */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
                                <Clock className="w-4 h-4 text-violet-500" />
                            </div>
                            <h3 className="font-bold text-slate-900">Configurazione Simulazione</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Tempo Limite (minuti)
                                </label>
                                <input
                                    type="number"
                                    value={formData.timeLimit}
                                    onChange={(e) => updateFormField('timeLimit', e.target.value)}
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Punti Risposta Corretta
                                </label>
                                <input
                                    type="text"
                                    value={formData.pointsCorrect}
                                    onChange={(e) => updateFormField('pointsCorrect', e.target.value)}
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Punti Risposta Errata
                                </label>
                                <input
                                    type="text"
                                    value={formData.pointsWrong}
                                    onChange={(e) => updateFormField('pointsWrong', e.target.value)}
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Punti Non Risposta
                                </label>
                                <input
                                    type="text"
                                    value={formData.pointsBlank}
                                    onChange={(e) => updateFormField('pointsBlank', e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Pass/Fail Criteria Section */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                                <Trophy className="w-4 h-4 text-emerald-500" />
                            </div>
                            <h3 className="font-bold text-slate-900">Criteri di Superamento</h3>
                        </div>

                        <label className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors">
                            <div className="relative flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.useCustomPassThreshold}
                                    onChange={(e) => updateFormField('useCustomPassThreshold', e.target.checked)}
                                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 transition-all checked:border-[#00B1FF] checked:bg-[#00B1FF]"
                                />
                                <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                                    <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none">
                                        <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="font-semibold text-slate-900">Abilita Soglia di Superamento</div>
                                <div className="text-sm text-slate-500">
                                    Se attivo, il sistema calcolerà se l'utente è "Idoneo" o "Non Idoneo"
                                </div>
                            </div>
                        </label>

                        {formData.useCustomPassThreshold && (
                            <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Minimo Risposte Corrette
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.minCorrectForPass}
                                    onChange={(e) => updateFormField('minCorrectForPass', e.target.value)}
                                    placeholder="Es. 18"
                                    className={inputClass}
                                />
                                <p className="text-xs text-slate-400 mt-1.5">
                                    Numero minimo di risposte esatte per ottenere l'idoneità.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Subject Distribution (Only if editing and has subjects) */}
                    {editingId && quizSubjects.length > 0 && (
                        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                                        <BookOpen className="w-4 h-4 text-amber-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">Distribuzione Domande</h3>
                                        <p className="text-xs text-slate-500">Definisci quante domande estrarre per materia</p>
                                    </div>
                                </div>
                                <div className="px-3 py-1 rounded-full bg-[#00B1FF]/10 text-[#00B1FF] font-bold text-sm">
                                    {Object.values(formData.subjectCounts).reduce((a, b) => a + b, 0)} totali
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-100/50 text-slate-500 font-medium text-xs uppercase tracking-wider">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Materia</th>
                                            <th className="px-4 py-3 w-32 text-center">N. Domande</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {quizSubjects.map(subject => (
                                            <tr key={subject.id} className="hover:bg-slate-50/50">
                                                <td className="px-4 py-3 text-slate-900 font-medium">
                                                    {subject.name}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={formData.subjectCounts[subject.id] || 0}
                                                        onChange={(e) => handleSubjectCountChange(subject.id, e.target.value)}
                                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-center text-slate-900 focus:ring-2 focus:ring-[#00B1FF]/30 focus:border-[#00B1FF] outline-none transition-all"
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
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                        <label className="flex items-center gap-4 cursor-pointer">
                            <div className="relative flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.isArchived}
                                    onChange={(e) => updateFormField('isArchived', e.target.checked)}
                                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 transition-all checked:border-orange-500 checked:bg-orange-500"
                                />
                                <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                                    <Archive className="w-3 h-3" />
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                                    <Archive className="w-4 h-4 text-orange-500" />
                                </div>
                                <div>
                                    <div className="font-semibold text-slate-900">Archivia Concorso</div>
                                    <div className="text-sm text-slate-500">
                                        I concorsi archiviati non sono visibili agli utenti
                                    </div>
                                </div>
                            </div>
                        </label>
                    </div>

                    {/* Error/Success Messages */}
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
                        Annulla
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
                        ) : editingId ? 'Salva Modifiche' : 'Crea Concorso'}
                    </button>
                </div>
            </div>
        </div>
    );
}
