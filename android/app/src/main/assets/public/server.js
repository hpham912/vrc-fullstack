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
import compression from "compression";

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
var ALLOWED_ORIGINS = [
  "https://my.vrcfamily.org",
  "https://vrcfamily.org",
  "https://localhost",
  "capacitor://localhost",
  "http://localhost:5173",
  "http://localhost:3000"
];
var corsMiddleware = cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "X-App-Env"]
});

// src/vrc-backend/middleware/errorHandler.ts
var AppError = class extends Error {
  constructor(message, status = 500, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
};
function fromPostgres(err) {
  const code = err?.code || err?.cause?.code;
  if (!code) return null;
  if (code === "23505") {
    return new AppError("A record with these details already exists.", 409, "ALREADY_EXISTS");
  }
  if (code === "23503") {
    return new AppError("This item is still referenced by other data and cannot be changed.", 400, "REFERENCED");
  }
  if (code === "23502") {
    return new AppError("A required field is missing.", 400, "VALIDATION_ERROR");
  }
  if (code === "22P02" || code === "22003") {
    return new AppError("One of the values is not valid.", 400, "VALIDATION_ERROR");
  }
  if (code === "ECONNREFUSED" || code === "ETIMEDOUT" || code === "ENOTFOUND" || code === "57P01" || code === "53300") {
    return new AppError("The database is temporarily unavailable. Please try again in a moment.", 503, "SERVICE_UNAVAILABLE");
  }
  return null;
}
function toAppError(err) {
  if (err instanceof AppError) return err;
  const pg = fromPostgres(err);
  if (pg) return pg;
  if (err?.code === "ECONNREFUSED" || err?.code === "ETIMEDOUT" || err?.code === "ENOTFOUND") {
    return new AppError("The service is temporarily unavailable. Please try again in a moment.", 503, "SERVICE_UNAVAILABLE");
  }
  return new AppError("Something went wrong on our side. Please try again.", 500, "INTERNAL_ERROR");
}
var errorHandler = (err, req, res, _next) => {
  const appErr = toAppError(err);
  console.error(`[SERVER ERROR] ${req.method} ${req.originalUrl}:`, err);
  res.status(appErr.status).json({
    error: appErr.message,
    status: appErr.status,
    code: appErr.code || void 0,
    method: req.method,
    path: req.originalUrl,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
};

// src/vrc-backend/routes/authRoutes.ts
import { randomInt } from "crypto";
import { Router } from "express";

// src/vrc-db/index.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { AsyncLocalStorage } from "async_hooks";

// src/vrc-db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  adminUsers: () => adminUsers,
  announcements: () => announcements,
  churchInfo: () => churchInfo,
  dailyVerses: () => dailyVerses,
  deviceTokens: () => deviceTokens,
  events: () => events,
  notifications: () => notifications,
  prayerRequests: () => prayerRequests,
  sermons: () => sermons,
  spotlight: () => spotlight,
  users: () => users
});

// src/db/schema.ts
import {
  boolean,
  integer,
  jsonb,
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
  titleVi: text("title_vi"),
  titleEn: text("title_en"),
  description: text("description").notNull(),
  descriptionVi: text("description_vi"),
  descriptionEn: text("description_en"),
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
  locationVi: text("location_vi"),
  locationEn: text("location_en"),
  address: text("address").default("Tempe, Arizona"),
  imageUrl: text("image_url"),
  isFeatured: boolean("is_featured").notNull().default(false),
  hasZoom: boolean("has_zoom").notNull().default(false),
  maxCapacity: integer("max_capacity"),
  organizerName: text("organizer_name"),
  organizerEmail: text("organizer_email"),
  createdByUid: text("created_by_uid"),
  createdBy: text("created_by"),
  updatedBy: text("updated_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var dailyVerses = pgTable("daily_verses", {
  id: serial("id").primaryKey(),
  date: text("date").notNull().unique(),
  // YYYY-MM-DD
  verseText: text("verse_text").notNull(),
  verseTextVi: text("verse_text_vi"),
  verseTextEn: text("verse_text_en"),
  reference: text("reference").notNull(),
  // e.g. "2 Chronicles 7:14"
  referenceVi: text("reference_vi"),
  referenceEn: text("reference_en"),
  translation: text("translation").notNull().default("NIV"),
  translationVi: text("translation_vi"),
  translationEn: text("translation_en"),
  reflection: text("reflection").notNull(),
  reflectionVi: text("reflection_vi"),
  reflectionEn: text("reflection_en"),
  prayer: text("prayer"),
  prayerVi: text("prayer_vi"),
  prayerEn: text("prayer_en"),
  theme: text("theme").default("Faith & Encouragement"),
  publishedByUid: text("published_by_uid"),
  createdBy: text("created_by"),
  updatedBy: text("updated_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var sermons = pgTable("sermons", {
  id: serial("id").primaryKey(),
  youtubeUrl: text("youtube_url").notNull(),
  videoId: text("video_id").notNull(),
  titleVi: text("title_vi").notNull(),
  titleEn: text("title_en").notNull(),
  descriptionVi: text("description_vi"),
  descriptionEn: text("description_en"),
  date: text("date").notNull(),
  // YYYY-MM-DD (the Sunday worship date)
  createdBy: text("created_by"),
  updatedBy: text("updated_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
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
var churchInfo = pgTable("church_info", {
  id: integer("id").primaryKey(),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var spotlight = pgTable("spotlight", {
  id: integer("id").primaryKey(),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var deviceTokens = pgTable("device_tokens", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  platform: text("platform").notNull().default("android"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// src/vrc-db/index.ts
var dbContext = new AsyncLocalStorage();
var createPool = (databaseName, poolRef) => {
  const globalKey = poolRef === "dev" ? "_vrcDevPostgresPool" : "_vrcProdPostgresPool";
  if (!global[globalKey]) {
    const pool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: databaseName,
      max: 10,
      connectionTimeoutMillis: 15e3,
      idleTimeoutMillis: 3e4
    });
    pool.on("error", (err) => {
      console.error(`Database connection error in PostgreSQL [${databaseName}] pool:`, err);
    });
    global[globalKey] = pool;
  }
  return global[globalKey];
};
var devPool = createPool("cloud_sql_development_database", "dev");
var prodPool = createPool("cloud_sql_production_database", "prod");
var devDb = drizzle(devPool, { schema: schema_exports });
var prodDb = drizzle(prodPool, { schema: schema_exports });
var STARTUP_ENV = process.env.APP_URL?.includes("ais-pre") || process.env.K_SERVICE?.includes("ais-pre") || process.env.SQL_DB_NAME === "cloud_sql_production_database" ? "production" : "development";
function getDb(env) {
  const targetEnv = env || dbContext.getStore() || STARTUP_ENV;
  return targetEnv === "production" ? prodDb : devDb;
}
var db = new Proxy({}, {
  get(_target, prop) {
    const activeDb = getDb();
    const val = activeDb[prop];
    return typeof val === "function" ? val.bind(activeDb) : val;
  }
});

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
    const cleanPassword = String(password).trim();
    let user = null;
    try {
      const existing = await db.select().from(adminUsers).where(sql`LOWER(${adminUsers.username}) = ${cleanUsername} OR LOWER(${adminUsers.email}) = ${cleanUsername}`).limit(1);
      if (existing.length > 0) {
        user = existing[0];
      }
    } catch (dbErr) {
      console.warn("DB lookup warning during login:", dbErr);
    }
    if (user && user.passwordHash && user.passwordSalt) {
      const isMatch = AuthService.verifyPassword(cleanPassword, user.passwordHash, user.passwordSalt);
      if (isMatch) {
        const token = AuthService.createToken({
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          role: user.role
        });
        return res.json({
          token,
          user: {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            email: user.email,
            role: user.role
          }
        });
      }
    }
    return res.status(401).json({ error: "T\xEAn \u0111\u0103ng nh\u1EADp ho\u1EB7c m\u1EADt kh\u1EA9u kh\xF4ng ch\xEDnh x\xE1c / Invalid username or password." });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "\u0110\u0103ng nh\u1EADp th\u1EA5t b\u1EA1i / Login failed" });
  }
});
router.get("/me", requireAdmin, async (req, res) => {
  try {
    const admin = req.adminUser;
    try {
      const user = await db.select({
        id: adminUsers.id,
        username: adminUsers.username,
        email: adminUsers.email,
        displayName: adminUsers.displayName,
        role: adminUsers.role,
        createdAt: adminUsers.createdAt
      }).from(adminUsers).where(eq(adminUsers.id, admin.id)).limit(1);
      if (user.length > 0) {
        return res.json({ user: user[0] });
      }
    } catch (e) {
      console.warn("DB lookup in /me warning:", e);
    }
    res.json({
      user: {
        id: admin.id,
        username: admin.username,
        displayName: admin.displayName || "Administrator",
        email: admin.username === "vrcadmin" ? "ngochoang5111@gmail.com" : "admin@vrcfamily.org",
        role: admin.role
      }
    });
  } catch (error) {
    console.error("Session verification error:", error);
    res.status(500).json({ error: "Failed to verify session" });
  }
});
router.get("/admins", requireAdmin, async (_req, res) => {
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
      email: email ? String(email).trim() : "",
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
      message: "Admin account created successfully in PostgreSQL",
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
router.post("/admins/:id/reset-password", requireAdmin, async (req, res) => {
  try {
    const targetId = Number(req.params.id);
    const currentAdminId = req.adminUser.id;
    if (!Number.isInteger(targetId) || targetId <= 0) {
      return res.status(400).json({ error: "Invalid admin id" });
    }
    if (targetId === currentAdminId) {
      return res.status(400).json({ error: "B\u1EA1n kh\xF4ng th\u1EC3 \u0111\u1EB7t l\u1EA1i m\u1EADt kh\u1EA9u c\u1EE7a ch\xEDnh m\xECnh \u2014 h\xE3y d\xF9ng \u0110\u1ED5i M\u1EADt Kh\u1EA9u / Cannot reset your own password \u2014 use Change Password instead." });
    }
    const target = await db.select().from(adminUsers).where(eq(adminUsers.id, targetId)).limit(1);
    if (target.length === 0) {
      return res.status(404).json({ error: "Admin account not found" });
    }
    const tempCode = String(randomInt(1e5, 1e6));
    const { hash, salt } = AuthService.hashPassword(tempCode);
    await db.update(adminUsers).set({
      passwordHash: hash,
      passwordSalt: salt
    }).where(eq(adminUsers.id, targetId));
    res.json({ message: "\u0110\u1EB7t l\u1EA1i m\u1EADt kh\u1EA9u th\xE0nh m\xE3 t\u1EA1m th\u1EDDi th\xE0nh c\xF4ng / Password reset to a temporary code successfully", tempCode });
  } catch (error) {
    console.error("Reset admin password error:", error);
    res.status(500).json({ error: "Failed to reset admin password" });
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
import { eq as eq4, desc as desc2, asc as asc2, sql as sql2 } from "drizzle-orm";

// src/vrc-backend/services/notificationService.ts
import { desc, eq as eq3, and, inArray } from "drizzle-orm";

// src/vrc-backend/services/pushService.ts
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { eq as eq2 } from "drizzle-orm";
var messaging = null;
var pushInitWarningLogged = false;
function getMessenger() {
  if (messaging) return messaging;
  try {
    let app2;
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (getApps().length > 0) {
      app2 = getApps()[0];
    } else if (serviceAccountJson) {
      app2 = initializeApp({
        credential: cert(JSON.parse(serviceAccountJson))
      });
    } else {
      app2 = initializeApp();
    }
    messaging = getMessaging(app2);
    return messaging;
  } catch (err) {
    if (!pushInitWarningLogged) {
      pushInitWarningLogged = true;
      console.warn(
        "Push notifications disabled: Firebase credentials not available.",
        err instanceof Error ? err.message : err
      );
    }
    return null;
  }
}
var PushService = {
  // Store (or refresh) a phone's FCM token. Called by the app on launch.
  async registerToken(token, platform) {
    const cleanToken = typeof token === "string" ? token.trim() : "";
    if (!cleanToken) return false;
    const cleanPlatform = platform === "ios" ? "ios" : "android";
    try {
      await db.insert(deviceTokens).values({ token: cleanToken, platform: cleanPlatform, updatedAt: /* @__PURE__ */ new Date() }).onConflictDoUpdate({
        target: deviceTokens.token,
        set: { platform: cleanPlatform, updatedAt: /* @__PURE__ */ new Date() }
      });
      return true;
    } catch (err) {
      console.error("Failed to register push token:", err);
      return false;
    }
  },
  // Send a push to every registered phone. Called when a notification is
  // created (event, verse, announcement). Fire-and-forget: a push failure
  // never breaks notification creation. Invalid tokens (app uninstalled)
  // are removed so they stop being retried.
  //
  // Android and iOS share this one send path — FCM multicast delivers to
  // both (on iOS it routes through Apple Push). The `platform` column in
  // device_tokens is the record of which phone is which; use
  // sendPushToPlatform to target just one side (for example, to test
  // iOS alone when it is added).
  async sendPushToAll(title, body, data) {
    await this.sendPushToPlatform(null, title, body, data);
  },
  async sendPushToPlatform(platform, title, body, data) {
    const messenger = getMessenger();
    if (!messenger) return;
    try {
      const rows = platform ? await db.select({ token: deviceTokens.token }).from(deviceTokens).where(eq2(deviceTokens.platform, platform)) : await db.select({ token: deviceTokens.token }).from(deviceTokens);
      const tokens = rows.map((row) => row.token).filter(Boolean);
      if (tokens.length === 0) return;
      const response = await messenger.sendEachForMulticast({
        tokens,
        notification: { title, body },
        data,
        android: {
          priority: "high",
          notification: {
            channelId: "vrc_notifications",
            sound: "default",
            priority: "high"
          }
        }
      });
      const invalidTokens = [];
      response.responses.forEach((result, index) => {
        if (!result.success) {
          const code = result.error?.code;
          if (code === "messaging/registration-token-not-registered" || code === "messaging/invalid-registration-token") {
            invalidTokens.push(tokens[index]);
          }
        }
      });
      if (invalidTokens.length > 0) {
        for (const token of invalidTokens) {
          await db.delete(deviceTokens).where(eq2(deviceTokens.token, token));
        }
      }
      if (response.failureCount > 0) {
        console.warn(
          `Push: ${response.successCount} sent, ${response.failureCount} failed.`
        );
      }
    } catch (err) {
      console.error("Failed to send push notifications:", err);
    }
  }
};

// src/vrc-backend/services/notificationService.ts
async function enforceMaxTenNotifications() {
  try {
    const all = await db.select({ id: notifications.id }).from(notifications).orderBy(desc(notifications.createdAt));
    if (all.length > 10) {
      const surplus = all.slice(10);
      for (const item of surplus) {
        await db.delete(notifications).where(eq3(notifications.id, item.id));
      }
      console.log(`Pruned ${surplus.length} older notifications in PostgreSQL.`);
    }
  } catch (err) {
    console.warn("Failed to prune notifications to 10:", err);
  }
}
var BackendNotificationService = {
  async recordNotification(title, body, type, targetId) {
    try {
      const inserted = await db.insert(notifications).values({
        title,
        body,
        type,
        targetId: targetId || null
      }).returning();
      await enforceMaxTenNotifications();
      const created = inserted[0];
      PushService.sendPushToAll(title, body, {
        type,
        targetId: String(targetId || ""),
        notificationId: String(created.id)
      });
      return created;
    } catch (err) {
      console.error("Failed to log push notification to PostgreSQL:", err);
      return null;
    }
  },
  // Delete notifications that point at a deleted event, so a deleted event
  // no longer shows up in the Notifications tab.
  async deleteForEvent(eventId) {
    try {
      await db.delete(notifications).where(
        and(
          eq3(notifications.type, "event"),
          eq3(notifications.targetId, eventId)
        )
      );
    } catch (err) {
      console.warn("Failed to delete notifications for event:", err);
    }
  },
  // Delete all notifications (admin "Clear all"). Returns how many rows
  // were removed. New notifications from events, verses, or admin posts
  // still come in afterwards — this only clears the list, not the
  // events or verses themselves.
  async clearAll() {
    try {
      const deleted = await db.delete(notifications).returning({ id: notifications.id });
      return deleted.length;
    } catch (err) {
      console.error("Failed to clear notifications:", err);
      return -1;
    }
  },
  // Delete one notification by id (admin per-item delete). Returns the
  // deleted row, or null when no notification with that id exists.
  async deleteById(id) {
    try {
      const deleted = await db.delete(notifications).where(eq3(notifications.id, id)).returning();
      return deleted[0] || null;
    } catch (err) {
      console.error("Failed to delete notification:", err);
      return null;
    }
  },
  async getRecent(limit = 10) {
    try {
      const list = await db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(limit);
      const eventNotifs = list.filter(
        (item) => item.type === "event" && item.targetId
      );
      if (eventNotifs.length > 0) {
        const existingEvents = await db.select({ id: events.id }).from(events);
        const existingIds = new Set(existingEvents.map((event) => event.id));
        const orphanIds = eventNotifs.filter((item) => !existingIds.has(item.targetId)).map((item) => item.id);
        if (orphanIds.length > 0) {
          await db.delete(notifications).where(inArray(notifications.id, orphanIds));
          return list.filter((item) => !orphanIds.includes(item.id));
        }
      }
      return list;
    } catch (err) {
      console.error("Failed to fetch notifications from PostgreSQL:", err);
      return [];
    }
  }
};

// src/vrc-backend/routes/eventRoutes.ts
var router2 = Router2();
async function cleanupPastEvents() {
  try {
    const now = /* @__PURE__ */ new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;
    const past = await db.select({ id: events.id, date: events.date }).from(events).where(sql2`${events.date} < ${todayStr}`).orderBy(desc2(events.date), desc2(events.startTime), desc2(events.id));
    if (past.length > 3) {
      const surplusPast = past.slice(3);
      const idsToDelete = surplusPast.map((e) => e.id);
      if (idsToDelete.length > 0) {
        for (const id of idsToDelete) {
          await db.delete(events).where(eq4(events.id, id));
        }
        console.log(`Pruned ${idsToDelete.length} past events in PostgreSQL, keeping 3 most recent.`);
        return idsToDelete.length;
      }
    }
    return 0;
  } catch (err) {
    console.warn("Past events cleanup warning:", err);
    return 0;
  }
}
router2.post("/cleanup-expired", requireAdmin, async (_req, res) => {
  try {
    const removedCount = await cleanupPastEvents();
    res.json({ message: "Past events pruned to max 3 successfully in PostgreSQL", removedCount });
  } catch (err) {
    console.error("Failed to run events cleanup:", err);
    res.status(500).json({ error: "Failed to run events cleanup" });
  }
});
router2.get("/", async (req, res) => {
  try {
    const category = req.query.category;
    const search = req.query.search;
    const allEvents = await db.select().from(events).orderBy(asc2(events.date), asc2(events.startTime));
    const now = /* @__PURE__ */ new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;
    const recentPastIds = new Set(
      allEvents.filter((event) => event.date < todayStr).sort(
        (a, b) => b.date.localeCompare(a.date) || String(b.startTime || "").localeCompare(String(a.startTime || "")) || b.id - a.id
      ).slice(0, 3).map((event) => event.id)
    );
    let filtered = allEvents.filter(
      (event) => event.date >= todayStr || recentPastIds.has(event.id)
    );
    if (category && category !== "All") {
      filtered = filtered.filter((e) => String(e.category || "").toLowerCase() === category.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (e) => String(e.title || "").toLowerCase().includes(q) || String(e.titleVi || "").toLowerCase().includes(q) || String(e.titleEn || "").toLowerCase().includes(q) || String(e.description || "").toLowerCase().includes(q) || String(e.descriptionVi || "").toLowerCase().includes(q) || String(e.descriptionEn || "").toLowerCase().includes(q) || String(e.location || "").toLowerCase().includes(q)
      );
    }
    res.json(filtered);
  } catch (error) {
    console.error("Failed to fetch events from PostgreSQL:", error);
    res.status(500).json({ error: error?.message || "Failed to retrieve church events from database" });
  }
});
router2.get("/:id", async (req, res) => {
  try {
    const eventId = Number(req.params.id);
    if (isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }
    const eventResult = await db.select().from(events).where(eq4(events.id, eventId)).limit(1);
    if (eventResult.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.json(eventResult[0]);
  } catch (error) {
    console.error("Failed to fetch event from PostgreSQL:", error);
    res.status(500).json({ error: error?.message || "Failed to fetch event details" });
  }
});
router2.post("/", requireAdmin, async (req, res) => {
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
      hasZoom,
      maxCapacity,
      organizerName,
      organizerEmail
    } = req.body;
    const finalTitleEn = String(titleEn || title || titleVi || "").trim();
    const finalTitleVi = String(titleVi || title || titleEn || "").trim();
    const finalDescEn = String(descriptionEn || description || descriptionVi || "").trim();
    const finalDescVi = String(descriptionVi || description || descriptionEn || "").trim();
    const finalLocation = String(location || "").trim();
    if (!finalTitleEn || !finalTitleVi || !finalDescEn || !finalDescVi || !date || !startTime || !finalLocation) {
      return res.status(400).json({
        error: "Vietnamese and English titles, descriptions, date, start time, and location are required."
      });
    }
    const actorName = req.adminUser?.displayName || req.adminUser?.username || "Admin";
    const insertValues = {
      title: finalTitleEn,
      titleVi: finalTitleVi,
      titleEn: finalTitleEn,
      description: finalDescEn,
      descriptionVi: finalDescVi,
      descriptionEn: finalDescEn,
      category: category || "Worship",
      date,
      startTime,
      endTime: endTime || null,
      location: finalLocation,
      locationVi: finalLocation,
      locationEn: finalLocation,
      address: address ? String(address).trim() : "Tempe, Arizona",
      imageUrl: imageUrl || null,
      isFeatured: Boolean(isFeatured),
      hasZoom: Boolean(hasZoom),
      maxCapacity: maxCapacity ? Number(maxCapacity) : null,
      organizerName: organizerName || req.adminUser?.displayName || "Church Staff",
      organizerEmail: organizerEmail || req.adminUser?.username || null,
      createdByUid: null,
      createdBy: actorName,
      updatedBy: actorName
    };
    let newEvent;
    try {
      newEvent = await db.insert(events).values(insertValues).returning();
    } catch (insertErr) {
      const errStr = String(insertErr?.cause?.message || insertErr?.message || "");
      if (errStr.includes("events_pkey") || errStr.includes("duplicate key")) {
        await db.execute(sql2`SELECT setval('events_id_seq', COALESCE((SELECT MAX(id) FROM events), 0) + 1, false)`);
        newEvent = await db.insert(events).values(insertValues).returning();
      } else {
        throw insertErr;
      }
    }
    await BackendNotificationService.recordNotification(
      `New Church Event: ${finalTitleEn}`,
      `${date} \u2022 ${startTime} at ${finalLocation}`,
      "event",
      newEvent[0].id
    );
    res.status(201).json(newEvent[0]);
  } catch (error) {
    console.error("Failed to create event in PostgreSQL:", error);
    const detail = error?.cause?.detail || error?.cause?.message || error?.message || "Failed to create church event in database";
    res.status(500).json({ error: detail });
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
      hasZoom,
      maxCapacity,
      organizerName,
      organizerEmail
    } = req.body;
    const finalTitleEn = titleEn !== void 0 ? String(titleEn).trim() : title !== void 0 ? String(title).trim() : void 0;
    const finalTitleVi = titleVi !== void 0 ? String(titleVi).trim() : title !== void 0 ? String(title).trim() : void 0;
    const finalDescEn = descriptionEn !== void 0 ? String(descriptionEn).trim() : description !== void 0 ? String(description).trim() : void 0;
    const finalDescVi = descriptionVi !== void 0 ? String(descriptionVi).trim() : description !== void 0 ? String(description).trim() : void 0;
    const actorName = req.adminUser?.displayName || req.adminUser?.username || "Admin";
    const updated = await db.update(events).set({
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
      location: location ? String(location).trim() : void 0,
      locationVi: location ? String(location).trim() : void 0,
      locationEn: location ? String(location).trim() : void 0,
      address: address ? String(address).trim() : void 0,
      imageUrl,
      isFeatured: isFeatured !== void 0 ? Boolean(isFeatured) : void 0,
      hasZoom: hasZoom !== void 0 ? Boolean(hasZoom) : void 0,
      maxCapacity: maxCapacity !== void 0 ? maxCapacity ? Number(maxCapacity) : null : void 0,
      organizerName,
      organizerEmail,
      updatedBy: actorName,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq4(events.id, eventId)).returning();
    if (updated.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.json(updated[0]);
  } catch (error) {
    console.error("Failed to update event in PostgreSQL:", error);
    res.status(500).json({ error: error?.message || "Failed to update church event in database" });
  }
});
router2.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const eventId = Number(req.params.id);
    if (isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }
    const deleted = await db.delete(events).where(eq4(events.id, eventId)).returning();
    if (deleted.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }
    await BackendNotificationService.deleteForEvent(eventId);
    res.json({ message: "Event successfully removed from database", event: deleted[0] });
  } catch (error) {
    console.error("Failed to delete event from PostgreSQL:", error);
    res.status(500).json({ error: error?.message || "Failed to delete event from database" });
  }
});
var eventRoutes_default = router2;

// src/vrc-backend/routes/verseRoutes.ts
import { Router as Router3 } from "express";
import { eq as eq5, desc as desc3, sql as sql3 } from "drizzle-orm";
var router3 = Router3();
async function enforceMaxTenVerses() {
  try {
    const allVerses = await db.select({ id: dailyVerses.id, date: dailyVerses.date }).from(dailyVerses).orderBy(desc3(dailyVerses.date));
    if (allVerses.length > 10) {
      const surplus = allVerses.slice(10);
      for (const item of surplus) {
        await db.delete(dailyVerses).where(eq5(dailyVerses.id, item.id));
      }
      console.log(`Pruned ${surplus.length} older scripture entries in PostgreSQL.`);
    }
  } catch (err) {
    console.warn("Scripture pruning warning:", err);
  }
}
async function upsertVerseByDate(insertValues, updateValues) {
  const existingForDate = await db.select({ id: dailyVerses.id }).from(dailyVerses).where(eq5(dailyVerses.date, insertValues.date)).limit(1);
  if (existingForDate.length > 0) {
    return db.update(dailyVerses).set(updateValues).where(eq5(dailyVerses.id, existingForDate[0].id)).returning();
  }
  try {
    return await db.insert(dailyVerses).values(insertValues).returning();
  } catch (insertErr) {
    const errStr = String(insertErr?.cause?.message || insertErr?.message || "");
    if (errStr.includes("daily_verses_pkey") || errStr.includes("duplicate key")) {
      await db.execute(
        sql3`SELECT setval('daily_verses_id_seq', COALESCE((SELECT MAX(id) FROM daily_verses), 0) + 1, false)`
      );
      return db.insert(dailyVerses).values(insertValues).returning();
    }
    throw insertErr;
  }
}
router3.get("/today", async (req, res, next) => {
  try {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    let verseResult = await db.select().from(dailyVerses).where(eq5(dailyVerses.date, today));
    if (verseResult.length === 0) {
      verseResult = await db.select().from(dailyVerses).orderBy(desc3(dailyVerses.date)).limit(1);
    }
    if (verseResult.length === 0) {
      return res.json({
        id: 0,
        date: today,
        verseText: "If my people, who are called by my name, will humble themselves and pray and seek my face and turn from their wicked ways, then I will hear from heaven, and I will forgive their sin and will heal their land.",
        verseTextVi: "v\xE0 nh\u01B0\u1EE3c b\u1EB1ng d\xE2n s\u1EF1 ta, l\xE0 d\xE2n g\u1ECDi b\u1EB1ng danh ta, h\u1EA1 m\xECnh xu\u1ED1ng, c\u1EA7u nguy\u1EC7n, t\xECm ki\u1EBFm m\u1EB7t ta, v\xE0 tr\u1EDF l\u1EA1i, b\u1ECF con \u0111\u01B0\u1EDDng t\xE0, th\xEC ta \u1EDF tr\xEAn tr\u1EDDi s\u1EBD nghe, tha th\u1EE9 t\u1ED9i ch\xFAng n\xF3, v\xE0 c\u1EE9u x\u1EE9 h\u1ECD kh\u1ECFi tai v\u1EA1.",
        verseTextEn: "If my people, who are called by my name, will humble themselves and pray and seek my face and turn from their wicked ways, then I will hear from heaven, and I will forgive their sin and will heal their land.",
        reference: "2 Chronicles 7:14 (2 S\u1EED K\xFD 7:14)",
        referenceVi: "2 S\u1EED K\xFD 7:14",
        referenceEn: "2 Chronicles 7:14",
        translation: "NIV",
        translationVi: "1925",
        translationEn: "NIV",
        reflection: "God\u2019s promise of revival begins when His people unite in humility, sincere prayer, and wholehearted devotion.",
        reflectionVi: "L\u1EDDi h\u1EE9a c\u1EE7a Ch\xFAa v\u1EC1 s\u1EF1 ph\u1EE5c h\u01B0ng b\u1EAFt \u0111\u1EA7u khi d\xE2n s\u1EF1 Ng\xE0i hi\u1EC7p m\u1ED9t trong s\u1EF1 c\u1EA7u nguy\u1EC7n v\xE0 khi\xEAm nh\u01B0\u1EDDng.",
        reflectionEn: "God\u2019s promise of revival begins when His people unite in humility, sincere prayer, and wholehearted devotion.",
        prayer: "Lord, bring spiritual renewal and revival upon our church, our families, and our daily walk with You.",
        prayerVi: "L\u1EA1y Ch\xFAa, xin \u0111em s\u1EF1 ph\u1EE5c h\u01B0ng \u0111\u1EBFn tr\xEAn h\u1ED9i th\xE1nh, gia \u0111\xECnh v\xE0 \u0111\u1EDDi s\u1ED1ng ch\xFAng con.",
        prayerEn: "Lord, bring spiritual renewal and revival upon our church, our families, and our daily walk with You.",
        theme: "Revival & Repentance"
      });
    }
    res.json(verseResult[0]);
  } catch (error) {
    next(error);
  }
});
router3.get("/", async (req, res, next) => {
  try {
    await enforceMaxTenVerses();
    const list = await db.select().from(dailyVerses).orderBy(desc3(dailyVerses.date)).limit(10);
    res.json(list);
  } catch (error) {
    next(error);
  }
});
router3.post("/", requireAdmin, async (req, res, next) => {
  try {
    const {
      date,
      verseText,
      verseTextVi,
      verseTextEn,
      reference,
      referenceVi,
      referenceEn,
      translation,
      translationVi,
      translationEn,
      reflection,
      reflectionVi,
      reflectionEn,
      prayer,
      prayerVi,
      prayerEn,
      theme
    } = req.body;
    const finalVerseEn = String(verseTextEn || verseText || verseTextVi || "").trim();
    const finalVerseVi = String(verseTextVi || verseText || verseTextEn || "").trim();
    const finalRefEn = String(referenceEn || reference || referenceVi || "").trim();
    const finalRefVi = String(referenceVi || reference || referenceEn || "").trim();
    const finalTransEn = String(translationEn || translation || "NIV").trim();
    const finalTransVi = String(translationVi || translation || "1925").trim();
    const finalReflEn = String(reflectionEn || reflection || reflectionVi || "").trim();
    const finalReflVi = String(reflectionVi || reflection || reflectionEn || "").trim();
    const finalPrayerEn = prayerEn !== void 0 ? prayerEn ? String(prayerEn).trim() : null : prayer ? String(prayer).trim() : null;
    const finalPrayerVi = prayerVi !== void 0 ? prayerVi ? String(prayerVi).trim() : null : prayer ? String(prayer).trim() : null;
    if (!date || !finalVerseEn || !finalVerseVi || !finalRefEn || !finalRefVi) {
      throw new AppError(
        "Date, Vietnamese & English verse text, and references are required.",
        400,
        "VALIDATION_ERROR"
      );
    }
    const actorName = req.adminUser?.displayName || req.adminUser?.username || "Admin";
    const insertValues = {
      date,
      verseText: finalVerseEn,
      verseTextVi: finalVerseVi,
      verseTextEn: finalVerseEn,
      reference: finalRefEn,
      referenceVi: finalRefVi,
      referenceEn: finalRefEn,
      translation: finalTransEn,
      translationVi: finalTransVi,
      translationEn: finalTransEn,
      reflection: finalReflEn || finalVerseEn,
      reflectionVi: finalReflVi || finalVerseVi,
      reflectionEn: finalReflEn || finalVerseEn,
      prayer: finalPrayerEn,
      prayerVi: finalPrayerVi,
      prayerEn: finalPrayerEn,
      theme: theme ? String(theme).trim() : "Daily Scripture",
      publishedByUid: null,
      createdBy: actorName,
      updatedBy: actorName
    };
    const updateValues = {
      verseText: finalVerseEn,
      verseTextVi: finalVerseVi,
      verseTextEn: finalVerseEn,
      reference: finalRefEn,
      referenceVi: finalRefVi,
      referenceEn: finalRefEn,
      translation: finalTransEn,
      translationVi: finalTransVi,
      translationEn: finalTransEn,
      reflection: finalReflEn || finalVerseEn,
      reflectionVi: finalReflVi || finalVerseVi,
      reflectionEn: finalReflEn || finalVerseEn,
      prayer: finalPrayerEn,
      prayerVi: finalPrayerVi,
      prayerEn: finalPrayerEn,
      theme: theme ? String(theme).trim() : "Daily Scripture",
      updatedBy: actorName,
      updatedAt: /* @__PURE__ */ new Date()
    };
    const inserted = await upsertVerseByDate(insertValues, updateValues);
    await enforceMaxTenVerses();
    await BackendNotificationService.recordNotification(
      `Scripture of the Day: ${finalRefEn}`,
      `"${finalVerseEn.slice(0, 100)}..."`,
      "verse",
      inserted[0].id
    );
    res.status(201).json(inserted[0]);
  } catch (error) {
    next(error);
  }
});
router3.put("/:id", requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      throw new AppError("Invalid verse ID", 400, "VALIDATION_ERROR");
    }
    const {
      date,
      verseText,
      verseTextVi,
      verseTextEn,
      reference,
      referenceVi,
      referenceEn,
      translation,
      translationVi,
      translationEn,
      reflection,
      reflectionVi,
      reflectionEn,
      prayer,
      prayerVi,
      prayerEn,
      theme
    } = req.body;
    const finalVerseEn = String(verseTextEn || verseText || verseTextVi || "").trim();
    const finalVerseVi = String(verseTextVi || verseText || verseTextEn || "").trim();
    const finalRefEn = String(referenceEn || reference || referenceVi || "").trim();
    const finalRefVi = String(referenceVi || reference || referenceEn || "").trim();
    const finalTransEn = String(translationEn || translation || "NIV").trim();
    const finalTransVi = String(translationVi || translation || "1925").trim();
    const finalReflEn = String(reflectionEn || reflection || reflectionVi || finalVerseEn).trim();
    const finalReflVi = String(reflectionVi || reflection || reflectionEn || finalVerseVi).trim();
    const finalPrayerEn = prayerEn !== void 0 ? prayerEn ? String(prayerEn).trim() : null : prayer ? String(prayer).trim() : null;
    const finalPrayerVi = prayerVi !== void 0 ? prayerVi ? String(prayerVi).trim() : null : prayer ? String(prayer).trim() : null;
    const actorName = req.adminUser?.displayName || req.adminUser?.username || "Admin";
    if (!date || !finalVerseEn || !finalVerseVi || !finalRefEn || !finalRefVi) {
      throw new AppError(
        "Date, Vietnamese & English verse text, and references are required.",
        400,
        "VALIDATION_ERROR"
      );
    }
    const insertValues = {
      date,
      verseText: finalVerseEn,
      verseTextVi: finalVerseVi,
      verseTextEn: finalVerseEn,
      reference: finalRefEn,
      referenceVi: finalRefVi,
      referenceEn: finalRefEn,
      translation: finalTransEn,
      translationVi: finalTransVi,
      translationEn: finalTransEn,
      reflection: finalReflEn,
      reflectionVi: finalReflVi,
      reflectionEn: finalReflEn,
      prayer: finalPrayerEn,
      prayerVi: finalPrayerVi,
      prayerEn: finalPrayerEn,
      theme: theme ? String(theme).trim() : "Daily Devotion",
      publishedByUid: null,
      createdBy: actorName,
      updatedBy: actorName
    };
    const updateValues = {
      date,
      verseText: finalVerseEn,
      verseTextVi: finalVerseVi,
      verseTextEn: finalVerseEn,
      reference: finalRefEn,
      referenceVi: finalRefVi,
      referenceEn: finalRefEn,
      translation: finalTransEn,
      translationVi: finalTransVi,
      translationEn: finalTransEn,
      reflection: finalReflEn,
      reflectionVi: finalReflVi,
      reflectionEn: finalReflEn,
      prayer: finalPrayerEn,
      prayerVi: finalPrayerVi,
      prayerEn: finalPrayerEn,
      theme: theme ? String(theme).trim() : "Daily Devotion",
      updatedBy: actorName,
      updatedAt: /* @__PURE__ */ new Date()
    };
    let updated = await db.update(dailyVerses).set(updateValues).where(eq5(dailyVerses.id, id)).returning();
    if (updated.length === 0) {
      updated = await upsertVerseByDate(insertValues, updateValues);
    }
    await enforceMaxTenVerses();
    res.json(updated[0]);
  } catch (error) {
    next(error);
  }
});
router3.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      throw new AppError("Invalid verse ID", 400, "VALIDATION_ERROR");
    }
    const deleted = await db.delete(dailyVerses).where(eq5(dailyVerses.id, id)).returning();
    if (deleted.length === 0) {
      throw new AppError("This verse was already deleted.", 404, "VERSE_NOT_FOUND");
    }
    res.json({ message: "Verse successfully deleted from database" });
  } catch (error) {
    next(error);
  }
});
var verseRoutes_default = router3;

