var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server.ts
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// src/db/index.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  adminUsers: () => adminUsers,
  announcements: () => announcements,
  dailyVerses: () => dailyVerses,
  dailyVersesRelations: () => dailyVersesRelations,
  eventRsvps: () => eventRsvps,
  eventRsvpsRelations: () => eventRsvpsRelations,
  events: () => events,
  eventsRelations: () => eventsRelations,
  prayerRequests: () => prayerRequests,
  users: () => users,
  usersRelations: () => usersRelations
});
import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp
} from "drizzle-orm/pg-core";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  photoUrl: text("photo_url"),
  role: text("role").notNull().default("member"),
  createdAt: timestamp("created_at").defaultNow()
});
var adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at").defaultNow()
});
var events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull().default("Worship"),
  // 'Worship', 'Youth', 'Bible Study', 'Community Outreach', 'Fellowship', 'Special Event'
  date: text("date").notNull(),
  // YYYY-MM-DD
  startTime: text("start_time").notNull(),
  // e.g. "09:30 AM"
  endTime: text("end_time"),
  // e.g. "11:00 AM"
  location: text("location").notNull(),
  // e.g. "Main Sanctuary", "Youth Hall", "Online Stream"
  address: text("address"),
  imageUrl: text("image_url"),
  isFeatured: boolean("is_featured").notNull().default(false),
  rsvpCount: integer("rsvp_count").notNull().default(0),
  maxCapacity: integer("max_capacity"),
  organizerName: text("organizer_name"),
  organizerEmail: text("organizer_email"),
  createdByUid: text("created_by_uid").references(() => users.uid),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var dailyVerses = pgTable("daily_verses", {
  id: serial("id").primaryKey(),
  date: text("date").notNull().unique(),
  // YYYY-MM-DD
  verseText: text("verse_text").notNull(),
  reference: text("reference").notNull(),
  // e.g. "Romans 12:2"
  translation: text("translation").notNull().default("NIV"),
  // NIV, ESV, KJV, NLT, CSB
  reflection: text("reflection").notNull(),
  prayer: text("prayer"),
  theme: text("theme").default("Faith & Encouragement"),
  publishedByUid: text("published_by_uid").references(() => users.uid),
  createdAt: timestamp("created_at").defaultNow()
});
var eventRsvps = pgTable("event_rsvps", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  userName: text("user_name").notNull(),
  userEmail: text("user_email").notNull(),
  attendeesCount: integer("attendees_count").notNull().default(1),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow()
});
var prayerRequests = pgTable("prayer_requests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  request: text("request").notNull(),
  requesterName: text("requester_name").notNull().default("Church Member"),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  isPraise: boolean("is_praise").notNull().default(false),
  prayerCount: integer("prayer_count").notNull().default(0),
  status: text("status").notNull().default("active"),
  // 'active', 'answered'
  createdAt: timestamp("created_at").defaultNow()
});
var announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  priority: text("priority").notNull().default("normal"),
  // 'urgent', 'high', 'normal'
  linkUrl: text("link_url"),
  linkText: text("link_text"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow()
});
var usersRelations = relations(users, ({ many }) => ({
  events: many(events),
  dailyVerses: many(dailyVerses)
}));
var eventsRelations = relations(events, ({ one, many }) => ({
  creator: one(users, {
    fields: [events.createdByUid],
    references: [users.uid]
  }),
  rsvps: many(eventRsvps)
}));
var eventRsvpsRelations = relations(eventRsvps, ({ one }) => ({
  event: one(events, {
    fields: [eventRsvps.eventId],
    references: [events.id]
  })
}));
var dailyVersesRelations = relations(dailyVerses, ({ one }) => ({
  publisher: one(users, {
    fields: [dailyVerses.publishedByUid],
    references: [users.uid]
  })
}));

