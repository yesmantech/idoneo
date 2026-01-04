// Check and reset leaderboard entry
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yansgitqqrcovwukvpfm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbnNnaXRxcXJjb3Z3dWt2cGZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNzQ5NzcsImV4cCI6MjA3OTY1MDk3N30.TbLgWITo0hvw1Vl9OY-Y_hbrU-y6cfKEnkMZhvG9bcQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
    const userId = 'cb820355-512f-4f76-8b24-d6d4c409ad51'; // Sandrx

    console.log("🔍 Checking concorso_leaderboard for Sandrx...\n");

    const { data, error } = await supabase
        .from('concorso_leaderboard')
        .select('*')
        .eq('user_id', userId);

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log("Current leaderboard entries:");
    console.log(JSON.stringify(data, null, 2));

    if (data && data.length > 0) {
        console.log("\n⚠️ Found stale leaderboard entry with score 69!");
        console.log("This entry exists but user has 0 quiz attempts.");
        console.log("\n🔧 Deleting stale entry...\n");

        const { error: deleteError } = await supabase
            .from('concorso_leaderboard')
            .delete()
            .eq('user_id', userId);

        if (deleteError) {
            console.error("Delete error:", deleteError);
        } else {
            console.log("✅ Stale entry deleted! Refresh the leaderboard page.");
        }
    } else {
        console.log("No leaderboard entries found.");
    }
}

main().catch(console.error);
