-- ============================================================================
-- AUDIT V7: FULL FIX MIGRATION
-- Fixes: V7-FUNC-1 (referred_by query on profiles_public)
--        V7-SEC-1  (admin_insights readable by all authenticated)
--        V7-FUNC-3 (insightService INSERT/UPDATE needs admin policy)
--        V7-RET-1  (streak only on quiz finish, not engagement)
--        V7-XP-1   (per-question XP cooldown)
--        V7-EDU-1  (weighted question selection)
--        V7-EDU-2  (percentage-based pass threshold)
--        V7-REV-1  (subscription tier infrastructure)
--        V7-CRIT-1 (finished_at DEFAULT now() bug — caused 0/0/0 scoring)

-- ==========================================================================
-- CRITICAL FIX V7-CRIT-1: Drop bad DEFAULT on finished_at
-- The column had DEFAULT now() which made every new attempt "already finished"
-- causing finish_quiz_attempt to skip scoring entirely (already_finished: true)
-- ==========================================================================
ALTER TABLE public.quiz_attempts ALTER COLUMN finished_at DROP DEFAULT;
-- ============================================================================


-- ==========================================================================
-- FIX V7-FUNC-1: Create SECURITY DEFINER RPC for referral friend lookup
-- profiles_public intentionally excludes referred_by for privacy.
-- This RPC safely returns only public fields for referred users.
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.get_referred_users(p_user_id UUID)
RETURNS TABLE (id UUID, nickname TEXT, avatar_url TEXT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'Unauthorized: can only view own referrals';
    END IF;

    RETURN QUERY
    SELECT p.id, p.nickname, p.avatar_url, p.created_at
    FROM profiles p
    WHERE p.referred_by = p_user_id
    ORDER BY p.created_at DESC;
END;
$$;


-- ==========================================================================
-- FIX V7-SEC-1: Restrict admin_insights SELECT to admin role only
-- ==========================================================================

DROP POLICY IF EXISTS "Authenticated users can read insights" ON admin_insights;

DROP POLICY IF EXISTS "Admin can read insights" ON admin_insights;

CREATE POLICY "Admin can read insights" ON admin_insights
    FOR SELECT TO authenticated
    USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');


-- ==========================================================================
-- FIX V7-FUNC-3: Allow admin to INSERT/UPDATE admin_insights
-- ==========================================================================

DROP POLICY IF EXISTS "Admin can insert insights" ON admin_insights;

CREATE POLICY "Admin can insert insights" ON admin_insights
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Admin can update insights" ON admin_insights;

CREATE POLICY "Admin can update insights" ON admin_insights
    FOR UPDATE TO authenticated
    USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
    WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');


-- ==========================================================================
-- FIX V7-RET-1: Daily check-in RPC for streak on engagement
-- Streak only fired on quiz completion. This RPC allows streak update
-- on meaningful app engagement without requiring a completed quiz.
-- SECURITY DEFINER bypasses V5 RLS lock on streak columns.
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.daily_checkin()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_profile RECORD;
    v_today DATE := (NOW() AT TIME ZONE 'Europe/Rome')::DATE;
    v_last_active DATE;
    v_new_streak INT;
    v_new_max INT;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT streak_current, streak_max, last_active_at
    INTO v_profile
    FROM profiles WHERE id = v_user_id;

    IF NOT FOUND THEN RETURN '{}'::jsonb; END IF;

    -- V9-RACE-1: Advisory lock prevents concurrent streak races
    PERFORM pg_advisory_xact_lock(hashtext(v_user_id::text));

    v_last_active := (v_profile.last_active_at AT TIME ZONE 'Europe/Rome')::DATE;
    v_new_streak := COALESCE(v_profile.streak_current, 0);

    -- Already checked in today — no-op (zero overhead)
    IF v_last_active = v_today THEN
        RETURN jsonb_build_object(
            'streak', v_new_streak,
            'updated', false
        );
    END IF;

    -- Streak logic (mirrors handle_new_attempt_xp)
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
    WHERE id = v_user_id;

    RETURN jsonb_build_object(
        'streak', v_new_streak,
        'max', v_new_max,
        'updated', true
    );
END;
$$;


-- ==========================================================================
-- FIX V7-EDU-1: User question history for weighted selection
-- Tracks per-question accuracy. Populated automatically from quiz answers.
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.user_question_history (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    times_seen INT DEFAULT 0,
    times_correct INT DEFAULT 0,
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, question_id)
);

