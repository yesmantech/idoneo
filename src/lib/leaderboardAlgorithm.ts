// src/lib/leaderboardAlgorithm.ts

/**
 * IDONEO Skill Algorithm Implementation
 * 
 * Target: Calculate a 0-100 score representing candidate strength.
 * Factors: Weighted Accuracy (Time & Type), Volume, Trend.
 */

// Types based on likely DB structure
interface AnswerPoint {
    isCorrect: boolean;
    timestamp: Date; // For Decay
    isOfficial: boolean; // For Type Weight
}

interface ScoreResult {
    score: number; // 0-100
    accuracyWeighted: number;
    volumeFactor: number;
    trendMultiplier: number;
}

// Parameters
const DECAY_TAU_DAYS = 21; // Time decay constant
const VOLUME_K = 300; // Question volume scale
const OFFICIAL_BONUS = 1.25; // 25% bonus for official sims
const CUSTOM_WEIGHT = 1.0;

/**
 * Core Function: Compute Score for a set of answers
 */
export function computeSkillScore(answers: AnswerPoint[]): ScoreResult {
    if (!answers.length) {
        return { score: 0, accuracyWeighted: 0, volumeFactor: 0, trendMultiplier: 1 };
    }

    const now = new Date().getTime();

    // 1. Calculate Weights and Weighted Correct Mass
    let weightedTotal = 0;
    let weightedCorrect = 0;

    const processedPoints = answers.map(a => {
        // Time Decay
        const ageMs = now - a.timestamp.getTime();
        const ageDays = ageMs / (1000 * 60 * 60 * 24);
        const timeWeight = Math.exp(-ageDays / DECAY_TAU_DAYS);

        // Type Weight
        const typeWeight = a.isOfficial ? OFFICIAL_BONUS : CUSTOM_WEIGHT;

        // Combined Weight
        const w = timeWeight * typeWeight;

        // Accumulate
        weightedTotal += w;
        if (a.isCorrect) {
            weightedCorrect += w;
        }

        return { ...a, weight: w };
    });

    // 2. Weighted Accuracy
    // Avoid division by zero
    const accuracyWeighted = weightedTotal > 0.001 ? (weightedCorrect / weightedTotal) : 0;

    // 3. Volume Factor (Diminishing Returns)
    // Q_eff = WeightedTotal
    // Factor = 1 - exp(-Q_eff / K)
    const volumeFactor = 1 - Math.exp(-weightedTotal / VOLUME_K);

    // 4. Trend / Progress Factor
    // Compare Recent vs Old.
    // Definition of 'Recent': Last 30% of weighted mass? Or last 14 days?
    // Prompt suggests: "Recent window (e.g. last 14 days)"

    // Let's sort by date descending first
    const sortedPoints = [...processedPoints].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Split into Recent / Old based on time (14 days)
    const RECENT_DAYS = 14;
    const cutoffTime = now - (RECENT_DAYS * 24 * 60 * 60 * 1000);

    let recentMass = 0;
    let recentCorrect = 0;
    let oldMass = 0;
    let oldCorrect = 0;

    sortedPoints.forEach(p => {
        if (p.timestamp.getTime() > cutoffTime) {
            recentMass += p.weight;
            if (p.isCorrect) recentCorrect += p.weight;
        } else {
            oldMass += p.weight;
            if (p.isCorrect) oldCorrect += p.weight;
        }
    });

    // If no old data, trend is neutral (1.0). If no recent data, same.
    let trendMultiplier = 1.0;

    if (recentMass > 1 && oldMass > 1) {
        const accRecent = recentCorrect / recentMass;
        const accOld = oldCorrect / oldMass;
        const delta = accRecent - accOld;

        // Clamp(1 + 0.5 * Delta, 0.8, 1.1)
        let multi = 1 + 0.5 * delta;
        if (multi < 0.8) multi = 0.8;
        if (multi > 1.1) multi = 1.1;
        trendMultiplier = multi;
    }

    // 5. Final Calculation
    const baseScore = 100 * accuracyWeighted * volumeFactor;
    let finalScore = baseScore * trendMultiplier;

    // 6. Safeguard for very low activity
    // "If Q_eff < 50 ... Score = Score * (Q_eff / 50)^0.5"
    if (weightedTotal < 50) {
        finalScore = finalScore * Math.pow(weightedTotal / 50, 0.5);
    }

    // Clamp 0-100
    if (finalScore > 100) finalScore = 100;
    if (finalScore < 0) finalScore = 0;

    return {
        score: Math.round(finalScore * 100) / 100, // Round to 2 decimals
        accuracyWeighted: Math.round(accuracyWeighted * 10000) / 10000,
        volumeFactor: Math.round(volumeFactor * 10000) / 10000,
        trendMultiplier: Math.round(trendMultiplier * 10000) / 10000
    };
}
