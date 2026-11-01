import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'vi' | 'en';

interface Translations {
  [key: string]: {
    vi: string;
    en: string;
  };
}

export const translations: Translations = {
  // Navigation
  navEvents: { vi: 'Lịch Sinh Hoạt', en: 'Events Calendar' },
  navVerse: { vi: 'Lời Chúa Mỗi Ngày', en: 'Daily Scripture' },
  navAbout: { vi: 'Giờ Nhóm & Địa Điểm', en: 'Service & Location' },
  navAdmin: { vi: 'Quản Trị', en: 'Admin Portal' },
  navLogin: { vi: 'Đăng Nhập Quản Trị', en: 'Admin Login' },
  navLogout: { vi: 'Đăng Xuất', en: 'Sign Out' },

  // Hero Section
  heroSubtitle: {
    vi: 'Cộng đồng đức tin Cơ Đốc, cùng thờ phượng Chúa, tăng trưởng trong Lời Ngài và phục vụ tha nhân.',
    en: 'A welcoming community of faith, worshipping God, growing together in Scripture, and serving our community.',
  },
  heroUpcoming: { vi: 'Lịch Thờ Phượng & Sự Kiện', en: 'Upcoming Events' },
  heroScripture: { vi: 'Lời Chúa Hôm Nay', en: 'Today’s Scripture' },
  heroSchedule: { vi: 'Lịch Nhóm Chủ Nhật', en: 'Sunday Service Times' },
  heroAddEvent: { vi: 'Thêm Sự Kiện', en: 'Add Event' },

  // Events Section
  eventsTitle: { vi: 'Lịch Sinh Hoạt & Thờ Phượng', en: 'Upcoming Events & Gatherings' },
  eventsSubtitle: {
    vi: 'Kính mời quý con cái Chúa và thân hữu cùng tham dự các buổi thờ phượng và sinh hoạt tại Tempe, Arizona.',
    en: 'Join our church family in Tempe, Arizona for worship services, bible studies, and fellowship.',
  },
  catAll: { vi: 'Tất Cả', en: 'All Events' },
  catWorship: { vi: 'Thờ Phượng (Worship)', en: 'Worship Service' },
  catBibleStudy: { vi: 'Học Kinh Thánh', en: 'Bible Study' },
  catYouth: { vi: 'Giới Trẻ (Youth)', en: 'Youth Fellowship' },
  catSpecial: { vi: 'Sự Kiện Đặc Biệt', en: 'Special Gatherings' },
  searchPlaceholder: { vi: 'Tìm kiếm sự kiện...', en: 'Search events...' },
  noEvents: { vi: 'Hiện chưa có lịch sự kiện nào', en: 'No scheduled events found' },
  noEventsSub: { vi: 'Xin vui lòng kiểm tra lại sau hoặc điều chỉnh bộ lọc.', en: 'Check back soon or adjust your search filter.' },
  addToGoogle: { vi: 'Google Calendar', en: 'Google Calendar' },
  addToApple: { vi: 'iCal / Apple', en: 'iCal / Apple' },
  contactLead: { vi: 'Liên hệ', en: 'Contact' },
  featuredBadge: { vi: 'Nổi bật', en: 'Featured' },

  // Daily Verse Section
  verseTag: { vi: 'Lời Chúa Mỗi Ngày • Daily Bread', en: 'Daily Scripture & Devotional' },
  verseTitle: { vi: 'Suy Gẫm Lời Chúa', en: 'Scripture & Devotional' },
  listenAudio: { vi: 'Nghe Đọc', en: 'Listen' },
  pauseAudio: { vi: 'Tạm Dừng', en: 'Pause' },
  copyVerse: { vi: 'Sao Chép', en: 'Copy' },
  copied: { vi: 'Đã Sao Chép!', en: 'Copied!' },
  shareVerse: { vi: 'Chia Sẻ', en: 'Share' },
  editVerseBtn: { vi: 'Sửa Lời Chúa', en: 'Edit Verse' },
  reflectionTitle: { vi: 'Suy Gẫm Mục Vụ', en: 'Pastoral Reflection' },
  prayerTitle: { vi: 'Lời Cầu Nguyện Hôm Nay', en: "Today's Prayer" },
  browseArchive: { vi: 'Xem Lịch Sử Các Câu Lời Chúa Trước Đây', en: 'Browse Past Scripture Readings' },
  loadingScripture: { vi: 'Đang tải Lời Chúa...', en: 'Loading scripture...' },

  // Service Times Section
  serviceTag: { vi: 'Lịch Nhóm & Địa Điểm • Join Us', en: 'Service Times & Location' },
  serviceTitle: { vi: 'Thời Gian & Nơi Thờ Phượng', en: 'Service Times & Location' },
  serviceSubtitle: {
    vi: 'Hội Thánh Phục Hưng Việt Nam trân trọng chào đón quý vị và gia quyến đến thờ phượng Chúa.',
    en: 'We warmly welcome you and your family to worship with us this week.',
  },
  sundayWorshipTitle: { vi: 'Lễ Thờ Phượng Chúa Nhật', en: 'Sunday Celebration Service' },
  sundayWorshipTime: { vi: '3:00 PM – 5:00 PM', en: '3:00 PM – 5:00 PM' },
  sundayWorshipDesc: { vi: 'Ca ngợi, thờ phượng, giảng Lời Chúa và lớp thiếu nhi.', en: 'Worship, preaching, and youth Sunday school.' },
  fridayYouthTitle: { vi: 'Sinh Hoạt Giới Trẻ Thứ Sáu', en: 'Friday Youth Fellowship' },
  fridayYouthTime: { vi: '6:30 PM – 9:00 PM', en: '6:30 PM – 9:00 PM' },
  fridayYouthDesc: { vi: 'Giao lưu, ca ngợi và thông công tuổi trẻ.', en: 'Youth & young adults gathering and fellowship.' },
  wedStudyTitle: { vi: 'Học Kinh Thánh Tối Thứ Tư', en: 'Wednesday Bible Study' },
  wedStudyTime: { vi: '7:30 PM – 9:00 PM', en: '7:30 PM – 9:00 PM' },
  wedStudyDesc: { vi: 'Học Kinh Thánh từng câu và cầu nguyện đặc biệt.', en: 'Verse-by-verse scripture study & prayer.' },
  locationCardTitle: { vi: 'Nơi Nhóm Thờ Phượng', en: 'Sanctuary Location' },
  locationCity: { vi: 'Tempe, Arizona', en: 'Tempe, Arizona' },
  locationRegion: { vi: 'Khu vực Greater Phoenix & East Valley, Arizona', en: 'Serving the Greater Phoenix & East Valley Community' },
  directionsBtn: { vi: 'Chỉ Đường Google Maps', en: 'Directions to Tempe, AZ' },

  // Admin Login Modal
  loginTitle: { vi: 'Đăng Nhập Quản Trị Viên', en: 'Church Admin Login' },
  loginSub: { vi: 'Nhập tên đăng nhập và mật khẩu quản trị', en: 'Enter your administrator credentials' },
  usernameLabel: { vi: 'Tên Đăng Nhập', en: 'Username' },
  passwordLabel: { vi: 'Mật Khẩu', en: 'Password' },
  loginBtn: { vi: 'Đăng Nhập', en: 'Sign In' },
  loginSuccess: { vi: 'Đăng nhập thành công!', en: 'Logged in successfully!' },

  // Admin Portal Tabs
  adminDashboardTitle: { vi: 'Bảng Điều Khiển Quản Trị', en: 'Church Administrator Portal' },
  tabAddEvent: { vi: 'Thêm Sự Kiện', en: 'Add Event' },
  tabManageEvents: { vi: 'Quản Lý Sự Kiện', en: 'Manage Events' },
  tabVerses: { vi: 'Lời Chúa Hằng Ngày', en: 'Daily Scripture' },
  tabAdminAccounts: { vi: 'Tài Khoản Quản Trị', en: 'Admin Accounts' },
  tabNotices: { vi: 'Thông Báo', en: 'Notices' },

  // Admin Accounts Management
  newAdminTitle: { vi: 'Tạo Tài Khoản Quản Trị Mới', en: 'Create New Admin Account' },
  newAdminDesc: { vi: 'Chỉ quản trị viên hiện tại mới có thể tạo thêm tài khoản quản trị mới.', en: 'Only existing administrators can provision new admin access.' },
  displayNameLabel: { vi: 'Tên Hiển Thị (Họ & Tên)', en: 'Display Name (Full Name)' },
  emailLabel: { vi: 'Địa Chỉ Email', en: 'Email Address' },
  createAdminBtn: { vi: 'Tạo Tài Khoản Quản Trị', en: 'Create Admin Account' },
  existingAdminsTitle: { vi: 'Danh Sách Quản Trị Viên Hiện Tại', en: 'Current Administrator Accounts' },
  cannotDeleteSelf: { vi: 'Bạn không thể xóa tài khoản của chính mình', en: 'You cannot delete your own account' },
  deleteAdminBtn: { vi: 'Xóa Quản Trị', en: 'Delete Admin' },
  changePasswordTitle: { vi: 'Đổi Mật Khẩu', en: 'Change Password' },
  oldPasswordLabel: { vi: 'Mật Khẩu Hiện Tại', en: 'Current Password' },
  newPasswordLabel: { vi: 'Mật Khẩu Mới', en: 'New Password' },
  updatePasswordBtn: { vi: 'Cập Nhật Mật Khẩu', en: 'Update Password' },

  // Footer
  footerRights: { vi: 'Bảo lưu mọi quyền.', en: 'All rights reserved.' },
  footerPlatform: { vi: 'Lưu trữ đám mây Cloud SQL PostgreSQL • Google Cloud Run', en: 'Reliable PostgreSQL Storage • Google Cloud Run' },
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
    setLanguage(language === 'vi' ? 'en' : 'vi');
  };

  const t = (key: string): string => {
    if (translations[key]) {
      return translations[key][language] || translations[key].vi;
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
