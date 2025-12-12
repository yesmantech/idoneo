-- Migration: Add mode column to quiz_attempts table
-- This column tracks the type of quiz attempt (custom, official, simulation)

ALTER TABLE quiz_attempts 
ADD COLUMN IF NOT EXISTS mode TEXT;

-- Add a comment for documentation
COMMENT ON COLUMN quiz_attempts.mode IS 'Attempt type: custom (prova personalizzata), official (simulazione esame), or simulation';
