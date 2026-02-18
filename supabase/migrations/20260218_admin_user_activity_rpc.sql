
-- 20260218_admin_user_activity_rpc.sql
-- Provides detailed user activity (profile + recent quiz attempts) for admins.

CREATE OR REPLACE FUNCTION get_user_activity_admin(target_user_id uuid)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role text;
  v_result jsonb;
BEGIN
  -- 1. Check if caller is admin
  SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid();
  IF v_caller_role != 'admin' THEN
    RAISE EXCEPTION 'Access Denied: Admins Only';
  END IF;

  -- 2. Build result object
  SELECT jsonb_build_object(
    'profile', (SELECT row_to_json(p) FROM profiles p WHERE id = target_user_id),
    'attempts', (
      SELECT json_agg(a) FROM (
        SELECT 
          qa.id, 
          qa.created_at, 
          qa.score, 
          qa.is_idoneo, 
          qa.mode,
          qa.total_questions,
          qa.correct,
          q.title as quiz_title
        FROM quiz_attempts qa
        JOIN quizzes q ON qa.quiz_id = q.id
        WHERE qa.user_id = target_user_id
        ORDER BY qa.created_at DESC
        LIMIT 50
      ) a
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_user_activity_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_activity_admin(uuid) TO service_role;
