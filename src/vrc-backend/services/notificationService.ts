import { db } from '../../vrc-db/index.ts';
import { notifications, events } from '../../vrc-db/schema.ts';
import { desc, eq, and, inArray } from 'drizzle-orm';

// Keep only the 10 latest notifications (same rule as daily verses).
async function enforceMaxTenNotifications() {
  try {
    const all = await db
      .select({ id: notifications.id })
      .from(notifications)
      .orderBy(desc(notifications.createdAt));

    if (all.length > 10) {
      const surplus = all.slice(10);
      for (const item of surplus) {
        await db.delete(notifications).where(eq(notifications.id, item.id));
      }
      console.log(`Pruned ${surplus.length} older notifications in PostgreSQL.`);
    }
  } catch (err) {
    console.warn('Failed to prune notifications to 10:', err);
  }
}

export const BackendNotificationService = {
  async recordNotification(
    title: string,
    body: string,
    type: 'event' | 'verse' | 'announcement',
    targetId?: number
  ) {
    try {
      const inserted = await db
        .insert(notifications)
        .values({
          title,
          body,
          type,
          targetId: targetId || null,
        })
        .returning();
      await enforceMaxTenNotifications();
      return inserted[0];
    } catch (err) {
      console.error('Failed to log push notification to PostgreSQL:', err);
      return null;
    }
  },

  // Delete notifications that point at a deleted event, so a deleted event
  // no longer shows up in the Notifications tab.
  async deleteForEvent(eventId: number) {
    try {
      await db
        .delete(notifications)
        .where(
          and(
            eq(notifications.type, 'event'),
            eq(notifications.targetId, eventId)
          )
        );
    } catch (err) {
      console.warn('Failed to delete notifications for event:', err);
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
      console.error('Failed to clear notifications:', err);
      return -1;
    }
  },

  // Delete one notification by id (admin per-item delete). Returns the
  // deleted row, or null when no notification with that id exists.
  async deleteById(id: number) {
    try {
      const deleted = await db
        .delete(notifications)
        .where(eq(notifications.id, id))
        .returning();
      return deleted[0] || null;
    } catch (err) {
      console.error('Failed to delete notification:', err);
      return null;
    }
  },

  async getRecent(limit = 10) {
    try {
      const list = await db
        .select()
        .from(notifications)
        .orderBy(desc(notifications.createdAt))
        .limit(limit);

      // One-time cleanup on read: drop event notifications whose event was
      // deleted before the delete-cleanup existed, so they stop showing up.
      const eventNotifs = list.filter(
        (item) => item.type === 'event' && item.targetId
      );
      if (eventNotifs.length > 0) {
        const existingEvents = await db.select({ id: events.id }).from(events);
        const existingIds = new Set(existingEvents.map((event) => event.id));
        const orphanIds = eventNotifs
          .filter((item) => !existingIds.has(item.targetId as number))
          .map((item) => item.id);
        if (orphanIds.length > 0) {
          await db.delete(notifications).where(inArray(notifications.id, orphanIds));
          return list.filter((item) => !orphanIds.includes(item.id));
        }
      }

      return list;
    } catch (err) {
      console.error('Failed to fetch notifications from PostgreSQL:', err);
      return [];
    }
  },
};
