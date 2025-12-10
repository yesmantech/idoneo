-- Migration: Create Leaderboard Tables

-- 1. Seasons for Global XP
CREATE TABLE IF NOT EXISTS public.leaderboard_seasons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    start_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    end_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. User XP (Per Season)
CREATE TABLE IF NOT EXISTS public.user_xp (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    season_id UUID REFERENCES public.leaderboard_seasons(id) ON DELETE SET NULL,
    xp INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, season_id)
);

-- 3. Concorso Leaderboard (Skill Score)
CREATE TABLE IF NOT EXISTS public.concorso_leaderboard (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE, -- Context is Quiz (Concorso)
    score NUMERIC(5, 2) DEFAULT 0, -- 0-100.00
    accuracy_weighted NUMERIC(5, 4), -- 0-1.0000
    volume_factor NUMERIC(5, 4), -- 0-1.0000
    trend_factor NUMERIC(5, 4),
    last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, quiz_id)
);

-- Enable RLS
ALTER TABLE public.leaderboard_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concorso_leaderboard ENABLE ROW LEVEL SECURITY;

-- Policies (Drop first to allow re-running)
DROP POLICY IF EXISTS "Public Read Seasons" ON public.leaderboard_seasons;
DROP POLICY IF EXISTS "Public Read XP" ON public.user_xp;
DROP POLICY IF EXISTS "Users can insert own xp" ON public.user_xp;
DROP POLICY IF EXISTS "Users can update own xp" ON public.user_xp;
DROP POLICY IF EXISTS "Public Read Scores" ON public.concorso_leaderboard;
DROP POLICY IF EXISTS "Users can insert own scores" ON public.concorso_leaderboard;
DROP POLICY IF EXISTS "Users can update own scores" ON public.concorso_leaderboard;

-- Re-create Policies
CREATE POLICY "Public Read Seasons" ON public.leaderboard_seasons FOR SELECT USING (true);

CREATE POLICY "Public Read XP" ON public.user_xp FOR SELECT USING (true);
CREATE POLICY "Users can insert own xp" ON public.user_xp FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own xp" ON public.user_xp FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Public Read Scores" ON public.concorso_leaderboard FOR SELECT USING (true);
CREATE POLICY "Users can insert own scores" ON public.concorso_leaderboard FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scores" ON public.concorso_leaderboard FOR UPDATE USING (auth.uid() = user_id);
