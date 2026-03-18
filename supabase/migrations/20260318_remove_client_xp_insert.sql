-- =============================================================================
-- MIGRATION: Remove client-writable xp_events INSERT policy
-- SEC-028: xp_events should only be written by database triggers (SECURITY DEFINER).
-- The old "Users can insert own xp events" policy is now superseded by the 
-- TR_award_xp_on_completion trigger. Removing it prevents manual XP manipulation.
-- =============================================================================

-- Remove the client INSERT policy (trigger uses SECURITY DEFINER, bypasses RLS)
DROP POLICY IF EXISTS "Users can insert own xp events" ON public.xp_events;

-- Keep only the read policy — triggers insert with SECURITY DEFINER (bypasses RLS)
-- so no need for a client-facing INSERT policy.

-- Verify RLS is still enabled
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
