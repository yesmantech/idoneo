import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual env parsing
const envPath = path.resolve(process.cwd(), '.env.local');
let env: Record<string, string> = {};
if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    lines.forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) env[key.trim()] = value.trim();
    });
}

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;
// Using service role key if available would be better for schema inspection, but let's try Anon first or assume we might fail on permission if RLS is strict.
// Actually, I can't easily inspect schema tables with Anon key usually. 
// But I can try to select * from concorso_leaderboard limit 1 and see the returned keys.

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log("Checking concorso_leaderboard columns...");

    // Attempt to insert a dummy record with new columns to see if it errors
    // Or just fetch one and see properties (if any exist)

    const { data, error } = await supabase
        .from('concorso_leaderboard')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error fetching:", error);
    } else {
        console.log("Data returned:", data);
        if (data && data.length > 0) {
            console.log("Columns found:", Object.keys(data[0]));
        } else {
            console.log("No data found. Cannot verify columns via Select.");
            // Try to upsert a dummy with new columns. If it fails, we know they are missing.
            const { error: upsertError } = await supabase
                .from('concorso_leaderboard')
                .upsert({
                    user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
                    quiz_id: '00000000-0000-0000-0000-000000000000',
                    score: 0,
                    recency_score: 0, // NEW COLUMN
                    coverage_score: 0 // NEW COLUMN
                });

            if (upsertError) {
                console.error("Upsert Test Failed:", upsertError.message);
                if (upsertError.message.includes("column") && upsertError.message.includes("does not exist")) {
                    console.log("VERDICT: Columns are MISSING.");
                }
            } else {
                console.log("Upsert Test Success! Columns EXIST.");
            }
        }
    }
}

checkSchema();
