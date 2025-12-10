import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Category, Role, Contest } from '@/lib/data';

export interface RoleWithContests extends Role {
    contests: Contest[];
}

export interface ConcorsoData {
    category: Category | null;
    roles: RoleWithContests[];
    loading: boolean;
    error: string | null;
}

export function useConcorsoData(categorySlug: string) {
    const [data, setData] = useState<ConcorsoData>({
        category: null,
        roles: [],
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
                // We'll fetch all quizzes for these roles in one go
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

                // 4. Group Contests by Role
                const rolesWithContests: RoleWithContests[] = rolesData.map(role => {
                    const roleQuizzes = quizzesData.filter(q => q.role_id === role.id);
                    return {
                        id: role.id,
                        slug: role.slug,
                        title: role.title,
                        categorySlug: categorySlug,
                        contests: roleQuizzes.map(q => ({
                            id: q.id,
                            slug: q.slug || q.id,
                            title: q.title,
                            year: q.year,
                            description: q.description || "",
                            roleSlug: role.slug,
                            categorySlug: categorySlug,
                        }))
                    };
                });

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
