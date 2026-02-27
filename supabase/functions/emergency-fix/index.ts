import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data, error } = await supabase.rpc('force_fix_military_bandi');

    // If RPC doesn't exist, try manual update via service role
    let result = "RPC failed or missing";
    if (error) {
        const { data: upd, error: updErr } = await supabase
            .from('bandi')
            .update({ education_level: ['Diploma'] })
            .or('title.ilike.%MARESCIALLI%,title.ilike.%ISPETTORI%,title.ilike.%MARESCIALLO%,title.ilike.%ISPETTORE%');

        if (updErr) result = "Update Error: " + JSON.stringify(updErr);
        else result = "Manual Update Success";
    } else {
        result = "RPC Success: " + JSON.stringify(data);
    }

    return new Response(JSON.stringify({ result }), {
        headers: { 'Content-Type': 'application/json' },
    })
})
