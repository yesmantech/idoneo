
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = "https://yansgitqqrcovwukvpfm.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbnNnaXRxcXJjb3Z3dWt2cGZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNzQ5NzcsImV4cCI6MjA3OTY1MDk3N30.TbLgWITo0hvw1Vl9OY-Y_hbrU-y6cfKEnkMZhvG9bcQ"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function cleanDuplicates() {
    console.log("Fetcher active...");

    let allBandi = [];
    let page = 0;
    let pageSize = 1000;

    // Fetch all
    while (true) {
        const { data, error } = await supabase
            .from('bandi')
            .select('id, source_id, created_at, updated_at')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error(error);
            break;
        }
        if (!data || data.length === 0) break;

        allBandi = [...allBandi, ...data];
        if (data.length < pageSize) break;
        page++;
    }

    console.log(`Total records: ${allBandi.length}`);

    const grouped = {};
    allBandi.forEach(b => {
        if (!b.source_id) return;
        if (!grouped[b.source_id]) grouped[b.source_id] = [];
        grouped[b.source_id].push(b);
    });

    let duplicatesFound = 0;
    let deletedCount = 0;

    for (const sourceId in grouped) {
        const group = grouped[sourceId];
        if (group.length > 1) {
            duplicatesFound++;
            // Sort by updated_at desc (keep newest)
            group.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

            const toKeep = group[0];
            const toDelete = group.slice(1);

            console.log(`Duplicate source_id: ${sourceId} (Count: ${group.length}) - Keeping ${toKeep.id}`);

            for (const item of toDelete) {
                const { error, data } = await supabase.from('bandi').delete().eq('id', item.id).select();
                if (error) {
                    console.error(`Failed to delete ${item.id}:`, error.message);
                } else if (!data || data.length === 0) {
                    console.error(`RLS BLOCKED deletion of ${item.id} (No data returned)`);
                } else {
                    console.log(`Deleted ${item.id}`);
                    deletedCount++;
                }
            }
        }
    }

    console.log(`Cleanup complete. Duplicates groups: ${duplicatesFound}. Deleted records: ${deletedCount}`);
}

cleanDuplicates();
