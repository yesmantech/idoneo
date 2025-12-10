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
    const { attemptId } = useParams<{ attemptId: string }>();
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
        if (!attemptId) return;

        const load = async () => {
            const { data } = await supabase.from("quiz_attempts").select("*").eq("id", attemptId).single();
            if (data) {
                let loadedAnswers = Array.isArray(data.answers) ? data.answers : [];

                // Check LocalStorage for backup (in case of refresh)
                const localBackup = localStorage.getItem(`quiz_progress_${attemptId}`);
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
    }, [attemptId]);

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
        if (attemptId) {
            localStorage.setItem(`quiz_progress_${attemptId}`, JSON.stringify(nextList));
        }
    }, [finished, currentIndex, instantCheck, attemptId, answering]); // Added dependencies

    const handleFinish = async () => {
        if (finished || !attemptId) return;
        setFinished(true);

        // Get answers from best available source
        let finalAnswersSource = answeringRef.current.length > 0 ? answeringRef.current : answering;

        const localBackup = localStorage.getItem(`quiz_progress_${attemptId}`);
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
        }).eq("id", attemptId).select();

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
        localStorage.removeItem(`quiz_progress_${attemptId}`);

        // Redirect to Results
        navigate(`/quiz/results/${attemptId}`);
    };

    const formatTime = (seconds: number | null) => {
        if (seconds === null) return "∞";
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
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
                    onExit={() => navigate(-1)}
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
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{currentIndex + 1} / {answering.length} • {currentQ.subjectName}</span>
                    <h2 className="text-2xl font-medium mt-2 leading-relaxed text-slate-900">{currentQ.text}</h2>
                    {isLocked && (
                        <div className="mt-2 text-xs font-bold text-amber-500 flex items-center gap-1">
                            <span>🔒</span> Risposta bloccata (Verifica Istantanea)
                        </div>
                    )}
                </div>

                {/* Answer Options */}
                <div className="space-y-4 mb-8">
                    {['a', 'b', 'c', 'd'].map(optKey => {
                        const optText = (currentQ.options as any)[optKey];
                        const isSelected = currentQ.selectedOption === optKey;

                        let containerClass = "border-2 border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm";
                        let textClass = "text-slate-700";
                        const isDisabled = isLocked;

                        if (isSelected) {
                            containerClass = "border-2 border-slate-900 bg-slate-50 shadow-md";
                            textClass = "text-slate-900 font-medium";
                        }

                        // Locking UI Logic
                        if (isLocked) {
                            if (optKey === normalizedCorrect) {
                                containerClass = "border-emerald-500 bg-emerald-50 border-2";
                                textClass = "text-emerald-900 font-bold";
                            } else if (isSelected) {
                                containerClass = "border-rose-500 bg-rose-50 border-2";
                                textClass = "text-rose-900 font-bold";
                            } else {
                                containerClass = "border-slate-100 bg-slate-50 opacity-60";
                                textClass = "text-slate-400";
                            }
                        }

                        return (
                            <button
                                key={optKey}
                                onClick={() => !isDisabled && handleSelect(optKey)}
                                disabled={isDisabled}
                                className={`w-full p-6 rounded-2xl flex items-center gap-6 text-left transition-all group ${containerClass} ${isDisabled ? 'cursor-not-allowed' : ''}`}
                            >
                                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${isSelected || (isLocked && optKey === normalizedCorrect)
                                    ? 'border-current'
                                    : 'border-slate-300 text-slate-400 group-hover:border-slate-400 group-hover:text-slate-500'
                                    }`}>
                                    {optKey.toUpperCase()}
                                </span>
                                <span className={`text-lg ${textClass}`}>{optText}</span>
                            </button>
                        )
                    })}
                </div>

                {/* Inline Explanation */}
                {isLocked && instantCheck && (currentQ as any).explanation && (
                    <div className="mb-12 bg-blue-50/50 rounded-2xl p-6 border border-blue-100 animate-in fade-in slide-in-from-top-2 duration-500">
                        <h3 className="text-sm uppercase tracking-widest font-bold text-blue-900 mb-2 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Spiegazione
                        </h3>
                        <div className="prose prose-blue prose-sm max-w-none text-slate-700">
                            {(currentQ as any).explanation}
                        </div>
                    </div>
                )}

                {/* Bottom Navigation (Fixed on mobile, static on Desktop) */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 lg:static lg:bg-transparent lg:border-none lg:p-0 mt-auto z-40">
                    <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">

                        {/* Mobile Grid Trigger */}
                        <button
                            onClick={() => setMobileDrawerOpen(true)}
                            className="lg:hidden p-3 text-slate-400 hover:text-slate-900 bg-slate-50 rounded-xl"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>

                        {/* Desktop Help Button */}
                        <button className="hidden lg:flex text-slate-400 font-medium hover:text-slate-600 items-center gap-2 px-2 py-2">
                            <span className="text-xl">?</span>
                            <span>Aiuto</span>
                        </button>

                        <div className="flex gap-4 flex-1 justify-end lg:flex-none">
                            <button
                                onClick={() => setCurrentIndex(p => Math.max(0, p - 1))}
                                disabled={currentIndex === 0}
                                className={`flex-1 lg:flex-none px-6 lg:px-8 py-3 rounded-xl font-bold transition-colors ${currentIndex === 0 ? 'text-slate-300 cursor-not-allowed bg-slate-50' : 'text-slate-600 bg-slate-100 hover:bg-slate-200'}`}
                            >
                                Indietro
                            </button>

                            <button
                                onClick={() => setCurrentIndex(p => Math.min(answering.length - 1, p + 1))}
                                disabled={currentIndex === answering.length - 1}
                                className="flex-1 lg:flex-none px-6 lg:px-10 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                Successiva
                            </button>
                        </div>
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

        </QuizLayout>
    );
}
