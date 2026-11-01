var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server.ts
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import express2 from "express";

// src/vrc-backend/app.ts
import express from "express";

// src/vrc-backend/middleware/securityMiddleware.ts
import cors from "cors";
var rateLimitStore = /* @__PURE__ */ new Map();
var rateLimiter = (options) => {
  return (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const key = `${req.path}:${ip}`;
    const now = Date.now();
    const record = rateLimitStore.get(key);
    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + options.windowMs
      });
      return next();
    }
    if (record.count >= options.max) {
      return res.status(429).json({ error: options.message });
    }
    record.count += 1;
    next();
  };
};
var authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 15,
  // max 15 login attempts per window
  message: "Too many login attempts. Please wait 15 minutes before trying again."
});
var aiRateLimiter = rateLimiter({
  windowMs: 60 * 1e3,
  // 1 minute
  max: 10,
  message: "Devotional generator rate limit reached. Please wait a moment."
});
var corsMiddleware = cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
});

// src/vrc-backend/middleware/errorHandler.ts
var errorHandler = (err, req, res, next) => {
  console.error(`[SERVER ERROR] ${req.method} ${req.url}:`, err);
  const status = err.status || err.statusCode || 500;
  const isDev = process.env.NODE_ENV !== "production";
  const message = isDev && err.message ? err.message : "An unexpected error occurred. Please try again.";
  res.status(status).json({
    error: message,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
};

// src/vrc-backend/routes/authRoutes.ts
import { Router } from "express";

// src/vrc-db/index.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// src/vrc-db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  adminUsers: () => adminUsers,
  announcements: () => announcements,
  dailyVerses: () => dailyVerses,
  eventRsvps: () => eventRsvps,
  eventRsvpsRelations: () => eventRsvpsRelations,
  events: () => events,
  eventsRelations: () => eventsRelations,
  notifications: () => notifications,
  prayerRequests: () => prayerRequests,
  users: () => users
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
  // 'Worship', 'Bible Study', 'Youth', 'Special Gathering'
  date: text("date").notNull(),
  // YYYY-MM-DD
  startTime: text("start_time").notNull(),
  // e.g. "03:00 PM"
  endTime: text("end_time"),
  // e.g. "05:00 PM"
  location: text("location").notNull(),
  // e.g. "Main Sanctuary"
  address: text("address").default("Tempe, Arizona"),
  imageUrl: text("image_url"),
  isFeatured: boolean("is_featured").notNull().default(false),
  rsvpCount: integer("rsvp_count").notNull().default(0),
  maxCapacity: integer("max_capacity"),
  organizerName: text("organizer_name"),
  organizerEmail: text("organizer_email"),
  createdByUid: text("created_by_uid"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var dailyVerses = pgTable("daily_verses", {
  id: serial("id").primaryKey(),
  date: text("date").notNull().unique(),
  // YYYY-MM-DD
  verseText: text("verse_text").notNull(),
  reference: text("reference").notNull(),
  // e.g. "2 Chronicles 7:14"
  translation: text("translation").notNull().default("NIV"),
  reflection: text("reflection").notNull(),
  prayer: text("prayer"),
  theme: text("theme").default("Faith & Encouragement"),
  publishedByUid: text("published_by_uid"),
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
  createdAt: timestamp("created_at").defaultNow()
});
var announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  priority: text("priority").notNull().default("normal"),
  linkUrl: text("link_url"),
  linkText: text("link_text"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow()
});
var notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  type: text("type").notNull(),
  // 'event' | 'verse' | 'announcement'
  targetId: integer("target_id"),
  createdAt: timestamp("created_at").defaultNow()
});
var eventsRelations = relations(events, ({ many }) => ({
  rsvps: many(eventRsvps)
}));
var eventRsvpsRelations = relations(eventRsvps, ({ one }) => ({
  event: one(events, {
    fields: [eventRsvps.eventId],
    references: [events.id]
  })
}));

// src/vrc-db/index.ts
var createPool = () => {
  if (!global._vrcPostgresPool) {
    global._vrcPostgresPool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      connectionTimeoutMillis: 15e3,
      idleTimeoutMillis: 3e4
    });
    global._vrcPostgresPool.on("error", (err) => {
      console.error("Database connection error in PostgreSQL pool:", err);
    });
  }
  return global._vrcPostgresPool;
};
var pool = createPool();
var db = drizzle(pool, { schema: schema_exports });

// src/vrc-backend/routes/authRoutes.ts
import { eq, asc, sql } from "drizzle-orm";

