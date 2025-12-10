-- Migration: XP System for Gamification

-- 1. Create XP Events Table (History)
CREATE TABLE IF NOT EXISTS public.xp_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    xp_amount INTEGER NOT NULL DEFAULT 0,
    source_type TEXT NOT NULL, -- 'attempt_question' or 'attempt_completion'
    attempt_id UUID REFERENCES public.quiz_attempts(id) ON DELETE SET NULL,
    question_id UUID REFERENCES public.questions(id) ON DELETE SET NULL, -- Optional if tracking per question
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_xp_events_user_id ON public.xp_events(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_events_created_at ON public.xp_events(created_at);

-- 2. Add Global XP to Profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0;

-- 3. Add Idempotency Flag to Quiz Attempts
ALTER TABLE public.quiz_attempts 
ADD COLUMN IF NOT EXISTS xp_awarded BOOLEAN DEFAULT false;

-- 4. Enable RLS for XP Events
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;

-- 5. Policies for XP Events
DROP POLICY IF EXISTS "Public Read XP Events" ON public.xp_events;
DROP POLICY IF EXISTS "Users can insert own xp events" ON public.xp_events;

CREATE POLICY "Public Read XP Events" ON public.xp_events
    FOR SELECT USING (true);

-- Allow users to insert via server-side functions mostly, but if we do client-side:
CREATE POLICY "Users can insert own xp events" ON public.xp_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);
