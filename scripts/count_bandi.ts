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

async function countBandi() {
    const { count, error } = await supabase
        .from('bandi')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Error counting bandi:', error);
    } else {
        console.log(`Total Bandi in DB: ${count}`);
    }
}

countBandi();
