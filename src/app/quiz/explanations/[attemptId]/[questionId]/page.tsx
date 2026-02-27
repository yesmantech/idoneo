"use client";

import { Lightbulb, Loader2, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import DOMPurify from "dompurify";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

// Components
import { motion } from "framer-motion";

// Helper to normalize DB answers for comparison
function normalizeDBAnswer(val: string | null | undefined): string | null {
    if (!val) return null;
    return val.replace(/[.,:;()\[\]]/g, "").trim().toLowerCase();
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
    // We need to fetch the explanation fresh from the DB because attempt.answers might be stale or not have it
    // actually, attempt.answers is a JSON blob saved at finish time.
    // It WON'T have the explanation unless we saved it.
    // AND we don't want to save explanations in the attempt JSON usually (bloat).
    // SO we must fetch the Question row to get the explanation text.
}

interface QuestionDetails {
    id: string;
    explanation: string | null;
    image_url: string | null;
}

export default function ExplanationPage() {
    const { attemptId, questionId } = useParams<{ attemptId: string; questionId: string }>();
    const navigate = useNavigate();

    const [attempt, setAttempt] = useState<any>(null);
    const [currentAnswer, setCurrentAnswer] = useState<RichAnswer | null>(null);
    const [questionDetails, setQuestionDetails] = useState<QuestionDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    // Load Attempt
    useEffect(() => {
        if (!attemptId) return;
        const load = async () => {
            const { data } = await supabase.from("quiz_attempts").select("*").eq("id", attemptId).single();
            if (data) setAttempt(data);
        };
        load();
    }, [attemptId]);

    // Set Current Answer & Load Explanation
    useEffect(() => {
        if (!attempt || !questionId) {
            return;
        }

        // Reset state so we don't flash previous question's UI
        setQuestionDetails(null);
        setLoading(true);

        const ans = attempt.answers.find((a: any) => a.questionId === questionId);
        setCurrentAnswer(ans || null);

        if (ans) {
            // Fetch live question details (explanation) with Cache-Control headers
            const fetchQ = async () => {
                const { data } = await supabase
                    .from("questions")
                    .select("id, explanation, image_url")
                    .eq("id", ans.questionId)
                    .setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
                    .setHeader('Pragma', 'no-cache')
                    .setHeader('Expires', '0')
                    .single();

                if (data) setQuestionDetails(data as any);
                setLoading(false);
            };
            fetchQ();
        } else {
            setLoading(false);
        }
    }, [attempt, questionId]);

    const handleGenerateExplanation = async () => {
        if (!currentAnswer || !questionDetails) return;

        setIsGenerating(true);
        try {
            const correctAnswerText = getCorrectAnswerText(currentAnswer);

            const { data, error } = await supabase.functions.invoke('generate-explanation', {
                body: {
                    questionId: currentAnswer.questionId,
                    questionText: currentAnswer.text,
                    correctAnswer: correctAnswerText
                }
            });

            if (error) throw error;
            if (data?.explanation) {
                setQuestionDetails({
                    ...questionDetails,
                    explanation: data.explanation
                });
            }
        } catch (error) {
            console.error("Error generating explanation:", error);
            alert("Si è verificato un errore durante la generazione della spiegazione. Riprova più tardi.");
        } finally {
            setIsGenerating(false);
        }
    };

    // Helper to get the actual text of the correct answer
    const getCorrectAnswerText = (answer: RichAnswer) => {
        // If correctOption perfectly matches an option key (a, b, c, d)
        if (answer.correctOption && ['a', 'b', 'c', 'd'].includes(answer.correctOption)) {
            return (answer.options as any)[answer.correctOption];
        }

        // If correctOption contains the actual text already (or we fallback)
        for (const key of ['a', 'b', 'c', 'd']) {
            const text = (answer.options as any)[key];
            if (checkIsCorrect(key, answer.correctOption, answer.options)) {
                return text;
            }
        }
        return answer.correctOption || "Risposta Corretta Sconosciuta";
    };

    // Navigation Helper
    const goToNextError = () => {
        if (!attempt) return;
        const errors = attempt.answers.filter((a: any) => !a.isCorrect);
        const currentIndex = errors.findIndex((a: any) => a.questionId === questionId);

        if (currentIndex !== -1 && currentIndex < errors.length - 1) {
            const nextId = errors[currentIndex + 1].questionId;
            navigate(`/quiz/explanations/${attemptId}/${nextId}`);
        } else {
            // Cycle or stop?
            alert("Hai visto tutti gli errori!");
            navigate(`/quiz/results/${attemptId}`);
        }
    };

    const goToPrevError = () => {
        if (!attempt) return;
        const errors = attempt.answers.filter((a: any) => !a.isCorrect);
        const currentIndex = errors.findIndex((a: any) => a.questionId === questionId);

        if (currentIndex > 0) {
            const prevId = errors[currentIndex - 1].questionId;
            navigate(`/quiz/explanations/${attemptId}/${prevId}`);
        } else {
            navigate(`/quiz/results/${attemptId}`);
        }
    };

    if (loading) return <div className="p-10 flex justify-center bg-[var(--background)] transition-colors"><div className="animate-spin h-8 w-8 border-2 border-[var(--foreground)] rounded-full border-t-transparent" /></div>;

    if (!currentAnswer) return <div className="p-10 text-center bg-[var(--background)] text-[var(--foreground)] transition-colors">Domanda non trovata in questa sessione.</div>;

    const explanation = questionDetails?.explanation;
    const isGeneric = !explanation;

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-32 md:pb-36 transition-colors duration-500">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-[var(--card)] border-b border-[var(--card-border)] px-4 h-16 flex items-center justify-between shadow-sm">
                <button
                    onClick={() => navigate(`/quiz/results/${attemptId}`)}
                    className="flex items-center gap-2 text-[var(--foreground)] opacity-50 hover:opacity-100 font-medium transition-all"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    <span>Torna ai risultati</span>
                </button>
                <div className="font-bold text-[var(--foreground)]">Spiegazione</div>
                <div className="w-20" /> {/* Spacer */}
            </div>

            <div className="max-w-3xl mx-auto px-6 py-8">

                {/* Meta */}
                <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--foreground)] opacity-40">
                    <span>{currentAnswer.subjectName}</span>
                    <span>•</span>
                    <span className={currentAnswer.isCorrect ? "text-emerald-500" : currentAnswer.isSkipped ? "text-[var(--foreground)] opacity-50" : "text-rose-500"}>
                        {currentAnswer.isCorrect ? "Corretta" : currentAnswer.isSkipped ? "Omessa" : "Errata"}
                    </span>
                </div>

                {/* Question */}
                <h1 className="text-xl sm:text-2xl font-medium leading-relaxed text-[var(--foreground)] mb-8">
                    {currentAnswer.text}
                </h1>

                {/* Options */}
                <div className="space-y-3 mb-12">
                    {['a', 'b', 'c', 'd'].map(optKey => {
                        const text = (currentAnswer.options as any)[optKey];
                        const isSelected = currentAnswer.selectedOption === optKey;
                        const isCorrect = checkIsCorrect(optKey, currentAnswer.correctOption, currentAnswer.options);

                        let style = "bg-[var(--card)] border-[var(--card-border)] text-[var(--foreground)] opacity-70";
                        let icon: React.ReactNode = null;

                        if (isCorrect) {
                            style = "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-900 dark:text-emerald-400 ring-1 ring-emerald-500 shadow-sm shadow-emerald-500/10";
                            icon = <span className="text-emerald-600 dark:text-emerald-400 text-lg">✓</span>;
                        } else if (isSelected) {
                            style = "bg-rose-50 dark:bg-rose-900/20 border-rose-500 text-rose-900 dark:text-rose-400 ring-1 ring-rose-500 shadow-sm shadow-rose-500/10";
                            icon = <span className="text-rose-500 dark:text-rose-400 text-lg">✕</span>;
                        }

                        return (
                            <div key={optKey} className={`p-4 rounded-xl border flex items-center justify-between transition-all duration-300 ${style}`}>
                                <div className="flex items-center gap-4">
                                    <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold opacity-60">
                                        {optKey.toUpperCase()}
                                    </span>
                                    <span className="font-medium">{text}</span>
                                </div>
                                {icon}
                            </div>
                        )
                    })}
                </div>

                {/* Tier S Explanation Block / Accordion */}
                <div className="mt-6">
                    {explanation ? (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-blue-100 dark:border-blue-900/50 shadow-sm relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
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
                                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(explanation) }} />
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

            </div>

            {/* Footer Navigation */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--card)] border-t border-[var(--card-border)] shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] flex items-center justify-between sm:justify-center gap-4 transition-colors z-40 bg-opacity-95 backdrop-blur-md">
                <button
                    onClick={goToPrevError}
                    className="px-6 py-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                    <ChevronLeft className="w-5 h-5" />
                    <span>Precedente</span>
                </button>
                <button
                    onClick={goToNextError}
                    className="px-8 py-3.5 rounded-2xl bg-[#00B1FF] text-white font-bold hover:bg-blue-500 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 flex-1 sm:flex-none"
                >
                    <span>Prossimo Errore</span>
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
