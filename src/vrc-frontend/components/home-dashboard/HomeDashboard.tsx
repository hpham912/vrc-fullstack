import React from 'react';
import { ChurchEvent, DailyVerse, SpotlightBannerConfig, ChurchInfo, DEFAULT_CHURCH_INFO, DEFAULT_SPOTLIGHT } from '../../types/index.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { Calendar, ChevronRight } from 'lucide-react';
import { DirectionsModal } from '../directions-modal/DirectionsModal.tsx';
import { FeaturedBanner } from './featured-banner/FeaturedBanner.tsx';
import { QuickNavHub } from './QuickNavHub.tsx';
import { WorshipScheduleCard } from './WorshipScheduleCard.tsx';
import { DailyVerseSnippet } from './DailyVerseSnippet.tsx';
import { ContactCard } from './ContactCard.tsx';
import { Button, EventCard, EventDetailModal, LoadingShimmer } from '../../common-component/index.ts';
import { CHURCH_NAME } from '../../constants/church.ts';
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
      <QuickNavHub
        upcomingCount={upcomingEvents.length}
        todayVerse={todayVerse}
        onNavigateTab={onNavigateTab}
        churchName={churchName}
        churchAddress={churchAddress}
        onOpenDirections={(target) => {
          setDirectionsTarget(target);
          setDirectionsModalOpen(true);
        }}
      />

      {/* Featured Upcoming Event Card (shared EventCard) */}
      {nextUpcomingEvent && (
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

          <EventCard
            event={nextUpcomingEvent}
            onClick={() => setSelectedDetailEvent(nextUpcomingEvent)}
            showDescription
            featuredBadge="show"
            churchInfo={churchInfo}
          />
        </section>
      )}

      {/* Weekly Worship Services & Gatherings (Single Unified Card) */}
      <WorshipScheduleCard
        services={safeChurch.services ?? []}
        isAdmin={isAdmin}
        onOpenChurchInfoEditor={onOpenChurchInfoEditor}
      />

      {/* Daily Verse Snippet */}
      <DailyVerseSnippet todayVerse={todayVerse} onNavigateTab={onNavigateTab} />

      {/* Contact Card */}
      <ContactCard
        churchInfo={safeChurch}
        churchAddress={churchAddress}
        sundayTime={sundayTime}
        isAdmin={isAdmin}
        onOpenChurchInfoEditor={onOpenChurchInfoEditor}
      />

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
