import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function targetFix() {
    const sourceId = '2e2ca936-6ffd-4b99-aa7f-bf1662236d76';
    console.log(`Targeting update for bando: ${sourceId}...`);

    // InPA Page check: we need to find which page this bando is on, 
    // or just call import-bandi with a specific page if we know it. 
    // Since we don't know the exact page easily without a search, 
    // let's assume it's on page 0 or 1 given how recent it is (Feb 17).

    const { data, error } = await supabase.functions.invoke('import-bandi', {
        body: {
            page: 0,
            update_existing: true
        }
    });

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Update result for Page 0:', data.imported, 'updates');
    }

    // Check if fixed
    const { data: bando } = await supabase
        .from('bandi')
        .select('education_level')
        .eq('source_id', sourceId)
        .single();

    console.log('Resulting Education Level:', bando?.education_level);
}

targetFix();
