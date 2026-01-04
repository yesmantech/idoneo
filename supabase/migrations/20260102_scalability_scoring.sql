-- Migration: scalability_refactor_scoring
-- Description: Moves scoring logic from client-side to server-side using incremental updates.

-- 1. Add new columns to concorso_leaderboard to store state
ALTER TABLE public.concorso_leaderboard 
ADD COLUMN IF NOT EXISTS correct_question_ids JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS total_questions_answered INTEGER DEFAULT 0;

-- 2. Create the Trigger Function
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
    
    -- State variables
    _current_correct_ids JSONB := '[]'::jsonb;
    _new_correct_ids JSONB := '[]'::jsonb;
    _final_correct_ids JSONB;
    _correct_count INTEGER;
    _total_quiz_questions INTEGER;
    _new_score NUMERIC;
    _new_volume NUMERIC;
    _new_accuracy NUMERIC;
BEGIN
    -- Get context from the new row
    _quiz_id := NEW.quiz_id;
    _user_id := NEW.user_id;

    -- 1. Fetch current state from leaderboard (or initialize if not exists)
    SELECT correct_question_ids INTO _current_correct_ids
    FROM public.concorso_leaderboard
    WHERE user_id = _user_id AND quiz_id = _quiz_id;

    IF _current_correct_ids IS NULL THEN
        _current_correct_ids := '[]'::jsonb;
    END IF;

    -- 2. Extract NEW correct answers from the request
    -- NEW.answers is expected to be a JSONB array of objects: { questionId: "...", isCorrect: true, ... }
    
    -- We'll loop through the answers and collect IDs of correct ones
    SELECT jsonb_agg(DISTINCT elem->>'questionId')
    INTO _new_correct_ids
    FROM jsonb_array_elements(NEW.answers) AS elem
    WHERE (elem->>'isCorrect')::boolean = true;

    IF _new_correct_ids IS NULL THEN
        _new_correct_ids := '[]'::jsonb;
    END IF;

    -- 3. Merge Arrays (Set Union equivalent) using SQL magic
    -- This combines current and new, deduping them
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

    -- 4. Get Total Questions Count for this Quiz (to calculate percentage)
    -- We use a precise count or a fallback. 
    -- Ideally 'questions' table count. If 0, avoid div by zero.
    SELECT count(*) INTO _total_quiz_questions
    FROM public.questions
    WHERE quiz_id = _quiz_id;

    IF _total_quiz_questions IS NULL OR _total_quiz_questions = 0 THEN
        _total_quiz_questions := 1; -- Avoid division by zero, though this means score is irrelevant
    END IF;

    -- 5. Calculate New Scores
    -- Score is simple percentage: (Correct Unique / Total Questions) * 100
    _new_score := ROUND((_correct_count::numeric / _total_quiz_questions::numeric) * 100, 1);
    
    -- Cap at 100
    IF _new_score > 100 THEN _new_score := 100; END IF;

    _new_volume := LEAST(_correct_count::numeric / _total_quiz_questions::numeric, 1.0);
    _new_accuracy := _new_score; -- Mapping accuracy to score for now

    -- 6. Upsert into Leaderboard
    INSERT INTO public.concorso_leaderboard (
        user_id, 
        quiz_id, 
        score,
        correct_question_ids,
        total_questions_answered,
        accuracy_weighted,
        volume_factor,
        last_calculated_at
    )
    VALUES (
        _user_id,
        _quiz_id,
        _new_score,
        _final_correct_ids,
        (COALESCE(jsonb_array_length(NEW.answers), 0)), -- This is just delta for this attempt, logic for total total is trickier without a read, but we can just increment.
        -- Actually, optimizing: let's do an UPSERT with increment for total_questions_answered
        _new_accuracy,
        _new_volume,
        NOW()
    )
    ON CONFLICT (user_id, quiz_id)
    DO UPDATE SET
        score = EXCLUDED.score,
        correct_question_ids = EXCLUDED.correct_question_ids,
        total_questions_answered = concorso_leaderboard.total_questions_answered + EXCLUDED.total_questions_answered,
        accuracy_weighted = EXCLUDED.accuracy_weighted,
        volume_factor = EXCLUDED.volume_factor,
        last_calculated_at = NOW();

    RETURN NEW;
END;
$$;

-- 3. Attach Trigger to Quiz Attempts
DROP TRIGGER IF EXISTS on_new_attempt_score ON public.quiz_attempts;

CREATE TRIGGER on_new_attempt_score
AFTER INSERT OR UPDATE ON public.quiz_attempts
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_attempt();
