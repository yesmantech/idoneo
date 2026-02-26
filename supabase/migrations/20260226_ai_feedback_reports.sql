-- Add report_type to question_reports to support AI feedback alongside question reports
ALTER TABLE public.question_reports
    ADD COLUMN IF NOT EXISTS report_type text DEFAULT 'question' CHECK (report_type IN ('question', 'ai_feedback'));

-- Make question_id nullable so AI feedback (which has no question) can be inserted
ALTER TABLE public.question_reports
    ALTER COLUMN question_id DROP NOT NULL;

-- Add an index on the new column for filtering
CREATE INDEX IF NOT EXISTS idx_question_reports_type ON public.question_reports(report_type);