// src/vrc-backend/services/authService.ts
import crypto from "crypto";
var SECRET = process.env.AUTH_SECRET || "vn-revival-church-tempe-az-secret-key-2026";
var AuthService = {
  // Cryptographic salt generation & PBKDF2 SHA-512 password hashing
  hashPassword(password) {
    const salt = crypto.randomBytes(32).toString("hex");
    const hash = crypto.pbkdf2Sync(password, salt, 1e5, 64, "sha512").toString("hex");
    return { hash, salt };
  },
  // Timing-safe password verification to prevent timing attack vulnerabilities
  verifyPassword(password, storedHash, salt) {
    try {
      const hash = crypto.pbkdf2Sync(password, salt, 1e5, 64, "sha512").toString("hex");
      const hashBuf = Buffer.from(hash, "hex");
      const storedBuf = Buffer.from(storedHash, "hex");
      if (hashBuf.length !== storedBuf.length) {
        return false;
      }
      return crypto.timingSafeEqual(hashBuf, storedBuf);
    } catch {
      return false;
    }
  },
  // Cryptographically signed session token (HMAC-SHA256)
  createToken(user) {
    const payload = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1e3
      // 7-day expiration
    };
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = crypto.createHmac("sha256", SECRET).update(payloadB64).digest("base64url");
    return `${payloadB64}.${signature}`;
  },
  // Token signature and expiration verification
  verifyToken(token) {
    try {
      const parts = token.split(".");
      if (parts.length !== 2) return null;
      const [payloadB64, signature] = parts;
      const expectedSig = crypto.createHmac("sha256", SECRET).update(payloadB64).digest("base64url");
      const sigBuf = Buffer.from(signature);
      const expectedBuf = Buffer.from(expectedSig);
      if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
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
};

// src/vrc-backend/middleware/authMiddleware.ts
var requireAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Administrator authentication required." });
  }
  const token = authHeader.split("Bearer ")[1]?.trim();
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Missing session token." });
  }
  const payload = AuthService.verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Session expired or invalid. Please sign in again." });
  }
  req.adminUser = payload;
  next();
};

