
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


async function checkDistinctEducationLevels() {
    console.log('Fetching all bandi to find distinct education_level values...');

    const { data, error } = await supabase
        .from('bandi')
        .select('education_level');

    if (error) {
        console.error('Error fetching bandi:', error);
        return;
    }

    const distinctValues = new Set<string>();
    data.forEach(bando => {
        if (Array.isArray(bando.education_level)) {
            bando.education_level.forEach((level: string) => distinctValues.add(level));
        }
    });

    console.log('Distinct Education Levels:', Array.from(distinctValues));
}

checkDistinctEducationLevels();

