import { useCallback, useMemo, useState } from 'react';
import type { AppNotification } from '../../types/index.ts';

const SEEN_KEY = 'vrc_notifications_seen_at';

// Tracks how many notifications the user hasn't seen yet.
// - Unread = notifications created after the last time the user viewed
//   the list (saved on the phone, per device). Viewing clears the
//   count ONLY on that phone — other users keep their own count until
//   they view it themselves.
// - markSeen() records "seen up to now" — call it when the user opens
//   the Notifications tab / popup, and the count clears.
// - No "first run" auto-seen: a notification counts as unread until
//   the user views the list, even if it was posted before they opened
//   the app. Otherwise other users would never see the badge for a
//   notification posted before their first open.
export const useUnreadNotifications = (notifications: AppNotification[]) => {
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(() => {
    try {
      return localStorage.getItem(SEEN_KEY);
    } catch {
      return null;
    }
  });

  const unreadCount = useMemo(() => {
    if (!lastSeenAt) return notifications.length;
    return notifications.filter((notif) => notif.createdAt > lastSeenAt).length;
  }, [notifications, lastSeenAt]);

  const markSeen = useCallback(() => {
    const latest =
      notifications.length > 0
        ? notifications.reduce(
            (max, notif) => (notif.createdAt > max ? notif.createdAt : max),
            notifications[0].createdAt,
          )
        : new Date().toISOString();
    setLastSeenAt(latest);
    try {
      localStorage.setItem(SEEN_KEY, latest);
    } catch {}
  }, [notifications]);

  return { unreadCount, markSeen };
};
