export interface ChurchEvent {
  id: number;
  title: string;
  titleVi?: string | null;
  titleEn?: string | null;
  description: string;
  descriptionVi?: string | null;
  descriptionEn?: string | null;
  category: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime?: string | null;
  location: string;
  locationVi?: string | null;
  locationEn?: string | null;
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
  verseTextVi?: string | null;
  verseTextEn?: string | null;
  reference: string;
  referenceVi?: string | null;
  referenceEn?: string | null;
  translation: string;
  reflection: string;
  reflectionVi?: string | null;
  reflectionEn?: string | null;
  prayer?: string | null;
  prayerVi?: string | null;
  prayerEn?: string | null;
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

export type SpotlightTheme = 'christmas' | 'thanksgiving' | 'easter' | 'revival' | 'special' | 'default';

export interface SpotlightBannerConfig {
  id?: string;
  mode?: 'auto' | 'event' | 'custom'; // 'auto': auto-advance to next upcoming event; 'event': admin pinned event; 'custom': custom banner/holiday preset
  selectedEventId?: number | null; // ID of pinned church event if mode is 'event'
  isActive: boolean; // whether holiday/spotlight mode is active
  theme: SpotlightTheme;
  badge?: string;
  badgeVi?: string;
  badgeEn?: string;
  title: string;
  titleVi?: string;
  titleEn?: string;
  subtitle?: string;
  subtitleVi?: string;
  subtitleEn?: string;
  description: string;
  descriptionVi?: string;
  descriptionEn?: string;
  dateTag?: string;
  locationTag?: string;
  locationTagVi?: string;
  locationTagEn?: string;
  customAddress?: string; // e.g. "Tempe, Arizona"
  primaryBtnText: string; // e.g. "Xem Lịch Sự Kiện", "Đăng Ký Tham Gia"
  primaryBtnAction: 'events' | 'youth' | 'verse' | 'schedule';
  secondaryBtnText: string; // e.g. "Chỉ Đường Đến Nhà Thờ"
  secondaryBtnUrl: string; // e.g. "https://maps.google.com/?q=Tempe+Arizona"
  updatedAt?: string;
}

export interface WeeklyService {
  id: string;
  titleVi: string;
  titleEn: string;
  time: string;
  timeEn?: string;
  descVi: string;
  descEn: string;
}

export interface ChurchInfo {
  sanctuaryName: string;
  address: string;
  googleMapsUrl: string;
  phone: string;
  email: string;
  regionDescVi: string;
  regionDescEn: string;
  services: WeeklyService[];
  updatedAt?: string;
}

export const DEFAULT_CHURCH_INFO: ChurchInfo = {
  sanctuaryName: 'Hội Thánh Phục Hưng Việt Nam • Tempe Sanctuary',
  address: 'Tempe, Arizona',
  googleMapsUrl: 'https://maps.google.com/?q=Tempe+Arizona',
  phone: '(480) 555-0199',
  email: 'contact@vnrevivalchurch.org',
  regionDescVi: 'Phục vụ cộng đồng người Việt tại Tempe, Phoenix, Mesa, Chandler & Gilbert',
  regionDescEn: 'Serving Vietnamese communities across Phoenix East Valley',
  services: [
    {
      id: 'sunday-worship',
      titleVi: 'Lễ Thờ Phượng Chúa Nhật',
      titleEn: 'Sunday Worship Service',
      time: 'Chúa Nhật • 3:00 PM – 5:00 PM',
      timeEn: 'Sunday • 3:00 PM – 5:00 PM',
      descVi: 'Tôn vinh Chúa, cầu nguyện và lắng nghe sứ điệp Lời Chúa gây dựng đức tin, phục hưng đời sống.',
      descEn: 'Bilingual worship, uplifting praise, gospel sermon and warm fellowship refreshments.',
    },
    {
      id: 'friday-youth',
      titleVi: 'Sinh Hoạt Giới Trẻ VRC Youth',
      titleEn: 'VRC Youth & Young Adults',
      time: 'Thứ Sáu • 6:30 PM – 8:30 PM',
      timeEn: 'Friday • 6:30 PM – 8:30 PM',
      descVi: 'Sinh hoạt kết nối thanh thiếu niên, âm nhạc thờ phượng sôi động, thảo luận thực tế và thể thao.',
      descEn: 'Dynamic youth fellowship, contemporary praise, real-life discussion, games and snacks.',
    },
    {
      id: 'wednesday-prayer',
      titleVi: 'Học Kinh Thánh & Cầu Nguyện',
      titleEn: 'Midweek Bible Study & Prayer',
      time: 'Thứ Tư • 7:00 PM – 8:30 PM',
      timeEn: 'Wednesday • 7:00 PM – 8:30 PM',
      descVi: 'Đào sâu Lời Chúa theo từng phân đoạn và cùng hiệp lòng cầu nguyện chữa lành, phục hưng cho hội thánh.',
      descEn: 'In-depth scripture study and united intercessory prayer for revival, families, and healings.',
    },
  ],
};

export const DEFAULT_SPOTLIGHT: SpotlightBannerConfig = {
  mode: 'custom',
  selectedEventId: null,
  isActive: true,
  theme: 'thanksgiving',
  badge: '🍂 Lễ Tạ Ơn & Tri Ân Chúa • Thanksgiving Celebration',
  title: 'Đại Lễ Cảm Tạ Ơn Chúa & Thông Công Hội Thánh',
  subtitle: 'Thi Thiên 100:4 - "Hãy cảm tạ mà vào các cửa Ngài, hãy ngợi khen mà vào các hành lang Ngài!"',
  description: 'Hội Thánh trân trọng kính mời quý tôi con Chúa cùng gia quyến đến hiệp lòng tạ ơn Chúa, chia sẻ bữa tiệc thông công ấm áp và cùng nhau cầu nguyện phục hưng.',
  dateTag: 'Chúa Nhật, 22 Tháng 11 • 3:00 PM – 6:30 PM',
  locationTag: 'Tempe, Arizona • Main Sanctuary',
  customAddress: 'Tempe, Arizona',
  primaryBtnText: 'Xem Sự Kiện • View Events',
  primaryBtnAction: 'events',
  secondaryBtnText: 'Chỉ Đường • Directions',
  secondaryBtnUrl: 'https://maps.google.com/?q=Tempe+Arizona',
};



