-- ============================================================================
-- AUDIT V2: PHASE 4 APP LOGIC & UX
-- Fixes: MED-3 (Timer bypass)
-- ============================================================================

-- FIX MED-3: Add Timer validation to the RPC.
-- We rebuild the function to include start/end time validation.
-- If the duration exceeds total_questions * 3 minutes (a generous upper bound for a paused timer exploit), 
-- or if the finished_at time is vastly different from NOW(), we can flag it.
-- For now, we enforce that finished_at is server-side NOW() and we calculate time taken.

CREATE OR REPLACE FUNCTION public.finish_quiz_attempt(
    p_attempt_id UUID,
    p_answers JSONB,
    p_scoring JSONB DEFAULT '{"correct": 1, "wrong": 0, "blank": 0}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_attempt RECORD;
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
    v_calling_user UUID;
    v_time_taken_seconds INT;
    v_max_allowed_seconds INT;
BEGIN
    v_calling_user := auth.uid();
    IF v_calling_user IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT * INTO v_attempt
    FROM quiz_attempts
    WHERE id = p_attempt_id
    FOR UPDATE SKIP LOCKED;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Attempt not found or already being processed';
    END IF;

    IF v_attempt.user_id != v_calling_user THEN
        RAISE EXCEPTION 'Unauthorized: attempt belongs to another user';
    END IF;

    IF v_attempt.finished_at IS NOT NULL THEN
        RETURN jsonb_build_object(
            'correct', v_attempt.correct,
            'wrong', v_attempt.wrong,
            'blank', v_attempt.blank,
            'score', v_attempt.score,
            'is_idoneo', v_attempt.is_idoneo,
            'already_finished', true
        );
    END IF;

    -- TIMER VALIDATION (MED-3)
    -- Calculate seconds between started_at and NOW()
    v_time_taken_seconds := EXTRACT(EPOCH FROM (NOW() - v_attempt.started_at))::INT;
    
    -- Absolute upper bound: 5 minutes per question + 10 mins grace period
    v_max_allowed_seconds := (v_attempt.total_questions * 300) + 600;

    -- If the user took an impossible amount of time (e.g. paused the timer for days)
    IF v_time_taken_seconds > v_max_allowed_seconds THEN
        RAISE EXCEPTION 'Quiz time limit exceeded maximum bounds (Exploit detected). Started at: %', v_attempt.started_at;
    END IF;

    v_pts_correct := COALESCE((p_scoring->>'correct')::numeric, 1);
    v_pts_wrong := COALESCE((p_scoring->>'wrong')::numeric, 0);
    v_pts_blank := COALESCE((p_scoring->>'blank')::numeric, 0);

    FOR v_answer IN SELECT * FROM jsonb_array_elements(p_answers)
    LOOP
        v_selected := LOWER(TRIM(v_answer->>'selectedOption'));

        SELECT
            id,
            LOWER(TRIM(COALESCE(correct_option, ''))) as correct_key,
            option_a, option_b, option_c, option_d
        INTO v_question
        FROM questions
        WHERE id = (v_answer->>'questionId')::uuid;

        IF NOT FOUND THEN
            v_blank := v_blank + 1;
            v_score := v_score + v_pts_blank;

            v_validated_answers := v_validated_answers || jsonb_build_object(
                'questionId', v_answer->>'questionId',
                'selectedOption', v_selected,
                'correctOption', NULL,
                'isCorrect', false,
                'isSkipped', true
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
            'questionId', v_answer->>'questionId',
            'text', v_answer->>'text',
            'subjectId', v_answer->>'subjectId',
            'subjectName', v_answer->>'subjectName',
            'selectedOption', v_answer->>'selectedOption',
            'correctOption', v_correct_key,
            'isCorrect', v_is_correct,
            'isSkipped', (v_selected IS NULL OR v_selected = ''),
            'explanation', v_answer->>'explanation',
            'options', v_answer->'options'
        );
    END LOOP;

    v_score := ROUND(v_score * 100) / 100;

    SELECT use_custom_pass_threshold, min_correct_for_pass
    INTO v_quiz_config
    FROM quizzes
    WHERE id = v_attempt.quiz_id;

    IF v_quiz_config.use_custom_pass_threshold = true THEN
        v_is_idoneo := v_correct >= COALESCE(v_quiz_config.min_correct_for_pass, 0);
    END IF;

    UPDATE quiz_attempts
    SET
        finished_at = NOW(),
        duration_seconds = v_time_taken_seconds,
        score = v_score,
        correct = v_correct,
        wrong = v_wrong,
        blank = v_blank,
        answers = v_validated_answers,
        is_idoneo = v_is_idoneo,
        pass_threshold = CASE
            WHEN v_quiz_config.use_custom_pass_threshold = true
            THEN v_quiz_config.min_correct_for_pass
            ELSE NULL
        END
    WHERE id = p_attempt_id;

    RETURN jsonb_build_object(
        'correct', v_correct,
        'wrong', v_wrong,
        'blank', v_blank,
        'score', v_score,
        'is_idoneo', v_is_idoneo,
        'already_finished', false
    );
END;
$$;
