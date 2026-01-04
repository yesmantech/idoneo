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

                // 4. Fetch History (Role-based attempts)
                let history: any[] = [];
                let contestIds: string[] = [];
                let roleQuizIds: string[] = [];

                if (user) {
                    // 4a. Get all quiz IDs for this role (Direct + Via Contests)
                    const { data: roleContests } = await supabase
                        .from('contests')
                        .select('id')
                        .eq('role_id', role.id);

                    contestIds = roleContests?.map(c => c.id) || [];

                    let query = supabase
                        .from('quizzes')
                        .select('id, title'); // Select title here directly

                    if (contestIds.length > 0) {
                        // Match role_id OR contest_id
                        query = query.or(`role_id.eq.${role.id},contest_id.in.(${contestIds.join(',')})`);
                    } else {
                        query = query.eq('role_id', role.id);
                    }

                    const { data: allQuizzes } = await query;

                    roleQuizIds = allQuizzes?.map(q => q.id) || [];
                    const quizTitleMap = new Map(allQuizzes?.map(q => [q.id, q.title]));

                    if (roleQuizIds.length > 0) {
                        // 4b. Fetch attempts for these quizzes
                        // NOTE: NOT joining quiz:quizzes(title) to avoid RLS issues on joins.
                        const { data: attempts, error: attemptsError } = await supabase
                            .from("quiz_attempts")
                            .select(`
                                id, 
                                score, 
                                created_at, 
                                quiz_id,
                                correct,
                                total_questions,
                                mode
                            `) // Removed invalid column 'is_official_sim' (use quiz properties or joins if needed, but for now we just show title)
                            .eq("user_id", user.id)
                            .in("quiz_id", roleQuizIds)
                            .order("created_at", { ascending: false })
                            .limit(20);

                        if (attempts) {
                            history = attempts.map(a => ({
                                ...a,
                                // Determine if official using the title or assume Simulation based on context
                                is_official_sim: quizTitleMap.get(a.quiz_id)?.includes("Ufficiale") || false,
                                quiz: { title: quizTitleMap.get(a.quiz_id) || "Simulazione" }
                            }));
                        }
                    }
                    // 5. Fetch Official Leaderboard Data (The "True" Preparation Level)
                    let leaderboardData: any = null;
                    if (user && latestQuizId) {
                        const { data: lb } = await supabase
                            .from('concorso_leaderboard')
                            .select('score, volume_factor, accuracy_weighted, recency_score, coverage_score, reliability')
                            .eq('user_id', user.id)
                            .eq('quiz_id', latestQuizId)
                            .single();

                        if (lb) leaderboardData = lb;
                    }

                    // 6. Fetch Global Stats (Candidati Count)
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
                        leaderboardData,
                        loading: false,
                        error: null
                    });
                }
            } catch (err: any) {
                console.error(err);
                setData(prev => ({ ...prev, loading: false, error: err.message }));
            }
        };

        load();
    }, [roleSlug, user]);

    return data;
}
