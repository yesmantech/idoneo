-- Migration: User Streaks Tracking
-- Adds streak tracking to profiles and a trigger to update it on quiz completion

-- 1. Add streak columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_quiz_at TIMESTAMP WITH TIME ZONE;

-- 2. Function to update streak on new quiz attempt
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
    last_date DATE;
    today_date DATE;
BEGIN
    -- Get dates (ignoring time)
    SELECT (last_quiz_at AT TIME ZONE 'UTC')::DATE INTO last_date 
    FROM public.profiles WHERE id = NEW.user_id;
    
    today_date := (NEW.created_at AT TIME ZONE 'UTC')::DATE;

    -- Update logic
    IF last_date IS NULL THEN
        -- First quiz ever
        UPDATE public.profiles 
        SET current_streak = 1, last_quiz_at = NEW.created_at
        WHERE id = NEW.user_id;
    ELSIF today_date = last_date THEN
        -- Same day, keep streak, just update timestamp
        UPDATE public.profiles 
        SET last_quiz_at = NEW.created_at
        WHERE id = NEW.user_id;
    ELSIF today_date = last_date + INTERVAL '1 day' THEN
        -- Next day, increment streak
        UPDATE public.profiles 
        SET current_streak = current_streak + 1, last_quiz_at = NEW.created_at
        WHERE id = NEW.user_id;
    ELSE
        -- Streak broken
        UPDATE public.profiles 
        SET current_streak = 1, last_quiz_at = NEW.created_at
        WHERE id = NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger on quiz_attempts
DROP TRIGGER IF EXISTS on_quiz_attempt_streak ON public.quiz_attempts;
CREATE TRIGGER on_quiz_attempt_streak
    AFTER INSERT ON public.quiz_attempts
    FOR EACH ROW EXECUTE FUNCTION update_user_streak();
