"use client";

import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { AlertCircle, Play, BookOpen, Target, Check } from "lucide-react";
import { analytics } from "@/lib/analytics";
import { motion, AnimatePresence } from "framer-motion";
import BackButton from "@/components/ui/BackButton";
import { hapticLight } from "@/lib/haptics";

// V5 FIX: Fisher-Yates shuffle (replaces biased Array.sort(random))
function shuffleArray<T>(array: T[]): T[] {
    const a = [...array];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// Helper to normalize DB answers
function normalizeDBAnswer(val: string | null | undefined): string | null {
    if (!val) return null;
    return val.replace(/[.,:;()[\]]/g, "").trim().toLowerCase();
}

// V6: Re-added — needed for quiz runner instant-check mode
function getCorrectOption(q: any): string | null {
    if (!q) return null;
    if (q.correct_option) return normalizeDBAnswer(q.correct_option);
    if (q.correct_answer) return normalizeDBAnswer(q.correct_answer);
    if (q.answer) return normalizeDBAnswer(q.answer);
    return null;
}

interface Subject {
    id: string;
    name: string;
    questionCount: number;
}

const QUESTION_COUNTS = [5, 10, 20, 30, 50];

export default function PracticeStartPage() {
    const { quizId } = useParams<{ quizId: string }>();
    const [searchParams] = useSearchParams();
    const preSelectedSubject = searchParams.get("subject");

    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);

    const [quizTitle, setQuizTitle] = useState("Quiz");
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [questionCount, setQuestionCount] = useState(10);

    // Fetch subjects on mount
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

                // Fetch quiz
                const { data: quiz } = await supabase
                    .from("quizzes")
                    .select("id, title")
                    .eq("id", quizId)
                    .single();

                if (!quiz) throw new Error("Quiz non trovato");
                setQuizTitle(quiz.title);

                // Fetch subjects with question counts
                const { data: subjectsData } = await supabase
                    .from("subjects")
                    .select("id, name")
                    .eq("quiz_id", quizId)
                    .eq("is_archived", false);

                if (!subjectsData?.length) throw new Error("Nessuna materia trovata");

                // Get question counts per subject
                const subjectsWithCounts: Subject[] = await Promise.all(
                    subjectsData.map(async (s) => {
                        const { count } = await supabase
                            .from("questions_safe")
                            .select("*", { count: 'exact', head: true })
                            .eq("subject_id", s.id)
                            .eq("is_archived", false);

                        return {
                            id: s.id,
                            name: s.name,
                            questionCount: count || 0
                        };
                    })
                );

                setSubjects(subjectsWithCounts.filter(s => s.questionCount > 0));

                // Pre-select subject if provided in URL
                if (preSelectedSubject) {
                    setSelectedSubjects([preSelectedSubject]);
                }

                setLoading(false);

            } catch (err: any) {
                console.error("Practice page error:", err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchData();
    }, [quizId, navigate, preSelectedSubject]);

    const toggleSubject = (id: string) => {
        hapticLight();
        setSelectedSubjects(prev =>
            prev.includes(id)
                ? prev.filter(s => s !== id)
                : [...prev, id]
        );
    };

    const selectAll = () => {
        hapticLight();
        setSelectedSubjects(subjects.map(s => s.id));
    };

    const deselectAll = () => {
        hapticLight();
        setSelectedSubjects([]);
    };

    const totalAvailableQuestions = subjects
        .filter(s => selectedSubjects.includes(s.id))
        .reduce((sum, s) => sum + s.questionCount, 0);

    const handleStart = async () => {
        if (selectedSubjects.length === 0) {
            setError("Seleziona almeno una materia");
            return;
        }

        setStarting(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Utente non autenticato");

            const { data: questions, error: questionsError } = await supabase
                .from("questions_safe")
                .select("id, text, subject_id, option_a, option_b, option_c, option_d, explanation, is_archived")
                .in("subject_id", selectedSubjects)
                .eq("is_archived", false);

            if (questionsError || !questions?.length) throw new Error("Nessuna domanda disponibile");

            const subjectIds = [...new Set(questions.map((q: any) => q.subject_id))];
            const { data: subjectData } = await supabase
                .from("subjects")
                .select("id, name")
                .in("id", subjectIds);
            const subjectMap = new Map(subjectData?.map((s: any) => [s.id, s.name]) || []);

            const shuffled = shuffleArray(questions);
            const limited = shuffled.slice(0, Math.min(questionCount, shuffled.length));

            const richAnswers = limited.map((q: any) => ({
                questionId: q.id,
                text: q.text,
                subjectId: q.subject_id,
                subjectName: subjectMap.get(q.subject_id) || "Materia",
                selectedOption: null,
                correctOption: null,
                isCorrect: false,
                isSkipped: false,
                explanation: q.explanation || null,
                options: { a: q.option_a, b: q.option_b, c: q.option_c, d: q.option_d }
            }));

            const { data: attempt, error: attemptError } = await supabase
                .from("quiz_attempts")
                .insert({
                    quiz_id: quizId,
                    user_id: user.id,
                    score: 0,
                    answers: richAnswers,
                    total_questions: richAnswers.length,
                    correct: 0,
                    wrong: 0,
                    blank: 0,
                    started_at: new Date().toISOString(),
                    mode: 'custom',
                    config_snapshot: {
                        type: 'practice',
                        subjects: selectedSubjects,
                        questionCount: questionCount,
                        subjectNames: subjects
                            .filter(s => selectedSubjects.includes(s.id))
                            .map(s => s.name)
                    }
                })
                .select()
                .single();

            if (attemptError || !attempt) throw attemptError;

            analytics.track('quiz_started', {
                quiz_id: quizId,
                title: quizTitle,
                mode: 'practice',
                subjects_count: selectedSubjects.length,
                questions_count: richAnswers.length
            });

            navigate(`/quiz/run/${attempt.id}?mode=practice&time=0`);

        } catch (err: any) {
            console.error("Start error:", err);
            setError(err.message);
            setStarting(false);
        }
    };

    // ─── Loading ────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#00B1FF] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error && subjects.length === 0) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-6">
                <div className="bg-red-500/10 text-red-400 p-6 rounded-2xl max-w-sm text-center">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-medium">{error}</p>
                    <button onClick={() => navigate(-1)} className="mt-4 text-sm font-bold text-[var(--foreground)] underline">
                        Torna indietro
                    </button>
                </div>
            </div>
        );
    }

    const canStart = selectedSubjects.length > 0;

    return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col">

            {/* ── Header ─────────────────────────────────────────────────────── */}
            <header
                className="sticky top-0 z-50 bg-[var(--background)]/90 backdrop-blur-xl border-b border-[var(--card-border)]"
                style={{ paddingTop: 'var(--safe-area-top, 0px)' }}
            >
                <div className="h-14 px-4 flex items-center justify-between max-w-lg mx-auto">
                    <BackButton />
                    <span className="font-black text-[var(--foreground)] text-[15px] tracking-tight">Allenamento</span>
                    <div className="w-9" />
                </div>
            </header>

            {/* ── Main ───────────────────────────────────────────────────────── */}
            <main className="flex-1 px-4 pt-5 pb-36 max-w-lg mx-auto w-full space-y-4">

                {/* Hero */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-center gap-4 px-1"
                >
                    <div className="w-14 h-14 rounded-2xl bg-[#00B1FF]/15 flex items-center justify-center flex-shrink-0">
                        <Target className="w-7 h-7 text-[#00B1FF]" />
                    </div>
                    <div>
                        <h1 className="text-[18px] font-black text-[var(--foreground)] leading-tight">{quizTitle}</h1>
                        <p className="text-[13px] text-[var(--muted-foreground)] mt-0.5">Pratica personalizzata</p>
                    </div>
                </motion.div>

                {/* ── Subject Selection Card ──────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                    className="bg-[var(--card)] rounded-3xl border border-[var(--card-border)] overflow-hidden"
                >
                    {/* Card header */}
                    <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-[var(--card-border)]">
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-[#00B1FF]" />
                            <span className="font-black text-[var(--foreground)] text-[14px] tracking-tight">Materie</span>
                            {selectedSubjects.length > 0 && (
                                <span className="text-[11px] font-bold bg-[#00B1FF]/15 text-[#00B1FF] px-2 py-0.5 rounded-full">
                                    {selectedSubjects.length}/{subjects.length}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={selectAll} className="text-[12px] font-bold text-[#00B1FF] active:opacity-60 transition-opacity">
                                Tutte
                            </button>
                            <div className="w-px h-3.5 bg-[var(--card-border)]" />
                            <button onClick={deselectAll} className="text-[12px] font-bold text-[var(--muted-foreground)] active:opacity-60 transition-opacity">
                                Nessuna
                            </button>
                        </div>
                    </div>

                    {/* Subject list */}
                    <div className="divide-y divide-[var(--card-border)] max-h-56 overflow-y-auto">
                        {subjects.map((subject, i) => {
                            const isSelected = selectedSubjects.includes(subject.id);
                            return (
                                <motion.button
                                    key={subject.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.08 + i * 0.04 }}
                                    onClick={() => toggleSubject(subject.id)}
                                    className="w-full flex items-center justify-between px-5 py-3.5 transition-colors active:bg-[var(--card-border)]"
                                >
                                    <span className={`font-semibold text-[14px] text-left ${isSelected ? 'text-[#00B1FF]' : 'text-[var(--foreground)]'}`}>
                                        {subject.name}
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[12px] text-[var(--muted-foreground)]">{subject.questionCount}</span>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                                            ${isSelected ? 'border-[#00B1FF] bg-[#00B1FF]' : 'border-[var(--card-border)] bg-transparent'}`}>
                                            {isSelected && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>
                </motion.div>

                {/* ── Question Count Card ─────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className="bg-[var(--card)] rounded-3xl border border-[var(--card-border)] p-5"
                >
                    <div className="flex items-center justify-between mb-4">
                        <span className="font-black text-[var(--foreground)] text-[14px] tracking-tight">Domande</span>
                        <span className="text-[12px] text-[var(--muted-foreground)]">
                            {totalAvailableQuestions} disponibili
                        </span>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                        {QUESTION_COUNTS.map(count => {
                            const isActive = questionCount === count;
                            const isDisabled = count > totalAvailableQuestions;
                            return (
                                <button
                                    key={count}
                                    onClick={() => { if (!isDisabled) { hapticLight(); setQuestionCount(count); } }}
                                    disabled={isDisabled}
                                    className={`py-2.5 rounded-2xl text-[14px] font-black transition-all
                                        ${isActive
                                            ? 'bg-[#00B1FF] text-white shadow-[0_4px_12px_rgba(0,177,255,0.35)]'
                                            : isDisabled
                                                ? 'bg-[var(--card-border)] text-[var(--muted-foreground)] opacity-30 cursor-not-allowed'
                                                : 'bg-[var(--background)] text-[var(--foreground)] active:scale-95'}`}
                                >
                                    {count}
                                </button>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Error */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="bg-red-500/10 text-red-400 px-4 py-3 rounded-2xl text-[13px] font-medium text-center border border-red-500/15"
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* ── Sticky CTA ─────────────────────────────────────────────────── */}
            <div
                className="fixed bottom-0 left-0 right-0 px-4 pt-3 bg-[var(--background)]/90 backdrop-blur-xl border-t border-[var(--card-border)]"
                style={{ paddingBottom: 'max(20px, var(--safe-area-bottom, 20px))' }}
            >
                <div className="max-w-lg mx-auto">
                    <motion.button
                        onClick={handleStart}
                        disabled={starting || !canStart}
                        whileTap={{ scale: 0.97 }}
                        className={`w-full py-4 rounded-2xl font-black text-[16px] flex items-center justify-center gap-2.5 transition-all
                            ${canStart
                                ? 'bg-[#00B1FF] text-white shadow-[0_4px_24px_rgba(0,177,255,0.35)]'
                                : 'bg-[var(--card)] text-[var(--muted-foreground)] cursor-not-allowed'}`}
                    >
                        {starting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                Inizia Allenamento
                                <Play className="w-4 h-4 fill-current" />
                            </>
                        )}
                    </motion.button>
                </div>
            </div>
        </div>
    );
}
