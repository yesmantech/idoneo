-- =============================================================================
-- UNIFY LEADERBOARD SCORE WITH PREPARATION ALGORITHM
-- 
-- Changes the `score` formula from cumulative coverage:
--   score = (unique_correct / total_questions) × 100
-- To the preparation algorithm:
--   score = (Volume×33% + Coverage×33% + Reliability×33%) × (Accuracy / 100)
-- =============================================================================

-- 1. Update the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_attempt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    _quiz_id UUID;
    _user_id UUID;
    _answer JSONB;
    _question_id TEXT;
    _is_correct BOOLEAN;
    
    -- Correct answers tracking
    _current_correct_ids JSONB := '[]'::jsonb;
    _new_correct_ids JSONB := '[]'::jsonb;
    _final_correct_ids JSONB;
    _correct_count INTEGER;
    
    -- Seen questions tracking
    _current_seen_ids JSONB := '[]'::jsonb;
    _new_seen_ids JSONB := '[]'::jsonb;
    _final_seen_ids JSONB;
    _seen_count INTEGER;
    
    -- Recent accuracies tracking (for reliability)
    _current_recent_accs JSONB := '[]'::jsonb;
    _attempt_accuracy NUMERIC;
    _updated_recent_accs JSONB;
    
    -- Score calculations
    _total_quiz_questions INTEGER;
    _new_score NUMERIC;
    _new_volume NUMERIC;
    _new_coverage NUMERIC;
    _new_reliability NUMERIC;
    _attempt_correct_count INTEGER;
    _attempt_total_count INTEGER;
    _current_total_answered INTEGER := 0;
    
    -- Reliability calculation helpers
    _acc_mean NUMERIC;
    _acc_stddev NUMERIC;
    _acc_count INTEGER;
    _weighted_accuracy NUMERIC := 0;
