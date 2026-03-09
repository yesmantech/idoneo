"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { fetchSmartQuestionsWithData, QuestionSelectionMode, SubjectConfig } from "@/lib/quiz-smart-selection";
import { ChevronLeft, ChevronDown, Minus, Plus, Check, Play, Clock, Filter, Layers, Target, Trash2, Pencil, Bookmark, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TierSLoader from "@/components/ui/TierSLoader";
import TimePickerModal from "@/components/ui/TimePickerModal";
import { hapticLight, hapticSuccess, hapticError } from "@/lib/haptics";

// Types
type Subject = { id: string; name: string; question_count: number };
type ScoringConfig = { correct: number; wrong: number; blank: number };

// Helper to normalize DB answers
function normalizeDBAnswer(val: string | null | undefined): string | null {
    if (!val) return null;
    return val.replace(/[.,:;()\[\]]/g, "").trim().toLowerCase();
}

function getCorrectOption(q: any): string | null {
    if (!q) return null;
    if (q.correct_option) return normalizeDBAnswer(q.correct_option);
    if (q.correct_answer) return normalizeDBAnswer(q.correct_answer);
    if (q.answer) return normalizeDBAnswer(q.answer);
    return null;
}

export default function TemplateDetailPage() {
    const { category, contestSlug, templateId } = useParams<{ category: string; contestSlug: string; templateId: string }>();
    const navigate = useNavigate();

    // --- State ---
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [editingName, setEditingName] = useState(false);

    // Data
    const [quizId, setQuizId] = useState<string | null>(null);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [templateName, setTemplateName] = useState('');

    // Configuration (same as custom wizard)
    const [subjectSelections, setSubjectSelections] = useState<Record<string, number>>({});
    const [selectionMode, setSelectionMode] = useState<QuestionSelectionMode>('random');

    // Time
    const [timeHours, setTimeHours] = useState(0);
    const [timeMinutes, setTimeMinutes] = useState(30);
    const [timeSeconds, setTimeSeconds] = useState(0);
    const [noTimeLimit, setNoTimeLimit] = useState(false);
    const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);

    // Scoring
    const [scoring, setScoring] = useState<ScoringConfig>({ correct: 1, wrong: 0, blank: 0 });

    // Algorithm dropdown
    const [isAlgorithmOpen, setIsAlgorithmOpen] = useState(false);

    // --- Load Template + Subjects ---
    useEffect(() => {
        const load = async () => {
            const { data: qData } = await supabase.from("quizzes").select("id").eq("slug", contestSlug).single();
            if (!qData) { setLoading(false); return; }
            setQuizId(qData.id);

            const userRes = await supabase.auth.getUser();
            const userId = userRes.data.user?.id;
            if (!userId) { setLoading(false); return; }

            // Fetch template + subjects in parallel
            const [templateRes, subjectsRes] = await Promise.all([
                supabase.from("quiz_templates").select("*").eq("id", templateId).eq("user_id", userId).single(),
                supabase.from("subjects").select("id, name").eq("quiz_id", qData.id).eq("is_archived", false)
            ]);

            if (!templateRes.data || !subjectsRes.data) { setLoading(false); return; }

            const t = templateRes.data;
            const sData = subjectsRes.data;

            // Question counts
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

            // Restore template settings
            setTemplateName(t.name || 'Prova personalizzata');
            const sels = (t.subject_selections || {}) as Record<string, number>;
            const validIds = new Set(enriched.map(s => s.id));
            const validSelections: Record<string, number> = {};
            for (const [id, count] of Object.entries(sels)) {
                if (validIds.has(id)) {
                    const subj = enriched.find(s => s.id === id);
                    validSelections[id] = Math.min(count as number, subj?.question_count || 20);
                }
            }
            setSubjectSelections(validSelections);
            setSelectionMode((t.selection_mode as QuestionSelectionMode) || 'random');
            setTimeHours(t.time_hours ?? 0);
            setTimeMinutes(t.time_minutes ?? 30);
            setTimeSeconds(t.time_seconds ?? 0);
            setNoTimeLimit(t.no_time_limit ?? false);
            setScoring((t.scoring as ScoringConfig) || { correct: 1, wrong: 0, blank: 0 });

            setLoading(false);
        };
        load();
    }, [contestSlug, templateId]);

    // --- Helpers ---
    const toggleSubject = (id: string, max: number) => {
        hapticLight();
        setSubjectSelections(prev => {
            const next = { ...prev };
            if (next[id]) { delete next[id]; } else { next[id] = Math.min(20, max); }
            return next;
        });
    };

    const setSubjectCount = (id: string, count: number, max: number) => {
        setSubjectSelections(prev => ({ ...prev, [id]: Math.max(1, Math.min(count, max)) }));
    };

    const selectAll = () => {
        hapticLight();
        const next: Record<string, number> = {};
        subjects.forEach(s => {
            if (s.question_count > 0) next[s.id] = Math.min(20, s.question_count);
        });
        setSubjectSelections(next);
    };

    const totalSelectedQuestions = useMemo(() => {
        return Object.values(subjectSelections).reduce((acc: number, c: number) => acc + c, 0);
    }, [subjectSelections]);

    // --- Save Template ---
    const handleSave = async () => {
        if (!templateId) return;
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase.from('quiz_templates').update({
                name: templateName,
                subject_selections: subjectSelections,
                selection_mode: selectionMode,
                time_hours: timeHours,
                time_minutes: timeMinutes,
                time_seconds: timeSeconds,
                no_time_limit: noTimeLimit,
                scoring: scoring,
                updated_at: new Date().toISOString()
            }).eq('id', templateId).eq('user_id', user.id);

            hapticSuccess();
        } catch (err) {
            console.error(err);
            hapticError();
        } finally {
            setSaving(false);
        }
    };

    // --- Delete Template ---
    const handleDelete = async () => {
        if (!templateId) return;
        setDeleting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase.from('quiz_templates').delete().eq('id', templateId).eq('user_id', user.id);
            hapticSuccess();
            navigate(-1);
        } catch (err) {
            console.error(err);
            hapticError();
        } finally {
            setDeleting(false);
        }
    };

    // --- Launch Quiz from Template ---
    const handleStart = async () => {
        if (!quizId) return;
        if (totalSelectedQuestions <= 0) {
            hapticError();
            return;
        }

        setGenerating(true);
        hapticLight();

        try {
            // Save template first
            await handleSave();

            const configs: SubjectConfig[] = Object.entries(subjectSelections).map(([sId, count]: [string, number]) => ({
                subjectId: sId,
                count
            }));

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Non autenticato');

            // Single-query optimized fetch
            const selectedQuestions = await fetchSmartQuestionsWithData(
                user.id,
                quizId,
                configs,
                selectionMode
            );

            if (!selectedQuestions || selectedQuestions.length === 0) {
                hapticError();
                alert("Nessuna domanda disponibile per la configurazione selezionata.");
                setGenerating(false);
                return;
            }

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
                user_id: user.id,
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

    const modeDescriptions: Record<QuestionSelectionMode, string> = {
        random: "Domande casuali tra tutte le disponibili.",
        weak: "Priorità agli argomenti più deboli.",
        unseen: "Priorità alle domande mai viste prima.",
        unanswered: "Domande saltate in sessioni precedenti.",
        hardest: "Le domande più difficili della community.",
        smart_mix: "Mix bilanciato per un ripasso ottimale."
    };

    if (loading) {
        return <TierSLoader message="Caricamento template..." submessage="Recupero della configurazione salvata." />;
    }

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-40 overflow-x-hidden relative transition-colors duration-300">

            {/* Background */}
            <div className="fixed inset-0 pointer-events-none" style={{
                background: `
                    radial-gradient(circle at 10% 10%, rgba(139, 92, 246, 0.08), transparent 40%),
                    radial-gradient(circle at 90% 90%, rgba(56, 189, 248, 0.08), transparent 40%)
                `
            }} />

            {/* Navigation Bar */}
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
                        Template
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200/50 dark:border-red-500/10 text-red-500 active:scale-90 transition-transform"
                    >
                        <Trash2 className="w-4 h-4" />
                    </motion.button>
                </div>
            </div>

            <main className="relative z-10 px-6 py-6 max-w-lg mx-auto space-y-8">

                {/* Template Name (editable) */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-2"
                >
                    {editingName ? (
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                onBlur={() => setEditingName(false)}
                                onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
                                autoFocus
                                className="flex-1 text-2xl font-black text-[var(--foreground)] tracking-tight bg-transparent border-b-2 border-brand-blue outline-none"
                            />
                        </div>
                    ) : (
                        <button
                            onClick={() => { hapticLight(); setEditingName(true); }}
                            className="flex items-center gap-2 text-left group"
                        >
                            <h1 className="text-2xl font-black text-[var(--foreground)] tracking-tight">{templateName}</h1>
                            <Pencil className="w-4 h-4 text-[var(--foreground)] opacity-20 group-hover:opacity-50 transition-opacity" />
                        </button>
                    )}
                    <p className="text-sm font-medium text-[var(--foreground)] opacity-60">
                        Modifica le impostazioni e avvia la prova.
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
                            onClick={selectAll}
                            className="text-[11px] font-bold text-brand-blue uppercase tracking-wider"
                        >
                            Seleziona tutto
                        </button>
                    </div>

                    <div className="space-y-2">
                        {subjects.map(subject => {
                            const isSelected = !!subjectSelections[subject.id];
                            const selectedCount = subjectSelections[subject.id] || 0;

                            return (
                                <motion.div key={subject.id} layout className="group">
                                    <div
                                        onClick={() => toggleSubject(subject.id, subject.question_count)}
                                        className={`flex items-center justify-between p-4 rounded-2xl transition-all cursor-pointer border ${isSelected
                                            ? 'bg-white dark:bg-white/5 border-brand-blue/20 dark:border-brand-blue/20 shadow-soft'
                                            : 'bg-white/60 dark:bg-white/[0.02] border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${isSelected
                                                ? 'bg-brand-blue text-white scale-100'
                                                : 'bg-slate-100 dark:bg-white/5 scale-95'
                                                }`}>
                                                {isSelected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                                            </div>
                                            <span className={`text-sm font-semibold truncate ${isSelected ? 'text-[var(--foreground)]' : 'text-[var(--foreground)] opacity-60'}`}>
                                                {subject.name}
                                            </span>
                                        </div>
                                        <span className="text-xs font-bold text-[var(--foreground)] opacity-30 flex-shrink-0 tabular-nums">
                                            {subject.question_count}
                                        </span>
                                    </div>

                                    <AnimatePresence>
                                        {isSelected && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="flex items-center justify-center gap-4 py-3 px-4">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setSubjectCount(subject.id, selectedCount - 1, subject.question_count); }}
                                                        className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-[var(--foreground)] opacity-60 active:scale-90 transition-transform"
                                                    >
                                                        <Minus className="w-4 h-4" strokeWidth={2.5} />
                                                    </button>
                                                    <input
                                                        type="number"
                                                        value={selectedCount}
                                                        onChange={(e) => setSubjectCount(subject.id, parseInt(e.target.value) || 1, subject.question_count)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="w-16 text-center text-xl font-black text-[var(--foreground)] bg-transparent outline-none tabular-nums"
                                                        min={1}
                                                        max={subject.question_count}
                                                    />
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setSubjectCount(subject.id, selectedCount + 1, subject.question_count); }}
                                                        className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-[var(--foreground)] opacity-60 active:scale-90 transition-transform"
                                                    >
                                                        <Plus className="w-4 h-4" strokeWidth={2.5} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>

                {/* ALGORITMO */}
                <section>
                    <div className="flex items-center gap-2 text-[var(--foreground)] opacity-50 mb-4">
                        <Filter className="w-4 h-4" />
                        <h2 className="text-[11px] font-bold uppercase tracking-widest">Algoritmo</h2>
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => { hapticLight(); setIsAlgorithmOpen(!isAlgorithmOpen); }}
                            className="w-full flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-soft"
                        >
                            <span className="text-sm font-bold text-[var(--foreground)]">
                                {selectionMode === 'random' ? 'Casuali' :
                                    selectionMode === 'weak' ? 'Punti deboli' :
                                        selectionMode === 'unseen' ? 'Mai viste' :
                                            selectionMode === 'unanswered' ? 'Non risposta' :
                                                selectionMode === 'hardest' ? 'Più difficili' : 'Smart Mix'}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-[var(--foreground)] opacity-40 transition-transform ${isAlgorithmOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                            {isAlgorithmOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="mt-2 space-y-1">
                                        {(Object.keys(modeDescriptions) as QuestionSelectionMode[]).map(mode => (
                                            <button
                                                key={mode}
                                                onClick={() => { hapticLight(); setSelectionMode(mode); setIsAlgorithmOpen(false); }}
                                                className={`w-full text-left px-4 py-3 rounded-xl transition-all ${selectionMode === mode ? 'bg-brand-blue/10 text-brand-blue font-bold' : 'text-[var(--foreground)] opacity-60 hover:opacity-80'}`}
                                            >
                                                <span className="text-sm">{mode === 'random' ? 'Casuali' : mode === 'weak' ? 'Punti deboli' : mode === 'unseen' ? 'Mai viste' : mode === 'unanswered' ? 'Non risposte' : mode === 'hardest' ? 'Più difficili' : 'Smart Mix'}</span>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <p className="text-xs text-[var(--foreground)] opacity-40 mt-2 px-1">{modeDescriptions[selectionMode]}</p>
                </section>

                {/* TEMPO */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-[var(--foreground)] opacity-50">
                            <Clock className="w-4 h-4" />
                            <h2 className="text-[11px] font-bold uppercase tracking-widest">Tempo</h2>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <span className="text-[11px] font-bold text-[var(--foreground)] opacity-40 uppercase tracking-wider">Senza limiti</span>
                            <div
                                onClick={() => { hapticLight(); setNoTimeLimit(!noTimeLimit); }}
                                className={`w-12 h-7 rounded-full p-1 transition-colors ${noTimeLimit ? 'bg-brand-blue' : 'bg-slate-200 dark:bg-white/10'}`}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${noTimeLimit ? 'translate-x-5' : 'translate-x-0'}`} />
                            </div>
                        </label>
                    </div>

                    {!noTimeLimit && (
                        <div
                            onClick={() => setIsTimeModalOpen(true)}
                            className="grid grid-cols-3 gap-3 cursor-pointer"
                        >
                            {[
                                { label: 'Ora', value: timeHours },
                                { label: 'Minuti', value: timeMinutes },
                                { label: 'Secondi', value: timeSeconds }
                            ].map(item => (
                                <div key={item.label} className="bg-white dark:bg-white/5 rounded-2xl p-4 text-center border border-slate-100 dark:border-white/5 shadow-soft">
                                    <p className="text-[10px] font-bold text-[var(--foreground)] opacity-40 uppercase tracking-wider mb-1">{item.label}</p>
                                    <p className="text-3xl font-black text-[var(--foreground)] tabular-nums">{String(item.value).padStart(2, '0')}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* PUNTEGGI */}
                <section>
                    <div className="flex items-center gap-2 text-[var(--foreground)] opacity-50 mb-4">
                        <Target className="w-4 h-4" />
                        <h2 className="text-[11px] font-bold uppercase tracking-widest">Punteggi</h2>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { key: 'correct', label: 'Corretta', color: 'text-semantic-success' },
                            { key: 'wrong', label: 'Sbagliata', color: 'text-semantic-error' },
                            { key: 'blank', label: 'Bianca', color: 'text-slate-400' }
                        ].map(item => (
                            <div key={item.key} className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-slate-100 dark:border-white/5 shadow-soft">
                                <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${item.color}`}>{item.label}</p>
                                <input
                                    type="number"
                                    value={scoring[item.key as keyof ScoringConfig]}
                                    onChange={(e) => setScoring(prev => ({ ...prev, [item.key]: parseFloat(e.target.value) || 0 }))}
                                    step="0.1"
                                    className="w-full text-center text-2xl font-black text-[var(--foreground)] bg-transparent outline-none tabular-nums"
                                />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Save Button */}
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-[1.5px] border-slate-100 dark:border-white/[0.06] text-[14px] font-bold text-[var(--foreground)] opacity-60 hover:opacity-80 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-all"
                >
                    {saving ? (
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>
                            <Save className="w-4 h-4" /> Salva modifiche
                        </>
                    )}
                </motion.button>

            </main>

            {/* Fixed Bottom — Start Quiz Button */}
            <div className="fixed bottom-0 left-0 right-0 px-6 py-4 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-white/5 z-50" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
                <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-[var(--foreground)] opacity-40 tracking-wider">Domande</span>
                        <div className="text-2xl font-black text-[var(--foreground)] leading-none">{totalSelectedQuestions}</div>
                    </div>

                    <button
                        onClick={handleStart}
                        disabled={generating || totalSelectedQuestions === 0}
                        className="flex-1 group relative overflow-hidden py-4 rounded-[24px] shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* Time Picker Modal */}
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
                    setIsTimeModalOpen(false);
                }}
            />

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60"
                            onClick={() => setShowDeleteConfirm(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                            className="relative w-full max-w-sm bg-white/95 dark:bg-[#1a1a2e]/95 backdrop-blur-2xl border border-white/40 dark:border-white/[0.08] rounded-[28px] shadow-[0_24px_80px_-12px_rgba(0,0,0,0.25)] p-6 text-center"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6 text-red-500" />
                            </div>
                            <h3 className="text-lg font-black text-[var(--foreground)] mb-1">Elimina template?</h3>
                            <p className="text-[13px] text-[var(--foreground)] opacity-50 mb-6">
                                Questa azione non può essere annullata.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 py-3 rounded-2xl border border-slate-100 dark:border-white/[0.06] font-bold text-[14px] text-[var(--foreground)] opacity-50"
                                >
                                    Annulla
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold text-[14px] hover:bg-red-600 transition-colors active:scale-[0.98]"
                                >
                                    {deleting ? 'Eliminazione...' : 'Elimina'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
