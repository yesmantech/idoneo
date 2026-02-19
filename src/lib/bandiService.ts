import { supabase } from './supabaseClient';

// ============================================
// BANDI SERVICE
// ============================================

export interface Ente {
    id: string;
    name: string;
    slug: string;
    type: string;
    region?: string;
    province?: string;
    city?: string;
    website?: string;
    logo_url?: string;
}

export interface BandiCategory {
    id: string;
    name: string;
    slug: string;
    icon?: string;
    color?: string;
}

export interface BandoUpdate {
    id: string;
    bando_id: string;
    type: 'rettifica' | 'proroga' | 'calendario' | 'risultati' | 'diario' | 'altro';
    title: string;
    description?: string;
    publication_date?: string;
    is_important: boolean;
    created_at: string;
}

export interface BandoDocument {
    id: string;
    bando_id: string;
    type: 'bando' | 'allegato' | 'rettifica' | 'calendario' | 'graduatoria' | 'altro';
    title: string;
    file_url: string;
    file_size?: number;
    mime_type?: string;
    publication_date?: string;
}

export interface Bando {
    id: string;
    title: string;
    slug: string;
    ente_id?: string;
    category_id?: string;
    seats_total?: number;
    seats_reserved?: number;
    contract_type?: string;
    salary_range?: string;
    education_level?: string[];
    age_min?: number;
    age_max?: number;
    other_requirements?: Record<string, any>;
    region?: string;
    province?: string;
    city?: string;
    is_remote?: boolean;
    publication_date?: string;
    deadline: string;
    exam_date?: string;
    application_url?: string;
    application_method?: string;
    description?: string;
    short_description?: string;
    exam_stages?: Array<{
        type: string;
        date?: string;
        topics?: string[];
    }>;
    status: 'draft' | 'review' | 'published' | 'closed' | 'suspended';
    is_featured: boolean;
    views_count: number;
    saves_count: number;
    source_urls?: string[];
    tags?: string[];
    created_at: string;
    updated_at: string;
    published_at?: string;
    // Joined data
    ente?: Ente;
    category?: BandiCategory;
    // Computed
    days_remaining?: number;
    is_saved?: boolean;
    updates?: BandoUpdate[];
    documents?: BandoDocument[];
}

export interface BandiFilters {
    search?: string;
    categories?: string[];
    regions?: string[];
    province?: string;
    status?: 'all' | 'open' | 'closed';
    educationLevel?: string[];
    minSeats?: number;
    maxSeats?: number;
    deadline_within_days?: number;
    is_featured?: boolean;
    // New Advanced Filters
    contractType?: string[];
    salaryMin?: number;
    isRemote?: boolean;

    sortBy?: 'deadline' | 'newest' | 'seats' | 'relevance';
    offset?: number;
    limit?: number;
}

// ============================================
// QUERY FUNCTIONS
// ============================================

