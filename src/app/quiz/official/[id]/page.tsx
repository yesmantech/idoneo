"use client";

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Clock, HelpCircle, Trophy, ChevronLeft, AlertCircle, Play, CheckCircle2, XCircle, MinusCircle, Rocket } from "lucide-react";
import { analytics } from "@/lib/analytics";
import { motion } from "framer-motion";
import TierSLoader from "@/components/ui/TierSLoader";
import { hapticLight, hapticSuccess } from "@/lib/haptics";

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

export default function OfficialQuizStarterPage() {
    const { id: quizSlug } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    const [dontShowAgain, setDontShowAgain] = useState(false);

    const [quizDetails, setQuizDetails] = useState<{
        id: string;
        title: string;
        time_limit: number | null;
        question_count: number;
    } | null>(null);

    // Initial fetch of Quiz Details only
    useEffect(() => {
        const fetchDetails = async () => {
            if (!quizSlug) {
                setError("Quiz non specificato");
                setLoading(false);
                return;
            }

            try {
                // 1. Check auth
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    navigate("/login");
                    return;
                }

                // 2. Fetch quiz details
                let quiz: any = null;
                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(quizSlug);

                let query = supabase
                    .from("quizzes")
                    .select("id, title, time_limit");

                if (isUUID) query = query.eq("id", quizSlug);
                else query = query.eq("slug", quizSlug);

                const result = await query.single();

                if (result.error || !result.data) {
                    throw new Error("Quiz non trovato");
                }

                quiz = result.data;

                // 3. Count available questions (estimate)
                const { data: subjects } = await supabase
                    .from("subjects")
                    .select("id")
                    .eq("quiz_id", quiz.id)
                    .eq("is_archived", false);

                const subjectIds = subjects?.map(s => s.id) || [];

                const { count } = await supabase
                    .from("questions")
                    .select("*", { count: 'exact', head: true })
                    .in("subject_id", subjectIds)
                    .eq("is_archived", false);

                const details = {
                    id: quiz.id,
                    title: quiz.title,
                    time_limit: quiz.time_limit,
                    question_count: count || 0
                };

                setQuizDetails(details);

                // 4. Check Auto-Start Preference
                const skipRules = localStorage.getItem("skip_official_rules");
                if (skipRules === "true") {
                    // Auto-start immediately if preference is set.
                    const started = await handleStart(details);
                    if (started) {
                        return;
                    }
                }

                // If not auto-starting or it failed, show the UI
                setLoading(false);

            } catch (err: any) {
                console.error("Quiz details error:", err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchDetails();
    }, [quizSlug, navigate]);

    // Accept details arg to support auto-start call
    // Returns true if successfully started (redirecting), false otherwise
    const handleStart = async (details = quizDetails): Promise<boolean> => {
        if (!details) return false;

        hapticSuccess();
        setStarting(true);
        setError(null);

        // Save preference if checkbox is checked
        if (dontShowAgain) {
            localStorage.setItem("skip_official_rules", "true");
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Utente non autenticato");

            // 1. Fetch Subjects
            const { data: subjects } = await supabase
                .from("subjects")
                .select("id")
                .eq("quiz_id", details.id)
                .eq("is_archived", false);

            if (!subjects?.length) throw new Error("Nessuna materia trovata");
            const subjectIds = subjects.map(s => s.id);

            // 2. Fetch Questions
            const { data: questions, error: questionsError } = await supabase
                .from("questions")
                .select("*, subject:subjects(name)")
                .in("subject_id", subjectIds)
                .eq("is_archived", false);

            if (questionsError || !questions?.length) throw new Error("Nessuna domanda disponibile");

            // 3. Shuffle & Prepare
            const shuffledQuestions = questions.sort(() => Math.random() - 0.5);

            const richAnswers = shuffledQuestions.map(q => ({
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

            // 4. Create Attempt
            const { data: attempt, error: attemptError } = await supabase
                .from("quiz_attempts")
                .insert({
                    quiz_id: details.id,
                    user_id: user.id,
                    score: 0,
                    answers: richAnswers,
                    total_questions: richAnswers.length,
                    correct: 0,
                    wrong: 0,
                    blank: 0,
                    started_at: new Date().toISOString(),
                    mode: 'official',
                })
                .select()
                .single();

            if (attemptError || !attempt) throw attemptError;

            // Track quiz started
            analytics.track('quiz_started', {
                quiz_id: details.id,
                title: details.title,
                mode: 'official',
                questions_count: richAnswers.length
            });

            // 5. Navigate
            const timeParam = details.time_limit ? `time=${details.time_limit}` : "time=0";
            navigate(`/quiz/run/${attempt.id}?mode=official&${timeParam}`);

            // Return true to indicate successful start (loading should stick)
            return true;

        } catch (err: any) {
            console.error("Start error:", err);
            setError(err.message);
            setStarting(false);
            return false;
        }
    };

    if (loading) {
        return <TierSLoader message="Preparazione simulazione..." submessage="Il tempo è prezioso, stiamo configurando tutto." />;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-6 text-center">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-[var(--card)] border border-semantic-error/20 p-8 rounded-[32px] shadow-card max-w-sm"
                >
                    <div className="w-16 h-16 bg-semantic-error/10 text-semantic-error rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">Errore caricamento</h1>
                    <p className="text-[var(--foreground)] opacity-60 mb-6 text-sm">{error}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full py-3 bg-brand-blue text-white font-bold rounded-pill shadow-lg shadow-brand-blue/20"
                    >
                        Torna indietro
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-brand-blue/20 pb-24 overflow-x-hidden relative transition-colors duration-300">

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
                        Simulazione Ufficiale
                    </div>
                    <div className="w-10"></div>
                </div>
            </div>

            <main className="relative z-10 px-6 py-6 max-w-lg mx-auto flex flex-col justify-center min-h-[calc(100vh-140px)]">
                {/* Header Hero - Balanced */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <motion.div
                        initial={{ scale: 0, rotate: -15 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", damping: 15, delay: 0.1 }}
                        className="w-20 h-20 bg-gradient-to-br from-brand-blue to-cyan-400 rounded-[24px] mx-auto flex items-center justify-center mb-4 shadow-xl shadow-brand-blue/20 text-white relative group"
                    >
                        <div className="absolute inset-0 bg-white/20 rounded-[24px] blur-lg opacity-0 group-hover:opacity-50 transition-opacity" />
                        <Rocket className="w-10 h-10 relative z-10" />

                        {/* Decorative glint */}
                        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-white/30 to-transparent rounded-[24px] pointer-events-none" />
                    </motion.div>

                    <h1 className="text-2xl font-black tracking-tight text-[var(--foreground)] mb-2 leading-tight">{quizDetails?.title}</h1>
                    <p className="text-[var(--foreground)] opacity-60 text-sm leading-relaxed px-4 font-medium">
                        Replica le condizioni reali dell'esame ufficiale.
                    </p>
                </motion.div>

                {/* Info Cards - Balanced */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="grid grid-cols-2 gap-4 mb-6"
                >
                    <div className="flex flex-col items-center justify-center p-4 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-[24px] border border-slate-200/50 dark:border-white/5 relative overflow-hidden group shadow-sm transition-all hover:scale-[1.02]">
                        <div className="w-10 h-10 rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-500 flex items-center justify-center mb-2">
                            <HelpCircle className="w-5 h-5" />
                        </div>
                        <div className="text-2xl font-black text-[var(--foreground)] tracking-tight">{quizDetails?.question_count}</div>
                        <div className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 opacity-80">Quesiti</div>
                    </div>

                    <div className="flex flex-col items-center justify-center p-4 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-[24px] border border-slate-200/50 dark:border-white/5 relative overflow-hidden group shadow-sm transition-all hover:scale-[1.02]">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-brand-blue flex items-center justify-center mb-2">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div className="text-2xl font-black text-[var(--foreground)] tracking-tight">
                            {quizDetails?.time_limit ? `${quizDetails.time_limit}` : "∞"}
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 opacity-80">{quizDetails?.time_limit ? "Minuti" : "Tempo"}</div>
                    </div>
                </motion.div>

                {/* Rules Section - Balanced */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/60 dark:bg-white/5 backdrop-blur-2xl border border-white/40 dark:border-white/10 rounded-[30px] p-2 shadow-xl shadow-indigo-500/5 mb-6 overflow-visible"
                >
                    <div className="p-4">
                        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 mb-4 text-center uppercase tracking-[0.2em] flex items-center justify-center gap-2 opacity-90">
                            Punteggi Ufficiali
                        </h3>

                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between p-3.5 pl-4 rounded-2xl bg-emerald-500/[0.03] dark:bg-emerald-500/10 border border-emerald-500/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm shadow-emerald-500/10">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                    <span className="font-bold text-[var(--foreground)] text-sm">Risposta Esatta</span>
                                </div>
                                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 tracking-tight">+1.00</span>
                            </div>

                            <div className="flex items-center justify-between p-3.5 pl-4 rounded-2xl bg-red-500/[0.03] dark:bg-red-500/10 border border-red-500/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center text-red-500 dark:text-red-400 shadow-sm shadow-red-500/10">
                                        <XCircle className="w-4 h-4" />
                                    </div>
                                    <span className="font-bold text-[var(--foreground)] text-sm">Risposta Errata</span>
                                </div>
                                <span className="text-lg font-black text-red-500 dark:text-red-400 tracking-tight">-0.10</span>
                            </div>

                            <div className="flex items-center justify-between p-3.5 pl-4 rounded-2xl bg-slate-100/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-slate-200/50 dark:bg-white/10 flex items-center justify-center text-slate-400 dark:text-slate-500">
                                        <MinusCircle className="w-4 h-4" />
                                    </div>
                                    <span className="font-bold text-[var(--foreground)] text-sm">Non Risposta</span>
                                </div>
                                <span className="text-lg font-black text-slate-400 dark:text-slate-500 tracking-tight">0.00</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Do Not Show Again Checkbox */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="flex items-center justify-center gap-2.5 px-2 pb-4"
                >
                    <div className="relative flex items-center">
                        <input
                            type="checkbox"
                            id="dontShowAgain"
                            checked={dontShowAgain}
                            onChange={(e) => {
                                hapticLight();
                                setDontShowAgain(e.target.checked);
                            }}
                            className="peer h-4 w-4 cursor-pointer appearance-none rounded-md border-2 border-slate-300 dark:border-slate-600 bg-transparent transition-all checked:border-brand-blue checked:bg-brand-blue"
                        />
                        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                            <svg className="h-3 w-3" viewBox="0 0 14 14" fill="none">
                                <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>
                    <label htmlFor="dontShowAgain" className="text-sm font-medium text-[var(--foreground)] opacity-60 cursor-pointer select-none">
                        Non mostrare più in futuro
                    </label>
                </motion.div>
            </main>

            {/* Fixed Bottom Start Button - Balanced */}
            <div className="fixed bottom-0 left-0 right-0 px-6 py-4 bg-white/80 dark:bg-[#0A0A0B]/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-white/5 z-50 transition-colors" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
                <div className="max-w-lg mx-auto">
                    <button
                        onClick={() => handleStart()}
                        disabled={starting}
                        className="group w-full relative overflow-hidden py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-extrabold text-lg rounded-2xl shadow-xl shadow-slate-900/20 dark:shadow-white/10 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-brand-blue to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        <span className="relative z-10 flex items-center justify-center gap-2">
                            {starting ? (
                                <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    Avvia Simulazione <Play className="w-5 h-5 fill-current" />
                                </>
                            )}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
