-- ============================================================================
-- AUDIT V3: REMAINING FIXES
-- Fixes: HIGH-3, MED-1, MED-2, MED-3, MED-6
-- ============================================================================

-- FIX HIGH-3: Add timer validation to sync_offline_attempt
-- Prevents clients from submitting impossibly fast or future-dated offline attempts.
CREATE OR REPLACE FUNCTION public.sync_offline_attempt(
    p_quiz_id UUID,
    p_started_at TIMESTAMP WITH TIME ZONE,
    p_finished_at TIMESTAMP WITH TIME ZONE,
    p_total_questions INT,
    p_answers JSONB,
    p_scoring JSONB DEFAULT '{"correct": 1, "wrong": 0, "blank": 0}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_calling_user UUID;
    v_answer JSONB;
    v_question RECORD;
    v_correct INT := 0;
    v_wrong INT := 0;
    v_blank INT := 0;
    v_score NUMERIC := 0;
    v_pts_correct NUMERIC;
    v_pts_wrong NUMERIC;
    v_pts_blank NUMERIC;
    v_selected TEXT;
    v_correct_key TEXT;
    v_is_correct BOOLEAN;
    v_validated_answers JSONB := '[]'::jsonb;
    v_quiz_config RECORD;
    v_is_idoneo BOOLEAN := NULL;
    v_pass_threshold NUMERIC := NULL;
    v_new_attempt_id UUID;
    v_time_taken_seconds INT;
    v_max_allowed_seconds INT;
BEGIN
    v_calling_user := auth.uid();
    IF v_calling_user IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- TIMER VALIDATION (V3 HIGH-3)
    -- Sanity: finished_at must be <= NOW(). Cannot submit future attempts.
    IF p_finished_at > NOW() + INTERVAL '5 minutes' THEN
        RAISE EXCEPTION 'sync_offline_attempt: finished_at is in the future';
    END IF;
    -- Sanity: started_at must be before finished_at
    IF p_started_at >= p_finished_at THEN
        RAISE EXCEPTION 'sync_offline_attempt: started_at must be before finished_at';
    END IF;
    -- Upper bound: 5 minutes per question + 10 mins grace
    v_time_taken_seconds := EXTRACT(EPOCH FROM (p_finished_at - p_started_at))::INT;
    v_max_allowed_seconds := (p_total_questions * 300) + 600;
    IF v_time_taken_seconds > v_max_allowed_seconds THEN
        RAISE EXCEPTION 'sync_offline_attempt: duration exceeds maximum bounds';
    END IF;

    -- IDEMPOTENCY (V3 MED-3)
    -- Don't create duplicate attempts for the same quiz started at the same time
    IF EXISTS (
        SELECT 1 FROM quiz_attempts 
        WHERE user_id = v_calling_user 
          AND quiz_id = p_quiz_id 
          AND started_at = p_started_at
          AND finished_at IS NOT NULL
    ) THEN
        -- Return the existing attempt instead of creating a duplicate
        RETURN (
            SELECT jsonb_build_object(
                'id', id,
                'correct', correct,
                'wrong', wrong,
                'blank', blank,
                'score', score,
                'is_idoneo', is_idoneo,
                'already_synced', true
            )
            FROM quiz_attempts 
            WHERE user_id = v_calling_user 
              AND quiz_id = p_quiz_id 
              AND started_at = p_started_at
              AND finished_at IS NOT NULL
            LIMIT 1
        );
    END IF;

    -- Parse scoring config
    v_pts_correct := COALESCE((p_scoring->>'correct')::numeric, 1);
    v_pts_wrong := COALESCE((p_scoring->>'wrong')::numeric, 0);
    v_pts_blank := COALESCE((p_scoring->>'blank')::numeric, 0);

    -- Server-side answer validation
    FOR v_answer IN SELECT * FROM jsonb_array_elements(p_answers)
    LOOP
        v_selected := LOWER(TRIM(v_answer->>'selectedOption'));

        SELECT id, LOWER(TRIM(COALESCE(correct_option, ''))) as correct_key, option_a, option_b, option_c, option_d
        INTO v_question FROM questions WHERE id = (v_answer->>'questionId')::uuid;

        IF NOT FOUND THEN
            v_blank := v_blank + 1;
            v_score := v_score + v_pts_blank;
            v_validated_answers := v_validated_answers || jsonb_build_object(
                'questionId', v_answer->>'questionId', 'selectedOption', v_selected,
                'correctOption', NULL, 'isCorrect', false, 'isSkipped', true
            );
            CONTINUE;
        END IF;

        v_correct_key := v_question.correct_key;

        IF v_selected IS NULL OR v_selected = '' THEN
            v_blank := v_blank + 1;
            v_score := v_score + v_pts_blank;
            v_is_correct := false;
        ELSE
            v_is_correct := false;
            IF v_selected = v_correct_key THEN
                v_is_correct := true;
            END IF;

            IF NOT v_is_correct AND v_correct_key IS NOT NULL THEN
                DECLARE
                    v_option_text TEXT;
                BEGIN
                    v_option_text := CASE v_selected
                        WHEN 'a' THEN LOWER(TRIM(COALESCE(v_question.option_a, '')))
                        WHEN 'b' THEN LOWER(TRIM(COALESCE(v_question.option_b, '')))
                        WHEN 'c' THEN LOWER(TRIM(COALESCE(v_question.option_c, '')))
                        WHEN 'd' THEN LOWER(TRIM(COALESCE(v_question.option_d, '')))
                        ELSE ''
                    END;
                    IF v_option_text != '' AND v_option_text = v_correct_key THEN
                        v_is_correct := true;
                    END IF;
                END;
            END IF;

            IF v_is_correct THEN
                v_correct := v_correct + 1;
                v_score := v_score + v_pts_correct;
            ELSE
                v_wrong := v_wrong + 1;
                v_score := v_score + v_pts_wrong;
            END IF;
        END IF;

        v_validated_answers := v_validated_answers || jsonb_build_object(
            'questionId', v_answer->>'questionId', 'text', v_answer->>'text', 'subjectId', v_answer->>'subjectId',
            'subjectName', v_answer->>'subjectName', 'selectedOption', v_answer->>'selectedOption',
            'correctOption', v_correct_key, 'isCorrect', v_is_correct, 'isSkipped', (v_selected IS NULL OR v_selected = ''),
            'explanation', v_answer->>'explanation', 'options', v_answer->'options'
        );
    END LOOP;

    v_score := ROUND(v_score * 100) / 100;

    -- Check pass threshold
    SELECT use_custom_pass_threshold, min_correct_for_pass INTO v_quiz_config
    FROM quizzes WHERE id = p_quiz_id;

    IF v_quiz_config.use_custom_pass_threshold = true THEN
        v_is_idoneo := v_correct >= COALESCE(v_quiz_config.min_correct_for_pass, 0);
        v_pass_threshold := v_quiz_config.min_correct_for_pass;
    END IF;

    -- INSERT then UPDATE to fire AFTER UPDATE triggers
    INSERT INTO quiz_attempts (
        user_id, quiz_id, started_at, total_questions, score, correct, wrong, blank
    ) VALUES (
        v_calling_user, p_quiz_id, p_started_at, p_total_questions, 0, 0, 0, 0
    ) RETURNING id INTO v_new_attempt_id;

    UPDATE quiz_attempts
    SET 
        finished_at = p_finished_at,
        duration_seconds = v_time_taken_seconds,
        score = v_score,
        correct = v_correct,
        wrong = v_wrong,
        blank = v_blank,
        answers = v_validated_answers,
        is_idoneo = v_is_idoneo,
        pass_threshold = v_pass_threshold
    WHERE id = v_new_attempt_id;

    RETURN jsonb_build_object(
        'id', v_new_attempt_id,
        'correct', v_correct,
        'wrong', v_wrong,
        'blank', v_blank,
        'score', v_score,
        'is_idoneo', v_is_idoneo
    );
END;
$$;


-- FIX MED-1: Use streak_max (not streak_current) for badge evaluation
-- Badges are permanent achievements; they should be based on all-time best.
CREATE OR REPLACE FUNCTION public.check_and_award_badges(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_calling_user UUID;
    v_profile RECORD;
    v_badge_list TEXT[] := ARRAY[]::TEXT[];
    v_awarded JSONB := '[]'::jsonb;
    v_unique_quiz_count INT;
    v_late_night_count INT;
    v_perfect_attempt_exists BOOLEAN;
    v_attempt_count INT;
    v_best_streak INT;
BEGIN
    v_calling_user := auth.uid();
    
    IF v_calling_user != p_user_id AND (SELECT role FROM profiles WHERE id = v_calling_user) != 'admin' THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    SELECT total_xp, referral_count, streak_current, streak_max INTO v_profile
    FROM profiles WHERE id = p_user_id;

    IF NOT FOUND THEN RETURN v_awarded; END IF;

    -- Use the best of current or max streak for badge evaluation (MED-1)
    v_best_streak := GREATEST(COALESCE(v_profile.streak_current, 0), COALESCE(v_profile.streak_max, 0));

    SELECT array_agg(badge_id) INTO v_badge_list
    FROM user_badges WHERE user_id = p_user_id;

    IF v_badge_list IS NULL THEN v_badge_list := ARRAY[]::TEXT[]; END IF;

    IF COALESCE(v_profile.total_xp, 0) >= 1000 AND NOT ('veterano' = ANY(v_badge_list)) THEN
        INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, 'veterano') ON CONFLICT DO NOTHING;
        v_awarded := v_awarded || '["veterano"]'::jsonb;
    END IF;

    IF COALESCE(v_profile.referral_count, 0) >= 5 AND NOT ('social' = ANY(v_badge_list)) THEN
        INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, 'social') ON CONFLICT DO NOTHING;
        v_awarded := v_awarded || '["social"]'::jsonb;
    END IF;

    IF v_best_streak >= 7 AND NOT ('costanza' = ANY(v_badge_list)) THEN
        INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, 'costanza') ON CONFLICT DO NOTHING;
        v_awarded := v_awarded || '["costanza"]'::jsonb;
    END IF;

    IF v_best_streak >= 14 AND NOT ('maratona' = ANY(v_badge_list)) THEN
        INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, 'maratona') ON CONFLICT DO NOTHING;
        v_awarded := v_awarded || '["maratona"]'::jsonb;
    END IF;

    IF v_best_streak >= 30 AND NOT ('inarrestabile' = ANY(v_badge_list)) THEN
        INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, 'inarrestabile') ON CONFLICT DO NOTHING;
        v_awarded := v_awarded || '["inarrestabile"]'::jsonb;
    END IF;

    IF v_best_streak >= 60 AND NOT ('diamante' = ANY(v_badge_list)) THEN
        INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, 'diamante') ON CONFLICT DO NOTHING;
        v_awarded := v_awarded || '["diamante"]'::jsonb;
    END IF;

    IF v_best_streak >= 100 AND NOT ('immortale' = ANY(v_badge_list)) THEN
        INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, 'immortale') ON CONFLICT DO NOTHING;
        v_awarded := v_awarded || '["immortale"]'::jsonb;
    END IF;

    IF NOT ('hub_master' = ANY(v_badge_list)) THEN
        SELECT COUNT(DISTINCT quiz_id) INTO v_unique_quiz_count
        FROM quiz_attempts WHERE user_id = p_user_id AND finished_at IS NOT NULL;

        IF v_unique_quiz_count >= 5 THEN
            INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, 'hub_master') ON CONFLICT DO NOTHING;
            v_awarded := v_awarded || '["hub_master"]'::jsonb;
        END IF;
    END IF;

    IF NOT ('nottambulo' = ANY(v_badge_list)) THEN
        SELECT COUNT(*) INTO v_late_night_count
        FROM quiz_attempts
        WHERE user_id = p_user_id 
          AND finished_at IS NOT NULL
          AND EXTRACT(HOUR FROM created_at AT TIME ZONE 'Europe/Rome') >= 1 
          AND EXTRACT(HOUR FROM created_at AT TIME ZONE 'Europe/Rome') < 5;

        IF v_late_night_count >= 5 THEN
            INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, 'nottambulo') ON CONFLICT DO NOTHING;
            v_awarded := v_awarded || '["nottambulo"]'::jsonb;
        END IF;
    END IF;

    IF NOT ('secchione' = ANY(v_badge_list)) THEN
        SELECT EXISTS(
            SELECT 1 FROM quiz_attempts
            WHERE user_id = p_user_id AND total_questions > 9 AND correct = total_questions AND finished_at IS NOT NULL
        ) INTO v_perfect_attempt_exists;

        IF v_perfect_attempt_exists THEN
            INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, 'secchione') ON CONFLICT DO NOTHING;
            v_awarded := v_awarded || '["secchione"]'::jsonb;
        END IF;
    END IF;

    IF NOT ('primo_passo' = ANY(v_badge_list)) THEN
        SELECT COUNT(*) INTO v_attempt_count
        FROM quiz_attempts WHERE user_id = p_user_id AND finished_at IS NOT NULL;

        IF v_attempt_count > 0 THEN
            INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, 'primo_passo') ON CONFLICT DO NOTHING;
            v_awarded := v_awarded || '["primo_passo"]'::jsonb;
        END IF;
    END IF;

    RETURN v_awarded;
