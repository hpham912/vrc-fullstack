import { db } from '../../vrc-db/index.ts';
import { notifications } from '../../vrc-db/schema.ts';
import { desc } from 'drizzle-orm';

export const BackendNotificationService = {
  async recordNotification(title: string, body: string, type: 'event' | 'verse' | 'announcement', targetId?: number) {
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
      return inserted[0];
    } catch (err) {
      console.error('Failed to log push notification:', err);
      return null;
    }
  },

  async getRecent(limit = 20) {
    return await db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  },
};
