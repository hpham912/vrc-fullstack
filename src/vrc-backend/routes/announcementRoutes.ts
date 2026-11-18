import { Router } from 'express';
import { db } from '../../vrc-db/index.ts';
import { announcements } from '../../vrc-db/schema.ts';
import { eq, desc, and, isNotNull, lt } from 'drizzle-orm';
import { requireAdmin, AuthRequest } from '../middleware/authMiddleware.ts';

const router = Router();

// Finished announcements never pile up: delete rows past their end
// time before listing, the same lazy-prune pattern as videos (2
// months) and events (1 month). A prune failure never breaks the
// list — it just retries on the next read.
const pruneExpiredAnnouncements = async () => {
  try {
    await db
      .delete(announcements)
      .where(
        and(isNotNull(announcements.endsAt), lt(announcements.endsAt, new Date())),
      );
  } catch (error) {
    console.error('Failed to prune expired announcements:', error);
  }
};

// Parses an optional schedule boundary from the request body. Returns
// `undefined` when the field was not sent (a PUT leaves it alone),
// `null` when it was sent empty (clears it), or a Date. Throws on an
// unparseable value so the route can answer 400.
const parseScheduleDate = (value: unknown): Date | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value !== 'string') throw new Error('Invalid date');
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error('Invalid date');
  return parsed;
};

// The effective window of a row after a patch is applied — the sent
// value when present, otherwise the stored one. The end must stay
// after the start, or the row could never show, and after right now,
// or the row would be pruned the moment it is saved and vanish from
// the list without the admin doing anything.
const validateWindow = (
  startsAt: Date | null | undefined,
  endsAt: Date | null | undefined,
): boolean => {
  if (endsAt instanceof Date && endsAt.getTime() <= Date.now()) return false;
  if (startsAt instanceof Date && endsAt instanceof Date) {
    return endsAt.getTime() > startsAt.getTime();
  }
  return true;
};

// GET /api/announcements — the full list, newest first. Public: the
// banner text is shown to every visitor, so the list is public by
// design, like events and videos. The app banner shows the newest
// ACTIVE row inside its start/end window; the admin Announcements
// tab shows the whole list. Expired rows are deleted first, so the
// list never holds a finished announcement.
router.get('/', async (_req, res) => {
  try {
    await pruneExpiredAnnouncements();
    const list = await db
      .select()
      .from(announcements)
      .orderBy(desc(announcements.createdAt));
    res.json(list);
  } catch (error: any) {
    console.error('Failed to fetch announcements:', error);
    res.status(500).json({ error: 'Failed to retrieve announcements' });
  }
});

// POST /api/announcements — admin adds an announcement. `title` is
// the admin-side label (never shown on the banner); `content` is the
// Vietnamese banner text; `contentEn` is the English text (optional —
// the banner falls back to `content` when it is empty). `startsAt` /
// `endsAt` are optional ISO datetimes: no start means "from now", no
// end means "until turned off".
router.post('/', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { title, content, contentEn, active, startsAt, endsAt } = req.body || {};
    const cleanTitle = typeof title === 'string' ? title.trim() : '';
    const cleanContent = typeof content === 'string' ? content.trim() : '';
    const cleanContentEn = typeof contentEn === 'string' ? contentEn.trim() : '';
    if (!cleanTitle || !cleanContent) {
      return res.status(400).json({ error: 'Title and message are required' });
    }
    let parsedStartsAt: Date | null | undefined;
    let parsedEndsAt: Date | null | undefined;
    try {
      parsedStartsAt = parseScheduleDate(startsAt);
      parsedEndsAt = parseScheduleDate(endsAt);
    } catch {
      return res.status(400).json({ error: 'Invalid start or end time' });
    }
    if (!validateWindow(parsedStartsAt, parsedEndsAt)) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    const created = await db
      .insert(announcements)
      .values({
        title: cleanTitle,
        content: cleanContent,
        contentEn: cleanContentEn || null,
        active: active !== undefined ? Boolean(active) : true,
        startsAt: parsedStartsAt ?? null,
        endsAt: parsedEndsAt ?? null,
      })
      .returning();
    res.status(201).json(created[0]);
  } catch (error: any) {
    console.error('Failed to create announcement:', error);
    res.status(500).json({ error: 'Failed to save announcement' });
  }
});

// PUT /api/announcements/:id — admin edits an announcement, including
// switching it on/off and changing its window. Only the fields sent
// are changed; `updatedAt` is always bumped so GET /api/sync sees the
// edit and the banner live-updates on every phone.
router.put('/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const announcementId = Number(req.params.id);
    if (!Number.isInteger(announcementId)) {
      return res.status(400).json({ error: 'Invalid announcement id' });
    }
    const existing = await db
      .select()
      .from(announcements)
      .where(eq(announcements.id, announcementId))
      .limit(1);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    const { title, content, contentEn, active, startsAt, endsAt } = req.body || {};
    const patch: {
      title?: string;
      content?: string;
      contentEn?: string | null;
      active?: boolean;
      startsAt?: Date | null;
      endsAt?: Date | null;
      updatedAt: Date;
    } = { updatedAt: new Date() };
    if (title !== undefined) {
      const cleanTitle = typeof title === 'string' ? title.trim() : '';
      if (!cleanTitle) {
        return res.status(400).json({ error: 'Title is required' });
      }
      patch.title = cleanTitle;
    }
    if (content !== undefined) {
      const cleanContent = typeof content === 'string' ? content.trim() : '';
      if (!cleanContent) {
        return res.status(400).json({ error: 'Message is required' });
      }
      patch.content = cleanContent;
    }
    if (contentEn !== undefined) {
      patch.contentEn = typeof contentEn === 'string' ? contentEn.trim() || null : null;
    }
    if (active !== undefined) {
      patch.active = Boolean(active);
    }
    try {
      const parsedStartsAt = parseScheduleDate(startsAt);
      const parsedEndsAt = parseScheduleDate(endsAt);
      if (parsedStartsAt !== undefined) patch.startsAt = parsedStartsAt;
      if (parsedEndsAt !== undefined) patch.endsAt = parsedEndsAt;
      // The window is validated as a whole, so moving only the end
      // still has to stay after the stored (or new) start.
      const effectiveStartsAt = patch.startsAt !== undefined ? patch.startsAt : existing[0].startsAt;
      const effectiveEndsAt = patch.endsAt !== undefined ? patch.endsAt : existing[0].endsAt;
      if (!validateWindow(effectiveStartsAt, effectiveEndsAt)) {
        return res.status(400).json({ error: 'End time must be after start time' });
      }
    } catch {
      return res.status(400).json({ error: 'Invalid start or end time' });
    }

    const updated = await db
      .update(announcements)
      .set(patch)
      .where(eq(announcements.id, announcementId))
      .returning();
    if (updated.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    res.json(updated[0]);
  } catch (error: any) {
    console.error('Failed to update announcement:', error);
    res.status(500).json({ error: 'Failed to save announcement' });
  }
});

// DELETE /api/announcements/:id — admin deletes an announcement.
router.delete('/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const announcementId = Number(req.params.id);
    if (!Number.isInteger(announcementId)) {
      return res.status(400).json({ error: 'Invalid announcement id' });
    }
    const deleted = await db
      .delete(announcements)
      .where(eq(announcements.id, announcementId))
      .returning();
    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    res.json({ message: 'Announcement deleted' });
  } catch (error: any) {
    console.error('Failed to delete announcement:', error);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

export default router;