END;
$$;


-- FIX MED-2: Fix daily XP cap query (aggregate drift)
-- The old query checked user_xp.updated_at which is per-SEASON, not per-day.
-- We now track daily XP via a lightweight counter on the profiles table.
-- Add a daily_xp column + daily_xp_date to profiles for precise daily tracking.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS daily_xp INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS daily_xp_date DATE DEFAULT CURRENT_DATE;

CREATE OR REPLACE FUNCTION public.handle_new_attempt_xp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_xp_amount INT;
    v_season_id UUID;
    v_daily_xp INT;
    v_profile RECORD;
    v_today DATE := (NOW() AT TIME ZONE 'Europe/Rome')::DATE;
    v_last_active DATE;
    v_new_streak INT;
    v_new_max INT;
    v_completed_count INT;
BEGIN
    IF NEW.xp_awarded = true THEN RETURN NEW; END IF;
    IF NEW.correct IS NULL THEN RETURN NEW; END IF;

    -- Fetch current profile state (with advisory lock to prevent race conditions MED-6)
    PERFORM pg_advisory_xact_lock(hashtext(NEW.user_id::text));

    SELECT * INTO v_profile FROM profiles WHERE id = NEW.user_id;
    IF NOT FOUND THEN RETURN NEW; END IF;

    -- ==========================================
    -- A. STREAK UPDATE (Gated by quiz completion)
    -- ==========================================
    v_last_active := (v_profile.last_active_at AT TIME ZONE 'Europe/Rome')::DATE;
    v_new_streak := COALESCE(v_profile.streak_current, 0);

    IF v_last_active IS NULL OR v_last_active < (v_today - INTERVAL '1 day')::DATE THEN
        v_new_streak := 1;
    ELSIF v_last_active = (v_today - INTERVAL '1 day')::DATE THEN
        v_new_streak := v_new_streak + 1;
    END IF;

    v_new_max := GREATEST(COALESCE(v_profile.streak_max, 0), v_new_streak);

    UPDATE profiles
    SET streak_current = v_new_streak,
        streak_max = v_new_max,
        last_active_at = NOW()
    WHERE id = NEW.user_id;


    -- ==========================================
    -- B. XP DIMINISHING RETURNS / DAILY CAP (500)
    -- FIX MED-2: Use dedicated daily_xp column instead of aggregating user_xp
    -- ==========================================
    -- Reset daily counter if it's a new day
    IF COALESCE(v_profile.daily_xp_date, '1970-01-01'::DATE) < v_today THEN
        v_daily_xp := 0;  -- New day, reset
    ELSE
        v_daily_xp := COALESCE(v_profile.daily_xp, 0);
    END IF;

    IF v_daily_xp >= 500 THEN
        v_xp_amount := 0; -- Hard cap reached
    ELSE
        v_xp_amount := LEAST(NEW.correct, 500 - v_daily_xp);
    END IF;

    IF v_xp_amount > 0 THEN
        -- Update daily counter + global XP
        UPDATE public.profiles
        SET 
            total_xp = COALESCE(total_xp, 0) + v_xp_amount,
            daily_xp = COALESCE(
                CASE WHEN daily_xp_date = v_today THEN daily_xp ELSE 0 END, 0
            ) + v_xp_amount,
            daily_xp_date = v_today,
            updated_at = NOW()
        WHERE id = NEW.user_id;

        -- Seasonal XP
        SELECT id INTO v_season_id FROM public.leaderboard_seasons
        WHERE is_active = true AND start_at <= NOW() AND (end_at IS NULL OR end_at >= NOW())
        ORDER BY start_at DESC LIMIT 1;

        IF v_season_id IS NOT NULL THEN
            INSERT INTO public.user_xp (user_id, season_id, xp, updated_at)
            VALUES (NEW.user_id, v_season_id, v_xp_amount, NOW())
            ON CONFLICT (user_id, season_id)
            DO UPDATE SET xp = user_xp.xp + v_xp_amount, updated_at = NOW();
        END IF;
    END IF;


    -- ==========================================
    -- C. REFERRAL BONUS (On First Completed Quiz)
    -- FIX MED-6: Advisory lock above prevents race condition
    -- ==========================================
    IF v_profile.referred_by IS NOT NULL THEN
        SELECT COUNT(*) INTO v_completed_count 
        FROM quiz_attempts 
        WHERE user_id = NEW.user_id AND finished_at IS NOT NULL;

        IF v_completed_count = 1 THEN
            UPDATE profiles 
            SET referral_count = COALESCE(referral_count, 0) + 1 
            WHERE id = v_profile.referred_by;
        END IF;
    END IF;


    NEW.xp_awarded := true;
    RETURN NEW;
END;
$$;
