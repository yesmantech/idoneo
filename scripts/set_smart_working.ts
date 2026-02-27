
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

async function setSmartWorking() {
    console.log('Setting 3 random bandi to is_remote = true...');

    // 1. Get 3 IDs
    const { data, error } = await supabase
        .from('bandi')
        .select('id')
        .limit(3);

    if (error || !data || data.length === 0) {
        console.error('Error fetching bandi:', error);
        return;
    }

    const ids = data.map(b => b.id);
    console.log('Updating bandi IDs:', ids);

    // 2. Update them
    const { error: updateError } = await supabase
        .from('bandi')
        .update({ is_remote: true })
        .in('id', ids);

    if (updateError) {
        console.error('Error updating bandi:', updateError);
    } else {
        console.log('Successfully updated 3 bandi to remote!');
    }
}

setSmartWorking();
