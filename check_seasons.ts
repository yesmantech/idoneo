
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yansgitqqrcovwukvpfm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbnNnaXRxcXJjb3Z3dWt2cGZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNzQ5NzcsImV4cCI6MjA3OTY1MDk3N30.TbLgWITo0hvw1Vl9OY-Y_hbrU-y6cfKEnkMZhvG9bcQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSeasons() {
    // Check columns
    const { data: columns } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'leaderboard_seasons')
        .eq('table_schema', 'public');

    if (columns) {
        console.log("Columns:", columns.map(c => c.column_name));
    }

    // Check for active season
    const now = new Date().toISOString();
    const { data: seasons, error } = await supabase
        .from('leaderboard_seasons')
        .select('*')
        .eq('is_active', true)
        .lte('start_at', now)
        .or(`end_at.is.null,end_at.gte.${now}`);

    if (error) {
        console.error("Error fetching seasons:", error);
        return;
    }

    if (seasons && seasons.length > 0) {
        console.log("Found Active Season:", seasons[0]);
    } else {
        console.log("No Active Season found. Creating one...");

        const { data: newSeason, error: createError } = await supabase
            .from('leaderboard_seasons')
            .insert({
                name: 'Season 1',
                start_at: new Date().toISOString(),
                is_active: true
            })
            .select()
            .single();

        if (createError) {
            console.error("Error creating season:", createError);
        } else {
            console.log("Created Season:", newSeason);
        }
    }
}

checkSeasons();
