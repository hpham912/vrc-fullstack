-- Email verification codes (registration + forgot password).
-- Run this in the Cloud SQL Query tab (dev + prod), then restart the server.
-- Only the code hash is stored — the plain code is never saved.
-- A code is valid for 10 minutes and at most 5 verification attempts.
CREATE TABLE IF NOT EXISTS email_verifications (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL, -- lowercased
  code_hash TEXT NOT NULL,
  code_salt TEXT NOT NULL,
  purpose TEXT NOT NULL, -- 'register' | 'reset'
  expires_at TIMESTAMP NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
