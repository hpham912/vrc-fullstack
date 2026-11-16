-- Migrate member registration from email codes to SMS codes (Twilio).
-- Run this in the Cloud SQL Query tab (dev + prod), then restart the server.
-- The email verification system is removed: codes now go by SMS to the
-- member's phone, and email is an optional contact field (never verified,
-- never used to send codes). Safe to re-run: every statement is guarded
-- (IF NOT EXISTS / IF EXISTS / DROP NOT NULL is idempotent).
--
-- ENVIRONMENT VARIABLES (Cloud Run Variables & Secrets):
--   REMOVE (no longer used — the email code system is gone):
--     SMTP_USER, SMTP_PASS, SMTP_FROM
--   The Twilio credentials are NOT env vars — they live in the
--   church_info document (see twilio-config-set-values.sql). Env
--   vars TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER
--   still work as a fallback when they are set.
--
-- members: email becomes optional (nullable); email_verified is replaced
-- by phone_verified. Existing rows (if any) get phone_verified = FALSE —
-- they would need to re-verify by SMS, but no member has registered yet
-- (registration never went live with email codes).
ALTER TABLE members ALTER COLUMN email DROP NOT NULL;
ALTER TABLE members ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE members DROP COLUMN IF EXISTS email_verified;

-- The email codes table is obsolete — codes are now keyed by phone.
DROP TABLE IF EXISTS email_verifications;

-- The phone codes table (same shape as the old email one, keyed by phone).
CREATE TABLE IF NOT EXISTS phone_verifications (
  id SERIAL PRIMARY KEY,
  phone TEXT NOT NULL, -- E.164, e.g. +14805550199
  code_hash TEXT NOT NULL,
  code_salt TEXT NOT NULL,
  purpose TEXT NOT NULL, -- 'register' | 'reset'
  expires_at TIMESTAMP NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
