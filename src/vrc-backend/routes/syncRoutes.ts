import { Router } from 'express';
import { db } from '../../vrc-db/index.ts';
import { events, dailyVerses, videos, notifications, churchInfo, spotlight } from '../../vrc-db/schema.ts';
import { count, max } from 'drizzle-orm';

const router = Router();

// GET /api/sync — the app's "what changed" check. Returns, for each
// collection the app shows, the row count and the latest change time,
// so the app can tell what changed since it last loaded without
// re-fetching everything.
//   { events: { count: 4, updatedAt: "2026-11-13T21:58:27.000Z" }, ... }
//
// Public (no admin needed) — it only exposes counts and timestamps,
// never any content. The app polls this (every 30s + on foreground /
// tab switch) and re-fetches only the collections whose numbers moved.
//
// Change signals, per collection:
// - events / verses / videos / churchInfo / spotlight: MAX(updated_at).
//   The write routes set updatedAt on every save, so an edit moves it.
// - notifications: MAX(created_at). Notifications are never edited
//   (only created and deleted), so the newest created time is the
//   right signal. The row count catches deletions for every table.
// Every table has a created_at column, so no migration was needed.
router.get('/', async (_req, res) => {
  try {
    const [eventsRow, versesRow, videosRow, notifsRow, churchInfoRow, spotlightRow] = await Promise.all([
      db.select({ count: count(), updatedAt: max(events.updatedAt) }).from(events),
      db.select({ count: count(), updatedAt: max(dailyVerses.updatedAt) }).from(dailyVerses),
      db.select({ count: count(), updatedAt: max(videos.updatedAt) }).from(videos),
      db.select({ count: count(), updatedAt: max(notifications.createdAt) }).from(notifications),
      db.select({ count: count(), updatedAt: max(churchInfo.updatedAt) }).from(churchInfo),
      db.select({ count: count(), updatedAt: max(spotlight.updatedAt) }).from(spotlight),
    ]);

    const toEntry = (row: { count: number; updatedAt: Date | null }) => ({
      count: row.count,
      updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
    });

    res.json({
      events: toEntry(eventsRow[0]),
      verses: toEntry(versesRow[0]),
      videos: toEntry(videosRow[0]),
      notifications: toEntry(notifsRow[0]),
      churchInfo: toEntry(churchInfoRow[0]),
      spotlight: toEntry(spotlightRow[0]),
    });
  } catch (err) {
    console.error('GET /api/sync failed:', err);
    res.status(500).json({ error: 'Failed to check for updates' });
  }
});

export default router;
