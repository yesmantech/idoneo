"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { xpService } from "@/lib/xpService";
import { statsService } from "@/lib/statsService";
import { X, Settings, ChevronUp, ChevronLeft, ChevronRight, Check } from "lucide-react";

// Types
type RichAnswer = {
    questionId: string;
    text: string;
    subjectId: string;
    subjectName: string;
    selectedOption: string | null;
    correctOption: string | null;
    isCorrect: boolean;
    isSkipped: boolean;
    isLocked?: boolean;
    explanation?: string | null;
    options: { a: string; b: string; c: string; d: string };
};

// Helper to normalize DB answers for comparison
function normalizeDBAnswer(val: string | null | undefined): string | null {
    if (!val) return null;
    return val.replace(/[.,:;()\[\]]/g, "").trim().toLowerCase();
}

// =============================================================================
// QUIZ RUNNER PAGE - Idoneo Redesign
// =============================================================================
export default function QuizRunnerPage() {
    const { attemptId, id } = useParams<{ attemptId?: string; id?: string }>();
    const quizAttemptId = attemptId || id;
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Config from URL queries
    const timeLimitParam = searchParams.get("time");
    const pointsCorrect = parseFloat(searchParams.get("correct") || "1");
    const pointsWrong = parseFloat(searchParams.get("wrong") || "0");
    const pointsBlank = parseFloat(searchParams.get("blank") || "0");

    // State
    const [loading, setLoading] = useState(true);
    const [answering, setAnswering] = useState<RichAnswer[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [finished, setFinished] = useState(false);
    const [showTerminateConfirm, setShowTerminateConfirm] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [drawerExpanded, setDrawerExpanded] = useState(false);

    // Modes
    const [instantCheck, setInstantCheck] = useState(false);
    const [autoNext, setAutoNext] = useState(false);
    const [quizConfig, setQuizConfig] = useState<{
        useCustomPassThreshold: boolean;
        minCorrectForPass: number | null;
    } | null>(null);

    // Ref to hold latest answers
    const answeringRef = useRef<RichAnswer[]>([]);

    useEffect(() => {
        answeringRef.current = answering;
    }, [answering]);

    // Load attempt data
    useEffect(() => {
        if (!quizAttemptId) return;

        const load = async () => {
            const { data } = await supabase.from("quiz_attempts").select("*").eq("id", quizAttemptId).single();
            if (data) {
                let loadedAnswers = Array.isArray(data.answers) ? data.answers : [];

                const localBackup = localStorage.getItem(`quiz_progress_${quizAttemptId}`);
                if (localBackup) {
                    try {
                        const parsed = JSON.parse(localBackup);
                        if (Array.isArray(parsed) && parsed.length === loadedAnswers.length) {
                            loadedAnswers = parsed;
                        }
                    } catch (e) {
                        console.error("LocalStorage parse error", e);
                    }
                }

                const qIds = loadedAnswers.map((a: any) => a.questionId);
                if (qIds.length > 0) {
                    const { data: freshQuestions } = await supabase
                        .from('questions')
                        .select('id, explanation')
                        .in('id', qIds);

                    if (freshQuestions) {
                        loadedAnswers = loadedAnswers.map((a: any) => {
                            const fresh = freshQuestions.find(q => q.id === a.questionId);
                            return { ...a, explanation: fresh?.explanation || null };
                        });
                    }
                }

                setAnswering(loadedAnswers);
                answeringRef.current = loadedAnswers;

                const { data: quizData } = await supabase
                    .from('quizzes')
                    .select('use_custom_pass_threshold, min_correct_for_pass')
                    .eq('id', data.quiz_id)
                    .single();

                if (quizData) {
                    setQuizConfig({
                        useCustomPassThreshold: quizData.use_custom_pass_threshold,
                        minCorrectForPass: quizData.min_correct_for_pass
                    });
                }
            }
            setLoading(false);
        };
        load();
    }, [quizAttemptId]);

    // Timer
    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

    useEffect(() => {
        if (timeLimitParam) {
            const minutes = parseFloat(timeLimitParam);
            if (minutes > 0) {
                setRemainingSeconds(Math.ceil(minutes * 60));
            } else {
                setRemainingSeconds(null);
            }
        }
    }, [timeLimitParam]);

    useEffect(() => {
        if (remainingSeconds === null || finished) return;
        if (remainingSeconds <= 0) {
            handleFinish();
            return;
        }
        const timer = setInterval(() => {
            setRemainingSeconds(p => (p !== null && p > 0 ? p - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [remainingSeconds, finished]);

    // Action-based AutoNext tracking using State to ensure re-renders/effects fire reliably
    const [lastAutoAdvanceTime, setLastAutoAdvanceTime] = useState<number>(0);
    // Track processed time to avoid re-running effect or clearing timeout on re-renders
    const lastProcessedTimeRef = useRef<number>(0);

    // AutoNext effect - reacts to the timestamp update from handleSelect
    useEffect(() => {
        if (!autoNext || finished || lastAutoAdvanceTime === 0) return;

        // Only run if this is a NEW event we haven't processed yet
        if (lastAutoAdvanceTime > lastProcessedTimeRef.current) {
            lastProcessedTimeRef.current = lastAutoAdvanceTime;

            const delay = instantCheck ? 1200 : 400;
            const timeout = setTimeout(() => {
                setCurrentIndex(prevIndex => {
                    if (prevIndex < answering.length - 1) {
                        return prevIndex + 1;
                    }
                    return prevIndex;
                });
            }, delay);
            return () => clearTimeout(timeout);
        }
    }, [lastAutoAdvanceTime, autoNext, finished, instantCheck, answering.length]);

    const handleSelect = useCallback((opt: string) => {
        if (finished) return;
        const currentList = answeringRef.current.length > 0 ? answeringRef.current : answering;
        const currentQ = currentList[currentIndex];

        if (!currentQ || currentQ.isLocked) return;

        // AutoNext Logic:
        // 1. AutoNext is enabled
        // 2. The question currently has NO answer (first time answering)
        if (autoNext && currentQ.selectedOption === null) {
            setLastAutoAdvanceTime(Date.now());
        }

        const nextList = [...currentList];
        const normalizedCorrect = normalizeDBAnswer(currentQ.correctOption);
        const shouldLock = instantCheck;

        nextList[currentIndex] = {
            ...currentQ,
            selectedOption: opt,
            isCorrect: opt === normalizedCorrect,
            isSkipped: false,
            isLocked: shouldLock
        };

        answeringRef.current = nextList;
        setAnswering(nextList);

        if (quizAttemptId) {
            localStorage.setItem(`quiz_progress_${quizAttemptId}`, JSON.stringify(nextList));
        }
    }, [finished, currentIndex, instantCheck, quizAttemptId, answering, autoNext]);

    const handleFinish = async () => {
        if (finished || !quizAttemptId) return;
        setFinished(true);

        let finalAnswersSource = answeringRef.current.length > 0 ? answeringRef.current : answering;
        const localBackup = localStorage.getItem(`quiz_progress_${quizAttemptId}`);
        if (localBackup) {
            try {
                const parsed = JSON.parse(localBackup);
                if (Array.isArray(parsed) && parsed.length === finalAnswersSource.length) {
                    finalAnswersSource = parsed;
                }
            } catch (e) {
                console.error("Finish LS Parse Error", e);
            }
        }

        let correct = 0, wrong = 0, blank = 0;
        let score = 0;

        const finalAnswers = finalAnswersSource.map(a => {
            const normalizedCorrect = normalizeDBAnswer(a.correctOption);
            const normalizedSelected = normalizeDBAnswer(a.selectedOption);
            const isCorrect = normalizedSelected !== null && normalizedSelected === normalizedCorrect;
            if (a.selectedOption === null) {
                blank++;
                score += pointsBlank;
            } else if (isCorrect) {
                correct++;
                score += pointsCorrect;
            } else {
                wrong++;
                score += pointsWrong;
            }
            return { ...a, isCorrect, isSkipped: a.selectedOption === null };
        });

        score = Math.round(score * 100) / 100;

        const { error } = await supabase.from("quiz_attempts").update({
            finished_at: new Date().toISOString(),
            score,
            correct,
            wrong,
            blank,
            answers: finalAnswers,
            duration_seconds: remainingSeconds !== null ? (parseFloat(timeLimitParam || "0") * 60 - remainingSeconds) : 0,
            is_idoneo: quizConfig?.useCustomPassThreshold ? correct >= (quizConfig.minCorrectForPass || 0) : null,
            pass_threshold: quizConfig?.useCustomPassThreshold ? quizConfig.minCorrectForPass : null,
        }).eq("id", quizAttemptId);

        if (error) {
            console.error("Save error:", error);
            alert(`Errore salvataggio: ${error.message}`);
            return;
        }

        // TRIGGER UPDATES (Fire and forget, or await if critical)
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // 1. Award XP
                await xpService.awardXpForAttempt(quizAttemptId, user.id);

                // 2. Update Goals
                // We need the quiz_id from original data or we can fetch it. 
                // Since we don't have quiz_id in scope easily without fetching, let's fetch it or rely on loading state
                // Actually `data` (line 73) was local scope. 
                // Let's refetch minimal data or just pass it if we store it.
                // Simpler: fetch quiz_id from the attempt we just updated/read?
                // Actually, let's just do a quick fetch since we need it for goals.
                const { data: currentAttempt } = await supabase
                    .from('quiz_attempts')
                    .select('quiz_id')
                    .eq('id', quizAttemptId)
                    .single();

                if (currentAttempt?.quiz_id) {
                    await statsService.updateGoals(user.id, currentAttempt.quiz_id, {
                        score,
                        correct,
                        total: finalAnswers.length
                    });
                }
            }
        } catch (err) {
            console.error("Post-finish updates error:", err);
        }

        localStorage.removeItem(`quiz_progress_${quizAttemptId}`);
        navigate(`/quiz/results/${quizAttemptId}`);
    };

    const formatTime = (seconds: number | null) => {
        if (seconds === null) return "∞";
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    // Timer color states
    const getTimerColor = () => {
        if (remainingSeconds === null) return "text-slate-600";
        if (remainingSeconds < 60) return "text-red-500";
        if (remainingSeconds < 300) return "text-amber-500";
        return "text-slate-600";
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#00B1FF] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const currentQ = answering[currentIndex];
    if (!currentQ) return <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">Errore dati</div>;

    const isLocked = currentQ.isLocked || false;
    const normalizedCorrect = normalizeDBAnswer(currentQ.correctOption);

    return (
        <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
            {/* ============================================================= */}
            {/* TOP BAR */}
            {/* ============================================================= */}
            <header className="sticky top-0 z-50 bg-white border-b border-slate-100">
                <div className="h-14 px-4 flex items-center justify-between max-w-3xl mx-auto">
                    {/* Left: Close */}
                    <Link
                        to="/"
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-600" />
                    </Link>

                    {/* Center: Timer & Progress */}
                    <div className="flex flex-col items-center">
                        <span className={`font-mono font-bold text-xl ${getTimerColor()}`}>
                            {formatTime(remainingSeconds)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                            Domanda {currentIndex + 1}/{answering.length}
                        </span>
                    </div>

                    {/* Right: Mode Toggle + Settings */}
                    <div className="flex items-center gap-2">
                        {/* Mode Toggle */}
                        <div className="hidden sm:flex items-center bg-slate-100 rounded-full p-0.5">
                            <button
                                onClick={() => setInstantCheck(!instantCheck)}
                                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${instantCheck
                                    ? 'bg-white text-[#00B1FF] shadow-sm'
                                    : 'text-slate-500'
                                    }`}
                            >
                                Check
                            </button>
                            <button
                                onClick={() => setAutoNext(!autoNext)}
                                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${autoNext
                                    ? 'bg-white text-[#00B1FF] shadow-sm'
                                    : 'text-slate-500'
                                    }`}
                            >
                                Auto
                            </button>
                        </div>

                        {/* Settings */}
                        <button
                            onClick={() => setShowSettings(true)}
                            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
                        >
                            <Settings className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>
                </div>
            </header>

            {/* ============================================================= */}
            {/* QUESTION CONTENT */}
            {/* ============================================================= */}
            <main className="flex-1 px-5 py-6 max-w-3xl mx-auto w-full pb-48">
                {/* Question Meta */}
                <div className="mb-3">
                    <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider">
                        {currentIndex + 1} / {answering.length} • {currentQ.subjectName}
                    </span>
                </div>

                {/* Question Text */}
                <h2 className="text-[20px] font-bold text-slate-900 leading-[1.4] mb-8">
                    {currentQ.text}
                </h2>

                {/* Lock indicator */}
                {isLocked && (
                    <div className="mb-4 flex items-center gap-2 text-[12px] font-semibold text-amber-600">
                        <span>🔒</span> Risposta bloccata
                    </div>
                )}

                {/* Answer Options */}
                <div className="space-y-3">
                    {['a', 'b', 'c', 'd'].map(optKey => {
                        const optText = (currentQ.options as any)[optKey];
                        if (!optText) return null;

                        const isSelected = currentQ.selectedOption === optKey;
                        const isCorrectAnswer = optKey === normalizedCorrect;
                        const isDisabled = isLocked;

                        // Determine styling
                        let cardStyle = "bg-white border-slate-200";
                        let badgeStyle = "bg-slate-100 text-slate-500";
                        let textStyle = "text-slate-700";

                        if (isLocked) {
                            if (isCorrectAnswer) {
                                cardStyle = "bg-emerald-50 border-emerald-500";
                                badgeStyle = "bg-emerald-500 text-white";
                                textStyle = "text-emerald-700";
                            } else if (isSelected) {
                                cardStyle = "bg-red-50 border-red-500";
                                badgeStyle = "bg-red-500 text-white";
                                textStyle = "text-red-700";
                            } else {
                                cardStyle = "bg-slate-50 border-slate-100 opacity-50";
                            }
                        } else if (isSelected) {
                            cardStyle = "bg-[#00B1FF]/5 border-[#00B1FF]";
                            badgeStyle = "bg-[#00B1FF] text-white";
                            textStyle = "text-[#00B1FF]";
                        }

                        return (
                            <button
                                key={optKey}
                                onClick={() => !isDisabled && handleSelect(optKey)}
                                disabled={isDisabled}
                                className={`w-full p-4 rounded-2xl border-2 flex items-start gap-4 text-left transition-all duration-200 ${cardStyle} ${!isDisabled ? 'hover:shadow-md active:scale-[0.99]' : ''
                                    }`}
                            >
                                {/* Letter Badge */}
                                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-bold flex-shrink-0 ${badgeStyle}`}>
                                    {optKey.toUpperCase()}
                                </span>

                                {/* Answer Text */}
                                <span className={`text-[15px] leading-relaxed flex-1 ${textStyle}`}>
                                    {optText}
                                </span>

                                {/* Feedback icon */}
                                {isLocked && isCorrectAnswer && (
                                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                )}
                                {isLocked && isSelected && !isCorrectAnswer && (
                                    <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Explanation */}
                {isLocked && instantCheck && currentQ.explanation && (
                    <div className="mt-6 bg-white rounded-2xl p-5 border border-[#00B1FF]/20">
                        <h4 className="text-[12px] font-bold text-[#00B1FF] uppercase tracking-wider mb-2">
                            Spiegazione
                        </h4>
                        <p className="text-[14px] text-slate-600 leading-relaxed">
                            {currentQ.explanation}
                        </p>
                    </div>
                )}
            </main>

            {/* ============================================================= */}
            {/* BOTTOM NAVIGATOR */}
            {/* ============================================================= */}
            <div className="fixed bottom-0 left-0 right-0 bg-white pb-safe z-40">
                {/* Raised Tab / Drawer Handle */}
                <div className="relative flex justify-center">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                        {/* Rounded trapezoid tab */}
                        <div className="relative w-28 h-8">
                            {/* SVG: Rounded top corners, angled sides, flat bottom */}
                            <svg
                                className="absolute inset-0 w-full h-full"
                                viewBox="0 0 112 32"
                                fill="none"
                                style={{ filter: 'drop-shadow(0 -2px 8px rgba(0,0,0,0.1))' }}
                            >
                                {/* Outer white shape */}
                                <path
                                    d="M10 32 L18 8 C20 3 24 0 30 0 L82 0 C88 0 92 3 94 8 L102 32 Z"
                                    fill="white"
                                />
                            </svg>
                            {/* Inner cyan button */}
                            <button
                                onClick={() => setDrawerExpanded(!drawerExpanded)}
                                className="absolute left-1/2 -translate-x-1/2 top-2 w-16 h-5 rounded-md bg-gradient-to-b from-[#00B1FF] to-[#0095dd] flex items-center justify-center active:scale-95 transition-transform"
                                style={{
                                    boxShadow: '0 2px 4px rgba(0,177,255,0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
                                }}
                            >
                                <svg
                                    width="14"
                                    height="8"
                                    viewBox="0 0 14 8"
                                    fill="none"
                                    className={`text-white transition-transform duration-200 ${drawerExpanded ? 'rotate-180' : ''}`}
                                >
                                    <path d="M1.5 6.5L7 1.5L12.5 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Border line */}
                <div className="h-px bg-slate-100" />

                {/* Collapsible Question Pills */}
                <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${drawerExpanded ? 'max-h-60' : 'max-h-14'
                        }`}
                >
                    <div className="px-4 py-3 border-b border-slate-50">
                        <div className={`flex gap-2 max-w-3xl mx-auto ${drawerExpanded
                            ? 'flex-wrap justify-center'
                            : 'overflow-x-auto scrollbar-hide'
                            }`}>
                            {answering.map((ans, idx) => {
                                const isActive = idx === currentIndex;
                                const hasAnswer = ans.selectedOption !== null;

                                let buttonClass = "bg-slate-200 text-slate-400"; // Default: Unanswered (Grey)

                                if (isActive) {
                                    // Current: Blue Outline ("corners only")
                                    buttonClass = "bg-white text-[#00B1FF] border-2 border-[#00B1FF] shadow-sm";
                                } else if (hasAnswer) {
                                    // Answered: Solid Blue
                                    buttonClass = "bg-[#00B1FF] text-white shadow-sm";
                                }

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentIndex(idx)}
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
                        onClick={() => setCurrentIndex(p => Math.max(0, p - 1))}
                        disabled={currentIndex === 0}
                        className={`flex-1 py-3.5 rounded-xl font-semibold text-[15px] flex items-center justify-center gap-2 transition-all ${currentIndex === 0
                            ? 'bg-slate-100 text-slate-300'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-[0.98]'
                            }`}
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Precedente
                    </button>

                    {currentIndex === answering.length - 1 ? (
                        <button
                            onClick={() => setShowTerminateConfirm(true)}
                            className="flex-1 py-3.5 rounded-xl font-semibold text-[15px] bg-red-500 text-white hover:bg-red-600 active:scale-[0.98] transition-all"
                        >
                            Termina Quiz
                        </button>
                    ) : (
                        <button
                            onClick={() => setCurrentIndex(p => Math.min(answering.length - 1, p + 1))}
                            className="flex-1 py-3.5 rounded-xl font-semibold text-[15px] bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            Successiva
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* ============================================================= */}
            {/* SETTINGS MODAL */}
            {/* ============================================================= */}
            {showSettings && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowSettings(false)} />
                    <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm p-6 animate-in slide-in-from-bottom duration-300">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">Impostazioni</h3>

                        <div className="space-y-4">
                            {/* Instant Check */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-slate-900">Verifica Istantanea</p>
                                    <p className="text-[13px] text-slate-500">Mostra risposta corretta subito</p>
                                </div>
                                <button
                                    onClick={() => setInstantCheck(!instantCheck)}
                                    className={`w-12 h-7 rounded-full transition-colors ${instantCheck ? 'bg-[#00B1FF]' : 'bg-slate-200'}`}
                                >
                                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${instantCheck ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            {/* Auto Next */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-slate-900">Auto Successiva</p>
                                    <p className="text-[13px] text-slate-500">Passa alla domanda successiva</p>
                                </div>
                                <button
                                    onClick={() => setAutoNext(!autoNext)}
                                    className={`w-12 h-7 rounded-full transition-colors ${autoNext ? 'bg-[#00B1FF]' : 'bg-slate-200'}`}
                                >
                                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${autoNext ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowSettings(false)}
                            className="w-full mt-6 py-3 bg-slate-100 text-slate-600 font-semibold rounded-xl"
                        >
                            Chiudi
                        </button>
                    </div>
                </div>
            )}

            {/* ============================================================= */}
            {/* TERMINATE CONFIRMATION */}
            {/* ============================================================= */}
            {showTerminateConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowTerminateConfirm(false)} />
                    <div className="relative bg-white rounded-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold text-slate-900 text-center mb-2">
                            Terminare il quiz?
                        </h3>
                        <p className="text-slate-500 text-center text-[14px] mb-6">
                            Verranno salvate tutte le risposte date finora.
                        </p>

                        <button
                            onClick={handleFinish}
                            className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors"
                        >
                            Termina Quiz
                        </button>

                        <button
                            onClick={() => setShowTerminateConfirm(false)}
                            className="w-full mt-3 py-3 text-slate-500 font-medium"
                        >
                            Continua
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
