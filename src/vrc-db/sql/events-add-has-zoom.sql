-- Events — add the Zoom flag used by the shared Zoom button.
--
-- HOW TO RUN: Google Cloud Console → Cloud SQL → your PRODUCTION
-- database → Query tab → paste this whole file → Run. Run it once.
-- The Zoom button on an event only works after this column exists;
-- until then, saving an event with Zoom on will fail (the column is
-- missing) and the button will not show.
--
-- No migration runs at startup (the drizzle/ folder is empty), so this
-- file is the only way the live column gets created. Existing events
-- get has_zoom = false (no Zoom button) by default.

ALTER TABLE events ADD COLUMN IF NOT EXISTS has_zoom BOOLEAN NOT NULL DEFAULT FALSE;
