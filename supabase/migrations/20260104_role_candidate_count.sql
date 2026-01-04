-- Function to count unique candidates for a specific role
-- Bypasses RLS to get a global count
CREATE OR REPLACE FUNCTION get_role_candidate_count(target_role_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (admin), bypassing RLS
AS $$
DECLARE
  candidate_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT user_id)
  INTO candidate_count
  FROM quiz_attempts qa
  JOIN quizzes q ON q.id = qa.quiz_id
  WHERE q.role_id = target_role_id;

  RETURN candidate_count;
END;
$$;