// src/db/index.ts
var createPool = () => {
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      connectionTimeoutMillis: 15e3
    });
    global._postgresPool.on("error", (err) => {
      console.error("Unexpected error on idle SQL pool client:", err);
    });
  }
  return global._postgresPool;
};
var pool = createPool();
var db = drizzle(pool, { schema: schema_exports });

// server.ts
import { eq, desc, asc, sql } from "drizzle-orm";

// src/lib/auth-util.ts
import crypto from "crypto";
var SECRET = process.env.AUTH_SECRET || "vn-revival-church-tempe-az-secret-key-2026";
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1e5, 64, "sha512").toString("hex");
  return { hash, salt };
}
function verifyPassword(password, storedHash, salt) {
  const hash = crypto.pbkdf2Sync(password, salt, 1e5, 64, "sha512").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(storedHash, "hex"));
}
function createToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1e3
    // 7 days validity
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", SECRET).update(payloadB64).digest("base64url");
  return `${payloadB64}.${signature}`;
}
function verifyToken(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [payloadB64, signature] = parts;
    const expectedSig = crypto.createHmac("sha256", SECRET).update(payloadB64).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    if (Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

// src/middleware/auth.ts
var requireAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Please log in as an administrator." });
  }
  const token = authHeader.split("Bearer ")[1];
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Session expired or invalid. Please sign in again." });
  }
  req.adminUser = payload;
  next();
};
var requireAuth = requireAdmin;

