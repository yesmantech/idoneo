import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

export interface RoleResource {
    id: string;
    title: string;
    url: string;
    type: string;
}

export interface RoleData {
    id: string;
    title: string;
    slug: string;
    description: string;
    available_positions: string;
    share_bank_link: string;
    category_slug: string;
}

export interface RoleHubData {
    role: RoleData | null;
    resources: RoleResource[];
    latestQuizId: string | null; // ID of the latest official quiz to start
    latestQuizSlug: string | null; // Slug of the latest official quiz
    history: any[]; // Simplified attempt history
    candidatiCount: number; // NEW: Total attempts/participants count
    loading: boolean;
    error: string | null;
}

export function useRoleHubData(categorySlug: string, roleSlug: string) {
    const { user } = useAuth();
    const [data, setData] = useState<RoleHubData>({
        role: null,
        resources: [],
        latestQuizId: null,
        latestQuizSlug: null,
        history: [],
        candidatiCount: 0,
        loading: true,
        error: null
    });

    useEffect(() => {
        if (!roleSlug) return;

        const load = async () => {
            try {
                // 1. Fetch Role
                const { data: role, error: roleError } = await supabase
                    .from("roles")
                    .select("*, category:categories(slug)")
                    .eq("slug", roleSlug)
                    .single();

                if (roleError || !role) throw new Error(roleError?.message || "Ruolo non trovato");

                // Check category match if needed (optional)

                // 2. Fetch Resources
                const { data: resources } = await supabase
                    .from("role_resources")
                    .select("*")
                    .eq("role_id", role.id)
                    .order("order_index", { ascending: true });

                // 3. Fetch Latest Official Quiz
                const { data: quizzes } = await supabase
                    .from("quizzes")
                    .select("id, slug, year")
                    .eq("role_id", role.id)
                    .eq("is_official", true)
                    .eq("is_archived", false)
                    .order("year", { ascending: false })
                    .limit(1);

                const latestQuizId = quizzes && quizzes.length > 0 ? quizzes[0].id : null;
                const latestQuizSlug = quizzes && quizzes.length > 0 ? quizzes[0].slug : null;

                // 4. Fetch History (Attempts for this role)
                // We need to find all quizzes for this role first (official or not) to filter attempts?
                // OR we can join attempts -> quiz -> role_id
                let history: any[] = [];
                if (user) {
                    const { data: attempts } = await supabase
                        .from("quiz_attempts")
                        .select(`
                            id, 
                            score, 
                            created_at, 
                            is_official_sim,
                            quiz:quizzes!inner(role_id, title)
                        `)
                        .eq("user_id", user.id)
                        .eq("quiz.role_id", role.id)
                        .order("created_at", { ascending: false })
                        .limit(20);

                    if (attempts) history = attempts;
                    if (attempts) history = attempts;
                }

                // 5. Fetch Global Stats (Candidati Count)
                const { count: userCount } = await supabase
                    .from("quiz_attempts")
                    .select("user_id", { count: 'exact', head: true })
                    .eq("quiz.role_id", role.id) // This assumes we can filter by joined column, but strict equality on joined tables in Supabase simpler via inner join logic on IDs. 
                // Actually simpler: Get all quiz IDs for this role first.
                // But we already fetched latestQuiz. Ideally we fetch all Quiz IDs.

                // Optimized approach: 
                // We need all quizzes for this role to count unique users. 
                let candidatiCount = 0;

                if (role && role.id) {
                    try {
                        const { data: countData, error: countError } = await supabase
                            .rpc('get_role_candidate_count', { target_role_id: role.id });

                        if (!countError) {
                            candidatiCount = countData as number;
                        } else {
                            console.error("RPC Error:", countError);
                        }
                    } catch (e) {
                        console.error("Failed to fetch candidate count via RPC", e);
                    }
                }

                setData({
                    role: {
                        id: role.id,
                        title: role.title,
                        slug: role.slug,
                        description: role.description || "",
                        available_positions: role.available_positions || "",
                        share_bank_link: role.share_bank_link || "",
                        category_slug: categorySlug
                    },
                    resources: resources || [],
                    latestQuizId,
                    latestQuizSlug,
                    history,
                    candidatiCount,
                    loading: false,
                    error: null
                });

            } catch (err: any) {
                console.error(err);
                setData(prev => ({ ...prev, loading: false, error: err.message }));
            }
        };

        load();
    }, [roleSlug, user]);

    return data;
}
