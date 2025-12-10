-- Migration: Secure Quiz Attempts table
-- Ensures users can save their simulation results

-- 1. Enable RLS (Safe to run if already enabled)
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to be safe (Idempotent)
DROP POLICY IF EXISTS "Users can read own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can insert own attempts" ON public.quiz_attempts;

-- 3. Create Policies

-- Read: Users can see their own history
CREATE POLICY "Users can read own attempts" 
ON public.quiz_attempts 
FOR SELECT 
USING (auth.uid() = user_id);

-- Insert: Users can save new attempts
CREATE POLICY "Users can insert own attempts" 
ON public.quiz_attempts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Update: Optional (usually attempts are immutable, but allowing update for corrections if needed)
-- CREATE POLICY "Users can update own attempts" ...
