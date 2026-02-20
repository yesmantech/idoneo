/**
 * @file AuthContext.tsx
 * @description Global authentication state management using React Context.
 *
 * This provider wraps the entire application and provides:
 * - **User Object**: The Supabase Auth user (email, id, metadata)
 * - **Profile Data**: Extended user profile from the `profiles` table
 * - **Loading State**: True while initial auth check is in progress
 * - **Refresh Function**: Manually refetch profile after updates
 *
 * ## Auth Flow
 * ```
 * App Mount → getSession() → Set user + fetch profile → Listen for changes
 *                                     ↓
 *                            Login/Logout events trigger onAuthStateChange
 * ```
 *
 * ## Profile Data
 * The profile includes gamification data (streaks) and role information
 * for admin access control.
 *
 * @example
 * ```tsx
 * import { useAuth } from '@/context/AuthContext';
 *
 * function ProfilePage() {
 *   const { user, profile, loading } = useAuth();
 *
 *   if (loading) return <Spinner />;
 *   if (!user) return <Navigate to="/login" />;
 *
 *   return <h1>Welcome, {profile?.nickname}</h1>;
 * }
 * ```
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Profile {
    id: string;
    nickname: string | null;
    avatar_url: string | null;
    role: string;
    streak_current?: number;
    streak_max?: number;
    dismissed_modals?: string[];
    total_xp?: number;
}

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    refreshProfile: () => Promise<void>;
    isModalDismissed: (key: string) => boolean;
    dismissModal: (key: string) => Promise<void>;
}

// ============================================================================
// CONTEXT SETUP
// ============================================================================

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    refreshProfile: async () => { },
    isModalDismissed: () => false,
    dismissModal: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const queryClient = useQueryClient();

    // React Query handle profile fetching
    const { data: profile = null, isLoading: profileLoading, refetch } = useQuery({
        queryKey: ['profile', user?.id],
        queryFn: async () => {
            if (!user?.id) return null;
            console.log('React Query: Fetching profile for', user.id);
            const { data, error } = await supabase
                .from('profiles')
                .select('id, nickname, avatar_url, role, streak_current, streak_max, dismissed_modals, total_xp')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error("Error fetching profile:", error);
                throw error;
            }
            return data as Profile;
        },
        enabled: !!user?.id, // Only run query if we have a user
        staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes
    });

    // Mutation for updating dismissed modals
    const modalMutation = useMutation({
        mutationFn: async ({ key, currentModals }: { key: string, currentModals: string[] }) => {
            if (!user?.id) throw new Error("No user");
            const updated = [...currentModals, key];
            const { error } = await supabase
                .from('profiles')
                .update({ dismissed_modals: updated })
                .eq('id', user.id);
            if (error) throw error;
            return updated;
        },
        onMutate: async ({ key, currentModals }) => {
            // Cancel any outgoing refetches to avoid overwriting optimistic update
            await queryClient.cancelQueries({ queryKey: ['profile', user?.id] });
            const previousProfile = queryClient.getQueryData(['profile', user?.id]);

            // Optimistically update
            queryClient.setQueryData(['profile', user?.id], (old: any) => ({
                ...old,
                dismissed_modals: [...currentModals, key]
            }));

            return { previousProfile };
        },
        onError: (err, variables, context) => {
            // Rollback on error
            console.error("Error persisting modal dismissal:", err);
            queryClient.setQueryData(['profile', user?.id], context?.previousProfile);
        },
        onSettled: () => {
            // Always refetch after error or success to ensure sync
            queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
        }
    });

    useEffect(() => {
        // Initial Session Check
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setAuthLoading(false);
        });

        // Listen for Auth Changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (!session?.user) {
                // Clear query cache on logout
                queryClient.removeQueries({ queryKey: ['profile'] });
            }
            setAuthLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [queryClient]);

    const refreshProfile = async () => {
        if (user) await refetch();
    };

    const isModalDismissed = (key: string) => {
        return profile?.dismissed_modals?.includes(key) ?? false;
    };

    const dismissModal = async (key: string) => {
        if (!user || !profile) return;
        const current = profile.dismissed_modals || [];
        if (current.includes(key)) return;

        modalMutation.mutate({ key, currentModals: current });
    };

    const loading = authLoading || (!!user?.id && profileLoading);

    return (
        <AuthContext.Provider value={{ user, profile, loading, refreshProfile, isModalDismissed, dismissModal }}>
            {children}
        </AuthContext.Provider>
    );
};
