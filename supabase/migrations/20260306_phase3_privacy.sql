-- ============================================================================
-- AUDIT V2: PHASE 3 DATA PRIVACY & STRIPPING
-- Fixes: HIGH-1 (Options Leak), HIGH-5 (PII Leak), HIGH-6 (PII Leaderboard)
-- ============================================================================

-- 1. FIX HIGH-1 & HIGH-6: Safe Views for Client Data
-- Create a view for questions that EXCLUDES correct_option
CREATE OR REPLACE VIEW public.questions_safe AS
SELECT 
    id, 
    subject_id, 
    text, 
    option_a, 
    option_b, 
    option_c, 
    option_d, 
    options, 
    explanation, 
    tags, 
    is_archived, 
    created_at, 
    updated_at
FROM public.questions;

-- Grant permissions to authenticated users to read the safe view
GRANT SELECT ON public.questions_safe TO authenticated;

-- Create a view for profiles that EXCLUDES email and waitlist_joined_at
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT 
    id, 
    nickname, 
    avatar_url, 
    role, 
    total_xp, 
    streak_current, 
    streak_max, 
    referral_code, 
    referral_count, 
    created_at
FROM public.profiles;

-- Grant permissions
GRANT SELECT ON public.profiles_public TO authenticated;


-- 2. FIX MED-7: Add offline cleanup function
-- We will call this periodically or let the client call it
CREATE OR REPLACE FUNCTION public.cleanup_stale_offline_attempts()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- This relies on the client actually inserting them into the DB.
    -- If they only live in IndexedDB, the DB can't clean them.
    -- However, if any orphaned attempts sit in the DB without finished_at for > 7 days, purge them.
    DELETE FROM public.quiz_attempts 
    WHERE finished_at IS NULL AND created_at < NOW() - INTERVAL '7 days';
END;
$$;
