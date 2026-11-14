import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AppNotification } from '../../types/index.ts';

const SEEN_KEY = 'vrc_notifications_seen_at';

// Tracks how many notifications the user hasn't seen yet.
// - Unread = notifications created after the last time the user viewed
//   the list (saved on the phone, per device).
// - markSeen() records "seen up to now" — call it when the user opens
//   the Notifications tab / popup, and the count clears.
// - First run: the notifications already on the phone count as seen,
//   so the badge starts at 0 and only NEW arrivals count.
export const useUnreadNotifications = (notifications: AppNotification[]) => {
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(() => {
    try {
      return localStorage.getItem(SEEN_KEY);
    } catch {
      return null;
    }
  });
  const didInitRef = useRef(false);

  // First run: treat what's already here as seen.
  useEffect(() => {
    if (didInitRef.current || lastSeenAt !== null || notifications.length === 0) return;
    didInitRef.current = true;
    const latest = notifications.reduce(
      (max, notif) => (notif.createdAt > max ? notif.createdAt : max),
      notifications[0].createdAt,
    );
    setLastSeenAt(latest);
    try {
      localStorage.setItem(SEEN_KEY, latest);
    } catch {}
  }, [notifications, lastSeenAt]);

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