ALTER TABLE public.user_question_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own history" ON public.user_question_history;

-- V9-XP-1: SELECT-only for users — prevents DELETE to bypass XP cooldown.
-- INSERT/UPDATE handled by SECURITY DEFINER trigger (update_question_history).
DROP POLICY IF EXISTS "Users can read own history" ON public.user_question_history;

CREATE POLICY "Users can read own history" ON public.user_question_history
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_uqh_user_accuracy
    ON public.user_question_history(user_id, times_correct, times_seen);

-- Auto-populate from quiz completions
CREATE OR REPLACE FUNCTION public.update_question_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_answer JSONB;
BEGIN
    IF NEW.correct IS NULL OR NEW.answers IS NULL THEN RETURN NEW; END IF;

    FOR v_answer IN SELECT * FROM jsonb_array_elements(NEW.answers)
    LOOP
        IF v_answer->>'questionId' IS NULL THEN CONTINUE; END IF;

        INSERT INTO user_question_history (user_id, question_id, times_seen, times_correct, last_seen_at)
        VALUES (
            NEW.user_id,
            (v_answer->>'questionId')::UUID,
            1,
            CASE WHEN (v_answer->>'isCorrect')::boolean THEN 1 ELSE 0 END,
            NOW()
        )
        ON CONFLICT (user_id, question_id) DO UPDATE SET
            times_seen = user_question_history.times_seen + 1,
            times_correct = user_question_history.times_correct +
                CASE WHEN (v_answer->>'isCorrect')::boolean THEN 1 ELSE 0 END,
            last_seen_at = NOW();
    END LOOP;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_question_history ON public.quiz_attempts;
CREATE TRIGGER trg_update_question_history
    AFTER UPDATE OF answers ON public.quiz_attempts
    FOR EACH ROW
    WHEN (NEW.answers IS NOT NULL AND NEW.correct IS NOT NULL)
    EXECUTE FUNCTION public.update_question_history();


