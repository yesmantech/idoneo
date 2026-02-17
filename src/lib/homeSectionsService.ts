import { supabase } from './supabaseClient';

// ============================================
// HOME SECTIONS SERVICE
// Data fetchers for Tier S homepage sections
// ============================================

export interface RecentlyUsedItem {
    roleId: string;
    roleSlug: string;
    roleTitle: string;
    categorySlug: string;
    categoryTitle: string;
    lastAttemptAt: string;
    attemptCount: number;
}

export interface NewArrivalQuiz {
    id: string;
    slug: string;
    title: string;
    year: number;
    createdAt: string;
    roleSlug: string;
    roleTitle: string;
    categorySlug: string;
    categoryTitle: string;
}

export interface PopularRole {
    roleId: string;
    roleSlug: string;
    roleTitle: string;
    categorySlug: string;
    categoryTitle: string;
    totalAttempts: number;
    uniqueUsers: number;
}

// ============================================
// RECENTLY USED
// ============================================

export async function fetchRecentlyUsed(userId: string, limit = 5): Promise<RecentlyUsedItem[]> {
    if (!userId) return [];

    try {
        // Get recent quiz attempts grouped by role
        const { data, error } = await supabase
            .from('quiz_attempts')
            .select(`
                quiz:quizzes (
                    role:roles (
                        id, slug, title, is_archived,
                        category:categories (slug, title, is_archived)
                    )
                ),
                created_at
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50); // Fetch more to dedupe

        if (error) {
            console.error('Error fetching recently used:', error);
            return [];
        }

        // Deduplicate by role and keep most recent
        const roleMap = new Map<string, RecentlyUsedItem>();

        (data || []).forEach((attempt: any) => {
            const role = attempt.quiz?.role;
            const category = role?.category;
            // Skip archived roles or categories
            if (!role?.id || role.is_archived || category?.is_archived) return;

            if (!roleMap.has(role.id)) {
                roleMap.set(role.id, {
                    roleId: role.id,
                    roleSlug: role.slug,
                    roleTitle: role.title,
                    categorySlug: role.category?.slug || '',
                    categoryTitle: role.category?.title || '',
                    lastAttemptAt: attempt.created_at,
                    attemptCount: 1
                });
            } else {
                roleMap.get(role.id)!.attemptCount++;
            }
        });

        return Array.from(roleMap.values()).slice(0, limit);
    } catch (err) {
        console.error('fetchRecentlyUsed error:', err);
        return [];
    }
}

// ============================================
// NEW ARRIVALS
// ============================================

export async function fetchNewArrivals(days = 30, limit = 10): Promise<NewArrivalQuiz[]> {
    try {
        const since = new Date();
        since.setDate(since.getDate() - days);

        const { data, error } = await supabase
            .from('quizzes')
            .select(`
                id, slug, title, year, created_at,
                role:roles (
                    slug, title,
                    category:categories (slug, title)
                )
            `)
            .eq('is_archived', false)
            .gte('created_at', since.toISOString())
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching new arrivals:', error);
            return [];
        }

        return (data || []).map((q: any) => ({
            id: q.id,
            slug: q.slug,
            title: q.title,
            year: q.year,
            createdAt: q.created_at,
            roleSlug: q.role?.slug || '',
            roleTitle: q.role?.title || '',
            categorySlug: q.role?.category?.slug || '',
            categoryTitle: q.role?.category?.title || ''
        }));
    } catch (err) {
        console.error('fetchNewArrivals error:', err);
        return [];
    }
}

// ============================================
// MOST POPULAR (by leaderboard entries)
// ============================================

export async function fetchMostPopular(limit = 5): Promise<PopularRole[]> {
    try {
        // Get roles with most leaderboard entries (indicates popularity)
        // concorso_leaderboard has quiz_id, so we need to go through quizzes -> roles
        const { data, error } = await supabase
            .from('concorso_leaderboard')
            .select(`
                quiz:quizzes (
                    role:roles (
                        id, slug, title, is_archived,
                        category:categories (slug, title, is_archived)
                    )
                )
            `)
            .limit(500);

        if (error) {
            console.error('Error fetching popular roles:', error);
            return [];
        }

        // Count by role
        const roleCount = new Map<string, { role: any; count: number; users: Set<string> }>();

        (data || []).forEach((entry: any) => {
            const role = entry.quiz?.role;
            const category = role?.category;
            // Skip archived roles or categories
            if (!role?.id || role.is_archived || category?.is_archived) return;

            if (!roleCount.has(role.id)) {
                roleCount.set(role.id, { role, count: 0, users: new Set() });
            }
            roleCount.get(role.id)!.count++;
        });

        // Sort by count and return top N
        return Array.from(roleCount.entries())
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, limit)
            .map(([_, { role, count, users }]) => ({
                roleId: role.id,
                roleSlug: role.slug,
                roleTitle: role.title,
                categorySlug: role.category?.slug || '',
                categoryTitle: role.category?.title || '',
                totalAttempts: count,
                uniqueUsers: users.size
            }));
    } catch (err) {
        console.error('fetchMostPopular error:', err);
        return [];
    }
}
// ============================================
// RECENT CATEGORIES (Recently Added)
// ============================================

export async function fetchRecentCategories(limit = 8): Promise<any[]> {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('is_archived', false)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching recent categories:', error);
            return [];
        }

        return (data || []).map((c: any) => ({
            id: c.id,
            slug: c.slug,
            title: c.title,
            subtitle: c.subtitle || undefined,
            description: c.description || "",
            home_banner_url: c.home_banner_url || undefined,
            inner_banner_url: c.inner_banner_url || undefined,
            is_new: c.is_new || false,
            year: c.year || undefined,
            available_seats: c.available_seats || undefined,
        }));
    } catch (err) {
        console.error('fetchRecentCategories error:', err);
        return [];
    }
}
