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

async function fixBandi() {
    console.log('Starting data correction for existing bandi...');

    // We can target specific pages or keywords if needed, 
    // but for now let's just re-process the first few pages of active bandi with update_existing: true
    let page = 0;
    const totalPagesToFix = 15; // Sufficient to cover most recent active bandi

    for (page = 0; page < totalPagesToFix; page++) {
        console.log(`--- Updating Page ${page} ---`);

        // Use sub-batching 
        const pageSize = 50;
        const subBatchLimit = 5;

        for (let startIndex = 0; startIndex < pageSize; startIndex += subBatchLimit) {
            console.log(`  Fixing Batch ${startIndex}-${startIndex + subBatchLimit}...`);

            const { data, error } = await supabase.functions.invoke('import-bandi', {
                body: {
                    page: page,
                    start_index: startIndex,
                    limit: subBatchLimit,
                    update_existing: true // THIS IS THE KEY
                }
            });

            if (error) {
                console.error(`  Error:`, error);
                continue;
            }

            if (data) {
                console.log(`  Imported/Updated: ${data.imported}, Errors: ${data.errors}`);
                if (data.details && data.details.length > 0) {
                    data.details.forEach((d: any) => console.log(`    - ${d.title}: ${d.error || 'OK'}`));
                }
            }
        }

        await new Promise(r => setTimeout(r, 1000));
    }

    console.log('=== DATA CORRECTION COMPLETED ===');
}

fixBandi();
