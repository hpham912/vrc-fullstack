import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from './src/db/index.ts';
import {
  events,
  dailyVerses,
  eventRsvps,
  prayerRequests,
  announcements,
  users,
  adminUsers,
} from './src/db/schema.ts';
import { eq, desc, asc, sql } from 'drizzle-orm';
import { requireAuth, requireAdmin, AuthRequest } from './src/middleware/auth.ts';
import { hashPassword, verifyPassword, createToken } from './src/lib/auth-util.ts';
import { getOrCreateUser } from './src/db/users.ts';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Vietnamese Revival Church', timestamp: new Date().toISOString() });
});

// Admin Login endpoint (Username + Password)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const existing = await db
      .select()
      .from(adminUsers)
      .where(sql`LOWER(${adminUsers.username}) = ${cleanUsername}`)
      .limit(1);

    if (existing.length === 0) {
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác / Invalid username or password.' });
    }

    const user = existing[0];
    const isMatch = verifyPassword(password, user.passwordHash, user.passwordSalt);
    if (!isMatch) {
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác / Invalid username or password.' });
    }

    const token = createToken({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Đăng nhập thất bại / Login failed' });
  }
});

// Get current logged-in admin session
app.get('/api/auth/me', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const admin = req.adminUser!;
    const user = await db
      .select({
        id: adminUsers.id,
        username: adminUsers.username,
        email: adminUsers.email,
        displayName: adminUsers.displayName,
        role: adminUsers.role,
        createdAt: adminUsers.createdAt,
      })
      .from(adminUsers)
      .where(eq(adminUsers.id, admin.id))
      .limit(1);

    if (user.length === 0) {
      return res.status(404).json({ error: 'Admin account not found' });
    }

    res.json({ user: user[0] });
  } catch (error: any) {
    console.error('Auth verification error:', error);
    res.status(500).json({ error: 'Failed to verify session' });
  }
});

// List all admin accounts (Admin only)
app.get('/api/auth/admins', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const list = await db
      .select({
        id: adminUsers.id,
        username: adminUsers.username,
        email: adminUsers.email,
        displayName: adminUsers.displayName,
        role: adminUsers.role,
        createdAt: adminUsers.createdAt,
      })
      .from(adminUsers)
      .orderBy(asc(adminUsers.id));

    res.json(list);
  } catch (error: any) {
    console.error('Failed to list admin accounts:', error);
    res.status(500).json({ error: 'Failed to list admin accounts' });
  }
});

// Create a new admin account (Admin only)
app.post('/api/auth/create-admin', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { username, password, email, displayName } = req.body;
    if (!username || !password || !displayName) {
      return res.status(400).json({ error: 'Username, password, and display name are required' });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    if (cleanUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if username already exists
    const existing = await db
      .select()
      .from(adminUsers)
      .where(sql`LOWER(${adminUsers.username}) = ${cleanUsername}`)
      .limit(1);

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Tên đăng nhập đã tồn tại / Username already exists.' });
    }

    const { hash, salt } = hashPassword(password);
    const inserted = await db
      .insert(adminUsers)
      .values({
        username: cleanUsername,
        email: email ? String(email).trim() : `${cleanUsername}@vnrevivalchurch.org`,
        displayName: String(displayName).trim(),
        passwordHash: hash,
        passwordSalt: salt,
        role: 'admin',
      })
      .returning({
        id: adminUsers.id,
        username: adminUsers.username,
        email: adminUsers.email,
        displayName: adminUsers.displayName,
        role: adminUsers.role,
        createdAt: adminUsers.createdAt,
      });

    res.status(201).json({
      message: 'Tạo tài khoản quản trị mới thành công / Admin account created successfully',
      user: inserted[0],
    });
  } catch (error: any) {
    console.error('Error creating admin account:', error);
    res.status(500).json({ error: 'Tạo tài khoản quản trị thất bại / Failed to create admin account' });
  }
});

