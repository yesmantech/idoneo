-- ================================================
-- AI Chat History Persistence
-- Migration: 20260225_ai_chat_history.sql
-- ================================================

-- Single row per user storing the full conversation as JSONB
CREATE TABLE IF NOT EXISTS ai_chat_messages (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    messages JSONB NOT NULL DEFAULT '[]',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own chat history
CREATE POLICY "Users manage own chat history" ON ai_chat_messages
    FOR ALL USING (auth.uid() = user_id);

-- Index on user_id (already PK, but explicit for clarity)
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_updated ON ai_chat_messages(updated_at DESC);
