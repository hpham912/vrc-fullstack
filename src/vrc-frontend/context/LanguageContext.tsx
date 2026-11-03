import React, { createContext, useContext, useState } from 'react';

export type Language = 'vi' | 'en';

interface Translations {
  [key: string]: {
    vi: string;
    en: string;
  };
}

export const translations: Translations = {
  // Navigation & App Tab Bar
  navHome: { vi: 'Trang Chủ', en: 'Home' },
  navEvents: { vi: 'Sự Kiện', en: 'Events' },
  navVerse: { vi: 'Lời Chúa', en: 'Scripture' },
  navYouth: { vi: 'Giới Trẻ', en: 'Youth' },
  navAbout: { vi: 'Lịch Nhóm', en: 'Schedule' },
  navLocations: { vi: 'Địa Điểm', en: 'Locations' },
  navAdmin: { vi: 'Quản Trị', en: 'Admin' },
  navLogin: { vi: 'Đăng Nhập', en: 'Sign In' },
  navLogout: { vi: 'Đăng Xuất', en: 'Sign Out' },

  // Dashboard / Home
  dashboardGreeting: { vi: 'Xin Chào & Chúc Bình An', en: 'Welcome & Blessings' },
  dashboardSub: { vi: 'Khám phá mọi hoạt động của Hội Thánh Phục Hưng Việt Nam tại Tempe, Arizona.', en: 'Explore everything happening at Vietnamese Revival Church in Tempe, Arizona.' },
  quickAccessTitle: { vi: 'Truy Cập Nhanh', en: 'Quick Access' },
  weeklyScheduleTitle: { vi: 'Lịch Thờ Phượng & Sinh Hoạt', en: 'Weekly Service Schedule' },
  todayHighlight: { vi: 'Nổi Bật Hôm Nay', en: "Today's Highlight" },
  viewAllEvents: { vi: 'Xem Tất Cả Sự Kiện', en: 'View All Events' },
  readTodayVerse: { vi: 'Đọc Lời Chúa Hôm Nay', en: "Read Today's Verse" },
  youthMinistryTitle: { vi: 'Mục Vụ Giới Trẻ', en: 'Youth Ministry' },
  youthMinistryTag: { vi: 'Thế Hệ Phục Hưng • Revival Youth', en: 'Revival Youth Generation' },
  youthVerseText: { vi: 'Chớ để người ta khinh con vì trẻ tuổi; nhưng hãy làm gương cho các tín đồ... (1 Ti-mô-thê 4:12)', en: 'Don’t let anyone look down on you because you are young, but set an example for the believers... (1 Timothy 4:12)' },
  youthWelcome: { vi: 'Chào đón tất cả các bạn trẻ từ 12-30 tuổi đến tham gia ca ngợi, học Lời Chúa, chia sẻ và kết nối bạn bè!', en: 'Welcoming all youth and young adults ages 12–30 for praise, worship, biblical truth, and life connection!' },
  youthNightTitle: { vi: 'Đêm Giới Trẻ Thứ Sáu Hàng Tuần', en: 'Friday Youth Nights' },
  youthNightTime: { vi: '6:30 PM – 9:00 PM', en: '6:30 PM – 9:00 PM' },
  youthNightLoc: { vi: 'Phòng Sinh Hoạt Giới Trẻ • Main Fellowship Hall', en: 'Youth Hall • Main Sanctuary' },
  youthJoinBtn: { vi: 'Tham Gia Cùng Giới Trẻ', en: 'Connect With Youth' },
  viewYouthEvents: { vi: 'Lịch Sinh Hoạt Giới Trẻ', en: 'Youth Calendar' },

  // Hero Section
  heroLocation: { vi: 'Tempe, Arizona • Giờ nhóm: 3:00 PM – 5:00 PM', en: 'Tempe, Arizona • Sunday Worship: 3:00 PM – 5:00 PM' },
  heroSubtitle: {
    vi: 'Cộng đồng Cơ Đốc thờ phượng Chúa, cùng nhau tấn tới trong đức tin và phục vụ tại Tempe, Arizona.',
    en: 'A welcoming community of faith, worshipping God, growing together in Scripture, and serving in Tempe, Arizona.',
  },
  heroUpcoming: { vi: 'Lịch Sinh Hoạt', en: 'Upcoming Events' },
  heroScripture: { vi: 'Lời Chúa Hôm Nay', en: "Today's Verse" },
  heroSchedule: { vi: 'Giờ Thờ Phượng', en: 'Service Times' },
  heroAddEvent: { vi: 'Thêm Sự Kiện', en: 'Add Event' },

  // Events & Categories
  eventsTitle: { vi: 'Lịch Sinh Hoạt & Thờ Phượng', en: 'Upcoming Gatherings' },
  eventsSubtitle: {
    vi: 'Kính mời quý vị cùng tham dự các buổi thờ phượng và thông công tại Tempe, Arizona.',
    en: 'Join our church family in Tempe, Arizona for worship services, bible studies, and fellowship.',
  },
  catAll: { vi: 'Tất Cả', en: 'All' },
  catWorship: { vi: 'Thờ Phượng', en: 'Worship' },
  catBibleStudy: { vi: 'Kinh Thánh', en: 'Bible Study' },
  catYouth: { vi: 'Giới Trẻ', en: 'Youth' },
  catPrayer: { vi: 'Cầu Nguyện', en: 'Prayer' },
  catFellowship: { vi: 'Thông Công', en: 'Fellowship' },
  catSpecial: { vi: 'Đặc Biệt', en: 'Special' },
  searchPlaceholder: { vi: 'Tìm kiếm sự kiện...', en: 'Search events...' },
  noEvents: { vi: 'Chưa có sự kiện nào', en: 'No scheduled events found' },
  noEventsSub: { vi: 'Vui lòng kiểm tra lại sau hoặc điều chỉnh bộ lọc.', en: 'Check back soon or adjust your search filter.' },
  addToGoogle: { vi: 'Google Calendar', en: 'Google Calendar' },
  addToApple: { vi: 'Apple Calendar', en: 'Apple Calendar' },
  contactLead: { vi: 'Liên hệ', en: 'Contact' },
  featuredBadge: { vi: 'Nổi bật', en: 'Featured' },

  // Daily Verse Section
  verseTag: { vi: 'Lời Chúa Mỗi Ngày • Daily Bread', en: 'Daily Scripture & Devotional' },
  verseTitle: { vi: 'Suy Gẫm Lời Chúa', en: 'Scripture of the Day' },
  listenAudio: { vi: 'Nghe Đọc', en: 'Listen' },
  pauseAudio: { vi: 'Tạm Dừng', en: 'Pause' },
  copyVerse: { vi: 'Sao Chép', en: 'Copy' },
  copied: { vi: 'Đã Sao Chép!', en: 'Copied!' },
  shareVerse: { vi: 'Chia Sẻ', en: 'Share' },
  editVerseBtn: { vi: 'Sửa Lời Chúa', en: 'Edit Verse' },
  reflectionTitle: { vi: 'Suy Gẫm Mục Vụ', en: 'Pastoral Reflection' },
  prayerTitle: { vi: 'Lời Cầu Nguyện Hôm Nay', en: "Today's Prayer" },
  browseArchive: { vi: 'Xem Các Ngày Trước', en: 'Browse Past Verses' },
  loadingScripture: { vi: 'Đang tải Lời Chúa...', en: 'Loading scripture...' },

  // Service Times Section
  serviceTag: { vi: 'Lịch Nhóm & Địa Điểm • Service Schedule', en: 'Service Times & Location' },
  serviceTitle: { vi: 'Thời Gian & Nơi Nhóm', en: 'Weekly Worship Times' },
  serviceSubtitle: {
    vi: 'Hội Thánh Phục Hưng Việt Nam trân trọng chào đón quý vị và gia quyến đến thờ phượng Chúa tại Tempe, Arizona.',
    en: 'Vietnamese Revival Church warmly welcomes you and your family to worship with us in Tempe, Arizona.',
  },
  sundayWorshipTitle: { vi: 'Lễ Thờ Phượng Chúa Nhật', en: 'Sunday Worship Celebration' },
  sundayWorshipTime: { vi: '3:00 PM – 5:00 PM', en: '3:00 PM – 5:00 PM' },
  sundayWorshipDesc: { vi: 'Ca ngợi, thờ phượng, giảng Lời Chúa và lớp thiếu nhi.', en: 'Praise, sermon message, and youth Sunday school.' },
  fridayYouthTitle: { vi: 'Sinh Hoạt Giới Trẻ', en: 'Friday Youth Fellowship' },
  fridayYouthTime: { vi: '6:30 PM – 9:00 PM', en: '6:30 PM – 9:00 PM' },
  fridayYouthDesc: { vi: 'Giao lưu, ca ngợi và thông công tuổi trẻ.', en: 'Youth & young adults gathering and fellowship.' },
  wedStudyTitle: { vi: 'Học Kinh Thánh & Cầu Nguyện', en: 'Wednesday Bible Study' },
  wedStudyTime: { vi: '7:30 PM – 9:00 PM', en: '7:30 PM – 9:00 PM' },
  wedStudyDesc: { vi: 'Học Kinh Thánh từng câu và cầu nguyện phục hưng.', en: 'Verse-by-verse scripture study & prayer.' },
  locationCardTitle: { vi: 'Nơi Nhóm Thờ Phượng', en: 'Sanctuary Location' },
  locationCity: { vi: 'Tempe, Arizona', en: 'Tempe, Arizona' },
  locationRegion: { vi: 'Khu vực Greater Phoenix & East Valley, Arizona', en: 'Serving the Greater Phoenix & East Valley Community' },
  directionsBtn: { vi: 'Chỉ Đường Google Maps', en: 'Directions to Tempe, AZ' },

  // Admin Login Modal
  loginTitle: { vi: 'Đăng Nhập Quản Trị', en: 'Admin Sign In' },
  loginSub: { vi: 'Nhập tên đăng nhập và mật khẩu quản trị', en: 'Enter your administrator credentials' },
  usernameLabel: { vi: 'Tên Đăng Nhập', en: 'Username' },
  passwordLabel: { vi: 'Mật Khẩu', en: 'Password' },
  loginBtn: { vi: 'Đăng Nhập', en: 'Sign In' },
  loginSuccess: { vi: 'Đăng nhập thành công!', en: 'Logged in successfully!' },

  // Admin Portal Tabs
  adminDashboardTitle: { vi: 'Bảng Điều Khiển Quản Trị', en: 'Admin Dashboard' },
  tabAddEvent: { vi: 'Thêm Sự Kiện', en: 'Add Event' },
  tabManageEvents: { vi: 'Quản Lý Sự Kiện', en: 'Manage Events' },
  tabVerses: { vi: 'Lời Chúa', en: 'Daily Verses' },
  tabAdminAccounts: { vi: 'Tài Khoản Quản Trị', en: 'Admin Accounts' },
  tabNotices: { vi: 'Thông Báo', en: 'Notices' },

  // Admin Accounts Management
  newAdminTitle: { vi: 'Tạo Tài Khoản Quản Trị Mới', en: 'Create New Admin Account' },
  newAdminDesc: { vi: 'Chỉ quản trị viên mới có thể tạo thêm tài khoản quản trị mới.', en: 'Only existing administrators can provision new admin access.' },
  displayNameLabel: { vi: 'Tên Hiển Thị (Họ & Tên)', en: 'Display Name (Full Name)' },
  emailLabel: { vi: 'Địa Chỉ Email', en: 'Email Address' },
  createAdminBtn: { vi: 'Tạo Tài Khoản Quản Trị', en: 'Create Admin Account' },
  existingAdminsTitle: { vi: 'Danh Sách Quản Trị Viên', en: 'Current Administrators' },
  cannotDeleteSelf: { vi: 'Bạn không thể xóa tài khoản của chính mình', en: 'You cannot delete your own account' },
  deleteAdminBtn: { vi: 'Xóa Quản Trị', en: 'Delete Admin' },
  changePasswordTitle: { vi: 'Đổi Mật Khẩu', en: 'Change Password' },
  oldPasswordLabel: { vi: 'Mật Khẩu Hiện Tại', en: 'Current Password' },
  newPasswordLabel: { vi: 'Mật Khẩu Mới', en: 'New Password' },
  updatePasswordBtn: { vi: 'Cập Nhật Mật Khẩu', en: 'Update Password' },

  // Footer
  footerRights: { vi: 'Bảo lưu mọi quyền.', en: 'All rights reserved.' },
  footerPlatform: { vi: 'Lưu trữ đám mây Cloud SQL PostgreSQL • Google Cloud Run', en: 'Reliable Cloud Storage • iOS Ready' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'vi',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('vrc_church_lang');
    return (saved === 'en' || saved === 'vi') ? saved : 'vi';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('vrc_church_lang', lang);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'vi' : 'en');
  };

  const t = (key: string): string => {
    if (translations[key]) {
      return translations[key][language] || translations[key].en;
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
