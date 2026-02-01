import React, { useState, useEffect } from "react";
import type { Database } from "@/types/database";

type QuizRow = Database["public"]["Tables"]["quizzes"]["Row"];
type RoleRow = { id: string; title: string; category_id: string; slug: string };
type RuleRow = Database["public"]["Tables"]["simulation_rules"]["Row"];
type SubjectRow = Database["public"]["Tables"]["subjects"]["Row"];
type CategoryRow = { id: string; title: string };

type JoinedSubject = SubjectRow & {
    quiz_title?: string;
};

interface QuizFormProps {
    initialData: QuizRow | null;
    roles: RoleRow[];
    categories: CategoryRow[];
    rules: RuleRow[];
    availableSubjects: JoinedSubject[];
    initialSubjectCounts: Record<string, number>;
    onSave: (quizData: any, subjectCounts: Record<string, number>, isEdit: boolean) => Promise<void>;
    onCancel: () => void;
}

export default function QuizForm({
    initialData,
    roles,
    categories,
    rules,
    availableSubjects,
    initialSubjectCounts,
    onSave,
    onCancel
}: QuizFormProps) {
    // Form State
    const [quizTitle, setQuizTitle] = useState("");
    const [quizSlug, setQuizSlug] = useState("");
    const [quizRoleId, setQuizRoleId] = useState("");
    const [selectedPresetId, setSelectedPresetId] = useState("");
    const [quizYear, setQuizYear] = useState("");
    const [quizDescription, setQuizDescription] = useState("");
    const [quizIsArchived, setQuizIsArchived] = useState(false);

    // Simulation Config
    const [quizTimeLimit, setQuizTimeLimit] = useState("60");
    const [quizPointsCorrect, setQuizPointsCorrect] = useState("1");
    const [quizPointsWrong, setQuizPointsWrong] = useState("-0.25");
    const [quizPointsBlank, setQuizPointsBlank] = useState("0");

    // Subject Counts
    const [subjectCounts, setSubjectCounts] = useState<Record<string, number>>({});

    // Status
    const [quizSaving, setQuizSaving] = useState(false);
    const [quizFormError, setQuizFormError] = useState<string | null>(null);
    const [quizFormSuccess, setQuizFormSuccess] = useState<string | null>(null);

    // Initialization (Reset when initialData changes)
    useEffect(() => {
        if (initialData) {
            setQuizTitle(initialData.title || "");
            setQuizSlug((initialData as any).slug || "");
            setQuizRoleId(initialData.role_id || "");
            setSelectedPresetId(""); // Reset preset
            setQuizYear(initialData.year !== null ? String(initialData.year) : "");
            setQuizDescription(initialData.description || "");
            setQuizIsArchived(!!initialData.is_archived);

            setQuizTimeLimit(initialData.time_limit !== null ? String(initialData.time_limit) : "60");
            setQuizPointsCorrect(initialData.points_correct !== null ? String(initialData.points_correct) : "1");
            setQuizPointsWrong(initialData.points_wrong !== null ? String(initialData.points_wrong) : "-0.25");
            setQuizPointsBlank(initialData.points_blank !== null ? String(initialData.points_blank) : "0");

            setSubjectCounts(initialSubjectCounts);
        } else {
            // Reset for "New Quiz"
            setQuizTitle("");
            setQuizSlug("");
            setQuizRoleId("");
            setSelectedPresetId("");
            setQuizYear("");
            setQuizDescription("");
            setQuizIsArchived(false);
            setQuizTimeLimit("60");
            setQuizPointsCorrect("1");
            setQuizPointsWrong("-0.25");
            setQuizPointsBlank("0");
            setSubjectCounts({});
        }
        setQuizFormError(null);
        setQuizFormSuccess(null);
    }, [initialData, initialSubjectCounts]);

    // Handlers
    const handleApplyPreset = (ruleId: string) => {
        const r = rules.find(rule => rule.id === ruleId);
        if (!r) return;
        setQuizTimeLimit(String(r.time_minutes));
        setQuizPointsCorrect(String(r.points_correct));
        setQuizPointsWrong(String(r.points_wrong));
        setQuizPointsBlank(String(r.points_blank));
        setSelectedPresetId(ruleId);
    };

    const parseIntOrNull = (value: string) => {
        const v = value.trim();
        if (!v) return null;
        const n = Number.parseInt(v, 10);
        return Number.isFinite(n) ? n : null;
    };

    const parseFloatOrNull = (value: string) => {
        const v = value.trim().replace(",", ".");
        if (!v) return null;
        const n = Number.parseFloat(v);
        return Number.isFinite(n) ? n : null;
    };

    const currentTotalQuestions = Object.values(subjectCounts).reduce((a: number, b: number) => a + b, 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setQuizSaving(true);
        setQuizFormError(null);
        setQuizFormSuccess(null);

        try {
            if (!quizTitle.trim()) throw new Error("Titolo obbligatorio.");

            const totalQuestions = currentTotalQuestions; // Recalculate based on current state

            const autoSlug = quizTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

            const payload = {
                title: quizTitle.trim(),
                slug: quizSlug.trim() || autoSlug,
                role_id: quizRoleId || null,
                description: quizDescription.trim() || null,
                year: parseIntOrNull(quizYear),
                time_limit: parseIntOrNull(quizTimeLimit),
                points_correct: parseFloatOrNull(quizPointsCorrect),
                points_wrong: parseFloatOrNull(quizPointsWrong),
                points_blank: parseFloatOrNull(quizPointsBlank),
                total_questions: totalQuestions,
                is_archived: quizIsArchived,
            };

            await onSave(payload, subjectCounts, !!initialData);

            if (initialData) {
                setQuizFormSuccess("Concorso e Regole aggiornati ✅");
            } else {
                setQuizFormSuccess("Concorso creato ✅");
                // Optional: reset form done by parent passing null initialData?
                // But for now, just success message
            }
        } catch (err: any) {
            console.error(err);
            setQuizFormError(err.message || "Errore salvataggio.");
        } finally {
            setQuizSaving(false);
        }
    };

    return (
        <section className="mb-8 rounded-[24px] border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-sm transition-colors">
            <div className="flex justify-between items-center mb-6 border-b border-[var(--card-border)] pb-4">
                <h2 className="text-xl font-black text-[var(--foreground)] tracking-tight flex items-center gap-2">
                    <span className="text-2xl">🏆</span>
                    {initialData ? "Modifica Concorso & Regole" : "Nuovo Concorso"}
                </h2>
                {initialData && (
                    <button
                        onClick={onCancel}
                        className="text-xs font-bold text-[var(--foreground)] opacity-50 hover:text-brand-cyan hover:opacity-100 hover:bg-brand-cyan/5 transition-all px-3 py-1.5 rounded-lg border border-transparent hover:border-brand-cyan/20"
                    >
                        + Crea Nuovo invece
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8 text-sm">
                {/* LEFT: INFO BASI */}
                <div className="space-y-5">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <span className="w-4 h-4 rounded bg-slate-800 text-slate-400 flex items-center justify-center text-[10px]">1</span>
                        Dettagli Generali
                    </h3>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="mb-1.5 block font-bold text-[var(--foreground)] opacity-40">Titolo *</label>
                            <input required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-[var(--foreground)] focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none transition-all placeholder:text-[var(--foreground)] placeholder:opacity-40 font-bold" value={quizTitle} onChange={e => setQuizTitle(e.target.value)} placeholder="Es. Allievo Maresciallo 2025" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-1.5 block font-bold text-[var(--foreground)] opacity-40">Ruolo</label>
                                <select
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-3 text-[var(--foreground)] focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none transition-all"
                                    value={quizRoleId}
                                    onChange={e => setQuizRoleId(e.target.value)}
                                >
                                    <option value="">Seleziona...</option>
                                    {roles.map(r => {
                                        const catName = categories.find(c => c.id === r.category_id)?.title || "...";
                                        return <option key={r.id} value={r.id}>{catName} &gt; {r.title}</option>
                                    })}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1.5 block font-bold text-[var(--foreground)] opacity-40">Anno</label>
                                <input className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-[var(--foreground)] focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none transition-all" value={quizYear} onChange={e => setQuizYear(e.target.value)} placeholder="YYYY" />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block font-bold text-[var(--foreground)] opacity-40">Slug URL</label>
                            <input className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-[var(--foreground)] opacity-50 font-mono text-xs focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none transition-all" value={quizSlug} onChange={e => setQuizSlug(e.target.value)} placeholder="slug-url-concorso" />
                        </div>

                        <div>
                            <label className="mb-1.5 block font-bold text-[var(--foreground)] opacity-40">Descrizione</label>
                            <textarea className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-[var(--foreground)] focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none transition-all h-24" value={quizDescription} onChange={e => setQuizDescription(e.target.value)} />
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <input type="checkbox" id="arch_q" className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-brand-cyan focus:ring-brand-cyan" checked={quizIsArchived} onChange={e => setQuizIsArchived(e.target.checked)} />
                            <label htmlFor="arch_q" className="text-[var(--foreground)] opacity-50 font-medium select-none cursor-pointer">Segna come Archiviato (Nascosto)</label>
                        </div>
                    </div>
                </div>

                {/* RIGHT: SIMULATION CONFIG */}
                <div className="space-y-5 md:border-l md:border-slate-800 md:pl-8">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <span className="w-4 h-4 rounded bg-purple-500/10 text-purple-400 flex items-center justify-center text-[10px] border border-purple-500/20">2</span>
                            Configurazione Simulazione
                        </h3>
                        <select
                            className="text-xs bg-purple-500/10 border border-purple-500/20 text-purple-300 font-bold rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                            value={selectedPresetId}
                            onChange={(e) => handleApplyPreset(e.target.value)}
                        >
                            <option value="">Applica Preset...</option>
                            {rules.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-purple-500/5 p-5 rounded-2xl border border-purple-500/10">
                        <div>
                            <label className="block text-[var(--foreground)] opacity-40 font-bold text-xs mb-1.5">Tempo (minuti)</label>
                            <div className="relative">
                                <input className="w-full bg-slate-50 dark:bg-slate-950 border border-purple-500/20 rounded-xl px-3 py-2 text-center font-mono font-bold text-[var(--foreground)] focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20" value={quizTimeLimit} onChange={e => setQuizTimeLimit(e.target.value)} />
                                <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[var(--foreground)] opacity-20 text-[10px] pointer-events-none">min</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[var(--foreground)] opacity-40 font-bold text-xs mb-1.5">Totale Domande</label>
                            <div className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-center font-mono font-bold text-[var(--foreground)] opacity-30 cursor-not-allowed flex items-center justify-center gap-1" title="Calcolato automaticamente">
                                <span>∑</span> {currentTotalQuestions}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div><label className="block text-[10px] font-bold text-emerald-500 uppercase mb-1">Punti Esatta</label><input className="w-full bg-slate-50 dark:bg-slate-950 border border-emerald-500/20 rounded-xl p-2.5 text-center text-emerald-500 font-bold focus:outline-none focus:border-emerald-500" value={quizPointsCorrect} onChange={e => setQuizPointsCorrect(e.target.value)} /></div>
                        <div><label className="block text-[10px] font-bold text-rose-500 uppercase mb-1">Punti Errata</label><input className="w-full bg-slate-50 dark:bg-slate-950 border border-rose-500/20 rounded-xl p-2.5 text-center text-rose-500 font-bold focus:outline-none focus:border-rose-500" value={quizPointsWrong} onChange={e => setQuizPointsWrong(e.target.value)} /></div>
                        <div><label className="block text-[10px] font-bold text-[var(--foreground)] opacity-30 uppercase mb-1">Punti Omessa</label><input className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-center text-[var(--foreground)] opacity-50 font-bold focus:outline-none focus:border-slate-500" value={quizPointsBlank} onChange={e => setQuizPointsBlank(e.target.value)} /></div>
                    </div>

                    <div className="mt-6">
                        <h4 className="text-xs font-bold text-[var(--foreground)] opacity-70 mb-3 flex items-center gap-2">
                            <span>📚</span> Distribuzione Materie
                        </h4>
                        {!initialData ? (
                            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-center">
                                <p className="text-xs text-slate-500">Salva il concorso prima di configurare le materie.</p>
                            </div>
                        ) : (
                            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto shadow-sm">
                                {availableSubjects.length === 0 && <p className="p-6 text-xs text-slate-500 text-center italic">Nessuna materia attiva associata.</p>}
                                <table className="w-full text-xs">
                                    <thead className="bg-slate-100 dark:bg-slate-950 text-[var(--foreground)] opacity-40 font-bold border-b border-[var(--card-border)]">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Materia</th>
                                            <th className="px-4 py-3 w-32 text-center"># Domande</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--card-border)]">
                                        {availableSubjects.map(s => (
                                            <tr key={s.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-4 py-3 text-[var(--foreground)] opacity-80 font-medium">{s.name}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <input
                                                        type="number"
                                                        className="w-20 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-center text-[var(--foreground)] font-bold focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                                                        value={subjectCounts[s.id] || 0}
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value) || 0;
                                                            setSubjectCounts(prev => ({ ...prev, [s.id]: val }));
                                                        }}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                </div>

                {/* ACTIONS */}
                <div className="md:col-span-2 border-t border-slate-800 pt-6 flex items-center justify-between">
                    <div className="text-sm">
                        {quizFormError && <p className="text-rose-400 font-bold flex items-center gap-2"><span>⚠️</span> {quizFormError}</p>}
                        {quizFormSuccess && <p className="text-emerald-400 font-bold flex items-center gap-2"><span>✅</span> {quizFormSuccess}</p>}
                    </div>
                    <button type="submit" disabled={quizSaving} className="rounded-full bg-brand-cyan hover:bg-brand-cyan/90 px-8 py-3 font-bold text-slate-900 shadow-[0_0_20px_rgba(6,214,211,0.3)] hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0">
                        {quizSaving ? "Salvataggio..." : "Salva Configurazione"}
                    </button>
                </div>
            </form>
        </section>
    );
}
