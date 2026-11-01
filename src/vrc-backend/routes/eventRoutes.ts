import { Router } from 'express';
import { db } from '../../vrc-db/index.ts';
import { events, eventRsvps } from '../../vrc-db/schema.ts';
import { eq, desc, asc, sql } from 'drizzle-orm';
import { requireAdmin, AuthRequest } from '../middleware/authMiddleware.ts';
import { BackendNotificationService } from '../services/notificationService.ts';

const router = Router();

// GET /api/events - List all events
router.get('/', async (req, res) => {
  try {
    const category = req.query.category as string;
    const search = req.query.search as string;

    const allEvents = await db.select().from(events).orderBy(asc(events.date), asc(events.startTime));

    let filtered = allEvents;
    if (category && category !== 'All') {
      filtered = filtered.filter((e) => e.category.toLowerCase() === category.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q)
      );
    }

    res.json(filtered);
  } catch (error: any) {
    console.error('Failed to fetch events:', error);
    res.status(500).json({ error: 'Failed to retrieve church events' });
  }
});

// GET /api/events/:id - Get single event with RSVPs
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

    const rsvps = await db
      .select()
      .from(eventRsvps)
      .where(eq(eventRsvps.eventId, eventId))
      .orderBy(desc(eventRsvps.createdAt));

    res.json({
      ...eventResult[0],
      rsvps,
    });
  } catch (error: any) {
    console.error('Failed to fetch event:', error);
    res.status(500).json({ error: 'Failed to fetch event details' });
  }
});

// POST /api/events - Create new event (Admin only)
router.post('/', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const {
      title,
      description,
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

    if (!title || !description || !date || !startTime || !location) {
      return res.status(400).json({ error: 'Title, description, date, start time, and location are required.' });
    }

    const newEvent = await db
      .insert(events)
      .values({
        title: String(title).trim(),
        description: String(description).trim(),
        category: category || 'Worship',
        date,
        startTime,
        endTime: endTime || null,
        location: String(location).trim(),
        address: address ? String(address).trim() : 'Tempe, Arizona',
        imageUrl: imageUrl || null,
        isFeatured: Boolean(isFeatured),
        maxCapacity: maxCapacity ? Number(maxCapacity) : null,
        organizerName: organizerName || req.adminUser?.displayName || 'Church Staff',
        organizerEmail: organizerEmail || req.adminUser?.username || null,
        createdByUid: null,
      })
      .returning();

    // Trigger push notification record
    await BackendNotificationService.recordNotification(
      `New Church Event: ${title.trim()}`,
      `${date} • ${startTime} at ${location.trim()}`,
      'event',
      newEvent[0].id
    );

    res.status(201).json(newEvent[0]);
  } catch (error: any) {
    console.error('Failed to create event:', error);
    res.status(500).json({ error: 'Failed to create church event' });
  }
});

// PUT /api/events/:id - Update event (Admin only)
router.put('/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const eventId = Number(req.params.id);
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const {
      title,
      description,
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

    const updated = await db
      .update(events)
      .set({
        title: title ? String(title).trim() : undefined,
        description: description ? String(description).trim() : undefined,
        category,
        date,
        startTime,
        endTime,
        location: location ? String(location).trim() : undefined,
        address: address ? String(address).trim() : undefined,
        imageUrl,
        isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : undefined,
        maxCapacity: maxCapacity !== undefined ? (maxCapacity ? Number(maxCapacity) : null) : undefined,
        organizerName,
        organizerEmail,
        updatedAt: new Date(),
      })
      .where(eq(events.id, eventId))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(updated[0]);
  } catch (error: any) {
    console.error('Failed to update event:', error);
    res.status(500).json({ error: 'Failed to update church event' });
  }
});

// DELETE /api/events/:id - Delete event (Admin only)
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

    res.json({ message: 'Event successfully removed', event: deleted[0] });
  } catch (error: any) {
    console.error('Failed to delete event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// POST /api/events/:id/rsvp - RSVP to event
router.post('/:id/rsvp', async (req, res) => {
  try {
    const eventId = Number(req.params.id);
    const { userName, userEmail, attendeesCount, notes } = req.body;

    if (!userName || !userEmail) {
      return res.status(400).json({ error: 'Name and email are required for RSVP.' });
    }

    const count = Number(attendeesCount) || 1;

    const newRsvp = await db
      .insert(eventRsvps)
      .values({
        eventId,
        userName: String(userName).trim(),
        userEmail: String(userEmail).trim(),
        attendeesCount: count,
        notes: notes ? String(notes).trim() : null,
      })
      .returning();

    await db
      .update(events)
      .set({
        rsvpCount: sql`${events.rsvpCount} + ${count}`,
      })
      .where(eq(events.id, eventId));

    res.status(201).json(newRsvp[0]);
  } catch (error: any) {
    console.error('Failed to submit RSVP:', error);
    res.status(500).json({ error: 'Failed to submit RSVP' });
  }
});

export default router;
