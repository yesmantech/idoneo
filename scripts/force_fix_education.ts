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

async function forceFix() {
    console.log('Manually correcting education levels for military and police roles...');

    const keywords = [
        'MARESCIALLO', 'MARESCIALLI',
        'ISPETTORE', 'ISPETTORI',
        'CARABINIERI', 'POLIZIA',
        'GUARDIA DI FINANZA', 'FORZE ARMATE'
    ];

    let totalFixed = 0;

    for (const kw of keywords) {
        console.log(`Checking for "${kw}"...`);

        const { data: bandi, error } = await supabase
            .from('bandi')
            .select('id, title, education_level')
            .ilike('title', `%${kw}%`);

        if (error) {
            console.error(`Error fetching for ${kw}:`, error);
            continue;
        }

        if (!bandi || bandi.length === 0) continue;

        for (const bando of bandi) {
            const upperTitle = bando.title.toUpperCase();

            // Check if it matches ANY of the target roles
            const isTargetRole = upperTitle.includes('MARESCIALLO') ||
                upperTitle.includes('MARESCIALLI') ||
                upperTitle.includes('ISPETTORE') ||
                upperTitle.includes('ISPETTORI');

            // If it's a target role and has 'Nessuno' or empty education_level, fix it to ['Diploma']
            const needsFix = isTargetRole && (
                !bando.education_level ||
                bando.education_level.includes('Nessuno') ||
                bando.education_level.length === 0
            );

            if (needsFix) {
                console.log(`Fixing: ${bando.title} (ID: ${bando.id})`);
                const { error: updError } = await supabase
                    .from('bandi')
                    .update({ education_level: ['Diploma'] })
                    .eq('id', bando.id);

                if (updError) {
                    console.error(`Error updating ${bando.id}:`, updError);
                } else {
                    totalFixed++;
                }
            }
        }
    }

    console.log(`Manual correction complete. Updated ${totalFixed} records.`);
}

forceFix();
