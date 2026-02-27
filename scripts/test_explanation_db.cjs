const { createClient } = require('@supabase/supabase-js');
const url = "https://yansgitqqrcovwukvpfm.supabase.co";
// we use the anon key here just like the frontend client does, to ensure RLS isn't blocking the read
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbnNnaXRxcXJjb3Z3dWt2cGZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNzQ5NzcsImV4cCI6MjA3OTY1MDk3N30.TbLgWITo0hvw1Vl9OY-Y_hbrU-y6cfKEnkMZhvG9bcQ";
const supabase = createClient(url, key);

(async () => {
    try {
        // 1. Pick a random question that DOES NOT have an explanation yet
        const { data: q, error: qErr } = await supabase.from('questions').select('id, text, options, correct_option').is('explanation', null).limit(1).single();
        if (!q) { console.log('No questions found without explanations', qErr); return; }

        console.log("1. Selected Question ID:", q.id);

        // 2. Call the Edge Function to generate the explanation (simulating the UI click)
        console.log("2. Invoking Edge Function...");
        const correctOptionText = q.options ? q.options[q.correct_option] : q.correct_option;
        const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('generate-explanation', {
            body: { questionId: q.id, questionText: q.text, correctAnswer: correctOptionText }
        });
        console.log("   Edge Function Response:", edgeErr ? 'ERROR: ' + edgeErr.message : 'SUCCESS');

        // 3. Wait a moment to ensure DB triggers/writes are finalized
        console.log("   Waiting 2 seconds...");
        await new Promise(r => setTimeout(r, 2000));

        // 4. Fetch the question exactly as the frontend does when returning to the page
        console.log("3. Fetching question from DB as frontend...");
        const { data: fetchQ, error: fetchErr } = await supabase.from('questions').select('id, explanation, image_url').eq('id', q.id).single();
        console.log("   DB Fetch Error:", fetchErr ? fetchErr.message : 'None');
        console.log("   Explanation stored in DB:", fetchQ?.explanation ? "YES (" + fetchQ.explanation.substring(0, 30) + "...)" : ">>> STILL NULL <<<");
    } catch (e) {
        console.error("Test Error:", e);
    }
})();
