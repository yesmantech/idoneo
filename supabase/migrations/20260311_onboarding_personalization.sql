-- Migration: Onboarding Personalization Fields
-- Adds columns to profiles for the intelligent onboarding funnel.
-- These fields drive homepage personalization and marketing segmentation.

-- =========================================================================
-- 1. New Onboarding Columns on profiles
-- =========================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_goal TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_age_range TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_experience TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_motivation TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_preferences JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_daily_time TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_categories JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;


-- =========================================================================
-- 2. RPC: save_onboarding — Atomic save of all onboarding data
-- SECURITY DEFINER bypasses V5 RLS (users can only SELECT own row).
-- =========================================================================

CREATE OR REPLACE FUNCTION public.save_onboarding(
    p_goal TEXT DEFAULT NULL,
    p_age_range TEXT DEFAULT NULL,
    p_experience TEXT DEFAULT NULL,
    p_motivation TEXT DEFAULT NULL,
    p_preferences JSONB DEFAULT '[]'::jsonb,
    p_daily_time TEXT DEFAULT NULL,
    p_categories JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    UPDATE profiles
    SET
        onboarding_goal = COALESCE(p_goal, onboarding_goal),
        onboarding_age_range = COALESCE(p_age_range, onboarding_age_range),
        onboarding_experience = COALESCE(p_experience, onboarding_experience),
        onboarding_motivation = COALESCE(p_motivation, onboarding_motivation),
        onboarding_preferences = CASE WHEN p_preferences != '[]'::jsonb THEN p_preferences ELSE onboarding_preferences END,
        onboarding_daily_time = COALESCE(p_daily_time, onboarding_daily_time),
        onboarding_categories = CASE WHEN p_categories != '[]'::jsonb THEN p_categories ELSE onboarding_categories END,
        onboarding_completed_at = NOW(),
        updated_at = NOW()
    WHERE id = v_user_id;

    RETURN jsonb_build_object('success', true);
END;
$$;


-- =========================================================================
-- 3. Rebuild profiles_public WITHOUT onboarding fields (privacy)
-- =========================================================================

DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public AS
SELECT
    id,
    nickname,
    avatar_url,
    total_xp,
    streak_current,
    streak_max,
    referral_count,
    subscription_tier,
    created_at
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO authenticated;
GRANT SELECT ON public.profiles_public TO anon;
