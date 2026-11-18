import type { Announcement } from '../types/index.ts';
import { formatDateLocale } from './dateFormatter.ts';
import type { Language } from '../context/translations.ts';

// Whether this announcement is on the banner right now: switched on
// AND inside its start/end window. A null start means "from now", a
// null end means "until turned off". The banner and the admin list
// both use this one check, so "showing" can never mean two different
// things on the two screens. `now` defaults to the device clock — the
// banner re-checks on every data refresh (foreground / tab switch /
// pull-to-refresh), the same triggers as the rest of the live sync;
// there is deliberately no timer here.
export const isAnnouncementShowing = (
  announcement: Announcement,
  now: Date = new Date(),
): boolean => {
  if (!announcement.active) return false;
  if (announcement.startsAt) {
    const startsAt = new Date(announcement.startsAt);
    if (!Number.isNaN(startsAt.getTime()) && now.getTime() < startsAt.getTime()) return false;
  }
  if (announcement.endsAt) {
    const endsAt = new Date(announcement.endsAt);
    if (!Number.isNaN(endsAt.getTime()) && now.getTime() >= endsAt.getTime()) return false;
  }
  return true;
};

// Whether the announcement is scheduled for later: switched on, with
// a start time still in the future. Used for the admin list badge.
export const isAnnouncementScheduled = (
  announcement: Announcement,
  now: Date = new Date(),
): boolean => {
  if (!announcement.active || !announcement.startsAt) return false;
  const startsAt = new Date(announcement.startsAt);
  return !Number.isNaN(startsAt.getTime()) && now.getTime() < startsAt.getTime();
};

// One line for the admin list showing when an announcement runs, e.g.
// "25-11-2026 09:00 – 26-11-2026 15:00", "From 25-11-2026 09:00", or
// "Until 26-11-2026 15:00". Empty when the announcement has no
// schedule (shows until turned off). Same date + time shape as the
// Zoom join-time display.
export const formatAnnouncementWindow = (
  announcement: Announcement,
  language: Language,
): string => {
  const formatOne = (iso: string): string => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    const timeText = date.toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: language !== 'vi',
    });
    return `${formatDateLocale(date, language)} ${timeText}`;
  };
  const startText = announcement.startsAt ? formatOne(announcement.startsAt) : '';
  const endText = announcement.endsAt ? formatOne(announcement.endsAt) : '';
  if (startText && endText) return `${startText} – ${endText}`;
  if (startText) return language === 'vi' ? `Từ ${startText}` : `From ${startText}`;
  if (endText) return language === 'vi' ? `Đến ${endText}` : `Until ${endText}`;
  return '';
};
