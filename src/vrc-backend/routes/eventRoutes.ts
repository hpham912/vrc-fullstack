import { Router } from 'express';
import { db } from '../../vrc-db/index.ts';
import { events } from '../../vrc-db/schema.ts';
import { eq, asc, sql, lt } from 'drizzle-orm';
import { requireAdmin, AuthRequest } from '../middleware/authMiddleware.ts';
import { BackendNotificationService } from '../services/notificationService.ts';

const router = Router();

// Prune past events older than 1 month, so the table never holds a
// stale event. Runs after every event save (same pattern as the videos
// 2-month prune) and via POST /cleanup-expired, so an admin can force
// it. Deliberately NOT on GET /api/events, so an everyday app load
// never pays for a cleanup query. Returns how many rows were removed.
// A failure here never throws — the caller runs it after a successful
// save and must not turn a good save into an error.
async function cleanupPastEvents(): Promise<number> {
  try {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 1);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    const deleted = await db
      .delete(events)
      .where(lt(events.date, cutoffStr))
      .returning({ id: events.id });
    if (deleted.length > 0) {
      console.log(`Pruned ${deleted.length} past events older than 1 month in PostgreSQL.`);
    }
    return deleted.length;
  } catch (err) {
    console.warn('Past events cleanup warning:', err);
    return 0;
  }
}

// POST /api/events/cleanup-expired - Explicit trigger to clean up past events older than 1 month
router.post('/cleanup-expired', requireAdmin, async (_req, res) => {
  try {
    const removedCount = await cleanupPastEvents();
    res.json({ message: 'Past events older than 1 month pruned successfully in PostgreSQL', removedCount });
  } catch (err: any) {
    console.error('Failed to run events cleanup:', err);
    res.status(500).json({ error: 'Failed to run events cleanup' });
  }
});

// GET /api/events - List all events from the active database (Dev DB or Prod DB)
router.get('/', async (req, res) => {
  try {
    const category = req.query.category as string;
    const search = req.query.search as string;

    const allEvents = await db
      .select()
      .from(events)
      .orderBy(asc(events.date), asc(events.startTime));

    // Past events are no longer pruned from the database on read (that ran a
    // cleanup query on every app load; pruning now happens only via
    // POST /cleanup-expired). The response still carries at most the 3 most
    // recent past events, exactly as before — older ones never leave the server.
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;
    const recentPastIds = new Set(
      allEvents
        .filter((event) => event.date < todayStr)
        .sort(
          (a, b) =>
            b.date.localeCompare(a.date) ||
            String(b.startTime || '').localeCompare(String(a.startTime || '')) ||
            b.id - a.id
        )
        .slice(0, 3)
        .map((event) => event.id)
    );
    let filtered = allEvents.filter(
      (event) => event.date >= todayStr || recentPastIds.has(event.id)
    );
    if (category && category !== 'All') {
      filtered = filtered.filter((e) => String(e.category || '').toLowerCase() === category.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          String(e.title || '').toLowerCase().includes(q) ||
          String(e.titleVi || '').toLowerCase().includes(q) ||
          String(e.titleEn || '').toLowerCase().includes(q) ||
          String(e.description || '').toLowerCase().includes(q) ||
          String(e.descriptionVi || '').toLowerCase().includes(q) ||
          String(e.descriptionEn || '').toLowerCase().includes(q) ||
          String(e.location || '').toLowerCase().includes(q)
      );
    }

    res.json(filtered);
  } catch (error: any) {
    console.error('Failed to fetch events from PostgreSQL:', error);
    res.status(500).json({ error: error?.message || 'Failed to retrieve church events from database' });
  }
});

