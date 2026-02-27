-- Performance Indexes
-- Created to optimize frequent filter and join operations

-- 1. Bandi Table Optimizations
-- Used heavily in BandiFilters for the main list and closing soon carousel
CREATE INDEX IF NOT EXISTS idx_bandi_status ON public.bandi(status);
CREATE INDEX IF NOT EXISTS idx_bandi_deadline ON public.bandi(deadline);
CREATE INDEX IF NOT EXISTS idx_bandi_is_remote ON public.bandi(is_remote);
CREATE INDEX IF NOT EXISTS idx_bandi_education_level ON public.bandi USING GIN (education_level);

-- Composite index for the "Closing Soon" query (open status + deadline sort)
CREATE INDEX IF NOT EXISTS idx_bandi_status_deadline ON public.bandi(status, deadline);

-- 2. Quizzes Table Optimizations
-- Used heavily when browsing categories or starting official simulations
CREATE INDEX IF NOT EXISTS idx_quizzes_category_id ON public.quizzes(category_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_is_official ON public.quizzes(is_official);

-- 3. User Attempts & Stats Optimizations
-- Used heavily on the Dashboard and Profile pages for calculating XP and correctness
CREATE INDEX IF NOT EXISTS idx_user_attempts_user_id ON public.user_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_attempts_quiz_id ON public.user_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_attempt_id ON public.user_answers(attempt_id);

-- 4. User Saved Bandi
-- Used to render the watchlist and heart icons quickly
CREATE INDEX IF NOT EXISTS idx_user_saved_bandi_user_id ON public.user_saved_bandi(user_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_bandi_bando_id ON public.user_saved_bandi(bando_id);
