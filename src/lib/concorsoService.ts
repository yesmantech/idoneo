import { supabase } from "./supabaseClient";

export interface ConcorsoQuiz {
    id: string;
    slug: string;
    title: string;
    description: string;
    year: number;
    is_official: boolean;
    available_seats?: string;
    role: {
        id: string;
        slug: string;
        title: string;
        category: {
            id: string;
            slug: string;
            title: string;
        };
    };
}

export interface ConcorsoFilters {
    search?: string;
    categorySlug?: string;
    year?: number;
    isOfficial?: boolean;
    limit?: number;
    offset?: number;
}

export const searchQuizzes = async (filters: ConcorsoFilters = {}) => {
    try {
        let query = supabase
            .from('quizzes')
            .select(`
                id, slug, title, description, year, is_official,
                role:roles!inner (
                    id, slug, title, available_positions,
                    category:categories!inner (
                        id, slug, title
                    )
                )
            `, { count: 'exact' })
            .eq('is_archived', false);

        if (filters.search) {
            query = query.ilike('title', `%${filters.search}%`);
        }

        if (filters.categorySlug) {
            // Use the aliased path for filtering
            query = query.eq('role.category.slug', filters.categorySlug);
        }

        if (filters.year) {
            query = query.eq('year', filters.year);
        }

        if (filters.isOfficial !== undefined) {
            query = query.eq('is_official', filters.isOfficial);
        }

        const limit = filters.limit || 20;
        const offset = filters.offset || 0;

        query = query.range(offset, offset + limit - 1)
            .order('year', { ascending: false })
            .order('title');

        const { data, error, count } = await query;

        if (error) {
            console.error('Supabase searchQuizzes error:', error);
            throw error;
        }

        return {
            data: (data || []).map((q: any) => ({
                id: q.id,
                slug: q.slug,
                title: q.title,
                description: q.description,
                year: q.year,
                is_official: !!q.is_official,
                available_seats: q.role?.available_positions,
                role: {
                    id: q.role?.id || '',
                    slug: q.role?.slug || '',
                    title: q.role?.title || '',
                    category: {
                        id: q.role?.category?.id || '',
                        slug: q.role?.category?.slug || '',
                        title: q.role?.category?.title || ''
                    }
                }
            })) as ConcorsoQuiz[],
            count: count || 0
        };
    } catch (err) {
        console.error('searchQuizzes implementation error:', err);
        throw err;
    }
};

export const fetchAllCategories = async () => {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('id, title, slug')
            .eq('is_archived', false)
            .order('title');

        if (error) {
            console.error('Error fetching categories:', error);
            return [];
        }
        return data || [];
    } catch (err) {
        console.error('fetchAllCategories implementation error:', err);
        return [];
    }
};
