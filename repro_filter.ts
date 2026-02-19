
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = "https://yansgitqqrcovwukvpfm.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbnNnaXRxcXJjb3Z3dWt2cGZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNzQ5NzcsImV4cCI6MjA3OTY1MDk3N30.TbLgWITo0hvw1Vl9OY-Y_hbrU-y6cfKEnkMZhvG9bcQ"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function test() {
    console.log("Testing filter...")
    const categoryId = "2ce8c724-3792-4fa6-9f46-1a97278e10ca" // Enti Locali

    const { data, error, count } = await supabase
        .from('bandi')
        .select('*', { count: 'exact' })
        .in('category_id', [categoryId])
        .limit(5)

    if (error) {
        console.error("Error:", error)
    } else {
        console.log(`Found ${count} records.`)
        console.log("Data:", data?.map(b => ({ id: b.id, title: b.title, cat: b.category_id })))
    }
}

test()
