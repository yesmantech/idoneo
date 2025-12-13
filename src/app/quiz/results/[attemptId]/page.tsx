"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { xpService } from "@/lib/xpService";
import { X, Minus, ChevronRight, RotateCcw, Trophy, Zap, Check } from "lucide-react";
import { SuccessBadge } from "@/components/ui/SuccessBadge";
import confetti from "canvas-confetti";

// Types
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
    xp_awarded?: boolean; // Added
}

type TabType = 'errate' | 'corrette' | 'omesse';

// Idoneo colors for confetti
const IDONEO_CONFETTI_COLORS = ['#22C55E', '#00B1FF', '#FBBF24', '#F472B6', '#8B5CF6'];

// =============================================================================
// QUIZ RESULTS PAGE - Idoneo Redesign
// =============================================================================
export default function QuizResultsPage() {
    const { attemptId } = useParams<{ attemptId: string }>();
    const navigate = useNavigate();
    const [attempt, setAttempt] = useState<AttemptData | null>(null);
    const [loading, setLoading] = useState(true);
    const [processingReview, setProcessingReview] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('errate');

    // XP State
    const [xpEarned, setXpEarned] = useState<number | null>(null);
    const xpAwardedRef = useRef(false);
    const confettiFiredRef = useRef(false);

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

                // 1. If already awarded (by Runner), display the score
                if (attempt.xp_awarded) {
                    setXpEarned(attempt.correct || 0);
                    return;
                }

                // 2. Otherwise try to award it now
                const earned = await xpService.awardXpForAttempt(attemptId, attempt.user_id);
                if (earned > 0) {
                    setXpEarned(earned);
                } else if (earned === 0 && attempt.correct > 0) {
                    // Fallback: If service returns 0 (maybe race condition), use correct count
                    setXpEarned(attempt.correct);
                }
            }
        };
        awardXP();
    }, [attempt, attemptId]);

    // Confetti celebration (fires once based on performance)
    useEffect(() => {
        if (!attempt || confettiFiredRef.current) return;
        confettiFiredRef.current = true;

        // Calculate performance percentage
        const total = attempt.total_questions || 1;
        const correctPercentage = (attempt.correct / total) * 100;

        // Scale confetti based on performance
        let particleCount = 50;
        let spread = 80;

        if (correctPercentage >= 80) {
            particleCount = 150;
            spread = 160;
        } else if (correctPercentage >= 50) {
            particleCount = 100;
            spread = 120;
        }

        // Fire confetti immediately with a short delay to ensure page is rendered
        setTimeout(() => {
            // Center burst
            confetti({
                particleCount: Math.floor(particleCount / 2),
                spread,
                origin: { x: 0.5, y: 0.6 },
                colors: IDONEO_CONFETTI_COLORS,
                zIndex: 9999,
                disableForReducedMotion: true
            });

            // Left burst
            confetti({
                particleCount: Math.floor(particleCount / 4),
                angle: 60,
                spread: spread / 2,
                origin: { x: 0, y: 0.7 },
                colors: IDONEO_CONFETTI_COLORS,
                zIndex: 9999,
                disableForReducedMotion: true
            });

            // Right burst
            confetti({
                particleCount: Math.floor(particleCount / 4),
                angle: 120,
                spread: spread / 2,
                origin: { x: 1, y: 0.7 },
                colors: IDONEO_CONFETTI_COLORS,
                zIndex: 9999,
                disableForReducedMotion: true
            });
        }, 300);
    }, [attempt]);

    const handleRipassaErrori = async () => {
        if (!attempt || processingReview) return;
        setProcessingReview(true);

        try {
            const errors = attempt.answers.filter(a => !a.isCorrect);
            if (errors.length === 0) {
                alert("Fantastico! Non hai commesso errori in questa sessione.");
                setProcessingReview(false);
                return;
            }

            const newAnswers = errors.map(a => ({
                ...a,
                selectedOption: null,
                isCorrect: false,
                isSkipped: false,
                isLocked: false
            }));

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
                    answers: newAnswers,
                    started_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) throw error;
            if (newAttempt) {
                navigate(`/quiz/run/${newAttempt.id}?mode=review`);
            }
        } catch (e: any) {
            console.error("Error creating review:", e);
            alert("Errore nell'avvio del ripasso: " + e.message);
            setProcessingReview(false);
        }
    };

    const getOptionText = (ans: RichAnswer, optKey: string | null) => {
        if (!optKey) return "-";
        return (ans.options as any)[optKey] || optKey;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#00B1FF] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!attempt) {
        return (
            <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-6">
                <p className="text-slate-500">Risultati non trovati.</p>
                <Link to="/" className="mt-4 text-[#00B1FF] font-semibold">← Torna alla Home</Link>
            </div>
        );
    }

    // Process question lists
    const wrongList = attempt.answers.filter(a => !a.isCorrect && !a.isSkipped).map(a => ({
        id: a.questionId,
        text: a.text,
        userAnswer: getOptionText(a, a.selectedOption),
        correctAnswer: getOptionText(a, a.correctOption),
    }));

    const correctList = attempt.answers.filter(a => a.isCorrect).map(a => ({
        id: a.questionId,
        text: a.text,
        userAnswer: getOptionText(a, a.selectedOption),
        correctAnswer: getOptionText(a, a.correctOption),
    }));

    const skippedList = attempt.answers.filter(a => a.isSkipped).map(a => ({
        id: a.questionId,
        text: a.text,
        userAnswer: "-",
        correctAnswer: getOptionText(a, a.correctOption),
    }));

    const hasErrors = (wrongList.length + skippedList.length) > 0;
    const total = attempt.total_questions || 1;

    // Get filtered list based on active tab
    const getFilteredList = () => {
        switch (activeTab) {
            case 'errate': return wrongList;
            case 'corrette': return correctList;
            case 'omesse': return skippedList;
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F5F7] pb-40">
            {/* ============================================================= */}
            {/* COMPLETION HERO */}
            {/* ============================================================= */}
            <div className="bg-white pt-12 pb-8 px-6 text-center relative">
                {/* Animated Success Badge */}
                <div className="flex justify-center mb-5">
                    <SuccessBadge />
                </div>

                <h1 className="text-[26px] font-bold text-slate-900 mb-2">
                    Quiz Completato! 🚀
                </h1>
                <p className="text-[15px] text-slate-500 max-w-xs mx-auto pb-4">
                    Hai completato la simulazione. Controlla le risposte per migliorare.
                </p>
            </div>

            <div className="px-5 max-w-lg mx-auto">
                {/* ============================================================= */}
                {/* SCORE & XP CARDS ROW */}
                {/* ============================================================= */}
                <div className="flex gap-3 mt-4 mb-5">
                    {/* Score Card */}
                    <div className="flex-1 bg-white rounded-3xl p-4 text-center" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Trophy className="w-4 h-4 text-amber-500" />
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Punteggio</span>
                        </div>
                        <div className="text-[28px] font-bold text-slate-900">
                            {attempt.score.toFixed(2)}
                        </div>
                    </div>

                    {/* XP Card */}
                    <div className="flex-1 bg-white rounded-3xl p-4 text-center" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Zap className="w-4 h-4 text-purple-500" />
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">XP Guadagnati</span>
                        </div>
                        <div className="text-[28px] font-bold text-purple-500">
                            +{xpEarned ?? 0}
                        </div>
                    </div>
                </div>

                {/* ============================================================= */}
                {/* CORRECT / WRONG / SKIPPED SUMMARY */}
                {/* ============================================================= */}
                <div className="flex gap-2 mb-6">
                    {/* Correct */}
                    <div className="flex-1 bg-white rounded-xl p-3 text-center" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                        <div className="text-[24px] font-bold text-emerald-500">{attempt.correct}</div>
                        <div className="text-[11px] text-slate-500">
                            Corrette <span className="text-emerald-500">({Math.round((attempt.correct / total) * 100)}%)</span>
                        </div>
                    </div>

                    {/* Wrong */}
                    <div className="flex-1 bg-white rounded-xl p-3 text-center" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                        <div className="text-[24px] font-bold text-red-500">{attempt.wrong}</div>
                        <div className="text-[11px] text-slate-500">
                            Errate <span className="text-red-500">({Math.round((attempt.wrong / total) * 100)}%)</span>
                        </div>
                    </div>

                    {/* Skipped */}
                    <div className="flex-1 bg-white rounded-xl p-3 text-center" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                        <div className="text-[24px] font-bold text-slate-400">{attempt.blank}</div>
                        <div className="text-[11px] text-slate-500">
                            Omesse <span className="text-slate-400">({Math.round((attempt.blank / total) * 100)}%)</span>
                        </div>
                    </div>
                </div>

                {/* ============================================================= */}
                {/* TABS - ERRATE / CORRETTE / OMESSE */}
                {/* ============================================================= */}
                <div className="bg-slate-200/60 p-1 rounded-xl mb-5">
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab('errate')}
                            className={`flex-1 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${activeTab === 'errate'
                                ? 'bg-white text-red-500 shadow-sm'
                                : 'text-slate-500'
                                }`}
                        >
                            Errate ({wrongList.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('corrette')}
                            className={`flex-1 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${activeTab === 'corrette'
                                ? 'bg-white text-emerald-500 shadow-sm'
                                : 'text-slate-500'
                                }`}
                        >
                            Corrette ({correctList.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('omesse')}
                            className={`flex-1 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${activeTab === 'omesse'
                                ? 'bg-white text-slate-600 shadow-sm'
                                : 'text-slate-500'
                                }`}
                        >
                            Omesse ({skippedList.length})
                        </button>
                    </div>
                </div>

                {/* ============================================================= */}
                {/* QUESTION REVIEW LIST */}
                {/* ============================================================= */}
                <div className="space-y-3">
                    {getFilteredList().length === 0 ? (
                        <div className="bg-white rounded-2xl p-8 text-center" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                            <div className="text-4xl mb-3">
                                {activeTab === 'errate' ? '🎉' : activeTab === 'corrette' ? '📋' : '📝'}
                            </div>
                            <p className="text-slate-500 text-[14px]">
                                {activeTab === 'errate'
                                    ? 'Nessun errore! Ottimo lavoro.'
                                    : activeTab === 'corrette'
                                        ? 'Nessuna risposta corretta.'
                                        : 'Nessuna risposta omessa.'}
                            </p>
                        </div>
                    ) : (
                        getFilteredList().map((q, idx) => (
                            <Link
                                key={q.id}
                                to={`/quiz/explanations/${attemptId}/${q.id}`}
                                className="block bg-white rounded-2xl p-4 transition-all hover:shadow-md active:scale-[0.99]"
                                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Status Icon */}
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${activeTab === 'errate'
                                        ? 'bg-red-100'
                                        : activeTab === 'corrette'
                                            ? 'bg-emerald-100'
                                            : 'bg-slate-100'
                                        }`}>
                                        {activeTab === 'errate' && <X className="w-4 h-4 text-red-500" />}
                                        {activeTab === 'corrette' && <Check className="w-4 h-4 text-emerald-500" />}
                                        {activeTab === 'omesse' && <Minus className="w-4 h-4 text-slate-400" />}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[14px] font-medium text-slate-900 line-clamp-2 mb-2">
                                            {q.text}
                                        </p>
                                        <div className="space-y-1">
                                            <p className="text-[12px]">
                                                <span className="text-slate-400">Hai risposto:</span>{' '}
                                                <span className={activeTab === 'corrette' ? 'text-emerald-600' : 'text-red-500'}>
                                                    {q.userAnswer}
                                                </span>
                                            </p>
                                            <p className="text-[12px]">
                                                <span className="text-slate-400">Corretta:</span>{' '}
                                                <span className="text-emerald-600">{q.correctAnswer}</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Chevron */}
                                    <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0 mt-1" />
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>

            {/* ============================================================= */}
            {/* BOTTOM CTA AREA */}
            {/* ============================================================= */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 px-5 py-4 pb-safe z-50">
                <div className="max-w-lg mx-auto space-y-3">
                    {/* Primary CTA */}
                    {hasErrors ? (
                        <button
                            onClick={handleRipassaErrori}
                            disabled={processingReview}
                            className="w-full py-4 rounded-2xl font-bold text-[16px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] bg-[#00B1FF] text-white shadow-lg shadow-[#00B1FF]/25"
                        >
                            {processingReview ? (
                                <span>Caricamento...</span>
                            ) : (
                                <>
                                    <RotateCcw className="w-5 h-5" />
                                    Ripassa Errori ({wrongList.length + skippedList.length})
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={() => navigate("/")}
                            className="w-full py-4 rounded-2xl font-bold text-[16px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] bg-[#00B1FF] text-white shadow-lg shadow-[#00B1FF]/25"
                        >
                            Torna alla Home
                        </button>
                    )}

                    {/* Secondary */}
                    {hasErrors ? (
                        <button
                            onClick={() => navigate("/")}
                            className="w-full py-3 text-[15px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            Non ora
                        </button>
                    ) : (
                        <p className="w-full py-2 text-[15px] font-medium text-emerald-500 text-center">
                            Nessun Errore! 🌟
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
