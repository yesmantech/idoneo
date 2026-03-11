/**
 * @file onboardingService.ts
 * @description Service for saving/loading onboarding personalization data.
 */

import { supabase } from './supabaseClient';

// ============================================================================
// TYPES
// ============================================================================

export interface OnboardingData {
    goal: string | null;
    ageRange: string | null;
    experience: string | null;
    motivation: string | null;
    preferences: string[];
    dailyTime: string | null;
    categories: string[];   // category IDs
}

export const EMPTY_ONBOARDING: OnboardingData = {
    goal: null,
    ageRange: null,
    experience: null,
    motivation: null,
    preferences: [],
    dailyTime: null,
    categories: [],
};

// ============================================================================
// SAVE — Atomic RPC call
// ============================================================================

export async function saveOnboarding(data: OnboardingData): Promise<{ success: boolean; error?: string }> {
    try {
        const { data: result, error } = await supabase.rpc('save_onboarding', {
            p_goal: data.goal,
            p_age_range: data.ageRange,
            p_experience: data.experience,
            p_motivation: data.motivation,
            p_preferences: JSON.stringify(data.preferences),
            p_daily_time: data.dailyTime,
            p_categories: JSON.stringify(data.categories),
        });

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        console.error('saveOnboarding error:', err);
        return { success: false, error: err.message };
    }
}

// ============================================================================
// LOAD — Read from own profile
// ============================================================================

export async function loadOnboarding(userId: string): Promise<OnboardingData | null> {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('onboarding_goal, onboarding_age_range, onboarding_experience, onboarding_motivation, onboarding_preferences, onboarding_daily_time, onboarding_categories, onboarding_completed_at')
            .eq('id', userId)
            .single();

        if (error || !data) return null;
        if (!data.onboarding_completed_at) return null;

        return {
            goal: data.onboarding_goal,
            ageRange: data.onboarding_age_range,
            experience: data.onboarding_experience,
            motivation: data.onboarding_motivation,
            preferences: data.onboarding_preferences || [],
            dailyTime: data.onboarding_daily_time,
            categories: data.onboarding_categories || [],
        };
    } catch {
        return null;
    }
}

// ============================================================================
// CHECK — Has completed onboarding?
// ============================================================================

export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('onboarding_completed_at')
            .eq('id', userId)
            .single();

        if (error || !data) return false;
        return !!data.onboarding_completed_at;
    } catch {
        return false;
    }
}
