const { createClient } = require('@supabase/supabase-js');
const url = "https://yansgitqqrcovwukvpfm.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbnNnaXRxcXJjb3Z3dWt2cGZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNzQ5NzcsImV4cCI6MjA3OTY1MDk3N30.TbLgWITo0hvw1Vl9OY-Y_hbrU-y6cfKEnkMZhvG9bcQ";

// Test 1: With query param t
const s1 = createClient(url, key, {
    global: { fetch: (url, options) => {
        const d = new URL(url); d.searchParams.set('t', '123'); return fetch(d.toString(), options);
    }}
});

// Test 2: With setHeader
const s2 = createClient(url, key);

(async () => {
    console.log("Test 1 (Param):");
    const { error: e1 } = await s1.from('questions').select('id').limit(1);
    console.log(e1 ? e1.message : "Success");
    
    console.log("Test 2 (Header):");
    const { error: e2 } = await s2.from('questions').select('id').setHeader('Cache-Control', 'no-store').limit(1);
    console.log(e2 ? e2.message : "Success");
})();
