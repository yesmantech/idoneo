-- Migration: Stats Dashboard Enhancements
-- Created: 2024-12-13
-- Purpose: Add goals table, config_snapshot, and timing data for coaching dashboard

-- ==========================================
-- 1. Create test_goals Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.test_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    goal_type TEXT NOT NULL CHECK (goal_type IN ('score', 'accuracy', 'attempts')),
    target_value NUMERIC(6,2) NOT NULL,
    current_value NUMERIC(6,2) DEFAULT 0,
    deadline DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'failed', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, quiz_id, goal_type)
);

-- 2. Enable RLS on test_goals
ALTER TABLE public.test_goals ENABLE ROW LEVEL SECURITY;

-- 3. Policies for test_goals
DROP POLICY IF EXISTS "Users can read own goals" ON public.test_goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON public.test_goals;
DROP POLICY IF EXISTS "Users can update own goals" ON public.test_goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON public.test_goals;

CREATE POLICY "Users can read own goals" ON public.test_goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals" ON public.test_goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON public.test_goals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON public.test_goals
    FOR DELETE USING (auth.uid() = user_id);

-- 4. Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_test_goals_user_quiz ON public.test_goals(user_id, quiz_id);

-- ==========================================
-- 5. Enhance quiz_attempts Table
-- ==========================================
ALTER TABLE public.quiz_attempts 
    ADD COLUMN IF NOT EXISTS config_snapshot JSONB DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS avg_response_time_ms INTEGER DEFAULT NULL;

-- Comments for documentation
COMMENT ON COLUMN quiz_attempts.config_snapshot IS 'Stores test configuration (subjects, question count, time limit) to enable "Repeat this test"';
COMMENT ON COLUMN quiz_attempts.duration_seconds IS 'Total time taken for the attempt in seconds';
COMMENT ON COLUMN quiz_attempts.avg_response_time_ms IS 'Average response time per question in milliseconds';

-- ==========================================
-- 6. Grant Permissions
-- ==========================================
GRANT ALL ON public.test_goals TO authenticated;
GRANT ALL ON public.test_goals TO service_role;
