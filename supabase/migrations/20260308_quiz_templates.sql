-- Quiz Templates: persistent storage for custom quiz configurations
-- Replaces localStorage-based template system

CREATE TABLE IF NOT EXISTS quiz_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    subject_selections JSONB NOT NULL DEFAULT '{}',
    selection_mode TEXT NOT NULL DEFAULT 'random',
    time_hours INTEGER NOT NULL DEFAULT 0,
    time_minutes INTEGER NOT NULL DEFAULT 30,
    time_seconds INTEGER NOT NULL DEFAULT 0,
    no_time_limit BOOLEAN NOT NULL DEFAULT false,
    scoring JSONB NOT NULL DEFAULT '{"correct": 1, "wrong": 0, "blank": 0}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, quiz_id)
);

-- RLS
ALTER TABLE quiz_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own templates"
    ON quiz_templates FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates"
    ON quiz_templates FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
    ON quiz_templates FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
    ON quiz_templates FOR DELETE
    USING (auth.uid() = user_id);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_quiz_templates_user_quiz ON quiz_templates(user_id, quiz_id);
