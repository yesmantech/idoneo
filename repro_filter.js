
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://yansgitqqrcovwukvpfm.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbnNnaXRxcXJjb3Z3dWt2cGZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNzQ5NzcsImV4cCI6MjA3OTY1MDk3N30.TbLgWITo0hvw1Vl9OY-Y_hbrU-y6cfKEnkMZhvG9bcQ"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test() {
    console.log("Checking counts per category (status: open)...");

    // 1. Get categories
    const { data: categories, error } = await supabase
        .from('bandi_categories')
        .select('id, name')
        .eq('is_active', true);

    if (error) {
        console.error("Error fetching categories:", error);
        return;
    }

    if (!categories) {
        console.log("No categories found");
        return;
    }

    for (const cat of categories) {
        const { count } = await supabase
            .from('bandi')
            .select('*', { count: 'exact', head: true })
            .in('category_id', [cat.id])
            .gte('deadline', new Date().toISOString());

        console.log(`[${cat.name}]: ${count} active bandi`);
    }
}

test();
