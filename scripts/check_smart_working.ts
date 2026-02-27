
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

async function checkSmartWorking() {
    console.log('Checking for bandi with is_remote = true...');

    const { count, error } = await supabase
        .from('bandi')
        .select('*', { count: 'exact', head: true })
        .eq('is_remote', true);

    if (error) {
        console.error('Error fetching bandi:', error);
        return;
    }

    console.log(`Found ${count} bandi with is_remote = true.`);

    // Also check if the column exists and what values it has
    const { data: sampleData, error: sampleError } = await supabase
        .from('bandi')
        .select('id, title, is_remote')
        .limit(10);

    if (sampleError) {
        console.error('Error fetching sample:', sampleError);
    } else {
        console.log('Sample data (first 10):');
        sampleData.forEach(b => console.log(`- ${b.title.substring(0, 20)}... | is_remote: ${b.is_remote}`));
    }
}

checkSmartWorking();
