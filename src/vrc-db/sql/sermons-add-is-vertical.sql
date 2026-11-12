-- Sermons: add the is_vertical column (Tall / Wide choice for
-- Facebook videos).
--
-- A Facebook link does not say whether the video is tall (vertical)
-- or wide (landscape) — a /reel/ link can hold a landscape video —
-- so the admin picks the shape when adding the sermon, and the
-- player uses this column to pick the frame (tall 9:16 or wide 16:9)
-- and the modal size. YouTube sermons are always wide (false).
--
-- HOW TO RUN: Google Cloud Console → Cloud SQL → your database →
-- Query tab → paste this whole file → Run. Run it once per database
-- (dev + prod). Safe to run again — IF NOT EXISTS skips it when the
-- column is already there. Run it BEFORE restarting Cloud Run: the
-- new code selects this column, so the sermons API breaks (500)
-- until the column exists.
-- Existing sermons default to false (wide), which is right for the
-- landscape videos already saved.

ALTER TABLE sermons
  ADD COLUMN IF NOT EXISTS is_vertical BOOLEAN NOT NULL DEFAULT FALSE;
