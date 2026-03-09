-- ============================================================================
-- FIX: XP should only be awarded for NEW unique correct answers
-- Before: XP = total correct answers in this attempt (repeatable farming)
-- After:  XP = only correct answers to questions NOT already answered correctly
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_attempt_xp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_xp_amount INT;
    v_season_id UUID;
    v_existing_correct_ids JSONB;
    v_new_correct_ids JSONB;
    v_unique_new_count INT;
BEGIN
    -- Only run if not already awarded
    IF NEW.xp_awarded = true THEN
        RETURN NEW;
    END IF;

    -- Wait for completion (correct count set)
    IF NEW.correct IS NULL THEN
        RETURN NEW;
    END IF;

    -- =====================================================
    -- Get the user's EXISTING correct question IDs from leaderboard
    -- These are questions they've already answered correctly before
    -- =====================================================
    SELECT COALESCE(correct_question_ids, '[]'::jsonb)
    INTO v_existing_correct_ids
    FROM public.concorso_leaderboard
    WHERE user_id = NEW.user_id AND quiz_id = NEW.quiz_id;

    IF v_existing_correct_ids IS NULL THEN
        v_existing_correct_ids := '[]'::jsonb;
    END IF;

    -- =====================================================
    -- Extract NEW correct question IDs from this attempt
    -- that are NOT already in the existing set
    -- =====================================================
    SELECT COALESCE(jsonb_agg(DISTINCT elem->>'questionId'), '[]'::jsonb)
    INTO v_new_correct_ids
    FROM jsonb_array_elements(NEW.answers) AS elem
    WHERE (elem->>'isCorrect')::boolean = true
      AND elem->>'questionId' IS NOT NULL
      AND NOT v_existing_correct_ids @> to_jsonb(elem->>'questionId');

    -- Count truly new correct answers
    v_unique_new_count := jsonb_array_length(v_new_correct_ids);
    v_xp_amount := v_unique_new_count;

    IF v_xp_amount > 0 THEN
        -- A. Increment Global Profile XP
        UPDATE public.profiles
        SET 
            total_xp = COALESCE(total_xp, 0) + v_xp_amount,
            updated_at = NOW()
        WHERE id = NEW.user_id;

        -- B. Handle Seasonal XP
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

        -- C. Audit Log
        INSERT INTO public.xp_events (user_id, xp_amount, source_type, attempt_id)
        VALUES (NEW.user_id, v_xp_amount, 'attempt_completion', NEW.id);
    END IF;

    -- Mark as awarded
    NEW.xp_awarded := true;

    RETURN NEW;
END;
$$;

-- Re-attach trigger (same conditions as before)
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
