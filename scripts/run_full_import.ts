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

async function runFullImport() {
    console.log('Starting FULL import of active bandi (IN_APERTURA)...');

    let page = 0;
    let totalPages = 1; // Will be updated after first request
    let totalImported = 0;
    let totalSkipped = 0;

    while (page < totalPages) {
        console.log(`--- Processing Page ${page} / ${totalPages > 1 ? totalPages - 1 : '?'} ---`);

        const { data, error } = await supabase.functions.invoke('import-bandi', {
            body: { page: page }
        });

        if (error) {
            console.error(`Error invoking function on page ${page}:`, error);
            // Retry once? Or skip? Let's stop to be safe.
            break;
        }

        if (data) {
            console.log(`Result: Imported ${data.imported}, Skipped ${data.skipped}, Errors ${data.errors}`);
            console.log(`Enriched Enti: ${data.enriched_enti}`);

            totalImported += data.imported || 0;
            totalSkipped += data.skipped || 0;
            totalPages = data.total_pages || totalPages;

            // Log details of specific errors if any
            if (data.details && data.details.length > 0) {
                // console.log('Details:', data.details);
            }
        } else {
            console.warn('No data returned from function');
        }

        page++;

        // Small delay to prevent rate limiting (OpenAI or InPA)
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('=== FULL IMPORT COMPLETED ===');
    console.log(`Total Pages Processed: ${page}`);
    console.log(`Total New Imported: ${totalImported}`);
    console.log(`Total Skipped (Already Existed): ${totalSkipped}`);
}

runFullImport();
