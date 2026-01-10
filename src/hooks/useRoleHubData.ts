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
    leaderboardData?: any; // NEW: Detailed scoring factors from concorso_leaderboard
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
                // 1. Fetch Role first (essential for other IDs)
                const { data: role, error: roleError } = await supabase
                    .from("roles")
                    .select("*, category:categories(slug)")
                    .eq("slug", roleSlug)
                    .single();

                if (roleError || !role) throw new Error(roleError?.message || "Ruolo non trovato");

                // 2. Parallelize everything else possible
                const [resourcesRes, quizzesRes, candidateCountRes] = await Promise.all([
                    supabase
                        .from("role_resources")
                        .select("*")
                        .eq("role_id", role.id)
                        .order("order_index", { ascending: true }),
                    supabase
                        .from("quizzes")
                        .select("id, slug, year, title")
                        .eq("role_id", role.id)
                        .eq("is_official", true)
                        .eq("is_archived", false)
                        .order("year", { ascending: false })
                        .limit(1),
                    supabase.rpc('get_role_candidate_count', { target_role_id: role.id })
                ]);

                const resources = resourcesRes.data || [];
                const latestQuiz = quizzesRes.data?.[0];
                const latestQuizId = latestQuiz?.id || null;
                const latestQuizSlug = latestQuiz?.slug || null;
                const candidatiCount = (candidateCountRes.data as number) || 0;

                let history: any[] = [];
                let leaderboardData: any = null;

                if (user) {
                    // Fetch all relevant quizzes for history & leaderboard data in parallel
                    let quizQuery = supabase.from('quizzes').select('id, title').eq('role_id', role.id);

                    const [allQuizzesRes, lbRes] = await Promise.all([
                        quizQuery,
                        latestQuizId ? supabase
                            .from('concorso_leaderboard')
                            .select('score, volume_factor, accuracy_weighted, recency_score, coverage_score, reliability')
                            .eq('user_id', user.id)
                            .eq('quiz_id', latestQuizId)
                            .maybeSingle() : Promise.resolve({ data: null })
                    ]);

                    const allQuizzes = allQuizzesRes.data || [];
                    const quizTitleMap = new Map(allQuizzes.map(q => [q.id, q.title]));
                    const roleQuizIds = allQuizzes.map(q => q.id);
                    leaderboardData = lbRes.data;

                    if (roleQuizIds.length > 0) {
                        const { data: attempts } = await supabase
                            .from("quiz_attempts")
                            .select(`id, score, created_at, quiz_id, correct, total_questions, mode`)
                            .eq("user_id", user.id)
                            .in("quiz_id", roleQuizIds)
                            .order("created_at", { ascending: false })
                            .limit(20);

                        if (attempts) {
                            history = attempts.map(a => ({
                                ...a,
                                is_official_sim: quizTitleMap.get(a.quiz_id)?.includes("Ufficiale") || false,
                                quiz: { title: quizTitleMap.get(a.quiz_id) || "Simulazione" }
                            }));
                        }
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
                    resources,
                    latestQuizId,
                    latestQuizSlug,
                    history,
                    candidatiCount,
                    leaderboardData,
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
