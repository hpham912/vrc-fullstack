-- Sermons (Bài Giảng) — Sunday worship videos hosted on YouTube.
-- The app stores NO video data: only the YouTube link / video ID,
-- bilingual title + description, and the Sunday worship date.
--
-- HOW TO RUN: Google Cloud Console → Cloud SQL → your PRODUCTION
-- database → Query tab → paste this whole file → Run. Run it once.
-- The sermons API (/api/sermons) only works after this table exists;
-- until then GET /api/sermons returns a 500 and the Bài Giảng tab
-- shows its empty state.
--
-- No migration runs at startup (the drizzle/ folder is empty), so this
-- file is the only way the live table gets created.

CREATE TABLE IF NOT EXISTS sermons (
  id SERIAL PRIMARY KEY,
  youtube_url TEXT NOT NULL,
  video_id TEXT NOT NULL,
  title_vi TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_vi TEXT,
  description_en TEXT,
  date TEXT NOT NULL,
  created_by TEXT,
  updated_by TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
