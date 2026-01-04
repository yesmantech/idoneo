"use client";

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import DOMPurify from "dompurify";

// Components
import { motion } from "framer-motion";

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
        console.log("Explanation Page Params:", { attemptId, questionId });

        if (!attempt || !questionId) {
            console.log("Waiting for attempt or questionId...");
            return;
        }

        // Find answer in attempt
        const ans = attempt.answers.find((a: any) => a.questionId === questionId);
        console.log("Found Answer:", ans);

        if (!ans) {
            console.error("Answer NOT found in attempt. Answers array:", attempt.answers);
        }

        setCurrentAnswer(ans || null);

        if (ans) {
            // Fetch live question details (explanation)
            const fetchQ = async () => {
                const { data } = await supabase
                    .from("questions")
                    .select("id, explanation, image_url")
                    .eq("id", ans.questionId)
                    .single();

                if (data) setQuestionDetails(data as any);
                setLoading(false);
            };
            fetchQ();
        } else {
            setLoading(false);
        }
    }, [attempt, questionId]);

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
        }
    };

    if (loading) return <div className="p-10 flex justify-center bg-[var(--background)] transition-colors"><div className="animate-spin h-8 w-8 border-2 border-[var(--foreground)] rounded-full border-t-transparent" /></div>;

    if (!currentAnswer) return <div className="p-10 text-center bg-[var(--background)] text-[var(--foreground)] transition-colors">Domanda non trovata in questa sessione.</div>;

    const explanation = questionDetails?.explanation;
    const isGeneric = !explanation;

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-20 transition-colors duration-500">
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
                        const isCorrect = currentAnswer.correctOption === optKey; // Note: You might need to normalize

                        let style = "bg-[var(--card)] border-[var(--card-border)] text-[var(--foreground)] opacity-70";
                        let icon = null;

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

                {/* Explanation Block */}
                <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl p-6 sm:p-8 border border-blue-100 dark:border-blue-900/30">
                    <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300 mb-4 flex items-center gap-2">
                        <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Spiegazione
                    </h3>
                    <div className="prose prose-blue dark:prose-invert prose-sm sm:prose-base max-w-none text-[var(--foreground)] opacity-80">
                        {explanation ? (
                            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(explanation) }} />
                        ) : (
                            <p className="italic opacity-60">Spiegazione non ancora disponibile per questa domanda.</p>
                        )}
                    </div>
                </div>

            </div>

            {/* Footer Navigation */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--card)] border-t border-[var(--card-border)] shadow-lg flex items-center justify-between sm:justify-center gap-4 transition-colors">
                <button
                    onClick={goToPrevError}
                    className="px-6 py-3 rounded-xl border border-[var(--card-border)] font-bold text-[var(--foreground)] opacity-50 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                    ← Precedente
                </button>
                <button
                    onClick={goToNextError}
                    className="px-8 py-3 rounded-xl bg-[var(--foreground)] text-[var(--background)] font-bold hover:opacity-90 transition-all shadow-lg shadow-black/10"
                >
                    Prossimo Errore →
                </button>
            </div>
        </div>
    );
}
