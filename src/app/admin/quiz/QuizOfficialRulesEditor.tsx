import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/types/database";

type QuizRow = Database["public"]["Tables"]["quizzes"]["Row"];
type SubjectRow = Database["public"]["Tables"]["subjects"]["Row"];
type QuizSubjectRuleRow = Database["public"]["Tables"]["quiz_subject_rules"]["Row"];

interface Props {
    quiz: QuizRow;
    onClose: () => void;
    onUpdate: () => void;
}

export default function QuizOfficialRulesEditor({ quiz, onClose, onUpdate }: Props) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Global Rules Form
    const [timeLimit, setTimeLimit] = useState(quiz.time_limit || 60);
    const [pointsCorrect, setPointsCorrect] = useState(quiz.points_correct || 1);
    const [pointsWrong, setPointsWrong] = useState(quiz.points_wrong || -0.25);
    const [pointsBlank, setPointsBlank] = useState(quiz.points_blank || 0);
    const [isOfficial, setIsOfficial] = useState(quiz.is_official || false);

    // Subject Rules
    const [subjects, setSubjects] = useState<SubjectRow[]>([]);
    const [rules, setRules] = useState<{ subject_id: string; question_count: number; id?: string }[]>([]);

    // Stats for validation
    const [subjectStats, setSubjectStats] = useState<Record<string, number>>({});

    useEffect(() => {
        loadData();
    }, [quiz.id]);

    const loadData = async () => {
        setLoading(true);
        try {
            // 1. Load all subjects for this quiz (or all subjects if global? Usually subjects are linked to quiz or category)
            // Assuming subjects are linked to the quiz or generic. 
            // Existing schema suggests `subjects` table has `quiz_id`.
            const { data: subjectsData } = await supabase
                .from("subjects")
                .select("*")
                .eq("quiz_id", quiz.id)
                .eq("is_archived", false);

            setSubjects(subjectsData || []);

            // 2. Load existing rules
            const { data: rulesData } = await supabase
                .from("quiz_subject_rules")
                .select("*")
                .eq("quiz_id", quiz.id);

            if (rulesData) {
                setRules(rulesData.map(r => ({
                    id: r.id,
                    subject_id: r.subject_id,
                    question_count: r.question_count
                })));
            }

            // 3. Load Stats (Question counts per subject)
            // This is expensive if many questions. Optimized:
            // We can't do count group by simply in client without RPC or iterating.
            // For now, iterate if not huge.
            if (subjectsData) {
                const stats: Record<string, number> = {};
                for (const sub of subjectsData) {
                    const { count } = await supabase
                        .from("questions")
                        .select("id", { count: 'exact', head: true })
                        .eq("subject_id", sub.id)
                        .eq("is_archived", false);
                    stats[sub.id] = count || 0;
                }
                setSubjectStats(stats);
            }

        } catch (err) {
            console.error(err);
            alert("Errore nel caricamento dati");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveGlobal = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from("quizzes")
                .update({
                    time_limit: timeLimit,
                    points_correct: pointsCorrect,
                    points_wrong: pointsWrong,
                    points_blank: pointsBlank,
                    is_official: isOfficial,
                })
                .eq("id", quiz.id);

            if (error) throw error;
            alert("Impostazioni globali salvate!");
            onUpdate();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleAddRule = (subjectId: string) => {
        if (rules.find(r => r.subject_id === subjectId)) return;
        setRules([...rules, { subject_id: subjectId, question_count: 10 }]);
    };

    const handleRemoveRule = async (index: number) => {
        const rule = rules[index];
        if (rule.id) {
            // Delete from DB immediately or wait? 
            // Better to do instant delete for list items to avoid sync issues, or separate save.
            // Let's do separate save logic to keep it consistent, but for now just UI remove + allow save all.
            // Actually simpler: UI state -> Save All button for rules.
        }
        const newRules = [...rules];
        newRules.splice(index, 1);
        setRules(newRules);
    };

    const handleUpdateRuleCount = (index: number, count: number) => {
        const newRules = [...rules];
        newRules[index].question_count = count;
        setRules(newRules);
    };

    const handleSaveRules = async () => {
        setSaving(true);
        try {
            // 1. Delete all existing rules for this quiz (simplest sync strategy)
            // Or smart diff? Delete all is safer for consistency if traffic low.
            // Wait, deleting destroys IDs. If other things link to rules, bad.
            // But nothing links to rules yet.

            // Better: Upsert by (quiz_id, subject_id) if constraint exists.
            // Let's try to delete removed ones and upsert current ones.

            // 1. Get current DB IDs
            const { data: currentDB } = await supabase.from("quiz_subject_rules").select("id").eq("quiz_id", quiz.id);
            const currentDBIds = currentDB?.map(x => x.id) || [];
            const activeIds = rules.map(r => r.id).filter(Boolean);
            const toDelete = currentDBIds.filter(id => !activeIds.includes(id));

            if (toDelete.length > 0) {
                await supabase.from("quiz_subject_rules").delete().in("id", toDelete);
            }

            // 2. Upsert
            for (const rule of rules) {
                const payload = {
                    quiz_id: quiz.id,
                    subject_id: rule.subject_id,
                    question_count: rule.question_count
                };
                // If valid number
                if (rule.question_count < 0) continue;

                if (rule.id) {
                    await supabase.from("quiz_subject_rules").update(payload).eq("id", rule.id);
                } else {
                    await supabase.from("quiz_subject_rules").insert(payload);
                }
            }

            alert("Regole materie salvate!");
            loadData(); // Reload to get new IDs
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    const availableSubjects = subjects.filter(s => !rules.find(r => r.subject_id === s.id));

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl flex flex-col">

                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-white">Regole Simulazione Ufficiale</h2>
                        <p className="text-sm text-slate-400">{quiz.title}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white pb-1">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {loading ? (
                    <div className="p-10 text-center text-slate-400">Caricamento...</div>
                ) : (
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">

                        {/* LEFT: Global Settings */}
                        <div className="space-y-6">
                            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
                                <h3 className="text-emerald-400 font-bold mb-4 flex items-center gap-2">
                                    <span>⚙️</span> Impostazioni Globali
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-slate-400 text-xs mb-1">Durata (minuti)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                                            value={timeLimit}
                                            onChange={e => setTimeLimit(Number(e.target.value))}
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="block text-slate-400 text-xs mb-1">Punti Esatti</label>
                                            <input type="number" step="0.1" className="bg-slate-900 border border-slate-700 text-white w-full p-2 rounded" value={pointsCorrect} onChange={e => setPointsCorrect(Number(e.target.value))} />
                                        </div>
                                        <div>
                                            <label className="block text-slate-400 text-xs mb-1">Punti Errati</label>
                                            <input type="number" step="0.1" className="bg-slate-900 border border-slate-700 text-white w-full p-2 rounded" value={pointsWrong} onChange={e => setPointsWrong(Number(e.target.value))} />
                                        </div>
                                        <div>
                                            <label className="block text-slate-400 text-xs mb-1">Punti Vuoti</label>
                                            <input type="number" step="0.1" className="bg-slate-900 border border-slate-700 text-white w-full p-2 rounded" value={pointsBlank} onChange={e => setPointsBlank(Number(e.target.value))} />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 pt-2">
                                        <input
                                            type="checkbox"
                                            id="isOfficial"
                                            className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                                            checked={isOfficial}
                                            onChange={e => setIsOfficial(e.target.checked)}
                                        />
                                        <label htmlFor="isOfficial" className="text-white text-sm cursor-pointer select-none">
                                            Abilita "Simulazione Ufficiale" per gli studenti
                                        </label>
                                    </div>

                                    <button
                                        onClick={handleSaveGlobal}
                                        disabled={saving}
                                        className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded transition-colors"
                                    >
                                        Salva Globali
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Subject Rules */}
                        <div className="space-y-6">
                            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 h-full flex flex-col">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-purple-400 font-bold flex items-center gap-2">
                                        <span>📚</span> Materie e Domande
                                    </h3>

                                    {/* Add Subject Dropdown */}
                                    {availableSubjects.length > 0 && (
                                        <div className="flex gap-2">
                                            <select
                                                className="bg-slate-900 text-slate-300 text-xs p-2 rounded border border-slate-700 max-w-[150px]"
                                                onChange={(e) => {
                                                    if (e.target.value) {
                                                        handleAddRule(e.target.value);
                                                        e.target.value = "";
                                                    }
                                                }}
                                            >
                                                <option value="">+ Aggiungi materia</option>
                                                {availableSubjects.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-3 min-h-[300px]">
                                    {rules.length === 0 ? (
                                        <p className="text-slate-500 text-center italic mt-10">Nessuna materia configurata.</p>
                                    ) : (
                                        rules.map((rule, idx) => {
                                            const subjectName = subjects.find(s => s.id === rule.subject_id)?.name || "Unknown";
                                            const available = subjectStats[rule.subject_id] || 0;
                                            const isError = rule.question_count > available;

                                            return (
                                                <div key={rule.subject_id} className="bg-slate-900 p-3 rounded border border-slate-800 flex items-center justify-between gap-3">
                                                    <div className="flex-1">
                                                        <p className="font-bold text-slate-200 text-sm">{subjectName}</p>
                                                        <p className="text-[10px] text-slate-500">Disponibili: {available}</p>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <div className="flex flex-col items-end">
                                                            <input
                                                                type="number"
                                                                className={`w-16 bg-slate-950 border ${isError ? 'border-rose-500 text-rose-500' : 'border-slate-700 text-white'} rounded p-1 text-center text-sm`}
                                                                value={rule.question_count}
                                                                onChange={e => handleUpdateRuleCount(idx, parseInt(e.target.value) || 0)}
                                                            />
                                                            {isError && <span className="text-[10px] text-rose-500 font-bold">Max {available}!</span>}
                                                        </div>

                                                        <button
                                                            onClick={() => handleRemoveRule(idx)}
                                                            className="text-slate-500 hover:text-rose-400 p-1"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>

                                <div className="pt-4 border-t border-slate-800 mt-4">
                                    <div className="flex justify-between items-center text-xs text-slate-400 mb-4">
                                        <span>Totale domade: <b className="text-white">{rules.reduce((a, b) => a + b.question_count, 0)}</b></span>
                                    </div>
                                    <button
                                        onClick={handleSaveRules}
                                        disabled={saving || rules.some(r => r.question_count > (subjectStats[r.subject_id] || 0))}
                                        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Salva Regole Materie
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}
