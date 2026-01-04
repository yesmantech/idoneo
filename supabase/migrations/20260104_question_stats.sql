-- Migration: question_stats
-- Description: Track global question difficulty based on all users' answers.

-- 1. Create question_stats table
CREATE TABLE IF NOT EXISTS public.question_stats (
    question_id UUID PRIMARY KEY REFERENCES public.questions(id) ON DELETE CASCADE,
    times_answered INTEGER DEFAULT 0 NOT NULL,
    times_correct INTEGER DEFAULT 0 NOT NULL,
    difficulty_index NUMERIC(5, 4) GENERATED ALWAYS AS (
        CASE 
            WHEN times_answered > 0 THEN 1.0 - (times_correct::numeric / times_answered::numeric)
            ELSE 0.5 -- Default medium difficulty if no data
        END
    ) STORED,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add index for efficient ordering by difficulty
CREATE INDEX IF NOT EXISTS idx_question_stats_difficulty ON public.question_stats (difficulty_index DESC);

-- 3. Enable RLS (read-only for authenticated users)
ALTER TABLE public.question_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read question_stats" ON public.question_stats
    FOR SELECT USING (true);

-- 4. Grant permissions
GRANT SELECT ON public.question_stats TO authenticated;
GRANT SELECT ON public.question_stats TO anon;
