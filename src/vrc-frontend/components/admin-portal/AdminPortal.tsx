import React, { useState, useEffect, useRef } from 'react';
import { ChurchEvent, ChurchInfo, DailyVerse, Sermon } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { APP_VERSION } from '../../constants/version.ts';
import { Modal } from '../../common-component/modal/Modal.tsx';
import { adminPortalStyles as s } from './AdminPortal.styles.ts';
import { PrayerRequestsTab } from './tabs/prayer-requests-tab/PrayerRequestsTab.tsx';
import { AdminAccountsTab } from './tabs/admin-accounts-tab/AdminAccountsTab.tsx';
import { VersesTab } from './tabs/verses-tab/VersesTab.tsx';
import { SermonsTab } from './tabs/sermons-tab/SermonsTab.tsx';
import { EventsTab } from './tabs/events-tab/EventsTab.tsx';
import {
  Calendar,
  BookOpen,
  Video,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Users,
  Sliders,
  HeartHandshake,
} from 'lucide-react';

interface AdminPortalProps {
  events: ChurchEvent[];
  allVerses: DailyVerse[];
  sermons: Sermon[];
  churchInfo?: ChurchInfo | null;
  initialTab?: string;
  focusedMode?: boolean;
  initialEvent?: ChurchEvent | null;
  initialVerse?: DailyVerse | null;
  onClose: () => void;
  onRefreshData: () => void;
  onOpenSpotlightEditor?: () => void;
  onOpenHeaderVerseEditor?: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  events,
  allVerses,
  sermons,
  churchInfo,
  initialTab = 'create-event',
  focusedMode = false,
  initialEvent,
  initialVerse,
  onClose,
  onRefreshData,
  onOpenSpotlightEditor,
  onOpenHeaderVerseEditor,
}) => {
  const { adminUser, getToken } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState(initialTab);
  // Whether the verses child is currently editing a verse — drives the
  // focused-mode header title ("Edit Verse" vs "Add Verse").
  const [verseEditing, setVerseEditing] = useState(false);
  // Whether the events child is currently editing an event — drives the
  // focused-mode header title and the "Add Event" tab label.
  const [eventEditing, setEventEditing] = useState(false);
  // Bumped when the "Add Event" tab button is tapped while not editing;
  // the events child clears a fresh form when it sees the bump.
  const [resetEventFormSignal, setResetEventFormSignal] = useState(0);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  // Prayer Requests State
  // Errors stay on screen until dismissed — a vanished error looks
  // like nothing happened. Success messages still auto-hide.
  const feedbackTimeout = useRef<number | null>(null);
  const showFeedback = (type: 'success' | 'error', message: string) => {
    if (feedbackTimeout.current) {
      window.clearTimeout(feedbackTimeout.current);
      feedbackTimeout.current = null;
    }
    setFeedback({ type, message });
    if (type === 'success') {
      feedbackTimeout.current = window.setTimeout(() => setFeedback(null), 4000);
    }
  };



  return (
    <Modal isOpen={true} onClose={onClose} maxWidthClass="max-w-3xl">
      <div className={s.modalContainer}>
        {/* Header */}
        <div className={s.header}>
          <div>
            <h2 className={s.headerTitle}>
              {focusedMode
                ? activeTab === 'create-event'
                  ? eventEditing
                    ? t('adminEventEditHeader')
                    : t('eventsAddFormTitle')
                  : activeTab === 'verses'
                  ? verseEditing
                    ? t('adminVerseEditFormTitle')
                    : t('adminVerseAddFormTitle')
                  : t('adminDashboardTitle')
                : t('adminDashboardTitle')}
            </h2>
            <p className={s.headerSubtitle}>
              <span>
                {t('adminLoggedInAs')}
                <span className={s.adminName}>{adminUser?.displayName} (@{adminUser?.username})</span>
              </span>
              <span className={s.separator}>•</span>
              <span className={s.versionText}>v{APP_VERSION}</span>
            </p>
          </div>

          <div className={s.headerActions}>
            <button
              onClick={onRefreshData}
              className={s.iconBtn}
              title="Refresh Data"
            >
              <RefreshCw className={s.refreshIcon} />
            </button>
            <button
              onClick={onClose}
              className={s.iconBtn}
              aria-label="Close Admin Portal"
            >
              <X className={s.closeIcon} />
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`${s.alertBase} ${
              feedback.type === 'success' ? s.alertSuccess : s.alertError
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className={s.alertIconSuccess} />
            ) : (
              <AlertCircle className={s.alertIconError} />
            )}
            <span className="flex-1">{feedback.message}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5"
              aria-label="Dismiss"
              title={t('commonDismiss')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab Controls - Mobile Grid (no horizontal scroll needed) */}
        {!focusedMode && (
        <div className={s.mobileTabSection}>
          <div className={s.mobileTabGrid}>
            <button
              type="button"
              onClick={() => {
                setActiveTab('create-event');
                if (!eventEditing) setResetEventFormSignal((n) => n + 1);
              }}
              className={`${s.mobileTabBtnBase} ${
                activeTab === 'create-event' ? s.mobileTabActiveDark : s.mobileTabIdle
              }`}
            >
              <Plus className={s.tabIcon} />
              <span className="truncate">{eventEditing ? t('eventEditTitle') : t('tabAddEvent')}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('manage-events')}
              className={`${s.mobileTabBtnBase} ${
                activeTab === 'manage-events' ? s.mobileTabActiveDark : s.mobileTabIdle
              }`}
            >
              <Calendar className={s.tabIcon} />
              <span className="truncate">{t('tabManageEvents')} ({events.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('verses')}
              className={`${s.mobileTabBtnBase} ${
                activeTab === 'verses' ? s.mobileTabActiveDark : s.mobileTabIdle
              }`}
            >
              <BookOpen className={s.tabIcon} />
              <span className="truncate">{t('tabVerses')} ({allVerses.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sermons')}
              className={`${s.mobileTabBtnBase} ${
                activeTab === 'sermons' ? s.mobileTabActiveDark : s.mobileTabIdle
              }`}
            >
              <Video className={s.tabIcon} />
              <span className="truncate">{t('tabSermons')} ({sermons.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('admin-accounts')}
              className={`${s.mobileTabBtnBase} ${
                activeTab === 'admin-accounts' ? s.mobileTabActiveAmber : s.mobileTabIdle
              }`}
            >
              <Users className={s.tabIconAmber} />
              <span className="truncate">{t('tabAdminAccounts')}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('prayer-requests')}
              className={`${s.mobileTabBtnBase} ${
                activeTab === 'prayer-requests' ? s.mobileTabActiveAmber : s.mobileTabIdle
              }`}
            >
              <HeartHandshake className={s.tabIconAmber} />
              <span className="truncate">{t('adminTabPrayers')}</span>
            </button>
          </div>

          {onOpenSpotlightEditor && (
            <button
              type="button"
              onClick={onOpenSpotlightEditor}
              className={s.mobileSpotlightBtn}
            >
              <Sliders className={s.tabIcon} />
              <span>{t('adminCustomizeBanner')}</span>
            </button>
          )}
        </div>
        )}

        {/* Tab Controls - Desktop Horizontal Bar */}
        {!focusedMode && (
        <div className={s.desktopTabBar}>
          <button
            onClick={() => {
              setActiveTab('create-event');
              if (!eventEditing) setResetEventFormSignal((n) => n + 1);
            }}
            className={`${s.desktopTabBtnBase} ${
              activeTab === 'create-event' ? s.desktopTabActiveDark : s.desktopTabIdle
            }`}
          >
            <Plus className={s.tabIcon} />
            {eventEditing ? t('eventEditTitle') : t('tabAddEvent')}
          </button>

          <button
            onClick={() => setActiveTab('manage-events')}
            className={`${s.desktopTabBtnBase} ${
              activeTab === 'manage-events' ? s.desktopTabActiveDark : s.desktopTabIdle
            }`}
          >
            <Calendar className={s.tabIcon} />
            {t('tabManageEvents')} ({events.length})
          </button>

          <button
            onClick={() => setActiveTab('verses')}
            className={`${s.desktopTabBtnBase} ${
              activeTab === 'verses' ? s.desktopTabActiveDark : s.desktopTabIdle
            }`}
          >
            <BookOpen className={s.tabIcon} />
            {t('tabVerses')} ({allVerses.length})
          </button>

          <button
            onClick={() => setActiveTab('sermons')}
            className={`${s.desktopTabBtnBase} ${
              activeTab === 'sermons' ? s.desktopTabActiveDark : s.desktopTabIdle
            }`}
          >
            <Video className={s.tabIcon} />
            {t('tabSermons')} ({sermons.length})
          </button>

          <button
            onClick={() => setActiveTab('admin-accounts')}
            className={`${s.desktopTabBtnBase} ${
              activeTab === 'admin-accounts' ? s.desktopTabActiveAmber : s.desktopTabIdleAmber
            }`}
          >
            <Users className={s.tabIconAmber600} />
            <span>{t('tabAdminAccounts')}</span>
          </button>

          {onOpenSpotlightEditor && (
            <button
              type="button"
              onClick={onOpenSpotlightEditor}
              className={s.desktopSpotlightBtn}
              title="Tuỳ chỉnh banner trang chủ"
            >
              <Sliders className={s.tabIcon} />
              <span>{t('adminCustomizeBannerShort')}</span>
            </button>
          )}
        </div>
        )}

        {/* Content Body */}
        <div className={s.contentBody}>
          <EventsTab events={events} churchInfo={churchInfo} initialEvent={initialEvent} adminUser={adminUser} activeTab={activeTab} getToken={getToken} showFeedback={showFeedback} onRefreshData={onRefreshData} onTabChange={setActiveTab} onEditingChange={setEventEditing} resetFormSignal={resetEventFormSignal} />

          <VersesTab activeTab={activeTab} allVerses={allVerses} initialVerse={initialVerse} churchInfo={churchInfo} onOpenHeaderVerseEditor={onOpenHeaderVerseEditor} getToken={getToken} showFeedback={showFeedback} onRefreshData={onRefreshData} onEditingChange={setVerseEditing} />

          <SermonsTab sermons={sermons} activeTab={activeTab} getToken={getToken} showFeedback={showFeedback} onRefreshData={onRefreshData} />

          <AdminAccountsTab activeTab={activeTab} getToken={getToken} adminUser={adminUser} showFeedback={showFeedback} />

          <PrayerRequestsTab activeTab={activeTab} getToken={getToken} showFeedback={showFeedback} />
        </div>
      </div>
    </Modal>
  );
};
