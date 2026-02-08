// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            // Supabase API URL - env var exported by default.
            Deno.env.get('SUPABASE_URL') ?? '',
            // Supabase API ANON KEY - env var exported by default.
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        )

        // 1. Fetch data from source (Mock for now, will replace with InPA scraper)
        // In a real scenario, we would fetch RSS feed or scrape InPA page
        const mockBandi = [
            {
                title: "Concorso Mock AI Generated",
                url: "https://example.com/bando-mock",
                description: "Questo è un bando generato automaticamente per testare l'importazione."
            }
        ]

        const results = {
            imported: 0,
            errors: 0,
            details: [] as any[]
        }

        // 2. Process items
        for (const item of mockBandi) {
            // Here we would call OpenAI to parse the description
            // const structuredData = await parseWithAI(item.description)

            // For MVP, we insert a dummy record
            const { error } = await supabaseClient
                .from('bandi')
                .upsert({
                    title: item.title,
                    slug: item.title.toLowerCase().replace(/ /g, '-'),
                    status: 'draft', // Safety first
                    short_description: item.description,
                    seats_total: 1,
                    deadline: new Date(Date.now() + 86400000 * 30).toISOString(), // +30 days
                    created_by: null // System
                }, { onConflict: 'slug' })

            if (error) {
                results.errors++
                results.details.push({ title: item.title, error: error.message })
            } else {
                results.imported++
                results.details.push({ title: item.title, status: 'imported' })
            }
        }

        return new Response(
            JSON.stringify(results),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        )
    }
})
