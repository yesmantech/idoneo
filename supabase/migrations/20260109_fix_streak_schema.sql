-- Migration: Harmonize Streak Schema (Fixed)
-- Handles cases where columns already exist

-- 1. Ensure target columns exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS streak_max INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS streak_current INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE;

-- 2. Migrate data from old columns (current_streak -> streak_current) if they exist
DO $$
BEGIN
    -- Check current_streak
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'current_streak') THEN
        -- Copy data if target is empty
        UPDATE public.profiles 
        SET streak_current = current_streak 
        WHERE (streak_current IS NULL OR streak_current = 0) AND current_streak IS NOT NULL;
        
        -- Safe to drop old column now? Maybe keep it for safety or just drop to be clean.
        -- Let's drop it to avoid confusion as per strict migration requirements.
        ALTER TABLE public.profiles DROP COLUMN current_streak;
    END IF;

    -- Check last_quiz_at
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'last_quiz_at') THEN
        -- Copy data
        UPDATE public.profiles 
        SET last_active_at = last_quiz_at 
        WHERE last_active_at IS NULL AND last_quiz_at IS NOT NULL;
        
        ALTER TABLE public.profiles DROP COLUMN last_quiz_at;
    END IF;
END $$;

-- 3. Update the trigger function
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
    last_date DATE;
    today_date DATE;
    current_streak_val INTEGER;
    max_streak_val INTEGER;
BEGIN
    -- Get current values
    SELECT 
        (last_active_at AT TIME ZONE 'UTC')::DATE,
        COALESCE(streak_current, 0),
        COALESCE(streak_max, 0)
    INTO 
        last_date,
        current_streak_val,
        max_streak_val
    FROM public.profiles WHERE id = NEW.user_id;
    
    today_date := (NEW.created_at AT TIME ZONE 'UTC')::DATE;

    -- Update logic
    IF last_date IS NULL THEN
        -- First activity ever
        current_streak_val := 1;
    ELSIF today_date = last_date THEN
        -- Same day, keep streak
        -- No change to current_streak_val
    ELSIF today_date = last_date + INTERVAL '1 day' THEN
        -- Next day, increment streak
        current_streak_val := current_streak_val + 1;
    ELSE
        -- Streak broken
        current_streak_val := 1;
    END IF;

    -- Update Max Streak
    IF current_streak_val > max_streak_val THEN
        max_streak_val := current_streak_val;
    END IF;

    -- Perform Update
    UPDATE public.profiles 
    SET 
        streak_current = current_streak_val,
        streak_max = max_streak_val,
        last_active_at = NEW.created_at
    WHERE id = NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
