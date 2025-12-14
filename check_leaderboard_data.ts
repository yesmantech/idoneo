import { createClient } from '@supabase/supabase-js';
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

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log("--- 1. Checking Roles Table directly ---");
    const { data: roles, error: roleError } = await supabase
        .from('roles')
        .select('id, title, slug')
        .limit(3);

    if (roleError) console.error("Error fetching roles:", roleError);
    else console.log("Roles found:", roles?.length, roles);

    console.log("\n--- 2. Checking Quizzes with Role Relation ---");
    const { data: quizzes, error: quizError } = await supabase
        .from('quizzes')
        .select('id, title, is_archived, role_id, role:roles(title)')
        //.eq('is_official', true) 
        .not('role_id', 'is', null) // Only check ones that SHOULD have a role
        .limit(3);

    if (quizError) console.error("Error fetching quizzes:", quizError);
    else {
        console.log("Quizzes found:", quizzes?.length);
        quizzes?.forEach(q => {
            console.log(`Quiz: ${q.title} (RoleID: ${q.role_id}) -> Role Linked:`, q.role);
        });
    }
}

checkData();
