import { supabase } from './supabaseClient';
import { Bando, Ente, BandiCategory } from './bandiService';

// ============================================
// ADMIN BANDI SERVICE
// ============================================

export interface BandoFormData {
    title: string;
    slug?: string;
    ente_id?: string | null;
    category_id?: string | null;
    seats_total?: number | null;
    seats_reserved?: number | null;
    contract_type?: string | null;
    salary_range?: string | null;
    education_level?: string[];
    age_min?: number | null;
    age_max?: number | null;
    region?: string | null;
    province?: string | null;
    city?: string | null;
    is_remote?: boolean;
    publication_date?: string | null;
    deadline: string;
    exam_date?: string | null;
    application_url?: string | null;
    application_method?: string | null;
    description?: string | null;
    short_description?: string | null;
    exam_stages?: Array<{
        type: string;
        date?: string;
        topics?: string[];
    }>;
    status?: 'draft' | 'review' | 'published' | 'closed' | 'suspended';
    is_featured?: boolean;
    source_urls?: string[];
    tags?: string[];
}

// ============================================
// BANDI CRUD
// ============================================

export async function fetchAdminBandi(params: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
}): Promise<{ data: Bando[]; count: number }> {
    const { status, search, limit = 50, offset = 0 } = params;

    let query = supabase
        .from('bandi')
        .select(`
            *,
            ente:enti(id, name, slug),
            category:bandi_categories(id, name, slug)
        `, { count: 'exact' });

    if (status && status !== 'all') {
        query = query.eq('status', status);
    }

    if (search) {
        query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
        console.error('Error fetching admin bandi:', error);
        throw error;
    }

    return { data: data || [], count: count || 0 };
}

export async function fetchBandoById(id: string): Promise<Bando | null> {
    const { data, error } = await supabase
        .from('bandi')
        .select(`
            *,
            ente:enti(*),
            category:bandi_categories(*),
            updates:bandi_updates(*),
            documents:bandi_documents(*)
        `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching bando:', error);
        return null;
    }

    return data;
}

export async function createBando(formData: BandoFormData): Promise<Bando> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
        .from('bandi')
        .insert({
            ...formData,
            status: formData.status || 'draft',
            created_by: user?.id
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating bando:', error);
        throw error;
    }

    return data;
}

export async function updateBando(id: string, formData: Partial<BandoFormData>): Promise<Bando> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
        .from('bandi')
        .update({
            ...formData,
            updated_at: new Date().toISOString(),
            updated_by: user?.id
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating bando:', error);
        throw error;
    }

    return data;
}

export async function deleteBando(id: string): Promise<boolean> {
    const { error } = await supabase
        .from('bandi')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting bando:', error);
        throw error;
    }

    return true;
}

export async function publishBando(id: string): Promise<Bando> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
        .from('bandi')
        .update({
            status: 'published',
            published_at: new Date().toISOString(),
            published_by: user?.id
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error publishing bando:', error);
        throw error;
    }

    return data;
}

export async function closeBando(id: string): Promise<Bando> {
    const { data, error } = await supabase
        .from('bandi')
        .update({
            status: 'closed',
            closed_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error closing bando:', error);
        throw error;
    }

    return data;
}

// ============================================
// ENTI CRUD
// ============================================

export async function fetchEnti(): Promise<Ente[]> {
    const { data, error } = await supabase
        .from('enti')
        .select('*')
        .order('name');

    if (error) {
        console.error('Error fetching enti:', error);
        return [];
    }

    return data || [];
}

export async function createEnte(ente: Partial<Ente>): Promise<Ente> {
    const { data, error } = await supabase
        .from('enti')
        .insert(ente)
        .select()
        .single();

    if (error) {
        console.error('Error creating ente:', error);
        throw error;
    }

    return data;
}

export async function updateEnte(id: string, ente: Partial<Ente>): Promise<Ente> {
    const { data, error } = await supabase
        .from('enti')
        .update(ente)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating ente:', error);
        throw error;
    }

    return data;
}

export async function deleteEnte(id: string): Promise<boolean> {
    const { error } = await supabase
        .from('enti')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting ente:', error);
        throw error;
    }

    return true;
}

// ============================================
// CATEGORIES CRUD
// ============================================

export async function fetchAdminCategories(): Promise<BandiCategory[]> {
    const { data, error } = await supabase
        .from('bandi_categories')
        .select('*')
        .order('sort_order');

    if (error) {
        console.error('Error fetching categories:', error);
        return [];
    }

    return data || [];
}

export async function createCategory(category: Partial<BandiCategory>): Promise<BandiCategory> {
    const { data, error } = await supabase
        .from('bandi_categories')
        .insert(category)
        .select()
        .single();

    if (error) {
        console.error('Error creating category:', error);
        throw error;
    }

    return data;
}

export async function updateCategory(id: string, category: Partial<BandiCategory>): Promise<BandiCategory> {
    const { data, error } = await supabase
        .from('bandi_categories')
        .update(category)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating category:', error);
        throw error;
    }

    return data;
}

// ============================================
// BULK OPERATIONS
// ============================================

export async function bulkUpdateStatus(ids: string[], status: Bando['status']): Promise<void> {
    const { error } = await supabase
        .from('bandi')
        .update({
            status,
            updated_at: new Date().toISOString(),
            ...(status === 'published' ? { published_at: new Date().toISOString() } : {}),
            ...(status === 'closed' ? { closed_at: new Date().toISOString() } : {})
        })
        .in('id', ids);

    if (error) {
        console.error('Error bulk updating status:', error);
        throw error;
    }
}

export async function bulkDelete(ids: string[]): Promise<void> {
    const { error } = await supabase
        .from('bandi')
        .delete()
        .in('id', ids);

    if (error) {
        console.error('Error bulk deleting:', error);
        throw error;
    }
}

// ============================================
// AGENT OPERATIONS
// ============================================

export async function runImportAgent(): Promise<{ imported: number; errors: number; details: any[] }> {
    const { data, error } = await supabase.functions.invoke('import-bandi');

    if (error) {
        console.error('Error running import agent:', error);
        throw error;
    }

    return data;
}
