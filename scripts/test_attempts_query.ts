
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
    console.log("--- Testing Role ID Fetch ---");
    const roleSlug = 'agente';

    // 1. Get Role
    const { data: role, error: roleError } = await supabase
        .from('roles')
        .select('*')
        .eq('slug', roleSlug)
        .single();

    if (roleError || !role) {
        console.error("Role Error:", roleError);
        return;
    }
    console.log("Role Found:", role.id, role.title);

    // 2. Debug Specific Quiz
    console.log("--- Debugging Specific Quiz 'Allievi Agente 2025' ---");
    const { data: specificQuiz } = await supabase
        .from('quizzes')
        .select('id, title, role_id, slug')
        .ilike('title', '%Allievi Agente%')
        .limit(1)
        .single();

    if (specificQuiz) {
        console.log("Found Quiz:", specificQuiz.title);
        console.log("Quiz ID:", specificQuiz.id);
        console.log("Quiz Role ID:", specificQuiz.role_id);
        console.log("Agente Role ID:", role.id);

        if (specificQuiz.role_id !== role.id) {
            console.error("MISMATCH! Quiz is linked to a different role.");
        } else {
            console.log("MATCH. Quiz is linked to Agente role.");

            // Check attempts for THIS exact quiz
            const { count } = await supabase
                .from('quiz_attempts')
                .select('*', { count: 'exact', head: true })
                .eq('quiz_id', specificQuiz.id);
            console.log(`Global Attempts for this quiz: ${count}`);
        }
    } else {
        console.error("Could not find 'Allievi Agente 2025' quiz.");
    }
}

testQuery();
