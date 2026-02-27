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

async function deduplicate() {
    console.log('Fetching all bandi to identify duplicates...');
    const { data: bandi, error } = await supabase
        .from('bandi')
        .select('id, source_id, title');

    if (error) {
        console.error('Error:', error);
        return;
    }

    const seen = new Map();
    const duplicates = [];

    for (const bando of bandi) {
        if (seen.has(bando.source_id)) {
            duplicates.push(bando);
        } else {
            seen.set(bando.source_id, bando.id);
        }
    }

    console.log(`Found ${duplicates.length} duplicates.`);

    if (duplicates.length > 0) {
        for (const dup of duplicates) {
            console.log(`Removing duplicate: ${dup.title} (ID: ${dup.id}, Source: ${dup.source_id})`);
            const { error: delError } = await supabase
                .from('bandi')
                .delete()
                .eq('id', dup.id);
            if (delError) console.error(`Failed to delete ${dup.id}:`, delError);
        }
        console.log('Deduplication complete.');
    }
}

deduplicate();
