"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { X, ChevronLeft, ChevronRight, Check, Lightbulb, Loader2, ChevronDown } from "lucide-react";
import BackButton from "@/components/ui/BackButton";

// =============================================================================
// TYPES
// =============================================================================
interface WrongAnswer {
    questionId: string;
    text: string;
    subjectName: string;
    subjectId: string;
    selectedOption: string | null;
    correctOption: string;
    explanation: string | null;
    options: { a: string; b: string; c: string; d: string };
    attemptDate: string;
}

// Helper to normalize
function normalizeDBAnswer(val: string | null | undefined): string | null {
    if (!val) return null;
    return val.replace(/[.,:;()[\]]/g, "").trim().toLowerCase();
}

// Helper to reliably check correctness against both letter keys ('a') and text values ('2011')
function checkIsCorrect(selectedKey: string | null, correctValue: string | null, options?: any): boolean {
    if (!selectedKey || !correctValue) return false;
    const normalizedSelected = normalizeDBAnswer(selectedKey);
    const normalizedCorrect = normalizeDBAnswer(correctValue);

    // 1. Literal match (e.g., 'a' === 'a')
    if (normalizedSelected === normalizedCorrect) return true;

    // 2. Content match (e.g., options['a'] === '2011')
    if (options && normalizedSelected) {
        const optionText = normalizeDBAnswer(options[normalizedSelected]);
        if (optionText && optionText === normalizedCorrect) return true;
    }

    return false;
}