-- ==========================================================================
-- FIX V7-EDU-2: Percentage-based pass threshold
-- Adds pass_type to simulation_rules and quizzes for flexible pass logic.
-- ==========================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'simulation_rules' AND column_name = 'pass_type'
    ) THEN
        ALTER TABLE public.simulation_rules
            ADD COLUMN pass_type TEXT DEFAULT 'count'
            CHECK (pass_type IN ('count', 'percentage', 'score'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'quizzes' AND column_name = 'pass_type'
    ) THEN
        ALTER TABLE public.quizzes
            ADD COLUMN pass_type TEXT DEFAULT 'count'
            CHECK (pass_type IN ('count', 'percentage', 'score'));
    END IF;
END $$;


-- ==========================================================================
-- FIX V7-XP-1: Per-question XP cooldown in handle_new_attempt_xp
-- Only award XP for questions NOT answered correctly in last 24h.
-- Encourages breadth over repetition of same easy questions.
-- ==========================================================================

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
    v_eligible_correct INT;
    v_answer JSONB;
    v_qid UUID;
    v_hist RECORD;
BEGIN
    -- Guard: already processed or no scores yet
    IF NEW.xp_awarded = true THEN RETURN NEW; END IF;
    IF NEW.correct IS NULL THEN RETURN NEW; END IF;

    -- Wrap everything in exception handler so XP errors NEVER block scoring
    BEGIN
        PERFORM pg_advisory_xact_lock(hashtext(NEW.user_id::text));

        SELECT * INTO v_profile FROM profiles WHERE id = NEW.user_id;
        IF NOT FOUND THEN
            NEW.xp_awarded := true;
            RETURN NEW;
        END IF;

        -- A. STREAK UPDATE
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

        -- B. XP WITH PER-QUESTION COOLDOWN
        v_eligible_correct := 0;

        IF NEW.answers IS NOT NULL AND jsonb_typeof(NEW.answers) = 'array' THEN
            FOR v_answer IN SELECT * FROM jsonb_array_elements(NEW.answers)
            LOOP
                IF NOT COALESCE((v_answer->>'isCorrect')::boolean, false) THEN
                    CONTINUE;
                END IF;

                v_qid := (v_answer->>'questionId')::UUID;
                IF v_qid IS NULL THEN
                    v_eligible_correct := v_eligible_correct + 1;
                    CONTINUE;
                END IF;

                -- Per-question cooldown query (crash-safe)
                BEGIN
                    SELECT times_correct, last_seen_at INTO v_hist
                    FROM user_question_history
                    WHERE user_id = NEW.user_id AND question_id = v_qid;

                    IF NOT FOUND THEN
                        v_eligible_correct := v_eligible_correct + 1;
                    ELSIF v_hist.last_seen_at < NOW() - INTERVAL '24 hours' THEN
                        v_eligible_correct := v_eligible_correct + 1;
                    ELSIF v_hist.times_correct = 0 THEN
                        v_eligible_correct := v_eligible_correct + 1;
                    END IF;
                EXCEPTION WHEN OTHERS THEN
                    v_eligible_correct := v_eligible_correct + 1;
                END;
            END LOOP;
        ELSE
            v_eligible_correct := COALESCE(NEW.correct, 0);
        END IF;

        -- Daily cap (500 XP)
        IF COALESCE(v_profile.daily_xp_date, '1970-01-01'::DATE) < v_today THEN
            v_daily_xp := 0;
        ELSE
            v_daily_xp := COALESCE(v_profile.daily_xp, 0);
        END IF;

        IF v_daily_xp >= 500 THEN
            v_xp_amount := 0;
        ELSE
            v_xp_amount := LEAST(v_eligible_correct, 500 - v_daily_xp);
        END IF;

        IF v_xp_amount > 0 THEN
            UPDATE public.profiles
            SET total_xp = COALESCE(total_xp, 0) + v_xp_amount,
                daily_xp = COALESCE(
                    CASE WHEN daily_xp_date = v_today THEN daily_xp ELSE 0 END, 0
                ) + v_xp_amount,
                daily_xp_date = v_today
            WHERE id = NEW.user_id;

            -- Season XP insert (crash-safe)
            BEGIN
                SELECT id INTO v_season_id FROM public.leaderboard_seasons
                WHERE is_active = true AND start_at <= NOW() AND (end_at IS NULL OR end_at >= NOW())
                ORDER BY start_at DESC LIMIT 1;

                IF v_season_id IS NOT NULL THEN
                    INSERT INTO public.user_xp (user_id, season_id, xp, updated_at)
                    VALUES (NEW.user_id, v_season_id, v_xp_amount, NOW())
                    ON CONFLICT (user_id, season_id)
                    DO UPDATE SET xp = user_xp.xp + v_xp_amount, updated_at = NOW();
                END IF;
            EXCEPTION WHEN OTHERS THEN
                NULL; -- Season XP failed, continue
            END;
        END IF;

        -- C. REFERRAL BONUS (On First Completed Quiz)
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

    EXCEPTION WHEN OTHERS THEN
        -- Log error but NEVER block the scoring update
        RAISE WARNING 'handle_new_attempt_xp error (non-blocking): %', SQLERRM;
    END;

    NEW.xp_awarded := true;
    RETURN NEW;
END;
$$;


-- ==========================================================================
-- FIX V7-REV-1: Subscription tier infrastructure
-- Basic column for future premium gating. No access restrictions yet.
-- ==========================================================================

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'premium', 'pro'));

-- Defensive: Recreate questions_safe VIEW with quiz_id
-- V11-SEC-1: With RLS now on questions, this VIEW is the ONLY way
-- authenticated users can access question data (no correct_option).
-- Must DROP first because adding quiz_id column changes the column order.
DROP VIEW IF EXISTS public.questions_safe;