// src/vrc-backend/routes/authRoutes.ts
var router = Router();
router.post("/login", authRateLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required." });
    }
    const cleanUsername = String(username).trim().toLowerCase();
    const existing = await db.select().from(adminUsers).where(sql`LOWER(${adminUsers.username}) = ${cleanUsername}`).limit(1);
    if (existing.length === 0) {
      return res.status(401).json({ error: "T\xEAn \u0111\u0103ng nh\u1EADp ho\u1EB7c m\u1EADt kh\u1EA9u kh\xF4ng ch\xEDnh x\xE1c / Invalid username or password." });
    }
    const user = existing[0];
    const isMatch = AuthService.verifyPassword(password, user.passwordHash, user.passwordSalt);
    if (!isMatch) {
      return res.status(401).json({ error: "T\xEAn \u0111\u0103ng nh\u1EADp ho\u1EB7c m\u1EADt kh\u1EA9u kh\xF4ng ch\xEDnh x\xE1c / Invalid username or password." });
    }
    const token = AuthService.createToken({
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
router.get("/me", requireAdmin, async (req, res) => {
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
    console.error("Session verification error:", error);
    res.status(500).json({ error: "Failed to verify session" });
  }
});
router.get("/admins", requireAdmin, async (req, res) => {
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
    console.error("List admins error:", error);
    res.status(500).json({ error: "Failed to list admin accounts" });
  }
});
router.post("/create-admin", requireAdmin, async (req, res) => {
  try {
    const { username, password, email, displayName } = req.body;
    if (!username || !password || !displayName) {
      return res.status(400).json({ error: "Username, password, and display name are required" });
    }
    const cleanUsername = String(username).trim().toLowerCase();
    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      return res.status(400).json({ error: "Username must be between 3 and 30 characters." });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }
    const existing = await db.select().from(adminUsers).where(sql`LOWER(${adminUsers.username}) = ${cleanUsername}`).limit(1);
    if (existing.length > 0) {
      return res.status(409).json({ error: "T\xEAn \u0111\u0103ng nh\u1EADp \u0111\xE3 t\u1ED3n t\u1EA1i / Username already exists." });
    }
    const { hash, salt } = AuthService.hashPassword(password);
    const inserted = await db.insert(adminUsers).values({
      username: cleanUsername,
      email: email ? String(email).trim() : `${cleanUsername}@vnrevivalchurch.org`,
      displayName: String(displayName).trim().slice(0, 100),
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
      message: "Admin account created successfully",
      user: inserted[0]
    });
  } catch (error) {
    console.error("Create admin error:", error);
    res.status(500).json({ error: "Failed to create admin account" });
  }
});
router.delete("/admins/:id", requireAdmin, async (req, res) => {
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
    console.error("Delete admin error:", error);
    res.status(500).json({ error: "Failed to delete admin account" });
  }
});
router.post("/change-password", requireAdmin, async (req, res) => {
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
    const isOldMatch = AuthService.verifyPassword(oldPassword, user.passwordHash, user.passwordSalt);
    if (!isOldMatch) {
      return res.status(400).json({ error: "M\u1EADt kh\u1EA9u c\u0169 kh\xF4ng \u0111\xFAng / Old password is incorrect." });
    }
    const { hash, salt } = AuthService.hashPassword(newPassword);
    await db.update(adminUsers).set({
      passwordHash: hash,
      passwordSalt: salt
    }).where(eq(adminUsers.id, currentAdminId));
    res.json({ message: "\u0110\u1ED5i m\u1EADt kh\u1EA9u th\xE0nh c\xF4ng / Password updated successfully!" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
});
var authRoutes_default = router;

// src/vrc-backend/routes/eventRoutes.ts
import { Router as Router2 } from "express";
import { eq as eq2, desc as desc2, asc as asc2, sql as sql2 } from "drizzle-orm";

// src/vrc-backend/services/notificationService.ts
import { desc } from "drizzle-orm";
var BackendNotificationService = {
  async recordNotification(title, body, type, targetId) {
    try {
      const inserted = await db.insert(notifications).values({
        title,
        body,
        type,
        targetId: targetId || null
      }).returning();
      return inserted[0];
    } catch (err) {
      console.error("Failed to log push notification:", err);
      return null;
    }
  },
  async getRecent(limit = 20) {
    return await db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(limit);
  }
};

// src/vrc-backend/routes/eventRoutes.ts
var router2 = Router2();
router2.get("/", async (req, res) => {
  try {
    const category = req.query.category;
    const search = req.query.search;
    const allEvents = await db.select().from(events).orderBy(asc2(events.date), asc2(events.startTime));
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
    res.status(500).json({ error: "Failed to retrieve church events" });
  }
});
router2.get("/:id", async (req, res) => {
  try {
    const eventId = Number(req.params.id);
    if (isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }
    const eventResult = await db.select().from(events).where(eq2(events.id, eventId)).limit(1);
    if (eventResult.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }
    const rsvps = await db.select().from(eventRsvps).where(eq2(eventRsvps.eventId, eventId)).orderBy(desc2(eventRsvps.createdAt));
    res.json({
      ...eventResult[0],
      rsvps
    });
  } catch (error) {
    console.error("Failed to fetch event:", error);
    res.status(500).json({ error: "Failed to fetch event details" });
  }
});
router2.post("/", requireAdmin, async (req, res) => {
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
      title: String(title).trim(),
      description: String(description).trim(),
      category: category || "Worship",
      date,
      startTime,
      endTime: endTime || null,
      location: String(location).trim(),
      address: address ? String(address).trim() : "Tempe, Arizona",
      imageUrl: imageUrl || null,
      isFeatured: Boolean(isFeatured),
      maxCapacity: maxCapacity ? Number(maxCapacity) : null,
      organizerName: organizerName || req.adminUser?.displayName || "Church Staff",
      organizerEmail: organizerEmail || req.adminUser?.username || null,
      createdByUid: null
    }).returning();
    await BackendNotificationService.recordNotification(
      `New Church Event: ${title.trim()}`,
      `${date} \u2022 ${startTime} at ${location.trim()}`,
      "event",
      newEvent[0].id
    );
    res.status(201).json(newEvent[0]);
  } catch (error) {
    console.error("Failed to create event:", error);
    res.status(500).json({ error: "Failed to create church event" });
  }
});
router2.put("/:id", requireAdmin, async (req, res) => {
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
      title: title ? String(title).trim() : void 0,
      description: description ? String(description).trim() : void 0,
      category,
      date,
      startTime,
      endTime,
      location: location ? String(location).trim() : void 0,
      address: address ? String(address).trim() : void 0,
      imageUrl,
      isFeatured: isFeatured !== void 0 ? Boolean(isFeatured) : void 0,
      maxCapacity: maxCapacity !== void 0 ? maxCapacity ? Number(maxCapacity) : null : void 0,
      organizerName,
      organizerEmail,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq2(events.id, eventId)).returning();
    if (updated.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.json(updated[0]);
  } catch (error) {
    console.error("Failed to update event:", error);
    res.status(500).json({ error: "Failed to update church event" });
  }
});
router2.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const eventId = Number(req.params.id);
    if (isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }
    const deleted = await db.delete(events).where(eq2(events.id, eventId)).returning();
    if (deleted.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.json({ message: "Event successfully removed", event: deleted[0] });
  } catch (error) {
    console.error("Failed to delete event:", error);
    res.status(500).json({ error: "Failed to delete event" });
  }
});
router2.post("/:id/rsvp", async (req, res) => {
  try {
    const eventId = Number(req.params.id);
    const { userName, userEmail, attendeesCount, notes } = req.body;
    if (!userName || !userEmail) {
      return res.status(400).json({ error: "Name and email are required for RSVP." });
    }
    const count = Number(attendeesCount) || 1;
    const newRsvp = await db.insert(eventRsvps).values({
      eventId,
      userName: String(userName).trim(),
      userEmail: String(userEmail).trim(),
      attendeesCount: count,
      notes: notes ? String(notes).trim() : null
    }).returning();
    await db.update(events).set({
      rsvpCount: sql2`${events.rsvpCount} + ${count}`
    }).where(eq2(events.id, eventId));
    res.status(201).json(newRsvp[0]);
  } catch (error) {
    console.error("Failed to submit RSVP:", error);
    res.status(500).json({ error: "Failed to submit RSVP" });
  }
});
var eventRoutes_default = router2;

