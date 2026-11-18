import React from 'react';
import { useLanguage } from '../../vrc-frontend/context/LanguageContext.tsx';
import { HomeDashboard } from '../../vrc-frontend/components/home-dashboard/HomeDashboard.tsx';
import { EventsSection } from '../../vrc-frontend/components/events-section/EventsSection.tsx';
import { DailyVerseCard } from '../../vrc-frontend/components/daily-verse-card/DailyVerseCard.tsx';
import { VerseHistorySection } from '../../vrc-frontend/components/verse-history-section/VerseHistorySection.tsx';
import { VideosSection } from '../../vrc-frontend/components/videos-section/VideosSection.tsx';
import { NotificationsSection } from '../../vrc-frontend/components/notifications-section/NotificationsSection.tsx';
import { Button, Card } from '../../vrc-frontend/common-component/index.ts';
import { ArrowRight, WifiOff } from 'lucide-react';
import type {
  ChurchEvent,
  DailyVerse,
  Video,
  AppNotification,
  SpotlightBannerConfig,
  ChurchInfo,
} from '../../vrc-frontend/types/index.ts';
import { tabContentStyles as s } from './TabContent.styles.ts';

interface TabContentProps {
  activeTab: string;
  events: ChurchEvent[];
  todayVerse: DailyVerse | null;
  videos: Video[];
  notifications: AppNotification[];
  spotlightConfig: SpotlightBannerConfig | null;
  churchInfo: ChurchInfo | null;
  isAdmin: boolean;
  isLoading: boolean;
  // True when a full load came back with nothing and there is no data
  // already showing. The error view replaces the tab content instead
  // of the fake-empty screens.
  loadError: boolean;
  onRetryLoad: () => void;
  retryingLoad: boolean;
  pullContentStyle: React.CSSProperties;
  onNavigateTab: (tab: string) => void;
  onOpenAdminPortal: (
    tab?: string,
    eventToEdit?: ChurchEvent | null,
    focused?: boolean,
    videoToEdit?: Video | null,
  ) => void;
  onOpenSpotlightEditor: () => void;
  onOpenChurchInfoEditor: () => void;
  onRefresh: () => void;
  onSelectNotification: (notif: AppNotification) => void;
}

// The main content area: renders the section for the active tab.
// The Scripture tab also shows the verse history and a link back to
// the upcoming events.
export const TabContent: React.FC<TabContentProps> = ({
  activeTab,
  events,
  todayVerse,
  videos,
  notifications,
  spotlightConfig,
  churchInfo,
  isAdmin,
  isLoading,
  loadError,
  onRetryLoad,
  retryingLoad,
  pullContentStyle,
  onNavigateTab,
  onOpenAdminPortal,
  onOpenSpotlightEditor,
  onOpenChurchInfoEditor,
  onRefresh,
  onSelectNotification,
}) => {
  const { t } = useLanguage();

  // The load failed with nothing to show: say so and offer a retry,
  // instead of every tab looking empty for no reason. The retry
  // button spins until the load finishes; the view clears itself
  // when the load works.
  if (loadError && !isLoading) {
    return (
      <main className={s.mainContent} style={pullContentStyle}>
        <div className={s.loadErrorWrapper}>
          <Card variant="empty" padding="empty">
            <WifiOff className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <p className={s.loadErrorTitle}>{t('loadErrorTitle')}</p>
            <p className={s.loadErrorMessage}>{t('loadErrorMessage')}</p>
            <Button type="button" variant="primary" loading={retryingLoad} onClick={onRetryLoad}>
              {t('loadErrorRetry')}
            </Button>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className={s.mainContent} style={pullContentStyle}>
      {activeTab === 'home' && (
        <HomeDashboard
          events={events}
          todayVerse={todayVerse}
          spotlightConfig={spotlightConfig}
          churchInfo={churchInfo}
          onNavigateTab={onNavigateTab}
          onOpenAdminPortal={() => onOpenAdminPortal('create-event', null, true)}
          onOpenSpotlightEditor={onOpenSpotlightEditor}
          onOpenChurchInfoEditor={onOpenChurchInfoEditor}
          isAdmin={isAdmin}
          isLoading={isLoading}
        />
      )}

      {activeTab === 'events' && (
        <EventsSection
          events={events}
          churchInfo={churchInfo}
          isAdmin={isAdmin}
          onRefresh={onRefresh}
          onOpenAdminPortal={onOpenAdminPortal}
          isLoading={isLoading}
        />
      )}

      {activeTab === 'verse' && (
        <div>
          <DailyVerseCard
            todayVerse={todayVerse}
            isAdmin={isAdmin}
            onOpenAdminPortal={onOpenAdminPortal}
            isLoading={isLoading}
          />

          <VerseHistorySection isActive={activeTab === 'verse'} todayVerse={todayVerse} />

          <div className={s.verseHintWrapper}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onNavigateTab('events')}
              className={s.verseHintBtn}
              rightIcon={<ArrowRight className={s.verseHintIcon} />}
            >
              <span className={s.verseHintText}>{t('appUpcomingHint')}</span>
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'videos' && (
        <VideosSection
          videos={videos}
          isLoading={isLoading}
          isAdmin={isAdmin}
          onOpenAdminPortal={(tab, video) =>
            onOpenAdminPortal(tab, null, true, video)
          }
          onRefresh={onRefresh}
        />
      )}

      {activeTab === 'notifications' && (
        <NotificationsSection
          notifications={notifications}
          onSelectNotification={onSelectNotification}
          isAdmin={isAdmin}
          onNotificationAdded={onRefresh}
          isLoading={isLoading}
        />
      )}
    </main>
  );
};
