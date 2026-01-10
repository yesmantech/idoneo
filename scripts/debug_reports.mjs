import { createClient } from '@supabase/supabase-js';

// Use the local Supabase instance with service role key (bypasses RLS)
const supabase = createClient(
    'http://localhost:54321',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function debugReports() {
    console.log('Checking question_reports table...');

    const { data, error, count } = await supabase
        .from('question_reports')
        .select('*', { count: 'exact' });

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Total reports:', count);
        console.log('Data:', JSON.stringify(data, null, 2));
    }
}

debugReports();
