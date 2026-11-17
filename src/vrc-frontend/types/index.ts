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
  hasZoom?: boolean;
  maxCapacity?: number | null;
  organizerName?: string | null;
  organizerEmail?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
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
  translationVi?: string | null;
  translationEn?: string | null;
  reflection: string;
  reflectionVi?: string | null;
  reflectionEn?: string | null;
  prayer?: string | null;
  prayerVi?: string | null;
  prayerEn?: string | null;
  theme?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
}

// A verse in the scripture pool (GET /api/verse-pool). The pool is
// the SOURCE the daily verse is picked from — it stores only the
// reference + reflection + prayer (VI + EN), never the verse text.
// The text is fetched from the Bible API when the verse is picked
// and written into a daily_verses row. No foreign key, no join.
export interface PoolVerse {
  id: number;
  reference: string;
  referenceVi?: string | null;
  referenceEn?: string | null;
  reflection?: string | null;
  reflectionVi?: string | null;
  reflectionEn?: string | null;
  prayer?: string | null;
  prayerVi?: string | null;
  prayerEn?: string | null;
  month?: string | null;
  source?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface Video {
  id: number;
  platform: 'youtube' | 'facebook';
  videoUrl: string;
  videoId: string | null;
  // Tall (vertical) Facebook video, picked by the admin when adding
  // the video — the player uses it to pick the frame and modal size.
  // YouTube videos are always wide, so this is false for them.
  isVertical?: boolean;
  // The video category: 'sermon', 'singing', 'reel', 'other', or a
  // custom name the admin typed in the video form. Stored as typed —
  // never validated against a fixed list.
  category: string;
  // Who presents the video — the pastor for a sermon, the choir /
  // singer for a singing. Blank for reels.
  presenter?: string | null;
  titleVi: string;
  titleEn: string;
  descriptionVi?: string | null;
  descriptionEn?: string | null;
  date: string; // YYYY-MM-DD (the video date)
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
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

// A registered church member (view-only app user). The username is the
// phone number; login is by phone number OR email + password. Email is
// optional (contact only) and the phone is verified by SMS.
export interface Member {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  phoneVerified: boolean;
  role: string;
  createdAt?: string;
  lastLoginAt?: string | null;
}

export interface AppNotification {
  id: number;
  title: string;
  body: string;
  type: 'event' | 'verse' | 'announcement';
  targetId?: number | null;
  createdAt: string;
}

export type CustomThemeStyle = 'diagonal' | 'horizontal' | 'vertical' | 'radial' | 'bands';

// A custom banner theme saved by an admin: a name, 1-5 colors, and a
// style that decides how those colors are arranged (gradient direction
// or hard bands). Stored in the spotlight config (church_info/spotlight
// JSONB), so no new table or migration is needed.
export interface CustomTheme {
  id: string;
  name: string;
  colors: string[]; // 1-5 hex colors, e.g. ['#991b1b', '#166534', '#d4af37']
  style: CustomThemeStyle;
  // Optional per-element overrides. When unset (null/undefined), the
  // element uses its derived color from the theme colors: the button
  // is a gradient of the first two colors, the pill is a dark chip
  // with the first color as its text, and the border is the first
  // color. Set one to pick that element's color directly.
  buttonColor?: string | null; // "View Events" button
  badgeColor?: string | null; // the special pill / badge
  borderColor?: string | null; // the banner border + ring
}

export type SpotlightTheme = 'christmas' | 'thanksgiving' | 'easter' | 'revival' | 'special' | 'default' | 'custom';

export interface SpotlightBannerConfig {
  id?: string;
  mode?: 'auto' | 'event' | 'custom'; // 'auto': auto-advance to next upcoming event; 'event': admin pinned event; 'custom': custom banner/holiday preset
  selectedEventId?: number | null; // ID of pinned church event if mode is 'event'
  isActive: boolean; // whether holiday/spotlight mode is active
  theme: SpotlightTheme;
  // Saved custom themes (admin-created). When theme is 'custom',
  // customThemeId names which one is active.
  customThemes?: CustomTheme[];
  customThemeId?: string | null;
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

export interface HeaderVerse {
  verseTextVi: string;
  verseTextEn: string;
  referenceVi: string;
  referenceEn: string;
  translationVi?: string;
  translationEn?: string;
}

export const DEFAULT_HEADER_VERSE: HeaderVerse = {
  verseTextVi: 'Vì Đức Chúa Trời yêu thương thế gian, đến nỗi đã ban Con một của Ngài, hầu cho hễ ai tin Con ấy không bị hư mất mà được sự sống đời đời.',
  verseTextEn: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
  referenceVi: 'Giăng 3:16',
  referenceEn: 'John 3:16',
  translationVi: '1925',
  translationEn: 'NIV',
};

export interface ChurchInfo {
  sanctuaryName: string;
  address: string;
  googleMapsUrl: string;
  phone: string;
  email: string;
  regionDescVi: string;
  regionDescEn: string;
  headerVerse?: HeaderVerse;
  services: WeeklyService[];
  // Church default Zoom meeting (used by the shared Zoom button on
  // events). Optional — older saved church info has neither field.
  // Never rendered anywhere in the app; only the admin edit form
  // shows them so the admin can set them.
  zoomMeetingId?: string;
  zoomPasscode?: string;
  updatedAt?: string;
}

export const DEFAULT_CHURCH_INFO: ChurchInfo = {
  sanctuaryName: 'Hội Thánh Tin Lành Báp-tít Phục Hưng',
  address: '1565 E Warner Rd, Tempe AZ 85284',
  googleMapsUrl: 'https://maps.google.com/?q=1565+E+Warner+Rd,+Tempe+AZ+85284',
  phone: '(480) 555-0199',
  email: 'htph@vrcfamily.org',
  regionDescVi: 'Phục vụ cộng đồng người Việt tại Tempe, Phoenix, Mesa, Chandler & Gilbert',
  regionDescEn: 'Serving Vietnamese communities across Phoenix East Valley',
  headerVerse: DEFAULT_HEADER_VERSE,
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



