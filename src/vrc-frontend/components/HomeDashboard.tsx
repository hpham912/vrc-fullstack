import React from 'react';
import { ChurchEvent, DailyVerse, SpotlightBannerConfig, SpotlightTheme, ChurchInfo, DEFAULT_CHURCH_INFO, DEFAULT_SPOTLIGHT } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAutoTranslate } from '../hooks/useAutoTranslate.ts';
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
  Compass,
  Navigation,
  PenTool,
} from 'lucide-react';
import { getGoogleCalendarUrl } from '../utils/calendar.ts';
import { DirectionsModal } from './DirectionsModal.tsx';
import { getGoogleMapsDirectionsUrl, getAppleMapsDirectionsUrl } from '../utils/directions.ts';

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

  // Directions routing modal state
  const [directionsModalOpen, setDirectionsModalOpen] = React.useState(false);
  const [directionsTarget, setDirectionsTarget] = React.useState({ name: '', address: '' });

  // Current date in YYYY-MM-DD
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // 1. Find upcoming events that are today or future (date >= todayStr), sorted chronologically
  const upcomingEvents = [...events]
    .filter((e) => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  const nextUpcomingEvent = upcomingEvents.length > 0 ? upcomingEvents[0] : null;

  // 2. Check if a pinned event is chosen by admin
  const isAutoMode = safeConfig.mode === 'auto' || !safeConfig.selectedEventId;
  const pinnedEvent =
    !isAutoMode && safeConfig.selectedEventId
      ? events.find((e) => e.id === safeConfig.selectedEventId)
      : null;

  // Has the pinned event ended? If so, system automatically advances to next upcoming event!
  const isPinnedEnded = pinnedEvent ? pinnedEvent.date < todayStr : true;

  // Active event to display: if mode is 'event' and still ongoing, use pinnedEvent; otherwise dynamically use nextUpcomingEvent!
  const activeEvent = (!isAutoMode && pinnedEvent && !isPinnedEnded) ? pinnedEvent : nextUpcomingEvent;

  // Helper function to format service day & hours bilingually
  const getServiceTimeParts = (svc: { time: string; timeEn?: string; titleVi: string; titleEn?: string }, lang: 'vi' | 'en') => {
    let rawTime = (lang === 'en' && svc.timeEn?.trim()) ? svc.timeEn : svc.time;
    if (!rawTime) return { dayPart: '', hourPart: '' };

    let dayPart = '';
    let hourPart = '';

    if (rawTime.includes('•')) {
      const parts = rawTime.split('•');
      dayPart = (parts[0] || '').trim();
      hourPart = (parts.slice(1).join('•') || '').trim();
    } else if (rawTime.includes(' - ') && (rawTime.includes('AM') || rawTime.includes('PM'))) {
      // Split on day vs time range
      const match = rawTime.match(/^([^\d]+)([\d\s:–\-APMapm]+)$/);
      if (match) {
        dayPart = match[1].trim();
        hourPart = match[2].trim();
      } else {
        dayPart = rawTime.trim();
        hourPart = '';
      }
    } else {
      dayPart = rawTime.trim();
      hourPart = '';
    }

    if (lang === 'en') {
      const dayLower = dayPart.toLowerCase();
      if (dayLower.includes('chúa nhật') || dayLower.includes('chua nhat') || dayLower.includes('cn')) {
        dayPart = 'Sunday';
      } else if (dayLower.includes('thứ sáu') || dayLower.includes('thu sau') || dayLower.includes('thứ 6') || dayLower.includes('thu 6') || dayLower.includes('friday')) {
        dayPart = 'Friday';
      } else if (dayLower.includes('thứ tư') || dayLower.includes('thu tu') || dayLower.includes('thứ 4') || dayLower.includes('thu 4') || dayLower.includes('wednesday')) {
        dayPart = 'Wednesday';
      } else if (dayLower.includes('thứ hai') || dayLower.includes('thu hai') || dayLower.includes('thứ 2') || dayLower.includes('thu 2') || dayLower.includes('monday')) {
        dayPart = 'Monday';
      } else if (dayLower.includes('thứ ba') || dayLower.includes('thu ba') || dayLower.includes('thứ 3') || dayLower.includes('thu 3') || dayLower.includes('tuesday')) {
        dayPart = 'Tuesday';
      } else if (dayLower.includes('thứ năm') || dayLower.includes('thu nam') || dayLower.includes('thứ 5') || dayLower.includes('thu 5') || dayLower.includes('thursday')) {
        dayPart = 'Thursday';
      } else if (dayLower.includes('thứ bảy') || dayLower.includes('thu bay') || dayLower.includes('thứ 7') || dayLower.includes('thu 7') || dayLower.includes('saturday')) {
        dayPart = 'Saturday';
      }
    } else {
      const dayLower = dayPart.toLowerCase();
      if (dayLower.includes('sunday')) dayPart = 'Chúa Nhật';
      else if (dayLower.includes('friday')) dayPart = 'Thứ Sáu';
      else if (dayLower.includes('wednesday')) dayPart = 'Thứ Tư';
      else if (dayLower.includes('monday')) dayPart = 'Thứ Hai';
      else if (dayLower.includes('tuesday')) dayPart = 'Thứ Ba';
      else if (dayLower.includes('thursday')) dayPart = 'Thứ Năm';
      else if (dayLower.includes('saturday')) dayPart = 'Thứ Bảy';
    }

    return {
      dayPart: dayPart || (lang === 'vi' ? svc.titleVi : (svc.titleEn || svc.titleVi)),
      hourPart: hourPart || rawTime,
    };
  };

  // Compute theme background styling and iconic motifs for the spotlight / holiday banner
  const getBannerThemeClasses = (theme: SpotlightTheme = 'thanksgiving') => {
    switch (theme) {
      case 'thanksgiving':
        return {
          wrapper: 'bg-gradient-to-br from-[#2a1306] via-[#1c120c] to-[#3a1a08] border-amber-500/70 shadow-2xl ring-1 ring-amber-400/20',
          glow1: 'bg-amber-500/35',
          glow2: 'bg-orange-500/25',
          badgeText: 'text-amber-200 border-amber-400/50 bg-amber-950/70',
          btnPrimary: 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-bold shadow-lg shadow-amber-500/20',
          highlightTag: 'text-amber-300',
        };
      case 'christmas':
        return {
          wrapper: 'bg-gradient-to-br from-[#2b080c] via-[#0e1d14] to-[#1a0a10] border-emerald-500/80 shadow-2xl ring-1 ring-red-400/40 shadow-[0_0_40px_rgba(220,38,38,0.2)]',
          glow1: 'bg-red-600/30',
          glow2: 'bg-emerald-600/30',
          badgeText: 'text-amber-200 border-amber-300/50 bg-red-950/75',
          btnPrimary: 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-stone-950 font-bold shadow-lg shadow-amber-400/25',
          highlightTag: 'text-red-300',
        };
      case 'easter':
        return {
          wrapper: 'bg-gradient-to-br from-[#200d33] via-[#181124] to-[#2c131a] border-purple-500/70 shadow-2xl ring-1 ring-amber-400/25',
          glow1: 'bg-purple-500/30',
          glow2: 'bg-amber-500/25',
          badgeText: 'text-amber-200 border-purple-400/50 bg-purple-950/70',
          btnPrimary: 'bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-stone-950 font-bold shadow-lg shadow-amber-400/20',
          highlightTag: 'text-purple-300',
        };
      case 'revival':
        return {
          wrapper: 'bg-gradient-to-br from-[#0c1833] via-[#131124] to-[#360e15] border-cyan-400/70 shadow-2xl ring-1 ring-rose-400/30',
          glow1: 'bg-cyan-500/30',
          glow2: 'bg-rose-500/30',
          badgeText: 'text-cyan-200 border-cyan-400/50 bg-blue-950/70',
          btnPrimary: 'bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 text-stone-950 font-bold shadow-lg shadow-cyan-400/20',
          highlightTag: 'text-cyan-300',
        };
      case 'special':
        return {
          wrapper: 'bg-gradient-to-br from-[#092b23] via-[#101e2b] to-[#2a0e36] border-teal-400/70 shadow-2xl ring-1 ring-teal-400/25',
          glow1: 'bg-teal-500/35',
          glow2: 'bg-purple-500/30',
          badgeText: 'text-teal-200 border-teal-400/50 bg-teal-950/70',
          btnPrimary: 'bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-stone-950 font-bold shadow-lg shadow-teal-400/20',
          highlightTag: 'text-teal-300',
        };
      default:
        return {
          wrapper: 'bg-gradient-to-br from-[#1c1917] via-[#141210] to-[#241a12] border-stone-700/80 shadow-xl ring-1 ring-amber-500/10',
          glow1: 'bg-amber-500/20',
          glow2: 'bg-stone-500/15',
          badgeText: 'text-amber-200 border-white/20 bg-white/10',
          btnPrimary: 'bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold shadow-md shadow-amber-500/20',
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

  // Default Church Address and Maps URL set in Schedule
  const defaultChurchAddress = (safeChurch.address || 'Tempe, Arizona').trim();
  const defaultChurchMapsUrl = safeChurch.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(defaultChurchAddress)}`;

  // Check if active event specifies a custom address different from church schedule address
  const activeEventAddress = (activeEvent?.address || '').trim();
  const hasCustomEventAddress =
    Boolean(activeEventAddress) &&
    activeEventAddress.toLowerCase() !== defaultChurchAddress.toLowerCase();

  const displayAddress = hasCustomEventAddress
    ? activeEventAddress
    : defaultChurchAddress;

  // Directions button: fallback to church address set in Schedule unless event sets a custom different address
  const displayDirectionsUrl = hasCustomEventAddress
    ? `https://maps.google.com/?q=${encodeURIComponent(activeEventAddress)}`
    : defaultChurchMapsUrl;

  // Compute displayed banner content (auto mode always dynamically derives from next upcoming event)
  const displayBadge = safeConfig.badge?.trim()
    ? safeConfig.badge.trim()
    : (activeEvent
        ? `${activeEvent.category} • ${activeEvent.date}`
        : (language === 'vi' ? 'Sự Kiện Nổi Bật' : 'Featured Event'));

  const displayTitle = isAutoMode
    ? (activeEvent ? activeEvent.title : 'Hội Thánh Phục Hưng Việt Nam')
    : (activeEvent ? activeEvent.title : (safeConfig.title || 'Hội Thánh Phục Hưng Việt Nam'));

  const displaySubtitle = safeConfig.subtitle?.trim()
    ? safeConfig.subtitle.trim()
    : (activeEvent ? `Sự kiện: ${activeEvent.category} tại ${activeEvent.location}` : undefined);

  const displayDescription = isAutoMode
    ? (activeEvent ? activeEvent.description : (safeConfig.description || t('dashboardSub')))
    : (activeEvent ? activeEvent.description : (safeConfig.description || t('dashboardSub')));

  const displayDateTag = isAutoMode
    ? (activeEvent ? `${activeEvent.date} • ${activeEvent.startTime}` : 'Chúa Nhật Hàng Tuần • 3:00 PM')
    : (activeEvent ? `${activeEvent.date} • ${activeEvent.startTime}` : (safeConfig.dateTag || 'Chúa Nhật Hàng Tuần • 3:00 PM'));

  const displayLocationTag = isAutoMode
    ? (activeEvent ? (activeEvent.location || displayAddress) : displayAddress)
    : (activeEvent ? (activeEvent.location || displayAddress) : (safeConfig.locationTag || displayAddress));

  const { tr } = useAutoTranslate(
    [
      displayBadge,
      displayTitle,
      displaySubtitle,
      displayDescription,
      displayLocationTag,
      todayVerse?.verseText,
      todayVerse?.reference,
    ],
    language
  );

  return (
    <div className="py-4 sm:py-8 px-3.5 sm:px-6 max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Customizable High-Impact Holiday / Featured Hero Card */}
      <div className={`relative overflow-hidden text-white rounded-3xl p-5 sm:p-8 transition-all ${bannerTheme.wrapper}`}>
        {/* Ambient Glows */}
        <div className={`absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full blur-3xl pointer-events-none ${bannerTheme.glow1}`} />
        <div className={`absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 rounded-full blur-3xl pointer-events-none ${bannerTheme.glow2}`} />

        <div className="relative z-10 space-y-3.5">
          {/* Top Row: Clean Themed Badge Pill + Admin Customizer Button */}
          <div className="flex items-center justify-between gap-2">
            <div className={`inline-flex items-center px-3 py-1 rounded-full backdrop-blur-md border text-[11px] font-semibold max-w-[calc(100%-80px)] sm:max-w-none truncate ${bannerTheme.badgeText}`}>
              <span className="truncate">{language === 'vi' ? (spotlightConfig?.badgeVi || tr(displayBadge)) : (spotlightConfig?.badgeEn || tr(displayBadge))}</span>
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
              {language === 'vi' ? (activeEvent?.titleVi || spotlightConfig?.titleVi || tr(displayTitle)) : (activeEvent?.titleEn || spotlightConfig?.titleEn || tr(displayTitle))}
            </h1>

            {displaySubtitle && (
              <div className="p-2.5 sm:p-3 rounded-2xl bg-black/30 border border-white/10 text-stone-200 text-xs sm:text-sm italic font-serif leading-relaxed max-w-2xl">
                "{language === 'vi' ? (spotlightConfig?.subtitleVi || tr(displaySubtitle)) : (spotlightConfig?.subtitleEn || tr(displaySubtitle))}"
              </div>
            )}

            <p className="text-xs sm:text-sm text-stone-200 font-normal leading-relaxed max-w-xl pt-0.5">
              {language === 'vi' ? (activeEvent?.descriptionVi || spotlightConfig?.descriptionVi || tr(displayDescription)) : (activeEvent?.descriptionEn || spotlightConfig?.descriptionEn || tr(displayDescription))}
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
              <span>{language === 'vi' ? (activeEvent?.locationVi || spotlightConfig?.locationTagVi || tr(displayLocationTag)) : (activeEvent?.locationEn || spotlightConfig?.locationTagEn || tr(displayLocationTag))}</span>
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
            <button
              type="button"
              onClick={() => {
                setDirectionsTarget({
                  name: displayTitle,
                  address: displayAddress,
                });
                setDirectionsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-semibold rounded-xl border border-white/25 transition-all shadow-sm cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5 text-amber-300" />
              <span>{language === 'vi' ? 'Chỉ Đường' : 'Directions'}</span>
              <Compass className="w-3 h-3 text-stone-300" />
            </button>
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
            {safeChurch.services.map((svc, idx) => {
              const { dayPart, hourPart } = getServiceTimeParts(svc, language);
              const cardColors = [
                'bg-gradient-to-br from-amber-50/90 via-white to-orange-50/50 border-amber-200/90',
                'bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/50 border-emerald-200/90',
                'bg-gradient-to-br from-indigo-50/90 via-white to-violet-50/50 border-indigo-200/90',
              ][idx % 3];
              return (
                <div key={svc.id || idx} className={`p-3.5 rounded-2xl border space-y-1.5 shadow-2xs ${cardColors}`}>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-md">
                      {dayPart}
                    </span>
                    <span className="text-[11px] font-bold text-stone-800 text-right">
                      {hourPart}
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-stone-900">
                    {language === 'vi' ? svc.titleVi : (svc.titleEn || svc.titleVi)}
                  </h3>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    {language === 'vi' ? svc.descVi : (svc.descEn || svc.descVi)}
                  </p>
                </div>
              );
            })}
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
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <a
                href={getGoogleMapsDirectionsUrl(safeChurch.address || 'Tempe, Arizona')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 active:scale-95 text-white font-semibold text-xs shadow-2xs transition-all"
                title={language === 'vi' ? 'Chỉ đường Google Maps từ vị trí hiện tại' : 'Turn-by-turn in Google Maps'}
              >
                <Compass className="w-3.5 h-3.5 text-emerald-400" />
                <span>Google Maps</span>
              </a>
              <a
                href={getAppleMapsDirectionsUrl(safeChurch.address || 'Tempe, Arizona')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 active:scale-95 text-white font-semibold text-xs shadow-2xs transition-all"
                title={language === 'vi' ? 'Dẫn đường Apple Maps từ vị trí hiện tại' : 'Turn-by-turn in Apple Maps'}
              >
                <Navigation className="w-3.5 h-3.5 text-white" />
                <span>Apple Maps</span>
              </a>
            </div>
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

      {/* Directions Routing Modal */}
      <DirectionsModal
        isOpen={directionsModalOpen}
        onClose={() => setDirectionsModalOpen(false)}
        destinationName={directionsTarget.name}
        address={directionsTarget.address}
      />
    </div>
  );
};
