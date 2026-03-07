-- Add short_title column for AI-generated concise bando titles
ALTER TABLE public.bandi ADD COLUMN IF NOT EXISTS short_title TEXT;

-- Index for potential searches
CREATE INDEX IF NOT EXISTS idx_bandi_short_title ON public.bandi(short_title);
