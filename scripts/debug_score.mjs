// Debug script to check user score calculation
// Run with: node scripts/debug_score.mjs

import { createClient } from '@supabase/supabase-js';

// Supabase credentials
const SUPABASE_URL = 'https://yansgitqqrcovwukvpfm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbnNnaXRxcXJjb3Z3dWt2cGZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNzQ5NzcsImV4cCI6MjA3OTY1MDk3N30.TbLgWITo0hvw1Vl9OY-Y_hbrU-y6cfKEnkMZhvG9bcQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Algorithm (copied from leaderboardAlgorithm.ts)
function clamp(x, min, max) {
    return Math.max(min, Math.min(max, x));
}

function computePreparationScore(input) {
    const { answers, bankSize } = input;
    const now = Date.now();
    const totalAnswers = answers.length;

    if (totalAnswers === 0) {
        return { score: 0, uniqueCorrect: 0, totalAnswers: 0 };
    }

    const uniqueIds = new Set(answers.map(a => a.questionId));
    const uniqueCorrectIds = new Set(answers.filter(a => a.isCorrect).map(a => a.questionId));

    const uniqueQuestions = uniqueIds.size;
    const uniqueCorrect = uniqueCorrectIds.size;

    let lastAttemptAt = 0;
    answers.forEach(a => {
        if (a.timestamp > lastAttemptAt) lastAttemptAt = a.timestamp;
    });

    const safeBankSize = bankSize > 0 ? bankSize : 1000;
    const vRef = 0.6 * safeBankSize;
    const volumeRaw = uniqueCorrect / vRef;  // CHANGED: Using uniqueCorrect
    const volumeScore = clamp(1 - Math.exp(-volumeRaw), 0, 1);

    const TAU_DAYS = 30;
    const MS_PER_DAY = 1000 * 60 * 60 * 24;

    let weightedCorrect = 0;
    let weightedTotal = 0;

    answers.forEach(a => {
        const ageMs = now - a.timestamp;
        const ageDays = ageMs / MS_PER_DAY;
        const w = Math.exp(-Math.max(0, ageDays) / TAU_DAYS);
        weightedTotal += w;
        if (a.isCorrect) weightedCorrect += w;
    });

    const accuracyScore = weightedTotal > 0.0001 ? clamp(weightedCorrect / weightedTotal, 0, 1) : 0;

    const R_MAX = 30;
    const daysSinceLast = (now - lastAttemptAt) / MS_PER_DAY;
    const recencyScore = 1 - clamp(Math.max(0, daysSinceLast) / R_MAX, 0, 1);

    const coverageRaw = clamp(uniqueQuestions / safeBankSize, 0, 1);
    const diversityRaw = clamp(uniqueQuestions / totalAnswers, 0, 1);
    const coverageScore = 0.5 * coverageRaw + 0.5 * diversityRaw;

    const MIN_UNIQUE = 50;
    const MAX_UNIQUE = 300;
    let reliability = uniqueQuestions <= MIN_UNIQUE ? 0 : clamp((uniqueQuestions - MIN_UNIQUE) / (MAX_UNIQUE - MIN_UNIQUE), 0, 1);

    const baseScore01 = 0.45 * volumeScore + 0.30 * accuracyScore + 0.15 * recencyScore + 0.10 * coverageScore;
    const finalScore01 = baseScore01 * reliability;
    const score = Math.round(100 * clamp(finalScore01, 0, 1));

    return {
        score,
        volumeScore,
        accuracyScore,
        recencyScore,
        coverageScore,
        reliability,
        uniqueQuestions,
        uniqueCorrect,
        totalAnswers,
        correctCount: answers.filter(a => a.isCorrect).length
    };
}

async function main() {
    console.log("🔍 Fetching user 'Sandrx'...\n");

    // 1. Find user by nickname
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, nickname')
        .ilike('nickname', '%sandrx%')
        .single();

    if (profileError || !profile) {
        console.error("User not found:", profileError);
        return;
    }

    console.log(`Found user: ${profile.nickname} (${profile.id})\n`);

    // 2. Get their quiz attempts
    const { data: attempts, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select('id, quiz_id, answers, created_at, quiz:quizzes(title, total_questions)')
        .eq('user_id', profile.id);

    if (attemptsError) {
        console.error("Error fetching attempts:", attemptsError);
        return;
    }

    console.log(`📊 Found ${attempts.length} quiz attempts\n`);

    // 3. Aggregate all answers
    let allAnswers = [];
    let correctCount = 0;
    let wrongCount = 0;

    attempts.forEach(att => {
        if (Array.isArray(att.answers)) {
            att.answers.forEach(ans => {
                const qId = ans.questionId || ans.question_id || ans.id;
                const ts = new Date(att.created_at).getTime();
                if (qId) {
                    allAnswers.push({
                        isCorrect: !!ans.isCorrect,
                        questionId: String(qId),
                        timestamp: ts
                    });
                    if (ans.isCorrect) correctCount++;
                    else wrongCount++;
                }
            });
        }
    });

    console.log("======= RAW DATA =======");
    console.log(`Total Answers: ${allAnswers.length}`);
    console.log(`Correct: ${correctCount}`);
    console.log(`Wrong: ${wrongCount}`);
    console.log(`Accuracy: ${(correctCount / allAnswers.length * 100).toFixed(1)}%`);
    console.log("========================\n");

    // 4. Run algorithm
    const bankSize = attempts[0]?.quiz?.total_questions || 1000;
    const result = computePreparationScore({ answers: allAnswers, bankSize });

    console.log("======= ALGORITHM RESULT =======");
    console.log(`Bank Size: ${bankSize}`);
    console.log(`Unique Questions: ${result.uniqueQuestions}`);
    console.log(`Unique CORRECT: ${result.uniqueCorrect}`);
    console.log(`Volume Score: ${result.volumeScore.toFixed(3)}`);
    console.log(`Accuracy Score: ${result.accuracyScore.toFixed(3)}`);
    console.log(`Recency Score: ${result.recencyScore.toFixed(3)}`);
    console.log(`Coverage Score: ${result.coverageScore.toFixed(3)}`);
    console.log(`Reliability: ${result.reliability.toFixed(3)}`);
    console.log(`---------------------------------`);
    console.log(`🎯 FINAL SCORE: ${result.score}`);
    console.log("================================\n");

    // 5. Check what's in the leaderboard table
    const { data: leaderboard, error: lbError } = await supabase
        .from('concorso_leaderboard')
        .select('*')
        .eq('user_id', profile.id);

    if (leaderboard && leaderboard.length > 0) {
        console.log("======= CURRENT DB VALUES =======");
        leaderboard.forEach(lb => {
            console.log(`Quiz ID: ${lb.quiz_id}`);
            console.log(`DB Score: ${lb.score}`);
            console.log(`Last Calculated: ${lb.last_calculated_at}`);
        });
        console.log("=================================\n");
    }
}

main().catch(console.error);
