"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { xpService } from "@/lib/xpService";
import { statsService } from "@/lib/statsService";
import { leaderboardService } from "@/lib/leaderboardService";
import { badgeService } from "@/lib/badgeService";
import { offlineService } from "@/lib/offlineService"; // IMPORT OFFLINE SERVICE
import { useOnboarding } from "@/context/OnboardingProvider";
import TierSLoader from "@/components/ui/TierSLoader";
import { AnimatePresence } from "framer-motion";
import { X, Settings, ChevronUp, ChevronLeft, ChevronRight, Check, Flag, AlertTriangle } from "lucide-react";

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
    const [isSaving, setIsSaving] = useState(false); // Tier S loader state
    const [showExitConfirm, setShowExitConfirm] = useState(false); // X button exit
    const [showTerminateConfirm, setShowTerminateConfirm] = useState(false); // Termina Quiz button
    const [showSettings, setShowSettings] = useState(false);
    const [drawerExpanded, setDrawerExpanded] = useState(false);

    // Report State
    const [showReportModal, setShowReportModal] = useState(false);
    const [showReportSuccess, setShowReportSuccess] = useState(false); // New Success Modal State
    const [reportReason, setReportReason] = useState<string>("");
    const [reportDescription, setReportDescription] = useState("");
    const [isReporting, setIsReporting] = useState(false);

    // Modes - Load from localStorage for persistence
    const [instantCheck, setInstantCheck] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('quiz_instant_check') === 'true';
        }
        return false;
    });
    const [autoNext, setAutoNext] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('quiz_auto_next') === 'true';
        }
        return false;
    });
    const [quizConfig, setQuizConfig] = useState<{
        useCustomPassThreshold: boolean;
        minCorrectForPass: number | null;
    } | null>(null);

    // Persist settings to localStorage
    useEffect(() => {
        localStorage.setItem('quiz_instant_check', String(instantCheck));
    }, [instantCheck]);

    useEffect(() => {
        localStorage.setItem('quiz_auto_next', String(autoNext));
    }, [autoNext]);

    // Ref to hold latest answers
    const answeringRef = useRef<RichAnswer[]>([]);

    useEffect(() => {
        answeringRef.current = answering;
    }, [answering]);

    // Onboarding for Quiz Runner
    const { startOnboarding, hasCompletedContext } = useOnboarding();

    useEffect(() => {
        if (!loading && answering.length > 0 && !hasCompletedContext('quiz')) {
            const timer = setTimeout(() => startOnboarding('quiz'), 800);
            return () => clearTimeout(timer);
        }
    }, [loading, answering.length, hasCompletedContext, startOnboarding]);

    // Load attempt data
    useEffect(() => {
        if (!quizAttemptId) return;

        const load = async () => {
            // Check for Offline Attempt
            if (quizAttemptId.startsWith('local-')) {
                try {
                    const localData = await offlineService.getLocalAttempt(quizAttemptId);
                    if (localData) {
                        // Map local answers to RichAnswer
                        let loadedAnswers: RichAnswer[] = localData.answers.map((a: any) => ({
                            questionId: a.questionId,
                            text: a.text,
                            subjectId: a.subjectId || "",
                            subjectName: a.subjectName || "Materia", // Fallback
                            selectedOption: a.selectedOption,
                            correctOption: a.correctOption,
                            isCorrect: false, // Calc dynamically or stored
                            isSkipped: false,
                            isLocked: false,
                            explanation: a.explanation,
                            options: a.options
                        }));

                        // Local Storage Backup
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

                        setAnswering(loadedAnswers);
                        answeringRef.current = loadedAnswers;
                        setLoading(false);
                        return; // Exit early
                    } else {
                        alert("Sessione offline non trovata.");
                        navigate(-1);
                        return;
                    }
                } catch (e) {
                    console.error("Offline load error", e);
                    setLoading(false);
                    return;
                }
            }

            // Online Loading from Supabase
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
    }, [quizAttemptId, navigate]);

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



    const handleReport = async () => {
        if (!reportReason) return alert("Seleziona una motivazione.");

        console.log("Starting report process...");
        // DEBUG: Check answering ref
        const currentQ = answeringRef.current.length > 0 ? answeringRef.current[currentIndex] : answering[currentIndex];
        console.log("Current Question:", currentQ);

        if (!currentQ) {
            alert("Errore: Impossibile identificare la domanda corrente.");
            return;
        }

        setIsReporting(true);
        try {
            console.log("Checking auth...");
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
                console.error("Auth Error:", authError);
                throw new Error("Devi essere loggato per inviare segnalazioni.");
            }
            console.log("User found:", user.id);

            const payload = {
                user_id: user.id,
                question_id: currentQ.questionId,
                reason: reportReason,
                description: reportDescription || "", // Ensure not undefined
                status: 'pending'
            };
            console.log("Sending payload:", payload);

            const { data, error } = await supabase.from('question_reports').insert(payload).select();

            if (error) {
                console.error("Supabase Level Error:", error);
                throw error;
            }

            console.log("Success! Data:", data);

            // Success feedback
            setShowReportModal(false);
            setReportReason("");
            setReportDescription("");
            setShowSettings(false);
            setShowReportSuccess(true);
        } catch (e: any) {
            console.error("Report Catch Error:", e);
            alert(`Errore Invio: ${e.message || JSON.stringify(e)}`);
        } finally {
            setIsReporting(false);
        }
    };

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

    // Auto-scroll effect for question navigator
    useEffect(() => {
        const activeBtn = document.getElementById(`question-nav-${currentIndex}`);
        if (activeBtn) {
            activeBtn.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
            });
        }
    }, [currentIndex, drawerExpanded]);

    const handleFinish = async () => {
        if (finished || !quizAttemptId) return;
        setFinished(true);
        setIsSaving(true); // Show Tier S Loader

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

        // OFFLINE SAVE
        if (quizAttemptId.startsWith('local-')) {
            try {
                // Get existing to preserve metadata
                const existing = await offlineService.getLocalAttempt(quizAttemptId);
                const updated = {
                    ...existing,
                    finished_at: new Date().toISOString(),
                    score,
                    correct,
                    wrong,
                    blank,
                    answers: finalAnswers, // This saves the selection state
                    duration_seconds: remainingSeconds !== null ? (parseFloat(timeLimitParam || "0") * 60 - remainingSeconds) : 0,
                    is_idoneo: quizConfig?.useCustomPassThreshold ? correct >= (quizConfig.minCorrectForPass || 0) : null,
                    pass_threshold: quizConfig?.useCustomPassThreshold ? quizConfig.minCorrectForPass : null,
                };

                await offlineService.savePendingAttempt(updated);

                localStorage.removeItem(`quiz_progress_${quizAttemptId}`);

                // If we are Online, we could try to sync immediately? 
                // Or just navigate to results which should handle local ID.
                // syncing happens elsewhere or on user action.

                navigate(`/quiz/results/${quizAttemptId}`);
                return;
            } catch (e) {
                console.error("Local save error", e);
                alert("Errore salvataggio locale.");
                return;
            }
        }

        // ONLINE SAVE
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

                    // 3. Update Leaderboard
                    await leaderboardService.updateUserScore(user.id, currentAttempt.quiz_id);

                    // 4. Check & Award Badges
                    await badgeService.checkAndAwardBadges(user.id);
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
        return <TierSLoader message="Caricamento quiz..." />;
    }

    const currentQ = answering[currentIndex];
    if (!currentQ) return <div className="min-h-screen bg-[var(--background)] flex items-center justify-center text-[var(--foreground)]">Errore dati</div>;

    const isLocked = currentQ.isLocked || false;
    const normalizedCorrect = normalizeDBAnswer(currentQ.correctOption);

    return (
        <>
            {/* Tier S Loader */}
            <AnimatePresence>
                {isSaving && (
                    <TierSLoader
                        message="Salvataggio in corso..."
                        submessage="Attendi qualche secondo"
                    />
                )}
            </AnimatePresence>

            <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col transition-colors duration-500">
                {/* ============================================================= */}
                {/* TOP BAR */}
                {/* ============================================================= */}
                <header className="sticky top-0 z-50 bg-[var(--card)] border-b border-[var(--card-border)] pt-safe">
                    <div className="h-14 px-4 flex items-center justify-between max-w-3xl mx-auto">
                        {/* Left: Close */}
                        <button
                            onClick={() => setShowExitConfirm(true)}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            <X className="w-5 h-5 text-[var(--foreground)] opacity-50" />
                        </button>

                        {/* Center: Timer & Progress */}
                        <div data-onboarding="timer" className="flex flex-col items-center">
                            <span className={`font-mono font-bold text-xl ${getTimerColor()}`}>
                                {formatTime(remainingSeconds)}
                            </span>
                            <span className="text-[10px] text-[var(--foreground)] opacity-40 font-semibold uppercase tracking-wider">
                                Domanda {currentIndex + 1}/{answering.length}
                            </span>
                        </div>

                        {/* Right: Mode Toggle + Settings */}
                        <div className="flex items-center gap-2">
                            {/* Mode Toggle */}
                            <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 rounded-full p-0.5">
                                <button
                                    onClick={() => setInstantCheck(!instantCheck)}
                                    className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${instantCheck
                                        ? 'bg-white dark:bg-slate-700 text-[#00B1FF] shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400'
                                        }`}
                                >
                                    Check
                                </button>
                                <button
                                    onClick={() => setAutoNext(!autoNext)}
                                    className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${autoNext
                                        ? 'bg-white dark:bg-slate-700 text-[#00B1FF] shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400'
                                        }`}
                                >
                                    Auto
                                </button>
                            </div>

                            {/* Settings */}
                            <button
                                data-onboarding="settings"
                                onClick={() => setShowSettings(true)}
                                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <Settings className="w-5 h-5 text-[var(--foreground)] opacity-30" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* ============================================================= */}
                {/* QUESTION CONTENT */}
                {/* ============================================================= */}
                <main className="flex-1 px-5 py-6 max-w-3xl mx-auto w-full pb-36">
                    {/* Question Meta */}
                    <div className="mb-3">
                        <span className="text-[12px] font-semibold text-[var(--foreground)] opacity-40 uppercase tracking-wider">
                            {currentIndex + 1} / {answering.length} • {currentQ.subjectName}
                        </span>
                    </div>

                    {/* Question Text */}
                    <h2 className="text-[20px] font-bold text-[var(--foreground)] leading-[1.4] mb-8">
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
                            let cardStyle = "bg-[var(--card)] border-[var(--card-border)]";
                            let badgeStyle = "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400";
                            let textStyle = "text-[var(--foreground)] opacity-80";

                            if (isLocked) {
                                if (isCorrectAnswer) {
                                    cardStyle = "bg-emerald-50 border-emerald-500";
                                    badgeStyle = "bg-emerald-500 text-white";
                                    textStyle = "text-emerald-700";
                                } else if (isSelected) {
                                    cardStyle = "bg-red-50 dark:bg-red-900/20 border-red-500";
                                    badgeStyle = "bg-red-500 text-white";
                                    textStyle = "text-red-700 dark:text-red-400";
                                } else {
                                    cardStyle = "bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 opacity-50";
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
                        <div className="mt-6 bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-5 shadow-sm">
                            <h4 className="text-[12px] font-bold text-[#00B1FF] uppercase tracking-wider mb-2">
                                Spiegazione
                            </h4>
                            <p className="text-[14px] text-[var(--foreground)] opacity-70 leading-relaxed">
                                {currentQ.explanation}
                            </p>
                        </div>
                    )}
                </main>

                {/* ============================================================= */}
                {/* BOTTOM NAVIGATOR */}
                {/* ============================================================= */}
                <div className="fixed bottom-0 left-0 right-0 bg-[var(--card)] border-t border-[var(--card-border)] pb-safe z-40 transition-colors">
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
                                        fill="var(--card)"
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
                    <div className="h-px bg-slate-100 dark:bg-slate-800" />

                    {/* Collapsible Question Pills */}
                    <div
                        data-onboarding="navigation"
                        className={`transition-all duration-300 ease-in-out ${drawerExpanded ? 'max-h-[50vh] overflow-y-auto' : 'max-h-20 overflow-hidden'
                            }`}
                    >
                        <div className="px-4 py-1 border-b border-slate-50 dark:border-slate-800">
                            <div className={`flex gap-2 py-2 max-w-3xl mx-auto ${drawerExpanded
                                ? 'flex-wrap justify-center px-1'
                                : 'overflow-x-auto scrollbar-hide pl-1'
                                }`}>
                                {answering.map((ans, idx) => {
                                    const isActive = idx === currentIndex;
                                    const hasAnswer = ans.selectedOption !== null;

                                    let buttonClass = "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-200"; // Default: Unanswered (Grey)

                                    if (isActive) {
                                        // Current: Blue Outline ("corners only")
                                        buttonClass = "bg-white dark:bg-slate-900 text-[#00B1FF] border-2 border-[#00B1FF] shadow-sm scale-110 z-10";
                                    } else if (hasAnswer) {
                                        // Answered: Solid Blue
                                        buttonClass = "bg-[#00B1FF] text-white shadow-sm";
                                    }

                                    return (
                                        <button
                                            key={idx}
                                            id={`question-nav-${idx}`}
                                            onClick={() => setCurrentIndex(idx)}
                                            className={`w-9 h-9 rounded-squircle flex-shrink-0 font-semibold text-[13px] transition-all flex items-center justify-center ${buttonClass}`}
                                        >
                                            {idx + 1}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Navigation Buttons - Show Termina when drawer expanded */}
                    <div className="px-4 py-3 flex gap-3 max-w-3xl mx-auto">
                        {drawerExpanded ? (
                            <button
                                onClick={() => {
                                    setDrawerExpanded(false);
                                    setShowTerminateConfirm(true);
                                }}
                                className="flex-1 py-3.5 rounded-xl font-semibold text-[15px] bg-red-500 text-white hover:bg-red-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                <X className="w-4 h-4" />
                                Termina Quiz
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => setCurrentIndex(p => Math.max(0, p - 1))}
                                    disabled={currentIndex === 0}
                                    className={`flex-1 py-3.5 rounded-xl font-semibold text-[15px] flex items-center justify-center gap-2 transition-all ${currentIndex === 0
                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.98]'
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
                                        className="flex-1 py-3.5 rounded-xl font-semibold text-[15px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    >
                                        Successiva
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* ============================================================= */}
                {/* SETTINGS MODAL */}
                {/* ============================================================= */}
                {showSettings && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
                        <div className="relative bg-[var(--card)] border border-[var(--card-border)] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm p-6 animate-in slide-in-from-bottom duration-300">
                            <h3 className="text-lg font-bold text-[var(--foreground)] mb-6">Impostazioni</h3>

                            <div className="space-y-4">
                                {/* Instant Check */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-[var(--foreground)]">Verifica Istantanea</p>
                                        <p className="text-[13px] text-[var(--foreground)] opacity-50">Mostra risposta corretta subito</p>
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
                                        <p className="font-semibold text-[var(--foreground)]">Auto Successiva</p>
                                        <p className="text-[13px] text-[var(--foreground)] opacity-50">Passa alla domanda successiva</p>
                                    </div>
                                    <button
                                        onClick={() => setAutoNext(!autoNext)}
                                        className={`w-12 h-7 rounded-full transition-colors ${autoNext ? 'bg-[#00B1FF]' : 'bg-slate-200 dark:bg-slate-700'}`}
                                    >
                                        <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${autoNext ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>

                                {/* Report Button */}
                                <div className="pt-4 border-t border-[var(--card-border)]">
                                    <button
                                        onClick={() => setShowReportModal(true)}
                                        className="w-full py-3 flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        <Flag className="w-4 h-4" />
                                        Segnala un errore
                                    </button>
                                </div>


                            </div>

                            <button
                                onClick={() => setShowSettings(false)}
                                className="w-full mt-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold rounded-xl"
                            >
                                Chiudi
                            </button>
                        </div>
                    </div>
                )}

                {/* ============================================================= */}
                {/* REPORT MODAL */}
                {/* ============================================================= */}
                {showReportModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowReportModal(false)} />
                        <div className="relative bg-[var(--card)] border border-[var(--card-border)] rounded-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                                </div>
                                <h3 className="text-lg font-bold text-[var(--foreground)]">Segnala Errore</h3>
                            </div>

                            <p className="text-sm text-[var(--foreground)] opacity-60 mb-4">
                                Aiutaci a migliorare. Qual è il problema con questa domanda?
                            </p>

                            <div className="space-y-3 mb-6">
                                {[
                                    "Risposta errata",
                                    "Domanda malformata",
                                    "Typos o errori grammaticali",
                                    "Altro"
                                ].map((r) => (
                                    <button
                                        key={r}
                                        onClick={() => setReportReason(r)}
                                        className={`w-full p-3 rounded-xl text-left text-sm font-medium transition-all ${reportReason === r
                                            ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border border-amber-200 dark:border-amber-800'
                                            : 'bg-slate-50 dark:bg-slate-800 text-[var(--foreground)] border border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>

                            <textarea
                                value={reportDescription}
                                onChange={(e) => setReportDescription(e.target.value)}
                                placeholder="Dettagli aggiuntivi (opzionale)..."
                                className="w-full mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm text-[var(--foreground)] focus:ring-2 focus:ring-amber-500 min-h-[80px]"
                            />

                            <button
                                onClick={handleReport}
                                disabled={isReporting || !reportReason}
                                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors"
                            >
                                {isReporting ? "Invio..." : "Invia Segnalazione"}
                            </button>

                            <button
                                onClick={() => setShowReportModal(false)}
                                className="w-full mt-3 py-3 text-[var(--foreground)] opacity-50 font-medium text-sm"
                            >
                                Annulla
                            </button>
                        </div>
                    </div>
                )}

                {/* ============================================================= */}
                {/* REPORT SUCCESS MODAL */}
                {/* ============================================================= */}
                {showReportSuccess && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowReportSuccess(false)} />
                        <div className="relative bg-[var(--card)] border border-[var(--card-border)] rounded-2xl w-full max-w-sm p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
                            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
                                <Check className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h3 className="text-xl font-black text-[var(--foreground)] mb-2">Segnalazione Inviata</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-6">
                                Grazie per il tuo contributo! Analizzeremo la tua segnalazione al più presto.
                            </p>
                            <button
                                onClick={() => setShowReportSuccess(false)}
                                className="w-full py-3.5 bg-[#00B1FF] hover:bg-[#0095dd] text-white font-bold rounded-xl transition-colors shadow-lg shadow-[#00B1FF]/20"
                            >
                                Chiudi
                            </button>
                        </div>
                    </div>
                )}

                {/* ============================================================= */}
                {/* EXIT CONFIRMATION (X Button) */}
                {/* ============================================================= */}
                {showExitConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowExitConfirm(false)} />
                        <div className="relative bg-[var(--card)] border border-[var(--card-border)] rounded-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
                            <h3 className="text-lg font-bold text-[var(--foreground)] text-center mb-2">
                                Vuoi abbandonare il quiz?
                            </h3>
                            <p className="text-[var(--foreground)] opacity-50 text-center text-[14px] mb-6">
                                Se esci senza salvare, tutte le risposte andranno perse e il tentativo non verrà registrato.
                            </p>

                            <button
                                onClick={handleFinish}
                                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors"
                            >
                                Salva e Termina
                            </button>

                            <button
                                onClick={() => navigate('/')}
                                className="w-full mt-3 py-3 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 font-semibold rounded-xl hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors"
                            >
                                Esci senza salvare
                            </button>

                            <button
                                onClick={() => setShowExitConfirm(false)}
                                className="w-full mt-3 py-3 text-[var(--foreground)] opacity-50 font-medium"
                            >
                                Continua il quiz
                            </button>
                        </div>
                    </div>
                )}

                {/* ============================================================= */}
                {/* TERMINATE CONFIRMATION (Termina Quiz Button) */}
                {/* ============================================================= */}
                {showTerminateConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowTerminateConfirm(false)} />
                        <div className="relative bg-[var(--card)] border border-[var(--card-border)] rounded-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
                            <h3 className="text-lg font-bold text-[var(--foreground)] text-center mb-2">
                                Terminare il quiz?
                            </h3>
                            <p className="text-[var(--foreground)] opacity-50 text-center text-[14px] mb-6">
                                Verranno salvate tutte le risposte date finora.
                            </p>

                            <button
                                onClick={handleFinish}
                                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors"
                            >
                                Termina e Salva
                            </button>

                            <button
                                onClick={() => setShowTerminateConfirm(false)}
                                className="w-full mt-3 py-3 text-[var(--foreground)] opacity-50 font-medium"
                            >
                                Continua
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
