-- ============================================================================
-- AUDIT V5: RLS HARDENING + RATE LIMITING + PROFILES_PUBLIC CLEANUP
-- Fixes: V5-SEC-1 (Profile UPDATE restriction)
--        V5-SEC-2 (Profile SELECT restriction)
--        V5-XP-1  (Quiz attempt rate limiting)
--        V5-SEC-3 (Explicit DELETE deny on quiz_attempts)
--        V5-REV-1 (Remove referral_code from profiles_public)
-- ============================================================================

-- ==========================================================================
-- FIX V5-SEC-1: Restrict profile UPDATE to SAFE columns only
-- Previously only restricted 'role'. Now restricts ALL gamification columns.
-- Users can only modify: nickname, avatar_url, dismissed_modals, updated_at
-- Server triggers handle: total_xp, streak_*, daily_xp*, referral_*, referred_by
-- ==========================================================================
DROP POLICY IF EXISTS "Users can update own profile (restricted)" ON public.profiles;

CREATE POLICY "Users can update own profile (restricted)" ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        -- Role must remain unchanged (anti-escalation)
        AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
        -- total_xp must remain unchanged (server trigger manages this)
        AND total_xp = (SELECT total_xp FROM public.profiles WHERE id = auth.uid())
        -- Streak fields must remain unchanged (server trigger manages this)
        AND streak_current = (SELECT streak_current FROM public.profiles WHERE id = auth.uid())
        AND streak_max = (SELECT streak_max FROM public.profiles WHERE id = auth.uid())
        -- Daily XP fields must remain unchanged (server trigger manages this)
        AND daily_xp = (SELECT daily_xp FROM public.profiles WHERE id = auth.uid())
        AND daily_xp_date = (SELECT daily_xp_date FROM public.profiles WHERE id = auth.uid())
        -- Referral fields must remain unchanged after initial setup
        AND referral_count = (SELECT referral_count FROM public.profiles WHERE id = auth.uid())
        AND referral_code = (SELECT referral_code FROM public.profiles WHERE id = auth.uid())
        -- V10-REV-1: Subscription tier — only changeable by server/admin
        AND subscription_tier = (SELECT subscription_tier FROM public.profiles WHERE id = auth.uid())
        -- V10-SEC-1: Referred by — immutable after initial setup
        AND referred_by IS NOT DISTINCT FROM (SELECT referred_by FROM public.profiles WHERE id = auth.uid())
    );


-- ==========================================================================
-- FIX V5-SEC-2: Restrict profile SELECT to own row only
-- Other users must use profiles_public VIEW (no email, no referred_by)
-- ==========================================================================
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Public Read Profiles" ON public.profiles;

-- Users can only SELECT their own full profile
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;

CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);


-- ==========================================================================
-- FIX V5-REV-1: Remove referral_code from profiles_public VIEW
-- Referral codes should NOT be harvestable by querying the VIEW.
-- Users share their own code through the UI, not via DB queries.
-- Must DROP then CREATE because CREATE OR REPLACE cannot remove columns.
-- ==========================================================================
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
    created_at
FROM public.profiles;

-- Ensure VIEW access for leaderboard and public display
GRANT SELECT ON public.profiles_public TO authenticated;
GRANT SELECT ON public.profiles_public TO anon;


-- ==========================================================================
-- FIX V5-XP-1: Rate limit quiz_attempts INSERT (max 120 per user per hour)
-- Prevents bot spam that could flood the DB with millions of rows.
-- The limit of 120/hour is generous enough for real users (1 quiz every 30s)
-- but blocks automated abuse.
-- ==========================================================================

-- Create a helper function to check rate limits
CREATE OR REPLACE FUNCTION public.check_quiz_attempt_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM quiz_attempts
    WHERE user_id = NEW.user_id
      AND created_at > NOW() - INTERVAL '1 hour';

    IF v_count >= 120 THEN
        RAISE EXCEPTION 'Rate limit exceeded: max 120 quiz attempts per hour';
    END IF;

    RETURN NEW;
END;
$$;

-- Attach the rate limit trigger
DROP TRIGGER IF EXISTS trg_quiz_attempt_rate_limit ON public.quiz_attempts;
CREATE TRIGGER trg_quiz_attempt_rate_limit
    BEFORE INSERT ON public.quiz_attempts
    FOR EACH ROW
    EXECUTE FUNCTION public.check_quiz_attempt_rate_limit();


-- ==========================================================================
-- FIX V5-SEC-3: Explicit DELETE deny on quiz_attempts
-- Attempts are immutable records. This makes the intent explicit
-- and prevents accidental permissive DELETE policies in the future.
-- ==========================================================================
DROP POLICY IF EXISTS "No attempt deletion" ON public.quiz_attempts;
CREATE POLICY "No attempt deletion" ON public.quiz_attempts
    FOR DELETE
    TO authenticated
    USING (false);