// Delete admin account (Admin only, cannot delete oneself)
app.delete('/api/auth/admins/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const targetId = Number(req.params.id);
    const currentAdminId = req.adminUser!.id;

    if (targetId === currentAdminId) {
      return res.status(400).json({ error: 'Bạn không thể tự xóa tài khoản của chính mình / Cannot delete your own account.' });
    }

    const count = await db.select().from(adminUsers);
    if (count.length <= 1) {
      return res.status(400).json({ error: 'Cần ít nhất một tài khoản quản trị / Must have at least one admin account.' });
    }

    await db.delete(adminUsers).where(eq(adminUsers.id, targetId));
    res.json({ message: 'Đã xóa tài khoản quản trị / Admin account removed' });
  } catch (error: any) {
    console.error('Error deleting admin:', error);
    res.status(500).json({ error: 'Failed to delete admin account' });
  }
});

// Change admin password
app.post('/api/auth/change-password', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old password and new password are required' });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: 'Mật khẩu mới phải từ 6 ký tự / New password must be at least 6 characters' });
    }

    const currentAdminId = req.adminUser!.id;
    const userResult = await db.select().from(adminUsers).where(eq(adminUsers.id, currentAdminId)).limit(1);
    if (userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult[0];
    const isOldMatch = verifyPassword(oldPassword, user.passwordHash, user.passwordSalt);
    if (!isOldMatch) {
      return res.status(400).json({ error: 'Mật khẩu cũ không đúng / Old password is incorrect.' });
    }

    const { hash, salt } = hashPassword(newPassword);
    await db
      .update(adminUsers)
      .set({
        passwordHash: hash,
        passwordSalt: salt,
      })
      .where(eq(adminUsers.id, currentAdminId));

    res.json({ message: 'Đổi mật khẩu thành công / Password updated successfully!' });
  } catch (error: any) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// GET /api/events - List all events
app.get('/api/events', async (req, res) => {
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
    res.status(500).json({ error: 'Failed to fetch church events' });
  }
});

// GET /api/events/:id - Get single event with RSVPs
app.get('/api/events/:id', async (req, res) => {
  try {
    const eventId = Number(req.params.id);
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const eventResult = await db.select().from(events).where(eq(events.id, eventId));
    if (eventResult.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const rsvps = await db
      .select({
        id: eventRsvps.id,
        userName: eventRsvps.userName,
        attendeesCount: eventRsvps.attendeesCount,
        createdAt: eventRsvps.createdAt,
      })
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

// POST /api/events - Create new event (Admin)
app.post('/api/events', requireAuth, async (req: AuthRequest, res) => {
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
        title,
        description,
        category: category || 'Worship',
        date,
        startTime,
        endTime: endTime || null,
        location,
        address: address || null,
        imageUrl: imageUrl || null,
        isFeatured: Boolean(isFeatured),
        organizerName: organizerName || req.adminUser?.displayName || 'Church Staff',
        organizerEmail: organizerEmail || req.adminUser?.username || null,
        createdByUid: null,
      })
      .returning();

    res.status(201).json(newEvent[0]);
  } catch (error: any) {
    console.error('Failed to create event:', error);
    res.status(500).json({ error: 'Failed to create church event' });
  }
});

// PUT /api/events/:id - Update event (Admin)
app.put('/api/events/:id', requireAuth, async (req: AuthRequest, res) => {
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
        title,
        description,
        category,
        date,
        startTime,
        endTime,
        location,
        address,
        imageUrl,
        isFeatured: Boolean(isFeatured),
        maxCapacity: maxCapacity ? Number(maxCapacity) : null,
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

// DELETE /api/events/:id - Delete event (Admin)
app.delete('/api/events/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const eventId = Number(req.params.id);
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const deleted = await db.delete(events).where(eq(events.id, eventId)).returning();
    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ message: 'Event successfully removed' });
  } catch (error: any) {
    console.error('Failed to delete event:', error);
    res.status(500).json({ error: 'Failed to delete church event' });
  }
});

