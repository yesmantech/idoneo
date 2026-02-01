/**
 * @file useConcorsoData.ts
 * @description Data fetching hook for category (concorso) pages.
 *
 * This hook fetches the full hierarchy for a category page:
 * Category → Roles → Quizzes (Contests) → Active Users
 *
 * ## Data Structure
 *
 * ```
 * Category (e.g., "Polizia di Stato")
 * ├── Role (e.g., "Allievo Agente")
 * │   ├── Contest/Quiz (2024 Official)
 * │   └── Contest/Quiz (2023 Official)
 * └── Role (e.g., "Vice Ispettore")
 *     └── Contest/Quiz (...)
 * ```
 *
 * ## Active Users Calculation
 *
 * For each role, counts unique users in `concorso_leaderboard` across all
 * quizzes for that role. This shows how many people are preparing.
 *
 * ## Query Flow
 *
 * 1. Fetch category by slug
 * 2. Fetch all roles for category
 * 3. Fetch all quizzes for roles
 * 4. Fetch leaderboard entries for active user counts
 * 5. Group and assemble response
 *
 * @example
 * ```tsx
 * import { useConcorsoData } from '@/hooks/useConcorsoData';
 *
 * function CategoryPage({ categorySlug }) {
 *   const { category, roles, loading } = useConcorsoData(categorySlug);
 *
 *   if (loading) return <Skeleton />;
 *
 *   return (
 *     <div>
 *       <h1>{category?.title}</h1>
 *       {roles.map(role => <RoleCard key={role.id} role={role} />)}
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Category, Role, Contest } from '@/lib/data';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ContestWithSeats extends Contest {
    available_seats?: string | null;
}

export interface RoleWithContests extends Role {
    contests: ContestWithSeats[];
    activeUsers: number;
}

export interface ConcorsoData {
    category: Category | null;
    roles: RoleWithContests[];
    candidatiCount: number;
    loading: boolean;
    error: string | null;
}

export function useConcorsoData(categorySlug: string) {
    const [data, setData] = useState<ConcorsoData>({
        category: null,
        roles: [],
        candidatiCount: 0,
        loading: true,
        error: null,
    });

    useEffect(() => {
        async function loadData() {
            try {
                // 1. Fetch Category
                const { data: category, error: catError } = await supabase
                    .from("categories")
                    .select("*")
                    .eq("slug", categorySlug)
                    .single();

                if (catError || !category) {
                    throw new Error(catError?.message || "Category not found");
                }

                // 2. Fetch Roles for this Category
                const { data: rolesData, error: rolesError } = await supabase
                    .from("roles")
                    .select("*")
                    .eq("category_id", category.id)
                    .order("title");

                if (rolesError) {
                    throw new Error(rolesError.message);
                }

                // 3. Fetch Contests (Quizzes) for these roles
                const roleIds = rolesData.map(r => r.id);
                const { data: quizzesData, error: quizzesError } = await supabase
                    .from("quizzes")
                    .select("*")
                    .in("role_id", roleIds)
                    .eq("is_archived", false)
                    .order("year", { ascending: false });

                if (quizzesError) {
                    throw new Error(quizzesError.message);
                }

                // 4. Fetch Leaderboard Data for Active Users Calculation
                // We fetch all unique (quiz_id, user_id) pairs for the retrieved quizzes
                const quizIds = quizzesData.map(q => q.id);
                let allLeaderboardEntries: { quiz_id: string, user_id: string }[] = [];

                if (quizIds.length > 0) {
                    const { data: leaderboardData } = await supabase
                        .from("concorso_leaderboard")
                        .select("quiz_id, user_id")
                        .in("quiz_id", quizIds);

                    if (leaderboardData) {
                        allLeaderboardEntries = leaderboardData;
                    }
                }

                // 5. Group Contests by Role & Calculate Active Users
                const rolesWithContests: RoleWithContests[] = rolesData.map(role => {
                    const roleQuizzes = quizzesData.filter(q => q.role_id === role.id);
                    const roleQuizIds = roleQuizzes.map(q => q.id);

                    // Calculate unique users for this role (set of user_ids across all quizzes of this role)
                    const roleUniqueUsers = new Set(
                        allLeaderboardEntries
                            .filter(entry => roleQuizIds.includes(entry.quiz_id))
                            .map(entry => entry.user_id)
                    );

                    return {
                        id: role.id,
                        slug: role.slug,
                        title: role.title,
                        categorySlug: categorySlug,
                        activeUsers: roleUniqueUsers.size,
                        contests: roleQuizzes.map(q => ({
                            id: q.id,
                            slug: q.slug || q.id,
                            title: q.title,
                            year: q.year,
                            available_seats: q.available_seats,
                            description: q.description || "",
                            roleSlug: role.slug,
                            categorySlug: categorySlug,
                        }))
                    };
                });

                // 6. Total category candidates (unique users across all roles)
                const categoryUniqueUsers = new Set(allLeaderboardEntries.map(e => e.user_id));
                const candidatiCount = categoryUniqueUsers.size;

                setData({
                    category: {
                        id: category.id,
                        slug: category.slug,
                        title: category.title,
                        description: category.description || "",
                        home_banner_url: category.home_banner_url || undefined,
                        inner_banner_url: category.inner_banner_url || undefined,
                    },
                    roles: rolesWithContests,
                    candidatiCount,
                    loading: false,
                    error: null,
                });

            } catch (err: any) {
                console.error("useConcorsoData error:", err);
                setData(prev => ({ ...prev, loading: false, error: err.message }));
            }
        }

        if (categorySlug) {
            loadData();
        }
    }, [categorySlug]);

    return data;
}
