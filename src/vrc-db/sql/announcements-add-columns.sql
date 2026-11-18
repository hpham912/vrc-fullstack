-- Announcements revival (Nov 2026) — the global red banner under the
-- header. The `announcements` table already exists in the schema but
-- was never used, so this file only adds the columns the banner
-- needs:
--   `content_en` — the English message (shown when the app language
--     is English; falls back to `content` when empty).
--   `updated_at` — set on every edit, so GET /api/sync can tell the
--     app an announcement changed and the banner live-updates.
--   `starts_at` / `ends_at` — the window the banner shows the row in
--     (TIMESTAMPTZ, so the comparison against NOW() is timezone-safe).
--     NULL start means "from now"; NULL end means "until turned off".
--     Rows past their `ends_at` are deleted by the GET route, so
--     finished announcements never pile up in the table.
--
-- HOW TO RUN: Google Cloud Console → Cloud SQL → your PRODUCTION
-- database → Query tab → paste this whole file → Run. Run it once.
-- Also run it in the DEV database if you test the banner there.
-- No migration runs at startup (the drizzle/ folder is empty), so
-- this file is the only way the live columns get added. The banner
-- and the Announcements tab only work after these columns exist.
--
-- The CREATE TABLE is a guard: if the table is somehow missing in a
-- database, it is created with the full final shape; if it already
-- exists (the normal case — it has 0 rows), the statement is a no-op
-- and only the two ADD COLUMNs apply.

CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_en TEXT,
  priority TEXT NOT NULL DEFAULT 'normal',
  link_url TEXT,
  link_text TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE announcements ADD COLUMN IF NOT EXISTS content_en TEXT;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ;

-- Existing rows (if any) get an updated time so the sync signal has a
-- value to compare; without it MAX(updated_at) would be NULL.
UPDATE announcements
SET updated_at = COALESCE(updated_at, created_at, NOW())
WHERE updated_at IS NULL;
