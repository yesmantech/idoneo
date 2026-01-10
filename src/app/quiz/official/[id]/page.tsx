"use client";

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Clock, HelpCircle, Trophy, ChevronRight, AlertCircle, Play } from "lucide-react";
import { analytics } from "@/lib/analytics";

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
                    // Await the result. If success (true), we do NOT clear loading,
                    // keeping the spinner visible until the page unmounts/redirects.
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
        return (
            <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#00B1FF] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-4">
                <div className="bg-red-50 text-red-600 p-4 rounded-xl max-w-sm text-center">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-medium">{error}</p>
                    <button onClick={() => navigate(-1)} className="mt-4 text-sm font-bold underline">Torna indietro</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20 transition-colors duration-300">
            {/* Top Bar */}
            <header className="sticky top-0 z-50 bg-white dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 pt-safe transition-colors">
                <div className="px-4 h-14 flex items-center gap-3 max-w-3xl mx-auto w-full">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-500 rotate-180" />
                    </button>
                    <span className="font-semibold text-slate-900 dark:text-white">Simulazione Ufficiale</span>
                </div>
            </header>

            <main className="px-5 py-6 max-w-lg mx-auto w-full">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{quizDetails?.title}</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8">
                    Questa simulazione replica le condizioni reali dell'esame ufficiale.
                </p>

                {/* Info Cards */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
                        <div className="flex items-center gap-2 mb-1">
                            <HelpCircle className="w-4 h-4 text-[#00B1FF]" />
                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">QUESITI</span>
                        </div>
                        <p className="text-xl font-bold text-slate-900 dark:text-white">{quizDetails?.question_count}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
                        <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-[#00B1FF]" />
                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">TEMPO</span>
                        </div>
                        <p className="text-xl font-bold text-slate-900 dark:text-white">
                            {quizDetails?.time_limit ? `${quizDetails.time_limit} min` : "Illimitato"}
                        </p>
                    </div>
                </div>

                {/* Rules Section */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 mb-6 transition-colors">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        Regole Punteggio
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Risposta Corretta</span>
                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-md">+1.00</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Risposta Errata</span>
                            <span className="text-sm font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-md">-0.10</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Risposta Non data</span>
                            <span className="text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-md">0.00</span>
                        </div>
                    </div>
                </div>

                {/* Do Not Show Again Checkbox */}
                <div className="flex items-center gap-3 px-2">
                    <div className="relative flex items-center">
                        <input
                            type="checkbox"
                            id="dontShowAgain"
                            checked={dontShowAgain}
                            onChange={(e) => setDontShowAgain(e.target.checked)}
                            className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 transition-all checked:border-[#00B1FF] checked:bg-[#00B1FF]"
                        />
                        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                            <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none">
                                <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>
                    <label htmlFor="dontShowAgain" className="text-sm text-slate-500 dark:text-slate-400 cursor-pointer select-none">
                        Non mostrare più questa schermata
                    </label>
                </div>
            </main>

            {/* Fixed Bottom Start Button */}
            <div className="fixed bottom-0 left-0 right-0 py-3 px-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-100 dark:border-slate-800 transition-colors" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
                <div className="max-w-lg mx-auto">
                    <button
                        onClick={() => handleStart()}
                        disabled={starting}
                        className="w-full py-4 rounded-2xl bg-[#00B1FF] text-white font-bold text-lg shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        {starting ? (
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                Avvia Simulazione <Play className="w-5 h-5 fill-current" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
