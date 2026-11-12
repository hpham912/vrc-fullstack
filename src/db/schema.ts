import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  photoUrl: text('photo_url'),
  role: text('role').notNull().default('member'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Dedicated Administrator Accounts (PBKDF2 credentials, no Google OAuth required)
export const adminUsers = pgTable('admin_users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name').notNull(),
  passwordHash: text('password_hash').notNull(),
  passwordSalt: text('password_salt').notNull(),
  role: text('role').notNull().default('admin'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Church events calendar
export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  titleVi: text('title_vi'),
  titleEn: text('title_en'),
  description: text('description').notNull(),
  descriptionVi: text('description_vi'),
  descriptionEn: text('description_en'),
  category: text('category').notNull().default('Worship'), // 'Worship', 'Bible Study', 'Youth', 'Special Gathering'
  date: text('date').notNull(), // YYYY-MM-DD
  startTime: text('start_time').notNull(), // e.g. "03:00 PM"
  endTime: text('end_time'), // e.g. "05:00 PM"
  location: text('location').notNull(), // e.g. "Main Sanctuary"
  locationVi: text('location_vi'),
  locationEn: text('location_en'),
  address: text('address').default('Tempe, Arizona'),
  imageUrl: text('image_url'),
  isFeatured: boolean('is_featured').notNull().default(false),
  hasZoom: boolean('has_zoom').notNull().default(false),
  maxCapacity: integer('max_capacity'),
  organizerName: text('organizer_name'),
  organizerEmail: text('organizer_email'),
  createdByUid: text('created_by_uid'),
  createdBy: text('created_by'),
  updatedBy: text('updated_by'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Daily Scripture verses and pastoral reflections
export const dailyVerses = pgTable('daily_verses', {
  id: serial('id').primaryKey(),
  date: text('date').notNull().unique(), // YYYY-MM-DD
  verseText: text('verse_text').notNull(),
  verseTextVi: text('verse_text_vi'),
  verseTextEn: text('verse_text_en'),
  reference: text('reference').notNull(), // e.g. "2 Chronicles 7:14"
  referenceVi: text('reference_vi'),
  referenceEn: text('reference_en'),
  translation: text('translation').notNull().default('NIV'),
  translationVi: text('translation_vi'),
  translationEn: text('translation_en'),
  reflection: text('reflection').notNull(),
  reflectionVi: text('reflection_vi'),
  reflectionEn: text('reflection_en'),
  prayer: text('prayer'),
  prayerVi: text('prayer_vi'),
  prayerEn: text('prayer_en'),
  theme: text('theme').default('Faith & Encouragement'),
  publishedByUid: text('published_by_uid'),
  createdBy: text('created_by'),
  updatedBy: text('updated_by'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Sunday worship sermon videos (Bài Giảng) — hosted on YouTube or
// Facebook, the app stores NO video data: only the link, the platform,
// bilingual title + description, and the Sunday worship date. Only the
// last 2 months are kept — older sermons are pruned by the sermons API
// (see pruneSermonsOlderThanTwoMonths in sermonRoutes.ts).
export const sermons = pgTable('sermons', {
  id: serial('id').primaryKey(),
  platform: text('platform').notNull().default('youtube'),
  youtubeUrl: text('youtube_url'),
  videoId: text('video_id'),
  facebookUrl: text('facebook_url'),
  titleVi: text('title_vi').notNull(),
  titleEn: text('title_en').notNull(),
  descriptionVi: text('description_vi'),
  descriptionEn: text('description_en'),
  date: text('date').notNull(), // YYYY-MM-DD (the Sunday worship date)
  createdBy: text('created_by'),
  updatedBy: text('updated_by'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Community Prayer Requests & Praise Reports
export const prayerRequests = pgTable('prayer_requests', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  request: text('request').notNull(),
  requesterName: text('requester_name').notNull().default('Church Member'),
  isAnonymous: boolean('is_anonymous').notNull().default(false),
  isPraise: boolean('is_praise').notNull().default(false),
  prayerCount: integer('prayer_count').notNull().default(0),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow(),
});

// General Church Announcements
export const announcements = pgTable('announcements', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  priority: text('priority').notNull().default('normal'),
  linkUrl: text('link_url'),
  linkText: text('link_text'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Push & In-App Notifications
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  type: text('type').notNull(), // 'event' | 'verse' | 'announcement'
  targetId: integer('target_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Church info (sanctuary, contact, Zoom, worship schedule) — a single
// config document, one row per database (id is always 1). The dev and
// prod databases are separate, so there is no dev/prod split here.
// Moved from Firestore 2026-11-10 so all app data lives in Postgres.
// The document is one jsonb column (not explicit columns) because it is
// a nested config object — headerVerse plus a services array — that is
// always read and written as a whole.
export const churchInfo = pgTable('church_info', {
  id: integer('id').primaryKey(),
  data: jsonb('data').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Home hero banner / spotlight — a single config document, one row per
// database (id is always 1). Moved from Firestore 2026-11-10.
export const spotlight = pgTable('spotlight', {
  id: integer('id').primaryKey(),
  data: jsonb('data').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Push notification device tokens (FCM). One row per phone that opted in
// to push. The app registers its FCM token here on launch; the backend
// sends a push to all tokens whenever a notification is created.
export const deviceTokens = pgTable('device_tokens', {
  id: serial('id').primaryKey(),
  token: text('token').notNull().unique(),
  platform: text('platform').notNull().default('android'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

