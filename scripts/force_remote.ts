
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing Supabase environment variables (URL or SERVICE_ROLE_KEY)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function forceRemote() {
    console.log('Forcing specific bandi to be remote...');

    // Target a few titles we know exist from previous output
    const titles = [
        'ARPA Lazio - Avviso pubblico',
        'AVVISO DI INTERPELLO...',
        'COMUNE DI COMO - AVVISO DI MOBILITA'
    ];

    // Logic: fetch ANY 3 published bandi and force update
    const { data, error } = await supabase
        .from('bandi')
        .select('id, title')
        .eq('status', 'published')
        .limit(3);

    if (error || !data || data.length === 0) {
        console.error('Error fetching published bandi:', error);
        return;
    }

    const ids = data.map(b => b.id);
    console.log('Forcing update on IDs:', ids);

    const { error: updateError } = await supabase
        .from('bandi')
        .update({ is_remote: true })
        .in('id', ids);

    if (updateError) {
        console.error('Error UPDATING:', updateError);
    } else {
        console.log('Update SUCCESS. Verifying...');

        const { count } = await supabase
            .from('bandi')
            .select('*', { count: 'exact', head: true })
            .eq('is_remote', true);

        console.log(`VERIFICATION: Found ${count} remote bandi.`);
    }
}

forceRemote();