CREATE VIEW public.questions_safe AS
SELECT
    id,
    quiz_id,
    subject_id,
    text,
    option_a,
    option_b,
    option_c,
    option_d,
    options,
    explanation,
    is_archived,
    created_at
FROM public.questions;

GRANT SELECT ON public.questions_safe TO authenticated;

-- Rebuild profiles_public VIEW with subscription_tier
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public AS
SELECT
    id,
    nickname,
    avatar_url,
    total_xp,
    streak_current,
    streak_max,
    referral_count,
    subscription_tier,
    created_at
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO authenticated;
GRANT SELECT ON public.profiles_public TO anon;


-- ==========================================================================
-- FIX V8-SEC-2: sync_offline_attempt reads scoring from simulation_rules
-- Previously trusted client p_scoring — now reads from DB like finish_quiz_attempt
-- ==========================================================================

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

    -- TIMER VALIDATION
    IF p_finished_at > NOW() + INTERVAL '5 minutes' THEN
        RAISE EXCEPTION 'sync_offline_attempt: finished_at is in the future';
    END IF;
    IF p_started_at >= p_finished_at THEN
        RAISE EXCEPTION 'sync_offline_attempt: started_at must be before finished_at';
    END IF;
    v_time_taken_seconds := EXTRACT(EPOCH FROM (p_finished_at - p_started_at))::INT;
    v_max_allowed_seconds := (p_total_questions * 300) + 600;
    IF v_time_taken_seconds > v_max_allowed_seconds THEN
        RAISE EXCEPTION 'sync_offline_attempt: duration exceeds maximum bounds';
    END IF;

    -- IDEMPOTENCY
    IF EXISTS (
        SELECT 1 FROM quiz_attempts
        WHERE user_id = v_calling_user
          AND quiz_id = p_quiz_id
          AND started_at = p_started_at
          AND finished_at IS NOT NULL
    ) THEN
        RETURN (
            SELECT jsonb_build_object(
                'id', id, 'correct', correct, 'wrong', wrong,
                'blank', blank, 'score', score, 'is_idoneo', is_idoneo,
                'already_synced', true
            )
            FROM quiz_attempts
            WHERE user_id = v_calling_user AND quiz_id = p_quiz_id
              AND started_at = p_started_at AND finished_at IS NOT NULL
            LIMIT 1
        );
    END IF;

    -- V8-SEC-2: READ SCORING FROM DB, NOT CLIENT
    -- Priority: simulation_rules → quizzes → safe defaults
    SELECT
        q.points_correct, q.points_wrong, q.points_blank,
        q.use_custom_pass_threshold, q.min_correct_for_pass,
        q.pass_type AS q_pass_type,
        sr.points_correct AS sr_correct,
        sr.points_wrong AS sr_wrong,
        sr.points_blank AS sr_blank,
        sr.pass_type AS sr_pass_type
    INTO v_quiz_config
    FROM quizzes q
    LEFT JOIN simulation_rules sr ON sr.id = q.rule_id
    WHERE q.id = p_quiz_id;

    v_pts_correct := COALESCE(v_quiz_config.sr_correct, v_quiz_config.points_correct, 1);
    v_pts_wrong := COALESCE(v_quiz_config.sr_wrong, v_quiz_config.points_wrong, 0);
    v_pts_blank := COALESCE(v_quiz_config.sr_blank, v_quiz_config.points_blank, 0);

    -- Server-side answer validation
    FOR v_answer IN SELECT * FROM jsonb_array_elements(p_answers)
    LOOP
        v_selected := LOWER(TRIM(v_answer->>'selectedOption'));

        SELECT id, LOWER(TRIM(COALESCE(correct_option, ''))) as correct_key,
               option_a, option_b, option_c, option_d
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
            'questionId', v_answer->>'questionId', 'text', v_answer->>'text',
            'subjectId', v_answer->>'subjectId', 'subjectName', v_answer->>'subjectName',
            'selectedOption', v_answer->>'selectedOption', 'correctOption', v_correct_key,
            'isCorrect', v_is_correct, 'isSkipped', (v_selected IS NULL OR v_selected = ''),
            'explanation', v_answer->>'explanation', 'options', v_answer->'options'
        );
    END LOOP;

    v_score := ROUND(v_score * 100) / 100;

    -- Check pass threshold (with V7 pass_type support)
    IF v_quiz_config.use_custom_pass_threshold = true THEN
        DECLARE
            v_pass_type TEXT;
        BEGIN
            v_pass_type := COALESCE(v_quiz_config.sr_pass_type, v_quiz_config.q_pass_type, 'count');
            IF v_pass_type = 'percentage' THEN
                v_is_idoneo := (v_correct::NUMERIC / NULLIF(p_total_questions, 0) * 100) >= COALESCE(v_quiz_config.min_correct_for_pass, 0);
            ELSIF v_pass_type = 'score' THEN
                v_is_idoneo := v_score >= COALESCE(v_quiz_config.min_correct_for_pass, 0);
            ELSE
                v_is_idoneo := v_correct >= COALESCE(v_quiz_config.min_correct_for_pass, 0);
            END IF;
        END;
        v_pass_threshold := v_quiz_config.min_correct_for_pass;
    END IF;

    -- INSERT then UPDATE to fire AFTER UPDATE triggers
    INSERT INTO quiz_attempts (
        user_id, quiz_id, started_at, total_questions, score, correct, wrong, blank
    ) VALUES (
        v_calling_user, p_quiz_id, p_started_at, p_total_questions, 0, 0, 0, 0
    ) RETURNING id INTO v_new_attempt_id;

    UPDATE quiz_attempts
    SET finished_at = p_finished_at,
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


