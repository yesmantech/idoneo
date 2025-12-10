-- Migration: Seed Quizzes, Subjects, and Questions (Safe Idempotent Version)

-- 1. Ensure Categories
INSERT INTO public.categories (slug, title, description)
SELECT 'forze-armate', 'Forze Armate', 'Concorsi per Esercito, Marina, Aeronautica, Carabinieri'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'forze-armate');

-- 2. Ensure Roles
INSERT INTO public.roles (slug, title, category_id)
SELECT 'allievi-marescialli', 'Allievi Marescialli', id 
FROM public.categories 
WHERE slug = 'forze-armate'
AND NOT EXISTS (SELECT 1 FROM public.roles WHERE slug = 'allievi-marescialli');

-- 3. Create Quiz
INSERT INTO public.quizzes (slug, title, description, role_id, year, is_official, time_limit, points_correct, points_wrong, points_blank)
SELECT 
    'allievi-marescialli-2024', 
    'Allievi Marescialli Guardia di Finanza 2024', 
    'Simulazione ufficiale per il concorso 2024.',
    id,
    2024,
    true,
    60,
    1.0, 
    -0.25,
    0.0
FROM public.roles 
WHERE slug = 'allievi-marescialli'
AND NOT EXISTS (SELECT 1 FROM public.quizzes WHERE slug = 'allievi-marescialli-2024');

-- 4. Create Subjects
INSERT INTO public.subjects (name, quiz_id)
SELECT 'Cultura Generale', id
FROM public.quizzes 
WHERE slug = 'allievi-marescialli-2024'
AND NOT EXISTS (
    SELECT 1 FROM public.subjects s 
    JOIN public.quizzes q ON s.quiz_id = q.id 
    WHERE s.name = 'Cultura Generale' AND q.slug = 'allievi-marescialli-2024'
);

INSERT INTO public.subjects (name, quiz_id)
SELECT 'Sintassi Italiana', id
FROM public.quizzes 
WHERE slug = 'allievi-marescialli-2024'
AND NOT EXISTS (
    SELECT 1 FROM public.subjects s 
    JOIN public.quizzes q ON s.quiz_id = q.id 
    WHERE s.name = 'Sintassi Italiana' AND q.slug = 'allievi-marescialli-2024'
);

-- 5. Create Questions
INSERT INTO public.questions (text, option_a, option_b, option_c, option_d, correct_option, subject_id, quiz_id)
SELECT 
    'Chi ha scritto i Promessi Sposi?',
    'Giovanni Verga',
    'Alessandro Manzoni',
    'Dante Alighieri',
    'Ugo Foscolo',
    'b',
    s.id,
    q.id
FROM public.subjects s, public.quizzes q
WHERE s.name = 'Cultura Generale' AND q.slug = 'allievi-marescialli-2024'
AND NOT EXISTS (
    SELECT 1 FROM public.questions qs 
    WHERE qs.text = 'Chi ha scritto i Promessi Sposi?' AND qs.quiz_id = q.id
);

INSERT INTO public.questions (text, option_a, option_b, option_c, option_d, correct_option, subject_id, quiz_id)
SELECT 
    'Qual è la capitale della Francia?',
    'Berlino',
    'Londra',
    'Madrid',
    'Parigi',
    'd',
    s.id,
    q.id
FROM public.subjects s, public.quizzes q
WHERE s.name = 'Cultura Generale' AND q.slug = 'allievi-marescialli-2024'
AND NOT EXISTS (
    SELECT 1 FROM public.questions qs 
    WHERE qs.text = 'Qual è la capitale della Francia?' AND qs.quiz_id = q.id
);

-- 6. Add Rules
INSERT INTO public.quiz_subject_rules (quiz_id, subject_id, question_count)
SELECT q.id, s.id, 2
FROM public.subjects s, public.quizzes q
WHERE s.name = 'Cultura Generale' AND q.slug = 'allievi-marescialli-2024'
AND NOT EXISTS (
    SELECT 1 FROM public.quiz_subject_rules r 
    WHERE r.quiz_id = q.id AND r.subject_id = s.id
);

INSERT INTO public.quiz_subject_rules (quiz_id, subject_id, question_count)
SELECT q.id, s.id, 3
FROM public.subjects s, public.quizzes q
WHERE s.name = 'Sintassi Italiana' AND q.slug = 'allievi-marescialli-2024'
AND NOT EXISTS (
    SELECT 1 FROM public.quiz_subject_rules r 
    WHERE r.quiz_id = q.id AND r.subject_id = s.id
);
