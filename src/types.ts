export interface ChurchEvent {
  id: number;
  title: string;
  description: string;
  category: string;
  date: string;
  startTime: string;
  endTime?: string | null;
  location: string;
  address?: string | null;
  imageUrl?: string | null;
  isFeatured: boolean;
  rsvpCount: number;
  maxCapacity?: number | null;
  organizerName?: string | null;
  organizerEmail?: string | null;
  rsvps?: EventRsvp[];
}

export interface EventRsvp {
  id: number;
  userName: string;
  attendeesCount: number;
  createdAt: string;
}

export interface DailyVerse {
  id: number;
  date: string;
  verseText: string;
  reference: string;
  translation: string;
  reflection: string;
  prayer?: string | null;
  theme?: string | null;
}

export interface PrayerRequest {
  id: number;
  title: string;
  request: string;
  requesterName: string;
  isAnonymous: boolean;
  isPraise: boolean;
  prayerCount: number;
  status: string;
  createdAt: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: string;
  linkUrl?: string | null;
  linkText?: string | null;
  active: boolean;
  createdAt: string;
}
