"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { fetchSmartQuestions, QuestionSelectionMode, SubjectConfig } from "@/lib/quiz-smart-selection";
import { ChevronLeft, ChevronDown, Minus, Plus, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Types
type Subject = { id: string; name: string; question_count: number };
type ScoringConfig = { correct: number; wrong: number; blank: number };

// Helper to normalize DB answers
function normalizeDBAnswer(val: string | null | undefined): string | null {
    if (!val) return null;
    return val.replace(/[.,:;()\[\]]/g, "").trim().toLowerCase();
}

// Robust accessor to find correct answer
function getCorrectOption(q: any): string | null {
    if (!q) return null;
    if (q.correct_option) return normalizeDBAnswer(q.correct_option);
    if (q.correct_answer) return normalizeDBAnswer(q.correct_answer);
    if (q.answer) return normalizeDBAnswer(q.answer);
    return null;
}

// =============================================================================
// CUSTOM QUIZ WIZARD PAGE - Idoneo Redesign
// =============================================================================
export default function CustomQuizWizardPage() {
    const { contestSlug } = useParams();
    const navigate = useNavigate();

    // --- State ---
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    // Data
    const [quizId, setQuizId] = useState<string | null>(null);
    const [subjects, setSubjects] = useState<Subject[]>([]);

    // Configuration
    const [subjectSelections, setSubjectSelections] = useState<Record<string, number>>({});
    const [selectionMode, setSelectionMode] = useState<QuestionSelectionMode>('random');

    // Time Config
    const [timeHours, setTimeHours] = useState(0);
    const [timeMinutes, setTimeMinutes] = useState(30);
    const [timeSeconds, setTimeSeconds] = useState(0);
    const [noTimeLimit, setNoTimeLimit] = useState(false);

    // Scoring Config
    const [scoring, setScoring] = useState<ScoringConfig>({ correct: 1, wrong: 0, blank: 0 });

    // --- Load Data ---
    useEffect(() => {
        const load = async () => {
            const { data: qData } = await supabase.from("quizzes").select("id").eq("slug", contestSlug).single();
            if (!qData) return;
            setQuizId(qData.id);

            const { data: sData } = await supabase.from("subjects").select("id, name").eq("quiz_id", qData.id).eq("is_archived", false);
            if (sData) {
                const enriched = await Promise.all(sData.map(async (s) => {
                    const { count } = await supabase.from("questions").select("*", { count: 'exact', head: true }).eq("subject_id", s.id).eq("is_archived", false);
                    return { ...s, question_count: count || 0 };
                }));
                enriched.sort((a, b) => a.name.localeCompare(b.name));
                setSubjects(enriched);
            }
            setLoading(false);
        };
        load();
    }, [contestSlug]);

    // --- Helpers ---
    const toggleSubject = (id: string, max: number) => {
        setSubjectSelections(prev => {
            const next = { ...prev };
            if (next[id] !== undefined) {
                delete next[id];
            } else {
                next[id] = Math.min(20, max);
            }
            return next;
        });
    };

    const updateSubjectCount = (id: string, val: number, max: number) => {
        const safeVal = Math.max(1, Math.min(val, max));
        setSubjectSelections(prev => ({ ...prev, [id]: safeVal }));
    };

    const toggleAllSubjects = () => {
        if (Object.keys(subjectSelections).length === subjects.length) {
            setSubjectSelections({});
        } else {
            const next: Record<string, number> = {};
            subjects.forEach(s => {
                next[s.id] = Math.min(20, s.question_count);
            });
            setSubjectSelections(next);
        }
    };

    const totalSelectedQuestions = useMemo(() => {
        return Object.values(subjectSelections).reduce((acc: number, c: number) => acc + c, 0);
    }, [subjectSelections]);

    // --- Action ---
    const handleStart = async () => {
        if (!quizId) return;
        if (totalSelectedQuestions <= 0) { alert("Seleziona almeno una domanda"); return; }

        setGenerating(true);
        try {
            const configs: SubjectConfig[] = Object.entries(subjectSelections).map(([sId, count]: [string, number]) => ({
                subjectId: sId,
                count
            }));

            const selection = await fetchSmartQuestions(
                (await supabase.auth.getUser()).data.user?.id || null,
                quizId,
                configs,
                selectionMode
            );

            console.log("[CustomQuiz] configs:", configs);
            console.log("[CustomQuiz] selection result:", selection.length);

            if (!selection || selection.length === 0) {
                throw new Error(`Nessuna domanda trovata. Configs: ${JSON.stringify(configs)}, Mode: ${selectionMode}`);
            }

            // Batch fetch for large selections (Supabase .in() has limits)
            const BATCH_SIZE = 500;
            const questionIds = selection.map(s => s.questionId);
            let fullQuestions: any[] = [];

            for (let i = 0; i < questionIds.length; i += BATCH_SIZE) {
                const batchIds = questionIds.slice(i, i + BATCH_SIZE);
                const { data: batchData, error: batchError } = await supabase
                    .from("questions")
                    .select("*, subject:subjects(name)")
                    .in("id", batchIds);

                if (batchError) {
                    console.error("[CustomQuiz] Batch fetch error:", batchError);
                    throw new Error(`Errore nel recupero domande: ${batchError.message}`);
                }

                if (batchData) {
                    fullQuestions = [...fullQuestions, ...batchData];
                }
            }

            console.log("[CustomQuiz] fullQuestions fetched:", fullQuestions.length);

            if (fullQuestions.length === 0) throw new Error("Nessuna domanda trovata con questi criteri.");

            const shuffledQ = fullQuestions.sort(() => Math.random() - 0.5);

            const richAnswers = shuffledQ.map(q => ({
                questionId: q.id,
                text: q.text,
                subjectId: q.subject_id,
                subjectName: (q as any).subject?.name || "Materia",
                selectedOption: null,
                correctOption: getCorrectOption(q),
                isCorrect: false,
                isSkipped: false,
                options: { a: q.option_a, b: q.option_b, c: q.option_c, d: q.option_d }
            }));

            const durationSeconds = noTimeLimit ? 0 : (timeHours * 3600 + timeMinutes * 60 + timeSeconds);

            const { data: attempt, error } = await supabase.from("quiz_attempts").insert({
                quiz_id: quizId,
                user_id: (await supabase.auth.getUser()).data.user?.id!,
                score: 0,
                answers: richAnswers,
                total_questions: richAnswers.length,
                correct: 0, wrong: 0, blank: 0,
                started_at: new Date().toISOString(),
                mode: 'custom',
            }).select().single();

            if (error) throw error;

            const scoringParams = `correct=${scoring.correct}&wrong=${scoring.wrong}&blank=${scoring.blank}`;
            const timeParam = noTimeLimit ? "time=0" : `time=${Math.ceil(durationSeconds / 60)}`;

            navigate(`/quiz/run/${attempt.id}?mode=custom&${timeParam}&${scoringParams}`);

        } catch (err: any) {
            console.error(err);
            alert("Errore: " + err.message);
        } finally {
            setGenerating(false);
        }
    };

    // Mode descriptions
    const modeDescriptions: Record<QuestionSelectionMode, string> = {
        random: "Domande pescate a caso tra tutte quelle disponibili nelle materie selezionate.",
        weak: "Priorità alle domande che hai sbagliato in passato.",
        unseen: "Priorità alle domande mai affrontate prima.",
        unanswered: "Priorità alle domande saltate in passato.",
        hardest: "Le domande statisticamente più difficili.",
        smart_mix: "Mix bilanciato di errori, nuove e casuali."
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F5F7] pb-32">
            {/* ============================================================= */}
            {/* TOP BAR */}
            {/* ============================================================= */}
            <header className="sticky top-0 z-50 bg-white border-b border-slate-100">
                <div className="flex items-center justify-between px-4 py-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 active:scale-95 transition-all"
                    >
                        <ChevronLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <h1 className="text-[17px] font-semibold text-slate-900">Prova Personalizzata</h1>
                    <div className="w-10" />
                </div>
            </header>

            <div className="px-5 max-w-lg mx-auto pt-6 space-y-6">
                {/* ============================================================= */}
                {/* SELEZIONA MATERIE */}
                {/* ============================================================= */}
                <section>
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Seleziona Materie</h2>
                        <button
                            onClick={toggleAllSubjects}
                            className="text-[13px] font-semibold text-purple-500 hover:text-purple-600 transition-colors"
                        >
                            {Object.keys(subjectSelections).length === subjects.length ? "Deseleziona tutte" : "Seleziona tutte"}
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                        {subjects.map((s, idx) => {
                            const count = subjectSelections[s.id];
                            const isSelected = count !== undefined;

                            return (
                                <div
                                    key={s.id}
                                    className={`${idx !== 0 ? 'border-t border-slate-100' : ''}`}
                                >
                                    <div className="p-4">
                                        <div
                                            className="flex items-center gap-3 cursor-pointer"
                                            onClick={() => toggleSubject(s.id, s.question_count)}
                                        >
                                            {/* Radio circle */}
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${isSelected
                                                ? 'border-purple-500 bg-purple-500'
                                                : 'border-slate-300'
                                                }`}>
                                                {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                                            </div>

                                            {/* Subject info */}
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-[15px] font-medium ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>
                                                    {s.name}
                                                </p>
                                                <p className="text-[12px] text-slate-400">
                                                    {s.question_count} disponibili
                                                </p>
                                            </div>
                                        </div>

                                        {/* Count controls (when selected) */}
                                        {isSelected && (
                                            <div className="mt-3 ml-9 flex items-center gap-3">
                                                <input
                                                    type="range"
                                                    min={1}
                                                    max={s.question_count}
                                                    value={count}
                                                    onChange={e => updateSubjectCount(s.id, parseInt(e.target.value), s.question_count)}
                                                    className="flex-1 h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-purple-500"
                                                />
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => updateSubjectCount(s.id, count - 1, s.question_count)}
                                                        className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 active:scale-95 transition-all"
                                                    >
                                                        <Minus className="w-3.5 h-3.5 text-slate-500" />
                                                    </button>
                                                    <span className="w-10 text-center font-bold text-purple-600 text-[15px]">{count}</span>
                                                    <button
                                                        onClick={() => updateSubjectCount(s.id, count + 1, s.question_count)}
                                                        className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 active:scale-95 transition-all"
                                                    >
                                                        <Plus className="w-3.5 h-3.5 text-slate-500" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ============================================================= */}
                {/* TIPO DI DOMANDE */}
                {/* ============================================================= */}
                <section>
                    <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Tipo di Domande</h2>

                    <div className="bg-white rounded-2xl p-4 relative" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                        <div className="flex items-center justify-between">
                            <select
                                value={selectionMode}
                                onChange={(e) => setSelectionMode(e.target.value as QuestionSelectionMode)}
                                className="w-full appearance-none bg-transparent text-[15px] font-semibold text-slate-900 outline-none cursor-pointer pr-8"
                            >
                                <option value="random">Casuali</option>
                                <option value="weak">Sbagliate spesso</option>
                                <option value="unanswered">Non risposte</option>
                                <option value="unseen">Mai viste</option>
                                <option value="hardest">Più difficili (Globali)</option>
                                <option value="smart_mix">Mix Intelligente</option>
                            </select>
                            <ChevronDown className="w-5 h-5 text-slate-400 absolute right-4 pointer-events-none" />
                        </div>
                    </div>

                    <p className="text-[12px] text-slate-400 mt-2 px-1">
                        {modeDescriptions[selectionMode]}
                    </p>
                </section>

                {/* ============================================================= */}
                {/* NUMERO DI QUIZ SELEZIONATI */}
                {/* ============================================================= */}
                <section>
                    <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Numero di Quiz Selezionati</h2>

                    <div className="bg-white rounded-2xl p-4 flex items-center justify-between" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                        <span className="text-[14px] font-medium text-slate-500">Totale</span>
                        <span className="text-[28px] font-bold text-purple-500">{totalSelectedQuestions}</span>
                    </div>
                </section>

                {/* ============================================================= */}
                {/* DURATA PROVA */}
                {/* ============================================================= */}
                <section>
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Durata Prova</h2>

                        {/* Toggle Switch */}
                        <div className="flex items-center gap-2">
                            <span className={`text-[12px] font-semibold ${noTimeLimit ? 'text-purple-500' : 'text-slate-400'}`}>
                                Senza limite
                            </span>
                            <button
                                onClick={() => setNoTimeLimit(!noTimeLimit)}
                                className={`w-11 h-6 rounded-full p-0.5 transition-colors ${noTimeLimit ? 'bg-purple-500' : 'bg-slate-300'}`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${noTimeLimit ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>

                    <div className={`bg-white rounded-2xl p-4 grid grid-cols-3 gap-3 transition-opacity ${noTimeLimit ? 'opacity-40 pointer-events-none' : ''}`} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                        {/* Ore */}
                        <div className="text-center">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase mb-2">Ore</p>
                            <select
                                value={timeHours}
                                onChange={e => setTimeHours(parseInt(e.target.value))}
                                className="w-full py-2 px-3 bg-slate-100 rounded-xl text-[18px] font-bold text-slate-900 text-center outline-none appearance-none cursor-pointer"
                            >
                                {[0, 1, 2, 3, 4].map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                        </div>

                        {/* Minuti */}
                        <div className="text-center">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase mb-2">Minuti</p>
                            <select
                                value={timeMinutes}
                                onChange={e => setTimeMinutes(parseInt(e.target.value))}
                                className="w-full py-2 px-3 bg-slate-100 rounded-xl text-[18px] font-bold text-slate-900 text-center outline-none appearance-none cursor-pointer"
                            >
                                {Array.from({ length: 60 }, (_, i) => i).map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>

                        {/* Secondi */}
                        <div className="text-center">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase mb-2">Secondi</p>
                            <select
                                value={timeSeconds}
                                onChange={e => setTimeSeconds(parseInt(e.target.value))}
                                className="w-full py-2 px-3 bg-slate-100 rounded-xl text-[18px] font-bold text-slate-900 text-center outline-none appearance-none cursor-pointer"
                            >
                                {Array.from({ length: 60 }, (_, i) => i).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                </section>

                {/* ============================================================= */}
                {/* PUNTEGGIO */}
                {/* ============================================================= */}
                <section>
                    <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">Punteggio</h2>

                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: 'Errate', key: 'wrong', color: 'red', value: scoring.wrong },
                            { label: 'Saltate', key: 'blank', color: 'amber', value: scoring.blank },
                            { label: 'Corrette', key: 'correct', color: 'emerald', value: scoring.correct }
                        ].map((item) => (
                            <div
                                key={item.key}
                                className="bg-white rounded-[24px] p-3 flex flex-col items-center gap-3 active:scale-[0.98] transition-transform"
                                style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03), 0 1px 2px rgba(0,0,0,0.04)' }}
                            >
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${item.color === 'red' ? 'text-red-500' :
                                    item.color === 'amber' ? 'text-amber-500' : 'text-emerald-500'
                                    }`}>
                                    {item.label}
                                </span>

                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => setScoring(s => ({ ...s, [item.key]: parseFloat(((s as any)[item.key] - 0.1).toFixed(1)) }))}
                                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${item.color === 'red' ? 'bg-red-50 text-red-500 hover:bg-red-100' :
                                            item.color === 'amber' ? 'bg-amber-50 text-amber-500 hover:bg-amber-100' :
                                                'bg-emerald-50 text-emerald-500 hover:bg-emerald-100'
                                            }`}
                                    >
                                        <Minus className="w-3.5 h-3.5" strokeWidth={3} />
                                    </button>
                                    <div className="w-8 text-center relative h-5">
                                        <AnimatePresence mode="wait">
                                            <motion.span
                                                key={item.value}
                                                initial={{ y: 5, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                exit={{ y: -5, opacity: 0 }}
                                                transition={{ duration: 0.15 }}
                                                className="absolute inset-0 flex items-center justify-center text-[15px] font-bold text-slate-900"
                                            >
                                                {item.key === 'correct' ? `+${item.value}` : item.value}
                                            </motion.span>
                                        </AnimatePresence>
                                    </div>
                                    <button
                                        onClick={() => setScoring(s => ({ ...s, [item.key]: parseFloat(((s as any)[item.key] + 0.1).toFixed(1)) }))}
                                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${item.color === 'red' ? 'bg-red-50 text-red-500 hover:bg-red-100' :
                                            item.color === 'amber' ? 'bg-amber-50 text-amber-500 hover:bg-amber-100' :
                                                'bg-emerald-50 text-emerald-500 hover:bg-emerald-100'
                                            }`}
                                    >
                                        <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* ============================================================= */}
            {/* BOTTOM CTA */}
            {/* ============================================================= */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 px-5 py-4 pb-safe z-50">
                <div className="max-w-lg mx-auto">
                    <button
                        onClick={handleStart}
                        disabled={generating || totalSelectedQuestions === 0}
                        className={`w-full py-4 rounded-2xl font-bold text-[16px] transition-all active:scale-[0.98] ${totalSelectedQuestions > 0
                            ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25 hover:bg-purple-600'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        {generating ? "Creazione in corso..." : `Avvia Prova (${totalSelectedQuestions})`}
                    </button>
                </div>
            </div>
        </div>
    );
}
