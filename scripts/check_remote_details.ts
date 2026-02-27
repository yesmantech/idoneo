
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRemoteBandiDetails() {
    console.log('Fetching details of bandi with is_remote = true...');

    const { data, error } = await supabase
        .from('bandi')
        .select('id, title, status, deadline, is_remote')
        .eq('is_remote', true);

    if (error) {
        console.error('Error fetching bandi:', error);
        return;
    }

    console.log(`Found ${data.length} bandi.`);
    const now = new Date().toISOString();
    console.log('Current ISO Time:', now);

    data.forEach(bando => {
        console.log(`Bando: ${bando.title.substring(0, 30)}...`);
        console.log(`  Status:`, bando.status);
        console.log(`  Deadline:`, bando.deadline);
        console.log(`  Is Open?`, bando.deadline > now);
        console.log('---');
    });
}

checkRemoteBandiDetails();