// src/vrc-backend/routes/sermonRoutes.ts
import { Router as Router4 } from "express";
import { eq as eq6, desc as desc4 } from "drizzle-orm";

// src/vrc-shared/utils/youtube.ts
function extractYouTubeVideoId(url) {
  const clean = (url || "").trim();
  if (!clean) return null;
  if (/^[A-Za-z0-9_-]{11}$/.test(clean)) return clean;
  const patterns = [
    /(?:[?&]v=)([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/live\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/v\/([A-Za-z0-9_-]{11})/
  ];
  for (const pattern of patterns) {
    const match = clean.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// src/vrc-backend/routes/sermonRoutes.ts
var router4 = Router4();
router4.get("/", async (_req, res) => {
  try {
    const allSermons = await db.select().from(sermons).orderBy(desc4(sermons.date), desc4(sermons.id));
    res.json(allSermons);
  } catch (error) {
    console.error("Failed to fetch sermons from PostgreSQL:", error);
    res.status(500).json({ error: error?.message || "Failed to retrieve sermons from database" });
  }
});
router4.get("/:id", async (req, res) => {
  try {
    const sermonId = Number(req.params.id);
    if (isNaN(sermonId)) {
      return res.status(400).json({ error: "Invalid sermon ID" });
    }
    const sermonResult = await db.select().from(sermons).where(eq6(sermons.id, sermonId)).limit(1);
    if (sermonResult.length === 0) {
      return res.status(404).json({ error: "Sermon not found" });
    }
    res.json(sermonResult[0]);
  } catch (error) {
    console.error("Failed to fetch sermon from PostgreSQL:", error);
    res.status(500).json({ error: error?.message || "Failed to fetch sermon details" });
  }
});
router4.post("/", requireAdmin, async (req, res) => {
  try {
    const {
      youtubeUrl,
      titleVi,
      titleEn,
      descriptionVi,
      descriptionEn,
      date
    } = req.body;
    const cleanUrl = String(youtubeUrl || "").trim();
    const videoId = extractYouTubeVideoId(cleanUrl);
    const finalTitleVi = String(titleVi || "").trim();
    const finalTitleEn = String(titleEn || "").trim();
    const finalDescVi = String(descriptionVi || "").trim() || null;
    const finalDescEn = String(descriptionEn || "").trim() || null;
    if (!cleanUrl || !videoId) {
      return res.status(400).json({
        error: "A valid YouTube link is required."
      });
    }
    if (!finalTitleVi || !finalTitleEn || !date) {
      return res.status(400).json({
        error: "Vietnamese and English titles and the Sunday date are required."
      });
    }
    const actorName = req.adminUser?.displayName || req.adminUser?.username || "Admin";
    const newSermon = await db.insert(sermons).values({
      youtubeUrl: cleanUrl,
      videoId,
      titleVi: finalTitleVi,
      titleEn: finalTitleEn,
      descriptionVi: finalDescVi,
      descriptionEn: finalDescEn,
      date,
      createdBy: actorName,
      updatedBy: actorName
    }).returning();
    res.status(201).json(newSermon[0]);
  } catch (error) {
    console.error("Failed to create sermon in PostgreSQL:", error);
    const detail = error?.cause?.detail || error?.cause?.message || error?.message || "Failed to create sermon in database";
    res.status(500).json({ error: detail });
  }
});
router4.put("/:id", requireAdmin, async (req, res) => {
  try {
    const sermonId = Number(req.params.id);
    if (isNaN(sermonId)) {
      return res.status(400).json({ error: "Invalid sermon ID" });
    }
    const {
      youtubeUrl,
      titleVi,
      titleEn,
      descriptionVi,
      descriptionEn,
      date
    } = req.body;
    const actorName = req.adminUser?.displayName || req.adminUser?.username || "Admin";
    let videoId;
    let cleanUrl;
    if (youtubeUrl !== void 0) {
      cleanUrl = String(youtubeUrl || "").trim();
      const extracted = extractYouTubeVideoId(cleanUrl);
      if (!cleanUrl || !extracted) {
        return res.status(400).json({ error: "A valid YouTube link is required." });
      }
      videoId = extracted;
    }
    const updated = await db.update(sermons).set({
      youtubeUrl: cleanUrl,
      videoId,
      titleVi: titleVi !== void 0 ? String(titleVi).trim() : void 0,
      titleEn: titleEn !== void 0 ? String(titleEn).trim() : void 0,
      descriptionVi: descriptionVi !== void 0 ? String(descriptionVi).trim() || null : void 0,
      descriptionEn: descriptionEn !== void 0 ? String(descriptionEn).trim() || null : void 0,
      date,
      updatedBy: actorName,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq6(sermons.id, sermonId)).returning();
    if (updated.length === 0) {
      return res.status(404).json({ error: "Sermon not found" });
    }
    res.json(updated[0]);
  } catch (error) {
    console.error("Failed to update sermon in PostgreSQL:", error);
    res.status(500).json({ error: error?.message || "Failed to update sermon in database" });
  }
});
router4.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const sermonId = Number(req.params.id);
    if (isNaN(sermonId)) {
      return res.status(400).json({ error: "Invalid sermon ID" });
    }
    const deleted = await db.delete(sermons).where(eq6(sermons.id, sermonId)).returning();
    if (deleted.length === 0) {
      return res.status(404).json({ error: "Sermon not found" });
    }
    res.json({ message: "Sermon successfully removed from database", sermon: deleted[0] });
  } catch (error) {
    console.error("Failed to delete sermon from PostgreSQL:", error);
    res.status(500).json({ error: error?.message || "Failed to delete sermon from database" });
  }
});
var sermonRoutes_default = router4;

// src/vrc-backend/routes/notifRoutes.ts
import { Router as Router5 } from "express";
var router5 = Router5();
router5.get("/recent", async (req, res) => {
  try {
    const list = await BackendNotificationService.getRecent(10);
    res.json(list);
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    res.status(500).json({ error: "Failed to retrieve notifications" });
  }
});
router5.post("/", requireAdmin, async (req, res) => {
  try {
    const { title, body } = req.body || {};
    const cleanTitle = typeof title === "string" ? title.trim() : "";
    const cleanBody = typeof body === "string" ? body.trim() : "";
    if (!cleanTitle || !cleanBody) {
      return res.status(400).json({ error: "Title and body are required" });
    }
    const created = await BackendNotificationService.recordNotification(
      cleanTitle,
      cleanBody,
      "announcement"
    );
    if (!created) {
      return res.status(500).json({ error: "Failed to save notification" });
    }
    res.status(201).json(created);
  } catch (error) {
    console.error("Failed to create notification:", error);
    res.status(500).json({ error: "Failed to create notification" });
  }
});
router5.delete("/", requireAdmin, async (req, res) => {
  try {
    const deletedCount = await BackendNotificationService.clearAll();
    if (deletedCount < 0) {
      return res.status(500).json({ error: "Failed to clear notifications" });
    }
    res.json({ message: "All notifications cleared", deletedCount });
  } catch (error) {
    console.error("Failed to clear notifications:", error);
    res.status(500).json({ error: "Failed to clear notifications" });
  }
});
router5.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid notification id" });
    }
    const deleted = await BackendNotificationService.deleteById(id);
    if (!deleted) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.json({ message: "Notification deleted", id: deleted.id });
  } catch (error) {
    console.error("Failed to delete notification:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
});
var notifRoutes_default = router5;

