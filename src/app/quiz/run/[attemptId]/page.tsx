"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

// Layout Imports
import QuizLayout from "@/components/quiz/QuizLayout";
import QuizHeader from "@/components/quiz/QuizHeader";
import QuizSidebar from "@/components/quiz/QuizSidebar";
import MobileQuestionDrawer from "@/components/quiz/MobileQuestionDrawer";

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
    isLocked?: boolean; // New: For Instant Check Logic
    explanation?: string | null;
    options: { a: string; b: string; c: string; d: string };
};

// Helper to normalize DB answers for comparison
function normalizeDBAnswer(val: string | null | undefined): string | null {
    if (!val) return null;
    return val.replace(/[.,:;()\[\]]/g, "").trim().toLowerCase();
}

export default function QuizRunnerPage() {
    const { attemptId, id } = useParams<{ attemptId?: string; id?: string }>();
    const quizAttemptId = attemptId || id; // Support both route patterns
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Config from URL queries
    const timeLimitParam = searchParams.get("time");
    // const initInstantCheck = searchParams.get("ic") === "true"; // Deprecated global init, user toggles it
    // const initAutoNext = searchParams.get("auto") === "true";

    // Scoring Config
    const pointsCorrect = parseFloat(searchParams.get("correct") || "1");
    const pointsWrong = parseFloat(searchParams.get("wrong") || "0");
    const pointsBlank = parseFloat(searchParams.get("blank") || "0");

    // State
    const [loading, setLoading] = useState(true);
    const [answering, setAnswering] = useState<RichAnswer[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [finished, setFinished] = useState(false);
    const [isMobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const [showTerminateConfirm, setShowTerminateConfirm] = useState(false);

    // Modes & Config
    const [instantCheck, setInstantCheck] = useState(false);
    const [autoNext, setAutoNext] = useState(false);
    const [quizConfig, setQuizConfig] = useState<{
        useCustomPassThreshold: boolean;
        minCorrectForPass: number | null;
    } | null>(null);

    // Ref to hold latest answers (prevents stale closures)
    const answeringRef = useRef<RichAnswer[]>([]);

    // Sync Ref with State
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

                // Check LocalStorage for backup (in case of refresh)
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

                // Hydrate explanations (fetch fresh from DB)
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

                // Load Quiz Config for Pass/Fail
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

    // Timer State
    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

    // Initialize timer
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

    // Timer countdown
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

    // AutoNext Logic
    useEffect(() => {
        if (!autoNext || finished) return;
        const currentAns = answering[currentIndex];

        if (currentAns?.selectedOption) {
            // Auto Next Logic
            const delay = instantCheck ? 1200 : 400;
            const timeout = setTimeout(() => {
                if (currentIndex < answering.length - 1) {
                    setCurrentIndex(p => p + 1);
                }
            }, delay);
            return () => clearTimeout(timeout);
        }
    }, [answering, currentIndex, autoNext, instantCheck, finished]);

    const handleSelect = useCallback((opt: string) => {
        if (finished) return;

        const currentList = answeringRef.current.length > 0 ? answeringRef.current : answering;
        const currentQ = currentList[currentIndex];

        if (!currentQ) return;

        // Locked Logic
        if (currentQ.isLocked) return;

        const nextList = [...currentList];
        const normalizedCorrect = normalizeDBAnswer(currentQ.correctOption);

        // Locking Logic (Instant Check)
        const shouldLock = instantCheck;

        nextList[currentIndex] = {
            ...currentQ,
            selectedOption: opt,
            isCorrect: opt === normalizedCorrect,
            isSkipped: false,
            isLocked: shouldLock
        };

        // Update Ref & State
        answeringRef.current = nextList;
        setAnswering(nextList);

        // Backup to LocalStorage
        if (quizAttemptId) {
            localStorage.setItem(`quiz_progress_${quizAttemptId}`, JSON.stringify(nextList));
        }
    }, [finished, currentIndex, instantCheck, quizAttemptId, answering]); // Added dependencies

    const handleFinish = async () => {
        if (finished || !quizAttemptId) return;
        setFinished(true);

        // Get answers from best available source
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

        // Build Stats & Re-eval correctness
        let correct = 0, wrong = 0, blank = 0;
        let score = 0;

        const finalAnswers = finalAnswersSource.map(a => {
            const normalizedCorrect = normalizeDBAnswer(a.correctOption);
            const isCorrect = a.selectedOption !== null && a.selectedOption === normalizedCorrect;

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

            return {
                ...a,
                isCorrect,
                isSkipped: a.selectedOption === null
            }
        });

        score = Math.round(score * 100) / 100;

        if (finalAnswers.length === 0) {
            alert("Errore: Nessuna risposta registrata.");
            return;
        }

        // Update DB
        const { data: updateResult, error } = await supabase.from("quiz_attempts").update({
            finished_at: new Date().toISOString(),
            score,
            correct,
            wrong,
            blank,
            answers: finalAnswers,
            duration_seconds: remainingSeconds !== null ? (parseFloat(timeLimitParam || "0") * 60 - remainingSeconds) : 0,
            is_idoneo: quizConfig?.useCustomPassThreshold ? correct >= (quizConfig.minCorrectForPass || 0) : null,
            pass_threshold: quizConfig?.useCustomPassThreshold ? quizConfig.minCorrectForPass : null,
        }).eq("id", quizAttemptId).select();

        if (error) {
            console.error("Save error:", error);
            alert(`Errore salvataggio: ${error.message}`);
            return;
        }

        if (!updateResult || updateResult.length === 0) {
            alert("Errore: Impossibile salvare i risultati. Verifica i permessi del database.");
            return;
        }

        // Cleanup LocalStorage
        localStorage.removeItem(`quiz_progress_${quizAttemptId}`);

        // Redirect to Results
        navigate(`/quiz/results/${quizAttemptId}`);
    };

    const formatTime = (seconds: number | null) => {
        if (seconds === null) return "∞";
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    if (loading) return (
        <div className="min-h-screen bg-canvas-light flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cyan"></div>
        </div>
    );

    const currentQ = answering[currentIndex];


    if (!currentQ) return <div>Errore dati</div>;
    const isLocked = currentQ.isLocked || false;
    const normalizedCorrect = normalizeDBAnswer(currentQ.correctOption);

    // Transform answers for sidebar
    const answerMap: Record<number, any> = {};
    answering.forEach((a, i) => {
        if (a.selectedOption) answerMap[i] = a.selectedOption;
    });


    return (
        <QuizLayout
            header={
                <QuizHeader
                    title={"Prova Personalizzata"}
                    onExit={() => {
                        alert('Exit button clicked!'); // DEBUG
                        // Check if there is a history stack to go back to
                        if (window.history.length > 2) {
                            navigate(-1);
                        } else {
                            // Fallback to home if direct link or clean tab
                            navigate('/', { replace: true });
                        }
                    }}
                    onSettings={() => alert("Impostazioni: In arrivo!")}
                    instantCheck={instantCheck}
                    setInstantCheck={setInstantCheck}
                    autoNext={autoNext}
                    setAutoNext={setAutoNext}
                    // Mobile Timer Props
                    timerSeconds={remainingSeconds !== null ? remainingSeconds : undefined}
                    totalQuestions={answering.length}
                    currentQuestionIndex={currentIndex}
                />
            }
            sidebar={
                <QuizSidebar
                    timerSeconds={remainingSeconds || 0}
                    totalQuestions={answering.length}
                    currentQuestionIndex={currentIndex}
                    answers={answerMap}
                    onJumpToQuestion={(idx) => setCurrentIndex(idx)}
                    onTerminate={handleFinish}
                    onSave={() => alert("Risposte salvate (Placeholder)")}
                />
            }
        >
            <div className="flex flex-col h-full max-w-4xl mx-auto px-6 py-8 pb-32 lg:pb-8"> {/* Added pb-32 for mobile nav safe area */}

                {/* Question Header */}
                <div className="mb-8">
                    <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest">{currentIndex + 1} / {answering.length} • {currentQ.subjectName}</span>
                    <h2 className="text-2xl md:text-3xl font-bold mt-3 leading-snug text-text-primary">{currentQ.text}</h2>
                    {isLocked && (
                        <div className="mt-3 text-xs font-bold text-semantic-warning flex items-center gap-1">
                            <span>🔒</span> Risposta bloccata (Verifica Istantanea)
                        </div>
                    )}
                </div>

                {/* Answer Options */}
                <div className="space-y-2 md:space-y-4 mb-8">
                    {['a', 'b', 'c', 'd'].map(optKey => {
                        const optText = (currentQ.options as any)[optKey];
                        const isSelected = currentQ.selectedOption === optKey;

                        let containerClass = "bg-white shadow-soft hover:shadow-card hover:scale-[1.01] border border-transparent";
                        let textClass = "text-text-secondary";
                        const isDisabled = isLocked;

                        if (isSelected) {
                            containerClass = "bg-brand-cyan/5 border-brand-cyan shadow-md ring-1 ring-brand-cyan";
                            textClass = "text-brand-cyan font-semibold";
                        }

                        // Locking UI Logic
                        if (isLocked) {
                            if (optKey === normalizedCorrect) {
                                containerClass = "bg-semantic-success/10 border-semantic-success ring-1 ring-semantic-success";
                                textClass = "text-semantic-success font-bold";
                            } else if (isSelected) {
                                containerClass = "bg-semantic-error/10 border-semantic-error ring-1 ring-semantic-error";
                                textClass = "text-semantic-error font-bold";
                            } else {
                                containerClass = "bg-canvas-light opacity-60 shadow-none";
                                textClass = "text-text-tertiary";
                            }
                        }

                        return (
                            <button
                                key={optKey}
                                onClick={() => !isDisabled && handleSelect(optKey)}
                                disabled={isDisabled}
                                className={`w-full p-3 md:p-5 rounded-xl md:rounded-card flex items-center gap-3 md:gap-5 text-left transition-all duration-300 ease-ios group ${containerClass} ${isDisabled ? 'cursor-not-allowed transform-none' : ''}`}
                            >
                                <span className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-squircle flex items-center justify-center text-xs md:text-sm font-bold border-2 transition-colors shrink-0 ${isSelected || (isLocked && optKey === normalizedCorrect)
                                    ? 'border-current'
                                    : 'border-canvas-light bg-canvas-light text-text-tertiary group-hover:border-text-tertiary/30 group-hover:text-text-secondary'
                                    }`}>
                                    {optKey.toUpperCase()}
                                </span>
                                <span className={`text-[15px] md:text-lg leading-snug md:leading-relaxed ${textClass}`}>{optText}</span>
                            </button>
                        )
                    })}
                </div>

                {/* Inline Explanation */}
                {isLocked && instantCheck && (currentQ as any).explanation && (
                    <div className="mb-12 bg-white rounded-card p-6 shadow-soft border-l-4 border-brand-cyan animate-in fade-in slide-in-from-top-2 duration-500">
                        <h3 className="text-sm uppercase tracking-widest font-bold text-brand-cyan mb-2 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Spiegazione
                        </h3>
                        <div className="prose prose-slate prose-sm max-w-none text-text-secondary leading-relaxed">
                            {(currentQ as any).explanation}
                        </div>
                    </div>
                )}

                {/* Bottom Navigation Sheet (Mobile) */}
                <div className="fixed bottom-0 left-0 right-0 bg-white lg:static lg:bg-transparent mt-auto z-40 pb-safe">

                    {/* Curved Notch with Chevron */}
                    <div className="lg:hidden flex justify-center -mt-6">
                        <button
                            onClick={() => setMobileDrawerOpen(true)}
                            className="bg-white px-8 pt-2 pb-3 rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.08)] transition-transform active:scale-95"
                        >
                            <svg className="w-5 h-5 text-brand-cyan" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                            </svg>
                        </button>
                    </div>

                    {/* Question Number Pills */}
                    <div className="lg:hidden px-4 py-3">
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                            {answering.map((_, idx) => {
                                const isActive = idx === currentIndex;
                                const hasAnswer = answering[idx]?.selectedOption !== null;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentIndex(idx)}
                                        className={`w-10 h-10 shrink-0 rounded-squircle font-bold text-sm transition-all active:scale-95 ${isActive
                                            ? 'bg-brand-cyan text-white shadow-md shadow-brand-cyan/30'
                                            : hasAnswer
                                                ? 'bg-canvas-light text-text-secondary border border-slate-200'
                                                : 'bg-canvas-light text-text-tertiary'
                                            }`}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="px-4 pb-4 lg:pb-0 flex gap-3">
                        <button
                            onClick={() => setCurrentIndex(p => Math.max(0, p - 1))}
                            disabled={currentIndex === 0}
                            className={`flex-1 py-3.5 rounded-xl font-semibold text-[15px] transition-all active:scale-[0.98] ${currentIndex === 0
                                ? 'text-text-tertiary bg-canvas-light cursor-not-allowed'
                                : 'text-text-secondary bg-canvas-light hover:bg-slate-200 active:bg-slate-300'
                                }`}
                        >
                            Precedente
                        </button>

                        {currentIndex === answering.length - 1 ? (
                            <button
                                onClick={() => setShowTerminateConfirm(true)}
                                className="flex-1 py-3.5 rounded-xl font-semibold text-[15px] transition-all active:scale-[0.98] bg-semantic-error text-white hover:bg-semantic-error/90"
                            >
                                Termina
                            </button>
                        ) : (
                            <button
                                onClick={() => setCurrentIndex(p => Math.min(answering.length - 1, p + 1))}
                                className="flex-1 py-3.5 rounded-xl font-semibold text-[15px] transition-all active:scale-[0.98] text-text-secondary bg-canvas-light hover:bg-slate-200 active:bg-slate-300"
                            >
                                Successiva
                            </button>
                        )}
                    </div>

                    {/* Desktop Help */}
                    <div className="hidden lg:flex justify-center py-4">
                        <button className="text-text-tertiary font-medium hover:text-brand-cyan flex items-center gap-2 px-4 py-2 transition-colors">
                            <span className="text-xl">?</span>
                            <span>Aiuto</span>
                        </button>
                    </div>
                </div>

            </div>

            {/* Mobile Drawer Component */}
            <MobileQuestionDrawer
                isOpen={isMobileDrawerOpen}
                onClose={() => setMobileDrawerOpen(false)}
                totalQuestions={answering.length}
                currentQuestionIndex={currentIndex}
                answers={answerMap}
                onJumpToQuestion={(idx) => setCurrentIndex(idx)}
                onTerminate={handleFinish}
            />

            {/* Terminate Confirmation Popup */}
            {showTerminateConfirm && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
                        onClick={() => setShowTerminateConfirm(false)}
                    />

                    {/* Popup */}
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold text-text-primary text-center mb-6">
                            Sei sicuro di voler terminare il quiz?
                        </h3>

                        <button
                            onClick={handleFinish}
                            className="w-full py-3.5 bg-semantic-error hover:bg-semantic-error/90 text-white font-bold rounded-xl transition-colors"
                        >
                            Termina
                        </button>

                        <button
                            onClick={() => setShowTerminateConfirm(false)}
                            className="w-full mt-3 py-3 text-text-tertiary font-medium hover:text-text-secondary transition-colors"
                        >
                            Chiudi
                        </button>
                    </div>
                </div>
            )}

        </QuizLayout>
    );
}
