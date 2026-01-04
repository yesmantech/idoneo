
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectAttempt() {
    const attemptId = '88cca64f-31c5-46c0-b12a-32d42a34ecc2';
    console.log(`Inspecting Attempt: ${attemptId}`);

    // 1. Get Attempt
    const { data: attempt, error: attemptError } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('id', attemptId)
        .single();

    if (attemptError) {
        console.error("Attempt Error:", attemptError);
        return;
    }
    console.log("Attempt Found:", {
        id: attempt.id,
        user_id: attempt.user_id,
        quiz_id: attempt.quiz_id,
        score: attempt.score
    });

    // 2. Get Quiz
    const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', attempt.quiz_id)
        .single();

    if (quizError) {
        console.error("Quiz Error:", quizError);
        return;
    }
    console.log("Quiz Found:", {
        id: quiz.id,
        title: quiz.title,
        role_id: quiz.role_id,
        contest_id: quiz.contest_id
    });

    // 3. Get Role (Agente)
    const roleSlug = 'agente';
    const { data: role } = await supabase
        .from('roles')
        .select('id, title')
        .eq('slug', roleSlug)
        .single();

    console.log("Role Agente:", role);

    // 4. Check Linkage
    if (quiz.role_id === role.id) {
        console.log("MATCH: Quiz.role_id === Role.id");
    } else {
        console.error(`MISMATCH: Quiz.role_id ${quiz.role_id} !== Role.id ${role.id}`);
    }

    // 5. Check Contests
    const { data: contests } = await supabase
        .from('contests')
        .select('id')
        .eq('role_id', role.id);

    const contestIds = contests?.map(c => c.id) || [];
    console.log("Role Contests:", contestIds);

    if (contestIds.includes(quiz.contest_id)) {
        console.log("MATCH: Quiz.contest_id is in Role's contests.");
    } else {
        console.error(`MISMATCH: Quiz.contest_id ${quiz.contest_id} NOT in Role contests.`);
    }
}

inspectAttempt();