// src/vrc-backend/routes/spotlightRoutes.ts
import { Router as Router6 } from "express";

// src/vrc-backend/services/configService.ts
import { eq as eq7 } from "drizzle-orm";
var CHURCH_INFO_ID = 1;
var SPOTLIGHT_ID = 1;
var ConfigService = {
  async getChurchInfo() {
    try {
      const rows = await db.select().from(churchInfo).where(eq7(churchInfo.id, CHURCH_INFO_ID)).limit(1);
      if (rows.length > 0 && rows[0].data) {
        return rows[0].data;
      }
      return null;
    } catch (err) {
      console.warn("Error reading church_info from Postgres:", err);
      return null;
    }
  },
  async saveChurchInfo(data) {
    await db.insert(churchInfo).values({ id: CHURCH_INFO_ID, data, updatedAt: /* @__PURE__ */ new Date() }).onConflictDoUpdate({
      target: churchInfo.id,
      set: { data, updatedAt: /* @__PURE__ */ new Date() }
    });
  },
  async getSpotlight() {
    try {
      const rows = await db.select().from(spotlight).where(eq7(spotlight.id, SPOTLIGHT_ID)).limit(1);
      if (rows.length > 0 && rows[0].data) {
        return rows[0].data;
      }
      return null;
    } catch (err) {
      console.warn("Error reading spotlight from Postgres:", err);
      return null;
    }
  },
  async saveSpotlight(data) {
    await db.insert(spotlight).values({ id: SPOTLIGHT_ID, data, updatedAt: /* @__PURE__ */ new Date() }).onConflictDoUpdate({
      target: spotlight.id,
      set: { data, updatedAt: /* @__PURE__ */ new Date() }
    });
  }
};

