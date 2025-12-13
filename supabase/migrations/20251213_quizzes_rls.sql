-- Allow authenticated users to view all quizzes (needed for leaderboard dropdown)
CREATE POLICY "Quizzes are viewable by authenticated users"
ON quizzes FOR SELECT
TO authenticated
USING (true);
