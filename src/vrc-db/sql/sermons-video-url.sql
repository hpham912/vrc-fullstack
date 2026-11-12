-- Sermons (Bài Giảng) — one video_url column for every platform.
-- REPLACES sermons-add-facebook.sql: do NOT run that file, run this
-- one instead. A new platform (Instagram, TikTok, ...) needs no new
-- column — just a new platform value + its player. video_id stays,
-- but only for YouTube (the thumbnail + embed need it); other
-- platforms have no such ID, so it is NULL for them.
--
-- HOW TO RUN: Google Cloud Console → Cloud SQL → your PRODUCTION
-- database → Query tab → paste this whole file → Run. Run it once.
-- It works whether or not sermons-add-facebook.sql was already run:
-- existing YouTube sermons keep their link + video ID, and any
-- Facebook sermons already saved keep their link too.
--
-- No migration runs at startup (the drizzle/ folder is empty), so this
-- file is the only way the live table gets the new column.

-- Which platform a sermon is on. Existing rows default to 'youtube'.
ALTER TABLE sermons
  ADD COLUMN IF NOT EXISTS platform TEXT NOT NULL DEFAULT 'youtube';

-- The one video link, for every platform.
ALTER TABLE sermons
  ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Backfill video_url from whichever URL column the table has. (The
-- Facebook migration may or may not have run yet, so the facebook_url
-- column may or may not exist.)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sermons' AND column_name = 'facebook_url'
  ) THEN
    UPDATE sermons
      SET video_url = COALESCE(youtube_url, facebook_url)
      WHERE video_url IS NULL;
  ELSE
    UPDATE sermons
      SET video_url = youtube_url
      WHERE video_url IS NULL;
  END IF;
END $$;

ALTER TABLE sermons
  ALTER COLUMN video_url SET NOT NULL;

-- The per-platform URL columns are gone now; the platform tells the
-- app how to read video_url.
ALTER TABLE sermons
  DROP COLUMN IF EXISTS youtube_url;
ALTER TABLE sermons
  DROP COLUMN IF EXISTS facebook_url;

-- Keep the platform to the two the app knows.
ALTER TABLE sermons
  DROP CONSTRAINT IF EXISTS sermons_platform_check;
ALTER TABLE sermons
  ADD CONSTRAINT sermons_platform_check
  CHECK (platform IN ('youtube', 'facebook'));