// POST /api/events/:id/rsvp - Register for event
app.post('/api/events/:id/rsvp', async (req, res) => {
  try {
    const eventId = Number(req.params.id);
    const { userName, userEmail, attendeesCount, notes } = req.body;

    if (!userName || !userEmail) {
      return res.status(400).json({ error: 'Name and email are required for RSVP' });
    }

    const count = Math.max(1, Number(attendeesCount) || 1);

    // Insert RSVP
    const newRsvp = await db
      .insert(eventRsvps)
      .values({
        eventId,
        userName,
        userEmail,
        attendeesCount: count,
        notes: notes || null,
      })
      .returning();

    // Increment RSVP count on event
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

// GET /api/verses/today - Get today's verse
app.get('/api/verses/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Look for exact match for today
    let verseResult = await db.select().from(dailyVerses).where(eq(dailyVerses.date, today));

    // If no verse for today, get latest available
    if (verseResult.length === 0) {
      verseResult = await db.select().from(dailyVerses).orderBy(desc(dailyVerses.date)).limit(1);
    }

    if (verseResult.length === 0) {
      // Fallback default if database table is completely empty
      return res.json({
        id: 0,
        date: today,
        verseText: 'The Lord is my shepherd; I shall not want. He makes me lie down in green pastures. He leads me beside still waters. He restores my soul.',
        reference: 'Psalm 23:1-3',
        translation: 'ESV',
        reflection: 'God provides for our deepest needs and leads us into rest and restoration.',
        prayer: 'Lord, be our gentle shepherd and guide our hearts today.',
        theme: 'Trust & Rest',
      });
    }

    res.json(verseResult[0]);
  } catch (error: any) {
    console.error('Failed to fetch today verse:', error);
    res.status(500).json({ error: 'Failed to fetch daily verse' });
  }
});

// GET /api/verses - List all verses
app.get('/api/verses', async (req, res) => {
  try {
    const list = await db.select().from(dailyVerses).orderBy(desc(dailyVerses.date));
    res.json(list);
  } catch (error: any) {
    console.error('Failed to fetch verses:', error);
    res.status(500).json({ error: 'Failed to fetch scripture verses' });
  }
});

// POST /api/verses - Create or update daily verse (Admin)
app.post('/api/verses', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { date, verseText, reference, translation, reflection, prayer, theme } = req.body;
    if (!date || !verseText || !reference || !reflection) {
      return res.status(400).json({ error: 'Date, verse text, reference, and reflection are required.' });
    }

    const inserted = await db
      .insert(dailyVerses)
      .values({
        date,
        verseText,
        reference,
        translation: translation || 'NIV',
        reflection,
        prayer: prayer || null,
        theme: theme || 'Daily Devotion',
        publishedByUid: null,
      })
      .onConflictDoUpdate({
        target: dailyVerses.date,
        set: {
          verseText,
          reference,
          translation: translation || 'NIV',
          reflection,
          prayer: prayer || null,
          theme: theme || 'Daily Devotion',
        },
      })
      .returning();

    res.status(201).json(inserted[0]);
  } catch (error: any) {
    console.error('Failed to save daily verse:', error);
    res.status(500).json({ error: 'Failed to save daily scripture verse' });
  }
});

// DELETE /api/verses/:id - Delete daily verse (Admin)
app.delete('/api/verses/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const deleted = await db.delete(dailyVerses).where(eq(dailyVerses.id, id)).returning();
    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Verse not found' });
    }
    res.json({ message: 'Verse successfully deleted' });
  } catch (error: any) {
    console.error('Failed to delete verse:', error);
    res.status(500).json({ error: 'Failed to delete daily verse' });
  }
});

// GET /api/prayers - Get community prayer requests
app.get('/api/prayers', async (req, res) => {
  try {
    const prayers = await db.select().from(prayerRequests).orderBy(desc(prayerRequests.createdAt));
    res.json(prayers);
  } catch (error: any) {
    console.error('Failed to fetch prayers:', error);
    res.status(500).json({ error: 'Failed to fetch prayer requests' });
  }
});

