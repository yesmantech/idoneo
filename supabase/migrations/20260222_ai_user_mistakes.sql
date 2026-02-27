-- Drop the function if it exists
DROP FUNCTION IF EXISTS public.get_user_mistakes;

-- Create function to get user's worst subjects/topics
CREATE OR REPLACE FUNCTION public.get_user_mistakes(
    p_user_id UUID,
    p_limit INT DEFAULT 5
)
RETURNS TABLE (
    subject TEXT,
    topic TEXT,
    wrong_count BIGINT,
    total_attempts BIGINT,
    accuracy NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.subject,
        q.topic,
        COUNT(*) AS wrong_count,
        SUM(qa.total_questions)::BIGINT AS total_attempts,
        ROUND(
            (SUM(qa.correct)::NUMERIC / NULLIF(SUM(qa.total_questions), 0)) * 100, 
            2
        ) AS accuracy
    FROM 
        public.quiz_attempts qa
    JOIN 
        public.questions q ON q.id = ANY(
            SELECT jsonb_array_elements_text(qa.answers::jsonb)::uuid
        )
    WHERE 
        qa.user_id = p_user_id
    GROUP BY 
        q.subject, q.topic
    HAVING 
        SUM(qa.wrong) > 0
    ORDER BY 
        SUM(qa.wrong) DESC, accuracy ASC
    LIMIT 
        p_limit;
END;
$$;
