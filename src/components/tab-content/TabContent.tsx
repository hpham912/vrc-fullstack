import React from 'react';
import { useLanguage } from '../../vrc-frontend/context/LanguageContext.tsx';
import { HomeDashboard } from '../../vrc-frontend/components/home-dashboard/HomeDashboard.tsx';
import { EventsSection } from '../../vrc-frontend/components/events-section/EventsSection.tsx';
import { DailyVerseCard } from '../../vrc-frontend/components/daily-verse-card/DailyVerseCard.tsx';
import { VerseHistorySection } from '../../vrc-frontend/components/verse-history-section/VerseHistorySection.tsx';
import { VideosSection } from '../../vrc-frontend/components/videos-section/VideosSection.tsx';
import { NotificationsSection } from '../../vrc-frontend/components/notifications-section/NotificationsSection.tsx';
import { Button } from '../../vrc-frontend/common-component/index.ts';
import { ArrowRight } from 'lucide-react';
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
  pullContentStyle,
  onNavigateTab,
  onOpenAdminPortal,
  onOpenSpotlightEditor,
  onOpenChurchInfoEditor,
  onRefresh,
  onSelectNotification,
}) => {
  const { t } = useLanguage();

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
