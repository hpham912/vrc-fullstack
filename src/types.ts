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
  organizerName?: string | null;
  organizerEmail?: string | null;
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
