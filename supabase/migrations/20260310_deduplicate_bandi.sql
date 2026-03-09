-- ================================================
-- Migration: 20260310_deduplicate_bandi.sql
-- Description: Remove existing duplicate bandi and prevent future duplicates
-- ================================================

-- ================================================
-- 1. NORMALIZE FUNCTION (persistent, used by trigger)
-- ================================================
CREATE OR REPLACE FUNCTION normalize_bando_title(title TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN trim(
        regexp_replace(
            regexp_replace(
                regexp_replace(
                    regexp_replace(
                        lower(title),
                        '^\d+\s*', '', 'g'          -- strip leading numbers
                    ),
                    '\s*[-–—]\s*', ' ', 'g'          -- all dashes → space
                ),
                '\y20\d{2}\y', '', 'g'               -- strip year references
            ),
            '\s+', ' ', 'g'                          -- collapse whitespace
        )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ================================================
-- 2. ADD normalized_title COLUMN for index
-- ================================================
ALTER TABLE public.bandi ADD COLUMN IF NOT EXISTS normalized_title TEXT;

-- Populate normalized_title for all existing rows
UPDATE public.bandi 
SET normalized_title = normalize_bando_title(COALESCE(short_title, title))
WHERE normalized_title IS NULL;

-- ================================================
-- 3. DELETE EXISTING DUPLICATES (keep earliest deadline per normalized_title)
-- ================================================
-- First, identify the "winner" for each group of duplicates (earliest deadline)
-- Then delete all others
DELETE FROM public.bandi
WHERE id IN (
    SELECT b.id
    FROM public.bandi b
    INNER JOIN (
        -- For each normalized_title, find the winner (earliest deadline)
        SELECT DISTINCT ON (normalized_title) id AS winner_id, normalized_title
        FROM public.bandi
        WHERE status = 'published'
        ORDER BY normalized_title, deadline ASC
    ) winners ON b.normalized_title = winners.normalized_title
    WHERE b.id != winners.winner_id
      AND b.status = 'published'
      AND b.normalized_title IS NOT NULL
      AND b.normalized_title != ''
);

-- ================================================
-- 4. UNIQUE INDEX on normalized_title (prevents future duplicates)
-- ================================================
-- Only enforce for published bandi (drafts can have duplicate titles)
CREATE UNIQUE INDEX IF NOT EXISTS idx_bandi_unique_normalized_title
ON public.bandi (normalized_title) 
WHERE status = 'published' AND normalized_title IS NOT NULL AND normalized_title != '';

-- ================================================
-- 5. TRIGGER: auto-populate normalized_title on INSERT/UPDATE
-- ================================================
CREATE OR REPLACE FUNCTION set_bando_normalized_title()
RETURNS TRIGGER AS $$
BEGIN
    NEW.normalized_title := normalize_bando_title(COALESCE(NEW.short_title, NEW.title));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER bandi_normalize_title_trigger
    BEFORE INSERT OR UPDATE OF title, short_title ON public.bandi
    FOR EACH ROW EXECUTE FUNCTION set_bando_normalized_title();