BEGIN
    _quiz_id := NEW.quiz_id;
    _user_id := NEW.user_id;

    -- FETCH CURRENT STATE
    SELECT 
        COALESCE(correct_question_ids, '[]'::jsonb),
        COALESCE(seen_question_ids, '[]'::jsonb),
        COALESCE(recent_accuracies, '[]'::jsonb),
        COALESCE(total_questions_answered, 0)
    INTO _current_correct_ids, _current_seen_ids, _current_recent_accs, _current_total_answered
    FROM public.concorso_leaderboard
    WHERE user_id = _user_id AND quiz_id = _quiz_id;

    IF _current_correct_ids IS NULL THEN _current_correct_ids := '[]'::jsonb; END IF;
    IF _current_seen_ids IS NULL THEN _current_seen_ids := '[]'::jsonb; END IF;
    IF _current_recent_accs IS NULL THEN _current_recent_accs := '[]'::jsonb; END IF;

    -- EXTRACT DATA FROM THIS ATTEMPT
    
    -- Correct answer IDs
    SELECT jsonb_agg(DISTINCT elem->>'questionId')
    INTO _new_correct_ids
    FROM jsonb_array_elements(NEW.answers) AS elem
    WHERE (elem->>'isCorrect')::boolean = true;
    IF _new_correct_ids IS NULL THEN _new_correct_ids := '[]'::jsonb; END IF;

    -- ALL question IDs answered (for seen tracking)
    SELECT jsonb_agg(DISTINCT elem->>'questionId')
    INTO _new_seen_ids
    FROM jsonb_array_elements(NEW.answers) AS elem
    WHERE elem->>'questionId' IS NOT NULL;
    IF _new_seen_ids IS NULL THEN _new_seen_ids := '[]'::jsonb; END IF;

    -- Count correct in this attempt
    SELECT COUNT(*) INTO _attempt_correct_count
    FROM jsonb_array_elements(NEW.answers) AS elem
    WHERE (elem->>'isCorrect')::boolean = true;

    _attempt_total_count := COALESCE(jsonb_array_length(NEW.answers), 0);

    IF _attempt_total_count > 0 THEN
        _attempt_accuracy := ROUND((_attempt_correct_count::numeric / _attempt_total_count::numeric) * 100, 2);
    ELSE
        _attempt_accuracy := 0;
    END IF;

    -- MERGE SETS
    
    -- Merge correct IDs (set union)
    SELECT jsonb_agg(DISTINCT x)
    INTO _final_correct_ids
    FROM (
        SELECT jsonb_array_elements_text(_current_correct_ids) as x
        UNION
        SELECT jsonb_array_elements_text(_new_correct_ids) as x
    ) t;
    IF _final_correct_ids IS NULL THEN _final_correct_ids := '[]'::jsonb; END IF;
    _correct_count := jsonb_array_length(_final_correct_ids);

    -- Merge seen IDs (set union)
    SELECT jsonb_agg(DISTINCT x)
    INTO _final_seen_ids
    FROM (
        SELECT jsonb_array_elements_text(_current_seen_ids) as x
        UNION
        SELECT jsonb_array_elements_text(_new_seen_ids) as x
    ) t;
    IF _final_seen_ids IS NULL THEN _final_seen_ids := '[]'::jsonb; END IF;
    _seen_count := jsonb_array_length(_final_seen_ids);

    -- Update recent accuracies (keep last 10)
    _updated_recent_accs := _current_recent_accs || jsonb_build_array(_attempt_accuracy);
    IF jsonb_array_length(_updated_recent_accs) > 10 THEN
        SELECT jsonb_agg(sub.val ORDER BY sub.ord)
        INTO _updated_recent_accs
        FROM (
            SELECT val, ord
            FROM jsonb_array_elements(_updated_recent_accs) WITH ORDINALITY AS t(val, ord)
            ORDER BY ord DESC
            LIMIT 10
        ) sub;
    END IF;

    -- WEIGHTED ACCURACY (more recent = more weight)
    SELECT COALESCE(ROUND(SUM(v::numeric * rn) / NULLIF(SUM(rn), 0), 2), 0)
    INTO _weighted_accuracy
    FROM (
        SELECT t.val::text::numeric AS v, ROW_NUMBER() OVER () AS rn
        FROM jsonb_array_elements(_updated_recent_accs) AS t(val)
    ) sub;

    -- CALCULATE SCORES
    
    SELECT count(*) INTO _total_quiz_questions
    FROM public.questions WHERE quiz_id = _quiz_id;
    IF _total_quiz_questions IS NULL OR _total_quiz_questions = 0 THEN
        _total_quiz_questions := 1;
    END IF;

    -- Volume (0-1)
    _new_volume := LEAST((_current_total_answered + _attempt_total_count)::numeric / _total_quiz_questions::numeric, 1.0);

    -- Coverage = unique CORRECT / total bank (0-1)
    _new_coverage := LEAST(_correct_count::numeric / _total_quiz_questions::numeric, 1.0);

    -- Reliability (0-1)
    _acc_count := jsonb_array_length(_updated_recent_accs);
    IF _acc_count >= 2 THEN
        SELECT AVG(val::numeric), COALESCE(STDDEV(val::numeric), 0)
        INTO _acc_mean, _acc_stddev
        FROM jsonb_array_elements_text(_updated_recent_accs) AS val;

        _new_reliability := GREATEST(0, LEAST(1.0, 1.0 - (_acc_stddev / 40.0)));

        IF _acc_count < 3 THEN
            _new_reliability := _new_reliability * (_acc_count::numeric / 3.0);
        END IF;
    ELSE
        _new_reliability := 0;
    END IF;

    -- UNIFIED SCORE = (Volume×33% + Coverage×33% + Reliability×33%) × Accuracy
    _new_score := ROUND(
        (_new_volume * 33.33 + _new_coverage * 33.33 + _new_reliability * 33.33)
        * (_weighted_accuracy / 100.0),
        1
    );
    IF _new_score > 100 THEN _new_score := 100; END IF;

    -- UPSERT INTO LEADERBOARD
    INSERT INTO public.concorso_leaderboard (
        user_id, quiz_id, score,
        correct_question_ids, seen_question_ids,
        total_questions_answered, total_correct_answers,
        accuracy_weighted, volume_factor, coverage_score, reliability,
        recent_accuracies,
        last_calculated_at
    )
    VALUES (
        _user_id, _quiz_id, _new_score,
        _final_correct_ids, _final_seen_ids,
        _attempt_total_count, _attempt_correct_count,
        _attempt_accuracy,
        _new_volume, _new_coverage, _new_reliability,
        _updated_recent_accs,
        NOW()
    )
    ON CONFLICT (user_id, quiz_id)
    DO UPDATE SET
        score = EXCLUDED.score,
        correct_question_ids = EXCLUDED.correct_question_ids,
        seen_question_ids = EXCLUDED.seen_question_ids,
        total_questions_answered = concorso_leaderboard.total_questions_answered + EXCLUDED.total_questions_answered,
        total_correct_answers = concorso_leaderboard.total_correct_answers + EXCLUDED.total_correct_answers,
        accuracy_weighted = _weighted_accuracy,
        volume_factor = EXCLUDED.volume_factor,
        coverage_score = EXCLUDED.coverage_score,
        reliability = EXCLUDED.reliability,
        recent_accuracies = EXCLUDED.recent_accuracies,
        last_calculated_at = NOW();

    -- UPDATE QUESTION STATS
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

-- 2. Recalculate ALL existing scores using the unified formula
UPDATE public.concorso_leaderboard
SET score = ROUND(
    (COALESCE(volume_factor, 0) * 33.33 
     + COALESCE(coverage_score, 0) * 33.33 
     + COALESCE(reliability, 0) * 33.33)
    * (COALESCE(accuracy_weighted, 0) / 100.0),
    1
);
