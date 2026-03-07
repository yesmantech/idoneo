/**
 * Stress Test Script for the Readiness Algorithm
 * 
 * Inserts multiple quiz_attempts with varying accuracy levels
 * and verifies that leaderboard values update correctly.
 * 
 * Usage: node scripts/stress_test_algorithm.mjs
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yansgitqqrcovwukvpfm.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbnNnaXRxcXJjb3Z3dWt2cGZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA3NDk3NywiZXhwIjoyMDc5NjUwOTc3fQ.mO21DyDC66vPCHK_TIT_okhXbIfVhs--BxDyGA0TYt8';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Test parameters
const QUIZ_SLUG = 'allievi-agente-2025';
const NUM_ATTEMPTS = 5;
const QUESTIONS_PER_ATTEMPT = 20;

// Accuracy profiles for each attempt (simulate improving student)
const ACCURACY_PROFILES = [0.2, 0.4, 0.5, 0.7, 0.85]; // 20%, 40%, 50%, 70%, 85%

async function main() {
    console.log('\n🧪 STRESS TEST: Readiness Algorithm\n');
    console.log('='.repeat(60));

    // 1. Get quiz ID and user ID
    const { data: quiz } = await supabase
        .from('quizzes')
        .select('id, title')
        .eq('slug', QUIZ_SLUG)
        .single();

    if (!quiz) { console.error('❌ Quiz not found'); return; }
    console.log(`📝 Quiz: ${quiz.title} (${quiz.id})`);

    // Get first user from leaderboard or profiles
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nickname')
        .limit(1);

    if (!profiles?.length) { console.error('❌ No users found'); return; }
    const userId = profiles[0].id;
    console.log(`👤 User: ${profiles[0].nickname} (${userId})`);

    // 2. Get some real question IDs from this quiz
    const { data: questions } = await supabase
        .from('questions')
        .select('id')
        .eq('quiz_id', quiz.id)
        .limit(100);

    if (!questions?.length) { console.error('❌ No questions found'); return; }
    console.log(`📋 Available questions: ${questions.length}`);

    // 3. Reset leaderboard for clean test (DELETE the row, trigger will recreate via INSERT)
    console.log('\n🔄 Resetting leaderboard data...');
    await supabase
        .from('concorso_leaderboard')
        .delete()
        .eq('user_id', userId)
        .eq('quiz_id', quiz.id);

    console.log('\n' + '='.repeat(60));
    console.log('Starting stress test with', NUM_ATTEMPTS, 'attempts');
    console.log('Accuracy profiles:', ACCURACY_PROFILES.map(a => `${a * 100}%`).join(' → '));
    console.log('='.repeat(60));

    // 4. Run attempts
    for (let i = 0; i < NUM_ATTEMPTS; i++) {
        const accuracy = ACCURACY_PROFILES[i];
        const numCorrect = Math.round(QUESTIONS_PER_ATTEMPT * accuracy);

        // Pick random questions for this attempt
        const shuffled = [...questions].sort(() => Math.random() - 0.5);
        const selectedQuestions = shuffled.slice(0, QUESTIONS_PER_ATTEMPT);

        // Build answers array
        const answers = selectedQuestions.map((q, idx) => ({
            questionId: q.id,
            selectedOption: idx < numCorrect ? 'a' : 'b',
            isCorrect: idx < numCorrect,
            isSkipped: false
        }));

        console.log(`\n--- Attempt ${i + 1}/${NUM_ATTEMPTS} ---`);
        console.log(`Target accuracy: ${accuracy * 100}% (${numCorrect}/${QUESTIONS_PER_ATTEMPT} correct)`);

        // Insert attempt
        const { data: attempt, error } = await supabase
            .from('quiz_attempts')
            .insert({
                quiz_id: quiz.id,
                user_id: userId,
                score: numCorrect,
                answers: answers,
                total_questions: QUESTIONS_PER_ATTEMPT,
                correct: numCorrect,
                wrong: QUESTIONS_PER_ATTEMPT - numCorrect,
                blank: 0,
                started_at: new Date().toISOString(),
                mode: 'official'
            })
            .select('id')
            .single();

        if (error) {
            console.error(`❌ Insert error:`, error.message);
            continue;
        }
        console.log(`✅ Inserted attempt: ${attempt.id}`);

        // Wait a moment for the trigger to process
        await new Promise(r => setTimeout(r, 500));

        // 5. Read leaderboard values
        const { data: lb, error: lbError } = await supabase
            .from('concorso_leaderboard')
            .select('score, volume_factor, accuracy_weighted, coverage_score, reliability, total_correct_answers, total_questions_answered, recent_accuracies, last_calculated_at')
            .eq('user_id', userId)
            .eq('quiz_id', quiz.id)
            .single();

        if (lbError) {
            console.error(`❌ Leaderboard read error:`, lbError.message);
            continue;
        }

        // 6. Verify values
        const expectedTotalAnswered = QUESTIONS_PER_ATTEMPT * (i + 1);
        const totalBank = questions.length; // approximate

        console.log('\n📊 Leaderboard Values:');
        console.log(`   Accuracy (weighted):  ${lb.accuracy_weighted}%`);
        console.log(`   Volume:               ${(lb.volume_factor * 100).toFixed(1)}%`);
        console.log(`   Coverage:             ${(lb.coverage_score * 100).toFixed(1)}%`);
        console.log(`   Reliability:          ${(lb.reliability * 100).toFixed(1)}%`);
        console.log(`   Total Correct:        ${lb.total_correct_answers}`);
        console.log(`   Total Answered:       ${lb.total_questions_answered} (expected: ${expectedTotalAnswered})`);
        console.log(`   Recent Accuracies:    ${JSON.stringify(lb.recent_accuracies)}`);
        console.log(`   Last Calculated:      ${lb.last_calculated_at}`);

        // Validate
        const issues = [];
        if (lb.total_questions_answered !== expectedTotalAnswered) {
            issues.push(`total_questions_answered: got ${lb.total_questions_answered}, expected ${expectedTotalAnswered}`);
        }
        if (lb.accuracy_weighted === 0 && i > 0) {
            issues.push(`accuracy_weighted is 0 after ${i + 1} attempts`);
        }
        if (lb.volume_factor === 0 && i > 0) {
            issues.push(`volume_factor is 0 after ${i + 1} attempts`);
        }
        if (lb.coverage_score === 0 && i > 0) {
            issues.push(`coverage_score is 0 after ${i + 1} attempts`);
        }
        // Reliability needs >= 2 attempts
        if (i >= 1 && lb.reliability === 0) {
            issues.push(`reliability is 0 after ${i + 1} attempts (should have data)`);
        }

        const dateCheck = new Date(lb.last_calculated_at);
        const now = new Date();
        const minutesAgo = (now.getTime() - dateCheck.getTime()) / 60000;
        if (minutesAgo > 5) {
            issues.push(`last_calculated_at is ${minutesAgo.toFixed(0)} minutes ago (trigger didn't fire?)`);
        }

        if (issues.length === 0) {
            console.log('   ✅ All checks passed!');
        } else {
            console.log('   ⚠️ Issues found:');
            issues.forEach(issue => console.log(`      - ${issue}`));
        }
    }

    // 7. Final summary
    console.log('\n' + '='.repeat(60));
    console.log('FINAL RESULTS');
    console.log('='.repeat(60));

    const { data: finalLb } = await supabase
        .from('concorso_leaderboard')
        .select('*')
        .eq('user_id', userId)
        .eq('quiz_id', quiz.id)
        .single();

    if (finalLb) {
        const accuracy01 = (finalLb.accuracy_weighted || 0) / 100;
        const vol = (finalLb.volume_factor || 0) * 100;
        const cov = (finalLb.coverage_score || 0) * 100;
        const rel = (finalLb.reliability || 0) * 100;
        const effortScore = (vol * 0.3333) + (cov * 0.3333) + (rel * 0.3333);
        const finalScore = Math.min(effortScore * accuracy01, 100);

        console.log(`\n📈 Algorithm Output:`);
        console.log(`   Volume:      ${vol.toFixed(1)}%`);
        console.log(`   Coverage:    ${cov.toFixed(1)}%`);
        console.log(`   Reliability: ${rel.toFixed(1)}%`);
        console.log(`   Accuracy:    ${finalLb.accuracy_weighted}% (×${accuracy01.toFixed(2)})`);
        console.log(`   ─────────────────────`);
        console.log(`   Effort:      ${effortScore.toFixed(1)}`);
        console.log(`   Final Score: ${finalScore.toFixed(1)}`);
        console.log(`\n   Recent Accuracies: ${JSON.stringify(finalLb.recent_accuracies)}`);
    }

    console.log('\n🏁 Stress test complete!\n');
}

main().catch(console.error);
