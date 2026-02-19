-- Truncate the bandi table to remove all existing records
TRUNCATE TABLE bandi CASCADE;

-- Also clear the debug logs to have a clean slate
TRUNCATE TABLE debug_logs;
