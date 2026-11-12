import { Router } from 'express';
import { db } from '../../vrc-db/index.ts';
import { sermons } from '../../vrc-db/schema.ts';
import { eq, desc, lt } from 'drizzle-orm';
import { requireAdmin, AuthRequest } from '../middleware/authMiddleware.ts';
import { extractYouTubeVideoId } from '../../vrc-shared/utils/youtube.ts';
import { extractFacebookVideoUrl } from '../../vrc-shared/utils/facebook.ts';

const router = Router();

// Keep only the last 2 months of sermons: delete anything older than
// 2 months before today. The sermon date is a YYYY-MM-DD string, so a
// plain string comparison orders it correctly. Runs on every list read
// and after every save (same pattern as the verses 10-latest prune),
// so the table never holds a video older than 2 months.
async function pruneSermonsOlderThanTwoMonths() {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 2);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  await db.delete(sermons).where(lt(sermons.date, cutoffStr));
}

// A Facebook share link (/share/v/<code>, /share/r/<code>) or fb.watch
// short link is a redirect that only resolves in a real browser — the
// video embed plugin cannot play it, so it shows "Video Unavailable"
// even though the video itself is public and "Watch on Facebook"
// works. The share page carries the real video URL in its og:url /
// canonical link, so resolve the pasted link to that URL before
// storing it. Any public Facebook video works (Reel, watch page,
// video, or a post holding one) — a share link that does not resolve
// to a valid video URL, or cannot be fetched at all, returns null, so
// the save is rejected instead of storing a link the embed cannot
// play. A direct video link passes through untouched. A 5s timeout
// keeps a slow Facebook from stalling the save.
async function resolveFacebookVideoUrl(videoUrl: string): Promise<string | null> {
  let parsed: URL;
  try {
    parsed = new URL(videoUrl);
  } catch {
    return null;
  }
  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  const path = parsed.pathname;
  const isShareLink =
    (host === 'facebook.com' || host === 'm.facebook.com') &&
    /^\/share\/[vr]\/[\w-]+/.test(path);
  const isShortLink = host === 'fb.watch';
  // A direct video link needs no resolving.
  if (!isShareLink && !isShortLink) {
    return extractFacebookVideoUrl(videoUrl) ? videoUrl : null;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(videoUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      },
      redirect: 'follow',
    });
    clearTimeout(timeout);
    if (!response.ok) return null;
    const html = await response.text();
    // og:url and the canonical link both carry the real video URL.
    // Either attribute may come first, so both orders are matched.
    const ogMatch =
      html.match(/property=["']og:url["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/content=["']([^"']+)["'][^>]*property=["']og:url["']/i);
    const canonicalMatch =
      html.match(/rel=["']canonical["'][^>]*href=["']([^"']+)["']/i) ||
      html.match(/href=["']([^"']+)["'][^>]*rel=["']canonical["']/i);
    const resolved = ogMatch?.[1] || canonicalMatch?.[1];
    if (resolved && extractFacebookVideoUrl(resolved)) {
      return resolved;
    }
    return null;
  } catch {
    return null;
  }
}

// GET /api/sermons - List all sermons from the active database (Dev DB or
// Prod DB), newest Sunday first. Only the last 2 months are kept —
// anything older is deleted by the prune below.
router.get('/', async (_req, res) => {
  try {
    await pruneSermonsOlderThanTwoMonths();
    const allSermons = await db
      .select()
      .from(sermons)
      .orderBy(desc(sermons.date), desc(sermons.id));
    res.json(allSermons);
  } catch (error: any) {
    console.error('Failed to fetch sermons from PostgreSQL:', error);
    res.status(500).json({ error: error?.message || 'Failed to retrieve sermons from database' });
  }
});

// GET /api/sermons/:id - Get single sermon from PostgreSQL
router.get('/:id', async (req, res) => {
  try {
    const sermonId = Number(req.params.id);
    if (isNaN(sermonId)) {
      return res.status(400).json({ error: 'Invalid sermon ID' });
    }

    const sermonResult = await db.select().from(sermons).where(eq(sermons.id, sermonId)).limit(1);

    if (sermonResult.length === 0) {
      return res.status(404).json({ error: 'Sermon not found' });
    }

    res.json(sermonResult[0]);
  } catch (error: any) {
    console.error('Failed to fetch sermon from PostgreSQL:', error);
    res.status(500).json({ error: error?.message || 'Failed to fetch sermon details' });
  }
});

// POST /api/sermons - Create new sermon in PostgreSQL (Admin only).
// The video lives on YouTube or Facebook — only the link, the
// platform, bilingual title + description, and the Sunday date are
// stored. videoUrl is the one link for every platform; videoId is the
// YouTube video ID (for the thumbnail + embed) and is null for other
// platforms, which have no such ID. isVertical is the admin's
// Tall/Wide pick for a Facebook video (a link does not say which it
// is); YouTube sermons are always wide.
router.post('/', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const {
      platform,
      videoUrl,
      titleVi,
      titleEn,
      descriptionVi,
      descriptionEn,
      date,
      isVertical,
    } = req.body;

    const finalPlatform = platform === 'facebook' ? 'facebook' : 'youtube';
    const finalIsVertical = finalPlatform === 'facebook' ? Boolean(isVertical) : false;
    let cleanVideoUrl = String(videoUrl || '').trim();
    const finalTitleVi = String(titleVi || '').trim();
    const finalTitleEn = String(titleEn || '').trim();
    const finalDescVi = String(descriptionVi || '').trim() || null;
    const finalDescEn = String(descriptionEn || '').trim() || null;

    let videoId: string | null = null;
    if (finalPlatform === 'facebook') {
      if (!cleanVideoUrl || !extractFacebookVideoUrl(cleanVideoUrl)) {
        return res.status(400).json({
          error: 'A valid Facebook video link is required.',
        });
      }
      // A share/short link does not play in the embed — resolve it to
      // the real video URL first (a direct video link passes through
      // untouched). A link that does not resolve to a valid Facebook
      // video is rejected.
      const resolvedVideoUrl = await resolveFacebookVideoUrl(cleanVideoUrl);
      if (!resolvedVideoUrl) {
        return res.status(400).json({
          error: 'A valid Facebook video link is required.',
        });
      }
      cleanVideoUrl = resolvedVideoUrl;
    } else {
      videoId = extractYouTubeVideoId(cleanVideoUrl);
      if (!cleanVideoUrl || !videoId) {
        return res.status(400).json({
          error: 'A valid YouTube link is required.',
        });
      }
    }
    if (!finalTitleVi || !finalTitleEn || !date) {
      return res.status(400).json({
        error: 'Vietnamese and English titles and the Sunday date are required.',
      });
    }

    const actorName = req.adminUser?.displayName || req.adminUser?.username || 'Admin';

    const newSermon = await db
      .insert(sermons)
      .values({
        platform: finalPlatform,
        videoUrl: cleanVideoUrl,
        videoId,
        isVertical: finalIsVertical,
        titleVi: finalTitleVi,
        titleEn: finalTitleEn,
        descriptionVi: finalDescVi,
        descriptionEn: finalDescEn,
        date,
        createdBy: actorName,
        updatedBy: actorName,
      })
      .returning();

    // Drop anything older than 2 months now that a new sermon is in.
    // A prune failure must not turn a successful save into an error
    // (the sermon is already stored), so it is logged, not thrown.
    try {
      await pruneSermonsOlderThanTwoMonths();
    } catch (pruneError) {
      console.error('Failed to prune old sermons:', pruneError);
    }

    res.status(201).json(newSermon[0]);
  } catch (error: any) {
    console.error('Failed to create sermon in PostgreSQL:', error);
    const detail = error?.cause?.detail || error?.cause?.message || error?.message || 'Failed to create sermon in database';
    res.status(500).json({ error: detail });
  }
});

// PUT /api/sermons/:id - Update sermon in PostgreSQL (Admin only)
router.put('/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const sermonId = Number(req.params.id);
    if (isNaN(sermonId)) {
      return res.status(400).json({ error: 'Invalid sermon ID' });
    }

    const {
      platform,
      videoUrl,
      titleVi,
      titleEn,
      descriptionVi,
      descriptionEn,
      date,
      isVertical,
    } = req.body;

    const actorName = req.adminUser?.displayName || req.adminUser?.username || 'Admin';

    // The platform may switch on edit (YouTube <-> Facebook). The
    // request states it; otherwise the stored platform stands.
    const existing = await db
      .select()
      .from(sermons)
      .where(eq(sermons.id, sermonId))
      .limit(1);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Sermon not found' });
    }
    const targetPlatform =
      platform === 'facebook' || platform === 'youtube' ? platform : existing[0].platform;
    const switchingPlatform = targetPlatform !== existing[0].platform;

    // Tall/Wide only applies to Facebook — YouTube is always wide.
    // On edit, an omitted value keeps the stored one.
    let finalIsVertical: boolean | undefined;
    if (targetPlatform === 'facebook') {
      finalIsVertical = isVertical !== undefined ? Boolean(isVertical) : undefined;
    } else {
      finalIsVertical = false;
    }

    // A new link must be a valid one for its platform; otherwise keep
    // the stored link untouched. Switching platforms requires the new
    // platform's link, or the sermon would end up with no video at all.
    let videoId: string | null | undefined;
    let cleanVideoUrl: string | undefined;
    if (videoUrl !== undefined) {
      cleanVideoUrl = String(videoUrl || '').trim();
      if (targetPlatform === 'facebook') {
        if (!cleanVideoUrl || !extractFacebookVideoUrl(cleanVideoUrl)) {
          return res.status(400).json({ error: 'A valid Facebook video link is required.' });
        }
        // A share/short link does not play in the embed — resolve it
        // to the real video URL first. A link that does not resolve
        // to a valid Facebook video is rejected.
        const resolvedVideoUrl = await resolveFacebookVideoUrl(cleanVideoUrl);
        if (!resolvedVideoUrl) {
          return res.status(400).json({ error: 'A valid Facebook video link is required.' });
        }
        cleanVideoUrl = resolvedVideoUrl;
        videoId = null;
      } else {
        const extracted = extractYouTubeVideoId(cleanVideoUrl);
        if (!cleanVideoUrl || !extracted) {
          return res.status(400).json({ error: 'A valid YouTube link is required.' });
        }
        videoId = extracted;
      }
    } else if (switchingPlatform) {
      return res.status(400).json({
        error:
          targetPlatform === 'facebook'
            ? 'A valid Facebook video link is required.'
            : 'A valid YouTube link is required.',
      });
    } else if (targetPlatform === 'facebook') {
      // Same platform, no new link: clear the YouTube video ID (a
      // Facebook sermon has none).
      videoId = null;
    }

    const updated = await db
      .update(sermons)
      .set({
        platform: targetPlatform,
        videoUrl: cleanVideoUrl,
        videoId,
        isVertical: finalIsVertical,
        titleVi: titleVi !== undefined ? String(titleVi).trim() : undefined,
        titleEn: titleEn !== undefined ? String(titleEn).trim() : undefined,
        descriptionVi: descriptionVi !== undefined ? String(descriptionVi).trim() || null : undefined,
        descriptionEn: descriptionEn !== undefined ? String(descriptionEn).trim() || null : undefined,
        date,
        updatedBy: actorName,
        updatedAt: new Date(),
      })
      .where(eq(sermons.id, sermonId))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Sermon not found' });
    }

    res.json(updated[0]);
  } catch (error: any) {
    console.error('Failed to update sermon in PostgreSQL:', error);
    res.status(500).json({ error: error?.message || 'Failed to update sermon in database' });
  }
});

// DELETE /api/sermons/:id - Delete sermon from PostgreSQL (Admin only).
// No notification is posted for sermons, so there is nothing to clean up.
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const sermonId = Number(req.params.id);
    if (isNaN(sermonId)) {
      return res.status(400).json({ error: 'Invalid sermon ID' });
    }

    const deleted = await db.delete(sermons).where(eq(sermons.id, sermonId)).returning();

    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Sermon not found' });
    }

    res.json({ message: 'Sermon successfully removed from database', sermon: deleted[0] });
  } catch (error: any) {
    console.error('Failed to delete sermon from PostgreSQL:', error);
    res.status(500).json({ error: error?.message || 'Failed to delete sermon from database' });
  }
});

export default router;
