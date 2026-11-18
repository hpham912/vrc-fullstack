import { useState, useEffect } from 'react';
import { apiUrl, apiHeaders } from '../utils/api.ts';
import { NotificationClient } from '../services/notificationClient.ts';
import { CHURCH_NAME } from '../constants/church.ts';
import { SYNC_COLLECTIONS } from '../common-component/index.ts';
import type { SyncCollection } from '../common-component/index.ts';
import {
  ChurchEvent,
  DailyVerse,
  Video,
  AppNotification,
  Announcement,
  SpotlightBannerConfig,
  ChurchInfo,
  DEFAULT_CHURCH_INFO,
  DEFAULT_SPOTLIGHT,
} from '../types/index.ts';

// Owns every collection the app shows, plus the fetch functions that
// fill them. The shell (App.tsx) only renders; it never fetches. The
// live sync and pull-to-refresh call refreshCollections through here.
export function useAppData() {
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [todayVerse, setTodayVerse] = useState<DailyVerse | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Hydrate spotlightConfig and churchInfo immediately from localStorage so edits never revert on refresh
  const [spotlightConfig, setSpotlightConfig] = useState<SpotlightBannerConfig | null>(() => {
    try {
      const cached = localStorage.getItem('vrc_cached_spotlight');
      if (cached) return JSON.parse(cached);
    } catch {}
    return DEFAULT_SPOTLIGHT;
  });

  const [churchInfo, setChurchInfo] = useState<ChurchInfo | null>(() => {
    try {
      const cached = localStorage.getItem('vrc_cached_church_info');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed) {
          if (!parsed.address || parsed.address.toLowerCase().includes('tempe, arizona') || parsed.address.toLowerCase() === 'tempe, az' || parsed.address.toLowerCase() === 'tempe az') {
            parsed.address = CHURCH_NAME.address;
          }
          return parsed;
        }
      }
    } catch {}
    return DEFAULT_CHURCH_INFO;
  });

  const [isLoading, setIsLoading] = useState(true);

  // True when a full load came back with nothing AND there is no data
  // already showing — that is when the screens would otherwise look
  // empty for no reason, so the load-error view replaces them instead.
  const [loadError, setLoadError] = useState(false);

  const safeJson = async (res: Response) => {
    if (!res || !res.ok) return null;
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  // Refreshes only the given collections — each one is fetched and
  // applied exactly the way loadData does it, so a live update shows
  // the same data a full reload would. Used by the live sync (which
  // re-fetches only what changed) and by loadData for the full load.
  // Returns true when at least one collection loaded — the caller
  // (loadData) uses it to decide whether the app has anything to show.
  // A collection that returns an empty list still counts: empty is
  // valid data, a failed fetch is not.
  const refreshCollections = async (collections: SyncCollection[]): Promise<boolean> => {
    const headers = apiHeaders();
    const jobs: Promise<boolean>[] = [];

    if (collections.includes('events')) {
      jobs.push(
        (async (): Promise<boolean> => {
          try {
            const rawEvents = await safeJson(
              await fetch(apiUrl('/api/events'), { cache: 'no-store', headers }),
            );
            if (Array.isArray(rawEvents)) {
              setEvents(rawEvents);
              // Automatically schedule 1-hour before event reminders.
              if (rawEvents.length > 0) NotificationClient.scheduleEventReminders(rawEvents);
              return true;
            }
            return false;
          } catch (err) {
            console.error('Error refreshing events:', err);
            return false;
          }
        })(),
      );
    }

    if (collections.includes('verses')) {
      jobs.push(
        (async (): Promise<boolean> => {
          try {
            // Only today's verse is ever shown (no archive) — fetch
            // GET /api/verses/today, which lazy-picks from the pool
            // after 6 AM Phoenix when a new verse-day starts.
            const todayData = await safeJson(
              await fetch(apiUrl('/api/verses/today'), { cache: 'no-store', headers }),
            );
            if (todayData && typeof todayData === 'object') {
              setTodayVerse(todayData);
              return true;
            }
            return false;
          } catch (err) {
            console.error('Error refreshing verses:', err);
            return false;
          }
        })(),
      );
    }

    if (collections.includes('videos')) {
      jobs.push(
        (async (): Promise<boolean> => {
          try {
            const rawVideos = await safeJson(
              await fetch(apiUrl('/api/videos'), { cache: 'no-store', headers }),
            );
            // Videos are pruned to the last 2 months by the backend — the
            // backend already orders them newest first.
            if (Array.isArray(rawVideos)) {
              setVideos(rawVideos);
              return true;
            }
            return false;
          } catch (err) {
            console.error('Error refreshing videos:', err);
            return false;
          }
        })(),
      );
    }

    if (collections.includes('spotlight')) {
      jobs.push(
        (async (): Promise<boolean> => {
          try {
            const spotlightData = await safeJson(
              await fetch(apiUrl('/api/spotlight'), { cache: 'no-store', headers }),
            );
            if (spotlightData) {
              setSpotlightConfig(spotlightData);
              try {
                localStorage.setItem('vrc_cached_spotlight', JSON.stringify(spotlightData));
              } catch {}
              return true;
            }
            return false;
          } catch (err) {
            console.error('Error refreshing spotlight:', err);
            return false;
          }
        })(),
      );
    }

    if (collections.includes('churchInfo')) {
      jobs.push(
        (async (): Promise<boolean> => {
          try {
            const churchInfoData = await safeJson(
              await fetch(apiUrl('/api/church-info'), { cache: 'no-store', headers }),
            );
            if (churchInfoData) {
              if (
                !churchInfoData.address ||
                churchInfoData.address.toLowerCase().includes('tempe, arizona') ||
                churchInfoData.address.toLowerCase() === 'tempe, az' ||
                churchInfoData.address.toLowerCase() === 'tempe az'
              ) {
                churchInfoData.address = CHURCH_NAME.address;
              }
              setChurchInfo(churchInfoData);
              try {
                localStorage.setItem('vrc_cached_church_info', JSON.stringify(churchInfoData));
              } catch {}
              return true;
            }
            return false;
          } catch (err) {
            console.error('Error refreshing church info:', err);
            return false;
          }
        })(),
      );
    }

    if (collections.includes('notifications')) {
      jobs.push(
        (async (): Promise<boolean> => {
          try {
            setNotifications(await NotificationClient.fetchRecent());
            return true;
          } catch (err) {
            console.error('Error refreshing notifications:', err);
            return false;
          }
        })(),
      );
    }

    if (collections.includes('announcements')) {
      jobs.push(
        (async (): Promise<boolean> => {
          try {
            const rawAnnouncements = await safeJson(
              await fetch(apiUrl('/api/announcements'), { cache: 'no-store', headers }),
            );
            // Newest first from the backend; the banner shows the
            // newest row that is switched on AND inside its start/end
            // window, the admin tab shows the whole list.
            if (Array.isArray(rawAnnouncements)) {
              setAnnouncements(rawAnnouncements);
              return true;
            }
            return false;
          } catch (err) {
            console.error('Error refreshing announcements:', err);
            return false;
          }
        })(),
      );
    }

    const results = await Promise.all(jobs);
    return results.some(Boolean);
  };

  // Full load (and manual refresh): refreshes every collection.
  const loadData = async () => {
    try {
      const loaded = await refreshCollections(SYNC_COLLECTIONS);
      // A failed load only becomes the error view when there is no
      // data already showing — a failed pull-to-refresh over good data
      // must not blank the screen. A partial load (any collection
      // came back) is not an error either; the failed collections
      // keep their own empty states.
      const hasAnyData =
        events.length > 0 ||
        todayVerse !== null ||
        videos.length > 0 ||
        notifications.length > 0 ||
        announcements.length > 0;
      setLoadError(!loaded && !hasAnyData);
    } catch (err) {
      console.error('Error fetching church data from database:', err);
    } finally {
      // First load done — the screens stop showing the shimmer. Refreshes
      // keep showing the data they already have instead of flashing.
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Prompt permission so notifications are enabled by default
    NotificationClient.requestPermission().then((granted) => {
      if (granted && events.length > 0) {
        NotificationClient.scheduleEventReminders(events);
      }
    });
    // Remote push (FCM) is DEFERRED — Firebase is not initialized in the
    // Android build, so calling register() here crashes the app on launch
    // (FirebaseApp not initialized). Local reminders above still work.
    // Re-enable this line once Firebase is set up and verified.
    // NotificationClient.registerPushNotifications();

    // Check periodically (every 5 minutes) in case an event reaches the 1-hour reminder window while user is in the app
    const interval = setInterval(() => {
      if (events.length > 0) {
        NotificationClient.scheduleEventReminders(events);
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (events.length > 0) {
      NotificationClient.scheduleEventReminders(events);
    }
  }, [events]);

  return {
    events,
    todayVerse,
    videos,
    notifications,
    announcements,
    spotlightConfig,
    churchInfo,
    isLoading,
    loadError,
    refreshCollections,
    loadData,
    setSpotlightConfig,
    setChurchInfo,
  };
}
