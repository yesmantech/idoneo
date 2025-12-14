// src/lib/leaderboardAlgorithm.ts

export interface ScoreInput {
    // Basic Answer Data
    answers: {
        isCorrect: boolean;
        questionId: string;
        timestamp: number; // Unix Time
    }[];
    // Context
    bankSize: number;
}

export interface ScoreResult {
    score: number; // 0-100

    // Breakdown (0-1)
    volumeScore: number;
    accuracyScore: number;
    recencyScore: number;
    coverageScore: number;
    reliability: number;

    // Derived Stats
    uniqueQuestions: number;
    totalAnswers: number;
}

// 1.1 Helper: Clamp
function clamp(x: number, min: number, max: number) {
    return Math.max(min, Math.min(max, x));
}

// 3. Core Function
export function computePreparationScore(input: ScoreInput): ScoreResult {
    const { answers, bankSize } = input;
    const now = Date.now();

    // Aggregates
    const totalAnswers = answers.length;
    if (totalAnswers === 0) {
        return {
            score: 0,
            volumeScore: 0,
            accuracyScore: 0,
            recencyScore: 0,
            coverageScore: 0,
            reliability: 0,
            uniqueQuestions: 0,
            totalAnswers: 0
        };
    }

    // Unique Questions & Last Attempt
    const uniqueIds = new Set(answers.map(a => a.questionId));
    const uniqueQuestions = uniqueIds.size;

    let lastAttemptAt = 0;
    answers.forEach(a => {
        if (a.timestamp > lastAttemptAt) lastAttemptAt = a.timestamp;
    });

    // 1.2 Volume Score (0-1)
    // Reward many unique questions with diminishing returns
    // V_ref = 0.6 * bank_size
    const safeBankSize = bankSize > 0 ? bankSize : 1000; // Fallback
    const vRef = 0.6 * safeBankSize;
    const volumeRaw = uniqueQuestions / vRef;
    const volumeScore = clamp(1 - Math.exp(-volumeRaw), 0, 1);

    // 1.3 Time-weighted accuracy score (0-1)
    // Use exponential time decay: tau_days = 30
    const TAU_DAYS = 30;
    const MS_PER_DAY = 1000 * 60 * 60 * 24;

    let weightedCorrect = 0;
    let weightedTotal = 0;

    answers.forEach(a => {
        const ageMs = now - a.timestamp;
        const ageDays = ageMs / MS_PER_DAY;
        // w_i = exp(- age_days_i / tau_days)
        // If future date, clamp age to 0
        const w = Math.exp(-Math.max(0, ageDays) / TAU_DAYS);

        weightedTotal += w;
        if (a.isCorrect) {
            weightedCorrect += w;
        }
    });

    const accuracyScore = weightedTotal > 0.0001
        ? clamp(weightedCorrect / weightedTotal, 0, 1)
        : 0;

    // 1.4 Recency score (0-1)
    // Penalize users who haven’t practiced recently
    // R_max = 30
    const R_MAX = 30;
    const daysSinceLast = (now - lastAttemptAt) / MS_PER_DAY;
    const recencyScore = 1 - clamp(Math.max(0, daysSinceLast) / R_MAX, 0, 1);

    // 1.5 Coverage / diversity score (0-1)
    // Combine coverage of bank and diversity (avoid farming same questions)
    const coverageRaw = clamp(uniqueQuestions / safeBankSize, 0, 1);
    const diversityRaw = clamp(uniqueQuestions / totalAnswers, 0, 1);
    const coverageScore = 0.5 * coverageRaw + 0.5 * diversityRaw;

    // 1.6 Reliability gate (0-1)
    // Avoid giving very high scores with too few unique questions
    const MIN_UNIQUE = 50;
    const MAX_UNIQUE = 300;

    let reliability = 0;
    if (uniqueQuestions <= MIN_UNIQUE) {
        reliability = 0;
        // Note: Providing 0 reliability below 50 means score is 0. 
        // User spec: (unique - 50) / 250. If unique < 50, this is negative. 
        // Clamp will set it to 0. Correct.
    } else {
        const relCalc = (uniqueQuestions - MIN_UNIQUE) / (MAX_UNIQUE - MIN_UNIQUE);
        reliability = clamp(relCalc, 0, 1);
    }

    // 1.7 Final score S ∈ [0,100]
    // Weights: Volume 0.45, Accuracy 0.30, Recency 0.15, Coverage 0.10
    const baseScore01 =
        0.45 * volumeScore
        + 0.30 * accuracyScore
        + 0.15 * recencyScore
        + 0.10 * coverageScore;

    const finalScore01 = baseScore01 * reliability;
    const S = Math.round(100 * clamp(finalScore01, 0, 1));

    return {
        score: S,
        volumeScore,
        accuracyScore,
        recencyScore,
        coverageScore,
        reliability,
        uniqueQuestions,
        totalAnswers
    };
}
