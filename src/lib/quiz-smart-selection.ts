import { supabase } from "@/lib/supabaseClient";

export type QuestionSelectionMode = "random" | "weak" | "unseen" | "unanswered" | "hardest" | "smart_mix";
export type SubjectConfig = {
    subjectId: string;
    count: number;
};

interface UserAnswerHistory {
    seen: Set<string>;
    wrong: Map<string, number>; // questionId -> wrongCount
    skipped: Map<string, number>; // questionId -> skipCount
}

/**
 * Optimized question selection - fetches all data in 2 queries max, then filters in-memory
 */
export async function fetchSmartQuestions(
    userId: string | null,
    quizId: string,
    subjectConfigs: SubjectConfig[],
    mode: QuestionSelectionMode
): Promise<{ questionId: string; subjectId: string }[]> {

    const subjectIds = subjectConfigs.filter(c => c.count > 0).map(c => c.subjectId);
    if (subjectIds.length === 0) return [];

    // 1. BATCH FETCH: All questions for all requested subjects (1 query)
    const { data: allQuestions } = await supabase
        .from("questions")
        .select("id, subject_id")
        .in("subject_id", subjectIds)
        .eq("is_archived", false);

    if (!allQuestions || allQuestions.length === 0) return [];

    // Group questions by subject
    const questionsBySubject = new Map<string, string[]>();
    for (const q of allQuestions) {
        const subjectId = q.subject_id;
        if (!questionsBySubject.has(subjectId)) {
            questionsBySubject.set(subjectId, []);
        }
        questionsBySubject.get(subjectId)!.push(q.id);
    }

    // 2. BATCH FETCH: User's answer history if needed (1 query)
    let userHistory: UserAnswerHistory | null = null;
    if (userId && mode !== "random" && mode !== "hardest") {
        userHistory = await fetchUserHistoryBatch(userId, quizId);
    }

    // 3. IN-MEMORY SELECTION: Process each subject config
    const finalSelection: { questionId: string; subjectId: string }[] = [];

    for (const config of subjectConfigs) {
        if (config.count <= 0) continue;

        const allIds = questionsBySubject.get(config.subjectId) || [];
        if (allIds.length === 0) continue;

        let selectedForSubject: string[] = [];

        if (mode === "random") {
            selectedForSubject = shuffleArray(allIds).slice(0, config.count);
        }
        else if (mode === "unseen" && userHistory) {
            const unseen = allIds.filter(id => !userHistory.seen.has(id));
            selectedForSubject = fillPool(unseen, allIds, config.count);
        }
        else if (mode === "weak" && userHistory) {
            const wrongIds = getTopByCount(userHistory.wrong, allIds);
            selectedForSubject = fillPool(wrongIds, allIds, config.count);
        }
        else if (mode === "unanswered" && userHistory) {
            const skippedIds = getTopByCount(userHistory.skipped, allIds);
            selectedForSubject = fillPool(skippedIds, allIds, config.count);
        }
        else if (mode === "hardest") {
            // Query question_stats for difficulty ranking
            const { data: hardestData } = await supabase
                .from("question_stats")
                .select("question_id")
                .in("question_id", allIds)
                .order("difficulty_index", { ascending: false })
                .limit(config.count);

            if (hardestData && hardestData.length > 0) {
                const hardestIds = hardestData.map(d => d.question_id);
                selectedForSubject = fillPool(hardestIds, allIds, config.count);
            } else {
                // Fallback to random if no stats available yet
                selectedForSubject = shuffleArray(allIds).slice(0, config.count);
            }
        }
        else if (mode === "smart_mix" && userHistory) {
            selectedForSubject = selectSmartMix(allIds, userHistory, config.count);
        }

        // Fallback to random if nothing selected
        if (selectedForSubject.length === 0 && mode !== "random") {
            selectedForSubject = shuffleArray(allIds).slice(0, config.count);
        }

        // De-dupe
        selectedForSubject = [...new Set(selectedForSubject)];

        finalSelection.push(...selectedForSubject.map(id => ({ questionId: id, subjectId: config.subjectId })));
    }

    return finalSelection;
}

// --- Batch fetch user history (1 query instead of N) ---

async function fetchUserHistoryBatch(userId: string, quizId: string): Promise<UserAnswerHistory> {
    const { data } = await supabase
        .from("quiz_attempts")
        .select("answers")
        .eq("user_id", userId)
        .eq("quiz_id", quizId);

    const seen = new Set<string>();
    const wrong = new Map<string, number>();
    const skipped = new Map<string, number>();

    data?.forEach((row: any) => {
        if (Array.isArray(row.answers)) {
            row.answers.forEach((ans: any) => {
                if (ans.questionId) {
                    seen.add(ans.questionId);

                    if (ans.isCorrect === false && ans.isSkipped !== true) {
                        wrong.set(ans.questionId, (wrong.get(ans.questionId) || 0) + 1);
                    }

                    if (ans.isSkipped === true || ans.selectedOption === null) {
                        skipped.set(ans.questionId, (skipped.get(ans.questionId) || 0) + 1);
                    }
                }
            });
        }
    });

    return { seen, wrong, skipped };
}

// --- Helpers ---

function getTopByCount(countMap: Map<string, number>, validIds: string[]): string[] {
    const validSet = new Set(validIds);
    return Array.from(countMap.entries())
        .filter(([id]) => validSet.has(id))
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => id);
}

function fillPool(preferred: string[], all: string[], count: number): string[] {
    if (preferred.length >= count) {
        return shuffleArray(preferred).slice(0, count);
    }
    const preferredSet = new Set(preferred);
    const others = all.filter(id => !preferredSet.has(id));
    return [...preferred, ...shuffleArray(others).slice(0, count - preferred.length)];
}

function selectSmartMix(allIds: string[], history: UserAnswerHistory, count: number): string[] {
    // Mix: 40% Weak, 30% Unseen, 30% Random
    const countWeak = Math.round(count * 0.4);
    const countUnseen = Math.round(count * 0.3);
    const countRandom = count - countWeak - countUnseen;

    const wrongIds = getTopByCount(history.wrong, allIds);
    const unseen = allIds.filter(id => !history.seen.has(id));

    // Select Weak
    const selectedWeak = shuffleArray(wrongIds).slice(0, countWeak);

    // Select Unseen (exclude already selected weak)
    const selectedUnseen = shuffleArray(unseen.filter(id => !selectedWeak.includes(id))).slice(0, countUnseen);

    // Select Random (fill the rest)
    const used = new Set([...selectedWeak, ...selectedUnseen]);
    const remaining = allIds.filter(id => !used.has(id));
    const selectedRandom = shuffleArray(remaining).slice(0, countRandom);

    // If we didn't fill quotas, fill with random
    let currentSelection = [...selectedWeak, ...selectedUnseen, ...selectedRandom];
    if (currentSelection.length < count) {
        const usedAll = new Set(currentSelection);
        const rest = allIds.filter(id => !usedAll.has(id));
        const filler = shuffleArray(rest).slice(0, count - currentSelection.length);
        currentSelection = [...currentSelection, ...filler];
    }

    return currentSelection;
}

function shuffleArray<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}
