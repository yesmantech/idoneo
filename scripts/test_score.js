
// Simulation of the score algorithm
function clamp(x, min, max) {
    return Math.max(min, Math.min(max, x));
}

function computeScore(stats) {
    // Volume
    // CHANGED: Use uniqueCorrect
    const uniqueCorrect = stats.uniqueCorrect || 0; // In simulation, we pass this strictly
    const safeBankSize = stats.bankSize || 1000;
    const vRef = 0.6 * safeBankSize;
    const volumeRaw = uniqueCorrect / vRef;
    const volumeScore = clamp(1 - Math.exp(-volumeRaw), 0, 1);

    // Accuracy 
    const accuracyScore = stats.total > 0 ? stats.correct / stats.total : 0;

    // Recency (Assume 0 days ago)
    const recencyScore = 1.0;

    // Coverage
    const coverageRaw = clamp(stats.unique / safeBankSize, 0, 1);
    const diversityRaw = clamp(stats.unique / stats.total, 0, 1);
    const coverageScore = 0.5 * coverageRaw + 0.5 * diversityRaw;

    // Reliability
    const MIN_UNIQUE = 50;
    const MAX_UNIQUE = 300;
    let reliability = 0;
    if (stats.unique > MIN_UNIQUE) {
        reliability = clamp((stats.unique - MIN_UNIQUE) / (MAX_UNIQUE - MIN_UNIQUE), 0, 1);
    }

    // Final
    // Weights: Volume 0.45, Accuracy 0.30, Recency 0.15, Coverage 0.10
    const baseScore =
        0.45 * volumeScore +
        0.30 * accuracyScore +
        0.15 * recencyScore +
        0.10 * coverageScore;

    const final = Math.round(100 * baseScore * reliability);

    console.log({
        inputs: stats,
        scores: {
            volume: volumeScore.toFixed(2),
            accuracy: accuracyScore.toFixed(2),
            recency: recencyScore.toFixed(2),
            coverage: coverageScore.toFixed(2),
            reliability: reliability.toFixed(2),
            base: baseScore.toFixed(2),
            final: final
        }
    });
}

// User Scenario
console.log("Scenario 1: 15k Wrong, 0 Correct (Pure Failure)");
computeScore({ total: 15000, correct: 0, unique: 15000, uniqueCorrect: 0, bankSize: 15000 });

console.log("Scenario 2: 15k Wrong, 1k Correct (6% Accuracy)");
computeScore({ total: 16000, correct: 1000, unique: 16000, uniqueCorrect: 1000, bankSize: 15000 });
