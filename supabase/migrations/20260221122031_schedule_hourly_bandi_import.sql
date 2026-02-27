-- ================================================
-- Migration: 20260221_schedule_hourly_bandi_import.sql
-- Description: Unschedule old daily import and replace with hourly short-batch import
-- ================================================

-- 1. Unschedule the old daily operation to avoid conflicts
SELECT cron.unschedule('daily-bandi-import');

-- 2. Schedule the new Hourly Import (Every hour exactly on the hour: 00:00, 01:00, 02:00, etc.)
SELECT cron.schedule(
  'hourly-bandi-import',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://yansgitqqrcovwukvpfm.supabase.co/functions/v1/import-bandi',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbnNnaXRxcXJjb3Z3dWt2cGZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNzQ5NzcsImV4cCI6MjA3OTY1MDk3N30.TbLgWITo0hvw1Vl9OY-Y_hbrU-y6cfKEnkMZhvG9bcQ"}'::jsonb,
    body := '{}'::jsonb
  )
  $$
);
