import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkXP() {
    console.log("Checking user_xp table...");
    const { data, error } = await supabase.from('user_xp').select('*').limit(5);
    if (error) {
        console.error("Error fetching user_xp:", error);
    } else {
        console.log("user_xp data:", data);
    }

    console.log("Checking profiles table...");
    const { data: profiles, error: pError } = await supabase.from('profiles').select('*').limit(5);
    if (pError) {
        console.error("Error fetching profiles:", pError);
    } else {
        console.log("profiles data:", profiles);
    }
}

checkXP();
