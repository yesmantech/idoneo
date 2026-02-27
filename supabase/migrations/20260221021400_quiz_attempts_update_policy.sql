-- Migration: Add UPDATE policy for quiz_attempts
-- Reason: To allow the frontend to update the quiz attempt at the end of the quiz session

DROP POLICY IF EXISTS "Users can update own attempts" ON public.quiz_attempts;

CREATE POLICY "Users can update own attempts" 
ON public.quiz_attempts 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
