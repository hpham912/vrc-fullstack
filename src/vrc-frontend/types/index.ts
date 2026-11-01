export interface ChurchEvent {
  id: number;
  title: string;
  description: string;
  category: string;
  date: string; // YYYY-MM-DD
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
  createdAt?: string;
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
  createdAt?: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: 'urgent' | 'high' | 'normal';
  linkUrl?: string | null;
  linkText?: string | null;
  active: boolean;
  createdAt?: string;
}

export interface AdminUser {
  id: number;
  username: string;
  displayName: string;
  email: string;
  role: string;
}

export interface AppNotification {
  id: number;
  title: string;
  body: string;
  type: 'event' | 'verse' | 'announcement';
  targetId?: number | null;
  createdAt: string;
}
