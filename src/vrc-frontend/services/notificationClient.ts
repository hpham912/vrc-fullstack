import { LocalNotifications } from '@capacitor/local-notifications';
import { apiUrl } from '../utils/api.ts';
import { AppNotification } from '../types/index.ts';

const isCapacitor = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.location.protocol === 'capacitor:' ||
    (window as any).Capacitor?.isNativePlatform?.() ||
    false
  );
};

export const NotificationClient = {
  async requestPermission(): Promise<boolean> {
    try {
      if (isCapacitor()) {
        const status = await LocalNotifications.requestPermissions();
        return status.display === 'granted';
      } else if (typeof window !== 'undefined' && 'Notification' in window) {
        const result = await Notification.requestPermission();
        return result === 'granted';
      }
    } catch (err) {
      console.warn('Notification permission request error:', err);
    }
    return false;
  },

  async triggerNotification(title: string, body: string, id = Date.now()) {
    try {
      if (isCapacitor()) {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: id % 100000,
              title,
              body,
              schedule: { at: new Date(Date.now() + 500) },
              sound: 'default',
              actionTypeId: '',
              extra: null,
            },
          ],
        });
      } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
        });
      }
    } catch (err) {
      console.warn('Failed to dispatch notification:', err);
    }
  },

  async fetchRecent(): Promise<AppNotification[]> {
    try {
      const res = await fetch(apiUrl('/api/notifications/recent'));
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error('Failed to fetch recent notifications:', err);
    }
    return [];
  },
};
