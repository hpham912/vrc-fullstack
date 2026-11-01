import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
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

// Dedicated Administrator Accounts (Direct username/password login, no Google login)
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
  description: text('description').notNull(),
  category: text('category').notNull().default('Worship'), // 'Worship', 'Youth', 'Bible Study', 'Community Outreach', 'Fellowship', 'Special Event'
  date: text('date').notNull(), // YYYY-MM-DD
  startTime: text('start_time').notNull(), // e.g. "09:30 AM"
  endTime: text('end_time'), // e.g. "11:00 AM"
  location: text('location').notNull(), // e.g. "Main Sanctuary", "Youth Hall", "Online Stream"
  address: text('address'),
  imageUrl: text('image_url'),
  isFeatured: boolean('is_featured').notNull().default(false),
  rsvpCount: integer('rsvp_count').notNull().default(0),
  maxCapacity: integer('max_capacity'),
  organizerName: text('organizer_name'),
  organizerEmail: text('organizer_email'),
  createdByUid: text('created_by_uid').references(() => users.uid),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Daily Scripture verses and reflections
export const dailyVerses = pgTable('daily_verses', {
  id: serial('id').primaryKey(),
  date: text('date').notNull().unique(), // YYYY-MM-DD
  verseText: text('verse_text').notNull(),
  reference: text('reference').notNull(), // e.g. "Romans 12:2"
  translation: text('translation').notNull().default('NIV'), // NIV, ESV, KJV, NLT, CSB
  reflection: text('reflection').notNull(),
  prayer: text('prayer'),
  theme: text('theme').default('Faith & Encouragement'),
  publishedByUid: text('published_by_uid').references(() => users.uid),
  createdAt: timestamp('created_at').defaultNow(),
});

// Event RSVPs by attendees
export const eventRsvps = pgTable('event_rsvps', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id')
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' }),
  userName: text('user_name').notNull(),
  userEmail: text('user_email').notNull(),
  attendeesCount: integer('attendees_count').notNull().default(1),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
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
  status: text('status').notNull().default('active'), // 'active', 'answered'
  createdAt: timestamp('created_at').defaultNow(),
});

// General Church Announcements
export const announcements = pgTable('announcements', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  priority: text('priority').notNull().default('normal'), // 'urgent', 'high', 'normal'
  linkUrl: text('link_url'),
  linkText: text('link_text'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  events: many(events),
  dailyVerses: many(dailyVerses),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  creator: one(users, {
    fields: [events.createdByUid],
    references: [users.uid],
  }),
  rsvps: many(eventRsvps),
}));

export const eventRsvpsRelations = relations(eventRsvps, ({ one }) => ({
  event: one(events, {
    fields: [eventRsvps.eventId],
    references: [events.id],
  }),
}));

export const dailyVersesRelations = relations(dailyVerses, ({ one }) => ({
  publisher: one(users, {
    fields: [dailyVerses.publishedByUid],
    references: [users.uid],
  }),
}));
