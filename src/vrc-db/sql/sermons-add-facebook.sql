-- Sermons (Bài Giảng) — add Facebook video support alongside YouTube.
-- The app stores NO video data: only the link, the platform
-- (youtube / facebook), bilingual title + description, and the Sunday
-- worship date.
--
-- HOW TO RUN: Google Cloud Console → Cloud SQL → your PRODUCTION
-- database → Query tab → paste this whole file → Run. Run it once.
-- Existing YouTube sermons keep working: they get platform='youtube'
-- automatically (the DEFAULT), and their link + video ID are untouched.
-- The Facebook player only works after this runs; until then saving a
-- Facebook sermon fails with a database error.
--
-- No migration runs at startup (the drizzle/ folder is empty), so this
-- file is the only way the live table gets the new columns.

-- Which platform a sermon is on. Existing rows default to 'youtube'.
ALTER TABLE sermons
  ADD COLUMN IF NOT EXISTS platform TEXT NOT NULL DEFAULT 'youtube';

-- The Facebook video link (only for platform='facebook').
ALTER TABLE sermons
  ADD COLUMN IF NOT EXISTS facebook_url TEXT;

-- A Facebook sermon has no YouTube link or video ID, so those two
-- columns must allow NULL now. Existing YouTube rows keep their values.
ALTER TABLE sermons
  ALTER COLUMN youtube_url DROP NOT NULL;
ALTER TABLE sermons
  ALTER COLUMN video_id DROP NOT NULL;

-- Keep the platform to the two the app knows.
ALTER TABLE sermons
  ADD CONSTRAINT sermons_platform_check
  CHECK (platform IN ('youtube', 'facebook'));
