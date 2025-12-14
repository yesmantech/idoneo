
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Manually read .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
let supabaseUrl = '';
let supabaseAnonKey = '';

try {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    for (const line of envConfig.split('\n')) {
        const [key, value] = line.split('=');
        if (key === 'VITE_SUPABASE_URL') supabaseUrl = value?.trim() || '';
        if (key === 'VITE_SUPABASE_ANON_KEY') supabaseAnonKey = value?.trim() || '';
    }
} catch (e) {
    console.error("Could not read .env.local", e);
}

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing environment variables");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkQuizData() {
    console.log("Auditing first 100 quizzes...");

    // Fetch quizzes
    const { data: quizzes, error } = await supabase
        .from('quizzes')
        .select('id, title, total_questions, points_correct')
        .range(0, 50);

    if (error) { console.error(error); return; }

    if (quizzes) {
        for (const quiz of quizzes) {
            // Count actual questions
            const { count } = await supabase
                .from('quiz_questions')
                .select('*', { count: 'exact', head: true })
                .eq('quiz_id', quiz.id);

            const metaTotal = quiz.total_questions || 0;
            const actualTotal = count || 0;

            if (metaTotal !== actualTotal && actualTotal > 0) {
                console.log(`MISMATCH: ${quiz.title}`);
                console.log(`-- ID: ${quiz.id}`);
                console.log(`-- Metadata Total: ${metaTotal}`);
                console.log(`-- Actual Linked: ${actualTotal}`);
                console.log(`-- Diff: ${metaTotal - actualTotal}`);
            }
        }
    }
}

checkQuizData();
