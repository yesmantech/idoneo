import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

export interface SubjectProgress {
    subjectId: string;
    total: number;
    completed: number;
    percentage: number;
}

export function useSubjectProgress(quizId: string | undefined) {
    const { user } = useAuth();
    const [progress, setProgress] = useState<Record<string, SubjectProgress>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!quizId || !user) {
            setLoading(false);
            return;
        }

        const fetchProgress = async () => {
            setLoading(true);
            try {
                // 1. Get Total Questions per Subject
                // We fetch all question IDs and Subject IDs to count them. 
                // Using .csv() or .count() is harder with grouping in Supabase client, so we fetch lightweight data.
                const { data: questions, error: qError } = await supabase
                    .from("questions")
                    .select("id, subject_id")
                    .eq("quiz_id", quizId)
                    .eq("is_archived", false);

                if (qError) throw qError;

                const totalPerSubject: Record<string, number> = {};
                questions?.forEach(q => {
                    if (q.subject_id) {
                        totalPerSubject[q.subject_id] = (totalPerSubject[q.subject_id] || 0) + 1;
                    }
                });

                // 2. Get User's unique correct answers
                // Fetch only the 'answers' column for this user's attempts on this quiz
                const { data: attempts, error: aError } = await supabase
                    .from("quiz_attempts")
                    .select("answers")
                    .eq("quiz_id", quizId)
                    .eq("user_id", user.id);

                if (aError) throw aError;

                const correctQuestionIds = new Set<string>();

                attempts?.forEach(attempt => {
                    const answers = attempt.answers as any[]; // JSONB column
                    if (Array.isArray(answers)) {
                        answers.forEach(ans => {
                            if (ans.isCorrect && ans.questionId) {
                                correctQuestionIds.add(ans.questionId);
                            }
                        });
                    }
                });

                // 3. Map Correct Answers to Subjects
                // We need to know which subject each correct question belongs to. 
                // We can use the 'questions' array we already fetched.
                const questionSubjectMap = new Map<string, string>();
                questions?.forEach(q => {
                    if (q.subject_id) questionSubjectMap.set(q.id, q.subject_id);
                });

                const learnedPerSubject: Record<string, number> = {};
                correctQuestionIds.forEach(qId => {
                    const sId = questionSubjectMap.get(qId);
                    if (sId) {
                        learnedPerSubject[sId] = (learnedPerSubject[sId] || 0) + 1;
                    }
                });

                // 4. Build Final Stats
                const stats: Record<string, SubjectProgress> = {};
                Object.keys(totalPerSubject).forEach(sId => {
                    const total = totalPerSubject[sId] || 0;
                    const completed = learnedPerSubject[sId] || 0;
                    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

                    stats[sId] = {
                        subjectId: sId,
                        total,
                        completed,
                        percentage
                    };
                });

                setProgress(stats);

            } catch (err) {
                console.error("Error fetching subject progress:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProgress();
    }, [quizId, user]);

    return { progress, loading };
}
