"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { X, ChevronLeft, ChevronRight, Check } from "lucide-react";

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

    // Drawer state (matching QuizRunner)
    const [drawerExpanded, setDrawerExpanded] = useState(false);

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

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#00B1FF] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || wrongAnswers.length === 0) {
        return (
            <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-4">
                <div className={`${error?.includes("🎉") ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"} p-6 rounded-2xl max-w-sm text-center`}>
                    {error?.includes("🎉") ? (
                        <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
                            <Check className="w-8 h-8 text-emerald-600" />
                        </div>
                    ) : (
                        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                    )}
                    <p className="font-medium text-lg">{error || "Nessun errore trovato"}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="mt-4 px-6 py-2 bg-white rounded-xl font-bold text-sm shadow-sm"
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
        <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
            {/* ============================================================= */}
            {/* TOP BAR (Identical to QuizRunner) */}
            {/* ============================================================= */}
            <header className="sticky top-0 z-50 bg-white border-b border-slate-100">
                <div className="h-14 px-4 flex items-center justify-between max-w-3xl mx-auto">
                    {/* Left: Close */}
                    <Link
                        to={`/profile/stats/${quizId}`}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-600" />
                    </Link>

                    {/* Center: Title/Counter */}
                    <div className="flex flex-col items-center">
                        <span className="font-bold text-slate-900 text-sm">
                            Ripasso Errori
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                            Domanda {currentIndex + 1}/{wrongAnswers.length}
                        </span>
                    </div>

                    {/* Right: Spacer to balance layout (or settings if needed) */}
                    <div className="w-10" />
                </div>
            </header>

            {/* ============================================================= */}
            {/* CONTENT (Identical layout to QuizRunner) */}
            {/* ============================================================= */}
            <main className="flex-1 px-5 py-6 max-w-3xl mx-auto w-full pb-48">
                {/* Meta info */}
                <div className="mb-3">
                    <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider">
                        {currentIndex + 1} / {wrongAnswers.length} • {currentQuestion.subjectName}
                    </span>
                </div>

                {/* Question Text */}
                <h2 className="text-[20px] font-bold text-slate-900 leading-[1.4] mb-8">
                    {currentQuestion.text}
                </h2>

                {/* Options */}
                <div className="space-y-3">
                    {['a', 'b', 'c', 'd'].map(optKey => {
                        const optText = (currentQuestion.options as any)[optKey];
                        if (!optText) return null;

                        const isCorrectAnswer = optKey === normalizedCorrect;
                        const isSelectedAnswer = optKey === normalizedSelected;

                        // STYLING LOGIC:
                        // If showAnswer is FALSE:
                        //   - Show selected answer as RED (since it's an error review)
                        //   - Others default
                        // If showAnswer is TRUE:
                        //   - Show correct as GREEN
                        //   - Show selected as RED

                        let cardStyle = "bg-white border-slate-200";
                        let badgeStyle = "bg-slate-100 text-slate-500";
                        let textStyle = "text-slate-700";

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

                {/* Explanation */}
                {showAnswer && currentQuestion.explanation && (
                    <div className="mt-6 bg-white rounded-2xl p-5 border border-[#00B1FF]/20 animate-in slide-in-from-top-2">
                        <h4 className="text-[12px] font-bold text-[#00B1FF] uppercase tracking-wider mb-2">
                            Spiegazione
                        </h4>
                        <p className="text-[14px] text-slate-600 leading-relaxed">
                            {currentQuestion.explanation}
                        </p>
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
            {/* BOTTOM DRAWER NAVIGATOR (Identical to QuizRunner) */}
            {/* ============================================================= */}
            <div className="fixed bottom-0 left-0 right-0 bg-white pb-safe z-40">
                {/* Drawer Handle */}
                <div className="relative flex justify-center">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                        <div className="relative w-28 h-8">
                            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 112 32" fill="none" style={{ filter: 'drop-shadow(0 -2px 8px rgba(0,0,0,0.1))' }}>
                                <path d="M10 32 L18 8 C20 3 24 0 30 0 L82 0 C88 0 92 3 94 8 L102 32 Z" fill="white" />
                            </svg>
                            <button
                                onClick={() => setDrawerExpanded(!drawerExpanded)}
                                className="absolute left-1/2 -translate-x-1/2 top-2 w-16 h-5 rounded-md bg-gradient-to-b from-[#00B1FF] to-[#0095dd] flex items-center justify-center active:scale-95 transition-transform"
                                style={{ boxShadow: '0 2px 4px rgba(0,177,255,0.4), inset 0 1px 0 rgba(255,255,255,0.3)' }}
                            >
                                <svg width="14" height="8" viewBox="0 0 14 8" fill="none" className={`text-white transition-transform duration-200 ${drawerExpanded ? 'rotate-180' : ''}`}>
                                    <path d="M1.5 6.5L7 1.5L12.5 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-slate-100" />

                {/* Collapsible Question Pills */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${drawerExpanded ? 'max-h-60' : 'max-h-14'}`}>
                    <div className="px-4 py-3 border-b border-slate-50">
                        <div className={`flex gap-2 max-w-3xl mx-auto ${drawerExpanded ? 'flex-wrap justify-center' : 'overflow-x-auto scrollbar-hide'}`}>
                            {wrongAnswers.map((_, idx) => {
                                const isActive = idx === currentIndex;
                                let buttonClass = "bg-slate-200 text-slate-400"; // Default
                                if (isActive) buttonClass = "bg-white text-[#00B1FF] border-2 border-[#00B1FF] shadow-sm";

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setCurrentIndex(idx);
                                            setShowAnswer(false);
                                        }}
                                        className={`w-9 h-9 rounded-xl flex-shrink-0 font-semibold text-[13px] transition-all flex items-center justify-center ${buttonClass}`}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Navigation Buttons */}
                <div className="px-4 py-3 flex gap-3 max-w-3xl mx-auto">
                    <button
                        onClick={goPrev}
                        disabled={currentIndex === 0}
                        className={`flex-1 py-3.5 rounded-xl font-semibold text-[15px] flex items-center justify-center gap-2 transition-all ${currentIndex === 0
                            ? 'bg-slate-100 text-slate-300'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-[0.98]'}`}
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Precedente
                    </button>

                    <button
                        onClick={goNext}
                        disabled={currentIndex === wrongAnswers.length - 1}
                        className={`flex-1 py-3.5 rounded-xl font-semibold text-[15px] flex items-center justify-center gap-2 transition-all ${currentIndex === wrongAnswers.length - 1
                            ? 'bg-slate-100 text-slate-300'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-[0.98]'}`}
                    >
                        Successiva
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
