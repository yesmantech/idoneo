-- ============================================================================
-- AUDIT V2: PHASE 1 SECURITY FIXES
-- Fixes: CRIT-1, CRIT-2, HIGH-4, LOW-4
-- ============================================================================

-- 1. FIX CRIT-2: Change leaderboard trigger to AFTER UPDATE only
-- (We also add a condition to ensure it only runs when an attempt gets finished)
DROP TRIGGER IF EXISTS on_new_attempt_score ON public.quiz_attempts;

CREATE TRIGGER on_new_attempt_score
AFTER UPDATE ON public.quiz_attempts
FOR EACH ROW
WHEN (NEW.finished_at IS NOT NULL AND (OLD.finished_at IS NULL OR OLD.finished_at IS DISTINCT FROM NEW.finished_at))
EXECUTE FUNCTION public.handle_new_attempt();


-- 2. FIX CRIT-1: Secure Quiz Attempts Insert
-- Prevent users from inserting pre-scored attempts to bypass RPC validation
DROP POLICY IF EXISTS "Users can insert own attempts" ON public.quiz_attempts;

CREATE POLICY "Users can insert own attempts" 
ON public.quiz_attempts 
FOR INSERT 
WITH CHECK (
    auth.uid() = user_id 
    AND finished_at IS NULL 
    AND score = 0 
    AND correct = 0
);


-- 3. FIX LOW-4: Rate Limit/Deduplicate Question Reports
-- Prevent users from spamming reports for the same question
ALTER TABLE public.question_reports
ADD CONSTRAINT unique_user_question_report UNIQUE (user_id, question_id);


-- 4. FIX CRIT-1 (Part B): Create Offline Sync RPC
-- Replicates finish_quiz_attempt validation but allows specifying historical timestamps
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
BEGIN
    v_calling_user := auth.uid();
    IF v_calling_user IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
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

    -- INSERT Attempt
    -- We do NOT trigger the AFTER UPDATE leaderboard trigger directly here, 
    -- but we DO need to update the leaderboard. Wait!
    -- If the leaderboard trigger is ONLY on AFTER UPDATE, an INSERT won't trigger it!
    -- This means we should insert as unfinished, then immediately update it to finished.
    -- This cleanly fires all existing triggers (like handle_new_attempt_xp and leaderboard).

    INSERT INTO quiz_attempts (
        user_id, quiz_id, started_at, total_questions, score, correct, wrong, blank
    ) VALUES (
        v_calling_user, p_quiz_id, p_started_at, p_total_questions, 0, 0, 0, 0
    ) RETURNING id INTO v_new_attempt_id;

    UPDATE quiz_attempts
    SET 
        finished_at = p_finished_at,
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

GRANT EXECUTE ON FUNCTION public.sync_offline_attempt(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, INT, JSONB, JSONB) TO authenticated;


-- 5. FIX HIGH-4: check_and_award_badges Postgres RPC
-- Replaces 6 sequential API calls with 1 fast DB function
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
BEGIN
    v_calling_user := auth.uid();
    
    -- Let admins trigger it for users, else only self
    IF v_calling_user != p_user_id AND (SELECT role FROM profiles WHERE id = v_calling_user) != 'admin' THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Fetch Profile
    SELECT total_xp, referral_count, streak_current INTO v_profile
    FROM profiles WHERE id = p_user_id;

    IF NOT FOUND THEN RETURN v_awarded; END IF;

    -- Fetch Existing Badges
    SELECT array_agg(badge_id) INTO v_badge_list
    FROM user_badges WHERE user_id = p_user_id;

    IF v_badge_list IS NULL THEN v_badge_list := ARRAY[]::TEXT[]; END IF;

    -- Check and Award
    IF COALESCE(v_profile.total_xp, 0) >= 1000 AND NOT ('veterano' = ANY(v_badge_list)) THEN
        INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, 'veterano') ON CONFLICT DO NOTHING;
        v_awarded := v_awarded || '["veterano"]'::jsonb;
    END IF;

    IF COALESCE(v_profile.referral_count, 0) >= 5 AND NOT ('social' = ANY(v_badge_list)) THEN
        INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, 'social') ON CONFLICT DO NOTHING;
        v_awarded := v_awarded || '["social"]'::jsonb;
    END IF;

    IF COALESCE(v_profile.streak_current, 0) >= 7 AND NOT ('costanza' = ANY(v_badge_list)) THEN
        INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, 'costanza') ON CONFLICT DO NOTHING;
        v_awarded := v_awarded || '["costanza"]'::jsonb;
    END IF;

    IF COALESCE(v_profile.streak_current, 0) >= 14 AND NOT ('maratona' = ANY(v_badge_list)) THEN
        INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, 'maratona') ON CONFLICT DO NOTHING;
        v_awarded := v_awarded || '["maratona"]'::jsonb;
    END IF;

    IF COALESCE(v_profile.streak_current, 0) >= 30 AND NOT ('inarrestabile' = ANY(v_badge_list)) THEN
        INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, 'inarrestabile') ON CONFLICT DO NOTHING;
        v_awarded := v_awarded || '["inarrestabile"]'::jsonb;
    END IF;

    IF COALESCE(v_profile.streak_current, 0) >= 60 AND NOT ('diamante' = ANY(v_badge_list)) THEN
        INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, 'diamante') ON CONFLICT DO NOTHING;
        v_awarded := v_awarded || '["diamante"]'::jsonb;
    END IF;

    IF COALESCE(v_profile.streak_current, 0) >= 100 AND NOT ('immortale' = ANY(v_badge_list)) THEN
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

GRANT EXECUTE ON FUNCTION public.check_and_award_badges(UUID) TO authenticated;
