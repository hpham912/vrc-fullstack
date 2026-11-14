import React from 'react';
import { ChurchEvent, DailyVerse, SpotlightBannerConfig, ChurchInfo, DEFAULT_CHURCH_INFO, DEFAULT_SPOTLIGHT } from '../../types/index.ts';
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
  CalendarPlus,
  PenTool,
} from 'lucide-react';
import { DirectionsModal } from '../directions-modal/DirectionsModal.tsx';
import { FeaturedBanner } from './featured-banner/FeaturedBanner.tsx';
import { DirectionButtons, CalendarButtons, Card, Button, EventDetailModal, LoadingShimmer, ZoomButton } from '../../common-component/index.ts';
import { CHURCH_NAME } from '../../constants/church.ts';
import {
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
  const [directionsTarget, setDirectionsTarget] = React.useState<{ name: string; address: string; location?: string }>({ name: '', address: '' });
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
      {/* Featured banner (spotlight) — its own component */}
      <FeaturedBanner
        activeEvent={activeEvent}
        spotlightConfig={safeConfig}
        isAutoMode={isAutoMode}
        churchAddress={churchAddress}
        isAdmin={isAdmin}
        onOpenSpotlightEditor={onOpenSpotlightEditor}
        onNavigateTab={onNavigateTab}
        onOpenDirections={(target) => {
          setDirectionsTarget(target);
          setDirectionsModalOpen(true);
        }}
      />

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
              {upcomingEvents.length}{' '}
              <span className={s.labelFull}>{t('upcomingEventsUnit')}</span>
              <span className={s.labelShort}>{t('upcomingEventsUnitShort')}</span>
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
              <span className={s.labelFull}>Tempe, Arizona</span>
              <span className={s.labelShort}>Tempe, AZ</span>
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
                <span className={s.labelFull}>{t('viewAllEvents')}</span>
                <span className={s.labelShort}>{t('viewAllEventsShort')}</span>
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

              {/* Footer Actions: Zoom button next to the calendar button */}
              <div className={s.cardFooterRow}>
                <ZoomButton event={nextUpcomingEvent} meetingId={churchInfo?.zoomMeetingId} passcode={churchInfo?.zoomPasscode} stopPropagation className="flex-1 justify-center" />
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
              <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span className={s.labelFull}>{t('homeWeeklyServices')}</span>
              <span className={s.labelShort}>{t('homeWeeklyServicesShort')}</span>
            </h2>
            {isAdmin && onOpenChurchInfoEditor && (
              <Button
                type="button"
                variant="amberLight"
                size="xs"
                onClick={onOpenChurchInfoEditor}
                leftIcon={<PenTool className="w-3 h-3" />}
              >
                <span className="hidden sm:inline">{t('homeEditSchedule')}</span>
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
              <span className={s.labelFull}>{t('readTodayVerse')}</span>
              <span className={s.labelShort}>{t('readTodayVerseShort')}</span>
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
              size="xs"
              onClick={onOpenChurchInfoEditor}
              title={t('contactEditTitle')}
              leftIcon={<PenTool className="w-3.5 h-3.5" />}
            >
              <span className="hidden sm:inline">{t('contactEditTitle')}</span>
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
        location={directionsTarget.location}
      />

      {/* Event Details Popup Modal */}
      <EventDetailModal
        event={selectedDetailEvent}
        onClose={() => setSelectedDetailEvent(null)}
      />
    </div>
  );
};
