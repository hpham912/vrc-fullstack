import { LocalNotifications } from '@capacitor/local-notifications';
import { apiUrl } from '../utils/api.ts';
import { AppNotification, ChurchEvent } from '../types/index.ts';

const isCapacitor = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.location.protocol === 'capacitor:' ||
    (window as any).Capacitor?.isNativePlatform?.() ||
    false
  );
};

// Key to remember sent reminder IDs so we don't duplicate reminders in the current browser/session
const SENT_REMINDERS_KEY = 'vrc_sent_event_reminders';

const getSentReminderIds = (): number[] => {
  try {
    const raw = localStorage.getItem(SENT_REMINDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const markReminderSent = (eventId: number) => {
  try {
    const list = getSentReminderIds();
    if (!list.includes(eventId)) {
      list.push(eventId);
      localStorage.setItem(SENT_REMINDERS_KEY, JSON.stringify(list.slice(-100)));
    }
  } catch {}
};

/**
 * Plays a soft, harmonious church bell chime using Web Audio API
 */
export const playNotificationChime = () => {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Pleasant dual chime transition (D5 to A5)
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.65);
  } catch (err) {
    // Non-blocking if audio autoplay policy prevents immediate sound
  }
};

/**
 * Parses event date (YYYY-MM-DD) and startTime (e.g. "3:00 PM", "15:00", "03:00 PM") into a Date object
 */
export const parseEventDateTime = (dateStr: string, timeStr: string): Date | null => {
  try {
    if (!dateStr) return null;
    const cleanTime = (timeStr || '09:00 AM').trim();

    // Match 12-hour or 24-hour patterns e.g. "3:00 PM", "03:30 pm", "15:00"
    const match = cleanTime.match(/(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?/);
    let hours = 9;
    let minutes = 0;

    if (match) {
      hours = parseInt(match[1], 10);
      minutes = parseInt(match[2], 10);
      const meridiem = match[3] ? match[3].toUpperCase() : null;

      if (meridiem === 'PM' && hours < 12) {
        hours += 12;
      } else if (meridiem === 'AM' && hours === 12) {
        hours = 0;
      }
    }

    const [year, month, day] = dateStr.split('-').map((v) => parseInt(v, 10));
    if (!year || !month || !day) return null;

    return new Date(year, month - 1, day, hours, minutes, 0, 0);
  } catch (err) {
    console.warn('Error parsing event datetime:', dateStr, timeStr, err);
    return null;
  }
};

export const NotificationClient = {
  /**
   * Check current notification permission status ('granted', 'denied', 'prompt')
   * In webapp/browser, defaults to 'granted' as requested (auto-enabled).
   */
  async getPermissionStatus(): Promise<string> {
    try {
      if (isCapacitor()) {
        const status = await LocalNotifications.checkPermissions();
        return status.display;
      } else if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'denied') {
          return 'denied';
        }
        // If not explicitly denied, reminders are enabled by default
        return 'granted';
      }
    } catch (err) {
      console.warn('Error checking notification permission:', err);
    }
    return 'granted';
  },

  /**
   * Request push/local notification permission from user.
   * Gracefully handles iframe contexts and top-level browsers.
   */
  async requestPermission(): Promise<boolean> {
    try {
      if (isCapacitor()) {
        const status = await LocalNotifications.requestPermissions();
        return status.display === 'granted';
      } else if (typeof window !== 'undefined' && 'Notification' in window) {
        const isInsideIframe = window.self !== window.top;
        if (isInsideIframe) {
          // Browsers disallow Notification.requestPermission in iframes; consider enabled by default
          localStorage.setItem('vrc_notif_enabled', 'true');
          return true;
        }

        if (Notification.permission === 'default') {
          try {
            const req = Notification.requestPermission();
            if (req && typeof (req as any).then === 'function') {
              await req;
            } else {
              await new Promise((resolve) => Notification.requestPermission(resolve));
            }
          } catch (e) {
            console.warn('Notification.requestPermission handled:', e);
          }
        }
        localStorage.setItem('vrc_notif_enabled', 'true');
        return Notification.permission !== 'denied';
      }
    } catch (err) {
      console.warn('Notification permission request error:', err);
    }
    localStorage.setItem('vrc_notif_enabled', 'true');
    return true;
  },

  /**
   * Immediately trigger or dispatch a notification:
   * 1. Plays audible chime tone
   * 2. Emits an in-app toast event so a banner appears in the browser/preview
   * 3. Sends system notification (Capacitor on iOS / HTML5 Notification on desktop if granted)
   */
  async triggerNotification(title: string, body: string, id = Date.now()) {
    try {
      // 1. Play soft chime tone
      playNotificationChime();

      // 2. Dispatch in-app toast event for instant visual feedback in webapp browser
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('vrc-toast-notification', {
            detail: { id, title, body },
          })
        );
      }

      // 3. iOS Native Notification
      if (isCapacitor()) {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Math.abs(id % 100000),
              title,
              body,
              schedule: { at: new Date(Date.now() + 500) },
              sound: 'default',
              actionTypeId: '',
              extra: null,
            },
          ],
        });
      } else if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        // 4. HTML5 Web Notification
        try {
          new Notification(title, {
            body,
            icon: '/favicon.ico',
          });
        } catch {
          // Browser may restrict Notification constructor in certain iframe sandboxes
        }
      }
    } catch (err) {
      console.warn('Failed to dispatch notification:', err);
    }
  },

  /**
   * Schedule 1-hour before event reminders for upcoming church events.
   * - In native iOS (Capacitor), schedules an exact local notification 1 hour prior to event start.
   * - In browser (web app), schedules timers and checks if any event is within 1 hour to display notification.
   */
  async scheduleEventReminders(events: ChurchEvent[]) {
    if (!events || events.length === 0) return;

    const now = Date.now();
    const sentIds = getSentReminderIds();

    for (const evt of events) {
      const eventDate = parseEventDateTime(evt.date, evt.startTime);
      if (!eventDate) continue;

      const eventTimeMs = eventDate.getTime();
      // 1 hour before event in milliseconds (3600000 ms)
      const oneHourBeforeMs = eventTimeMs - 60 * 60 * 1000;

      // Event already ended over 1 hour ago
      if (eventTimeMs < now) continue;

      const title = `Nhắc Nhở Sự Kiện • Event in 1 Hour: ${evt.title}`;
      const locationText = evt.location ? ` tại ${evt.location}` : '';
      const body = `Sự kiện "${evt.title}" sẽ diễn ra trong 1 giờ nữa (${evt.startTime}${locationText}). Kính mời quý con cái Chúa cùng tham dự!`;

      // 1. Native iOS/Capacitor scheduling
      if (isCapacitor()) {
        try {
          if (oneHourBeforeMs > now) {
            // Schedule notification at exactly 1 hour before
            await LocalNotifications.schedule({
              notifications: [
                {
                  id: (evt.id * 100 + 1) % 100000,
                  title,
                  body,
                  schedule: { at: new Date(oneHourBeforeMs) },
                  sound: 'default',
                  actionTypeId: '',
                  extra: { eventId: evt.id },
                },
              ],
            });
          } else if (eventTimeMs > now && !sentIds.includes(evt.id)) {
            // Event starts in less than 1 hour, trigger reminder immediately
            markReminderSent(evt.id);
            await this.triggerNotification(title, body, evt.id);
          }
        } catch (capErr) {
          console.warn('Capacitor schedule notification error for event:', evt.id, capErr);
        }
      }

      // 2. Web browser (HTML5 Web Notifications + In-App Toasts)
      if (typeof window !== 'undefined') {
        const timeUntilReminder = oneHourBeforeMs - now;

        if (timeUntilReminder > 0) {
          // Future event more than 1 hour away: schedule setTimeout if within reasonable runtime (e.g. up to 24h)
          if (timeUntilReminder < 24 * 60 * 60 * 1000) {
            setTimeout(() => {
              if (!sentIds.includes(evt.id)) {
                markReminderSent(evt.id);
                this.triggerNotification(title, body, evt.id);
              }
            }, timeUntilReminder);
          }
        } else if (eventTimeMs > now && !sentIds.includes(evt.id)) {
          // Event is happening in less than 1 hour and user hasn't received the reminder yet
          markReminderSent(evt.id);
          this.triggerNotification(title, body, evt.id);
        }
      }
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
