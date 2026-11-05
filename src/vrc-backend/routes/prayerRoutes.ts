import { Router } from 'express';
import { db } from '../../vrc-db/index.ts';
import { prayerRequests } from '../../vrc-db/schema.ts';
import { eq, desc } from 'drizzle-orm';
import { requireAdmin, AuthRequest } from '../middleware/authMiddleware.ts';

const router = Router();

// GET /api/prayers - List all prayer requests from PostgreSQL (Admin only)
router.get('/', requireAdmin, async (_req: AuthRequest, res) => {
  try {
    const list = await db
      .select()
      .from(prayerRequests)
      .orderBy(desc(prayerRequests.createdAt));
    return res.json(list);
  } catch (error: any) {
    console.error('Failed to fetch prayers from PostgreSQL:', error);
    return res.status(500).json({ error: error?.message || 'Failed to fetch prayer requests from database' });
  }
});

// Simple in-memory rate limiter: max 3 prayer requests per 10 minutes per IP
const prayerRateMap = new Map<string, number[]>();
const PRAYER_RATE_WINDOW_MS = 10 * 60 * 1000;
const PRAYER_RATE_MAX = 3;

// POST /api/prayers - Submit a new prayer request in PostgreSQL (Public)
router.post('/', async (req, res) => {
  try {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
    const now = Date.now();
    const recent = (prayerRateMap.get(clientIp) || []).filter((ts) => now - ts < PRAYER_RATE_WINDOW_MS);
    if (recent.length >= PRAYER_RATE_MAX) {
      return res.status(429).json({
        error: 'Too many prayer requests submitted. Please wait a few minutes before sending another.',
      });
    }
    recent.push(now);
    prayerRateMap.set(clientIp, recent);

    const { requesterName, title, request } = req.body;
    const cleanRequest = String(request || '').trim();
    if (!cleanRequest) {
      return res.status(400).json({ error: 'Prayer request text is required.' });
    }

    const cleanName = String(requesterName || '').trim() || 'Anonymous';
    const cleanTitle = String(title || '').trim() || `Prayer Request from ${cleanName}`;

    const inserted = await db
      .insert(prayerRequests)
      .values({
        title: cleanTitle,
        request: cleanRequest,
        requesterName: cleanName,
        isAnonymous: !String(requesterName || '').trim(),
        isPraise: false,
        prayerCount: 0,
        status: 'active',
      })
      .returning();

    return res.status(201).json(inserted[0]);
  } catch (error: any) {
    console.error('Failed to submit prayer request to PostgreSQL:', error);
    return res.status(500).json({ error: error?.message || 'Failed to submit prayer request to database' });
  }
});

// DELETE /api/prayers/:id - Delete a prayer request from PostgreSQL (Admin only)
router.delete('/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid prayer request ID' });
    }

    await db.delete(prayerRequests).where(eq(prayerRequests.id, id));
    return res.json({ success: true, message: 'Prayer request deleted from database' });
  } catch (error: any) {
    console.error('Failed to delete prayer request from PostgreSQL:', error);
    return res.status(500).json({ error: error?.message || 'Failed to delete prayer request from database' });
  }
});

export default router;