-- ==========================================================================
-- FIX V9-FUNC-1: lookup_referral_code RPC
-- V5 RLS restricts profiles SELECT to own row only.
-- Profile setup needs to look up OTHER users by referral_code.
-- This SECURITY DEFINER RPC safely returns only the referrer's UUID.
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.lookup_referral_code(p_code TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_referrer_id UUID;
    v_calling_user UUID;
BEGIN
    v_calling_user := auth.uid();
    IF v_calling_user IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Lookup referrer by code (case-insensitive)
    SELECT id INTO v_referrer_id
    FROM profiles
    WHERE referral_code = UPPER(TRIM(p_code))
      AND id != v_calling_user;  -- Can't refer yourself

    RETURN v_referrer_id;  -- NULL if not found
END;
$$;


-- ==========================================================================
-- FIX V9-EDU-1: Restore V4 finish_quiz_attempt (V9 full rewrite had bugs)
-- Exact V4 proven code. Pass_type deferred to avoid regression risk.
-- ==========================================================================

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

    -- TIMER VALIDATION
    v_time_taken_seconds := EXTRACT(EPOCH FROM (NOW() - v_attempt.started_at))::INT;
    v_max_allowed_seconds := (v_attempt.total_questions * 300) + 600;

    IF v_time_taken_seconds > v_max_allowed_seconds THEN
        RAISE EXCEPTION 'Quiz time limit exceeded maximum bounds';
    END IF;

    -- V4: SERVER-SIDE SCORING CONFIG
    SELECT
        q.points_correct,
        q.points_wrong,
        q.points_blank,
        q.rule_id,
        q.use_custom_pass_threshold,
        q.min_correct_for_pass,
        sr.points_correct AS sr_correct,
        sr.points_wrong AS sr_wrong,
        sr.points_blank AS sr_blank
    INTO v_quiz_config
    FROM quizzes q
    LEFT JOIN simulation_rules sr ON sr.id = q.rule_id
    WHERE q.id = v_attempt.quiz_id;

    v_pts_correct := COALESCE(v_quiz_config.sr_correct, v_quiz_config.points_correct, 1);
    v_pts_wrong := COALESCE(v_quiz_config.sr_wrong, v_quiz_config.points_wrong, 0);
    v_pts_blank := COALESCE(v_quiz_config.sr_blank, v_quiz_config.points_blank, 0);

    FOR v_answer IN SELECT * FROM jsonb_array_elements(p_answers)
    LOOP
        v_selected := LOWER(TRIM(v_answer->>'selectedOption'));

        SELECT id, LOWER(TRIM(COALESCE(correct_option, ''))) as correct_key,
               option_a, option_b, option_c, option_d
        INTO v_question
        FROM questions
        WHERE id = (v_answer->>'questionId')::uuid;

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
            'questionId', v_answer->>'questionId', 'text', v_answer->>'text',
            'subjectId', v_answer->>'subjectId', 'subjectName', v_answer->>'subjectName',
            'selectedOption', v_answer->>'selectedOption', 'correctOption', v_correct_key,
            'isCorrect', v_is_correct, 'isSkipped', (v_selected IS NULL OR v_selected = ''),
            'explanation', v_answer->>'explanation', 'options', v_answer->'options'
        );
    END LOOP;

    v_score := ROUND(v_score * 100) / 100;

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
        'already_finished', false,
        'scoring_used', jsonb_build_object(
            'correct', v_pts_correct,
            'wrong', v_pts_wrong,
            'blank', v_pts_blank
        )
    );
