const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function run() {
    const envStr = fs.readFileSync('.env.local', 'utf-8');
    const getEnv = (key) => {
        const match = envStr.match(new RegExp(`${key}=(.*)`));
        return match ? match[1].trim() : null;
    };

    const supabaseUrl = getEnv('VITE_SUPABASE_URL');
    // Using service role key for direct DB patching to be fast
    const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
        console.error("Missing Supabase credentials (SUPABASE_SERVICE_ROLE_KEY required)");
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Patching existing bandi with NULL region to 'nazionale'...");

    // We update all bandi where region is null
    const { data: updated, error } = await supabase
        .from('bandi')
        .update({ region: 'nazionale' })
        .is('region', null)
        .select('id');

    if (error) {
        console.error("Error updating region:", error);
    } else {
        console.log(`Successfully patched ${updated?.length || 0} bandi.`);
    }
}

run();
