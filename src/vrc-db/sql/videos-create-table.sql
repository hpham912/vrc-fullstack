-- Videos (Video tab) — sermon videos, singings, reels about the
-- church, and any other video. Hosted on YouTube or Facebook. The
-- app stores NO video data: only the one video link, the platform,
-- bilingual title + description, the category, the presenter, and
-- the date. One video_url column serves every platform (a new
-- platform needs no new column); video_id is the YouTube video ID
-- only, for the thumbnail + embed, and is NULL for other platforms.
-- The category is plain TEXT with NO check constraint, on purpose:
-- an admin can type any custom category name in the video form, so
-- the database must not restrict it to a fixed list. Only the last
-- 2 months are kept — older videos are pruned by the videos API,
-- not by the table.
--
-- HOW TO RUN: Google Cloud Console → Cloud SQL → your PRODUCTION
-- database → Query tab → paste this whole file → Run. Run it once.
-- The videos API (/api/videos) only works after this table exists;
-- until then GET /api/videos returns a 500 and the Video tab shows
-- its empty state.
--
-- No migration runs at startup (the drizzle/ folder is empty), so this
-- file is the only way the live table gets created. For an existing
-- sermons table, use videos-rename-and-category.sql instead (it
-- renames sermons to videos and adds the category + presenter
-- columns).

CREATE TABLE IF NOT EXISTS videos (
  id SERIAL PRIMARY KEY,
  platform TEXT NOT NULL DEFAULT 'youtube',
  video_url TEXT NOT NULL,
  video_id TEXT,
  is_vertical BOOLEAN NOT NULL DEFAULT FALSE,
  category TEXT NOT NULL DEFAULT 'sermon',
  presenter TEXT,
  title_vi TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_vi TEXT,
  description_en TEXT,
  date TEXT NOT NULL,
  created_by TEXT,
  updated_by TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT videos_platform_check CHECK (platform IN ('youtube', 'facebook'))
);
