/**
 * @file page.tsx (Quiz Results)
 * @description Post-quiz results page showing score breakdown and error review.
 *
 * This page displays after a quiz is completed, showing:
 * - Pass/Fail status with confetti celebration
 * - Score statistics (correct, wrong, blank)
 * - XP earned from the quiz
 * - Tabs to review questions by status
 * - "Ripassa Errori" to retry incorrect questions
 *
 * ## Features
 *
 * | Feature          | Description                               |
 * |------------------|-------------------------------------------|
 * | Confetti         | Canvas confetti on pass                   |
 * | XP Display       | Shows XP earned from this attempt         |
 * | Error Review     | Create new attempt with only wrong Qs     |
 * | Question Tabs    | Filter by correct/wrong/skipped           |
 * | Analytics        | Tracks quiz completion event              |
 *
 * ## Pass/Fail Logic
 *
 * 1. If quiz has `min_correct_for_pass`, use that threshold
 * 2. Otherwise, default to floor(total/2) + 1 correct
 *
 * ## Offline Support
 *
 * When viewing offline attempts (IDs starting with "local-"):
 * - XP is not awarded (will sync later)
 * - "Ripassa Errori" is disabled
 *
 * ## URL Parameters
 *
 * - `attemptId`: Quiz attempt UUID or local-xxx for offline
 */

"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { xpService } from "@/lib/xpService";
import { offlineService } from "@/lib/offlineService"; // IMPORT OFFLINE SERVICE
import { analytics } from "@/lib/analytics"; // ANALYTICS
import TierSLoader from "@/components/ui/TierSLoader";
import { X, Minus, ChevronRight, RotateCcw, Trophy, Zap, Check, Target, Clock, BookOpen, AlertCircle } from "lucide-react";
import { SuccessBadge } from "@/components/ui/SuccessBadge";
import { FailBadge } from "@/components/ui/FailBadge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

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
    xp_awarded?: boolean;
}

type TabType = 'errate' | 'corrette' | 'omesse';

// Idoneo colors for confetti
const IDONEO_CONFETTI_COLORS = ['#22C55E', '#00B1FF', '#FBBF24', '#F472B6', '#8B5CF6'];

