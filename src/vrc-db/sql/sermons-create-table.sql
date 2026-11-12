-- Sermons (Bài Giảng) — Sunday worship videos hosted on YouTube or
-- Facebook. The app stores NO video data: only the one video link,
-- the platform, bilingual title + description, and the Sunday worship
-- date. One video_url column serves every platform (a new platform
-- needs no new column); video_id is the YouTube video ID only, for
-- the thumbnail + embed, and is NULL for other platforms. Only the
-- last 2 months are kept — older sermons are pruned by the sermons
-- API, not by the table.
--
-- HOW TO RUN: Google Cloud Console → Cloud SQL → your PRODUCTION
-- database → Query tab → paste this whole file → Run. Run it once.
-- The sermons API (/api/sermons) only works after this table exists;
-- until then GET /api/sermons returns a 500 and the Bài Giảng tab
-- shows its empty state.
--
-- No migration runs at startup (the drizzle/ folder is empty), so this
-- file is the only way the live table gets created. For an existing
-- table, use sermons-video-url.sql instead (it migrates the old
-- youtube_url / facebook_url columns into video_url).

CREATE TABLE IF NOT EXISTS sermons (
  id SERIAL PRIMARY KEY,
  platform TEXT NOT NULL DEFAULT 'youtube',
  video_url TEXT NOT NULL,
  video_id TEXT,
  is_vertical BOOLEAN NOT NULL DEFAULT FALSE,
  title_vi TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_vi TEXT,
  description_en TEXT,
  date TEXT NOT NULL,
  created_by TEXT,
  updated_by TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT sermons_platform_check CHECK (platform IN ('youtube', 'facebook'))
);
