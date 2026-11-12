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
// stored. A YouTube sermon keeps its link + video ID; a Facebook
// sermon keeps its link (there is no video ID to extract).
router.post('/', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const {
      platform,
      youtubeUrl,
      facebookUrl,
      titleVi,
      titleEn,
      descriptionVi,
      descriptionEn,
      date,
    } = req.body;

    const finalPlatform = platform === 'facebook' ? 'facebook' : 'youtube';
    const cleanYoutubeUrl = String(youtubeUrl || '').trim();
    const cleanFacebookUrl = String(facebookUrl || '').trim();
    const finalTitleVi = String(titleVi || '').trim();
    const finalTitleEn = String(titleEn || '').trim();
    const finalDescVi = String(descriptionVi || '').trim() || null;
    const finalDescEn = String(descriptionEn || '').trim() || null;

    let videoId: string | null = null;
    if (finalPlatform === 'facebook') {
      if (!cleanFacebookUrl || !extractFacebookVideoUrl(cleanFacebookUrl)) {
        return res.status(400).json({
          error: 'A valid Facebook video link is required.',
        });
      }
    } else {
      videoId = extractYouTubeVideoId(cleanYoutubeUrl);
      if (!cleanYoutubeUrl || !videoId) {
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
        youtubeUrl: finalPlatform === 'youtube' ? cleanYoutubeUrl : null,
        videoId,
        facebookUrl: finalPlatform === 'facebook' ? cleanFacebookUrl : null,
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
      youtubeUrl,
      facebookUrl,
      titleVi,
      titleEn,
      descriptionVi,
      descriptionEn,
      date,
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

    // A new link must be a valid one for its platform; otherwise keep
    // the stored link untouched. Switching platforms requires the new
    // platform's link, or the sermon would end up with no video at all.
    let videoId: string | null | undefined;
    let cleanYoutubeUrl: string | null | undefined;
    let cleanFacebookUrl: string | null | undefined;
    if (targetPlatform === 'facebook') {
      if (facebookUrl !== undefined) {
        cleanFacebookUrl = String(facebookUrl || '').trim();
        if (!cleanFacebookUrl || !extractFacebookVideoUrl(cleanFacebookUrl)) {
          return res.status(400).json({ error: 'A valid Facebook video link is required.' });
        }
      } else if (switchingPlatform) {
        return res.status(400).json({ error: 'A valid Facebook video link is required.' });
      }
      // Switching to Facebook clears the YouTube link and video ID.
      cleanYoutubeUrl = null;
      videoId = null;
    } else {
      if (youtubeUrl !== undefined) {
        cleanYoutubeUrl = String(youtubeUrl || '').trim();
        const extracted = extractYouTubeVideoId(cleanYoutubeUrl);
        if (!cleanYoutubeUrl || !extracted) {
          return res.status(400).json({ error: 'A valid YouTube link is required.' });
        }
        videoId = extracted;
      } else if (switchingPlatform) {
        return res.status(400).json({ error: 'A valid YouTube link is required.' });
      }
      // Switching to YouTube clears the Facebook link.
      cleanFacebookUrl = null;
    }

    const updated = await db
      .update(sermons)
      .set({
        platform: targetPlatform,
        youtubeUrl: cleanYoutubeUrl,
        videoId,
        facebookUrl: cleanFacebookUrl,
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
