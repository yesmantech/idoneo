import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBando() {
    console.log('Searching for "Allievi Marescialli"...');

    const { data, error } = await supabase
        .from('bandi')
        .select('id, title, education_level, description')
        .ilike('title', '%Allievi Marescialli%')
        .limit(1);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (!data || data.length === 0) {
        console.log('No bando found.');
        return;
    }

    const bando = data[0];
    console.log('--- FOUND BANDO ---');
    console.log('ID:', bando.id);
    console.log('Title:', bando.title);
    console.log('Education Level:', bando.education_level);
    console.log('Description Start:', bando.description?.substring(0, 200));
}

checkBando();
