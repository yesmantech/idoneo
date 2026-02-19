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

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Extended user profile from the `profiles` table.
 * Contains display info and gamification stats.
 */
interface Profile {
    /** User UUID (matches auth.users.id) */
    id: string;
    /** Display name chosen by user */
    nickname: string | null;
    /** Profile picture URL (Supabase Storage) */
    avatar_url: string | null;
    /** User role for access control ('user' or 'admin') */
    role: string;
    /** Current consecutive day streak */
    streak_current?: number;
    /** Highest streak ever achieved */
    streak_max?: number;
    /** Array of modal keys the user has dismissed */
    dismissed_modals?: string[];
    /** Lifetime total XP across all seasons */
    total_xp?: number;
}

/**
 * Shape of the AuthContext value.
 */
interface AuthContextType {
    /** Supabase Auth user object (null if not logged in) */
    user: User | null;
    /** Extended profile data (null if not loaded or not logged in) */
    profile: Profile | null;
    /** True while checking initial session */
    loading: boolean;
    /** Manually refresh profile data after updates */
    refreshProfile: () => Promise<void>;
    /** Check if a modal has been dismissed */
    isModalDismissed: (key: string) => boolean;
    /** Persist modal dismissal to DB */
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
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (uid: string) => {
        console.log('AuthContext: Fetching profile for', uid);
        try {
            // Create a timeout promise
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
            );

            // Race the fetch against the timeout
            const fetchPromise = supabase
                .from('profiles')
                .select('id, nickname, avatar_url, role, streak_current, streak_max, dismissed_modals, total_xp')
                .eq('id', uid)
                .single();

            const result = await Promise.race([fetchPromise, timeoutPromise]) as any;
            const { data, error } = result;

            if (data) {
                console.log('AuthContext: Profile loaded', data);
                setProfile(data);
            }
            if (error) {
                console.error("AuthContext: Error fetching profile:", error);
                throw error; // Let the catch block handle fallback
            }
        } catch (err) {
            console.error('AuthContext: Fetch failed, using fallback.', err);
            // Optimization: If fetch fails, assume user role is 'user' to unblock UI
            // This prevents infinite loading for admin users if DB is slow, but restricts secure pages
            // However, for admin access, this will fail open to 'user' role -> redirect to Home.
            // Better than infinite loading.
        }
    };

    const refreshProfile = async () => {
        if (user) await fetchProfile(user.id);
    };

    useEffect(() => {
        // Initial Session Check
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            try {
                setUser(session?.user ?? null);
                if (session?.user) {
                    await fetchProfile(session.user.id);
                }
            } catch (err) {
                console.error("Error initializing session:", err);
            } finally {
                setLoading(false);
            }
        });

        // Listen for Auth Changes
        // Listen for Auth Changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            try {
                setUser(session?.user ?? null);
                if (session?.user) {
                    // Ensure profile is fetched before clearing loading state
                    await fetchProfile(session.user.id);
                } else {
                    setProfile(null);
                }
            } catch (err) {
                console.error('AuthContext: Error in onAuthStateChange', err);
            } finally {
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const isModalDismissed = (key: string) => {
        return profile?.dismissed_modals?.includes(key) ?? false;
    };

    const dismissModal = async (key: string) => {
        if (!user || !profile) return;
        const current = profile.dismissed_modals || [];
        if (current.includes(key)) return;

        const updated = [...current, key];

        // Optimistic update
        setProfile({ ...profile, dismissed_modals: updated });

        const { error } = await supabase
            .from('profiles')
            .update({ dismissed_modals: updated })
            .eq('id', user.id);

        if (error) {
            console.error("Error persisting modal dismissal:", error);
            // Rollback on error
            await refreshProfile();
        }
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, refreshProfile, isModalDismissed, dismissModal }}>
            {children}
        </AuthContext.Provider>
    );
};
