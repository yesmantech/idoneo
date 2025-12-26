-- Migration: Badge System Tables
-- Creates the table to track badges awarded to users

-- 1. Create user_badges table
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Ensure a user can only have a specific badge once
    UNIQUE(user_id, badge_id)
);

-- 2. Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON public.user_badges(badge_id);

-- 3. Enable RLS
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- 4. Policies
DROP POLICY IF EXISTS "Public Read User Badges" ON public.user_badges;
DROP POLICY IF EXISTS "Users can insert own badges" ON public.user_badges;

CREATE POLICY "Public Read User Badges" ON public.user_badges
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own badges" ON public.user_badges
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Add Badge types helper (optional, for reference in SQL if needed)
-- We'll handle most logic in the application layer or via RPCs
