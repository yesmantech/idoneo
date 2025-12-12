
import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { fetchSmartQuestions, QuestionSelectionMode, SubjectConfig } from "@/lib/quiz-smart-selection";

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
    // Map subjectID -> number of questions selected
    // If not in map, it's 0 (not selected)
    const [subjectSelections, setSubjectSelections] = useState<Record<string, number>>({});

    const [selectionMode, setSelectionMode] = useState<QuestionSelectionMode>('random');

    // Time Config (Hours, Minutes, Seconds)
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
                // Sort by name
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
                // Toggle OFF
                delete next[id];
            } else {
                // Toggle ON -> Default to all available or reasonable max (e.g. 20)
                // User requirement: "Use reasonable default (e.g. all questions or pre-set max)"
                // Let's default to min(20, max)
                next[id] = Math.min(20, max);
            }
            return next;
        });
    };

    const updateSubjectCount = (id: string, val: number, max: number) => {
        const safeVal = Math.max(0, Math.min(val, max));
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
            // 1. Prepare Configs

            // 1. Prepare Configs
            const configs: SubjectConfig[] = Object.entries(subjectSelections).map(([sId, count]: [string, number]) => ({
                subjectId: sId,
                count
            }));

            // 2. Fetch Questions
            const selection = await fetchSmartQuestions(
                (await supabase.auth.getUser()).data.user?.id || null,
                quizId,
                configs,
                selectionMode
            );

            // 3. Create Rich Answers
            // Note: selection might be smaller than requested if not enough questions exist (handled by smart logic)
            const { data: fullQuestions } = await supabase
                .from("questions")
                .select("*, subject:subjects(name)")
                .in("id", selection.map(s => s.questionId));

            if (!fullQuestions || fullQuestions.length === 0) throw new Error("Nessuna domanda trovata con questi criteri.");

            // Final Shuffle
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

            // 4. Calculate Duration
            const durationSeconds = noTimeLimit ? 0 : (timeHours * 3600 + timeMinutes * 60 + timeSeconds);

            // 5. Save Attempt
            const { data: attempt, error } = await supabase.from("quiz_attempts").insert({
                quiz_id: quizId,
                user_id: (await supabase.auth.getUser()).data.user?.id!,
                score: 0,
                answers: richAnswers,
                total_questions: richAnswers.length,
                correct: 0, wrong: 0, blank: 0,
                started_at: new Date().toISOString(),
                mode: 'custom', // Track attempt type
            }).select().single();

            if (error) throw error;

            // 6. Redirect to Runner
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


    if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50">Caricamento...</div>;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">

            {/* Header */}
            <div className="bg-white px-4 py-3 border-b border-slate-200 sticky top-0 z-20 flex items-center justify-between shadow-sm">
                <button onClick={() => navigate(-1)} className="text-slate-500 font-bold p-2 hover:bg-slate-100 rounded-full">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <div className="font-bold text-lg">Prova Personalizzata</div>
                <div className="w-9" />
            </div>

            <div className="flex-1 w-full max-w-md mx-auto p-4 space-y-8 pb-32">

                {/* Section A: Subjects & Counts */}
                <section className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">SELEZIONA MATERIE</h2>
                        <button onClick={toggleAllSubjects} className="text-indigo-600 text-xs font-bold">
                            {Object.keys(subjectSelections).length === subjects.length ? "Deseleziona tutte" : "Seleziona tutte"}
                        </button>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-100">
                        {subjects.map(s => {
                            const count = subjectSelections[s.id];
                            const isSelected = count !== undefined;

                            return (
                                <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-50 transition-colors gap-3">
                                    <div
                                        className="flex items-center gap-3 cursor-pointer flex-1"
                                        onClick={() => toggleSubject(s.id, s.question_count)}
                                    >
                                        <div className={`w-5 h-5 min-w-[1.25rem] rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                                            {isSelected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`font-medium ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>{s.name}</span>
                                            <span className="text-[10px] text-slate-400 font-bold">{s.question_count} disponibili</span>
                                        </div>
                                    </div>

                                    {isSelected && (
                                        <div className="flex items-center gap-2 self-end sm:self-auto">
                                            <input
                                                type="range"
                                                min={1} max={s.question_count}
                                                value={count}
                                                onChange={e => updateSubjectCount(s.id, parseInt(e.target.value), s.question_count)}
                                                className="w-24 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                            />
                                            <input
                                                type="number"
                                                min={1} max={s.question_count}
                                                value={count}
                                                onChange={e => updateSubjectCount(s.id, parseInt(e.target.value), s.question_count)}
                                                className="w-14 p-1 text-center font-bold border border-slate-200 rounded-lg text-sm outline-indigo-600"
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Section B: Mode */}
                <section className="space-y-3">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1">TIPO DI DOMANDE</h2>
                    {/* ... Same as before ... */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2">
                        <select
                            value={selectionMode}
                            onChange={(e) => setSelectionMode(e.target.value as any)}
                            className="w-full p-2 bg-transparent font-bold text-slate-900 outline-none"
                        >
                            <option value="random">Casuali</option>
                            <option value="weak">Sbagliate spesso</option>
                            <option value="unanswered">Non risposte</option>
                            <option value="unseen">Mai viste</option>
                            <option value="hardest">Più difficili (Globali)</option>
                            <option value="smart_mix">Mix Intelligente</option>
                        </select>
                    </div>
                    <p className="text-xs text-slate-400 px-2">
                        {selectionMode === 'random' && "Domande pescate a caso tra tutte quelle disponibili nelle materie selezionate."}
                        {selectionMode === 'weak' && "Priorità alle domande che hai sbagliato in passato."}
                        {selectionMode === 'unseen' && "Priorità alle domande mai affrontate prima."}
                        {selectionMode === 'unanswered' && "Priorità alle domande saltate in passato."}
                        {selectionMode === 'hardest' && "Le domande statisticamente più difficili."}
                        {selectionMode === 'smart_mix' && "Mix bilanciato di errori, nuove e casuali."}
                    </p>
                </section>

                {/* Section C: Count Summary (Read Only) */}
                <section className="space-y-3">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1">NUMERO DI QUIZ SELEZIONATI</h2>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex items-center justify-between">
                        <div className="text-sm font-bold text-slate-400">Totale</div>
                        <div className="text-3xl font-black text-indigo-600">
                            {totalSelectedQuestions}
                        </div>
                    </div>
                </section>

                {/* Section D: Duration */}
                <section className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">DURATA PROVA</h2>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${noTimeLimit ? 'text-indigo-600' : 'text-slate-400'}`}>Senza limite</span>
                            <div
                                onClick={() => setNoTimeLimit(!noTimeLimit)}
                                className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${noTimeLimit ? 'bg-indigo-600' : 'bg-slate-300'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${noTimeLimit ? 'translate-x-4' : 'translate-x-0'}`} />
                            </div>
                        </div>
                    </div>

                    <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-4 grid grid-cols-3 gap-4 text-center transition-opacity ${noTimeLimit ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Ore</div>
                            <select value={timeHours} onChange={e => setTimeHours(parseInt(e.target.value))} className="w-full text-xl font-bold bg-slate-50 rounded-lg p-2 outline-none">
                                {[0, 1, 2, 3, 4].map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Minuti</div>
                            <select value={timeMinutes} onChange={e => setTimeMinutes(parseInt(e.target.value))} className="w-full text-xl font-bold bg-slate-50 rounded-lg p-2 outline-none">
                                {Array.from({ length: 60 }, (_, i) => i).map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Secondi</div>
                            <select value={timeSeconds} onChange={e => setTimeSeconds(parseInt(e.target.value))} className="w-full text-xl font-bold bg-slate-50 rounded-lg p-2 outline-none">
                                {Array.from({ length: 60 }, (_, i) => i).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                </section>

                {/* Section E: Scoring */}
                <section className="space-y-3">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1">PUNTEGGIO</h2>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white rounded-xl border-b-4 border-rose-500 p-3 shadow-sm flex flex-col items-center">
                            <span className="text-[10px] uppercase font-bold text-rose-500 mb-1">Errate</span>
                            <div className="flex items-center">
                                <button onClick={() => setScoring(s => ({ ...s, wrong: parseFloat((s.wrong - 0.1).toFixed(1)) }))} className="text-slate-300 hover:text-rose-500 font-bold px-1 text-lg">-</button>
                                <input
                                    type="number"
                                    value={scoring.wrong}
                                    onChange={e => setScoring({ ...scoring, wrong: parseFloat(e.target.value) })}
                                    className="w-12 text-center font-black text-slate-900 outline-none"
                                />
                                <button onClick={() => setScoring(s => ({ ...s, wrong: parseFloat((s.wrong + 0.1).toFixed(1)) }))} className="text-slate-300 hover:text-rose-500 font-bold px-1 text-lg">+</button>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border-b-4 border-amber-400 p-3 shadow-sm flex flex-col items-center">
                            <span className="text-[10px] uppercase font-bold text-amber-500 mb-1">Saltate</span>
                            <div className="flex items-center">
                                <button onClick={() => setScoring(s => ({ ...s, blank: parseFloat((s.blank - 0.1).toFixed(1)) }))} className="text-slate-300 hover:text-amber-500 font-bold px-1 text-lg">-</button>
                                <input
                                    type="number"
                                    value={scoring.blank}
                                    onChange={e => setScoring({ ...scoring, blank: parseFloat(e.target.value) })}
                                    className="w-12 text-center font-black text-slate-900 outline-none"
                                />
                                <button onClick={() => setScoring(s => ({ ...s, blank: parseFloat((s.blank + 0.1).toFixed(1)) }))} className="text-slate-300 hover:text-amber-500 font-bold px-1 text-lg">+</button>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border-b-4 border-emerald-500 p-3 shadow-sm flex flex-col items-center">
                            <span className="text-[10px] uppercase font-bold text-emerald-500 mb-1">Corrette</span>
                            <div className="flex items-center">
                                <button onClick={() => setScoring(s => ({ ...s, correct: parseFloat((s.correct - 0.1).toFixed(1)) }))} className="text-slate-300 hover:text-emerald-500 font-bold px-1 text-lg">-</button>
                                <input
                                    type="number"
                                    value={scoring.correct}
                                    onChange={e => setScoring({ ...scoring, correct: parseFloat(e.target.value) })}
                                    className="w-12 text-center font-black text-slate-900 outline-none"
                                />
                                <button onClick={() => setScoring(s => ({ ...s, correct: parseFloat((s.correct + 0.1).toFixed(1)) }))} className="text-slate-300 hover:text-emerald-500 font-bold px-1 text-lg">+</button>
                            </div>
                        </div>
                    </div>
                </section>


                {/* Sticky Footer */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur border-t border-slate-200 pb-safe">
                    <div className="max-w-md mx-auto">
                        <button
                            onClick={handleStart}
                            disabled={generating || totalSelectedQuestions === 0}
                            className="w-full py-4 bg-brand-cyan text-white rounded-2xl font-bold text-lg shadow-lg shadow-brand-cyan/20 hover:bg-brand-cyan/90 disabled:opacity-50 disabled:shadow-none transition-all active:scale-[0.98]"
                        >
                            {generating ? "Creazione in corso..." : `Avvia Prova (${totalSelectedQuestions})`}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
