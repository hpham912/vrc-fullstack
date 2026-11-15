-- Verse pool (Scripture Pool) — the admin's list of verses for the
-- daily scripture pick. The pool stores each verse's reference plus
-- its pastoral reflection and prayer (Vietnamese + English). The verse
-- TEXT is NOT stored here: it is fetched from the Bible API (NIV +
-- 1925) when the verse is picked, then saved as that day's row in
-- daily_verses together with the reflection/prayer copied from the
-- pool entry. Reflection and prayer are OPTIONAL (nullable) — a pool
-- verse with neither still works, and the daily card then shows just
-- the verse text. The pool holds at most 20 verses (enforced by the
-- API, not by the table): when it is full the admin must delete one
-- before adding a new one.
--
-- HOW TO RUN: Google Cloud Console → Cloud SQL → your PRODUCTION
-- database → Query tab → paste this whole file → Run. Run it once.
-- No migration runs at startup (the drizzle/ folder is empty), so
-- this file is the only way the live table gets created. The pool
-- endpoints (/api/verse-pool) only work after this table exists.
--
-- No change to daily_verses is needed: it already has every column
-- the picked verse uses (reference, verse text, translation,
-- reflection, prayer, theme, audit columns). Picked rows stay in
-- daily_verses — the 10-latest prune for verses is removed in code,
-- so old rows are kept and simply not displayed after the day passes.

CREATE TABLE IF NOT EXISTS verse_pool (
  id SERIAL PRIMARY KEY,
  reference TEXT NOT NULL,
  reference_vi TEXT,
  reference_en TEXT,
  reflection TEXT,
  reflection_vi TEXT,
  reflection_en TEXT,
  prayer TEXT,
  prayer_vi TEXT,
  prayer_en TEXT,
  created_by TEXT,
  updated_by TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
