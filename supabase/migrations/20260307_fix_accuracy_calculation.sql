-- Migration: Fix accuracy calculation in leaderboard
-- accuracy_weighted should be total_correct_answers / total_questions_answered
-- Currently it incorrectly uses unique_correct/total_bank (which is coverage)

-- 1. Add missing columns if they don't exist
ALTER TABLE public.concorso_leaderboard 
ADD COLUMN IF NOT EXISTS correct_question_ids JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS total_questions_answered INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_correct_answers INTEGER DEFAULT 0;

COMMENT ON COLUMN concorso_leaderboard.total_correct_answers IS 'Cumulative count of correct answers across all attempts';

-- 2. Reset accuracy_weighted to 0 since we can't backfill without historical data
-- It will be correctly recalculated from new attempts going forward
UPDATE public.concorso_leaderboard
SET accuracy_weighted = 0,
    total_correct_answers = 0
WHERE total_correct_answers = 0 OR total_correct_answers IS NULL;

-- 3. Redefine the trigger function with correct accuracy calculation
CREATE OR REPLACE FUNCTION public.handle_new_attempt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    -- Variables for processing
    _quiz_id UUID;
    _user_id UUID;
    _answer JSONB;
    _question_id TEXT;
    _is_correct BOOLEAN;
    
    -- State variables for leaderboard
    _current_correct_ids JSONB := '[]'::jsonb;
    _new_correct_ids JSONB := '[]'::jsonb;
    _final_correct_ids JSONB;
    _correct_count INTEGER;
    _total_quiz_questions INTEGER;
    _new_score NUMERIC;
    _new_volume NUMERIC;
    _attempt_correct_count INTEGER;
BEGIN
    -- Get context from the new row
    _quiz_id := NEW.quiz_id;
    _user_id := NEW.user_id;

    -- =====================================================
    -- PART A: UPDATE LEADERBOARD
    -- =====================================================
    
    -- 1. Fetch current state from leaderboard (or initialize if not exists)
    SELECT correct_question_ids INTO _current_correct_ids
    FROM public.concorso_leaderboard
    WHERE user_id = _user_id AND quiz_id = _quiz_id;

    IF _current_correct_ids IS NULL THEN
        _current_correct_ids := '[]'::jsonb;
    END IF;

    -- 2. Extract NEW correct answers from the request
    SELECT jsonb_agg(DISTINCT elem->>'questionId')
    INTO _new_correct_ids
    FROM jsonb_array_elements(NEW.answers) AS elem
    WHERE (elem->>'isCorrect')::boolean = true;

    IF _new_correct_ids IS NULL THEN
        _new_correct_ids := '[]'::jsonb;
    END IF;

    -- 2b. Count correct answers in THIS attempt
    SELECT COUNT(*)
    INTO _attempt_correct_count
    FROM jsonb_array_elements(NEW.answers) AS elem
    WHERE (elem->>'isCorrect')::boolean = true;

    -- 3. Merge Arrays (Set Union equivalent)
    SELECT jsonb_agg(DISTINCT x)
    INTO _final_correct_ids
    FROM (
        SELECT jsonb_array_elements_text(_current_correct_ids) as x
        UNION
        SELECT jsonb_array_elements_text(_new_correct_ids) as x
    ) t;

    IF _final_correct_ids IS NULL THEN
        _final_correct_ids := '[]'::jsonb;
    END IF;

    _correct_count := jsonb_array_length(_final_correct_ids);

    -- 4. Get Total Questions Count for this Quiz
    SELECT count(*) INTO _total_quiz_questions
    FROM public.questions
    WHERE quiz_id = _quiz_id;

    IF _total_quiz_questions IS NULL OR _total_quiz_questions = 0 THEN
        _total_quiz_questions := 1;
    END IF;

    -- 5. Calculate Scores
    -- Score = coverage (unique correct / total bank)
    _new_score := ROUND((_correct_count::numeric / _total_quiz_questions::numeric) * 100, 1);
    IF _new_score > 100 THEN _new_score := 100; END IF;

    _new_volume := LEAST(_correct_count::numeric / _total_quiz_questions::numeric, 1.0);

    -- 6. Upsert into Leaderboard
    INSERT INTO public.concorso_leaderboard (
        user_id, 
        quiz_id, 
        score,
        correct_question_ids,
        total_questions_answered,
        total_correct_answers,
        accuracy_weighted,
        volume_factor,
        last_calculated_at
    )
    VALUES (
        _user_id,
        _quiz_id,
        _new_score,
        _final_correct_ids,
        COALESCE(jsonb_array_length(NEW.answers), 0),
        _attempt_correct_count,
        -- For new row: accuracy = correct_this_attempt / total_this_attempt * 100
        CASE WHEN COALESCE(jsonb_array_length(NEW.answers), 0) > 0
            THEN ROUND((_attempt_correct_count::numeric / jsonb_array_length(NEW.answers)::numeric) * 100, 2)
            ELSE 0
        END,
        _new_volume,
        NOW()
    )
    ON CONFLICT (user_id, quiz_id)
    DO UPDATE SET
        score = EXCLUDED.score,
        correct_question_ids = EXCLUDED.correct_question_ids,
        total_questions_answered = concorso_leaderboard.total_questions_answered + EXCLUDED.total_questions_answered,
        total_correct_answers = concorso_leaderboard.total_correct_answers + EXCLUDED.total_correct_answers,
        -- Accuracy = cumulative correct / cumulative total * 100
        accuracy_weighted = CASE 
            WHEN (concorso_leaderboard.total_questions_answered + EXCLUDED.total_questions_answered) > 0
            THEN ROUND(
                ((concorso_leaderboard.total_correct_answers + EXCLUDED.total_correct_answers)::numeric / 
                 (concorso_leaderboard.total_questions_answered + EXCLUDED.total_questions_answered)::numeric) * 100, 2)
            ELSE 0
        END,
        volume_factor = EXCLUDED.volume_factor,
        last_calculated_at = NOW();

    -- =====================================================
    -- PART B: UPDATE QUESTION STATS
    -- =====================================================
    
    FOR _answer IN SELECT * FROM jsonb_array_elements(NEW.answers)
    LOOP
        _question_id := _answer->>'questionId';
        _is_correct := COALESCE((_answer->>'isCorrect')::boolean, false);
        
        IF _question_id IS NOT NULL THEN
            INSERT INTO public.question_stats (question_id, times_answered, times_correct, updated_at)
            VALUES (_question_id::uuid, 1, CASE WHEN _is_correct THEN 1 ELSE 0 END, NOW())
            ON CONFLICT (question_id)
            DO UPDATE SET
                times_answered = question_stats.times_answered + 1,
                times_correct = question_stats.times_correct + (CASE WHEN _is_correct THEN 1 ELSE 0 END),
                updated_at = NOW();
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$;
