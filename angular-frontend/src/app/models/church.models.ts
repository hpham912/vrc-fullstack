export interface ChurchEvent {
  id: number;
  title: string;
  description: string;
  category: string;
  date: string;
  startTime: string;
  endTime?: string;
  location: string;
  address?: string;
  imageUrl?: string;
  isFeatured: boolean;
  rsvpCount: number;
  maxCapacity?: number;
  organizerName?: string;
  organizerEmail?: string;
}

export interface DailyVerse {
  id: number;
  date: string;
  verseText: string;
  reference: string;
  translation: string;
  reflection: string;
  prayer?: string;
  theme?: string;
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
