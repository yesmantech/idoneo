import { supabase } from './supabaseClient';

// ============================================
// HOME SECTIONS SERVICE
// Data fetchers for Tier S homepage sections
// ============================================

export interface RecentlyUsedItem {
    quizId: string;
    quizSlug: string;
    quizTitle: string;
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
    categorySlug: string;
    categoryTitle: string;
}

export interface PopularQuiz {
    quizId: string;
    quizSlug: string;
    quizTitle: string;
    categorySlug: string;
    categoryTitle: string;
    totalAttempts: number;
}

// ============================================
// RECENTLY USED
// ============================================

export async function fetchRecentlyUsed(userId: string, limit = 5): Promise<RecentlyUsedItem[]> {
    if (!userId) return [];

    try {
        // Get recent quiz attempts grouped by quiz
        const { data, error } = await supabase
            .from('quiz_attempts')
            .select(`
                quiz:quizzes (
                    id, slug, title, is_archived,
                    category:categories (slug, title, is_archived)
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

        // Deduplicate by quiz and keep most recent
        const quizMap = new Map<string, RecentlyUsedItem>();

        (data || []).forEach((attempt: any) => {
            const quiz = attempt.quiz;
            const category = quiz?.category;
            // Skip archived quizzes or categories
            if (!quiz?.id || quiz.is_archived || category?.is_archived) return;

            if (!quizMap.has(quiz.id)) {
                quizMap.set(quiz.id, {
                    quizId: quiz.id,
                    quizSlug: quiz.slug,
                    quizTitle: quiz.title,
                    categorySlug: quiz.category?.slug || '',
                    categoryTitle: quiz.category?.title || '',
                    lastAttemptAt: attempt.created_at,
                    attemptCount: 1
                });
            } else {
                quizMap.get(quiz.id)!.attemptCount++;
            }
        });

        return Array.from(quizMap.values()).slice(0, limit);
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
                category:categories (slug, title)
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
            categorySlug: q.category?.slug || '',
            categoryTitle: q.category?.title || ''
        }));
    } catch (err) {
        console.error('fetchNewArrivals error:', err);
        return [];
    }
}

// ============================================
// MOST POPULAR (by leaderboard entries)
// ============================================

export async function fetchMostPopular(limit = 5): Promise<PopularQuiz[]> {
    try {
        // Get quizzes with most leaderboard entries
        const { data, error } = await supabase
            .from('concorso_leaderboard')
            .select(`
                quiz:quizzes (
                    id, slug, title, is_archived,
                    category:categories (slug, title, is_archived)
                )
            `)
            .limit(500);

        if (error) {
            console.error('Error fetching popular quizzes:', error);
            return [];
        }

        // Count by quiz
        const quizCount = new Map<string, { quiz: any; count: number }>();

        (data || []).forEach((entry: any) => {
            const quiz = entry.quiz;
            const category = quiz?.category;
            // Skip archived
            if (!quiz?.id || quiz.is_archived || category?.is_archived) return;

            if (!quizCount.has(quiz.id)) {
                quizCount.set(quiz.id, { quiz, count: 0 });
            }
            quizCount.get(quiz.id)!.count++;
        });

        // Sort by count and return top N
        return Array.from(quizCount.entries())
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, limit)
            .map(([_, { quiz, count }]) => ({
                quizId: quiz.id,
                quizSlug: quiz.slug,
                quizTitle: quiz.title,
                categorySlug: quiz.category?.slug || '',
                categoryTitle: quiz.category?.title || '',
                totalAttempts: count
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
