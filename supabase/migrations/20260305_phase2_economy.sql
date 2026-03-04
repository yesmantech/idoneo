-- ============================================================================
-- AUDIT V2: PHASE 2 GAMIFICATION ECONOMY FIXES
-- Fixes: HIGH-2 (XP farming), HIGH-7 (Referral abuse), MED-1/MED-2 (Streak), MED-4/MED-5 (Referral code)
-- ============================================================================

-- 1. FIX MED-4: Expand referral code to 8 chars to avoid collisions at scale
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, nickname, avatar_url, referral_code, waitlist_joined_at)
    VALUES (
        new.id,
        split_part(new.email, '@', 1),
        null,
        upper(substring(md5(random()::text || new.id::text) from 1 for 8)),
        now()
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. FIX HIGH-7 (Part A): Stop immediate referral reward on signup
DROP TRIGGER IF EXISTS on_referral_signup ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_referral_signup();


-- 3. FIX HIGH-2, MED-1, MED-2, HIGH-7 (Part B): Unified activity trigger
-- Handles XP caps, Streaks, and 1st-quiz referral rewards in one secure place
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

    -- Fetch current profile state
    SELECT * INTO v_profile FROM profiles WHERE id = NEW.user_id;
    IF NOT FOUND THEN RETURN NEW; END IF;

    -- ==========================================
    -- A. STREAK UPDATE (Gated by quiz completion)
    -- ==========================================
    v_last_active := (v_profile.last_active_at AT TIME ZONE 'Europe/Rome')::DATE;
    v_new_streak := COALESCE(v_profile.streak_current, 0);

    IF v_last_active IS NULL OR v_last_active < (v_today - INTERVAL '1 day')::DATE THEN
        -- Broken streak or first time
        v_new_streak := 1;
    ELSIF v_last_active = (v_today - INTERVAL '1 day')::DATE THEN
        -- Active yesterday, increment
        v_new_streak := v_new_streak + 1;
    END IF;
    -- If v_last_active == v_today, it remains unchanged

    v_new_max := GREATEST(COALESCE(v_profile.streak_max, 0), v_new_streak);

    UPDATE profiles
    SET streak_current = v_new_streak,
        streak_max = v_new_max,
        last_active_at = NOW()
    WHERE id = NEW.user_id;


    -- ==========================================
    -- B. XP DIMINISHING RETURNS / DAILY CAP (500)
    -- ==========================================
    SELECT COALESCE(SUM(xp), 0) INTO v_daily_xp
    FROM user_xp
    WHERE user_id = NEW.user_id 
      AND (updated_at AT TIME ZONE 'Europe/Rome')::DATE = v_today;

    IF v_daily_xp >= 500 THEN
        v_xp_amount := 0; -- Hard cap reached
    ELSE
        v_xp_amount := LEAST(NEW.correct, 500 - v_daily_xp);
    END IF;

    IF v_xp_amount > 0 THEN
        -- Global Profile XP
        UPDATE public.profiles
        SET 
            total_xp = COALESCE(total_xp, 0) + v_xp_amount,
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
    -- ==========================================
    IF v_profile.referred_by IS NOT NULL THEN
        -- Check if this is exactly the first completed quiz
        SELECT COUNT(*) INTO v_completed_count 
        FROM quiz_attempts 
        WHERE user_id = NEW.user_id AND finished_at IS NOT NULL;

        -- If it's exactly 1, they just finished their first ever quiz
        -- Reward the referrer
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


-- 4. FIX MED-5: Revoke referrer count on account deletion
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _user_id UUID;
    _referred_by UUID;
BEGIN
    _user_id := auth.uid();
    IF _user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    -- Fetch the referrer BEFORE deleting the user
    SELECT referred_by INTO _referred_by FROM profiles WHERE id = _user_id;

    -- Decrement referrer's count if applicable
    IF _referred_by IS NOT NULL THEN
        UPDATE profiles 
        SET referral_count = GREATEST(COALESCE(referral_count, 1) - 1, 0) 
        WHERE id = _referred_by;
    END IF;

    -- Delete the user from auth.users (cascades to profiles, etc)
    DELETE FROM auth.users WHERE id = _user_id;
END;
$$;
