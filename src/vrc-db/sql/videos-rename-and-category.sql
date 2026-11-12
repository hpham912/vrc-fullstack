-- Videos (was Sermons / Bài Giảng): rename the table and add the
-- category column, plus the presenter column.
--
-- The Video tab now holds every kind of video, not just sermons:
-- sermons, singings, reels about the church, and anything else.
-- Each video has a category — 'sermon', 'singing', 'reel', 'other',
-- or a custom name the admin typed in the video form. The column is
-- plain TEXT with NO check constraint, on purpose: a custom category
-- is any string the admin types, so the database must not restrict
-- it to a fixed list. The presenter is who presents the video
-- (the pastor for a sermon, the choir / singer for a singing) and
-- is blank for reels.
--
-- HOW TO RUN: Google Cloud Console → Cloud SQL → your database →
-- Query tab → paste this whole file → Run. Run it once per database
-- (dev + prod). Run it BEFORE restarting Cloud Run: the new code
-- selects from the videos table and reads the category + presenter
-- columns, so the videos API breaks (500) until this has run.
-- Existing videos default to category 'sermon', which is right for
-- the sermons already saved.
--
-- ORDER: run this AFTER the two already-pending steps, in this
-- order: (1) ALTER TABLE sermons ALTER COLUMN video_id DROP NOT
-- NULL; (2) sermons-add-is-vertical.sql; (3) THIS file. Steps 1–2
-- must run while the table is still named sermons — this file
-- renames it to videos, so running it first would break them.
--
-- Safe to run again: the rename is guarded by an information_schema
-- check (a plain RENAME would fail the second time, once the
-- sermons table is gone), and the ADD COLUMNs use IF NOT EXISTS.
-- NOTE: the platform check constraint keeps its old name
-- sermons_platform_check after the rename — harmless, it is still
-- enforced; renaming it is cosmetic only.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sermons') THEN
    ALTER TABLE sermons RENAME TO videos;
  END IF;
END $$;

ALTER TABLE videos
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'sermon';

ALTER TABLE videos
  ADD COLUMN IF NOT EXISTS presenter TEXT;
