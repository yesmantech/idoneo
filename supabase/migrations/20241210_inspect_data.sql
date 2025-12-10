-- DATA INSPECTION SCRIPT
-- Run this in Supabase SQL Editor to see what is happening.

-- 1. Check if the Quiz exists and get its ID
SELECT id, slug, title, is_official FROM public.quizzes WHERE slug = 'allievi-marescialli-2024';

-- 2. Check if the User has any Attempts for this quiz
-- Replace 'allievi-marescialli-2024' with the slug or manually join
SELECT 
    qa.id as attempt_id, 
    qa.user_id, 
    p.nickname, 
    qa.score, 
    qa.created_at
FROM public.quiz_attempts qa
JOIN public.quizzes q ON qa.quiz_id = q.id
LEFT JOIN public.profiles p ON qa.user_id = p.id
WHERE q.slug = 'allievi-marescialli-2024'
ORDER BY qa.created_at DESC
LIMIT 5;

-- 3. Check concorso_leaderboard specifically
SELECT 
    cl.user_id, 
    p.nickname, 
    cl.score, 
    cl.quiz_id,
    q.slug as quiz_slug
FROM public.concorso_leaderboard cl
LEFT JOIN public.profiles p ON cl.user_id = p.id
JOIN public.quizzes q ON cl.quiz_id = q.id
WHERE q.slug = 'allievi-marescialli-2024';

-- 4. Check if there are any RLS violations (simulation)
-- (Cannot check RLS directly in SQL editor easily without switching role, 
-- but seeing data here PROVES it exists).
