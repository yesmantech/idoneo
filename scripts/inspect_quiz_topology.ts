
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTopology() {
    const roleSlug = 'agente';
    const targetQuizId = 'e25dace3-dd35-4cf5-a942-98c57a7f2d98';

    console.log(`--- Inspecting Topology for Role: ${roleSlug} vs Quiz: ${targetQuizId} ---`);

    // 1. Get Role
    const { data: role } = await supabase.from('roles').select('*').eq('slug', roleSlug).single();
    if (!role) { console.error("Role not found"); return; }
    console.log(`Role: ${role.title} (${role.id})`);

    // 2. Get Quiz
    const { data: quiz } = await supabase.from('quizzes').select('*').eq('id', targetQuizId).single();
    if (!quiz) { console.error("Quiz not found"); return; }
    console.log(`Quiz: ${quiz.title}`);
    console.log(`  - Role ID: ${quiz.role_id}`);
    console.log(`  - Contest ID: ${quiz.contest_id}`);

    // 3. Run Logic from useRoleHubData
    console.log("\n--- Simulating useRoleHubData Logic ---");

    // 3a. Get Contests
    const { data: roleContests } = await supabase
        .from('contests')
        .select('id')
        .eq('role_id', role.id);
    const contestIds = roleContests?.map(c => c.id) || [];
    console.log(`Role Contests: [${contestIds.join(', ')}]`);

    // 3b. Build Query
    let query = supabase
        .from('quizzes')
        .select('id');

    if (contestIds.length > 0) {
        console.log("Querying by OR(role_id, contest_ids)...");
        query = query.or(`role_id.eq.${role.id},contest_id.in.(${contestIds.join(',')})`);
    } else {
        console.log("Querying by role_id only...");
        query = query.eq('role_id', role.id);
    }

    const { data: allQuizzes, error } = await query;
    if (error) console.error("Query Error:", error);

    const roleQuizIds = allQuizzes?.map(q => q.id) || [];
    console.log(`Found ${roleQuizIds.length} candidate quizzes.`);

    // 4. Verify Inclusion
    if (roleQuizIds.includes(targetQuizId)) {
        console.log("SUCCESS: Target Quiz IS in the list.");
    } else {
        console.error("FAILURE: Target Quiz is NOT in the list.");

        // Explain why
        const roleMatch = quiz.role_id === role.id;
        const contestMatch = contestIds.includes(quiz.contest_id);
        console.log(`  - Direct Role Match: ${roleMatch}`);
        console.log(`  - Contest Match: ${contestMatch}`);
    }
}

inspectTopology();