END;
$$;


-- ==========================================================================
-- FIX V10-FUNC-1: check_nickname_available RPC
-- V5 SELECT restricts profiles to own row. Nickname check for OTHER users
-- fails silently → duplicates accepted. This RPC safely checks uniqueness.
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.check_nickname_available(p_nickname TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_calling_user UUID;
    v_exists BOOLEAN;
BEGIN
    v_calling_user := auth.uid();
    IF v_calling_user IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT EXISTS(
        SELECT 1 FROM profiles
        WHERE LOWER(TRIM(nickname)) = LOWER(TRIM(p_nickname))
          AND id != v_calling_user
    ) INTO v_exists;

    RETURN NOT v_exists;  -- TRUE if available, FALSE if taken
END;
$$;


-- ==========================================================================
-- FIX V10-FUNC-1 + V10-SEC-1: setup_profile RPC
-- V5 RLS now blocks referred_by UPDATE (immutable after set).
-- This SECURITY DEFINER RPC handles the INITIAL profile setup:
--   1. Validates nickname uniqueness (bypasses V5 SELECT restriction)
--   2. Looks up referral code (same as lookup_referral_code)
--   3. Sets nickname + avatar_url + email + referred_by atomically
-- Only works if profile has no nickname set (first-time setup guard).
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.setup_profile(
    p_nickname TEXT,
    p_avatar_url TEXT DEFAULT NULL,
    p_referral_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_email TEXT;
    v_clean_nickname TEXT;
    v_existing_nickname TEXT;
    v_referrer_id UUID;
    v_current_profile RECORD;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Get user email
    SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;

    -- Check profile exists and isn't already set up
    SELECT nickname, referred_by INTO v_current_profile
    FROM profiles WHERE id = v_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile not found. Contact support.';
    END IF;

    -- Guard: Only allow setup if nickname is null/empty (first-time setup)
    IF v_current_profile.nickname IS NOT NULL AND TRIM(v_current_profile.nickname) != '' THEN
        RETURN jsonb_build_object('error', 'Profile already set up', 'code', 'ALREADY_SETUP');
    END IF;

    -- Sanitize nickname (basic server-side sanitization)
    v_clean_nickname := TRIM(p_nickname);
    IF LENGTH(v_clean_nickname) < 2 OR LENGTH(v_clean_nickname) > 30 THEN
        RETURN jsonb_build_object('error', 'Nickname deve essere tra 2 e 30 caratteri', 'code', 'INVALID_NICKNAME');
    END IF;

    -- Check uniqueness (case-insensitive)
    SELECT nickname INTO v_existing_nickname
    FROM profiles
    WHERE LOWER(TRIM(nickname)) = LOWER(v_clean_nickname)
      AND id != v_user_id
    LIMIT 1;

    IF v_existing_nickname IS NOT NULL THEN
        RETURN jsonb_build_object('error', 'Questo nickname è già in uso', 'code', 'NICKNAME_TAKEN');
    END IF;

    -- Lookup referral code (if provided)
    v_referrer_id := NULL;
    IF p_referral_code IS NOT NULL AND TRIM(p_referral_code) != '' THEN
        SELECT id INTO v_referrer_id
        FROM profiles
        WHERE referral_code = UPPER(TRIM(p_referral_code))
          AND id != v_user_id;
    END IF;

    -- Atomic update
    UPDATE profiles
    SET nickname = v_clean_nickname,
        avatar_url = COALESCE(p_avatar_url, avatar_url),
        email = COALESCE(v_email, email),
        referred_by = v_referrer_id,
        updated_at = NOW()
    WHERE id = v_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'nickname', v_clean_nickname,
        'referred_by', v_referrer_id
    );
END;
$$;


-- ============================================================================
-- V11 AUDIT FIXES
-- ============================================================================


-- ==========================================================================
-- FIX V11-SEC-1: Enable RLS on questions table
-- The questions table was NEVER protected by RLS. Any authenticated user
-- could query SELECT correct_option FROM questions and dump the entire bank.
-- Now: admin-only for raw table. Users access via questions_safe VIEW.
-- ==========================================================================
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Admin has full access to raw questions table
DROP POLICY IF EXISTS "Admins manage questions" ON public.questions;
CREATE POLICY "Admins manage questions" ON public.questions
    FOR ALL TO authenticated
    USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Authenticated users can ONLY read via questions_safe VIEW (no correct_option)
-- VIEWs bypass RLS by default (execute as VIEW owner), so questions_safe still works.


-- ==========================================================================
-- FIX V11-SEC-3: Drop obsolete on_new_attempt_score trigger
-- This old trigger from 2024 fires AFTER INSERT OR UPDATE and can crash,
-- rolling back scoring. It was manually dropped but exists in migrations.
-- ==========================================================================
DROP TRIGGER IF EXISTS on_new_attempt_score ON public.quiz_attempts;
DROP TRIGGER IF EXISTS on_quiz_attempt_streak ON public.quiz_attempts;


-- ==========================================================================
-- FIX V11-XP-2: Require minimum 1 correct answer for streak credit
-- Previously, blank quizzes (0 correct, 0 wrong, 100 blank) still
-- incremented the streak. Now requires at least 1 correct answer.
-- ==========================================================================
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
    v_eligible_correct INT;
    v_answer JSONB;
    v_qid UUID;
    v_hist RECORD;
BEGIN
    -- Guard: already processed or no scores yet
    IF NEW.xp_awarded = true THEN RETURN NEW; END IF;
    IF NEW.correct IS NULL THEN RETURN NEW; END IF;

    -- V11-XP-2: Require at least 1 correct answer for streak/XP
    IF COALESCE(NEW.correct, 0) < 1 THEN
        NEW.xp_awarded := true;
        RETURN NEW;
    END IF;

    -- Wrap everything in exception handler so XP errors NEVER block scoring
    BEGIN
        PERFORM pg_advisory_xact_lock(hashtext(NEW.user_id::text));

        SELECT * INTO v_profile FROM profiles WHERE id = NEW.user_id;
        IF NOT FOUND THEN
            NEW.xp_awarded := true;
            RETURN NEW;
        END IF;

        -- A. STREAK UPDATE
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

        -- B. XP WITH PER-QUESTION COOLDOWN
        v_eligible_correct := 0;

        IF NEW.answers IS NOT NULL AND jsonb_typeof(NEW.answers) = 'array' THEN
            FOR v_answer IN SELECT * FROM jsonb_array_elements(NEW.answers)
            LOOP
                IF NOT COALESCE((v_answer->>'isCorrect')::boolean, false) THEN
                    CONTINUE;
                END IF;

                v_qid := (v_answer->>'questionId')::UUID;
                IF v_qid IS NULL THEN
                    v_eligible_correct := v_eligible_correct + 1;
                    CONTINUE;
                END IF;

                BEGIN
                    SELECT times_correct, last_seen_at INTO v_hist
                    FROM user_question_history
                    WHERE user_id = NEW.user_id AND question_id = v_qid;

                    IF NOT FOUND THEN
                        v_eligible_correct := v_eligible_correct + 1;
                    ELSIF v_hist.last_seen_at < NOW() - INTERVAL '24 hours' THEN
                        v_eligible_correct := v_eligible_correct + 1;
                    ELSIF v_hist.times_correct = 0 THEN
                        v_eligible_correct := v_eligible_correct + 1;
                    END IF;
                EXCEPTION WHEN OTHERS THEN
                    v_eligible_correct := v_eligible_correct + 1;
                END;
            END LOOP;
        ELSE
            v_eligible_correct := COALESCE(NEW.correct, 0);
        END IF;

        -- Daily cap (500 XP)
        IF COALESCE(v_profile.daily_xp_date, '1970-01-01'::DATE) < v_today THEN
            v_daily_xp := 0;
        ELSE
            v_daily_xp := COALESCE(v_profile.daily_xp, 0);
        END IF;

        IF v_daily_xp >= 500 THEN
            v_xp_amount := 0;
        ELSE
            v_xp_amount := LEAST(v_eligible_correct, 500 - v_daily_xp);
        END IF;

        IF v_xp_amount > 0 THEN
            UPDATE public.profiles
            SET total_xp = COALESCE(total_xp, 0) + v_xp_amount,
                daily_xp = COALESCE(
                    CASE WHEN daily_xp_date = v_today THEN daily_xp ELSE 0 END, 0
                ) + v_xp_amount,
                daily_xp_date = v_today
            WHERE id = NEW.user_id;

            BEGIN
                SELECT id INTO v_season_id FROM public.leaderboard_seasons
                WHERE is_active = true AND start_at <= NOW() AND (end_at IS NULL OR end_at >= NOW())
                ORDER BY start_at DESC LIMIT 1;

                IF v_season_id IS NOT NULL THEN
                    INSERT INTO public.user_xp (user_id, season_id, xp, updated_at)
                    VALUES (NEW.user_id, v_season_id, v_xp_amount, NOW())
                    ON CONFLICT (user_id, season_id)
                    DO UPDATE SET xp = user_xp.xp + v_xp_amount, updated_at = NOW();
                END IF;
            EXCEPTION WHEN OTHERS THEN
                NULL;
            END;
        END IF;

        -- C. REFERRAL BONUS (On First Completed Quiz)
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

    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'handle_new_attempt_xp error (non-blocking): %', SQLERRM;
    END;

    NEW.xp_awarded := true;
    RETURN NEW;
END;
$$;


-- ==========================================================================
-- FIX V11-SEC-2: Secure instant-check RPC
-- Instead of sending correct_option to clients, quiz runner calls this RPC
-- to check one answer at a time. Returns correctness without revealing the
-- answer key (only reveals AFTER the user has committed their selection).
-- ==========================================================================
CREATE OR REPLACE FUNCTION public.check_single_answer(
    p_question_id UUID,
    p_selected_option TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_question RECORD;
    v_correct_key TEXT;
    v_selected TEXT;
    v_is_correct BOOLEAN := false;
    v_option_text TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT id, LOWER(TRIM(COALESCE(correct_option, ''))) as correct_key,
           option_a, option_b, option_c, option_d
    INTO v_question
    FROM questions
    WHERE id = p_question_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Question not found');
    END IF;

    v_correct_key := v_question.correct_key;
    v_selected := LOWER(TRIM(COALESCE(p_selected_option, '')));

    IF v_selected = '' THEN
        RETURN jsonb_build_object('isCorrect', false, 'correctOption', v_correct_key);
    END IF;

    -- Direct key match (a/b/c/d)
    IF v_selected = v_correct_key THEN
        v_is_correct := true;
    END IF;

    -- Text match fallback
    IF NOT v_is_correct AND v_correct_key IS NOT NULL AND v_correct_key != '' THEN
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
    END IF;

    RETURN jsonb_build_object(
        'isCorrect', v_is_correct,
        'correctOption', v_correct_key
    );
END;
$$;
