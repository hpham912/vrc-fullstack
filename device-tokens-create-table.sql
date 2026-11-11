-- Push notification device tokens (FCM, Android only for now).
-- Run this ONCE in the Cloud SQL Query tab, on the PRODUCTION database
-- (cloud_sql_production_database). No data to copy — the table starts
-- empty and phones register themselves when the app opens.
-- Re-running it is safe.

CREATE TABLE IF NOT EXISTS device_tokens (
  id serial PRIMARY KEY,
  token text NOT NULL UNIQUE,
  platform text NOT NULL DEFAULT 'android',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Verify (should show 0 rows until a phone registers):
-- SELECT count(*) FROM device_tokens;
