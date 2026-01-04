
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xjpjsqygwdtwzfsfurep.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''; // We need a real key, but for script I might output instructions to run with env vars.
// Actually, I can use the service role key if I have it, but I don't.
// I will assume the environment variables are set when running the script or I'll try to use the ones from the project if available?
// The user provided environment is likely not available to me directly in the shell unless I source .env.local.
// I'll try to read .env.local if it exists.

async function main() {
    if (!supabaseKey) {
        console.error("No Supabase key found. Please set VITE_SUPABASE_ANON_KEY.");
        return;
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Find Role starting with 504c
    const { data: roles, error: roleError } = await supabase
        .from('roles')
        .select('id, title');

    if (roleError || !roles) {
        console.error("Role fetch error:", roleError);
        return;
    }

    const role = roles.find(r => r.id.startsWith('504c'));

    if (!role) {
        console.error("Role starting with 504c not found.");
        return;
    }
    console.log(`FOUND ROLE: ${role.title} (${role.id})`);

    // 2. Find Quizzes for this Role
    const { data: quizzes, error: quizError } = await supabase
        .from('quizzes')
        .select('id, title, role_id')
        .eq('role_id', role.id);

    console.log(`FOUND ${quizzes?.length} QUIZZES linked directly to this role.`);
    quizzes?.forEach(q => console.log(` - [${q.id}] ${q.title}`));

    // 3. Find Contests for this Role
    const { data: contests } = await supabase
        .from('contests')
        .select('id, title')
        .eq('role_id', role.id);

    console.log(`FOUND ${contests?.length} CONTESTS linked to this role.`);

    // 4. Find Attempts for User cb82... if we can (RLS might block if using ANON key, so this step might fail)
    // But we can check if the quiz ID the user mentioned (e25dace3...) is in the list above.

    const targetQuizId = 'e25dace3-dd35-4cf5-a942-98c57a7f2d98';
    const isDirectlyLinked = quizzes?.some(q => q.id === targetQuizId);
    console.log(`Target Quiz (${targetQuizId}) directly linked? ${isDirectlyLinked}`);

}

main();