// POST /api/prayers - Submit a prayer request or praise report
app.post('/api/prayers', async (req, res) => {
  try {
    const { title, request, requesterName, isAnonymous, isPraise } = req.body;
    if (!title || !request) {
      return res.status(400).json({ error: 'Title and prayer request are required.' });
    }

    const inserted = await db
      .insert(prayerRequests)
      .values({
        title,
        request,
        requesterName: isAnonymous ? 'Anonymous' : requesterName || 'Church Member',
        isAnonymous: Boolean(isAnonymous),
        isPraise: Boolean(isPraise),
        status: 'active',
      })
      .returning();

    res.status(201).json(inserted[0]);
  } catch (error: any) {
    console.error('Failed to submit prayer:', error);
    res.status(500).json({ error: 'Failed to submit prayer request' });
  }
});

// POST /api/prayers/:id/pray - "I prayed for this"
app.post('/api/prayers/:id/pray', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const updated = await db
      .update(prayerRequests)
      .set({
        prayerCount: sql`${prayerRequests.prayerCount} + 1`,
      })
      .where(eq(prayerRequests.id, id))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Prayer request not found' });
    }

    res.json(updated[0]);
  } catch (error: any) {
    console.error('Failed to update prayer count:', error);
    res.status(500).json({ error: 'Failed to update prayer count' });
  }
});

// PATCH /api/prayers/:id/status - Update prayer status (Admin)
app.patch('/api/prayers/:id/status', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    const updated = await db
      .update(prayerRequests)
      .set({ status })
      .where(eq(prayerRequests.id, id))
      .returning();

    res.json(updated[0]);
  } catch (error: any) {
    console.error('Failed to update prayer status:', error);
    res.status(500).json({ error: 'Failed to update prayer status' });
  }
});

// DELETE /api/prayers/:id - Delete prayer request (Admin)
app.delete('/api/prayers/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(prayerRequests).where(eq(prayerRequests.id, id));
    res.json({ message: 'Prayer request removed' });
  } catch (error: any) {
    console.error('Failed to delete prayer:', error);
    res.status(500).json({ error: 'Failed to remove prayer request' });
  }
});

// GET /api/announcements - Get announcements
app.get('/api/announcements', async (req, res) => {
  try {
    const list = await db
      .select()
      .from(announcements)
      .where(eq(announcements.active, true))
      .orderBy(desc(announcements.createdAt));
    res.json(list);
  } catch (error: any) {
    console.error('Failed to fetch announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// POST /api/announcements - Create announcement (Admin)
app.post('/api/announcements', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { title, content, priority, linkUrl, linkText } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const inserted = await db
      .insert(announcements)
      .values({
        title,
        content,
        priority: priority || 'normal',
        linkUrl: linkUrl || null,
        linkText: linkText || null,
        active: true,
      })
      .returning();

    res.status(201).json(inserted[0]);
  } catch (error: any) {
    console.error('Failed to create announcement:', error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

// DELETE /api/announcements/:id - Delete announcement (Admin)
app.delete('/api/announcements/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(announcements).where(eq(announcements.id, id));
    res.json({ message: 'Announcement deleted' });
  } catch (error: any) {
    console.error('Failed to delete announcement:', error);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

// Devotional AI Generator helper (Admin tool to assist pastors/leaders in drafting daily reflections)
app.post('/api/ai/generate-devotional', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { passage, theme } = req.body;
    if (!passage) {
      return res.status(400).json({ error: 'Scripture passage is required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'Gemini API key not configured on server.' });
    }

    const ai = new GoogleGenAI();
    const prompt = `You are a warm, wise pastoral writer for a Christian church community. 
Generate a devotional reflection for the scripture: "${passage}". 
Theme focus: ${theme || 'Faith, hope, and love'}.

Please return a valid JSON object matching this schema exactly:
{
  "reference": "${passage}",
  "verseText": "Full text of the passage (NIV or ESV)",
  "reflection": "A 2-3 paragraph compassionate, encouraging reflection connecting scripture to daily life",
  "prayer": "A brief 2-3 sentence heartfelt closing prayer",
  "theme": "A 2-3 word theme title"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in devotional generator:', error);
    res.status(500).json({ error: 'Failed to generate devotional draft' });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = __dirname.endsWith('dist')
      ? __dirname
      : path.join(__dirname, 'dist');

    console.log(`Serving production static assets from: ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // Development mode: mount Vite dev server middleware
    console.log('Mounting Vite dev server middleware');
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Vietnamese Revival Church server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