export async function fetchBandi(filters: BandiFilters = {}): Promise<{ data: Bando[]; count: number }> {
    const {
        search, categories, regions, province, status,
        educationLevel, minSeats, maxSeats, deadline_within_days,
        contractType, salaryMin, isRemote,
        sortBy = 'deadline', offset = 0, limit = 20
    } = filters;

    let query = supabase
        .from('bandi')
        .select(`
            *,
            ente:enti(*),
            category:bandi_categories(*)
        `, { count: 'exact' })
        .eq('status', 'published');

    // Search (Robust ILIKE Fallback)
    if (search) {
        // We use ilike for immediate robustness as FTS config can be tricky with simple terms/stopwords
        const term = `%${search}%`;
        query = query.or(`title.ilike.${term},short_description.ilike.${term},description.ilike.${term},city.ilike.${term},province.ilike.${term}`);
    }

    // Categories
    if (categories?.length) {
        query = query.in('category_id', categories);
    }

    // Location
    if (regions?.length) {
        query = query.in('region', regions);
    }
    if (province) {
        // Search in both city and province matches
        query = query.or(`province.ilike.%${province}%,city.ilike.%${province}%`);
    }

    // Status / Dates
    if (status === 'open') {
        query = query.gte('deadline', new Date().toISOString());
    } else if (status === 'closed') {
        query = query.lt('deadline', new Date().toISOString());
    }

    // Deadline within X days
    if (deadline_within_days) {
        const date = new Date();
        date.setDate(date.getDate() + deadline_within_days);
        query = query.lte('deadline', date.toISOString())
            .gte('deadline', new Date().toISOString());
    }

    // Education
    if (educationLevel?.length) {
        query = query.overlaps('education_level', educationLevel);
    }

    // Seats
    if (minSeats) {
        query = query.gte('seats_total', minSeats);
    }
    if (maxSeats) {
        query = query.lte('seats_total', maxSeats);
    }

    // --- New Advanced Filters ---

    // Contract Type
    if (contractType?.length) {
        query = query.in('contract_type', contractType);
    }

    // Salary (check if bando.salary_max >= user.salaryMin)
    if (salaryMin) {
        query = query.gte('salary_max', salaryMin);
    }

    // Remote
    if (isRemote) {
        query = query.eq('is_remote', true);
    }

    // Sorting
    switch (sortBy) {
        case 'deadline':
            query = query.order('deadline', { ascending: true });
            break;
        case 'newest':
            query = query.order('published_at', { ascending: false });
            break;
        case 'seats':
            query = query.order('seats_total', { ascending: false });
            break;
        default:
            query = query.order('deadline', { ascending: true });
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
        console.error('Error fetching bandi:', error);
        return { data: [], count: 0 };
    }

    // Add computed fields
    const now = new Date();
    const bandiWithComputed = (data || []).map(bando => ({
        ...bando,
        days_remaining: Math.max(0, Math.ceil((new Date(bando.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    }));

    return { data: bandiWithComputed, count: count || 0 };
}

export async function fetchBandoBySlug(slug: string): Promise<Bando | null> {
    const { data, error } = await supabase
        .from('bandi')
        .select(`
            *,
            ente:enti(*),
            category:bandi_categories(*),
            updates:bandi_updates(*),
            documents:bandi_documents(*)
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

    if (error || !data) {
        console.error('Error fetching bando:', error);
        return null;
    }

    // Increment views (commented out for debugging)
    // await supabase.rpc('increment_bando_views', { bando_id: data.id }).catch(() => { });

    const now = new Date();
    return {
        ...data,
        days_remaining: Math.max(0, Math.ceil((new Date(data.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    };
}

export async function fetchFeaturedBandi(limit = 5): Promise<Bando[]> {
    const { data } = await fetchBandi({
        is_featured: true,
        status: 'open',
        sortBy: 'deadline',
        limit
    });
    return data;
}

export async function fetchClosingSoonBandi(days = 7, limit = 10): Promise<Bando[]> {
    const now = new Date();
    const deadline = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
        .from('bandi')
        .select(`
            *,
            ente:enti(*),
            category:bandi_categories(*)
        `)
        .eq('status', 'published')
        .gte('deadline', now.toISOString())
        .lte('deadline', deadline.toISOString())
        .order('deadline', { ascending: true })
        .limit(limit);

    if (error) {
        console.error('Error fetching closing soon:', error);
        return [];
    }

    return (data || []).map(bando => ({
        ...bando,
        days_remaining: Math.max(0, Math.ceil((new Date(bando.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    }));
}

// ============================================
// USER SAVES (WATCHLIST)
// ============================================

export async function fetchUserSavedBandi(): Promise<Bando[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('user_bandi_saves')
        .select(`
            bando:bandi(
                *,
                ente:enti(*),
                category:bandi_categories(*)
            )
        `)
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false });

    if (error) {
        console.error('Error fetching saved bandi:', error);
        return [];
    }

    const now = new Date();
    return (data || [])
        .map((item: any) => item.bando as Bando)
        .filter((b): b is Bando => !!b)
        .map(bando => ({
            ...bando,
            is_saved: true,
            days_remaining: Math.max(0, Math.ceil((new Date(bando.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        }));
}

export async function saveBando(bandoId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
        .from('user_bandi_saves')
        .insert({ user_id: user.id, bando_id: bandoId });

    if (error) {
        console.error('Error saving bando:', error);
        return false;
    }
    return true;
}

export async function unsaveBando(bandoId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
        .from('user_bandi_saves')
        .delete()
        .eq('user_id', user.id)
        .eq('bando_id', bandoId);

    if (error) {
        console.error('Error unsaving bando:', error);
        return false;
    }
    return true;
}

export async function isUserSaved(bandoId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
        .from('user_bandi_saves')
        .select('bando_id')
        .eq('user_id', user.id)
        .eq('bando_id', bandoId)
        .maybeSingle();

    return !error && data !== null;
}

// ============================================
// CATEGORIES & FILTERS
// ============================================

export async function fetchBandiCategories(): Promise<BandiCategory[]> {
    const { data, error } = await supabase
        .from('bandi_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

    if (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
    return data || [];
}

export const ITALIAN_REGIONS = [
    'Abruzzo', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna',
    'Friuli-Venezia Giulia', 'Lazio', 'Liguria', 'Lombardia', 'Marche',
    'Molise', 'Piemonte', 'Puglia', 'Sardegna', 'Sicilia',
    'Toscana', 'Trentino-Alto Adige', 'Umbria', "Valle d'Aosta", 'Veneto'
];

export const EDUCATION_LEVELS = [
    { value: 'diploma', label: 'Diploma' },
    { value: 'laurea_triennale', label: 'Laurea Triennale' },
    { value: 'laurea_magistrale', label: 'Laurea Magistrale' },
    { value: 'dottorato', label: 'Dottorato' }
];

export const CONTRACT_TYPES = [
    { value: 'tempo_indeterminato', label: 'Tempo Indeterminato' },
    { value: 'tempo_determinato', label: 'Tempo Determinato' },
    { value: 'formazione_lavoro', label: 'Formazione e Lavoro' }
];
