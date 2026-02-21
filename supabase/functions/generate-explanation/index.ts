import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { questionId, questionText, correctAnswer } = await req.json();

        // 1. Validate input
        if (!questionId || !questionText || !correctAnswer) {
            return new Response(
                JSON.stringify({ error: 'Missing required parameters: questionId, questionText, or correctAnswer' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 2. Fetch OpenAI Key
        const openAiKey = Deno.env.get('OPENAI_API_KEY');
        if (!openAiKey) {
            console.error('OPENAI_API_KEY environment variable is not set');
            return new Response(
                JSON.stringify({ error: 'OpenAI integration not configured' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 3. Call OpenAI
        const systemPrompt = "Sei un esperto creatore didattico di quiz. Scrivi una spiegazione concisa e chiara per giustificare perché una determinata risposta è corretta per una data domanda.";
        const userPrompt = `
Domanda: "${questionText}"
Risposta Corretta: "${correctAnswer}"

Scrivi una spiegazione sintetica in italiano (massimo 3-4 frasi) che spieghi perché questa risposta è quella giusta. Sii incoraggiante e didattico. NON usare la formattazione markdown (nessun asterisco per il grassetto o corsivo), usa solo testo semplice e pulito. Non includere saluti o testo extra come "Certo, ecco la spiegazione:". Rispondi solo con la spiegazione stessa.
    `.trim();

        console.log(`Calling OpenAI for question [${questionId}]...`);
        const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openAiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini', // Fast, cheap, and very capable for this task
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 300,
            }),
        });

        if (!openAiResponse.ok) {
            const errData = await openAiResponse.text();
            console.error('OpenAI Error:', errData);
            throw new Error(`OpenAI API responded with ${openAiResponse.status}`);
        }

        const aiData = await openAiResponse.json();
        const generatedExplanation = aiData.choices?.[0]?.message?.content?.trim();

        if (!generatedExplanation) {
            throw new Error('No content returned from OpenAI');
        }

        console.log(`Successfully generated explanation for [${questionId}]. Length: ${generatedExplanation.length} chars`);

        // 4. Update the DB via Supabase Admin Client
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (supabaseUrl && supabaseServiceKey) {
            const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

            const { error: dbError } = await supabaseAdmin
                .from('questions')
                .update({ explanation: generatedExplanation })
                .eq('id', questionId);

            if (dbError) {
                console.error('Failed to save explanation to database:', dbError);
                // We still return the explanation to the user even if DB save fails
            } else {
                console.log(`Successfully saved explanation to DB for [${questionId}]`);
            }
        } else {
            console.warn('Supabase URL or Service Key not configured. Skipping DB update.');
        }

        // 5. Return the generated explanation
        return new Response(
            JSON.stringify({ explanation: generatedExplanation }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        );

    } catch (error) {
        console.error('Edge Function Error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        );
    }
});