// src/vrc-backend/routes/verseRoutes.ts
import { Router as Router3 } from "express";
import { eq as eq3, desc as desc3 } from "drizzle-orm";
var router3 = Router3();
router3.get("/today", async (req, res) => {
  try {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    let verseResult = await db.select().from(dailyVerses).where(eq3(dailyVerses.date, today));
    if (verseResult.length === 0) {
      verseResult = await db.select().from(dailyVerses).orderBy(desc3(dailyVerses.date)).limit(1);
    }
    if (verseResult.length === 0) {
      return res.json({
        id: 0,
        date: today,
        verseText: "N\u1EBFu d\xE2n s\u1EF1 ta, l\xE0 d\xE2n \u0111\u01B0\u1EE3c g\u1ECDi b\u1EB1ng danh ta, h\u1EA1 m\xECnh xu\u1ED1ng, c\u1EA7u nguy\u1EC7n, t\xECm ki\u1EBFm m\u1EB7t ta v\xE0 t\u1EEB b\u1ECF con \u0111\u01B0\u1EDDng t\xE0, th\xEC t\u1EEB tr\xEAn tr\u1EDDi ta s\u1EBD l\u1EAFng nghe, tha th\u1EE9 t\u1ED9i l\u1ED7i h\u1ECD v\xE0 ch\u1EEFa l\xE0nh \u0111\u1EA5t n\u01B0\u1EDBc h\u1ECD.",
        reference: "2 Chronicles 7:14 (2 S\u1EED K\xFD 7:14)",
        translation: "NIV",
        reflection: "L\u1EDDi h\u1EE9a c\u1EE7a Ch\xFAa v\u1EC1 s\u1EF1 ph\u1EE5c h\u01B0ng b\u1EAFt \u0111\u1EA7u khi d\xE2n s\u1EF1 Ng\xE0i hi\u1EC7p m\u1ED9t trong s\u1EF1 c\u1EA7u nguy\u1EC7n v\xE0 khi\xEAm nh\u01B0\u1EDDng.",
        prayer: "L\u1EA1y Ch\xFAa, xin \u0111em s\u1EF1 ph\u1EE5c h\u01B0ng \u0111\u1EBFn tr\xEAn h\u1ED9i th\xE1nh, gia \u0111\xECnh v\xE0 \u0111\u1EDDi s\u1ED1ng ch\xFAng con.",
        theme: "Revival & Repentance"
      });
    }
    res.json(verseResult[0]);
  } catch (error) {
    console.error("Failed to fetch today verse:", error);
    res.status(500).json({ error: "Failed to fetch daily verse" });
  }
});
router3.get("/", async (req, res) => {
  try {
    const list = await db.select().from(dailyVerses).orderBy(desc3(dailyVerses.date));
    res.json(list);
  } catch (error) {
    console.error("Failed to fetch verses:", error);
    res.status(500).json({ error: "Failed to fetch scripture verses" });
  }
});
router3.post("/", requireAdmin, async (req, res) => {
  try {
    const { date, verseText, reference, translation, reflection, prayer, theme } = req.body;
    if (!date || !verseText || !reference || !reflection) {
      return res.status(400).json({ error: "Date, verse text, reference, and reflection are required." });
    }
    const inserted = await db.insert(dailyVerses).values({
      date,
      verseText: String(verseText).trim(),
      reference: String(reference).trim(),
      translation: translation || "NIV",
      reflection: String(reflection).trim(),
      prayer: prayer ? String(prayer).trim() : null,
      theme: theme ? String(theme).trim() : "Daily Devotion",
      publishedByUid: null
    }).onConflictDoUpdate({
      target: dailyVerses.date,
      set: {
        verseText: String(verseText).trim(),
        reference: String(reference).trim(),
        translation: translation || "NIV",
        reflection: String(reflection).trim(),
        prayer: prayer ? String(prayer).trim() : null,
        theme: theme ? String(theme).trim() : "Daily Devotion"
      }
    }).returning();
    await BackendNotificationService.recordNotification(
      `Scripture of the Day: ${reference.trim()}`,
      `"${verseText.trim().slice(0, 100)}..."`,
      "verse",
      inserted[0].id
    );
    res.status(201).json(inserted[0]);
  } catch (error) {
    console.error("Failed to save daily verse:", error);
    res.status(500).json({ error: "Failed to save daily scripture verse" });
  }
});
router3.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const deleted = await db.delete(dailyVerses).where(eq3(dailyVerses.id, id)).returning();
    if (deleted.length === 0) {
      return res.status(404).json({ error: "Verse not found" });
    }
    res.json({ message: "Verse successfully deleted" });
  } catch (error) {
    console.error("Failed to delete verse:", error);
    res.status(500).json({ error: "Failed to delete scripture verse" });
  }
});
var verseRoutes_default = router3;

