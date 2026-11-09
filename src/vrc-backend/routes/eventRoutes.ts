import { Router } from 'express';
import { db } from '../../vrc-db/index.ts';
import { events } from '../../vrc-db/schema.ts';
import { eq, desc, asc, sql } from 'drizzle-orm';
import { requireAdmin, AuthRequest } from '../middleware/authMiddleware.ts';
import { BackendNotificationService } from '../services/notificationService.ts';

const router = Router();

// Helper function to maintain at most 3 past events in PostgreSQL and prune older past events.
// Runs only via POST /cleanup-expired — deliberately NOT on GET /api/events,
// so an everyday app load never pays for a cleanup query.
async function cleanupPastEvents() {
  try {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;

    // Query past events (where date < todayStr), ordered by date desc (most recent first)
    const past = await db
      .select({ id: events.id, date: events.date })
      .from(events)
      .where(sql`${events.date} < ${todayStr}`)
      .orderBy(desc(events.date), desc(events.startTime), desc(events.id));

    // Keep top 3 recent past events; delete any beyond 3
    if (past.length > 3) {
      const surplusPast = past.slice(3);
      const idsToDelete = surplusPast.map((e) => e.id);
      if (idsToDelete.length > 0) {
        for (const id of idsToDelete) {
          await db.delete(events).where(eq(events.id, id));
        }
        console.log(`Pruned ${idsToDelete.length} past events in PostgreSQL, keeping 3 most recent.`);
        return idsToDelete.length;
      }
    }
    return 0;
  } catch (err) {
    console.warn('Past events cleanup warning:', err);
    return 0;
  }
}

// POST /api/events/cleanup-expired - Explicit trigger to clean up past events older than the 3 most recent
router.post('/cleanup-expired', requireAdmin, async (_req, res) => {
  try {
    const removedCount = await cleanupPastEvents();
    res.json({ message: 'Past events pruned to max 3 successfully in PostgreSQL', removedCount });
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
      address,
      imageUrl,
      isFeatured,
      maxCapacity,
      organizerName,
      organizerEmail,
    } = req.body;

    const finalTitleEn = String(titleEn || title || titleVi || '').trim();
    const finalTitleVi = String(titleVi || title || titleEn || '').trim();
    const finalDescEn = String(descriptionEn || description || descriptionVi || '').trim();
    const finalDescVi = String(descriptionVi || description || descriptionEn || '').trim();
    const finalLocation = String(location || '').trim();

    if (!finalTitleEn || !finalTitleVi || !finalDescEn || !finalDescVi || !date || !startTime || !finalLocation) {
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
      locationVi: finalLocation,
      locationEn: finalLocation,
      address: address ? String(address).trim() : 'Tempe, Arizona',
      imageUrl: imageUrl || null,
      isFeatured: Boolean(isFeatured),
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
      address,
      imageUrl,
      isFeatured,
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
        location: location ? String(location).trim() : undefined,
        locationVi: location ? String(location).trim() : undefined,
        locationEn: location ? String(location).trim() : undefined,
        address: address ? String(address).trim() : undefined,
        imageUrl,
        isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : undefined,
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

    res.json({ message: 'Event successfully removed from database', event: deleted[0] });
  } catch (error: any) {
    console.error('Failed to delete event from PostgreSQL:', error);
    res.status(500).json({ error: error?.message || 'Failed to delete event from database' });
  }
});

export default router;
