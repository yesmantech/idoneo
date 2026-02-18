-- ============================================================================
-- SECURITY HARDENING: Business Logic (XP System)
-- Purpose: Move XP awarding from Client (untrusted) to Server (Trusted Trigger)
-- ============================================================================

-- 1. Create the Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_attempt_xp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres) to bypass RLS on profiles if needed, or ensuring consistency
SET search_path = public
AS $$
DECLARE
    v_xp_amount INT;
    v_season_id UUID;
BEGIN
    -- Only run if the attempt is completed and XP hasn't been awarded yet
    -- We assume 'completed' status or just a non-null 'correct' count implies completion for now.
    -- Adjust condition based on your exact app flow. checking xp_awarded is safest.
    
    IF NEW.xp_awarded = true THEN
        RETURN NEW; -- Already processed
    END IF;

    -- If 'correct' is set, we use it. 
    -- If your app sets 'correct' ONLY when finishing, this is safe.
    -- If 'correct' defaults to null, we wait for it to be not null.
    IF NEW.correct IS NULL THEN
        RETURN NEW;
    END IF;

    v_xp_amount := NEW.correct;

    -- Safety check: Cap XP per attempt if needed (e.g. max 100 questions)
    -- IF v_xp_amount > 100 THEN v_xp_amount := 100; END IF;

    IF v_xp_amount > 0 THEN
        -- A. Increment Global Profile XP
        UPDATE public.profiles
        SET 
            total_xp = COALESCE(total_xp, 0) + v_xp_amount,
            updated_at = NOW()
        WHERE id = NEW.user_id;

        -- B. Handle Seasonal XP
        -- Find active season
        SELECT id INTO v_season_id
        FROM public.leaderboard_seasons
        WHERE is_active = true
          AND start_at <= NOW()
          AND (end_at IS NULL OR end_at >= NOW())
        ORDER BY start_at DESC
        LIMIT 1;

        IF v_season_id IS NOT NULL THEN
            INSERT INTO public.user_xp (user_id, season_id, xp, updated_at)
            VALUES (NEW.user_id, v_season_id, v_xp_amount, NOW())
            ON CONFLICT (user_id, season_id)
            DO UPDATE SET
                xp = user_xp.xp + v_xp_amount,
                updated_at = NOW();
        END IF;

        -- C. Audit Log (xp_events)
        INSERT INTO public.xp_events (user_id, xp_amount, source_type, attempt_id)
        VALUES (NEW.user_id, v_xp_amount, 'attempt_completion', NEW.id);
    END IF;

    -- Mark as awarded in the trigger itself to prevent loops/double execution
    -- We must assign to NEW to update the row that fired the trigger
    NEW.xp_awarded := true;

    RETURN NEW;
END;
$$;

-- 2. Attach Trigger to quiz_attempts
DROP TRIGGER IF EXISTS tr_award_xp_on_completion ON public.quiz_attempts;

CREATE TRIGGER tr_award_xp_on_completion
BEFORE UPDATE ON public.quiz_attempts
FOR EACH ROW
WHEN (
    OLD.xp_awarded IS DISTINCT FROM true AND 
    NEW.correct IS NOT NULL AND
    NEW.correct >= 0
)
EXECUTE FUNCTION public.handle_new_attempt_xp();

-- Note: We use BEFORE UPDATE so we can set NEW.xp_awarded = true in the same transaction 
-- without needing a second UPDATE call.

-- 3. Lock down permissions (Defense in Depth)
-- Revoke direct execution of increment_profile_xp if it exists, forcing use of trigger
-- REVOKE EXECUTE ON FUNCTION public.increment_profile_xp FROM authenticated;
-- (Commented out to avoid breaking other legacy calls if any, but recommended)