// =============================================================================
// QUIZ RESULTS PAGE - Desktop/Tablet Optimized
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
            // OFFLINE HANDLING
            if (attemptId.startsWith('local-')) {
                try {
                    const localData = await offlineService.getLocalAttempt(attemptId);
                    if (localData) {
                        const mapped: AttemptData = {
                            id: localData.id,
                            user_id: "offline",
                            quiz_id: localData.quiz_id,
                            score: localData.score || 0,
                            total_questions: localData.answers.length,
                            correct: localData.correct || 0,
                            wrong: localData.wrong || 0,
                            blank: localData.blank || 0,
                            answers: localData.answers.map((a: any) => ({
                                ...a,
                                subjectName: a.subjectName || "Materia"
                            })),
                            is_idoneo: localData.is_idoneo,
                            pass_threshold: localData.pass_threshold,
                            xp_awarded: false
                        };
                        setAttempt(mapped);
                    }
                } catch (e) {
                    console.error("Offline fetch error", e);
                }
                setLoading(false);
                return;
            }

            // ONLINE HANDLING
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

    // Handle XP Awarding (Only Online)
    useEffect(() => {
        const awardXP = async () => {
            if (attemptId?.startsWith('local-')) return;

            if (attempt && attempt.user_id && attemptId && !xpAwardedRef.current) {
                xpAwardedRef.current = true;
                if (attempt.xp_awarded) {
                    setXpEarned(attempt.correct || 0);
                    return;
                }
                const earned = await xpService.awardXpForAttempt(attemptId, attempt.user_id);
                if (earned > 0) {
                    setXpEarned(earned);
                } else if (earned === 0 && attempt.correct > 0) {
                    setXpEarned(attempt.correct);
                }
            }
        };
        awardXP();
    }, [attempt, attemptId]);

    // Confetti celebration
    useEffect(() => {
        if (!attempt || confettiFiredRef.current) return;

        const total = attempt.total_questions || 1;
        const passed = attempt.is_idoneo !== null
            ? attempt.is_idoneo
            : attempt.correct >= Math.floor(total / 2) + 1;

        // Track quiz completion analytics
        analytics.track('quiz_completed', {
            quiz_id: attempt.quiz_id,
            score: attempt.score,
            correct: attempt.correct,
            wrong: attempt.wrong,
            blank: attempt.blank,
            total_questions: total,
            percentage: Math.round((attempt.correct / total) * 100),
            passed: passed,
            is_offline: attemptId?.startsWith('local-') || false
        });

        if (!passed) return; // No confetti for fail

        confettiFiredRef.current = true;
        const correctPercentage = (attempt.correct / total) * 100;

        let particleCount = 50;
        let spread = 80;

        if (correctPercentage >= 80) {
            particleCount = 150;
            spread = 160;
        } else if (correctPercentage >= 50) {
            particleCount = 100;
            spread = 120;
        }

        setTimeout(() => {
            confetti({
                particleCount: Math.floor(particleCount / 2),
                spread,
                origin: { x: 0.5, y: 0.6 },
                colors: IDONEO_CONFETTI_COLORS,
                zIndex: 9999,
                disableForReducedMotion: true
            });
            confetti({
                particleCount: Math.floor(particleCount / 4),
                angle: 60,
                spread: spread / 2,
                origin: { x: 0, y: 0.7 },
                colors: IDONEO_CONFETTI_COLORS,
                zIndex: 9999,
                disableForReducedMotion: true
            });
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

        if (attemptId?.startsWith('local-')) {
            alert("Il ripasso errori non è ancora disponibile in modalità offline.");
            return;
        }

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
        return <TierSLoader message="Caricamento risultati..." />;
    }

    if (!attempt) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-6 transition-colors">
                <p className="text-[var(--foreground)] opacity-50">Risultati non trovati.</p>
                <Link to="/" className="mt-4 text-[#00B1FF] font-semibold">← Torna alla Home</Link>
            </div>
        );
    }

    // Process question lists
    const wrongList = attempt.answers.filter(a => !a.isCorrect && !a.isSkipped).map(a => ({
        id: a.questionId,
        text: a.text,
        subject: a.subjectName,
        userAnswer: getOptionText(a, a.selectedOption),
        correctAnswer: getOptionText(a, a.correctOption),
    }));

    const correctList = attempt.answers.filter(a => a.isCorrect).map(a => ({
        id: a.questionId,
        text: a.text,
        subject: a.subjectName,
        userAnswer: getOptionText(a, a.selectedOption),
        correctAnswer: getOptionText(a, a.correctOption),
    }));

    const skippedList = attempt.answers.filter(a => a.isSkipped).map(a => ({
        id: a.questionId,
        text: a.text,
        subject: a.subjectName,
        userAnswer: "-",
        correctAnswer: getOptionText(a, a.correctOption),
    }));

    const hasErrors = (wrongList.length + skippedList.length) > 0;
    const total = attempt.total_questions || 1;
    const passed = attempt.is_idoneo !== null
        ? attempt.is_idoneo
        : attempt.correct >= Math.floor(total / 2) + 1;

    const percentage = Math.round((attempt.correct / total) * 100);

    const getFilteredList = () => {
        switch (activeTab) {
            case 'errate': return wrongList;
            case 'corrette': return correctList;
            case 'omesse': return skippedList;
        }
    };

    return (
        <div className="min-h-screen bg-[var(--background)] pb-32 lg:pb-8 transition-colors duration-500">
            {/* ============================================================= */}
            {/* COMPLETION HERO - Responsive */}
            {/* ============================================================= */}
            <div
                className="bg-[var(--card)] border-b border-[var(--card-border)] pb-6 lg:pb-8 px-6 text-center relative"
                style={{ paddingTop: 'calc(env(safe-area-inset-top) + 2.5rem)' }}
            >
                <div className="max-w-4xl mx-auto">
                    {/* Status Badge */}
                    <div className="flex justify-center mb-4 lg:mb-6">
                        {passed ? <SuccessBadge /> : <FailBadge />}
                    </div>

                    <h1 className={cn(
                        "text-2xl lg:text-4xl font-bold mb-2",
                        passed ? "text-[var(--foreground)]" : "text-red-600"
                    )}>
                        {passed ? "Quiz Completato! 🚀" : "Non Idoneo ❌"}
                    </h1>
                    <p className="text-sm lg:text-base text-[var(--foreground)] opacity-50 max-w-md mx-auto">
                        {passed
                            ? "Hai completato la simulazione con successo. Ottimo lavoro!"
                            : "Non hai raggiunto il punteggio minimo. Continua a studiare!"}
                    </p>
                </div>
            </div>

            <div className="px-4 lg:px-8 max-w-6xl mx-auto">
                {/* ============================================================= */}
                {/* STATS GRID - Desktop: 4 columns, Tablet: 2x2, Mobile: 2+3 */}
                {/* ============================================================= */}
                <div className="mt-6 lg:mt-8">
                    {/* Main Stats Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4">
                        {/* Score Card */}
                        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl lg:rounded-3xl p-4 lg:p-6 text-center shadow-sm">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Trophy className="w-4 h-4 lg:w-5 lg:h-5 text-amber-500" />
                                <span className="text-[10px] lg:text-xs font-semibold text-[var(--foreground)] opacity-40 uppercase tracking-wider">Punteggio</span>
                            </div>
                            <div className="text-2xl lg:text-4xl font-bold text-[var(--foreground)]">
                                {attempt.score.toFixed(2)}
                            </div>
                        </div>

                        {/* XP Card */}
                        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl lg:rounded-3xl p-4 lg:p-6 text-center shadow-sm">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Zap className="w-4 h-4 lg:w-5 lg:h-5 text-purple-500" />
                                <span className="text-[10px] lg:text-xs font-semibold text-[var(--foreground)] opacity-40 uppercase tracking-wider">XP Guadagnati</span>
                            </div>
                            <div className="text-2xl lg:text-4xl font-bold text-purple-500">
                                {attemptId?.startsWith('local-') ? (
                                    <span className="text-sm text-slate-400">Sync...</span>
                                ) : (
                                    `+${xpEarned ?? 0}`
                                )}
                            </div>
                        </div>

                        {/* Accuracy Card - Desktop Only */}
                        <div className="hidden lg:block bg-[var(--card)] border border-[var(--card-border)] rounded-3xl p-6 text-center shadow-sm">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Target className="w-5 h-5 text-emerald-500" />
                                <span className="text-xs font-semibold text-[var(--foreground)] opacity-40 uppercase tracking-wider">Precisione</span>
                            </div>
                            <div className="text-4xl font-bold text-emerald-500">
                                {percentage}%
                            </div>
                        </div>

                        {/* Questions Card - Desktop Only */}
                        <div className="hidden lg:block bg-[var(--card)] border border-[var(--card-border)] rounded-3xl p-6 text-center shadow-sm">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <BookOpen className="w-5 h-5 text-sky-500" />
                                <span className="text-xs font-semibold text-[var(--foreground)] opacity-40 uppercase tracking-wider">Domande</span>
                            </div>
                            <div className="text-4xl font-bold text-sky-500">
                                {total}
                            </div>
                        </div>
                    </div>

                    {/* Correct / Wrong / Skipped Summary */}
                    <div className="grid grid-cols-3 gap-2 lg:gap-4">
                        {/* Correct */}
                        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl lg:rounded-2xl p-3 lg:p-5 text-center shadow-sm">
                            <div className="text-xl lg:text-3xl font-bold text-emerald-500">{attempt.correct}</div>
                            <div className="text-[10px] lg:text-sm text-[var(--foreground)] opacity-50">
                                Corrette <span className="text-emerald-500">({Math.round((attempt.correct / total) * 100)}%)</span>
                            </div>
                        </div>

                        {/* Wrong */}
                        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl lg:rounded-2xl p-3 lg:p-5 text-center shadow-sm">
                            <div className="text-xl lg:text-3xl font-bold text-red-500">{attempt.wrong}</div>
                            <div className="text-[10px] lg:text-sm text-[var(--foreground)] opacity-50">
                                Errate <span className="text-red-500">({Math.round((attempt.wrong / total) * 100)}%)</span>
                            </div>
                        </div>

                        {/* Skipped */}
                        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl lg:rounded-2xl p-3 lg:p-5 text-center shadow-sm">
                            <div className="text-xl lg:text-3xl font-bold text-[var(--foreground)] opacity-40">{attempt.blank}</div>
                            <div className="text-[10px] lg:text-sm text-[var(--foreground)] opacity-50">
                                Omesse <span className="text-[var(--foreground)] opacity-40">({Math.round((attempt.blank / total) * 100)}%)</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ============================================================= */}
                {/* TABS + CONTENT - Two Column Layout on Desktop */}
                {/* ============================================================= */}
                <div className="mt-6 lg:mt-8 lg:grid lg:grid-cols-[280px_1fr] lg:gap-6">
                    {/* Left Sidebar - Tabs + CTA (Desktop) */}
                    <div className="lg:space-y-4">
                        {/* Tabs */}
                        <div className="bg-slate-200/60 dark:bg-slate-800/60 p-1 rounded-xl mb-4 lg:mb-0 lg:bg-[var(--card)] lg:border lg:border-[var(--card-border)] lg:rounded-2xl lg:p-3 lg:shadow-sm">
                            <div className="flex lg:flex-col lg:gap-1">
                                <button
                                    onClick={() => setActiveTab('errate')}
                                    className={`flex-1 lg:w-full py-2.5 lg:py-3 lg:px-4 rounded-lg lg:rounded-xl text-[13px] lg:text-sm font-semibold transition-all lg:text-left lg:flex lg:items-center lg:justify-between ${activeTab === 'errate'
                                        ? 'bg-white dark:bg-red-900/40 text-red-500 shadow-sm lg:shadow-none'
                                        : 'text-[var(--foreground)] opacity-50 lg:hover:bg-slate-50 dark:lg:hover:bg-slate-800/50'
                                        }`}
                                >
                                    <span className="lg:flex lg:items-center lg:gap-2">
                                        <X className="hidden lg:block w-4 h-4" />
                                        Errate
                                    </span>
                                    <span className="lg:bg-red-100 lg:text-red-600 lg:px-2 lg:py-0.5 lg:rounded-full lg:text-xs lg:font-bold">
                                        {wrongList.length}
                                    </span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('corrette')}
                                    className={`flex-1 lg:w-full py-2.5 lg:py-3 lg:px-4 rounded-lg lg:rounded-xl text-[13px] lg:text-sm font-semibold transition-all lg:text-left lg:flex lg:items-center lg:justify-between ${activeTab === 'corrette'
                                        ? 'bg-white dark:bg-emerald-900/40 text-emerald-500 shadow-sm lg:shadow-none'
                                        : 'text-[var(--foreground)] opacity-50 lg:hover:bg-slate-50 dark:lg:hover:bg-slate-800/50'
                                        }`}
                                >
                                    <span className="lg:flex lg:items-center lg:gap-2">
                                        <Check className="hidden lg:block w-4 h-4" />
                                        Corrette
                                    </span>
                                    <span className="lg:bg-emerald-100 lg:text-emerald-600 lg:px-2 lg:py-0.5 lg:rounded-full lg:text-xs lg:font-bold">
                                        {correctList.length}
                                    </span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('omesse')}
                                    className={`flex-1 lg:w-full py-2.5 lg:py-3 lg:px-4 rounded-lg lg:rounded-xl text-[13px] lg:text-sm font-semibold transition-all lg:text-left lg:flex lg:items-center lg:justify-between ${activeTab === 'omesse'
                                        ? 'bg-white dark:bg-slate-700/60 text-[var(--foreground)] shadow-sm lg:shadow-none'
                                        : 'text-[var(--foreground)] opacity-50 lg:hover:bg-slate-50 dark:lg:hover:bg-slate-800/50'
                                        }`}
                                >
                                    <span className="lg:flex lg:items-center lg:gap-2">
                                        <Minus className="hidden lg:block w-4 h-4" />
                                        Omesse
                                    </span>
                                    <span className="lg:bg-slate-200 lg:text-slate-600 lg:px-2 lg:py-0.5 lg:rounded-full lg:text-xs lg:font-bold">
                                        {skippedList.length}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* CTA Buttons - Desktop Sidebar */}
                        <div className="hidden lg:block space-y-3">
                            {hasErrors ? (
                                <Button
                                    variant="gradient"
                                    size="lg"
                                    fullWidth
                                    onClick={handleRipassaErrori}
                                    isLoading={processingReview}
                                    disabled={!!attemptId?.startsWith('local-')}
                                    icon={<RotateCcw className="w-5 h-5" />}
                                >
                                    Ripassa ({wrongList.length + skippedList.length})
                                </Button>
                            ) : (
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4 text-center border border-emerald-100 dark:border-emerald-800">
                                    <div className="text-2xl mb-1">🌟</div>
                                    <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">Nessun Errore!</p>
                                </div>
                            )}
                            <Button
                                variant="outline"
                                fullWidth
                                onClick={() => navigate("/")}
                            >
                                Torna alla Home
                            </Button>
                        </div>
                    </div>

                    {/* Right Content - Questions List */}
                    <div className="lg:min-h-[400px]">
                        {getFilteredList().length === 0 ? (
                            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl lg:rounded-3xl p-8 lg:p-12 text-center shadow-sm">
                                <div className="text-5xl lg:text-6xl mb-4">
                                    {activeTab === 'errate' ? '🎉' : activeTab === 'corrette' ? '📋' : '📝'}
                                </div>
                                <p className="text-[var(--foreground)] opacity-50 text-sm lg:text-base">
                                    {activeTab === 'errate'
                                        ? 'Nessun errore! Ottimo lavoro.'
                                        : activeTab === 'corrette'
                                            ? 'Nessuna risposta corretta.'
                                            : 'Nessuna risposta omessa.'}
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-3 lg:gap-4 lg:grid-cols-2 xl:grid-cols-2">
                                {getFilteredList().map((q) => (
                                    <Link
                                        key={q.id}
                                        to={`/quiz/explanations/${attemptId}/${q.id}`}
                                        className="block bg-[var(--card)] border border-[var(--card-border)] rounded-2xl lg:rounded-3xl p-4 lg:p-5 transition-all hover:shadow-lg hover:-translate-y-0.5 shadow-sm group"
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Status Icon */}
                                            <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl flex items-center justify-center flex-shrink-0 ${activeTab === 'errate'
                                                ? 'bg-red-100 dark:bg-red-900/30'
                                                : activeTab === 'corrette'
                                                    ? 'bg-emerald-100 dark:bg-emerald-900/30'
                                                    : 'bg-slate-100 dark:bg-slate-800'
                                                }`}>
                                                {activeTab === 'errate' && <X className="w-5 h-5 lg:w-6 lg:h-6 text-red-500" />}
                                                {activeTab === 'corrette' && <Check className="w-5 h-5 lg:w-6 lg:h-6 text-emerald-500" />}
                                                {activeTab === 'omesse' && <Minus className="w-5 h-5 lg:w-6 lg:h-6 text-slate-400" />}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                {q.subject && (
                                                    <span className="inline-block text-[10px] lg:text-xs font-semibold text-[var(--foreground)] opacity-40 uppercase tracking-wide mb-1">
                                                        {q.subject}
                                                    </span>
                                                )}
                                                <p className="text-sm lg:text-base font-medium text-[var(--foreground)] line-clamp-2 mb-2 lg:mb-3 group-hover:text-[#00B1FF] transition-colors">
                                                    {q.text}
                                                </p>
                                                <div className="flex flex-wrap gap-2 lg:gap-3 text-[11px] lg:text-xs">
                                                    <span className={`px-2 py-1 rounded-md ${activeTab === 'corrette' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                                                        Risposta: {q.userAnswer}
                                                    </span>
                                                    <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-600">
                                                        Corretta: {q.correctAnswer}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Chevron */}
                                            <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0 group-hover:text-[#00B1FF] transition-colors" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ============================================================= */}
            {/* BOTTOM CTA - Mobile Only */}
            {/* ============================================================= */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--card)]/95 backdrop-blur-md border-t border-[var(--card-border)] px-5 py-3 pb-safe z-50">
                <div className="max-w-lg mx-auto space-y-2">
                    {hasErrors ? (
                        <Button
                            variant="gradient"
                            size="lg"
                            fullWidth
                            onClick={handleRipassaErrori}
                            isLoading={processingReview}
                            disabled={!!attemptId?.startsWith('local-')}
                            icon={<RotateCcw className="w-5 h-5" />}
                        >
                            Ripassa Errori ({wrongList.length + skippedList.length})
                        </Button>
                    ) : (
                        <Button
                            variant="gradient"
                            size="lg"
                            fullWidth
                            onClick={() => navigate("/")}
                        >
                            Torna alla Home
                        </Button>
                    )}

                    {hasErrors && (
                        <Button
                            variant="ghost"
                            size="sm"
                            fullWidth
                            onClick={() => navigate("/")}
                        >
                            Non ora
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
