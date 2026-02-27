import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugFix() {
    const id = '2e2ca936-6ffd-4b99-aa7f-bf1662236d76';

    console.log('--- BEFORE UPDATE ---');
    const { data: b1 } = await supabase.from('bandi').select('education_level').eq('id', id).single();
    console.log('Level:', b1?.education_level);

    console.log('Updating to [ "Diploma" ]...');
    const { data: upd, error } = await supabase
        .from('bandi')
        .update({ education_level: ['Diploma'] })
        .eq('id', id)
        .select();

    if (error) {
        console.error('Update Error:', error);
    } else {
        console.log('Update Success. Returned Data:', JSON.stringify(upd));
    }

    console.log('--- AFTER UPDATE ---');
    const { data: b2 } = await supabase.from('bandi').select('education_level').eq('id', id).single();
    console.log('Level:', b2?.education_level);
}

debugFix();