// GET /api/events/:id - Get single event from PostgreSQL
router.get('/:id', async (req, res) => {
  try {
    const eventId = Number(req.params.id);
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const eventResult = await db.select().from(events).where(eq(events.id, eventId)).limit(1);

    if (eventResult.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(eventResult[0]);
  } catch (error: any) {
    console.error('Failed to fetch event from PostgreSQL:', error);
    res.status(500).json({ error: error?.message || 'Failed to fetch event details' });
  }
});

// POST /api/events - Create new event in PostgreSQL (Admin only)
router.post('/', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const {
      title,
      titleVi,
      titleEn,
      description,
      descriptionVi,
      descriptionEn,
      category,
      date,
      startTime,
      endTime,
      location,
      locationVi,
      locationEn,
      address,
      imageUrl,
      isFeatured,
      hasZoom,
      maxCapacity,
      organizerName,
      organizerEmail,
    } = req.body;

    const finalTitleEn = String(titleEn || title || titleVi || '').trim();
    const finalTitleVi = String(titleVi || title || titleEn || '').trim();
    const finalDescEn = String(descriptionEn || description || descriptionVi || '').trim();
    const finalDescVi = String(descriptionVi || description || descriptionEn || '').trim();
    const finalLocationVi = String(locationVi || location || locationEn || '').trim();
    const finalLocationEn = String(locationEn || location || locationVi || '').trim();
    const finalLocation = finalLocationEn;

    if (!finalTitleEn || !finalTitleVi || !finalDescEn || !finalDescVi || !date || !startTime || !finalLocationVi || !finalLocationEn) {
      return res.status(400).json({
        error: 'Vietnamese and English titles, descriptions, date, start time, and location are required.',
      });
    }

    const actorName = req.adminUser?.displayName || req.adminUser?.username || 'Admin';

    const insertValues = {
      title: finalTitleEn,
      titleVi: finalTitleVi,
      titleEn: finalTitleEn,
      description: finalDescEn,
      descriptionVi: finalDescVi,
      descriptionEn: finalDescEn,
      category: category || 'Worship',
      date,
      startTime,
      endTime: endTime || null,
      location: finalLocation,
      locationVi: finalLocationVi,
      locationEn: finalLocationEn,
      address: address ? String(address).trim() : 'Tempe, Arizona',
      imageUrl: imageUrl || null,
      isFeatured: Boolean(isFeatured),
      hasZoom: Boolean(hasZoom),
      maxCapacity: maxCapacity ? Number(maxCapacity) : null,
      organizerName: organizerName || req.adminUser?.displayName || 'Church Staff',
      organizerEmail: organizerEmail || req.adminUser?.username || null,
      createdByUid: null,
      createdBy: actorName,
      updatedBy: actorName,
    };

    let newEvent: any[];
    try {
      newEvent = await db.insert(events).values(insertValues).returning();
    } catch (insertErr: any) {
      const errStr = String(insertErr?.cause?.message || insertErr?.message || '');
      if (errStr.includes('events_pkey') || errStr.includes('duplicate key')) {
        // Automatically synchronize sequence if older pre-seeded rows caused ID collision
        await db.execute(sql`SELECT setval('events_id_seq', COALESCE((SELECT MAX(id) FROM events), 0) + 1, false)`);
        newEvent = await db.insert(events).values(insertValues).returning();
      } else {
        throw insertErr;
      }
    }

    // Trigger notification record in PostgreSQL
    await BackendNotificationService.recordNotification(
      `New Church Event: ${finalTitleEn}`,
      `${date} • ${startTime} at ${finalLocation}`,
      'event',
      newEvent[0].id
    );

    // Prune past events older than 1 month (never throws — a prune
    // failure must not turn this successful save into an error).
    await cleanupPastEvents();

    res.status(201).json(newEvent[0]);
  } catch (error: any) {
    console.error('Failed to create event in PostgreSQL:', error);
    const detail = error?.cause?.detail || error?.cause?.message || error?.message || 'Failed to create church event in database';
    res.status(500).json({ error: detail });
  }
});

// PUT /api/events/:id - Update event in PostgreSQL (Admin only)
router.put('/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const eventId = Number(req.params.id);
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const {
      title,
      titleVi,
      titleEn,
      description,
      descriptionVi,
      descriptionEn,
      category,
      date,
      startTime,
      endTime,
      location,
      locationVi,
      locationEn,
      address,
      imageUrl,
      isFeatured,
      hasZoom,
      maxCapacity,
      organizerName,
      organizerEmail,
    } = req.body;

    const finalTitleEn =
      titleEn !== undefined ? String(titleEn).trim() : title !== undefined ? String(title).trim() : undefined;
    const finalTitleVi =
      titleVi !== undefined ? String(titleVi).trim() : title !== undefined ? String(title).trim() : undefined;
    const finalDescEn =
      descriptionEn !== undefined
        ? String(descriptionEn).trim()
        : description !== undefined
        ? String(description).trim()
        : undefined;
    const finalDescVi =
      descriptionVi !== undefined
        ? String(descriptionVi).trim()
        : description !== undefined
        ? String(description).trim()
        : undefined;
    const finalLocationVi =
      locationVi !== undefined ? String(locationVi).trim() : location !== undefined ? String(location).trim() : undefined;
    const finalLocationEn =
      locationEn !== undefined ? String(locationEn).trim() : location !== undefined ? String(location).trim() : undefined;
    const finalLocation = finalLocationEn;
    const actorName = req.adminUser?.displayName || req.adminUser?.username || 'Admin';

    const updated = await db
      .update(events)
      .set({
        title: finalTitleEn,
        titleVi: finalTitleVi,
        titleEn: finalTitleEn,
        description: finalDescEn,
        descriptionVi: finalDescVi,
        descriptionEn: finalDescEn,
        category,
        date,
        startTime,
        endTime,
        location: finalLocation,
        locationVi: finalLocationVi,
        locationEn: finalLocationEn,
        address: address ? String(address).trim() : undefined,
        imageUrl,
        isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : undefined,
        hasZoom: hasZoom !== undefined ? Boolean(hasZoom) : undefined,
        maxCapacity: maxCapacity !== undefined ? (maxCapacity ? Number(maxCapacity) : null) : undefined,
        organizerName,
        organizerEmail,
        updatedBy: actorName,
        updatedAt: new Date(),
      })
      .where(eq(events.id, eventId))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Prune past events older than 1 month (never throws — a prune
    // failure must not turn this successful save into an error).
    await cleanupPastEvents();

    res.json(updated[0]);
  } catch (error: any) {
    console.error('Failed to update event in PostgreSQL:', error);
    res.status(500).json({ error: error?.message || 'Failed to update church event in database' });
  }
});

// DELETE /api/events/:id - Delete event from PostgreSQL (Admin only)
router.delete('/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const eventId = Number(req.params.id);
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const deleted = await db.delete(events).where(eq(events.id, eventId)).returning();

    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Remove the notifications that pointed at this event, so the deleted
    // event no longer shows up in the Notifications tab.
    await BackendNotificationService.deleteForEvent(eventId);

    // Prune past events older than 1 month (never throws — a prune
    // failure must not turn this successful delete into an error).
    await cleanupPastEvents();

    res.json({ message: 'Event successfully removed from database', event: deleted[0] });
  } catch (error: any) {
    console.error('Failed to delete event from PostgreSQL:', error);
    res.status(500).json({ error: error?.message || 'Failed to delete event from database' });
  }
});

export default router;
