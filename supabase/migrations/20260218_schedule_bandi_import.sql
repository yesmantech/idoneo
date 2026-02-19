-- ================================================
-- Migration: 20260218_schedule_bandi_import.sql
-- Description: Enable pg_cron and schedule daily bando import
-- ================================================

-- 1. Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Schedule the Daily Import (Every day at 04:00 AM UTC)
-- This calls the 'import-bandi' edge function
-- We use a wrapper to handle the request
SELECT cron.schedule(
  'daily-bandi-import',
  '0 4 * * *',
  $$
  SELECT net.http_post(
    url := 'https://yansgitqqrcovwukvpfm.supabase.co/functions/v1/import-bandi',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbnNnaXRxcXJjb3Z3dWt2cGZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNzQ5NzcsImV4cCI6MjA3OTY1MDk3N30.TbLgWITo0hvw1Vl9OY-Y_hbrU-y6cfKEnkMZhvG9bcQ"}'::jsonb,
    body := '{}'::jsonb
  )
  $$
);
