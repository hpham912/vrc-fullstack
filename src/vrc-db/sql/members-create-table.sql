-- Members table (registered app users, view-only).
-- Run this in the Cloud SQL Query tab (dev + prod), then restart the server.
-- A member registers with phone + email + password; the email is verified
-- with a 6-digit code. Login is by phone number OR email + password.
-- Role is always 'member' — members can only view, never administer.
CREATE TABLE IF NOT EXISTS members (
  id SERIAL PRIMARY KEY,
  phone TEXT NOT NULL UNIQUE, -- E.164, e.g. +14805550199
  email TEXT NOT NULL UNIQUE, -- lowercased
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  role TEXT NOT NULL DEFAULT 'member',
  last_login_at TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
