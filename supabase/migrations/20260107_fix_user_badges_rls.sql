-- Migration: Fix RLS policies for user_badges
-- The previous policy was too restrictive, causing 42501 errors

-- Drop existing policies
DROP POLICY IF EXISTS "Public Read User Badges" ON public.user_badges;
DROP POLICY IF EXISTS "Users can insert own badges" ON public.user_badges;
DROP POLICY IF EXISTS "Users can manage own badges" ON public.user_badges;

-- Recreate with proper policies
-- 1. Anyone can read badges (for leaderboards, profiles, etc.)
CREATE POLICY "Anyone can view badges"
    ON public.user_badges
    FOR SELECT
    USING (true);

-- 2. Authenticated users can insert their own badges
CREATE POLICY "Users can insert own badges"
    ON public.user_badges
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 3. Authenticated users can update their own badges (for rare edge cases)
CREATE POLICY "Users can update own badges"
    ON public.user_badges
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. Service role can do anything (for backend jobs)
CREATE POLICY "Service role full access"
    ON public.user_badges
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
