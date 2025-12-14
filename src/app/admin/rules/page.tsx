import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/types/database";
import { AdminLayout, AdminPageHeader } from "@/components/admin";
import { Settings, Clock, HelpCircle, CheckCircle2, XCircle, MinusCircle, BookOpen, Plus, Trash2, Save, Loader2, ArrowLeft, AlertCircle } from "lucide-react";

type QuizRow = Database["public"]["Tables"]["quizzes"]["Row"];
type SubjectRow = Database["public"]["Tables"]["subjects"]["Row"];

export default function AdminRulesPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const quizId = searchParams.get("quiz");

    const [quiz, setQuiz] = useState<QuizRow | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Global Rules
    const [timeLimit, setTimeLimit] = useState(60);
    const [pointsCorrect, setPointsCorrect] = useState(1);
    const [pointsWrong, setPointsWrong] = useState(-0.25);
    const [pointsBlank, setPointsBlank] = useState(0);
    const [isOfficial, setIsOfficial] = useState(false);

    // Subject Rules
    const [subjects, setSubjects] = useState<SubjectRow[]>([]);
    const [rules, setRules] = useState<{ subject_id: string; question_count: number; id?: string }[]>([]);
    const [subjectStats, setSubjectStats] = useState<Record<string, number>>({});

    useEffect(() => {
        if (quizId) loadData();
        else setLoading(false);
    }, [quizId]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load quiz
            const { data: quizData, error: quizError } = await supabase
                .from("quizzes")
                .select("*")
                .eq("id", quizId)
                .single();

            if (quizError || !quizData) {
                alert("Quiz non trovato");
                navigate("/admin/quiz");
                return;
            }

            setQuiz(quizData);
            setTimeLimit(quizData.time_limit || 60);
            setPointsCorrect(quizData.points_correct ?? 1);
            setPointsWrong(quizData.points_wrong ?? -0.25);
            setPointsBlank(quizData.points_blank ?? 0);
            setIsOfficial(quizData.is_official || false);

            // Load subjects
            const { data: subjectsData } = await supabase
                .from("subjects")
                .select("*")
                .eq("quiz_id", quizId)
                .eq("is_archived", false);

            setSubjects(subjectsData || []);

            // Load existing rules
            const { data: rulesData } = await supabase
                .from("quiz_subject_rules")
                .select("*")
                .eq("quiz_id", quizId);

            if (rulesData) {
                setRules(rulesData.map(r => ({
                    id: r.id,
                    subject_id: r.subject_id,
                    question_count: r.question_count
                })));
            }

            // Load stats
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
        } finally {
            setLoading(false);
        }
    };

    const handleSaveGlobal = async () => {
        if (!quizId) return;
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
                .eq("id", quizId);

            if (error) throw error;
            alert("Impostazioni salvate!");
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

    const handleRemoveRule = (index: number) => {
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
        if (!quizId) return;
        setSaving(true);
        try {
            const { data: currentDB } = await supabase.from("quiz_subject_rules").select("id").eq("quiz_id", quizId);
            const currentDBIds = currentDB?.map(x => x.id) || [];
            const activeIds = rules.map(r => r.id).filter(Boolean);
            const toDelete = currentDBIds.filter(id => !activeIds.includes(id));

            if (toDelete.length > 0) {
                await supabase.from("quiz_subject_rules").delete().in("id", toDelete);
            }

            for (const rule of rules) {
                const payload = {
                    quiz_id: quizId,
                    subject_id: rule.subject_id,
                    question_count: rule.question_count
                };
                if (rule.question_count < 0) continue;

                if (rule.id) {
                    await supabase.from("quiz_subject_rules").update(payload).eq("id", rule.id);
                } else {
                    await supabase.from("quiz_subject_rules").insert(payload);
                }
            }

            alert("Regole materie salvate!");
            loadData();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    const availableSubjects = subjects.filter(s => !rules.find(r => r.subject_id === s.id));
    const inputClass = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B1FF]/30 focus:border-[#00B1FF] transition-all";

    // No quiz selected
    if (!quizId) {
        return (
            <AdminLayout>
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
                        <AlertCircle className="w-8 h-8 text-amber-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Nessun concorso selezionato</h2>
                    <p className="text-slate-500 mb-6">Seleziona un concorso dalla lista per configurare le regole.</p>
                    <button
                        onClick={() => navigate("/admin/quiz")}
                        className="px-6 py-3 bg-[#00B1FF] hover:bg-[#00a0e6] text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Vai ai Concorsi
                    </button>
                </div>
            </AdminLayout>
        );
    }

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-[#00B1FF] animate-spin" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <AdminPageHeader
                title={`Regole: ${quiz?.title || 'Caricamento...'}`}
                subtitle="Configura tempo, punteggi e distribuzione domande per materia"
                breadcrumb={[
                    { label: 'Quiz', path: '/admin/quiz' },
                    { label: 'Regole Simulazione' }
                ]}
            />

            <div className="grid md:grid-cols-2 gap-6">
                {/* LEFT: Global Settings */}
                <div className="bg-white rounded-[20px] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <Settings className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">Impostazioni Globali</h3>
                            <p className="text-sm text-slate-500">Tempo e punteggi</p>
                        </div>
                    </div>

                    <div className="p-6 space-y-6 bg-[#F5F5F7]">
                        {/* Time */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-slate-400" />
                                Durata (minuti)
                            </label>
                            <input
                                type="number"
                                className={inputClass}
                                value={timeLimit}
                                onChange={e => setTimeLimit(Number(e.target.value))}
                            />
                        </div>

                        {/* Points */}
                        <div className="bg-white rounded-2xl p-5 border border-slate-100">
                            <h4 className="text-sm font-bold text-slate-700 mb-4">Punteggi</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-emerald-600 mb-1.5 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" /> Esatta
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-emerald-200 bg-emerald-50 text-emerald-700 font-bold text-center focus:outline-none focus:border-emerald-400 transition-all"
                                        value={pointsCorrect}
                                        onChange={e => setPointsCorrect(Number(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-red-600 mb-1.5 flex items-center gap-1">
                                        <XCircle className="w-3 h-3" /> Errata
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-red-200 bg-red-50 text-red-700 font-bold text-center focus:outline-none focus:border-red-400 transition-all"
                                        value={pointsWrong}
                                        onChange={e => setPointsWrong(Number(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1">
                                        <MinusCircle className="w-3 h-3" /> Vuota
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-700 font-bold text-center focus:outline-none focus:border-slate-400 transition-all"
                                        value={pointsBlank}
                                        onChange={e => setPointsBlank(Number(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Official Checkbox */}
                        <div className="bg-white rounded-xl p-4 border border-slate-100">
                            <label className="flex items-center gap-3 cursor-pointer select-none">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={isOfficial}
                                        onChange={e => setIsOfficial(e.target.checked)}
                                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 transition-all checked:border-emerald-500 checked:bg-emerald-500"
                                    />
                                    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                                        <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none">
                                            <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>
                                <span className="text-sm font-medium text-slate-700">Simulazione Ufficiale</span>
                            </label>
                        </div>

                        <button
                            onClick={handleSaveGlobal}
                            disabled={saving}
                            className="w-full py-3 bg-[#00B1FF] hover:bg-[#00a0e6] text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Salva Impostazioni
                        </button>
                    </div>
                </div>

                {/* RIGHT: Subject Distribution */}
                <div className="bg-white rounded-[20px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-violet-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">Distribuzione Materie</h3>
                                <p className="text-sm text-slate-500">Domande per materia</p>
                            </div>
                        </div>
                        <div className="px-3 py-1.5 rounded-full bg-[#00B1FF]/10 text-[#00B1FF] font-bold text-sm">
                            {rules.reduce((a, b) => a + b.question_count, 0)} totali
                        </div>
                    </div>

                    <div className="p-6 flex-1 space-y-4 bg-[#F5F5F7] overflow-y-auto max-h-[400px]">
                        {/* Add subject dropdown */}
                        {availableSubjects.length > 0 && (
                            <div className="flex gap-2">
                                <select
                                    className={`${inputClass} flex-1`}
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            handleAddRule(e.target.value);
                                            e.target.value = "";
                                        }
                                    }}
                                >
                                    <option value="">+ Aggiungi materia...</option>
                                    {availableSubjects.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Rules list */}
                        {rules.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
                                <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <p className="text-slate-400 text-sm">Nessuna materia configurata</p>
                            </div>
                        ) : (
                            rules.map((rule, idx) => {
                                const subjectName = subjects.find(s => s.id === rule.subject_id)?.name || "Unknown";
                                const available = subjectStats[rule.subject_id] || 0;
                                const isError = rule.question_count > available;

                                return (
                                    <div key={rule.subject_id} className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between gap-4 group">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-900 truncate">{subjectName}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                Disponibili: <span className="font-medium text-slate-600">{available}</span>
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col items-end">
                                                <input
                                                    type="number"
                                                    className={`w-20 px-3 py-2 rounded-lg border-2 text-center font-bold focus:outline-none transition-all ${isError
                                                        ? 'border-red-300 bg-red-50 text-red-600'
                                                        : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-[#00B1FF]'
                                                        }`}
                                                    value={rule.question_count}
                                                    onChange={e => handleUpdateRuleCount(idx, parseInt(e.target.value) || 0)}
                                                />
                                                {isError && <span className="text-[10px] text-red-500 font-bold mt-1">Max {available}!</span>}
                                            </div>

                                            <button
                                                onClick={() => handleRemoveRule(idx)}
                                                className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Save rules button */}
                    <div className="p-6 border-t border-slate-100 bg-white">
                        <button
                            onClick={handleSaveRules}
                            disabled={saving || rules.some(r => r.question_count > (subjectStats[r.subject_id] || 0))}
                            className="w-full py-3 bg-violet-500 hover:bg-violet-600 text-white font-bold rounded-xl shadow-lg shadow-violet-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Salva Regole Materie
                        </button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
