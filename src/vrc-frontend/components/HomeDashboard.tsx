import React from 'react';
import { ChurchEvent, DailyVerse, SpotlightBannerConfig, SpotlightTheme, ChurchInfo, DEFAULT_CHURCH_INFO, DEFAULT_SPOTLIGHT } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { CrossIcon } from './CrossIcon.tsx';
import {
  Calendar,
  BookOpen,
  Users,
  Clock,
  MapPin,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Flame,
  Sliders,
  CalendarPlus,
  PenTool,
} from 'lucide-react';
import { getGoogleCalendarUrl } from '../utils/calendar.ts';

interface HomeDashboardProps {
  events: ChurchEvent[];
  todayVerse: DailyVerse | null;
  spotlightConfig?: SpotlightBannerConfig | null;
  churchInfo?: ChurchInfo | null;
  onNavigateTab: (tab: string) => void;
  onOpenAdminPortal?: () => void;
  onOpenSpotlightEditor?: () => void;
  onOpenChurchInfoEditor?: () => void;
  isAdmin: boolean;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  events,
  todayVerse,
  spotlightConfig = DEFAULT_SPOTLIGHT,
  churchInfo = DEFAULT_CHURCH_INFO,
  onNavigateTab,
  onOpenAdminPortal,
  onOpenSpotlightEditor,
  onOpenChurchInfoEditor,
  isAdmin,
}) => {
  const { language, t } = useLanguage();

  const safeConfig = spotlightConfig || DEFAULT_SPOTLIGHT;
  const safeChurch = churchInfo || DEFAULT_CHURCH_INFO;

  // Current date in YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Find upcoming events that are today or future (date >= todayStr)
  const upcomingEvents = events.filter((e) => e.date >= todayStr);
  const nextUpcomingEvent = upcomingEvents.length > 0 ? upcomingEvents[0] : (events.length > 0 ? events[0] : null);

  // 2. Check if a pinned event is chosen by admin
  const pinnedEvent =
    safeConfig.mode === 'event' && safeConfig.selectedEventId
      ? events.find((e) => e.id === safeConfig.selectedEventId)
      : null;

  // Has the pinned event ended? If so, system automatically advances to next upcoming event!
  const isPinnedEnded = pinnedEvent ? pinnedEvent.date < todayStr : true;

  // Active event to display if mode is 'event' and still ongoing, or if mode is 'auto'
  const activeEvent =
    safeConfig.mode === 'event' && pinnedEvent && !isPinnedEnded
      ? pinnedEvent
      : (safeConfig.mode === 'auto' ? nextUpcomingEvent : null);

  // Compute theme background styling for the spotlight / holiday banner
  const getBannerThemeClasses = (theme: SpotlightTheme = 'thanksgiving') => {
    switch (theme) {
      case 'thanksgiving':
        return {
          wrapper: 'bg-gradient-to-br from-amber-950 via-stone-900 to-orange-950 border-amber-700/80 shadow-xl',
          glow1: 'bg-amber-500/30',
          glow2: 'bg-orange-500/20',
          badgeText: 'text-amber-200 border-amber-400/40 bg-amber-950/60',
          btnPrimary: 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-md',
          highlightTag: 'text-amber-300',
        };
      case 'christmas':
        return {
          wrapper: 'bg-gradient-to-br from-red-950 via-stone-900 to-emerald-950 border-red-700/80 shadow-xl',
          glow1: 'bg-red-500/25',
          glow2: 'bg-emerald-500/20',
          badgeText: 'text-amber-200 border-red-400/40 bg-red-950/60',
          btnPrimary: 'bg-amber-400 hover:bg-amber-300 text-stone-950 shadow-md',
          highlightTag: 'text-red-300',
        };
      case 'easter':
        return {
          wrapper: 'bg-gradient-to-br from-purple-950 via-stone-900 to-amber-950 border-purple-700/80 shadow-xl',
          glow1: 'bg-purple-500/25',
          glow2: 'bg-amber-500/20',
          badgeText: 'text-amber-200 border-purple-400/40 bg-purple-950/60',
          btnPrimary: 'bg-amber-400 hover:bg-amber-300 text-stone-950 shadow-md',
          highlightTag: 'text-purple-300',
        };
      case 'revival':
        return {
          wrapper: 'bg-gradient-to-br from-blue-950 via-stone-900 to-rose-950 border-blue-700/80 shadow-xl',
          glow1: 'bg-blue-500/25',
          glow2: 'bg-rose-500/20',
          badgeText: 'text-cyan-200 border-blue-400/40 bg-blue-950/60',
          btnPrimary: 'bg-cyan-400 hover:bg-cyan-300 text-stone-950 shadow-md',
          highlightTag: 'text-cyan-300',
        };
      case 'special':
        return {
          wrapper: 'bg-gradient-to-br from-emerald-950 via-stone-900 to-amber-950 border-emerald-700/80 shadow-xl',
          glow1: 'bg-emerald-500/25',
          glow2: 'bg-amber-500/20',
          badgeText: 'text-emerald-200 border-emerald-400/40 bg-emerald-950/60',
          btnPrimary: 'bg-amber-400 hover:bg-amber-300 text-stone-950 shadow-md',
          highlightTag: 'text-emerald-300',
        };
      default:
        return {
          wrapper: 'bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950 border-stone-800 shadow-lg',
          glow1: 'bg-amber-500/15',
          glow2: 'bg-stone-500/10',
          badgeText: 'text-amber-200 border-white/20 bg-white/10',
          btnPrimary: 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-md',
          highlightTag: 'text-amber-300',
        };
    }
  };

  // Determine active theme: If theme is set to thanksgiving/christmas/easter/revival/special, ALWAYS honor it!
  const currentThemeKey: SpotlightTheme =
    safeConfig.theme && safeConfig.theme !== 'default'
      ? safeConfig.theme
      : (activeEvent?.category.toLowerCase().includes('youth')
          ? 'special'
          : activeEvent?.category.toLowerCase().includes('thanksgiving')
          ? 'thanksgiving'
          : activeEvent?.category.toLowerCase().includes('christmas')
          ? 'christmas'
          : activeEvent?.category.toLowerCase().includes('revival')
          ? 'revival'
          : (safeConfig.theme || 'default'));

  const bannerTheme = getBannerThemeClasses(currentThemeKey);

  // Compute displayed banner content (honoring the admin's saved configuration)
  const isAutoWithoutCustomTitle = safeConfig.mode === 'auto' && !safeConfig.title;

  const displayBadge = !isAutoWithoutCustomTitle && safeConfig.badge
    ? safeConfig.badge
    : (activeEvent
        ? `✨ ${activeEvent.category} • ${activeEvent.date} ${activeEvent.startTime}`
        : 'Tempe, Arizona • Chúa Nhật 3:00 PM');

  const displayTitle = !isAutoWithoutCustomTitle && safeConfig.title
    ? safeConfig.title
    : (activeEvent ? activeEvent.title : 'Hội Thánh Phục Hưng Việt Nam');

  const displaySubtitle = !isAutoWithoutCustomTitle && safeConfig.subtitle
    ? safeConfig.subtitle
    : (activeEvent ? `Sự kiện: ${activeEvent.category} tại ${activeEvent.location}` : undefined);

  const displayDescription = !isAutoWithoutCustomTitle && safeConfig.description
    ? safeConfig.description
    : (activeEvent ? activeEvent.description : t('dashboardSub'));

  const displayDateTag = !isAutoWithoutCustomTitle && safeConfig.dateTag
    ? safeConfig.dateTag
    : (activeEvent ? `${activeEvent.date} • ${activeEvent.startTime}` : 'Chúa Nhật Hàng Tuần • 3:00 PM');

  const displayLocationTag = !isAutoWithoutCustomTitle && safeConfig.locationTag
    ? safeConfig.locationTag
    : (activeEvent ? (activeEvent.location || 'Tempe, Arizona') : (safeChurch.address || 'Tempe, Arizona'));

  const displayAddress = safeConfig.customAddress
    ? safeConfig.customAddress
    : (activeEvent ? (activeEvent.address || activeEvent.location || 'Tempe, Arizona') : (safeChurch.address || 'Tempe, Arizona'));

  const displayDirectionsUrl =
    safeConfig.secondaryBtnUrl ||
    `https://maps.google.com/?q=${encodeURIComponent(displayAddress)}`;

  return (
    <div className="py-4 sm:py-8 px-3.5 sm:px-6 max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Customizable High-Impact Holiday / Featured Hero Card */}
      <div className={`relative overflow-hidden text-white rounded-3xl p-5 sm:p-8 transition-all ${bannerTheme.wrapper}`}>
        {/* Ambient Glows */}
        <div className={`absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 rounded-full blur-3xl pointer-events-none ${bannerTheme.glow1}`} />
        <div className={`absolute bottom-0 left-0 -mb-8 -ml-8 w-44 h-44 rounded-full blur-3xl pointer-events-none ${bannerTheme.glow2}`} />

        <div className="relative z-10 space-y-3.5">
          {/* Top Row: Themed Badge Pill + Admin Customizer Button */}
          <div className="flex items-center justify-between gap-2">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-md border text-[11px] font-medium ${bannerTheme.badgeText}`}>
              <CrossIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>{displayBadge}</span>
            </div>

            {isAdmin && onOpenSpotlightEditor && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onOpenSpotlightEditor();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 active:scale-95 text-white rounded-xl text-xs font-bold border border-white/30 transition-all shadow-xs cursor-pointer z-20"
                title="Tuỳ chỉnh banner trang chủ (Thanksgiving, Christmas, Easter...)"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">{language === 'vi' ? 'Tuỳ Chỉnh Banner' : 'Customize Feature'}</span>
                <span className="sm:hidden">{language === 'vi' ? 'Sửa' : 'Edit'}</span>
              </button>
            )}
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-3xl font-serif font-bold tracking-tight text-white leading-tight">
              {displayTitle}
            </h1>

            {displaySubtitle && (
              <div className="p-2.5 sm:p-3 rounded-2xl bg-black/30 border border-white/10 text-stone-200 text-xs sm:text-sm italic font-serif leading-relaxed max-w-2xl">
                "{displaySubtitle}"
              </div>
            )}

            <p className="text-xs sm:text-sm text-stone-200 font-normal leading-relaxed max-w-xl pt-0.5">
              {displayDescription}
            </p>
          </div>

          {/* Date & Location Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-stone-300">
            {displayDateTag && (
              <span className="inline-flex items-center gap-1.5 bg-black/25 px-3 py-1 rounded-xl border border-white/10">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>{displayDateTag}</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 bg-black/25 px-3 py-1 rounded-xl border border-white/10">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>{displayLocationTag}</span>
            </span>
          </div>

          {/* Action Buttons Row - Bilingual according to selected language */}
          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigateTab('events')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 active:scale-95 text-xs font-bold rounded-xl transition-all shadow-md ${bannerTheme.btnPrimary}`}
            >
              <span>{language === 'vi' ? 'Xem Sự Kiện' : 'View Events'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <a
              href={displayDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-semibold rounded-xl border border-white/25 transition-all shadow-sm"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-300" />
              <span>{language === 'vi' ? 'Chỉ Đường' : 'Directions'}</span>
              <ExternalLink className="w-3 h-3 text-stone-300" />
            </a>
          </div>

        </div>
      </div>

      {/* Quick Navigation Hub Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-serif font-bold text-stone-950 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>{t('quickAccessTitle')}</span>
          </h2>
          <span className="text-[11px] text-stone-400 font-medium">
            {language === 'vi' ? 'Nhấn để điều hướng' : 'Tap to navigate'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
          {/* Card 1: Events */}
          <button
            onClick={() => onNavigateTab('events')}
            className="flex flex-col text-left p-3.5 sm:p-4 rounded-2xl bg-white border border-stone-200/80 shadow-2xs hover:shadow-xs hover:border-amber-200 active:scale-95 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-2.5 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-stone-900 leading-snug">
              {t('navEvents')}
            </span>
            <span className="text-[11px] text-stone-500 mt-0.5 line-clamp-1">
              {events.length} {language === 'vi' ? 'sự kiện sắp tới' : 'upcoming'}
            </span>
          </button>

          {/* Card 2: Scripture */}
          <button
            onClick={() => onNavigateTab('verse')}
            className="flex flex-col text-left p-3.5 sm:p-4 rounded-2xl bg-white border border-stone-200/80 shadow-2xs hover:shadow-xs hover:border-amber-200 active:scale-95 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 mb-2.5 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-stone-900 leading-snug">
              {t('navVerse')}
            </span>
            <span className="text-[11px] text-stone-500 mt-0.5 line-clamp-1">
              {todayVerse?.reference || (language === 'vi' ? 'Hôm nay' : 'Today')}
            </span>
          </button>

          {/* Card 3: Youth */}
          <button
            onClick={() => onNavigateTab('youth')}
            className="flex flex-col text-left p-3.5 sm:p-4 rounded-2xl bg-white border border-stone-200/80 shadow-2xs hover:shadow-xs hover:border-amber-200 active:scale-95 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-2.5 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Flame className="w-4 h-4" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-stone-900 leading-snug">
              {t('navYouth')}
            </span>
            <span className="text-[11px] text-stone-500 mt-0.5 line-clamp-1">
              {language === 'vi' ? 'Thứ Sáu 6:30 PM' : 'Fridays 6:30 PM'}
            </span>
          </button>

          {/* Card 4: Sanctuary & Location */}
          <button
            onClick={() => onNavigateTab('about')}
            className="flex flex-col text-left p-3.5 sm:p-4 rounded-2xl bg-white border border-stone-200/80 shadow-2xs hover:shadow-xs hover:border-amber-200 active:scale-95 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-700 mb-2.5 group-hover:bg-stone-800 group-hover:text-white transition-colors">
              <MapPin className="w-4 h-4" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-stone-900 leading-snug">
              {t('navAbout')}
            </span>
            <span className="text-[11px] text-stone-500 mt-0.5 line-clamp-1">
              {safeChurch.address || 'Tempe, AZ'}
            </span>
          </button>
        </div>
      </section>

      {/* Weekly Worship Schedule & Sanctuary Location (Only displayed if services exist or if admin is logged in) */}
      {safeChurch.services && safeChurch.services.length > 0 ? (
        <section className="bg-white rounded-3xl border border-stone-200/80 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <CrossIcon className="w-4 h-4 text-amber-600" />
                <h2 className="text-base sm:text-lg font-serif font-bold text-stone-950">
                  {t('weeklyScheduleTitle')}
                </h2>
              </div>
              <p className="text-xs text-stone-500">
                {safeChurch.sanctuaryName || (language === 'vi' ? 'Nhà nguyện Hội Thánh tại Tempe, Arizona' : 'Sanctuary Worship in Tempe, Arizona')}
              </p>
            </div>

            {isAdmin && onOpenChurchInfoEditor && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onOpenChurchInfoEditor();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-900 rounded-xl text-xs font-bold border border-amber-200 transition-all shadow-2xs cursor-pointer z-20"
                title="Cập nhật địa chỉ nhà nguyện và giờ thờ phượng"
              >
                <PenTool className="w-3.5 h-3.5 text-amber-700" />
                <span className="hidden sm:inline">{language === 'vi' ? 'Sửa Lịch & Địa Điểm' : 'Edit Schedule & Location'}</span>
                <span className="sm:hidden">{language === 'vi' ? 'Sửa' : 'Edit'}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {safeChurch.services.map((svc, idx) => (
              <div key={svc.id || idx} className="p-3.5 rounded-2xl bg-stone-50/80 border border-stone-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-md">
                    {svc.time.split('•')[0] || svc.titleVi}
                  </span>
                  <span className="text-[11px] font-bold text-stone-800">
                    {svc.time.split('•')[1] || svc.time}
                  </span>
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-stone-900">
                  {language === 'vi' ? svc.titleVi : (svc.titleEn || svc.titleVi)}
                </h3>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  {language === 'vi' ? svc.descVi : (svc.descEn || svc.descVi)}
                </p>
              </div>
            ))}
          </div>

          {/* Location pill */}
          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-stone-600 bg-stone-50 p-3 rounded-2xl border border-stone-100">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-700 flex-shrink-0" />
              <div>
                <span className="font-bold text-stone-900">{safeChurch.address || 'Tempe, Arizona'}</span>
                <span className="text-stone-500"> • {safeChurch.regionDescVi || t('locationRegion')}</span>
              </div>
            </div>
            <a
              href={safeChurch.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(safeChurch.address || 'Tempe Arizona')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:text-amber-900"
            >
              <span>{language === 'vi' ? 'Chỉ Đường' : 'Directions'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </section>
      ) : (
        isAdmin && onOpenChurchInfoEditor ? (
          <section className="bg-stone-50/70 rounded-3xl border border-dashed border-stone-300 p-4 sm:p-5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-stone-600">
              <Clock className="w-4 h-4 text-amber-700" />
              <span>{language === 'vi' ? 'Chưa có lịch nhóm hàng tuần nào.' : 'No weekly services schedule currently set.'}</span>
            </div>
            <button
              type="button"
              onClick={onOpenChurchInfoEditor}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-all active:scale-95 shadow-2xs"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>{language === 'vi' ? 'Thêm Buổi Nhóm' : 'Add Services'}</span>
            </button>
          </section>
        ) : null
      )}


      {/* Featured Upcoming Event Card (if another event exists) */}
      {nextUpcomingEvent && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-serif font-bold text-stone-950 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>{t('todayHighlight')}</span>
            </h2>
            <button
              onClick={() => onNavigateTab('events')}
              className="text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1"
            >
              <span>{t('viewAllEvents')}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200/80 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  {nextUpcomingEvent.category}
                </span>
                <h3 className="text-sm sm:text-base font-serif font-bold text-stone-950">
                  {nextUpcomingEvent.title}
                </h3>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-xs font-bold text-stone-900 block">
                  {nextUpcomingEvent.date}
                </span>
                <span className="text-[11px] text-stone-500">
                  {nextUpcomingEvent.startTime}
                </span>
              </div>
            </div>

            <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
              {nextUpcomingEvent.description}
            </p>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
              <span className="text-[11px] text-stone-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-stone-400" />
                <span>{nextUpcomingEvent.location}</span>
              </span>

              <div className="flex items-center gap-1.5">
                <a
                  href={getGoogleCalendarUrl(nextUpcomingEvent)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-semibold transition-all active:scale-95"
                >
                  <CalendarPlus className="w-3.5 h-3.5 text-amber-700" />
                  <span>{t('addToGoogle')}</span>
                </a>
                <button
                  onClick={() => onNavigateTab('events')}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold transition-all active:scale-95"
                >
                  {language === 'vi' ? 'Xem chi tiết' : 'Details'}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Daily Verse Snippet */}
      {todayVerse && (
        <section className="bg-gradient-to-r from-amber-50/70 via-stone-50 to-amber-50/40 rounded-3xl border border-amber-200/60 p-4 sm:p-5 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <CrossIcon className="w-3 h-3 text-amber-600" />
              <span>{t('heroScripture')}</span>
            </span>
            <span className="text-xs font-bold text-amber-900">
              {todayVerse.reference}
            </span>
          </div>

          <blockquote className="font-serif italic text-xs sm:text-sm text-stone-800 leading-relaxed">
            "{todayVerse.verseText}"
          </blockquote>

          <div className="pt-1 flex items-center justify-between">
            <span className="text-[11px] text-stone-500 font-medium">
              {todayVerse.translation}
            </span>
            <button
              onClick={() => onNavigateTab('verse')}
              className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1"
            >
              <span>{t('readTodayVerse')}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