export default function ReviewPage() {
    const { quizId } = useParams<{ quizId: string }>();
    const [searchParams] = useSearchParams();
    const subjectFilter = searchParams.get("subject");

    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);

    // AI Generation
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!quizId) {
                setError("Quiz non specificato");
                setLoading(false);
                return;
            }

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    navigate("/login");
                    return;
                }

                // Fetch all attempts for this quiz
                const { data: attempts } = await supabase
                    .from("quiz_attempts")
                    .select("id, answers, created_at")
                    .eq("user_id", user.id)
                    .eq("quiz_id", quizId)
                    .order("created_at", { ascending: false });

                if (!attempts?.length) {
                    setError("Nessun tentativo trovato");
                    setLoading(false);
                    return;
                }

                // Extract wrong answers
                const wrongMap = new Map<string, WrongAnswer>();

                attempts.forEach(attempt => {
                    if (!Array.isArray(attempt.answers)) return;

                    attempt.answers.forEach((ans: any) => {
                        if (!ans.isCorrect && !ans.isSkipped && ans.selectedOption) {
                            if (subjectFilter && ans.subjectId !== subjectFilter) return;

                            if (!wrongMap.has(ans.questionId)) {
                                wrongMap.set(ans.questionId, {
                                    questionId: ans.questionId,
                                    text: ans.text,
                                    subjectName: ans.subjectName || "Generale",
                                    subjectId: ans.subjectId,
                                    selectedOption: ans.selectedOption,
                                    correctOption: ans.correctOption,
                                    explanation: ans.explanation,
                                    options: ans.options || { a: "", b: "", c: "", d: "" },
                                    attemptDate: attempt.created_at
                                });
                            }
                        }
                    });
                });

                const wrongList = Array.from(wrongMap.values());

                if (wrongList.length === 0) {
                    setError("Nessun errore da ripassare! 🎉");
                }

                setWrongAnswers(wrongList);
                setLoading(false);

            } catch (err: any) {
                console.error("Review page error:", err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchData();
    }, [quizId, navigate, subjectFilter]);

    const currentQuestion = wrongAnswers[currentIndex];

    const goNext = () => {
        setShowAnswer(false);
        if (currentIndex < wrongAnswers.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const goPrev = () => {
        setShowAnswer(false);
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    // Helper to get actual correct answer text
    const getCorrectAnswerText = (answer: WrongAnswer) => {
        if (answer.correctOption && ['a', 'b', 'c', 'd'].includes(answer.correctOption)) {
            return (answer.options as any)[answer.correctOption];
        }
        for (const key of ['a', 'b', 'c', 'd']) {
            const text = (answer.options as any)[key];
            if (checkIsCorrect(key, answer.correctOption, answer.options)) {
                return text;
            }
        }
        return answer.correctOption || "Sconosciuta";
    };

    const handleGenerateExplanation = async () => {
        if (!currentQuestion) return;

        setIsGenerating(true);
        try {
            const correctAnswerText = getCorrectAnswerText(currentQuestion);

            const { data, error } = await supabase.functions.invoke('generate-explanation', {
                body: {
                    questionId: currentQuestion.questionId,
                    questionText: currentQuestion.text,
                    correctAnswer: correctAnswerText
                }
            });

            if (error) throw error;
            if (data?.explanation) {
                // Update local state so it shows up immediately
                setWrongAnswers(prev => {
                    const next = [...prev];
                    next[currentIndex] = {
                        ...next[currentIndex],
                        explanation: data.explanation
                    };
                    return next;
                });
            }
        } catch (error) {
            console.error("Error generating explanation:", error);
            alert("Errore durante la generazione della spiegazione.");
        } finally {
            setIsGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#00B1FF] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || wrongAnswers.length === 0) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-4">
                <div className={`${error?.includes("🎉") ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"} p-6 rounded-2xl max-w-sm text-center`}>
                    {error?.includes("🎉") ? (
                        <div className="w-16 h-16 mx-auto mb-4 bg-emerald-500/20 rounded-full flex items-center justify-center">
                            <Check className="w-8 h-8 text-emerald-400" />
                        </div>
                    ) : (
                        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                    )}
                    <p className="font-medium text-lg">{error || "Nessun errore trovato"}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="mt-4 px-6 py-2 bg-[var(--card)] rounded-xl font-bold text-sm text-[var(--foreground)] shadow-sm"
                    >
                        Torna indietro
                    </button>
                </div>
            </div>
        );
    }

    // Determine normalized correct option for comparison
    const normalizedCorrect = currentQuestion ? normalizeDBAnswer(currentQuestion.correctOption) : null;
    const normalizedSelected = currentQuestion ? normalizeDBAnswer(currentQuestion.selectedOption) : null;

    return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col">
            {/* ============================================================= */}
            {/* TOP BAR */}
            {/* ============================================================= */}
            <header
                className="sticky top-0 z-50 bg-[var(--background)]/90 backdrop-blur-xl border-b border-[var(--card-border)]"
                style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
            >
                <div className="h-14 px-4 flex items-center gap-3 max-w-3xl mx-auto">
                    {/* Left: Back */}
                    <BackButton />

                    {/* Center: Title + progress */}
                    <div className="flex-1 flex flex-col items-center">
                        <span className="font-bold text-[var(--foreground)] text-[15px] tracking-tight">
                            Ripasso Errori
                        </span>
                        <span className="text-[10px] text-[var(--muted-foreground)] font-semibold tabular-nums">
                            {currentIndex + 1} di {wrongAnswers.length}
                        </span>
                    </div>

                    {/* Right: Progress pill */}
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                        <span className="text-[11px] font-black text-red-500 tabular-nums">
                            {wrongAnswers.length}
                        </span>
                    </div>
                </div>

                {/* Thin progress bar */}
                <div className="h-[2px] bg-[var(--card-border)]">
                    <div
                        className="h-full bg-gradient-to-r from-[#00B1FF] to-[#0066FF] transition-all duration-300 ease-out"
                        style={{ width: `${((currentIndex + 1) / wrongAnswers.length) * 100}%` }}
                    />
                </div>
            </header>

            {/* ============================================================= */}
            {/* CONTENT (Identical layout to QuizRunner) */}
            {/* ============================================================= */}
            <main className="flex-1 px-5 py-6 max-w-3xl mx-auto w-full pb-32">
                {/* Subject + Error tag */}
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-[11px] font-bold text-[var(--foreground)] opacity-50 uppercase tracking-widest">
                        {currentQuestion.subjectName}
                    </span>
                    <span className="text-[11px] font-bold text-red-500 uppercase tracking-widest">• Errata</span>
                </div>

                {/* Question Text */}
                <h2 className="text-[20px] font-bold text-[var(--foreground)] leading-[1.4] mb-8">
                    {currentQuestion.text}
                </h2>

                {/* Options */}
                <div className="space-y-3">
                    {['a', 'b', 'c', 'd'].map(optKey => {
                        const optText = (currentQuestion.options as any)[optKey];
                        if (!optText) return null;

                        const isCorrectAnswer = checkIsCorrect(optKey, currentQuestion.correctOption, currentQuestion.options);
                        const isSelectedAnswer = optKey === normalizedSelected;

                        // STYLING LOGIC:
                        // If showAnswer is FALSE:
                        //   - Show selected answer as RED (since it's an error review)
                        //   - Others default
                        // If showAnswer is TRUE:
                        //   - Show correct as GREEN
                        //   - Show selected as RED

                        let cardStyle = "bg-[var(--card)] border-[var(--card-border)]";
                        let badgeStyle = "bg-[var(--background)] text-[var(--muted-foreground)]";
                        let textStyle = "text-[var(--foreground)]";

                        // Always show the user's WRONG answer
                        if (isSelectedAnswer) {
                            cardStyle = "bg-red-50 border-red-500";
                            badgeStyle = "bg-red-500 text-white";
                            textStyle = "text-red-700";
                        }

                        // If user asks to reveal, show the CORRECT answer
                        if (showAnswer && isCorrectAnswer) {
                            cardStyle = "bg-emerald-50 border-emerald-500";
                            badgeStyle = "bg-emerald-500 text-white";
                            textStyle = "text-emerald-700";
                        }

                        return (
                            <div
                                key={optKey}
                                className={`w-full p-4 rounded-2xl border-2 flex items-start gap-4 text-left transition-all duration-200 ${cardStyle}`}
                            >
                                {/* Letter Badge */}
                                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-bold flex-shrink-0 ${badgeStyle}`}>
                                    {optKey.toUpperCase()}
                                </span>

                                {/* Answer Text */}
                                <span className={`text-[15px] leading-relaxed flex-1 ${textStyle}`}>
                                    {optText}
                                </span>

                                {/* Icons for Correct/Wrong */}
                                {showAnswer && isCorrectAnswer && (
                                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Tier S Explanation Block / Accordion */}
                {showAnswer && (
                    <div className="mt-6">
                        {currentQuestion.explanation ? (
                            <div className="bg-white dark:bg-black rounded-3xl p-6 border border-blue-100 dark:border-blue-900/50 shadow-sm relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                                {/* Decorative background element */}
                                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                                    <Lightbulb className="w-32 h-32 text-blue-500" />
                                </div>

                                <h3 className="text-[13px] font-bold text-[#00B1FF] uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10">
                                    <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                        <Lightbulb className="w-4 h-4" />
                                    </div>
                                    Spiegazione
                                </h3>
                                <div className="prose prose-slate dark:prose-invert prose-sm sm:prose-base max-w-none text-slate-700 dark:text-slate-300 leading-relaxed relative z-10">
                                    <p className="m-0">{currentQuestion.explanation}</p>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={handleGenerateExplanation}
                                disabled={isGenerating}
                                className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/80 hover:from-blue-50/50 hover:to-blue-50/20 dark:hover:from-blue-900/20 dark:hover:to-blue-900/10 border border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800/50 p-4 sm:p-5 text-left transition-all duration-300 shadow-sm hover:shadow"
                            >
                                {/* Subtle animated shine effect on hover */}
                                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-blue-100/20 dark:via-blue-400/10 to-transparent group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-[#00B1FF] shadow-inner border border-blue-100/50 dark:border-blue-800/50 transition-colors group-hover:bg-[#00B1FF] group-hover:text-white">
                                            <Lightbulb className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-200 transition-colors group-hover:text-[#00B1FF]">
                                                Spiegazione passo-passo
                                            </h4>
                                            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                                                {isGenerating ? "Caricamento in corso..." : "Scopri il ragionamento dietro la risposta"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-slate-700 text-slate-400 group-hover:text-[#00B1FF] group-hover:bg-blue-50 dark:group-hover:bg-blue-900/50 shadow-sm border border-slate-100 dark:border-slate-600 group-hover:border-blue-100 dark:group-hover:border-blue-800 transition-all duration-300 ${isGenerating ? 'opacity-100' : 'group-hover:translate-y-0.5'}`}>
                                        {isGenerating ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-[#00B1FF]" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4" />
                                        )}
                                    </div>
                                </div>
                            </button>
                        )}
                    </div>
                )}

                {/* Reveal Button (Floating if not revealed) */}
                {!showAnswer && (
                    <button
                        onClick={() => setShowAnswer(true)}
                        className="w-full mt-8 py-4 rounded-xl font-bold text-white bg-[#00B1FF] shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
                    >
                        Mostra Risposta Corretta
                    </button>
                )}
            </main>

            {/* ============================================================= */}
            {/* BOTTOM NAVIGATOR — clean fixed bar */}
            {/* ============================================================= */}
            <div className="fixed bottom-0 left-0 right-0 bg-[var(--background)]/95 backdrop-blur-xl border-t border-[var(--card-border)] pb-safe z-40">

                {/* Question Pills Row */}
                <div className="px-4 pt-2 pb-1">
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide max-w-3xl mx-auto">
                        {wrongAnswers.map((_, idx) => {
                            const isActive = idx === currentIndex;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => { setCurrentIndex(idx); setShowAnswer(false); }}
                                    className={`w-9 h-9 flex-shrink-0 rounded-xl font-semibold text-[13px] transition-all flex items-center justify-center
                                        ${isActive
                                            ? 'bg-[var(--card)] text-[#00B1FF] border-2 border-[#00B1FF] shadow-sm'
                                            : 'bg-[var(--card)] text-[var(--muted-foreground)]'}`}
                                >
                                    {idx + 1}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Prev / Next */}
                <div className="px-4 py-2 flex gap-3 max-w-3xl mx-auto">
                    <button
                        onClick={goPrev}
                        disabled={currentIndex === 0}
                        className={`flex-1 py-3 rounded-xl font-semibold text-[15px] flex items-center justify-center gap-2 transition-all
                            ${currentIndex === 0
                                ? 'bg-[var(--card)] text-[var(--muted-foreground)] opacity-40'
                                : 'bg-[var(--card)] text-[var(--foreground)] active:scale-[0.98]'}`}
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Precedente
                    </button>

                    <button
                        onClick={goNext}
                        disabled={currentIndex === wrongAnswers.length - 1}
                        className={`flex-1 py-3 rounded-xl font-semibold text-[15px] flex items-center justify-center gap-2 transition-all
                            ${currentIndex === wrongAnswers.length - 1
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600'
                                : 'bg-[#00B1FF] text-white shadow-sm shadow-blue-400/30 active:scale-[0.98]'}`}
                    >
                        Prossimo Errore
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function AlertCircle({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    );
}