// src/vrc-backend/routes/spotlightRoutes.ts
var router6 = Router6();
var DEFAULT_SPOTLIGHT = {
  mode: "auto",
  selectedEventId: null,
  isActive: true,
  theme: "thanksgiving",
  badge: "Tempe, Arizona \u2022 Ch\xFAa Nh\u1EADt 3:00 PM \u2013 5:00 PM",
  title: "H\u1ED9i Th\xE1nh Ph\u1EE5c H\u01B0ng Vi\u1EC7t Nam",
  subtitle: 'Thi Thi\xEAn 100:4 - "H\xE3y c\u1EA3m t\u1EA1 m\xE0 v\xE0o c\xE1c c\u1EEDa Ng\xE0i, h\xE3y ng\u1EE3i khen m\xE0 v\xE0o c\xE1c h\xE0nh lang Ng\xE0i!"',
  description: "Th\xE2n m\u1EDDi qu\xFD t\xF4i con Ch\xFAa c\xF9ng gia quy\u1EBFn \u0111\u1EBFn th\u1EDD ph\u01B0\u1EE3ng Ch\xFAa, g\xE2y d\u1EF1ng \u0111\u1EE9c tin v\xE0 k\u1EBFt n\u1ED1i th\xF4ng c\xF4ng \u1EA5m \xE1p.",
  dateTag: "Ch\xFAa Nh\u1EADt H\xE0ng Tu\u1EA7n \u2022 3:00 PM",
  locationTag: "Tempe, Arizona \u2022 Main Sanctuary",
  customAddress: "Tempe, Arizona",
  primaryBtnText: "Xem T\u1EA5t C\u1EA3 S\u1EF1 Ki\u1EC7n",
  primaryBtnAction: "events",
  secondaryBtnText: "Ch\u1EC9 \u0110\u01B0\u1EDDng Google Maps",
  secondaryBtnUrl: "https://maps.google.com/?q=Tempe+Arizona",
  updatedAt: (/* @__PURE__ */ new Date()).toISOString()
};
var inMemorySpotlight = { ...DEFAULT_SPOTLIGHT };
router6.get("/", async (req, res) => {
  try {
    const storedData = await ConfigService.getSpotlight();
    if (storedData && storedData.title) {
      inMemorySpotlight = { ...DEFAULT_SPOTLIGHT, ...storedData };
      return res.json(inMemorySpotlight);
    }
    res.json(inMemorySpotlight);
  } catch (err) {
    console.error("Failed to get spotlight:", err);
    res.json(inMemorySpotlight);
  }
});
router6.put("/", requireAdmin, async (req, res) => {
  try {
    const {
      mode,
      selectedEventId,
      isActive,
      theme,
      badge,
      title,
      subtitle,
      subtitleVi,
      subtitleEn,
      description,
      dateTag,
      locationTag,
      customAddress,
      primaryBtnText,
      primaryBtnAction,
      secondaryBtnText,
      secondaryBtnUrl
    } = req.body;
    const isAuto = mode === "auto" || !selectedEventId;
    const cleanAddress = customAddress ? String(customAddress).trim() : "Tempe, Arizona";
    const computedDirectionsUrl = secondaryBtnUrl ? String(secondaryBtnUrl).trim() : `https://maps.google.com/?q=${encodeURIComponent(cleanAddress)}`;
    const rawBadge = badge ? String(badge).trim() : "";
    const rawTitle = isAuto ? "" : title ? String(title).trim() : "";
    const rawSubtitle = subtitle ? String(subtitle).trim() : "";
    const rawSubtitleVi = subtitleVi ? String(subtitleVi).trim() : rawSubtitle;
    const rawSubtitleEn = subtitleEn ? String(subtitleEn).trim() : rawSubtitle;
    const rawDescription = isAuto ? "" : description ? String(description).trim() : "";
    const rawLocationTag = locationTag ? String(locationTag).trim() : "Tempe, Arizona";
    const updated = {
      mode: isAuto ? "auto" : "event",
      selectedEventId: isAuto ? null : Number(selectedEventId),
      isActive: isActive !== void 0 ? Boolean(isActive) : true,
      theme: theme || "thanksgiving",
      badge: rawBadge,
      badgeVi: rawBadge,
      badgeEn: rawBadge,
      title: rawTitle,
      titleVi: rawTitle,
      titleEn: rawTitle,
      subtitle: rawSubtitle,
      subtitleVi: rawSubtitleVi,
      subtitleEn: rawSubtitleEn,
      description: rawDescription,
      descriptionVi: rawDescription,
      descriptionEn: rawDescription,
      dateTag: isAuto ? "" : dateTag ? String(dateTag).trim() : "",
      locationTag: rawLocationTag,
      locationTagVi: rawLocationTag,
      locationTagEn: rawLocationTag,
      customAddress: cleanAddress,
      primaryBtnText: primaryBtnText ? String(primaryBtnText).trim() : "Xem T\u1EA5t C\u1EA3 S\u1EF1 Ki\u1EC7n",
      primaryBtnAction: primaryBtnAction || "events",
      secondaryBtnText: secondaryBtnText ? String(secondaryBtnText).trim() : "Ch\u1EC9 \u0110\u01B0\u1EDDng Google Maps",
      secondaryBtnUrl: computedDirectionsUrl,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    inMemorySpotlight = updated;
    await ConfigService.saveSpotlight(updated);
    res.json(updated);
  } catch (err) {
    console.error("Failed to update spotlight:", err);
    res.status(500).json({ error: err.message || "Failed to update spotlight banner" });
  }
});
var spotlightRoutes_default = router6;

// src/vrc-backend/routes/churchInfoRoutes.ts
import { Router as Router7 } from "express";
var router7 = Router7();
var DEFAULT_HEADER_VERSE = {
  verseTextVi: "V\xEC \u0110\u1EE9c Ch\xFAa Tr\u1EDDi y\xEAu th\u01B0\u01A1ng th\u1EBF gian, \u0111\u1EBFn n\u1ED7i \u0111\xE3 ban Con m\u1ED9t c\u1EE7a Ng\xE0i, h\u1EA7u cho h\u1EC5 ai tin Con \u1EA5y kh\xF4ng b\u1ECB h\u01B0 m\u1EA5t m\xE0 \u0111\u01B0\u1EE3c s\u1EF1 s\u1ED1ng \u0111\u1EDDi \u0111\u1EDDi.",
  verseTextEn: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
  referenceVi: "Gi\u0103ng 3:16",
  referenceEn: "John 3:16",
  translationVi: "1925",
  translationEn: "NIV"
};
var DEFAULT_CHURCH_INFO = {
  sanctuaryName: "H\u1ED9i Th\xE1nh Tin L\xE0nh B\xE1p-t\xEDt Ph\u1EE5c H\u01B0ng",
  address: "1565 E Warner Rd, Tempe AZ 85284",
  googleMapsUrl: "https://maps.google.com/?q=1565+E+Warner+Rd,+Tempe+AZ+85284",
  phone: "(480) 555-0199",
  email: "htph@vrcfamily.org",
  regionDescVi: "Ph\u1EE5c v\u1EE5 c\u1ED9ng \u0111\u1ED3ng ng\u01B0\u1EDDi Vi\u1EC7t t\u1EA1i Tempe, Phoenix, Mesa, Chandler & Gilbert",
  regionDescEn: "Serving Vietnamese communities across Phoenix East Valley",
  headerVerse: DEFAULT_HEADER_VERSE,
  services: [
    {
      id: "sunday-worship",
      titleVi: "L\u1EC5 Th\u1EDD Ph\u01B0\u1EE3ng Ch\xFAa Nh\u1EADt",
      titleEn: "Sunday Worship Service",
      time: "Ch\xFAa Nh\u1EADt \u2022 3:00 PM \u2013 5:00 PM",
      timeEn: "Sunday \u2022 3:00 PM \u2013 5:00 PM",
      descVi: "T\xF4n vinh Ch\xFAa, c\u1EA7u nguy\u1EC7n v\xE0 l\u1EAFng nghe s\u1EE9 \u0111i\u1EC7p L\u1EDDi Ch\xFAa g\xE2y d\u1EF1ng \u0111\u1EE9c tin, ph\u1EE5c h\u01B0ng \u0111\u1EDDi s\u1ED1ng.",
      descEn: "Bilingual worship, uplifting praise, gospel sermon and warm fellowship refreshments."
    },
    {
      id: "friday-youth",
      titleVi: "Sinh Ho\u1EA1t Gi\u1EDBi Tr\u1EBB VRC Youth",
      titleEn: "VRC Youth & Young Adults",
      time: "Th\u1EE9 S\xE1u \u2022 6:30 PM \u2013 8:30 PM",
      timeEn: "Friday \u2022 6:30 PM \u2013 8:30 PM",
      descVi: "Sinh ho\u1EA1t k\u1EBFt n\u1ED1i thanh thi\u1EBFu ni\xEAn, \xE2m nh\u1EA1c th\u1EDD ph\u01B0\u1EE3ng s\xF4i \u0111\u1ED9ng, th\u1EA3o lu\u1EADn th\u1EF1c t\u1EBF v\xE0 th\u1EC3 thao.",
      descEn: "Dynamic youth fellowship, contemporary praise, real-life discussion, games and snacks."
    },
    {
      id: "wednesday-prayer",
      titleVi: "H\u1ECDc Kinh Th\xE1nh & C\u1EA7u Nguy\u1EC7n",
      titleEn: "Midweek Bible Study & Prayer",
      time: "Th\u1EE9 T\u01B0 \u2022 7:00 PM \u2013 8:30 PM",
      timeEn: "Wednesday \u2022 7:00 PM \u2013 8:30 PM",
      descVi: "\u0110\xE0o s\xE2u L\u1EDDi Ch\xFAa theo t\u1EEBng ph\xE2n \u0111o\u1EA1n v\xE0 c\xF9ng hi\u1EC7p l\xF2ng c\u1EA7u nguy\u1EC7n ch\u1EEFa l\xE0nh, ph\u1EE5c h\u01B0ng cho h\u1ED9i th\xE1nh.",
      descEn: "In-depth scripture study and united intercessory prayer for revival, families, and healings."
    }
  ],
  updatedAt: (/* @__PURE__ */ new Date()).toISOString()
};
var inMemoryChurchInfo = { ...DEFAULT_CHURCH_INFO };
router7.get("/", async (req, res) => {
  try {
    const storedData = await ConfigService.getChurchInfo();
    if (storedData && storedData.sanctuaryName) {
      const sanitizedAddress = !storedData.address || storedData.address.toLowerCase().includes("tempe, arizona") || storedData.address.toLowerCase() === "tempe, az" || storedData.address.toLowerCase() === "tempe az" ? DEFAULT_CHURCH_INFO.address : storedData.address;
      inMemoryChurchInfo = {
        ...DEFAULT_CHURCH_INFO,
        ...storedData,
        address: sanitizedAddress,
        googleMapsUrl: sanitizedAddress === DEFAULT_CHURCH_INFO.address ? DEFAULT_CHURCH_INFO.googleMapsUrl : storedData.googleMapsUrl || DEFAULT_CHURCH_INFO.googleMapsUrl,
        services: Array.isArray(storedData.services) && storedData.services.length > 0 ? storedData.services : inMemoryChurchInfo.services
      };
      return res.json(inMemoryChurchInfo);
    }
    res.json(inMemoryChurchInfo);
  } catch (err) {
    console.error("Failed to get church info:", err);
    res.json(inMemoryChurchInfo);
  }
});
router7.put("/", requireAdmin, async (req, res) => {
  try {
    const { sanctuaryName, address, googleMapsUrl, phone, email, regionDescVi, regionDescEn, services, headerVerse, zoomMeetingId, zoomPasscode } = req.body;
    if (!address || !sanctuaryName) {
      return res.status(400).json({ error: "Sanctuary name and address are required." });
    }
    const cleanedServices = Array.isArray(services) ? services.map((s, idx) => ({
      id: s.id || `service-${idx + 1}-${Date.now()}`,
      titleVi: String(s.titleVi || "").trim(),
      titleEn: String(s.titleEn || s.titleVi || "").trim(),
      time: String(s.time || "").trim(),
      timeEn: s.timeEn ? String(s.timeEn).trim() : void 0,
      descVi: String(s.descVi || "").trim(),
      descEn: String(s.descEn || s.descVi || "").trim()
    })) : inMemoryChurchInfo.services;
    const cleanedHeaderVerse = headerVerse ? {
      verseTextVi: String(headerVerse.verseTextVi || inMemoryChurchInfo.headerVerse?.verseTextVi || DEFAULT_HEADER_VERSE.verseTextVi).trim(),
      verseTextEn: String(headerVerse.verseTextEn || inMemoryChurchInfo.headerVerse?.verseTextEn || DEFAULT_HEADER_VERSE.verseTextEn).trim(),
      referenceVi: String(headerVerse.referenceVi || inMemoryChurchInfo.headerVerse?.referenceVi || DEFAULT_HEADER_VERSE.referenceVi).trim(),
      referenceEn: String(headerVerse.referenceEn || inMemoryChurchInfo.headerVerse?.referenceEn || DEFAULT_HEADER_VERSE.referenceEn).trim(),
      translationVi: headerVerse.translationVi ? String(headerVerse.translationVi).trim() : inMemoryChurchInfo.headerVerse?.translationVi || "1925",
      translationEn: headerVerse.translationEn ? String(headerVerse.translationEn).trim() : inMemoryChurchInfo.headerVerse?.translationEn || "NIV"
    } : inMemoryChurchInfo.headerVerse || DEFAULT_HEADER_VERSE;
    const updated = {
      sanctuaryName: String(sanctuaryName).trim(),
      address: String(address).trim(),
      googleMapsUrl: googleMapsUrl ? String(googleMapsUrl).trim() : `https://maps.google.com/?q=${encodeURIComponent(String(address).trim())}`,
      phone: phone ? String(phone).trim() : inMemoryChurchInfo.phone,
      email: email ? String(email).trim() : inMemoryChurchInfo.email,
      regionDescVi: regionDescVi ? String(regionDescVi).trim() : inMemoryChurchInfo.regionDescVi,
      regionDescEn: regionDescEn ? String(regionDescEn).trim() : inMemoryChurchInfo.regionDescEn,
      headerVerse: cleanedHeaderVerse,
      services: cleanedServices,
      // Zoom meeting ID is digits only ("599 7518611" -> "5997518611").
      // An empty value clears the field; an absent field keeps the
      // stored one. Never a hardcoded default here.
      zoomMeetingId: zoomMeetingId !== void 0 ? String(zoomMeetingId).replace(/\D/g, "") : inMemoryChurchInfo.zoomMeetingId ?? "",
      zoomPasscode: zoomPasscode !== void 0 ? String(zoomPasscode).trim() : inMemoryChurchInfo.zoomPasscode ?? "",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    inMemoryChurchInfo = updated;
    await ConfigService.saveChurchInfo(updated);
    res.json(updated);
  } catch (err) {
    console.error("Failed to update church info:", err);
    res.status(500).json({ error: "Failed to update church info" });
  }
});
router7.put("/header-verse", requireAdmin, async (req, res) => {
  try {
    const { verseTextVi, verseTextEn, referenceVi, referenceEn, translationVi, translationEn } = req.body;
    if (!verseTextVi || !verseTextEn || !referenceVi || !referenceEn) {
      return res.status(400).json({ error: "Verse text and reference are required in both languages." });
    }
    const newHeaderVerse = {
      verseTextVi: String(verseTextVi).trim(),
      verseTextEn: String(verseTextEn).trim(),
      referenceVi: String(referenceVi).trim(),
      referenceEn: String(referenceEn).trim(),
      translationVi: translationVi ? String(translationVi).trim() : "1925",
      translationEn: translationEn ? String(translationEn).trim() : "NIV"
    };
    inMemoryChurchInfo = {
      ...inMemoryChurchInfo,
      headerVerse: newHeaderVerse,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await ConfigService.saveChurchInfo(inMemoryChurchInfo);
    res.json(inMemoryChurchInfo);
  } catch (err) {
    console.error("Failed to update header verse:", err);
    res.status(500).json({ error: "Failed to update header verse" });
  }
});
var churchInfoRoutes_default = router7;

// src/vrc-backend/routes/prayerRoutes.ts
import { Router as Router8 } from "express";
import { eq as eq8, desc as desc5, sql as sql4 } from "drizzle-orm";
var router8 = Router8();
router8.get("/", requireAdmin, async (req, res) => {
  try {
    const list = await db.select().from(prayerRequests).orderBy(desc5(prayerRequests.createdAt));
    return res.json(list);
  } catch (error) {
    console.error("Failed to fetch prayers from PostgreSQL:", error);
    return res.status(500).json({ error: error?.message || "Failed to fetch prayer requests from database" });
  }
});
var prayerRateMap = /* @__PURE__ */ new Map();
var PRAYER_RATE_WINDOW_MS = 10 * 60 * 1e3;
var PRAYER_RATE_MAX = 3;
router8.post("/", async (req, res) => {
  try {
    const clientIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || "unknown";
    const now = Date.now();
    const recent = (prayerRateMap.get(clientIp) || []).filter((ts) => now - ts < PRAYER_RATE_WINDOW_MS);
    if (recent.length >= PRAYER_RATE_MAX) {
      return res.status(429).json({
        error: "Too many prayer requests submitted. Please wait a few minutes before sending another."
      });
    }
    recent.push(now);
    prayerRateMap.set(clientIp, recent);
    const { requesterName, title, request } = req.body;
    const cleanRequest = String(request || "").trim();
    if (!cleanRequest) {
      return res.status(400).json({ error: "Prayer request text is required." });
    }
    const cleanName = String(requesterName || "").trim() || "Anonymous";
    const cleanTitle = String(title || "").trim() || `Prayer Request from ${cleanName}`;
    const insertValues = {
      title: cleanTitle,
      request: cleanRequest,
      requesterName: cleanName,
      isAnonymous: !String(requesterName || "").trim(),
      isPraise: false,
      prayerCount: 0,
      status: "active"
    };
    let inserted;
    try {
      inserted = await db.insert(prayerRequests).values(insertValues).returning();
    } catch (insertErr) {
      const errStr = String(insertErr?.cause?.message || insertErr?.message || "");
      if (errStr.includes("prayer_requests_pkey") || errStr.includes("duplicate key")) {
        await db.execute(sql4`SELECT setval('prayer_requests_id_seq', COALESCE((SELECT MAX(id) FROM prayer_requests), 0) + 1, false)`);
        inserted = await db.insert(prayerRequests).values(insertValues).returning();
      } else {
        throw insertErr;
      }
    }
    return res.status(201).json(inserted[0]);
  } catch (error) {
    console.error("Failed to submit prayer request to PostgreSQL:", error);
    const detail = error?.cause?.detail || error?.cause?.message || error?.message || "Failed to submit prayer request to database";
    return res.status(500).json({ error: detail });
  }
});
router8.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid prayer request ID" });
    }
    await db.delete(prayerRequests).where(eq8(prayerRequests.id, id));
    return res.json({ success: true, message: "Prayer request deleted from database" });
  } catch (error) {
    console.error("Failed to delete prayer request from PostgreSQL:", error);
    return res.status(500).json({ error: error?.message || "Failed to delete prayer request from database" });
  }
});
var prayerRoutes_default = router8;

