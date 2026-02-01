import React, { useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/types/database";

type QuizRow = Database["public"]["Tables"]["quizzes"]["Row"];
type SubjectRow = Database["public"]["Tables"]["subjects"]["Row"];

type JoinedSubject = SubjectRow & {
    quiz_title?: string;
};

interface SubjectManagerProps {
    quizzes: QuizRow[];
    subjects: JoinedSubject[];
    onSave: (subjectData: any, isEdit: boolean, id?: string) => Promise<void>;
    onArchive: (id: string, archive: boolean) => Promise<void>;
}

export default function SubjectManager({
    quizzes,
    subjects,
    onSave,
    onArchive
}: SubjectManagerProps) {
    // Local Filter State
    const [subjectQuizId, setSubjectQuizId] = useState<string>("");
    const [showArchivedSubjects, setShowArchivedSubjects] = useState(false);

    // Form State
    const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
    const [subjectName, setSubjectName] = useState("");
    const [subjectCode, setSubjectCode] = useState("");
    const [subjectDescription, setSubjectDescription] = useState("");
    const [subjectIsArchived, setSubjectIsArchived] = useState(false);
    const [subjectSaving, setSubjectSaving] = useState(false);
    const [subjectFormError, setSubjectFormError] = useState<string | null>(null);
    const [subjectFormSuccess, setSubjectFormSuccess] = useState<string | null>(null);

    // Initialize default filter
    React.useEffect(() => {
        if (quizzes.length > 0 && !subjectQuizId) {
            // Default to first active quiz
            const firstActive = quizzes.find((q) => !q.is_archived);
            setSubjectQuizId(firstActive ? firstActive.id : quizzes[0].id);
        }
    }, [quizzes, subjectQuizId]);

    const handleEditSubject = (subj: JoinedSubject) => {
        setEditingSubjectId(subj.id);
        setSubjectQuizId(subj.quiz_id || ""); // Switch filter to this subject's quiz
        setSubjectName(subj.name || "");
        setSubjectCode(subj.code || "");
        setSubjectDescription(subj.description || "");
        setSubjectIsArchived(!!subj.is_archived);
        setSubjectFormError(null);
        setSubjectFormSuccess(null);
        document.getElementById("subject-form")?.scrollIntoView({ behavior: "smooth" });
    };

    const resetSubjectForm = () => {
        setEditingSubjectId(null);
        setSubjectName("");
        setSubjectCode("");
        setSubjectDescription("");
        setSubjectIsArchived(false);
        setSubjectFormError(null);
        setSubjectFormSuccess(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubjectSaving(true);
        setSubjectFormError(null);
        setSubjectFormSuccess(null);

        try {
            if (!subjectName.trim()) throw new Error("Nome materia obbligatorio.");
            if (!subjectQuizId) throw new Error("Devi selezionare un concorso.");

            const payload = {
                quiz_id: subjectQuizId,
                name: subjectName.trim(),
                code: subjectCode.trim() || null,
                description: subjectDescription.trim() || null,
                is_archived: subjectIsArchived
            };

            await onSave(payload, !!editingSubjectId, editingSubjectId || undefined);

            setSubjectFormSuccess(editingSubjectId ? "Materia aggiornata ✅" : "Materia creata ✅");
            resetSubjectForm();
        } catch (err: any) {
            setSubjectFormError(err.message);
        } finally {
            setSubjectSaving(false);
        }
    };

    // Computed
    const filteredSubjects = useMemo(() => {
        let list = subjects.map(s => {
            const q = quizzes.find(q => q.id === s.quiz_id);
            return { ...s, quiz_title: q ? q.title : "N/A" };
        });

        if (subjectQuizId) list = list.filter(s => s.quiz_id === subjectQuizId);

        if (!showArchivedSubjects) list = list.filter(s => !s.is_archived);
        else list = list.filter(s => s.is_archived);

        return list;
    }, [subjects, quizzes, subjectQuizId, showArchivedSubjects]);

    return (
        <section id="subject-form" className="bg-[var(--card)] border border-[var(--card-border)] rounded-[24px] p-8 shadow-sm transition-colors">
            <h2 className="text-lg font-black text-[var(--foreground)] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center text-sm border border-amber-500/20">📚</span>
                Gestione Materie
                <span className="text-xs font-medium text-[var(--foreground)] opacity-40 bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded-full border border-slate-200 dark:border-slate-800 self-center mt-0.5">(Create qui, poi configurate nel Concorso)</span>
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
                {/* SUBJECT FORM */}
                <div className="md:col-span-1">
                    <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 sticky top-4">
                        <h3 className="text-sm font-bold text-[var(--foreground)] opacity-80 mb-4">{editingSubjectId ? "Modifica Materia" : "Nuova Materia"}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-[var(--foreground)] opacity-40 mb-1.5">Concorso Afferenza *</label>
                                <select className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-[var(--foreground)] focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan outline-none font-medium" value={subjectQuizId} onChange={e => setSubjectQuizId(e.target.value)}>
                                    {quizzes.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block font-bold text-[var(--foreground)] opacity-40 mb-1.5">Nome Materia *</label>
                                <input required className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-[var(--foreground)] focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan outline-none font-medium placeholder:text-[var(--foreground)] placeholder:opacity-40" value={subjectName} onChange={e => setSubjectName(e.target.value)} placeholder="es. Diritto Costituzionale" />
                            </div>
                            <div>
                                <label className="block font-bold text-[var(--foreground)] opacity-40 mb-1.5">Codice (opz)</label>
                                <input className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-[var(--foreground)] focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan outline-none font-mono text-xs" value={subjectCode} onChange={e => setSubjectCode(e.target.value)} placeholder="DIR-COST" />
                            </div>
                            <div>
                                <label className="block font-bold text-[var(--foreground)] opacity-40 mb-1.5">Descrizione</label>
                                <textarea className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-[var(--foreground)] focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan outline-none h-20" value={subjectDescription} onChange={e => setSubjectDescription(e.target.value)} />
                            </div>

                            <div className="flex gap-3 pt-2">
                                {editingSubjectId && <button type="button" onClick={resetSubjectForm} className="bg-slate-900 border border-slate-700 text-slate-500 font-bold px-4 py-2.5 rounded-xl flex-1 hover:bg-slate-800 hover:text-slate-300 transition-colors">Annulla</button>}
                                <button type="submit" disabled={subjectSaving} className="bg-brand-cyan hover:bg-brand-cyan/90 text-slate-900 px-4 py-2.5 rounded-xl font-bold flex-1 shadow-soft hover:shadow-md transition-all">
                                    {subjectSaving ? "..." : (editingSubjectId ? "Aggiorna" : "Crea")}
                                </button>
                            </div>
                            <div className="min-h-[20px]">
                                {subjectFormError && <p className="text-rose-400 font-bold">{subjectFormError}</p>}
                                {subjectFormSuccess && <p className="text-emerald-400 font-bold">{subjectFormSuccess}</p>}
                            </div>
                        </form>
                    </div>
                </div>

                {/* SUBJECT LIST */}
                <div className="md:col-span-2">
                    <div className="flex justify-between items-end mb-4">
                        <h3 className="text-sm font-bold text-[var(--foreground)] opacity-40 uppercase tracking-wider">
                            Elenco Materie
                            <span className="text-[10px] text-[var(--foreground)] opacity-30 ml-2 font-normal normal-case break-all block sm:inline">
                                per: <strong className="text-[var(--foreground)] opacity-50">{quizzes.find(q => q.id === subjectQuizId)?.title || "..."}</strong>
                            </span>
                        </h3>

                        {/* Filter Tabs */}
                        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-[10px] font-bold">
                            <button
                                onClick={() => setShowArchivedSubjects(false)}
                                className={`px-3 py-1.5 rounded-lg transition-all ${!showArchivedSubjects ? "bg-white dark:bg-slate-800 text-[var(--foreground)] shadow-sm" : "text-[var(--foreground)] opacity-40 hover:opacity-100"}`}
                            >
                                Attive
                            </button>
                            <button
                                onClick={() => setShowArchivedSubjects(true)}
                                className={`px-3 py-1.5 rounded-lg transition-all ${showArchivedSubjects ? "bg-white dark:bg-slate-800 text-[var(--foreground)] shadow-sm" : "text-[var(--foreground)] opacity-40 hover:opacity-100"}`}
                            >
                                Archiviate
                            </button>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden min-h-[300px] shadow-sm">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50/50 dark:bg-slate-950 text-[var(--foreground)] opacity-40 border-b border-[var(--card-border)]">
                                <tr>
                                    <th className="p-4 font-bold uppercase tracking-widest text-[10px]">Nome / Codice</th>
                                    <th className="p-4 font-bold uppercase tracking-widest text-[10px]">Descrizione</th>
                                    <th className="p-4 font-bold uppercase tracking-widest text-[10px] text-right">Stato</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--card-border)]">
                                {filteredSubjects.length === 0 && (
                                    <tr><td colSpan={3} className="p-12 text-center text-slate-500">
                                        {showArchivedSubjects ? "Nessuna materia archiviata." : "Nessuna materia attiva per questo concorso."}
                                    </td></tr>
                                )}
                                {filteredSubjects.map(s => (
                                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="p-4">
                                            <div className="font-bold text-[var(--foreground)] opacity-80 text-sm">{s.name}</div>
                                            {s.code && <div className="text-[10px] text-[var(--foreground)] opacity-40 font-mono bg-slate-100 dark:bg-slate-950 inline-block px-1 rounded mt-1 border border-slate-200 dark:border-slate-800">{s.code}</div>}
                                        </td>
                                        <td className="p-4 text-[var(--foreground)] opacity-40 truncate max-w-[200px]">{s.description || "-"}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEditSubject(s)} className="text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 px-3 py-1.5 rounded-lg font-bold transition-all">Edit</button>

                                                {s.is_archived ? (
                                                    <button onClick={() => onArchive(s.id, false)} className="text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all">
                                                        <span>⟲</span> Ripristina
                                                    </button>
                                                ) : (
                                                    <button onClick={() => onArchive(s.id, true)} className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all">
                                                        <span>×</span> Archivia
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    );
}
