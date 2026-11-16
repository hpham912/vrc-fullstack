-- Verse pool monthly columns — add `month` (YYYY-MM) and `source`
-- ('upload' or 'manual') to verse_pool, for the monthly verse upload
-- (Nov 2026). The daily pick draws only from the current month's
-- pool verses, and a verse is deleted from the pool once it is
-- picked, so the pool is scoped by month.
--
-- HOW TO RUN: Google Cloud Console → Cloud SQL → your PRODUCTION
-- database → Query tab → paste this whole file → Run. Run it once.
-- Also run it in the DEV database if you test the upload there.
-- No migration runs at startup (the drizzle/ folder is empty), so
-- this file is the only way the live columns get added. The upload
-- endpoints (/api/verse-pool/upload) only work after these columns
-- exist.
--
-- Backfill: existing pool verses (added before months existed) are
-- assigned to the CURRENT month, so the pool keeps working and the
-- daily pick (which filters by current month) still finds them.
-- New verses get their month from the upload form or the manual Add
-- form. The `source` of existing rows is set to 'manual'.

ALTER TABLE verse_pool ADD COLUMN IF NOT EXISTS month TEXT;
ALTER TABLE verse_pool ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- Backfill existing rows to the current month (Phoenix time, so the
-- month matches the verse-day the app uses).
UPDATE verse_pool
SET month = to_char((CURRENT_TIMESTAMP AT TIME ZONE 'America/Phoenix'), 'YYYY-MM')
WHERE month IS NULL;

UPDATE verse_pool
SET source = 'manual'
WHERE source IS NULL;

-- Index the month so the daily pick (current month only) and the
-- admin pool list (filtered by month) stay fast as the pool grows.
CREATE INDEX IF NOT EXISTS verse_pool_month_idx ON verse_pool (month);
