"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { fetchSmartQuestions, QuestionSelectionMode, SubjectConfig } from "@/lib/quiz-smart-selection";
import { ChevronLeft, ChevronDown, Minus, Plus, Check, Play, Clock, Filter, Layers, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TierSLoader from "@/components/ui/TierSLoader";
import ScrollPicker from "@/components/ui/ScrollPicker";
import TimePickerModal from "@/components/ui/TimePickerModal";
import { hapticLight, hapticSuccess, hapticError } from "@/lib/haptics";

// Types
type Subject = { id: string; name: string; question_count: number };
type ScoringConfig = { correct: number; wrong: number; blank: number };

// Helper to normalize DB answers
function normalizeDBAnswer(val: string | null | undefined): string | null {
    if (!val) return null;
    return val.replace(/[.,:;()[\]]/g, "").trim().toLowerCase();
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
// CUSTOM QUIZ WIZARD PAGE - Tier S Redesign
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
    const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);

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
        hapticLight();
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
        hapticLight();
        const safeVal = Math.max(1, Math.min(val, max));
        setSubjectSelections(prev => ({ ...prev, [id]: safeVal }));
    };

    const toggleAllSubjects = () => {
        hapticLight();
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
        if (totalSelectedQuestions <= 0) {
            hapticError();
            alert("Seleziona almeno una domanda");
            return;
        }

        hapticSuccess();
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
                explanation: q.explanation || null,
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
            hapticError();
            alert("Errore: " + err.message);
        } finally {
            setGenerating(false);
        }
    };

    // Mode descriptions
    const modeDescriptions: Record<QuestionSelectionMode, string> = {
        random: "Domande casuali tra tutte le disponibili.",
        weak: "Priorità agli argomenti più deboli.",
        unseen: "Priorità alle domande mai viste prima.",
        unanswered: "Domande saltate in sessioni precedenti.",
        hardest: "Le domande più difficili della community.",
        smart_mix: "Mix bilanciato per un ripasso ottimale."
    };

    if (loading) {
        return <TierSLoader message="Configurazione Wizard..." submessage="Stiamo recuperando le tue materie." />;
    }

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-brand-blue/20 pb-40 overflow-x-hidden relative transition-colors duration-300">

            {/* Tier S Mesh Gradient Background */}
            <div className="fixed inset-0 pointer-events-none transition-colors duration-1000" style={{
                background: `
                    radial-gradient(circle at 10% 10%, rgba(56, 189, 248, 0.08), transparent 40%),
                    radial-gradient(circle at 90% 90%, rgba(139, 92, 246, 0.08), transparent 40%)
                `
            }} />

            {/* Glass Navigation Bar */}
            <div className="sticky top-0 z-50 bg-white/60 dark:bg-[#0A0A0B]/60 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5 pt-safe">
                <div className="px-4 h-14 flex items-center justify-between max-w-lg mx-auto">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { hapticLight(); navigate(-1); }}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-white/5 shadow-soft border border-slate-200/50 dark:border-white/10 text-slate-600 dark:text-slate-300 active:scale-90 transition-transform"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </motion.button>
                    <div className="font-black text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                        Personalizza
                    </div>
                    <div className="w-10"></div>
                </div>
            </div>

            <main className="relative z-10 px-6 py-6 max-w-lg mx-auto space-y-8">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-1"
                >
                    <h1 className="text-2xl font-black text-[var(--foreground)] tracking-tight">Crea la tua Prova</h1>
                    <p className="text-sm font-medium text-[var(--foreground)] opacity-60">
                        Configura ogni dettaglio per un allenamento mirato.
                    </p>
                </motion.div>

                {/* SELEZIONA MATERIE */}
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2 text-[var(--foreground)] opacity-50">
                            <Layers className="w-4 h-4" />
                            <h2 className="text-[11px] font-bold uppercase tracking-widest">Materie</h2>
                        </div>
                        <button
                            onClick={toggleAllSubjects}
                            className="text-[11px] font-bold bg-brand-blue/10 text-brand-blue px-3 py-1 rounded-full uppercase tracking-wider hover:bg-brand-blue/20 transition-colors"
                        >
                            {Object.keys(subjectSelections).length === subjects.length ? "Deseleziona" : "Seleziona Tutto"}
                        </button>
                    </div>

                    <div className="space-y-2">
                        {subjects.map((s, idx) => {
                            const count = subjectSelections[s.id];
                            const isSelected = count !== undefined;

                            return (
                                <motion.div
                                    key={s.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                    className={`relative rounded-2xl overflow-hidden border transition-all duration-300 ${isSelected
                                        ? 'bg-white dark:bg-white/5 border-brand-blue/30 shadow-lg shadow-brand-blue/5'
                                        : 'bg-white/40 dark:bg-white/5 border-slate-200/50 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/10'
                                        }`}
                                >
                                    <div
                                        className="p-4 flex items-center gap-4 cursor-pointer"
                                        onClick={() => toggleSubject(s.id, s.question_count)}
                                    >
                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${isSelected
                                            ? 'bg-brand-blue border-brand-blue shadow-md shadow-brand-blue/20'
                                            : 'border-slate-300 dark:border-slate-600 bg-transparent'
                                            }`}>
                                            {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className={`text-[15px] font-bold tracking-tight transition-colors ${isSelected ? 'text-[var(--foreground)]' : 'text-[var(--foreground)] opacity-60'}`}>
                                                {s.name}
                                            </p>
                                        </div>

                                        <div className="text-[10px] font-bold px-2 py-1 rounded-md bg-slate-100 dark:bg-black/20 text-[var(--foreground)] opacity-50">
                                            {s.question_count}
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {isSelected && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="bg-slate-50 dark:bg-black/20 border-t border-slate-100 dark:border-white/5 px-4 py-3"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--foreground)] opacity-40">Quantità</span>
                                                    <div className="flex-1">
                                                        <input
                                                            type="range"
                                                            min={1}
                                                            max={s.question_count}
                                                            value={count}
                                                            onChange={e => updateSubjectCount(s.id, parseInt(e.target.value), s.question_count)}
                                                            className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-full appearance-none cursor-pointer accent-brand-blue"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); updateSubjectCount(s.id, count - 1, s.question_count); }}
                                                            className="w-8 h-8 rounded-xl bg-white dark:bg-white/10 flex items-center justify-center shadow-sm border border-slate-200/50 dark:border-white/5 text-[var(--foreground)] hover:scale-95 transition-transform"
                                                        >
                                                            <Minus className="w-3.5 h-3.5 opacity-60" />
                                                        </button>
                                                        <span className="w-10 text-center font-black text-brand-blue text-lg">{count}</span>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); updateSubjectCount(s.id, count + 1, s.question_count); }}
                                                            className="w-8 h-8 rounded-xl bg-white dark:bg-white/10 flex items-center justify-center shadow-sm border border-slate-200/50 dark:border-white/5 text-[var(--foreground)] hover:scale-95 transition-transform"
                                                        >
                                                            <Plus className="w-3.5 h-3.5 opacity-60" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>

                {/* CONFIGURAZIONE */}
                <div className="grid grid-cols-1 gap-4">

                    {/* ALGORTIMO DOMANDE */}
                    <section>
                        <div className="flex items-center gap-2 text-[var(--foreground)] opacity-50 mb-3 ml-1">
                            <Target className="w-4 h-4" />
                            <h2 className="text-[11px] font-bold uppercase tracking-widest">Algoritmo</h2>
                        </div>

                        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-[24px] p-1 border border-slate-200/50 dark:border-white/5 shadow-sm relative z-20">
                            <div className="relative">
                                <select
                                    value={selectionMode}
                                    onChange={(e) => { hapticLight(); setSelectionMode(e.target.value as QuestionSelectionMode); }}
                                    className="w-full h-12 pl-4 pr-10 appearance-none bg-transparent text-[15px] font-bold text-[var(--foreground)] outline-none cursor-pointer z-10 relative"
                                >
                                    <option value="random">Casuali</option>
                                    <option value="weak">Sbagliate spesso</option>
                                    <option value="unanswered">Non risposte</option>
                                    <option value="unseen">Mai viste</option>
                                    <option value="hardest">Più difficili (Globali)</option>
                                    <option value="smart_mix">Mix Intelligente</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--foreground)] opacity-40">
                                    <Filter className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                        <p className="text-[11px] font-medium text-[var(--foreground)] opacity-40 mt-2 px-3 leading-snug">
                            {modeDescriptions[selectionMode]}
                        </p>
                    </section>

                    {/* TEMPO */}
                    <section>
                        <div className="flex justify-between items-center mb-6 px-1">
                            <div className="flex items-center gap-2 text-[var(--foreground)] opacity-50">
                                <Clock className="w-4 h-4" />
                                <h2 className="text-[11px] font-bold uppercase tracking-widest">Tempo</h2>
                            </div>

                            <button
                                onClick={() => { hapticLight(); setNoTimeLimit(!noTimeLimit); }}
                                className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full transition-all border ${noTimeLimit
                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                    : 'bg-slate-100 dark:bg-white/5 text-[var(--foreground)] opacity-60 border-transparent'
                                    }`}
                            >
                                {noTimeLimit ? "Senza Limiti" : "Con Timer"}
                            </button>
                        </div>

                        <AnimatePresence mode="wait">
                            {!noTimeLimit ? (
                                <motion.div
                                    key="time-grid"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className="grid grid-cols-3 gap-3"
                                >
                                    {[
                                        { label: 'Ora', value: timeHours },
                                        { label: 'Minuti', value: timeMinutes },
                                        { label: 'Secondi', value: timeSeconds }
                                    ].map((slot, i) => (
                                        <div
                                            key={i}
                                            onClick={() => { hapticLight(); setIsTimeModalOpen(true); }}
                                            className="bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-[24px] p-5 border border-slate-200/50 dark:border-white/10 flex flex-col items-center justify-center cursor-pointer group hover:bg-white/60 dark:hover:bg-white/10 transition-all shadow-sm active:scale-[0.95]"
                                        >
                                            <span className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-[0.2em] mb-1 group-hover:text-brand-blue transition-colors">
                                                {slot.label}
                                            </span>
                                            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                                                {slot.value.toString().padStart(2, '0')}
                                            </span>
                                        </div>
                                    ))}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="no-time-limit"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-emerald-500/[0.03] dark:bg-emerald-500/5 backdrop-blur-sm rounded-[32px] p-8 border border-emerald-500/10 flex flex-col items-center justify-center gap-3 text-emerald-500/60 transition-all"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                                        <Clock className="w-6 h-6 opacity-40 capitalize" />
                                    </div>
                                    <span className="text-sm font-black uppercase tracking-widest opacity-80">Senza Limiti di Tempo</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <TimePickerModal
                            isOpen={isTimeModalOpen}
                            onClose={() => setIsTimeModalOpen(false)}
                            hours={timeHours}
                            minutes={timeMinutes}
                            seconds={timeSeconds}
                            onSave={(h, m, s) => {
                                setTimeHours(h);
                                setTimeMinutes(m);
                                setTimeSeconds(s);
                            }}
                        />
                    </section>
                </div>

                {/* PUNTEGGIO */}
                <section>
                    <div className="flex items-center gap-2 text-[var(--foreground)] opacity-50 mb-4 ml-1">
                        <Target className="w-4 h-4" />
                        <h2 className="text-[11px] font-bold uppercase tracking-widest">Punteggi</h2>
                    </div>

                    <div className="space-y-3">
                        {[
                            { label: 'Esatta', key: 'correct', color: 'emerald', value: scoring.correct, sign: '+' },
                            { label: 'Errata', key: 'wrong', color: 'red', value: scoring.wrong, sign: '' },
                            { label: 'Saltata', key: 'blank', color: 'slate', value: scoring.blank, sign: '' }
                        ].map((item) => (
                            <div
                                key={item.key}
                                className={`flex items-center justify-between p-3 rounded-[20px] border relative overflow-hidden ${item.color === 'emerald' ? 'bg-emerald-500/[0.03] dark:bg-emerald-500/10 border-emerald-500/10' :
                                    item.color === 'red' ? 'bg-red-500/[0.03] dark:bg-red-500/10 border-red-500/10' :
                                        'bg-slate-100/50 dark:bg-white/5 border-slate-200/50 dark:border-white/5'
                                    }`}
                            >
                                <span className={`text-[13px] font-bold ml-2 ${item.color === 'emerald' ? 'text-emerald-700 dark:text-emerald-400' :
                                    item.color === 'red' ? 'text-red-600 dark:text-red-400' :
                                        'text-slate-600 dark:text-slate-400'
                                    }`}>
                                    {item.label}
                                </span>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => { hapticLight(); setScoring(s => ({ ...s, [item.key]: parseFloat(((s as any)[item.key] - 0.1).toFixed(1)) })); }}
                                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform active:scale-90 ${item.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' :
                                            item.color === 'red' ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' :
                                                'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400'
                                            }`}
                                    >
                                        <Minus className="w-3.5 h-3.5" strokeWidth={3} />
                                    </button>

                                    <span className={`w-12 text-center text-[15px] font-black ${item.color === 'emerald' ? 'text-emerald-700 dark:text-emerald-400' :
                                        item.color === 'red' ? 'text-red-600 dark:text-red-400' :
                                            'text-slate-600 dark:text-slate-400'
                                        }`}>
                                        {item.key === 'correct' ? `+${item.value}` : item.value}
                                    </span>

                                    <button
                                        onClick={() => { hapticLight(); setScoring(s => ({ ...s, [item.key]: parseFloat(((s as any)[item.key] + 0.1).toFixed(1)) })); }}
                                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform active:scale-90 ${item.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' :
                                            item.color === 'red' ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' :
                                                'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400'
                                            }`}
                                    >
                                        <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Spacer for bottom bar */}
                <div className="h-24"></div>

            </main>

            {/* Fixed Bottom Start Button */}
            <div className="fixed bottom-0 left-0 right-0 px-6 py-4 bg-white/80 dark:bg-[#0A0A0B]/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-white/5 z-50 transition-colors" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
                <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-[var(--foreground)] opacity-40 tracking-wider">Domande</span>
                        <div className="text-2xl font-black text-[var(--foreground)] leading-none">{totalSelectedQuestions}</div>
                    </div>

                    <button
                        onClick={handleStart}
                        disabled={generating || totalSelectedQuestions === 0}
                        className={`flex-1 group relative overflow-hidden py-4 rounded-[24px] shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${totalSelectedQuestions > 0 ? 'shadow-brand-blue/30' : 'shadow-none'
                            }`}
                    >
                        <div className={`absolute inset-0 transition-opacity duration-300 ${totalSelectedQuestions > 0
                            ? 'bg-gradient-to-r from-brand-blue to-cyan-400 opacity-100'
                            : 'bg-slate-200 dark:bg-white/10 opacity-100'
                            }`} />

                        <span className={`relative z-10 flex items-center justify-center gap-2 font-black text-lg ${totalSelectedQuestions > 0 ? 'text-white' : 'text-slate-400 dark:text-slate-500'
                            }`}>
                            {generating ? (
                                <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    Avvia Prova <Play className="w-5 h-5 fill-current" />
                                </>
                            )}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
