"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { xpService } from "@/lib/xpService"; // Import XP Service

// Components
import ResultHero from "@/components/quiz/results/ResultHero";
import ResultStats from "@/components/quiz/results/ResultStats";
import ResultQuestionList from "@/components/quiz/results/ResultQuestionList";

// Types (Mirrors of what we used in other files)
interface RichAnswer {
    questionId: string;
    text: string;
    subjectId: string;
    subjectName: string;
    selectedOption: string | null;
    correctOption: string | null;
    isCorrect: boolean;
    isSkipped: boolean;
    options: { a: string; b: string; c: string; d: string };
    isLocked?: boolean;
}

interface AttemptData {
    id: string;
    user_id: string;
    quiz_id: string;
    score: number;
    total_questions: number;
    correct: number;
    wrong: number;
    blank: number;
    answers: RichAnswer[];
    is_idoneo: boolean | null;
    pass_threshold: number | null;
}

export default function QuizResultsPage() {
    const { attemptId } = useParams<{ attemptId: string }>();
    const navigate = useNavigate();
    const [attempt, setAttempt] = useState<AttemptData | null>(null);
    const [loading, setLoading] = useState(true);
    const [processingReview, setProcessingReview] = useState(false);

    // XP State
    const [xpEarned, setXpEarned] = useState<number | null>(null);
    const xpAwardedRef = useRef(false); // Ref to prevent double-firing in Strict Mode

    useEffect(() => {
        if (!attemptId) return;
        const fetchAttempt = async () => {
            const { data, error } = await supabase
                .from("quiz_attempts")
                .select("*")
                .eq("id", attemptId)
                .single();
            if (error) console.error(error);
            else setAttempt(data as any);
            setLoading(false);
        };
        fetchAttempt();
    }, [attemptId]);

    // Handle XP Awarding
    useEffect(() => {
        const awardXP = async () => {
            if (attempt && attempt.user_id && attemptId && !xpAwardedRef.current) {
                xpAwardedRef.current = true;
                const earned = await xpService.awardXpForAttempt(attemptId, attempt.user_id);
                if (earned > 0) {
                    setXpEarned(earned);
                }
            }
        };

        awardXP();
    }, [attempt, attemptId]);

    const handleRipassaErrori = async () => {
        if (!attempt || processingReview) return;
        setProcessingReview(true);

        try {
            // 1. Filter for errors (Wrong + Skipped)
            const errors = attempt.answers.filter(a => !a.isCorrect);

            if (errors.length === 0) {
                alert("Fantastico! Non hai commesso errori in questa sessione. Nessun ripasso necessario.");
                setProcessingReview(false);
                return;
            }

            // 2. Prepare new answers (RESET state)
            const newAnswers = errors.map(a => ({
                ...a,
                selectedOption: null,
                isCorrect: false,
                isSkipped: false,
                isLocked: false // unlock for new attempt
            }));

            // 3. Create new attempt
            const { data: newAttempt, error } = await supabase
                .from("quiz_attempts")
                .insert({
                    quiz_id: attempt.quiz_id,
                    user_id: attempt.user_id,
                    score: 0,
                    correct: 0,
                    wrong: 0,
                    blank: 0,
                    total_questions: newAnswers.length,
                    answers: newAnswers, // The Runner will use this to determine questions!
                    started_at: new Date().toISOString(),
                    // finished_at is null
                })
                .select()
                .single();

            if (error) throw error;

            // 4. Navigate
            if (newAttempt) {
                navigate(`/quiz/run/${newAttempt.id}?mode=review`);
            }

        } catch (e: any) {
            console.error("Error creating review:", e);
            alert("Errore nell'avvio del ripasso: " + e.message);
            setProcessingReview(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
        </div>
    );

    if (!attempt) return <div className="p-8 text-center">Risultati non trovati.</div>;

    // Helper to format option text
    const getOptionText = (ans: RichAnswer, optKey: string | null) => {
        if (!optKey) return "-";
        return (ans.options as any)[optKey] || optKey;
    };

    // Calculate passing
    // If is_idoneo is present in DB, use it. Otherwise fallback to null (neutral).
    const passed = attempt.is_idoneo;

    // Process lists for sub-components
    const wrongList = attempt.answers.filter(a => !a.isCorrect && !a.isSkipped).map(a => ({
        id: a.questionId,
        text: a.text,
        userAnswer: getOptionText(a, a.selectedOption),
        correctAnswer: getOptionText(a, a.correctOption),
        isCorrect: false,
        isSkipped: false
    }));

    const correctList = attempt.answers.filter(a => a.isCorrect).map(a => ({
        id: a.questionId,
        text: a.text,
        userAnswer: getOptionText(a, a.selectedOption),
        correctAnswer: getOptionText(a, a.correctOption),
        isCorrect: true,
        isSkipped: false
    }));

    const skippedList = attempt.answers.filter(a => a.isSkipped).map(a => ({
        id: a.questionId,
        text: a.text,
        userAnswer: "-",
        correctAnswer: getOptionText(a, a.correctOption),
        isCorrect: false,
        isSkipped: true
    }));

    const hasErrors = (wrongList.length + skippedList.length) > 0;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col relative pb-32">

            {/* 1. Hero */}
            <ResultHero score={attempt.score} maxScore={30} passed={passed} xpEarned={xpEarned} />

            {/* 2. Stats */}
            <ResultStats
                correct={attempt.correct}
                wrong={attempt.wrong}
                skipped={attempt.blank}
            />

            {/* 3. Question Lists */}
            <ResultQuestionList
                wrong={wrongList}
                correct={correctList}
                skipped={skippedList}
                attemptId={attemptId || ""}
            />

            {/* 4. Bottom Actions (Sticky) */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-200 shadow-xl z-50">
                <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-4">

                    <button
                        onClick={handleRipassaErrori}
                        disabled={!hasErrors || processingReview}
                        className={`flex-1 py-4 px-6 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] ${hasErrors
                            ? 'bg-slate-900 text-white hover:bg-slate-800'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        {processingReview ? (
                            <span className="animate-pulse">Caricamento...</span>
                        ) : hasErrors ? (
                            <>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                <span>Ripassa Errori ({wrongList.length + skippedList.length})</span>
                            </>
                        ) : (
                            <span>Nessun Errore da Ripassare! 🌟</span>
                        )}
                    </button>

                    <button
                        onClick={() => navigate("/")}
                        className="py-4 px-8 rounded-xl font-bold text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                        Non ora
                    </button>
                </div>
            </div>

        </div>
    );
}
