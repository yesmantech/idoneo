import React from "react";
import type { Database } from "@/types/database";

type QuizRow = Database["public"]["Tables"]["quizzes"]["Row"];
type RoleRow = { id: string; title: string; category_id: string; slug: string };

interface QuizListProps {
    quizzes: QuizRow[];
    roles: RoleRow[];
    showArchived: boolean;
    onToggleShowArchived: (value: boolean) => void;
    onEditQuiz: (quiz: QuizRow) => void;
    onEditRules: (quiz: QuizRow) => void;
    onToggleArchive: (quiz: QuizRow) => void;
}

export default function QuizList({
    quizzes,
    roles,
    showArchived,
    onToggleShowArchived,
    onEditQuiz,
    onEditRules,
    onToggleArchive
}: QuizListProps) {

    // Logic moved from parent
    const visibleQuizzes = React.useMemo(() => {
        if (showArchived) return quizzes;
        return quizzes.filter(q => !q.is_archived);
    }, [quizzes, showArchived]);

    return (
        <section className="mb-12">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-bold text-[var(--foreground)] opacity-40 uppercase tracking-wider">ELENCO CONCORSI</h2>
                <label className="flex gap-2 text-xs cursor-pointer text-[var(--foreground)] opacity-50 hover:opacity-100 font-medium bg-[var(--card)] px-3 py-1.5 rounded-full border border-[var(--card-border)] shadow-sm transition-all hover:bg-slate-100 dark:hover:bg-slate-800">
                    <input
                        type="checkbox"
                        className="rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-brand-cyan focus:ring-brand-cyan"
                        checked={showArchived}
                        onChange={e => onToggleShowArchived(e.target.checked)}
                    />
                    Mostra archiviati
                </label>
            </div>
            <div className="overflow-x-auto rounded-[24px] border border-[var(--card-border)] bg-[var(--card)] shadow-sm transition-colors">
                {visibleQuizzes.length === 0 && (
                    <div className="p-12 text-center">
                        <p className="text-slate-500 mb-2 text-2xl">📭</p>
                        <p className="text-sm text-slate-500 font-medium">Nessun concorso trovato.</p>
                    </div>
                )}
                {visibleQuizzes.length > 0 && (
                    <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50/50 dark:bg-slate-950 text-[var(--foreground)] opacity-40 font-bold border-b border-[var(--card-border)] uppercase tracking-widest text-[10px]">
                            <tr>
                                <th className="px-6 py-4">Titolo</th>
                                <th className="px-6 py-4">Ruolo</th>
                                <th className="px-6 py-4">Impostazioni</th>
                                <th className="px-6 py-4 text-right">Azioni</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--card-border)]">
                            {visibleQuizzes.map(q => {
                                const anyQ = q as any;
                                const roleName = roles.find(r => r.id === anyQ.role_id)?.title || "-";
                                const isArchived = q.is_archived;
                                return (
                                    <tr key={q.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group ${isArchived ? "bg-slate-50/50 dark:bg-slate-900/50 grayscale opacity-40" : ""}`}>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-[var(--foreground)] opacity-80 text-sm mb-0.5">{q.title}</div>
                                            <div className="text-[10px] text-[var(--foreground)] opacity-40 font-mono bg-slate-100 dark:bg-slate-950 inline-block px-1.5 rounded border border-slate-200 dark:border-slate-800">{anyQ.slug}</div>
                                        </td>
                                        <td className="px-6 py-4 text-[var(--foreground)] opacity-50 font-medium">{roleName}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2 text-[10px] font-bold">
                                                <span className="bg-purple-500/10 text-purple-400 px-2 py-1 rounded-md border border-purple-500/20">{q.time_limit || 0} min</span>
                                                <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md border border-emerald-500/20">{q.total_questions || 0} quest</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => onEditRules(q)} className="text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all">Regole Sim.</button>
                                                <button onClick={() => onEditQuiz(q)} className="text-brand-cyan hover:text-cyan-300 bg-brand-cyan/10 hover:bg-brand-cyan/20 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all">Gestisci</button>
                                                <button onClick={() => onToggleArchive(q)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${q.is_archived ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"}`}>
                                                    {q.is_archived ? "Attiva" : "Archivia"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </section>
    );
}
