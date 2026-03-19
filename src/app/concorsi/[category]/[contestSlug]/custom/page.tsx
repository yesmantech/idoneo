"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { fetchSmartQuestionsWithData, QuestionSelectionMode, SubjectConfig } from "@/lib/quiz-smart-selection";
import { ChevronLeft, ChevronDown, Minus, Plus, Check, Play, Clock, Filter, Layers, Target, RotateCcw, Bookmark, ChevronRight, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TierSLoader from "@/components/ui/TierSLoader";
import ScrollPicker from "@/components/ui/ScrollPicker";
import TimePickerModal from "@/components/ui/TimePickerModal";
import { hapticLight, hapticSuccess, hapticError } from "@/lib/haptics";

// Types
type Subject = { id: string; name: string; question_count: number };
type ScoringConfig = { correct: number; wrong: number; blank: number };
type SavedTemplate = {
    id: string;
    name: string;
    subject_selections: Record<string, number>;
    selection_mode: string;
    time_hours: number;
    time_minutes: number;
    time_seconds: number;
    no_time_limit: boolean;
    scoring: ScoringConfig;
    updated_at: string;
};

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
    const { category, contestSlug } = useParams<{ category: string; contestSlug: string }>();
    const navigate = useNavigate();

    // --- State ---
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [hasTemplate, setHasTemplate] = useState(false);
    const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);

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

    // --- Load Data & Fetch Templates ---
    useEffect(() => {
        const load = async () => {
            const { data: qData } = await supabase.from("quizzes").select("id").eq("slug", contestSlug).single();
            if (!qData) { setLoading(false); return; }
            setQuizId(qData.id);

            const userRes = await supabase.auth.getUser();
            const userId = userRes.data.user?.id;

            const [subjectsRes, templatesRes] = await Promise.all([
                supabase.from("subjects").select("id, name").eq("quiz_id", qData.id).eq("is_archived", false),
                userId
                    ? supabase.from("quiz_templates").select("*").eq("user_id", userId).eq("quiz_id", qData.id).order("updated_at", { ascending: false })
                    : Promise.resolve({ data: [] })
            ]);

            const sData = subjectsRes.data;
            if (!sData || sData.length === 0) { setLoading(false); return; }

            const subjectIds = sData.map(s => s.id);
            const { data: qRows } = await supabase
                .from("questions_safe")
                .select("subject_id")
                .in("subject_id", subjectIds)
                .eq("is_archived", false);

            const countMap: Record<string, number> = {};
            (qRows || []).forEach(q => {
                countMap[q.subject_id] = (countMap[q.subject_id] || 0) + 1;
            });

            const enriched: Subject[] = sData
                .map(s => ({ ...s, question_count: countMap[s.id] || 0 }))
                .sort((a, b) => a.name.localeCompare(b.name));

            setSubjects(enriched);

            // Store all templates for the list section
            if (templatesRes.data && templatesRes.data.length > 0) {
                setSavedTemplates(templatesRes.data as SavedTemplate[]);
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

    const deleteTemplate = async (templateId: string) => {
        hapticLight();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('quiz_templates').delete().eq('id', templateId).eq('user_id', user.id);
            setSavedTemplates(prev => prev.filter(t => t.id !== templateId));
        }
    };

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

            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || null;

            // Single-query optimized fetch: gets full question data + applies selection in-memory
            const selectedQuestions = await fetchSmartQuestionsWithData(
                userId,
                quizId,
                configs,
                selectionMode
            );

            if (!selectedQuestions || selectedQuestions.length === 0) {
                throw new Error(`Nessuna domanda trovata. Configs: ${JSON.stringify(configs)}, Mode: ${selectionMode}`);
            }

            // Shuffle final order
            const shuffledQ = selectedQuestions.sort(() => Math.random() - 0.5);

            const richAnswers = shuffledQ.map((q: any) => ({
                questionId: q.id,
                text: q.text,
                subjectId: q.subject_id,
                subjectName: (q as any).subject?.name || "Materia",
                selectedOption: null,
                correctOption: null,
                isCorrect: false,
                isSkipped: false,
                explanation: q.explanation || null,
                options: { a: q.option_a, b: q.option_b, c: q.option_c, d: q.option_d }
            }));

            const durationSeconds = noTimeLimit ? 0 : (timeHours * 3600 + timeMinutes * 60 + timeSeconds);

            const { data: attempt, error } = await supabase.from("quiz_attempts").insert({
                quiz_id: quizId,
                user_id: userId!,
                score: 0,
                answers: richAnswers,
                total_questions: richAnswers.length,
                correct: 0, wrong: 0, blank: 0,
                started_at: new Date().toISOString(),
                mode: 'custom',
            }).select().single();

            if (error) throw error;

            // Save template (fire-and-forget)
            if (userId) {
                const totalQ = Object.values(subjectSelections).reduce((a, b) => a + b, 0);
                supabase.from('quiz_templates').insert({
                    user_id: userId,
                    quiz_id: quizId,
                    name: `Prova ${totalQ} domande`,
                    subject_selections: subjectSelections,
                    selection_mode: selectionMode,
                    time_hours: timeHours,
                    time_minutes: timeMinutes,
                    time_seconds: timeSeconds,
                    no_time_limit: noTimeLimit,
                    scoring: scoring,
                    updated_at: new Date().toISOString()
                }).then(({ error: tErr }) => {
                    if (tErr) console.warn('[Template] DB save failed:', tErr);
                });
            }

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
            <div className="sticky top-0 z-50 bg-white/60 dark:bg-black/60 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5 pt-safe">
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

                {/* Saved Templates Section */}
                {savedTemplates.length > 0 && (
                    <motion.section
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-[var(--foreground)] opacity-50">
                                <Bookmark className="w-4 h-4" />
                                <h2 className="text-[11px] font-bold uppercase tracking-widest">I tuoi template</h2>
                            </div>
                            {savedTemplates.length > 3 && (
                                <button
                                    onClick={() => navigate(`/concorsi/${category}/${contestSlug}/templates`)}
                                    className="text-[11px] font-bold text-brand-blue uppercase tracking-wider flex items-center gap-1"
                                >
                                    Vedi tutti <ChevronRight className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                        <div className="space-y-2">
                            {savedTemplates.slice(0, 3).map((template) => {
                                const totalQ = Object.values(template.subject_selections || {}).reduce((a: number, b: number) => a + b, 0);
                                const timeStr = template.no_time_limit
                                    ? 'Senza limiti'
                                    : `${template.time_hours > 0 ? template.time_hours + 'h ' : ''}${template.time_minutes}m${template.time_seconds > 0 ? ' ' + template.time_seconds + 's' : ''}`;
                                const updatedDate = new Date(template.updated_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });

                                return (
                                    <motion.div
                                        key={template.id}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => navigate(`/concorsi/${category}/${contestSlug}/template/${template.id}`)}
                                        className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/80 dark:bg-white/[0.04] border border-slate-100 dark:border-white/[0.06] cursor-pointer hover:border-brand-blue/30 transition-all group"
                                    >
                                        <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-violet-500/10 to-purple-500/10 dark:from-violet-500/20 dark:to-purple-500/20 flex items-center justify-center flex-shrink-0">
                                            <Bookmark className="w-4 h-4 text-violet-500" fill="currentColor" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[14px] font-bold text-[var(--foreground)] truncate">{template.name}</p>
                                            <p className="text-[11px] text-[var(--foreground)] opacity-40">
                                                {totalQ} domande · {timeStr} · {updatedDate}
                                            </p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-[var(--foreground)] opacity-20 group-hover:opacity-50 transition-opacity flex-shrink-0" />
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.section>
                )}

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

                            <div className="flex items-center gap-3">
                                <span className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${noTimeLimit ? 'text-brand-blue' : 'text-slate-500'}`}>
                                    Senza Limiti
                                </span>
                                <button
                                    type="button"
                                    onClick={() => { hapticLight(); setNoTimeLimit(!noTimeLimit); }}
                                    className={`relative inline-flex h-[28px] w-[50px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-sm ${noTimeLimit ? 'bg-brand-blue' : 'bg-slate-200 dark:bg-white/10'
                                        }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-[24px] w-[24px] transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${noTimeLimit ? 'translate-x-[22px]' : 'translate-x-0'
                                            }`}
                                    />
                                </button>
                            </div>
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
                                    className="bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-[24px] p-6 border border-slate-200/50 dark:border-white/10 flex items-center justify-center gap-4 text-slate-500/80 dark:text-slate-400/80 transition-all shadow-sm"
                                >
                                    <Clock className="w-5 h-5 opacity-50" />
                                    <span className="text-[12px] font-bold uppercase tracking-widest">Nessun limite impostato</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <TimePickerModal
                            isOpen={isTimeModalOpen}
                            onClose={() => setIsTimeModalOpen(false)}
                            hours={timeHours}
                            minutes={timeMinutes}
                            seconds={timeSeconds}
                            onSave={(h: number, m: number, s: number) => {
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
                            { label: 'Esatta', key: 'correct', value: scoring.correct },
                            { label: 'Errata', key: 'wrong', value: scoring.wrong },
                            { label: 'Saltata', key: 'blank', value: scoring.blank }
                        ].map((item) => (
                            <div
                                key={item.key}
                                className="flex items-center justify-between p-4 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-[24px] border border-slate-200/50 dark:border-white/5 shadow-sm"
                            >
                                <span className="text-[15px] font-bold text-slate-800 dark:text-slate-200">
                                    {item.label}
                                </span>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => { hapticLight(); setScoring(s => ({ ...s, [item.key]: parseFloat(((s as any)[item.key] - 0.1).toFixed(1)) })); }}
                                        className="w-10 h-10 rounded-[14px] flex items-center justify-center transition-all bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 active:scale-95"
                                    >
                                        <Minus className="w-4 h-4" strokeWidth={2.5} />
                                    </button>

                                    <span className="w-14 text-center text-[17px] font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">
                                        {item.key === 'correct' ? `+${item.value}` : item.value}
                                    </span>

                                    <button
                                        onClick={() => { hapticLight(); setScoring(s => ({ ...s, [item.key]: parseFloat(((s as any)[item.key] + 0.1).toFixed(1)) })); }}
                                        className="w-10 h-10 rounded-[14px] flex items-center justify-center transition-all bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 active:scale-95"
                                    >
                                        <Plus className="w-4 h-4" strokeWidth={2.5} />
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
            <div className="fixed bottom-0 left-0 right-0 px-6 py-4 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-white/5 z-50 transition-colors" style={{ paddingBottom: 'max(16px, var(--safe-area-bottom))' }}>
                <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-[var(--foreground)] opacity-40 tracking-wider">Domande</span>
                        <div className="text-2xl font-black text-[var(--foreground)] leading-none">{totalSelectedQuestions}</div>
                    </div>

                    <button
                        onClick={handleStart}
                        disabled={generating || totalSelectedQuestions === 0}
                        className={`flex-1 group relative overflow-hidden py-4 rounded-[24px] shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        <div className={`absolute inset-0 transition-colors duration-300 ${totalSelectedQuestions > 0
                            ? 'bg-brand-blue opacity-100 hover:opacity-90'
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
