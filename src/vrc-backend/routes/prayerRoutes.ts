import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { db } from '../../vrc-db/index.ts';
import { prayerRequests } from '../../vrc-db/schema.ts';
import { eq, desc } from 'drizzle-orm';
import { requireAdmin, AuthRequest } from '../middleware/authMiddleware.ts';

const router = Router();

const DATA_DIR = path.join(process.cwd(), 'data');
const PRAYERS_FILE = path.join(DATA_DIR, 'prayers.json');

interface PrayerRecord {
  id: number;
  title: string;
  request: string;
  requesterName: string;
  isAnonymous: boolean;
  isPraise: boolean;
  prayerCount: number;
  status: string;
  createdAt: string;
}

function readLocalPrayers(): PrayerRecord[] {
  try {
    if (!fs.existsSync(PRAYERS_FILE)) return [];
    const raw = fs.readFileSync(PRAYERS_FILE, 'utf-8');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalPrayers(list: PrayerRecord[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(PRAYERS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write local prayers:', err);
  }
}

// GET /api/prayers - List all prayer requests (Admin only)
router.get('/', requireAdmin, async (_req: AuthRequest, res) => {
  try {
    const list = await db
      .select()
      .from(prayerRequests)
      .orderBy(desc(prayerRequests.createdAt));
    return res.json(list);
  } catch {
    const localList = readLocalPrayers().sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return res.json(localList);
  }
});

// Simple in-memory rate limiter: max 3 prayer requests per 10 minutes per IP
const prayerRateMap = new Map<string, number[]>();
const PRAYER_RATE_WINDOW_MS = 10 * 60 * 1000;
const PRAYER_RATE_MAX = 3;

// POST /api/prayers - Submit a new prayer request (Public)
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

    let created: any;
    try {
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
      created = inserted[0];
    } catch {
      const localList = readLocalPrayers();
      created = {
        id: Date.now(),
        title: cleanTitle,
        request: cleanRequest,
        requesterName: cleanName,
        isAnonymous: !String(requesterName || '').trim(),
        isPraise: false,
        prayerCount: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      localList.unshift(created);
      writeLocalPrayers(localList);
    }

    return res.status(201).json(created);
  } catch (error: any) {
    console.error('Failed to submit prayer request:', error);
    return res.status(500).json({ error: error?.message || 'Failed to submit prayer request' });
  }
});

// DELETE /api/prayers/:id - Delete a prayer request (Admin only)
router.delete('/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid prayer request ID' });
    }
    try {
      await db.delete(prayerRequests).where(eq(prayerRequests.id, id));
    } catch {
      const localList = readLocalPrayers().filter((p) => p.id !== id);
      writeLocalPrayers(localList);
    }
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete prayer request:', error);
    return res.status(500).json({ error: 'Failed to delete prayer request' });
  }
});

export default router;
