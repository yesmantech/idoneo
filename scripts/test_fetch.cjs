const { createClient } = require('@supabase/supabase-js');
const supabase = createClient("https://yansgitqqrcovwukvpfm.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbnNnaXRxcXJjb3Z3dWt2cGZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNzQ5NzcsImV4cCI6MjA3OTY1MDk3N30.TbLgWITo0hvw1Vl9OY-Y_hbrU-y6cfKEnkMZhvG9bcQ");
(async () => {
    try {
        const query = supabase.from('questions').select('id');
        console.log(typeof query.setHeader === 'function' ? 'SUPPORTED' : 'UNSUPPORTED');
    } catch (e) {
        console.error(e);
    }
})();
