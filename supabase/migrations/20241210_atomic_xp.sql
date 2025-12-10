-- Atomic XP Update Functions
-- Prevents race conditions in XP updates

-- 1. Atomically increment profile XP
CREATE OR REPLACE FUNCTION increment_profile_xp(p_user_id UUID, p_amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
    new_total INTEGER;
BEGIN
    UPDATE profiles 
    SET total_xp = COALESCE(total_xp, 0) + p_amount
    WHERE id = p_user_id
    RETURNING total_xp INTO new_total;
    
    RETURN COALESCE(new_total, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Atomically upsert user seasonal XP
CREATE OR REPLACE FUNCTION upsert_user_xp(p_user_id UUID, p_season_id UUID, p_amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
    new_xp INTEGER;
BEGIN
    INSERT INTO user_xp (user_id, season_id, xp)
    VALUES (p_user_id, p_season_id, p_amount)
    ON CONFLICT (user_id, season_id) 
    DO UPDATE SET xp = user_xp.xp + p_amount
    RETURNING xp INTO new_xp;
    
    RETURN COALESCE(new_xp, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_profile_xp(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_user_xp(UUID, UUID, INTEGER) TO authenticated;
