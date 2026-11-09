import React from 'react';
import { ChurchEvent, DailyVerse, SpotlightBannerConfig, SpotlightTheme, ChurchInfo, DEFAULT_CHURCH_INFO, DEFAULT_SPOTLIGHT } from '../../types/index.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { CrossIcon } from '../cross-icon/CrossIcon.tsx';
import {
  Calendar,
  BookOpen,
  Users,
  Clock,
  MapPin,
  Mail,
  Phone,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Sliders,
  CalendarPlus,
  Compass,
  Navigation,
  PenTool,
} from 'lucide-react';
import { DirectionsModal } from '../directions-modal/DirectionsModal.tsx';
import { DirectionButtons, CalendarButtons, Card, Button, EventDetailModal, LoadingShimmer } from '../../common-component/index.ts';
import { CHURCH_NAME } from '../../constants/church.ts';
import {
  formatDateLocale,
  formatWeekdayAndDate,
  getWeekdayName,
  getEventCardWeekday,
  getMonthText,
  getDayNumber,
} from '../../utils/dateFormatter.ts';
import { getCategoryTheme, getCategoryLabel } from '../../utils/categoryTheme.ts';
import { homeDashboardStyles as s } from './HomeDashboard.styles.ts';

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
  isLoading?: boolean;
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
  isLoading = false,
}) => {
  const { language, t } = useLanguage();

  const safeConfig = spotlightConfig || DEFAULT_SPOTLIGHT;
  const safeChurch = churchInfo || DEFAULT_CHURCH_INFO;
  const churchName = CHURCH_NAME;
  const churchAddress = (safeChurch.address && safeChurch.address.includes('1565'))
    ? safeChurch.address.trim()
    : CHURCH_NAME.address;

  // Sunday worship time for the Contact card, from the admin-edited
  // schedule (same data the Weekly Worship card shows).
  const sundayService =
    safeChurch.services?.find((svc) => svc.id === 'sunday-worship') || safeChurch.services?.[0];
  const sundayTime = sundayService
    ? language === 'en'
      ? sundayService.timeEn?.trim() || sundayService.time
      : sundayService.time
    : '';

  // Directions routing modal state
  const [directionsModalOpen, setDirectionsModalOpen] = React.useState(false);
  const [directionsTarget, setDirectionsTarget] = React.useState({ name: '', address: '' });
  const [selectedDetailEvent, setSelectedDetailEvent] = React.useState<ChurchEvent | null>(null);

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
  const defaultChurchAddress = churchAddress;
  const defaultChurchMapsUrl = safeChurch.googleMapsUrl && safeChurch.googleMapsUrl.includes('1565')
    ? safeChurch.googleMapsUrl
    : `https://maps.google.com/?q=${encodeURIComponent(churchAddress)}`;

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
        ? `${activeEvent.category} • ${formatDateLocale(activeEvent.date, language)}`
        : t('homeFeaturedEvent'));

  const displayTitle = isAutoMode
    ? (activeEvent ? activeEvent.title : churchName.vi)
    : (activeEvent ? activeEvent.title : (safeConfig.title || churchName.vi));

  const displaySubtitle = safeConfig.subtitle?.trim()
    ? safeConfig.subtitle.trim()
    : (activeEvent ? `Sự kiện: ${activeEvent.category} tại ${activeEvent.location}` : undefined);

  const displayDescription = isAutoMode
    ? (activeEvent ? activeEvent.description : (safeConfig.description || t('dashboardSub')))
    : (activeEvent ? activeEvent.description : (safeConfig.description || t('dashboardSub')));

  const displayDateTag = isAutoMode
    ? (activeEvent ? `${formatWeekdayAndDate(activeEvent.date, language)} • ${activeEvent.startTime}` : 'Chúa Nhật Hàng Tuần • 3:00 PM')
    : (activeEvent ? `${formatWeekdayAndDate(activeEvent.date, language)} • ${activeEvent.startTime}` : (safeConfig.dateTag || 'Chúa Nhật Hàng Tuần • 3:00 PM'));

  const displayLocationTag = isAutoMode
    ? (activeEvent ? (activeEvent.location || displayAddress) : displayAddress)
    : (activeEvent ? (activeEvent.location || displayAddress) : (safeConfig.locationTag || displayAddress));

  if (isLoading) {
    return (
      <div className={s.container}>
        <LoadingShimmer variant="hero" />
        <LoadingShimmer variant="verse" />
        <LoadingShimmer variant="card" count={3} />
      </div>
    );
  }

  return (
    <div className={s.container}>
      {/* Customizable High-Impact Holiday / Featured Hero Card */}
      <div className={`${s.heroBannerBase} ${bannerTheme.wrapper}`}>
        {/* Ambient Glows */}
        <div className={`${s.glowTopRight} ${bannerTheme.glow1}`} />
        <div className={`${s.glowBottomLeft} ${bannerTheme.glow2}`} />

        <div className={s.heroContent}>
          {/* Top Row: Clean Themed Badge Pill + Admin Customizer Button */}
          <div className={s.heroTopRow}>
            <div className={`${s.heroBadgeBase} ${bannerTheme.badgeText}`}>
              <span className="truncate">{language === 'vi' ? (spotlightConfig?.badgeVi || (displayBadge || '')) : (spotlightConfig?.badgeEn || (displayBadge || ''))}</span>
            </div>

            {isAdmin && onOpenSpotlightEditor && (
              <Button
                type="button"
                variant="glassDark"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onOpenSpotlightEditor();
                }}
                leftIcon={<Sliders className="w-3.5 h-3.5 text-amber-300" />}
                title="Tuỳ chỉnh banner trang chủ (Thanksgiving, Christmas, Easter...)"
              >
                <span className="hidden sm:inline">{t('homeCustomizeBanner')}</span>
                <span className="sm:hidden">{t('commonEdit')}</span>
              </Button>
            )}
          </div>

          {/* Title & Subtitle */}
          <div className={s.heroTitleGroup}>
            <h1 className={s.heroTitle}>
              {language === 'vi' ? (activeEvent?.titleVi || spotlightConfig?.titleVi || (displayTitle || '')) : (activeEvent?.titleEn || spotlightConfig?.titleEn || (displayTitle || ''))}
            </h1>

            {displaySubtitle && (
              <div className={s.heroSubtitleBox}>
                {language === 'vi' ? (spotlightConfig?.subtitleVi || (displaySubtitle || '')) : (spotlightConfig?.subtitleEn || (displaySubtitle || ''))}
              </div>
            )}

            <p className={s.heroDesc}>
              {language === 'vi' ? (activeEvent?.descriptionVi || spotlightConfig?.descriptionVi || (displayDescription || '')) : (activeEvent?.descriptionEn || spotlightConfig?.descriptionEn || (displayDescription || ''))}
            </p>
          </div>

          {/* Date & Location Chips */}
          <div className={s.metaChipsRow}>
            {displayDateTag && (
              <span className={s.metaChip}>
                <Calendar className={s.metaChipIcon} />
                <span>{displayDateTag}</span>
              </span>
            )}
            <span className={s.metaChip}>
              <MapPin className={s.metaChipIcon} />
              <span>{language === 'vi' ? (activeEvent?.locationVi || spotlightConfig?.locationTagVi || (displayLocationTag || '')) : (activeEvent?.locationEn || spotlightConfig?.locationTagEn || (displayLocationTag || ''))}</span>
            </span>
          </div>

          {/* Action Buttons Row */}
          <div className={s.actionBtnsRow}>
            <Button
              type="button"
              size="lg"
              onClick={() => onNavigateTab('events')}
              className={bannerTheme.btnPrimary}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              <span>{t('homeViewEvents')}</span>
            </Button>
            <Button
              type="button"
              variant="glassDark"
              size="lg"
              onClick={() => {
                setDirectionsTarget({
                  name: displayTitle,
                  address: displayAddress,
                });
                setDirectionsModalOpen(true);
              }}
              leftIcon={<Navigation className="w-3.5 h-3.5 text-amber-300" />}
              rightIcon={<Compass className="w-3 h-3 text-stone-200" />}
            >
              <span>{t('homeDirections')}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Navigation Hub Grid */}
      <section className={s.quickHubSection}>
        <div className={s.sectionHeaderRow}>
          <h2 className={s.sectionHeading}>
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>{t('quickAccessTitle')}</span>
          </h2>
          <span className={s.sectionSubHint}>
            {t('homeTapNavigate')}
          </span>
        </div>

        <div className={s.quickGrid}>
          {/* Card 1: Events */}
          <Card
            as="button"
            variant="quickNav"
            onClick={() => onNavigateTab('events')}
          >
            <div className={s.quickIconEvents}>
              <Calendar className="w-5 h-5" />
            </div>
            <span className={s.quickCardTitle}>
              {t('navEvents')}
            </span>
            <span className={s.quickCardSub}>
              {upcomingEvents.length} {t('upcomingEventsUnit')}
            </span>
          </Card>

          {/* Card 2: Scripture */}
          <Card
            as="button"
            variant="quickNav"
            onClick={() => onNavigateTab('verse')}
          >
            <div className={s.quickIconVerse}>
              <BookOpen className="w-5 h-5" />
            </div>
            <span className={s.quickCardTitle}>
              {t('navVerse')}
            </span>
            <span className={s.quickCardSub}>
              {(language === 'vi'
                ? todayVerse?.referenceVi || todayVerse?.reference
                : todayVerse?.referenceEn || todayVerse?.reference) || t('homeToday')}
            </span>
          </Card>

          {/* Card 3: Sanctuary & Directions */}
          <Card
            as="button"
            variant="quickNav"
            onClick={() => {
              const el = document.getElementById('sanctuary-location');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              } else {
                setDirectionsTarget({
                  name: language === 'vi' ? churchName.vi : churchName.en,
                  address: churchAddress,
                });
                setDirectionsModalOpen(true);
              }
            }}
          >
            <div className={s.quickIconSanctuary}>
              <MapPin className="w-5 h-5" />
            </div>
            <span className={s.quickCardTitle}>
              {t('homeSanctuary')}
            </span>
            <span className={s.quickCardSub}>
              Tempe, Arizona
            </span>
          </Card>
        </div>
      </section>

      {/* Featured Upcoming Event Card (Styled matching EventsSection card) */}
      {nextUpcomingEvent && (() => {
        const weekday = getEventCardWeekday(nextUpcomingEvent.date, language);
        const monthShort = getMonthText(nextUpcomingEvent.date, language, true);
        const dayNum = getDayNumber(nextUpcomingEvent.date);
        const theme = getCategoryTheme(nextUpcomingEvent.category);
        const CategoryIcon = theme.icon;
        const eventTitle = language === 'vi'
          ? (nextUpcomingEvent.titleVi || (nextUpcomingEvent.title || ''))
          : (nextUpcomingEvent.titleEn || (nextUpcomingEvent.title || ''));
        const eventDesc = language === 'vi'
          ? (nextUpcomingEvent.descriptionVi || (nextUpcomingEvent.description || ''))
          : (nextUpcomingEvent.descriptionEn || (nextUpcomingEvent.description || ''));

        return (
          <section className={s.upcomingSection}>
            <div className={s.sectionHeaderRow}>
              <h2 className={s.sectionHeading}>
                <Calendar className="w-4 h-4 text-amber-600" />
                <span>{t('todayHighlight')}</span>
              </h2>
              <Button
                type="button"
                variant="linkAmber"
                size="none"
                onClick={() => onNavigateTab('events')}
                className="text-xs font-semibold"
                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
              >
                <span>{t('viewAllEvents')}</span>
              </Button>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() => setSelectedDetailEvent(nextUpcomingEvent)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedDetailEvent(nextUpcomingEvent);
                }
              }}
              className={`${s.eventCardBase} ${theme.cardBg}`}
            >
              {/* Top Row: Category Pill + Featured Pill */}
              <div className={s.cardTopRow}>
                <div className={s.badgeGroup}>
                  <span className={`${s.categoryBadgeBase} ${theme.badge}`}>
                    <CategoryIcon className="w-3 h-3" />
                    <span>{getCategoryLabel(nextUpcomingEvent.category, language, t)}</span>
                  </span>
                  {(nextUpcomingEvent.isFeatured ?? true) && (
                    <span className={s.featuredBadge}>
                      {t('featuredBadge')}
                    </span>
                  )}
                </div>
              </div>

              {/* Main Content Area */}
              <div className={s.cardMainRow}>
                {/* Consolidated Calendar Date Card: Weekday (Sunday/Friday), Day Number, Month */}
                <div className={`${s.dateBoxBase} ${theme.dateBox}`}>
                  <span className={s.dateBoxWeekday}>
                    {weekday}
                  </span>
                  <span className={s.dateBoxDay}>
                    {dayNum}
                  </span>
                  <span className={`${s.dateBoxMonthBase} ${theme.monthText}`}>
                    {monthShort}
                  </span>
                </div>

                {/* Title & Timing & Location & Full Details */}
                <div className={s.cardTitleCol}>
                  <h3 className={s.cardTitle}>
                    {eventTitle}
                  </h3>

                  <div className={s.cardTimeRow}>
                    <Clock className="w-3.5 h-3.5 text-amber-800 dark:text-amber-400 flex-shrink-0" />
                    <span>
                      {nextUpcomingEvent.startTime}
                      {nextUpcomingEvent.endTime ? ` – ${nextUpcomingEvent.endTime}` : ''}
                    </span>
                  </div>

                  {nextUpcomingEvent.location && (
                    <div className={s.cardLocationRow}>
                      <MapPin className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 flex-shrink-0" />
                      <span className="truncate">{nextUpcomingEvent.location}</span>
                    </div>
                  )}

                  {/* More event details displayed directly on the card */}
                  {eventDesc && (
                    <p className={s.cardDesc}>
                      {eventDesc}
                    </p>
                  )}
                </div>
              </div>

              {/* Footer Actions: Calendar button moved to the right */}
              <div className={s.cardFooterRow}>
                <CalendarButtons
                  event={nextUpcomingEvent}
                  stopPropagation
                  variant="menu"
                />
              </div>
            </div>
          </section>
        );
      })()}

      {/* Weekly Worship Services & Gatherings (Single Unified Card) */}
      {safeChurch.services && safeChurch.services.length > 0 && (
        <Card as="section" variant="default" padding="md" className="space-y-3.5">
          <div className={s.servicesCardHeader}>
            <h2 className={s.sectionHeading}>
              <Clock className="w-4 h-4 text-amber-600" />
              <span>{t('homeWeeklyServices')}</span>
            </h2>
            {isAdmin && onOpenChurchInfoEditor && (
              <Button
                type="button"
                variant="amberLight"
                size="xs"
                onClick={onOpenChurchInfoEditor}
                leftIcon={<PenTool className="w-3 h-3" />}
              >
                <span>{t('homeEditSchedule')}</span>
              </Button>
            )}
          </div>

          <div className={s.servicesUnifiedList}>
            {safeChurch.services.map((svc, idx) => {
              const { dayPart, hourPart } = getServiceTimeParts(svc, language);
              const serviceTitle =
                language === 'vi'
                  ? svc.titleVi
                  : svc.titleEn?.trim() || (svc.titleVi || '');
              const serviceDesc =
                language === 'vi'
                  ? svc.descVi
                  : svc.descEn?.trim() || (svc.descVi || '');

              return (
                <div key={svc.id || idx} className={s.serviceItemCol}>
                  <div className={s.serviceCardTopRow}>
                    <span className={s.serviceDayBadge}>
                      <CrossIcon className="w-2.5 h-2.5 text-amber-700" />
                      <span>{dayPart}</span>
                    </span>
                    {hourPart && (
                      <span className={s.serviceHourText}>{hourPart}</span>
                    )}
                  </div>
                  <h3 className={s.serviceTitle}>{serviceTitle}</h3>
                  {serviceDesc && (
                    <p className={s.serviceDesc}>{serviceDesc}</p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Daily Verse Snippet */}
      {todayVerse && (
        <Card as="section" variant="warm" padding="md" className="space-y-2.5">
          <div className={s.sectionHeaderRow}>
            <span className={s.verseLabel}>
              <CrossIcon className="w-3 h-3 text-amber-600" />
              <span>{t('heroScripture')}</span>
            </span>
            <span className={s.verseRef}>
              {language === 'vi'
                ? todayVerse.referenceVi || todayVerse.reference
                : todayVerse.referenceEn || todayVerse.reference}
            </span>
          </div>

          <blockquote className={s.verseQuote}>
            "
            {language === 'vi'
              ? todayVerse.verseTextVi || todayVerse.verseText
              : todayVerse.verseTextEn || todayVerse.verseText}
            "
          </blockquote>

          <div className={s.verseFooter}>
            <span className={s.verseTrans}>
              {language === 'vi'
                ? todayVerse.translationVi || todayVerse.translation
                : todayVerse.translationEn || todayVerse.translation}
            </span>
            <Button
              type="button"
              variant="linkAmber"
              size="none"
              onClick={() => onNavigateTab('verse')}
              className="text-xs font-semibold"
              rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
            >
              <span>{t('readTodayVerse')}</span>
            </Button>
          </div>
        </Card>
      )}

      {/* Contact Card */}
      <Card as="section" id="sanctuary-location" variant="default" padding="md" className={s.contactCard}>
        <div className={s.contactHeader}>
          <span className={s.contactHeaderLabel}>
            <Mail className="w-3.5 h-3.5 text-amber-600" />
            <span>{t('contactLead')}</span>
          </span>
          {isAdmin && onOpenChurchInfoEditor && (
            <Button
              type="button"
              variant="amberLight"
              size="iconSm"
              onClick={onOpenChurchInfoEditor}
              title={t('contactEditTitle')}
            >
              <PenTool className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        <div className={s.contactList}>
          {/* Address + Directions */}
          <div className={s.contactRow}>
            <div className={s.contactIconChip}>
              <MapPin className="w-4 h-4" />
            </div>
            <div className={s.contactTextCol}>
              <span className={s.contactLabel}>{t('contactAddressLabel')}</span>
              <span className={s.contactValue}>{churchAddress}</span>
              <div className={s.contactDirections}>
                <DirectionButtons address={churchAddress} />
              </div>
            </div>
          </div>

          {/* Phone */}
          {safeChurch.phone && (
            <div className={s.contactRow}>
              <div className={s.contactIconChip}>
                <Phone className="w-4 h-4" />
              </div>
              <div className={s.contactTextCol}>
                <span className={s.contactLabel}>{t('contactPhoneLabel')}</span>
                <a
                  href={`tel:${safeChurch.phone.replace(/[^0-9+]/g, '')}`}
                  className={s.contactValueLink}
                >
                  {safeChurch.phone}
                </a>
              </div>
            </div>
          )}

          {/* Email */}
          {safeChurch.email && (
            <div className={s.contactRow}>
              <div className={s.contactIconChip}>
                <Mail className="w-4 h-4" />
              </div>
              <div className={s.contactTextCol}>
                <span className={s.contactLabel}>{t('contactEmailLabel')}</span>
                <a href={`mailto:${safeChurch.email}`} className={s.contactValueLink}>
                  {safeChurch.email}
                </a>
              </div>
            </div>
          )}

          {/* Sunday worship hours */}
          {sundayTime && (
            <div className={s.contactRow}>
              <div className={s.contactIconChip}>
                <Clock className="w-4 h-4" />
              </div>
              <div className={s.contactTextCol}>
                <span className={s.contactLabel}>{t('contactHoursLabel')}</span>
                <span className={s.contactValue}>{sundayTime}</span>
              </div>
            </div>
          )}
        </div>

        <div className={s.contactDivider} />

        {/* Socials */}
        <div className={s.contactSocials}>
          <span className={s.contactSocialLabel}>{t('contactFollowLabel')}</span>
          <div className={s.socialCircles}>
            <a
              href="https://www.youtube.com/@PHUCHUNGAZ"
              target="_blank"
              rel="noopener noreferrer"
              className={s.socialCircleYoutube}
              aria-label="YouTube"
            >
              <svg className={s.socialCircleIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>

            <a
              href="https://www.facebook.com/phuchungus"
              target="_blank"
              rel="noopener noreferrer"
              className={s.socialCircleFacebook}
              aria-label="Facebook"
            >
              <svg className={s.socialCircleIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
          </div>
        </div>
      </Card>

      {/* Directions Routing Modal */}
      <DirectionsModal
        isOpen={directionsModalOpen}
        onClose={() => setDirectionsModalOpen(false)}
        destinationName={directionsTarget.name}
        address={directionsTarget.address}
      />

      {/* Event Details Popup Modal */}
      <EventDetailModal
        event={selectedDetailEvent}
        onClose={() => setSelectedDetailEvent(null)}
      />
    </div>
  );
};