// src/vrc-backend/routes/notifRoutes.ts
import { Router as Router4 } from "express";
var router4 = Router4();
router4.get("/recent", async (req, res) => {
  try {
    const list = await BackendNotificationService.getRecent(20);
    res.json(list);
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    res.status(500).json({ error: "Failed to retrieve notifications" });
  }
});
var notifRoutes_default = router4;

// src/vrc-backend/routes/devotionalRoutes.ts
import { Router as Router5 } from "express";

// src/vrc-backend/services/devotionalService.ts
import { GoogleGenAI } from "@google/genai";
var DevotionalService = {
  async generateDevotional(passage, theme = "Faith & Revival") {
    const ai = new GoogleGenAI();
    const prompt = `You are a pastor at Vietnamese Revival Church (H\u1ED9i Th\xE1nh Ph\u1EE5c H\u01B0ng Vi\u1EC7t Nam) in Tempe, Arizona.
Draft an uplifting daily devotional reading and pastoral reflection based on this scripture: "${passage}".
Theme: ${theme}.

Requirements:
1. Provide the exact scripture text in a concise form.
2. Provide an inspiring pastoral reflection (2-3 short, deeply encouraging paragraphs).
3. Provide a heartfelt closing prayer.
4. Output must be valid JSON strictly matching this schema:
{
  "verseText": "The actual verse scripture text",
  "reflection": "The pastoral devotional reflection text",
  "prayer": "A brief heartfelt closing prayer",
  "theme": "The core theme"
}`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text || "{}");
  }
};

// src/vrc-backend/routes/devotionalRoutes.ts
var router5 = Router5();
router5.post("/generate-devotional", requireAdmin, aiRateLimiter, async (req, res) => {
  try {
    const { passage, theme } = req.body;
    if (!passage) {
      return res.status(400).json({ error: "Scripture passage reference is required" });
    }
    const draft = await DevotionalService.generateDevotional(
      String(passage).trim(),
      theme ? String(theme).trim() : "Faith & Revival"
    );
    res.json(draft);
  } catch (error) {
    console.error("Error in devotional generator:", error);
    res.status(500).json({ error: "Failed to generate devotional draft" });
  }
});
var devotionalRoutes_default = router5;

// src/vrc-backend/app.ts
var createApp = () => {
  const app2 = express();
  app2.use(corsMiddleware);
  app2.use(express.json({ limit: "1mb" }));
  app2.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      service: "Vietnamese Revival Church API",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app2.use("/api/auth", authRoutes_default);
  app2.use("/api/events", eventRoutes_default);
  app2.use("/api/verses", verseRoutes_default);
  app2.use("/api/notifications", notifRoutes_default);
  app2.use("/api/ai", devotionalRoutes_default);
  app2.use(errorHandler);
  return app2;
};

// server.ts
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = createApp();
var PORT = Number(process.env.PORT) || 3e3;
async function startServer() {
  if (process.env.NODE_ENV === "production") {
    const distPath = __dirname.endsWith("dist") ? __dirname : path.join(__dirname, "dist");
    console.log(`Serving production static assets from: ${distPath}`);
    app.use(express2.static(distPath));
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
    console.log(`Vietnamese Revival Church server running at http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
