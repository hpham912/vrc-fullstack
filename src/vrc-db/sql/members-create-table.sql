-- Members table (registered app users, view-only).
-- Run this in the Cloud SQL Query tab (dev + prod), then restart the server.
-- A member registers with phone + password; the phone is verified
-- with a 6-digit code sent by SMS (Twilio). Email is OPTIONAL —
-- collected for contact only, never verified and never used to send codes.
-- Login is by phone number OR email + password.
-- Role is always 'member' — members can only view, never administer.
CREATE TABLE IF NOT EXISTS members (
  id SERIAL PRIMARY KEY,
  phone TEXT NOT NULL UNIQUE, -- E.164, e.g. +14805550199
  email TEXT UNIQUE, -- lowercased, optional (nullable)
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  role TEXT NOT NULL DEFAULT 'member',
  last_login_at TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
