"use client";

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

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

export default function OfficialQuizStarterPage() {
    const { id: quizSlug } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeQuiz = async () => {
            if (!quizSlug) {
                setError("Quiz non specificato");
                setLoading(false);
                return;
            }

            try {
                // 1. Check auth
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    navigate("/login");
                    return;
                }

                // 2. Fetch quiz by slug
                const { data: quiz, error: quizError } = await supabase
                    .from("quizzes")
                    .select("id, title, time_limit")
                    .eq("slug", quizSlug)
                    .single();

                if (quizError || !quiz) {
                    setError(`Quiz "${quizSlug}" non trovato`);
                    setLoading(false);
                    return;
                }

                // 3. Fetch all subjects for this quiz
                const { data: subjects } = await supabase
                    .from("subjects")
                    .select("id")
                    .eq("quiz_id", quiz.id)
                    .eq("is_archived", false);

                if (!subjects || subjects.length === 0) {
                    setError("Nessuna materia trovata per questo quiz");
                    setLoading(false);
                    return;
                }

                const subjectIds = subjects.map(s => s.id);

                // 4. Fetch all questions for these subjects
                const { data: questions, error: questionsError } = await supabase
                    .from("questions")
                    .select("*, subject:subjects(name)")
                    .in("subject_id", subjectIds)
                    .eq("is_archived", false);

                if (questionsError || !questions || questions.length === 0) {
                    setError("Nessuna domanda disponibile per questo quiz");
                    setLoading(false);
                    return;
                }

                // 5. Shuffle questions
                const shuffledQuestions = questions.sort(() => Math.random() - 0.5);

                // 6. Build rich answers array
                const richAnswers = shuffledQuestions.map(q => ({
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

                // 7. Create attempt
                const { data: attempt, error: attemptError } = await supabase
                    .from("quiz_attempts")
                    .insert({
                        quiz_id: quiz.id,
                        user_id: user.id,
                        score: 0,
                        answers: richAnswers,
                        total_questions: richAnswers.length,
                        correct: 0,
                        wrong: 0,
                        blank: 0,
                        started_at: new Date().toISOString(),
                        mode: 'official', // Track attempt type
                    })
                    .select()
                    .single();

                if (attemptError || !attempt) {
                    console.error("Attempt creation error:", attemptError);
                    setError("Errore nella creazione del tentativo");
                    setLoading(false);
                    return;
                }

                // 8. Redirect to quiz runner
                const timeParam = quiz.time_limit ? `time=${quiz.time_limit}` : "time=0";
                navigate(`/quiz/run/${attempt.id}?mode=official&${timeParam}`);

            } catch (err: any) {
                console.error("Quiz initialization error:", err);
                setError(err.message || "Errore durante l'inizializzazione del quiz");
                setLoading(false);
            }
        };

        initializeQuiz();
    }, [quizSlug, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
                <p className="text-slate-600 font-medium">Preparazione quiz in corso...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 px-4">
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md text-center">
                    <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h2 className="text-xl font-bold text-red-900 mb-2">Errore</h2>
                    <p className="text-red-700">{error}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="mt-4 px-6 py-2 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800"
                    >
                        Torna indietro
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
