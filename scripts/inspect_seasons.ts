
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectLeaderboard() {
    console.log('--- Inspecting Leaderboard Seasons ---');

    // 1. Check Active Season
    const { data: activeSeason, error: seasonError } = await supabase
        .from('leaderboard_seasons')
        .select('*')
        .eq('is_active', true)
        .lte('start_at', new Date().toISOString())
        .or(`end_at.is.null,end_at.gte.${new Date().toISOString()}`)
        .order('start_at', { ascending: false })
        .limit(1)
        .single();

    if (seasonError) {
        console.error('Error fetching active season:', seasonError.message);
    } else if (!activeSeason) {
        console.warn('⚠️ NO ACTIVE SEASON FOUND. The leaderboard will default to All-Time XP.');
    } else {
        console.log('✅ Active Season Found:', activeSeason);
    }

    // 2. Check User XP for this season (if exists)
    if (activeSeason) {
        console.log('\n--- Inspecting User XP for Season ---');
        const { data: xpRows, error: xpError } = await supabase
            .from('user_xp')
            .select('user_id, xp')
            .eq('season_id', activeSeason.id)
            .limit(5);

        if (xpError) {
            console.error('Error fetching user_xp:', xpError.message);
        } else {
            console.log(`Found ${xpRows.length} entries in user_xp for season ${activeSeason.id}`);
            console.table(xpRows);
        }
    }

    // 3. List all seasons to see if there are future/past ones
    console.log('\n--- All Seasons ---');
    const { data: allSeasons } = await supabase.from('leaderboard_seasons').select('*').order('start_at', { ascending: false }).limit(5);
    console.table(allSeasons);
}

inspectLeaderboard();
