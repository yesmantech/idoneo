
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Fetch all bandi (only id, source_id, updated_at) to minimize data
        let allBandi: any[] = [];
        let page = 0;
        const pageSize = 1000;

        // Safety break
        let loopCount = 0;
        while (loopCount < 20) { // Max 20k records to be safe
            const { data, error } = await supabase
                .from('bandi')
                .select('id, source_id, updated_at')
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (error) throw error;
            if (!data || data.length === 0) break;

            allBandi = [...allBandi, ...data];
            if (data.length < pageSize) break;
            page++;
            loopCount++;
        }

        // 2. Group by source_id
        const grouped: Record<string, any[]> = {};
        allBandi.forEach(b => {
            if (!b.source_id) return;
            if (!grouped[b.source_id]) grouped[b.source_id] = [];
            grouped[b.source_id].push(b);
        });

        // 3. Identify IDs to delete
        let idsToDelete: string[] = [];
        let duplicatesGroups = 0;

        for (const sourceId in grouped) {
            const group = grouped[sourceId];
            if (group.length > 1) {
                duplicatesGroups++;
                // Sort by updated_at desc (keep newest)
                group.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

                // Keep index 0, delete others
                const toDelete = group.slice(1);
                idsToDelete.push(...toDelete.map(i => i.id));
            }
        }

        // 4. Batch delete
        let deletedCount = 0;
        if (idsToDelete.length > 0) {
            // Delete in chunks of 100 to be safe
            const chunkSize = 100;
            for (let i = 0; i < idsToDelete.length; i += chunkSize) {
                const chunk = idsToDelete.slice(i, i + chunkSize);
                const { error, count } = await supabase
                    .from('bandi')
                    .delete({ count: 'exact' })
                    .in('id', chunk);

                if (error) throw error;
                // count is unreliable with delete, but let's assume valid execution
                deletedCount += chunk.length;
            }
        }

        return new Response(
            JSON.stringify({
                message: 'Cleanup complete',
                total_scanned: allBandi.length,
                duplicates_groups: duplicatesGroups,
                deleted_count: deletedCount,
                ids_deleted: idsToDelete.length
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
