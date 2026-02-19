
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function deleteRecent() {
    console.log('Fetching recent bandi IDs...')

    // 1. Get IDs of recent bandi
    const { data: bandi, error: fetchError } = await supabase
        .from('bandi')
        .select('id')
        .eq('source_type', 'inpa')
        .order('created_at', { ascending: false })
        .limit(50)

    if (fetchError) {
        console.error('Error fetching:', fetchError)
        return
    }

    if (!bandi || bandi.length === 0) {
        console.log('No bandi found to delete.')
        return
    }

    const ids = bandi.map(b => b.id)
    console.log(`Found ${ids.length} bandi. Deleting...`)

    // 2. Delete them
    const { error: deleteError } = await supabase
        .from('bandi')
        .delete()
        .in('id', ids)

    if (deleteError) {
        console.error('Error deleting:', deleteError)
    } else {
        console.log('Successfully deleted recent bandi.')
    }
}

deleteRecent()