// src/vrc-backend/routes/pushRoutes.ts
import { Router as Router9 } from "express";
var router9 = Router9();
router9.post("/register", async (req, res) => {
  try {
    const { token, platform } = req.body || {};
    if (!token || typeof token !== "string") {
      return res.status(400).json({ error: "Push token is required." });
    }
    const ok = await PushService.registerToken(token, platform);
    if (!ok) {
      return res.status(500).json({ error: "Failed to register push token." });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("Failed to register push token:", err);
    res.status(500).json({ error: "Failed to register push token." });
  }
});
var pushRoutes_default = router9;

// src/vrc-backend/routes/devotionalRoutes.ts
import { Router as Router10 } from "express";

// src/vrc-backend/services/devotionalService.ts
var API_BASE = "https://apibible.wbem.org/api/bibles";
var FETCH_TIMEOUT_MS = 1e4;
var MAX_VERSES = 5;
function verseLimitError(count) {
  return new Error(
    `Ch\u1EC9 l\u1EA5y t\u1ED1i \u0111a 5 c\xE2u m\u1ED9t l\u1EA7n \u2014 \u0111o\u1EA1n n\xE0y c\xF3 ${count} c\xE2u. / Only up to 5 verses at a time \u2014 this passage has ${count} verses.`
  );
}
var BOOKS = [
  { en: "Genesis", vi: "S\xE1ng Th\u1EBF K\xFD", aliases: ["gen", "genesis"] },
  { en: "Exodus", vi: "Xu\u1EA5t \xCA-d\xEDp-t\xF4 K\xFD", aliases: ["exod", "exodus", "ex"] },
  { en: "Leviticus", vi: "L\xEA-vi K\xFD", aliases: ["lev", "leviticus"] },
  { en: "Numbers", vi: "D\xE2n-s\u1ED1 K\xFD", aliases: ["num", "numbers"] },
  { en: "Deuteronomy", vi: "Ph\u1EE5c-truy\u1EC1n Lu\u1EADt-l\u1EC7 K\xFD", aliases: ["deut", "deuteronomy"] },
  { en: "Joshua", vi: "Gi\xF4-su\xEA", aliases: ["josh", "joshua"] },
  { en: "Judges", vi: "C\xE1c Quan X\xE9t", aliases: ["judg", "judges"] },
  { en: "Ruth", vi: "Ru-t\u01A1", aliases: ["ruth"] },
  { en: "1 Samuel", vi: "1 Sa-mu-\xEAn", aliases: ["1sam", "1samuel"] },
  { en: "2 Samuel", vi: "2 Sa-mu-\xEAn", aliases: ["2sam", "2samuel"] },
  { en: "1 Kings", vi: "1 C\xE1c Vua", aliases: ["1kgs", "1kings"] },
  { en: "2 Kings", vi: "2 C\xE1c Vua", aliases: ["2kgs", "2kings"] },
  { en: "1 Chronicles", vi: "1 S\u1EED K\xFD", aliases: ["1chr", "1chronicles"] },
  { en: "2 Chronicles", vi: "2 S\u1EED K\xFD", aliases: ["2chr", "2chronicles"] },
  { en: "Ezra", vi: "E-x\u01A1-ra", aliases: ["ezra"] },
  { en: "Nehemiah", vi: "N\xEA-h\xEA-mi", aliases: ["neh", "nehemiah"] },
  { en: "Esther", vi: "\xCA-x\u01A1-t\xEA", aliases: ["esth", "esther"] },
  { en: "Job", vi: "Gi\xF3p", aliases: ["job"] },
  { en: "Psalms", vi: "Thi Thi\xEAn", aliases: ["ps", "psa", "psalm", "psalms", "thithien"] },
  { en: "Proverbs", vi: "Ch\xE2m Ng\xF4n", aliases: ["prov", "proverbs"] },
  { en: "Ecclesiastes", vi: "Truy\u1EC1n \u0110\u1EA1o", aliases: ["eccl", "ecclesiastes"] },
  { en: "Song of Solomon", vi: "Nh\xE3 Ca", aliases: ["song", "songofsolomon", "sos"] },
  { en: "Isaiah", vi: "\xCA-sai", aliases: ["isa", "isaiah"] },
  { en: "Jeremiah", vi: "Gi\xEA-r\xEA-mi", aliases: ["jer", "jeremiah"] },
  { en: "Lamentations", vi: "Ca Th\u01B0\u01A1ng", aliases: ["lam", "lamentations"] },
  { en: "Ezekiel", vi: "\xCA-x\xEA-chi-\xEAn", aliases: ["ezek", "ezekiel"] },
  { en: "Daniel", vi: "\u0110a-ni-\xEAn", aliases: ["dan", "daniel"] },
  { en: "Hosea", vi: "\xD4-s\xEA", aliases: ["hos", "hosea"] },
  { en: "Joel", vi: "Gi\xF4-\xEAn", aliases: ["joel"] },
  { en: "Amos", vi: "A-m\u1ED1t", aliases: ["amos"] },
  { en: "Obadiah", vi: "\xC1p-\u0111ia", aliases: ["obad", "obadiah"] },
  { en: "Jonah", vi: "Gi\xF4-na", aliases: ["jonah"] },
  { en: "Micah", vi: "Mi-ch\xEA", aliases: ["mic", "micah"] },
  { en: "Nahum", vi: "Na-hum", aliases: ["nah", "nahum"] },
  { en: "Habakkuk", vi: "Ha-ba-c\xFAc", aliases: ["hab", "habakkuk"] },
  { en: "Zephaniah", vi: "S\xF4-ph\xF4-ni", aliases: ["zeph", "zephaniah"] },
  { en: "Haggai", vi: "A-gh\xEA", aliases: ["hag", "haggai"] },
  { en: "Zechariah", vi: "Xa-cha-ri", aliases: ["zech", "zechariah"] },
  { en: "Malachi", vi: "Ma-la-chi", aliases: ["mal", "malachi"] },
  { en: "Matthew", vi: "Ma-thi-\u01A1", aliases: ["matt", "mt", "matthew"] },
  { en: "Mark", vi: "M\xE1c", aliases: ["mark", "mk"] },
  { en: "Luke", vi: "Lu-ca", aliases: ["luke", "lk"] },
  { en: "John", vi: "Gi\u0103ng", aliases: ["john", "jn"] },
  { en: "Acts", vi: "C\xF4ng V\u1EE5", aliases: ["acts"] },
  { en: "Romans", vi: "R\xF4-ma", aliases: ["rom", "romans"] },
  { en: "1 Corinthians", vi: "1 C\xF4-rinh-t\xF4", aliases: ["1cor", "1corinthians"] },
  { en: "2 Corinthians", vi: "2 C\xF4-rinh-t\xF4", aliases: ["2cor", "2corinthians"] },
  { en: "Galatians", vi: "Ga-la-ti", aliases: ["gal", "galatians"] },
  { en: "Ephesians", vi: "\xCA-ph\xEA-s\xF4", aliases: ["eph", "ephesians"] },
  { en: "Philippians", vi: "Phi-l\xEDp", aliases: ["phil", "philippians"] },
  { en: "Colossians", vi: "C\xF4-l\xF4-se", aliases: ["col", "colossians"] },
  { en: "1 Thessalonians", vi: "1 T\xEA-sa-l\xF4-ni-ca", aliases: ["1thess", "1thessalonians"] },
  { en: "2 Thessalonians", vi: "2 T\xEA-sa-l\xF4-ni-ca", aliases: ["2thess", "2thessalonians"] },
  { en: "1 Timothy", vi: "1 Ti-m\xF4-th\xEA", aliases: ["1tim", "1timothy"] },
  { en: "2 Timothy", vi: "2 Ti-m\xF4-th\xEA", aliases: ["2tim", "2timothy"] },
  { en: "Titus", vi: "T\xEDt", aliases: ["titus", "tit"] },
  { en: "Philemon", vi: "Phi-l\xEA-m\xF4n", aliases: ["phlm", "philemon"] },
  { en: "Hebrews", vi: "H\xEA-b\u01A1-r\u01A1", aliases: ["heb", "hebrews"] },
  { en: "James", vi: "Gia-c\u01A1", aliases: ["jas", "james"] },
  { en: "1 Peter", vi: "1 Phi-e-r\u01A1", aliases: ["1pet", "1peter"] },
  { en: "2 Peter", vi: "2 Phi-e-r\u01A1", aliases: ["2pet", "2peter"] },
  { en: "1 John", vi: "1 Gi\u0103ng", aliases: ["1john", "1jn"] },
  { en: "2 John", vi: "2 Gi\u0103ng", aliases: ["2john", "2jn"] },
  { en: "3 John", vi: "3 Gi\u0103ng", aliases: ["3john", "3jn"] },
  { en: "Jude", vi: "Giu-\u0111e", aliases: ["jude"] },
  { en: "Revelation", vi: "Kh\u1EA3i Huy\u1EC1n", aliases: ["rev", "revelation"] }
];
function normalizeKey(text2) {
  return text2.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "d").toLowerCase().replace(/[^a-z0-9]/g, "");
}
var BOOK_LOOKUP = /* @__PURE__ */ new Map();
BOOKS.forEach((book, index) => {
  const bookNumber = index + 1;
  BOOK_LOOKUP.set(normalizeKey(book.en), bookNumber);
  BOOK_LOOKUP.set(normalizeKey(book.vi), bookNumber);
  for (const alias of book.aliases) {
    BOOK_LOOKUP.set(normalizeKey(alias), bookNumber);
  }
});
function parsePassage(passage) {
  const cleaned = passage.trim().replace(/\s+/g, " ");
  const match = cleaned.match(/^(.+?)\s+(\d+)(?:\s*:\s*(\d+)(?:\s*[-–—]\s*(\d+|end))?)?\s*$/i);
  if (!match) {
    throw new Error(
      `Could not understand "${passage}". Try e.g. "John 3:16" or "Gi\u0103ng 3:16".`
    );
  }
  const [, bookName, chapterStr, verseStartStr, verseEndStr] = match;
  const bookNumber = BOOK_LOOKUP.get(normalizeKey(bookName));
  if (!bookNumber) {
    throw new Error(
      `Unknown book "${bookName}" in "${passage}". Try e.g. "John 3:16" or "Gi\u0103ng 3:16".`
    );
  }
  const chapter = Number(chapterStr);
  const verseStart = verseStartStr ? Number(verseStartStr) : void 0;
  let verseEnd;
  if (verseEndStr) {
    verseEnd = verseEndStr.toLowerCase() === "end" ? "end" : Number(verseEndStr);
  }
  if (verseStart !== void 0 && verseEnd !== void 0 && verseEnd !== "end" && verseEnd < verseStart) {
    throw new Error(`Invalid verse range in "${passage}".`);
  }
  if (verseStart !== void 0 && verseEnd !== void 0 && verseEnd !== "end" && verseEnd - verseStart + 1 > MAX_VERSES) {
    throw verseLimitError(verseEnd - verseStart + 1);
  }
  return { bookNumber, chapter, verseStart, verseEnd };
}
function cleanText(text2) {
  return text2.replace(/\s+/g, " ").trim();
}
async function fetchChapter(lang, code, bookNumber, chapter) {
  const url = `${API_BASE}/${lang}/${code}/${bookNumber}/${chapter}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`Bible API returned HTTP ${res.status} for ${url}`);
    }
    const data = await res.json();
    const verses = data?.verses;
    if (!Array.isArray(verses) || verses.length === 0) {
      throw new Error(`No verses returned for that chapter.`);
    }
    return verses.map((v) => cleanText(String(v)));
  } finally {
    clearTimeout(timeout);
  }
}
function selectVerses(verses, verseStart, verseEnd) {
  if (verseStart === void 0) {
    if (verses.length > MAX_VERSES) {
      throw verseLimitError(verses.length);
    }
    return verses.join(" ");
  }
  const startIndex = verseStart - 1;
  if (startIndex < 0 || startIndex >= verses.length) {
    throw new Error(`Verse ${verseStart} does not exist in this chapter.`);
  }
  const endIndex = verseEnd === void 0 ? startIndex : verseEnd === "end" ? verses.length - 1 : Math.min(verseEnd - 1, verses.length - 1);
  if (endIndex - startIndex + 1 > MAX_VERSES) {
    throw verseLimitError(endIndex - startIndex + 1);
  }
  return verses.slice(startIndex, endIndex + 1).join(" ");
}
function formatReference(bookName, chapter, verseStart, verseEnd) {
  if (verseStart === void 0) return `${bookName} ${chapter}`;
  if (verseEnd === void 0) return `${bookName} ${chapter}:${verseStart}`;
  if (verseEnd === "end") return `${bookName} ${chapter}:${verseStart}-end`;
  return `${bookName} ${chapter}:${verseStart}-${verseEnd}`;
}
var DevotionalService = {
  async fetchScripture(passage) {
    const parsed = parsePassage(passage);
    const book = BOOKS[parsed.bookNumber - 1];
    const [versesEn, versesVi] = await Promise.all([
      fetchChapter("en", "niv2011", parsed.bookNumber, parsed.chapter),
      fetchChapter("vi", "viet", parsed.bookNumber, parsed.chapter)
    ]).catch((err) => {
      const message = err instanceof Error ? err.message : "Bible lookup failed";
      throw new Error(
        `Scripture not found for "${passage}". ${message} Try e.g. "John 3:16" or "Gi\u0103ng 3:16".`
      );
    });
    let verseTextEn;
    let verseTextVi;
    try {
      verseTextEn = selectVerses(versesEn, parsed.verseStart, parsed.verseEnd);
      verseTextVi = selectVerses(versesVi, parsed.verseStart, parsed.verseEnd);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid verse";
      throw new Error(`Scripture not found for "${passage}". ${message}`);
    }
    if (!verseTextEn || !verseTextVi) {
      throw new Error(`No verse text returned for "${passage}".`);
    }
    const referenceEn = formatReference(book.en, parsed.chapter, parsed.verseStart, parsed.verseEnd);
    const referenceVi = formatReference(book.vi, parsed.chapter, parsed.verseStart, parsed.verseEnd);
    return {
      reference: referenceEn,
      referenceEn,
      referenceVi,
      verseText: verseTextEn,
      verseTextEn,
      verseTextVi,
      translation: "NIV",
      translationEn: "NIV",
      // Actual text source is Kinh Thánh 1925, not RVV11 (see header note).
      translationVi: "1925"
    };
  }
};

// src/vrc-backend/routes/devotionalRoutes.ts
var router10 = Router10();
router10.post("/fetch-scripture", requireAdmin, aiRateLimiter, async (req, res) => {
  try {
    const { passage } = req.body;
    if (!passage) {
      return res.status(400).json({ error: "Scripture passage reference is required" });
    }
    const result = await DevotionalService.fetchScripture(String(passage).trim());
    res.json(result);
  } catch (error) {
    console.error("Error fetching scripture:", error);
    res.status(400).json({ error: error.message || "Failed to fetch scripture" });
  }
});
router10.post("/generate-devotional", requireAdmin, aiRateLimiter, async (req, res) => {
  try {
    const { passage } = req.body;
    if (!passage) {
      return res.status(400).json({ error: "Scripture passage reference is required" });
    }
    const result = await DevotionalService.fetchScripture(String(passage).trim());
    res.json(result);
  } catch (error) {
    console.error("Error fetching scripture:", error);
    res.status(400).json({ error: error.message || "Failed to fetch scripture" });
  }
});
var devotionalRoutes_default = router10;

// src/vrc-backend/utils/appEnvironment.ts
function getAppEnvironment(req) {
  if (req) {
    const headerEnv = String(req.headers["x-app-env"] || "").toLowerCase();
    if (headerEnv === "development" || headerEnv === "production") {
      return headerEnv;
    }
    const queryEnv = String(req.query?.env || "").toLowerCase();
    if (queryEnv === "development" || queryEnv === "production") {
      return queryEnv;
    }
    const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").toLowerCase();
    if (host.includes("ais-dev") || host.includes("localhost") || host.includes("127.0.0.1")) {
      return "development";
    }
    if (host.includes("ais-pre")) {
      return "production";
    }
  }
  if (process.env.NODE_ENV === "production" || process.env.APP_URL?.includes("ais-pre")) {
    return "production";
  }
  return "development";
}

// src/vrc-backend/app.ts
var createApp = () => {
  const app2 = express();
  app2.use(compression());
  app2.use((req, res, next) => {
    const env = getAppEnvironment(req);
    dbContext.run(env, () => next());
  });
  app2.use(corsMiddleware);
  app2.use(express.json({ limit: "1mb" }));
  app2.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    next();
  });
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
  app2.use("/api/sermons", sermonRoutes_default);
  app2.use("/api/notifications", notifRoutes_default);
  app2.use("/api/spotlight", spotlightRoutes_default);
  app2.use("/api/church-info", churchInfoRoutes_default);
  app2.use("/api/prayers", prayerRoutes_default);
  app2.use("/api/push", pushRoutes_default);
  app2.use("/api/ai", devotionalRoutes_default);
  app2.use("/api/*", (req, res) => {
    res.status(404).json({
      error: `API route not found: ${req.method} ${req.originalUrl}`,
      status: 404,
      method: req.method,
      path: req.originalUrl,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
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
  const isProduction = process.env.NODE_ENV === "production" || __filename.includes("/dist/") || __filename.endsWith("dist/server.js");
  if (isProduction) {
    const distPath = __dirname.endsWith("dist") ? __dirname : path.join(__dirname, "dist");
    console.log(`Serving production static assets from: ${distPath}`);
    app.use(express2.static(distPath, { maxAge: "1y", immutable: true, index: false }));
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