// server.ts
import { GoogleGenAI } from "@google/genai";
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var PORT = Number(process.env.PORT) || 3e3;
app.use(express.json());
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "Vietnamese Revival Church", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }
    const cleanUsername = String(username).trim().toLowerCase();
    const existing = await db.select().from(adminUsers).where(sql`LOWER(${adminUsers.username}) = ${cleanUsername}`).limit(1);
    if (existing.length === 0) {
      return res.status(401).json({ error: "T\xEAn \u0111\u0103ng nh\u1EADp ho\u1EB7c m\u1EADt kh\u1EA9u kh\xF4ng ch\xEDnh x\xE1c / Invalid username or password." });
    }
    const user = existing[0];
    const isMatch = verifyPassword(password, user.passwordHash, user.passwordSalt);
    if (!isMatch) {
      return res.status(401).json({ error: "T\xEAn \u0111\u0103ng nh\u1EADp ho\u1EB7c m\u1EADt kh\u1EA9u kh\xF4ng ch\xEDnh x\xE1c / Invalid username or password." });
    }
    const token = createToken({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role
    });
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "\u0110\u0103ng nh\u1EADp th\u1EA5t b\u1EA1i / Login failed" });
  }
});
app.get("/api/auth/me", requireAdmin, async (req, res) => {
  try {
    const admin = req.adminUser;
    const user = await db.select({
      id: adminUsers.id,
      username: adminUsers.username,
      email: adminUsers.email,
      displayName: adminUsers.displayName,
      role: adminUsers.role,
      createdAt: adminUsers.createdAt
    }).from(adminUsers).where(eq(adminUsers.id, admin.id)).limit(1);
    if (user.length === 0) {
      return res.status(404).json({ error: "Admin account not found" });
    }
    res.json({ user: user[0] });
  } catch (error) {
    console.error("Auth verification error:", error);
    res.status(500).json({ error: "Failed to verify session" });
  }
});
app.get("/api/auth/admins", requireAdmin, async (req, res) => {
  try {
    const list = await db.select({
      id: adminUsers.id,
      username: adminUsers.username,
      email: adminUsers.email,
      displayName: adminUsers.displayName,
      role: adminUsers.role,
      createdAt: adminUsers.createdAt
    }).from(adminUsers).orderBy(asc(adminUsers.id));
    res.json(list);
  } catch (error) {
    console.error("Failed to list admin accounts:", error);
    res.status(500).json({ error: "Failed to list admin accounts" });
  }
});
app.post("/api/auth/create-admin", requireAdmin, async (req, res) => {
  try {
    const { username, password, email, displayName } = req.body;
    if (!username || !password || !displayName) {
      return res.status(400).json({ error: "Username, password, and display name are required" });
    }
    const cleanUsername = String(username).trim().toLowerCase();
    if (cleanUsername.length < 3) {
      return res.status(400).json({ error: "Username must be at least 3 characters" });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    const existing = await db.select().from(adminUsers).where(sql`LOWER(${adminUsers.username}) = ${cleanUsername}`).limit(1);
    if (existing.length > 0) {
      return res.status(409).json({ error: "T\xEAn \u0111\u0103ng nh\u1EADp \u0111\xE3 t\u1ED3n t\u1EA1i / Username already exists." });
    }
    const { hash, salt } = hashPassword(password);
    const inserted = await db.insert(adminUsers).values({
      username: cleanUsername,
      email: email ? String(email).trim() : `${cleanUsername}@vnrevivalchurch.org`,
      displayName: String(displayName).trim(),
      passwordHash: hash,
      passwordSalt: salt,
      role: "admin"
    }).returning({
      id: adminUsers.id,
      username: adminUsers.username,
      email: adminUsers.email,
      displayName: adminUsers.displayName,
      role: adminUsers.role,
      createdAt: adminUsers.createdAt
    });
    res.status(201).json({
      message: "T\u1EA1o t\xE0i kho\u1EA3n qu\u1EA3n tr\u1ECB m\u1EDBi th\xE0nh c\xF4ng / Admin account created successfully",
      user: inserted[0]
    });
  } catch (error) {
    console.error("Error creating admin account:", error);
    res.status(500).json({ error: "T\u1EA1o t\xE0i kho\u1EA3n qu\u1EA3n tr\u1ECB th\u1EA5t b\u1EA1i / Failed to create admin account" });
  }
});
app.delete("/api/auth/admins/:id", requireAdmin, async (req, res) => {
  try {
    const targetId = Number(req.params.id);
    const currentAdminId = req.adminUser.id;
    if (targetId === currentAdminId) {
      return res.status(400).json({ error: "B\u1EA1n kh\xF4ng th\u1EC3 t\u1EF1 x\xF3a t\xE0i kho\u1EA3n c\u1EE7a ch\xEDnh m\xECnh / Cannot delete your own account." });
    }
    const count = await db.select().from(adminUsers);
    if (count.length <= 1) {
      return res.status(400).json({ error: "C\u1EA7n \xEDt nh\u1EA5t m\u1ED9t t\xE0i kho\u1EA3n qu\u1EA3n tr\u1ECB / Must have at least one admin account." });
    }
    await db.delete(adminUsers).where(eq(adminUsers.id, targetId));
    res.json({ message: "\u0110\xE3 x\xF3a t\xE0i kho\u1EA3n qu\u1EA3n tr\u1ECB / Admin account removed" });
  } catch (error) {
    console.error("Error deleting admin:", error);
    res.status(500).json({ error: "Failed to delete admin account" });
  }
});
app.post("/api/auth/change-password", requireAdmin, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: "Old password and new password are required" });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: "M\u1EADt kh\u1EA9u m\u1EDBi ph\u1EA3i t\u1EEB 6 k\xFD t\u1EF1 / New password must be at least 6 characters" });
    }
    const currentAdminId = req.adminUser.id;
    const userResult = await db.select().from(adminUsers).where(eq(adminUsers.id, currentAdminId)).limit(1);
    if (userResult.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = userResult[0];
    const isOldMatch = verifyPassword(oldPassword, user.passwordHash, user.passwordSalt);
    if (!isOldMatch) {
      return res.status(400).json({ error: "M\u1EADt kh\u1EA9u c\u0169 kh\xF4ng \u0111\xFAng / Old password is incorrect." });
    }
    const { hash, salt } = hashPassword(newPassword);
    await db.update(adminUsers).set({
      passwordHash: hash,
      passwordSalt: salt
    }).where(eq(adminUsers.id, currentAdminId));
    res.json({ message: "\u0110\u1ED5i m\u1EADt kh\u1EA9u th\xE0nh c\xF4ng / Password updated successfully!" });
  } catch (error) {
    console.error("Password change error:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
});
app.get("/api/events", async (req, res) => {
  try {
    const category = req.query.category;
    const search = req.query.search;
    const allEvents = await db.select().from(events).orderBy(asc(events.date), asc(events.startTime));
    let filtered = allEvents;
    if (category && category !== "All") {
      filtered = filtered.filter((e) => e.category.toLowerCase() === category.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (e) => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || e.location.toLowerCase().includes(q)
      );
    }
    res.json(filtered);
  } catch (error) {
    console.error("Failed to fetch events:", error);
    res.status(500).json({ error: "Failed to fetch church events" });
  }
});
app.get("/api/events/:id", async (req, res) => {
  try {
    const eventId = Number(req.params.id);
    if (isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }
    const eventResult = await db.select().from(events).where(eq(events.id, eventId));
    if (eventResult.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }
    const rsvps = await db.select({
      id: eventRsvps.id,
      userName: eventRsvps.userName,
      attendeesCount: eventRsvps.attendeesCount,
      createdAt: eventRsvps.createdAt
    }).from(eventRsvps).where(eq(eventRsvps.eventId, eventId)).orderBy(desc(eventRsvps.createdAt));
    res.json({
      ...eventResult[0],
      rsvps
    });
  } catch (error) {
    console.error("Failed to fetch event:", error);
    res.status(500).json({ error: "Failed to fetch event details" });
  }
});
app.post("/api/events", requireAuth, async (req, res) => {
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
      organizerEmail
    } = req.body;
    if (!title || !description || !date || !startTime || !location) {
      return res.status(400).json({ error: "Title, description, date, start time, and location are required." });
    }
    const newEvent = await db.insert(events).values({
      title,
      description,
      category: category || "Worship",
      date,
      startTime,
      endTime: endTime || null,
      location,
      address: address || null,
      imageUrl: imageUrl || null,
      isFeatured: Boolean(isFeatured),
      organizerName: organizerName || req.adminUser?.displayName || "Church Staff",
      organizerEmail: organizerEmail || req.adminUser?.username || null,
      createdByUid: null
    }).returning();
    res.status(201).json(newEvent[0]);
  } catch (error) {
    console.error("Failed to create event:", error);
    res.status(500).json({ error: "Failed to create church event" });
  }
});
app.put("/api/events/:id", requireAuth, async (req, res) => {
  try {
    const eventId = Number(req.params.id);
    if (isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid event ID" });
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
      organizerEmail
    } = req.body;
    const updated = await db.update(events).set({
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
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(events.id, eventId)).returning();
    if (updated.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.json(updated[0]);
  } catch (error) {
    console.error("Failed to update event:", error);
    res.status(500).json({ error: "Failed to update church event" });
  }
});
app.delete("/api/events/:id", requireAuth, async (req, res) => {
  try {
    const eventId = Number(req.params.id);
    if (isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }
    const deleted = await db.delete(events).where(eq(events.id, eventId)).returning();
    if (deleted.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.json({ message: "Event successfully removed" });
  } catch (error) {
    console.error("Failed to delete event:", error);
    res.status(500).json({ error: "Failed to delete church event" });
  }
});
app.post("/api/events/:id/rsvp", async (req, res) => {
  try {
    const eventId = Number(req.params.id);
    const { userName, userEmail, attendeesCount, notes } = req.body;
    if (!userName || !userEmail) {
      return res.status(400).json({ error: "Name and email are required for RSVP" });
    }
    const count = Math.max(1, Number(attendeesCount) || 1);
    const newRsvp = await db.insert(eventRsvps).values({
      eventId,
      userName,
      userEmail,
      attendeesCount: count,
      notes: notes || null
    }).returning();
    await db.update(events).set({
      rsvpCount: sql`${events.rsvpCount} + ${count}`
    }).where(eq(events.id, eventId));
    res.status(201).json(newRsvp[0]);
  } catch (error) {
    console.error("Failed to submit RSVP:", error);
    res.status(500).json({ error: "Failed to submit RSVP" });
  }
});
app.get("/api/verses/today", async (req, res) => {
  try {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    let verseResult = await db.select().from(dailyVerses).where(eq(dailyVerses.date, today));
    if (verseResult.length === 0) {
      verseResult = await db.select().from(dailyVerses).orderBy(desc(dailyVerses.date)).limit(1);
    }
    if (verseResult.length === 0) {
      return res.json({
        id: 0,
        date: today,
        verseText: "The Lord is my shepherd; I shall not want. He makes me lie down in green pastures. He leads me beside still waters. He restores my soul.",
        reference: "Psalm 23:1-3",
        translation: "ESV",
        reflection: "God provides for our deepest needs and leads us into rest and restoration.",
        prayer: "Lord, be our gentle shepherd and guide our hearts today.",
        theme: "Trust & Rest"
      });
    }
    res.json(verseResult[0]);
  } catch (error) {
    console.error("Failed to fetch today verse:", error);
    res.status(500).json({ error: "Failed to fetch daily verse" });
  }
});
app.get("/api/verses", async (req, res) => {
  try {
    const list = await db.select().from(dailyVerses).orderBy(desc(dailyVerses.date));
    res.json(list);
  } catch (error) {
    console.error("Failed to fetch verses:", error);
    res.status(500).json({ error: "Failed to fetch scripture verses" });
  }
});
app.post("/api/verses", requireAuth, async (req, res) => {
  try {
    const { date, verseText, reference, translation, reflection, prayer, theme } = req.body;
    if (!date || !verseText || !reference || !reflection) {
      return res.status(400).json({ error: "Date, verse text, reference, and reflection are required." });
    }
    const inserted = await db.insert(dailyVerses).values({
      date,
      verseText,
      reference,
      translation: translation || "NIV",
      reflection,
      prayer: prayer || null,
      theme: theme || "Daily Devotion",
      publishedByUid: null
    }).onConflictDoUpdate({
      target: dailyVerses.date,
      set: {
        verseText,
        reference,
        translation: translation || "NIV",
        reflection,
        prayer: prayer || null,
        theme: theme || "Daily Devotion"
      }
    }).returning();
    res.status(201).json(inserted[0]);
  } catch (error) {
    console.error("Failed to save daily verse:", error);
    res.status(500).json({ error: "Failed to save daily scripture verse" });
  }
});
app.delete("/api/verses/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const deleted = await db.delete(dailyVerses).where(eq(dailyVerses.id, id)).returning();
    if (deleted.length === 0) {
      return res.status(404).json({ error: "Verse not found" });
    }
    res.json({ message: "Verse successfully deleted" });
  } catch (error) {
    console.error("Failed to delete verse:", error);
    res.status(500).json({ error: "Failed to delete daily verse" });
  }
});
app.get("/api/prayers", async (req, res) => {
  try {
    const prayers = await db.select().from(prayerRequests).orderBy(desc(prayerRequests.createdAt));
    res.json(prayers);
  } catch (error) {
    console.error("Failed to fetch prayers:", error);
    res.status(500).json({ error: "Failed to fetch prayer requests" });
  }
});
app.post("/api/prayers", async (req, res) => {
  try {
    const { title, request, requesterName, isAnonymous, isPraise } = req.body;
    if (!title || !request) {
      return res.status(400).json({ error: "Title and prayer request are required." });
    }
    const inserted = await db.insert(prayerRequests).values({
      title,
      request,
      requesterName: isAnonymous ? "Anonymous" : requesterName || "Church Member",
      isAnonymous: Boolean(isAnonymous),
      isPraise: Boolean(isPraise),
      status: "active"
    }).returning();
    res.status(201).json(inserted[0]);
  } catch (error) {
    console.error("Failed to submit prayer:", error);
    res.status(500).json({ error: "Failed to submit prayer request" });
  }
});
app.post("/api/prayers/:id/pray", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const updated = await db.update(prayerRequests).set({
      prayerCount: sql`${prayerRequests.prayerCount} + 1`
    }).where(eq(prayerRequests.id, id)).returning();
    if (updated.length === 0) {
      return res.status(404).json({ error: "Prayer request not found" });
    }
    res.json(updated[0]);
  } catch (error) {
    console.error("Failed to update prayer count:", error);
    res.status(500).json({ error: "Failed to update prayer count" });
  }
});
app.patch("/api/prayers/:id/status", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    const updated = await db.update(prayerRequests).set({ status }).where(eq(prayerRequests.id, id)).returning();
    res.json(updated[0]);
  } catch (error) {
    console.error("Failed to update prayer status:", error);
    res.status(500).json({ error: "Failed to update prayer status" });
  }
});
app.delete("/api/prayers/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(prayerRequests).where(eq(prayerRequests.id, id));
    res.json({ message: "Prayer request removed" });
  } catch (error) {
    console.error("Failed to delete prayer:", error);
    res.status(500).json({ error: "Failed to remove prayer request" });
  }
});
app.get("/api/announcements", async (req, res) => {
  try {
    const list = await db.select().from(announcements).where(eq(announcements.active, true)).orderBy(desc(announcements.createdAt));
    res.json(list);
  } catch (error) {
    console.error("Failed to fetch announcements:", error);
    res.status(500).json({ error: "Failed to fetch announcements" });
  }
});
app.post("/api/announcements", requireAuth, async (req, res) => {
  try {
    const { title, content, priority, linkUrl, linkText } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }
    const inserted = await db.insert(announcements).values({
      title,
      content,
      priority: priority || "normal",
      linkUrl: linkUrl || null,
      linkText: linkText || null,
      active: true
    }).returning();
    res.status(201).json(inserted[0]);
  } catch (error) {
    console.error("Failed to create announcement:", error);
    res.status(500).json({ error: "Failed to create announcement" });
  }
});
app.delete("/api/announcements/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(announcements).where(eq(announcements.id, id));
    res.json({ message: "Announcement deleted" });
  } catch (error) {
    console.error("Failed to delete announcement:", error);
    res.status(500).json({ error: "Failed to delete announcement" });
  }
});
app.post("/api/ai/generate-devotional", requireAuth, async (req, res) => {
  try {
    const { passage, theme } = req.body;
    if (!passage) {
      return res.status(400).json({ error: "Scripture passage is required." });
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: "Gemini API key not configured on server." });
    }
    const ai = new GoogleGenAI();
    const prompt = `You are a warm, wise pastoral writer for a Christian church community. 
Generate a devotional reflection for the scripture: "${passage}". 
Theme focus: ${theme || "Faith, hope, and love"}.

Please return a valid JSON object matching this schema exactly:
{
  "reference": "${passage}",
  "verseText": "Full text of the passage (NIV or ESV)",
  "reflection": "A 2-3 paragraph compassionate, encouraging reflection connecting scripture to daily life",
  "prayer": "A brief 2-3 sentence heartfelt closing prayer",
  "theme": "A 2-3 word theme title"
}`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error) {
    console.error("Error in devotional generator:", error);
    res.status(500).json({ error: "Failed to generate devotional draft" });
  }
});
async function startServer() {
  if (process.env.NODE_ENV === "production") {
    const distPath = __dirname.endsWith("dist") ? __dirname : path.join(__dirname, "dist");
    console.log(`Serving production static assets from: ${distPath}`);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    console.log("Mounting Vite dev server middleware");
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa"
    });
    app.use(vite.middlewares);
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Vietnamese Revival Church server listening on http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
