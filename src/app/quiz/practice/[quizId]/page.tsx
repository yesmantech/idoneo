"use client";

import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Clock, Target, ChevronRight, AlertCircle, Play, BookOpen } from "lucide-react";

// Helper to normalize DB answers
function normalizeDBAnswer(val: string | null | undefined): string | null {
    if (!val) return null;
    return val.replace(/[.,:;()[\]]/g, "").trim().toLowerCase();
}

// Robust accessor to find correct answer
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
                            .from("questions")
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
        setSelectedSubjects(prev =>
            prev.includes(id)
                ? prev.filter(s => s !== id)
                : [...prev, id]
        );
    };

    const selectAll = () => {
        setSelectedSubjects(subjects.map(s => s.id));
    };

    const deselectAll = () => {
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

            // Fetch questions from selected subjects
            const { data: questions, error: questionsError } = await supabase
                .from("questions")
                .select("*, subject:subjects(name)")
                .in("subject_id", selectedSubjects)
                .eq("is_archived", false);

            if (questionsError || !questions?.length) throw new Error("Nessuna domanda disponibile");

            // Shuffle and limit
            const shuffled = questions.sort(() => Math.random() - 0.5);
            const limited = shuffled.slice(0, Math.min(questionCount, shuffled.length));

            const richAnswers = limited.map(q => ({
                questionId: q.id,
                text: q.text,
                subjectId: q.subject_id,
                subjectName: (q as any).subject?.name || "Materia",
                selectedOption: null,
                correctOption: getCorrectOption(q),
                isCorrect: false,
                isSkipped: false,
                explanation: q.explanation || null,
                options: { a: q.option_a, b: q.option_b, c: q.option_c, d: q.option_d }
            }));

            // Create attempt with config_snapshot for "Repeat Test"
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

            navigate(`/quiz/run/${attempt.id}?mode=practice&time=0`);

        } catch (err: any) {
            console.error("Start error:", err);
            setError(err.message);
            setStarting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error && subjects.length === 0) {
        return (
            <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-4">
                <div className="bg-red-50 text-red-600 p-4 rounded-xl max-w-sm text-center">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-medium">{error}</p>
                    <button onClick={() => navigate(-1)} className="mt-4 text-sm font-bold underline">Torna indietro</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
            {/* Top Bar */}
            <header className="sticky top-0 z-50 bg-white border-b border-slate-100">
                <div className="px-4 h-14 flex items-center gap-3 max-w-3xl mx-auto w-full">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full hover:bg-slate-50">
                        <ChevronRight className="w-5 h-5 text-slate-400 rotate-180" />
                    </button>
                    <span className="font-semibold text-slate-900">Allenamento</span>
                </div>
            </header>

            <main className="flex-1 px-5 py-6 max-w-lg mx-auto w-full flex flex-col">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-2xl bg-brand-cyan/10 flex items-center justify-center">
                        <Target className="w-6 h-6 text-brand-cyan" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">{quizTitle}</h1>
                        <p className="text-sm text-slate-500">Pratica personalizzata</p>
                    </div>
                </div>

                {/* Subject Selection */}
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mt-6 mb-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-brand-cyan" />
                            Seleziona Materie
                        </h3>
                        <div className="flex gap-2">
                            <button
                                onClick={selectAll}
                                className="text-xs font-bold text-brand-cyan hover:underline"
                            >
                                Tutte
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                                onClick={deselectAll}
                                className="text-xs font-bold text-slate-400 hover:underline"
                            >
                                Nessuna
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {subjects.map(subject => {
                            const isSelected = selectedSubjects.includes(subject.id);
                            return (
                                <button
                                    key={subject.id}
                                    onClick={() => toggleSubject(subject.id)}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${isSelected
                                            ? 'bg-brand-cyan/10 border border-brand-cyan/30'
                                            : 'bg-slate-50 border border-transparent hover:bg-slate-100'
                                        }`}
                                >
                                    <span className={`font-medium ${isSelected ? 'text-brand-cyan' : 'text-slate-700'}`}>
                                        {subject.name}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-400">{subject.questionCount} domande</span>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-brand-cyan bg-brand-cyan' : 'border-slate-300'
                                            }`}>
                                            {isSelected && (
                                                <svg className="w-3 h-3 text-white" viewBox="0 0 14 14" fill="none">
                                                    <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Question Count */}
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-6">
                    <h3 className="font-bold text-slate-900 mb-4">Numero di Domande</h3>
                    <div className="flex gap-2">
                        {[5, 10, 20, 30, 50].map(count => (
                            <button
                                key={count}
                                onClick={() => setQuestionCount(count)}
                                disabled={count > totalAvailableQuestions}
                                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${questionCount === count
                                        ? 'bg-brand-cyan text-white'
                                        : count > totalAvailableQuestions
                                            ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {count}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-2 text-center">
                        {totalAvailableQuestions} domande disponibili
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4 text-center">
                        {error}
                    </div>
                )}

                {/* Start Button */}
                <button
                    onClick={handleStart}
                    disabled={starting || selectedSubjects.length === 0}
                    className="mt-auto w-full py-4 rounded-2xl bg-brand-cyan text-white font-bold text-lg shadow-lg shadow-cyan-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {starting ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>
                            Inizia Allenamento <Play className="w-5 h-5 fill-current" />
                        </>
                    )}
                </button>
            </main>
        </div>
    );
}
