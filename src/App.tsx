import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './vrc-frontend/context/AuthContext.tsx';
import { LanguageProvider } from './vrc-frontend/context/LanguageContext.tsx';
import { Navbar } from './vrc-frontend/components/nav-bar/Navbar.tsx';
import { IosTabBar } from './vrc-frontend/components/ios-tab-bar/IosTabBar.tsx';
import { LoginModal } from './vrc-frontend/components/login-modal/LoginModal.tsx';
import { RegisterModal } from './vrc-frontend/components/register-modal/RegisterModal.tsx';
import { ForgotPasswordModal } from './vrc-frontend/components/forgot-password-modal/ForgotPasswordModal.tsx';
import { PrayerRequestModal } from './vrc-frontend/components/prayer-request-modal/PrayerRequestModal.tsx';
import { NotificationModal } from './vrc-frontend/components/notification-modal/NotificationModal.tsx';
import { AnnouncementDetailModal } from './vrc-frontend/components/notification-modal/AnnouncementDetailModal.tsx';
import { EventDetailModal } from './vrc-frontend/common-component/index.ts';

// Admin-only screens load on demand, so regular visitors never download them.
// Each one is rendered only when an admin opens it (see Suspense below).
const AdminPortal = lazy(() =>
  import('./vrc-frontend/components/admin-portal/AdminPortal.tsx').then((module) => ({
    default: module.AdminPortal,
  }))
);
const SpotlightBannerModal = lazy(() =>
  import('./vrc-frontend/components/spotlight-banner-modal/SpotlightBannerModal.tsx').then(
    (module) => ({ default: module.SpotlightBannerModal })
  )
);
const EditChurchInfoModal = lazy(() =>
  import('./vrc-frontend/components/edit-church-info-modal/EditChurchInfoModal.tsx').then(
    (module) => ({ default: module.EditChurchInfoModal })
  )
);
const EditHeaderVerseModal = lazy(() =>
  import('./vrc-frontend/components/edit-header-verse-modal/EditHeaderVerseModal.tsx').then(
    (module) => ({ default: module.EditHeaderVerseModal })
  )
);
import { LoadingShimmer, AnnouncementBanner, OfflineBanner, useDataSync, useOnlineStatus, useUnreadNotifications, usePullToRefresh, SYNC_COLLECTIONS } from './vrc-frontend/common-component/index.ts';
import { useAppData } from './vrc-frontend/hooks/useAppData.ts';
import { AppHero } from './components/app-hero/AppHero.tsx';
import { TabContent } from './components/tab-content/TabContent.tsx';
import { AppFooter } from './components/app-footer/AppFooter.tsx';
import { FloatingPrayerButton } from './components/floating-prayer-button/FloatingPrayerButton.tsx';
import { NotificationToast } from './components/notification-toast/NotificationToast.tsx';
import type { ToastNotification } from './components/notification-toast/NotificationToast.tsx';
import { PullRefreshBar } from './components/pull-refresh-bar/PullRefreshBar.tsx';
import { ChurchEvent, Video, AppNotification, DEFAULT_CHURCH_INFO } from './vrc-frontend/types/index.ts';
import { NotificationClient } from './vrc-frontend/services/notificationClient.ts';
import { appStyles as s } from './App.styles.ts';

function ChurchAppContent() {
  const { isAdmin } = useAuth();

  // Every collection the app shows, plus the fetch functions. Owned by
  // the hook; this shell only renders and wires callbacks.
  const {
    events,
    todayVerse,
    videos,
    notifications,
    announcements,
    spotlightConfig,
    churchInfo,
    isLoading,
    loadError,
    refreshCollections,
    loadData,
    setSpotlightConfig,
    setChurchInfo,
  } = useAppData();

  // Connection: the offline banner shows while the device reports no
  // network, and everything reloads the moment it comes back — the
  // user never has to tap retry after the connection returns.
  const isOnline = useOnlineStatus();
  const wasOfflineRef = useRef(false);
  useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true;
      return;
    }
    if (wasOfflineRef.current) {
      wasOfflineRef.current = false;
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  // Manual retry from the load-error view: the button spins until the
  // load finishes, then the view clears itself if the load worked.
  const [retryingLoad, setRetryingLoad] = useState(false);
  const handleRetryLoad = async () => {
    setRetryingLoad(true);
    try {
      await loadData();
    } finally {
      setRetryingLoad(false);
    }
  };

  // Modern Home tab as default landing
  const [activeTab, setActiveTab] = useState('home');
  const [prayerModalOpen, setPrayerModalOpen] = useState(false);

  // Switching tabs always dismisses the notifications panel, so tapping a
  // bottom-bar tab is the way out of it on mobile (it has no close button).
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setShowNotifModal(false);
  };

  // Tapping a notification never navigates away from the tab you are on,
  // except a verse notice, which goes to the Scripture tab. A notice opens
  // its modal and an event opens its details, both on top of the current
  // tab — on mobile that is the Notifications tab itself.
  const handleSelectNotification = (notif: AppNotification) => {
    setShowNotifModal(false);
    if (notif.type === 'event') {
      // Show the event's details only — never navigate away.
      const evt = events.find((e) => e.id === notif.targetId);
      if (evt) setSelectedEvent(evt);
    } else if (notif.type === 'verse') {
      setActiveTab('verse');
    } else if (notif.type === 'announcement') {
      // Admin notice: show the full text in a modal, stay put.
      setSelectedAnnouncement(notif);
    }
  };

  // Every tab switch scrolls back to the top, so a tab never opens
  // half-way down from where the last tab was left.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  const [toastNotification, setToastNotification] = useState<ToastNotification | null>(null);

  // Modals
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false);
  const [adminPortalOpen, setAdminPortalOpen] = useState(false);
  const [spotlightModalOpen, setSpotlightModalOpen] = useState(false);
  const [churchInfoModalOpen, setChurchInfoModalOpen] = useState(false);
  const [headerVerseModalOpen, setHeaderVerseModalOpen] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  // Event / announcement opened from a notification tap.
  const [selectedEvent, setSelectedEvent] = useState<ChurchEvent | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AppNotification | null>(null);

  // Measured height of the iOS tab bar (px). It varies by device safe
  // area and by font size, so the notifications panel ends exactly above
  // the tab bar instead of covering it — no guessed offset, no gap.
  const tabBarRef = useRef<HTMLElement | null>(null);
  // Ref to the header bell button, so the desktop notifications popup
  // can anchor directly below it (measured position, not a guessed
  // offset — the bell moves with the centered header on wide screens).
  const bellButtonRef = useRef<HTMLButtonElement | null>(null);
  const [tabBarHeight, setTabBarHeight] = useState(0);
  useEffect(() => {
    const el = tabBarRef.current;
    if (!el) return;
    const measure = () => setTabBarHeight(el.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const [adminPortalTab, setAdminPortalTab] = useState('create-event');
  const [adminFocusedMode, setAdminFocusedMode] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ChurchEvent | null>(null);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);

  // Live updates: checks GET /api/sync and re-fetches only the
  // collections that changed. No timer — it checks when the app comes
  // back to the foreground and when the user switches tabs, and the
  // user can pull down anywhere to reload right now.
  const { checkNow } = useDataSync((changed) => {
    refreshCollections(changed);
  });

  // Switching tabs re-checks for updates, so a tab always shows the
  // latest the admin posted (the check itself is tiny; it only
  // re-fetches what actually changed).
  useEffect(() => {
    checkNow();
  }, [activeTab, checkNow]);

  // Pull down from the top of any screen to reload everything now.
  // The boolean result is ignored here — a failed pull over good
  // data keeps showing the data, it never becomes the error view.
  const { pullDistance, isRefreshing: isPullRefreshing } = usePullToRefresh(async () => {
    await refreshCollections(SYNC_COLLECTIONS);
  });

  // Pull-to-refresh: the content below the fixed header slides down
  // with the finger (the whole screen goes down), revealing the refresh
  // bar above it. No transition while dragging (it follows the finger
  // exactly); a short one on release so it springs back smoothly.
  const isPulling = pullDistance > 0 && !isPullRefreshing;
  const pullContentStyle: React.CSSProperties = {
    transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
    transition: isPulling ? 'none' : 'transform 200ms ease-out',
  };

  // Unread notification count (the badge number). Viewing the list
  // clears it.
  const { unreadCount, markSeen } = useUnreadNotifications(notifications);

  // Opening the Notifications tab (mobile) or the notifications popup
  // (desktop) means the user has seen the list — clear the count. It
  // also re-runs when new notifications arrive while viewing, so they
  // don't pile up as unread under the user's eyes.
  useEffect(() => {
    if (activeTab === 'notifications' || showNotifModal) {
      markSeen();
    }
  }, [activeTab, showNotifModal, markSeen]);

  useEffect(() => {
    const handleToast = (e: any) => {
      if (e?.detail) {
        setToastNotification(e.detail);
        setTimeout(() => {
          setToastNotification((prev) => (prev?.id === e.detail.id ? null : prev));
        }, 6000);
      }
    };
    window.addEventListener('vrc-toast-notification', handleToast);
    return () => window.removeEventListener('vrc-toast-notification', handleToast);
  }, []);

  // A tapped push notification opens the app to the Notifications tab
  // (and refreshes, so the new notification is in the list).
  useEffect(() => {
    const handleOpenNotifications = () => {
      setActiveTab('notifications');
      loadData();
    };
    window.addEventListener('vrc-open-notifications', handleOpenNotifications);
    return () => window.removeEventListener('vrc-open-notifications', handleOpenNotifications);
  }, []);

  const openAdminWithTab = (
    tab = 'create-event',
    eventToEdit?: ChurchEvent | null,
    focused = true,
    videoToEdit?: Video | null,
  ) => {
    setAdminPortalTab(tab);
    setEditingEvent(eventToEdit || null);
    setEditingVideo(videoToEdit || null);
    setAdminFocusedMode(focused);
    setAdminPortalOpen(true);
  };

  return (
    <div className={s.pageWrapper}>
      <PullRefreshBar pullDistance={pullDistance} isPullRefreshing={isPullRefreshing} />

      {/* iOS App Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openAdminPortal={() => openAdminWithTab('admin-accounts', null, false)}
        openLoginModal={() => setLoginModalOpen(true)}
        notifications={notifications}
        notificationCount={unreadCount}
        onRequestNotificationPermission={() => NotificationClient.requestPermission()}
        onOpenNotifications={() => {
          setShowNotifModal((prev) => !prev);
          NotificationClient.requestPermission();
        }}
        isNotifOpen={showNotifModal}
        notifButtonRef={bellButtonRef}
      />

      {/* No-connection banner: a full-width amber strip under the
          header while the device reports no network. Renders nothing
          when online. Slides with the page content while pulling to
          refresh, like the announcement banner below it. */}
      <OfflineBanner isOnline={isOnline} style={pullContentStyle} />

      {/* Global announcement banner: the newest active announcement,
          soft rose pill under the header on every tab. Renders nothing when
          no announcement is active. Slides with the page content while
          pulling to refresh, like the hero and tab content below it. */}
      <AnnouncementBanner announcements={announcements} style={pullContentStyle} />

      {/* iOS Hero Card: Title with SVG Cross (never shows as iOS emoji) */}
      <AppHero
        activeTab={activeTab}
        isAdmin={isAdmin}
        churchInfo={churchInfo}
        pullContentStyle={pullContentStyle}
        onOpenHeaderVerseEditor={() => setHeaderVerseModalOpen(true)}
        onOpenAdminPortal={() => openAdminWithTab('manage-events', null, false)}
        onTabChange={handleTabChange}
      />

      {/* Main Content Area */}
      <TabContent
        activeTab={activeTab}
        events={events}
        todayVerse={todayVerse}
        videos={videos}
        notifications={notifications}
        spotlightConfig={spotlightConfig}
        churchInfo={churchInfo}
        isAdmin={isAdmin}
        isLoading={isLoading}
        loadError={loadError}
        onRetryLoad={handleRetryLoad}
        retryingLoad={retryingLoad}
        pullContentStyle={pullContentStyle}
        onNavigateTab={setActiveTab}
        onOpenAdminPortal={openAdminWithTab}
        onOpenSpotlightEditor={() => setSpotlightModalOpen(true)}
        onOpenChurchInfoEditor={() => setChurchInfoModalOpen(true)}
        onRefresh={loadData}
        onSelectNotification={handleSelectNotification}
      />

      {/* Floating Glass Prayer Request Button (Home Only, Sticky Above Bottom Bar) */}
      {activeTab === 'home' && (
        <FloatingPrayerButton onOpen={() => setPrayerModalOpen(true)} />
      )}

      {/* Native iOS Bottom Tab Bar: Home, Events, Scripture, Video, Notifications */}
      <IosTabBar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        notificationCount={unreadCount}
        navRef={tabBarRef}
      />

      {/* Login Modal (shared: admins + members) */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={() => setLoginModalOpen(false)}
        onOpenRegister={() => {
          setLoginModalOpen(false);
          setRegisterModalOpen(true);
        }}
        onOpenForgotPassword={() => {
          setLoginModalOpen(false);
          setForgotPasswordModalOpen(true);
        }}
      />

      {/* Member Registration Modal */}
      <RegisterModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        onRegisterSuccess={() => setRegisterModalOpen(false)}
      />

      {/* Member Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={forgotPasswordModalOpen}
        onClose={() => setForgotPasswordModalOpen(false)}
      />

      {/* Spotlight / Holiday Hero Banner Customizer Modal */}
      {spotlightModalOpen && (
        <Suspense fallback={<div className={s.lazyFallback}><LoadingShimmer variant="lines" rows={3} className="max-w-md w-full" /></div>}>
          <SpotlightBannerModal
            isOpen={spotlightModalOpen}
            onClose={() => setSpotlightModalOpen(false)}
            initialConfig={spotlightConfig}
            events={events}
            churchInfo={churchInfo}
            onSaved={(updated) => {
              setSpotlightConfig(updated);
              try { localStorage.setItem('vrc_cached_spotlight', JSON.stringify(updated)); } catch {}
            }}
          />
        </Suspense>
      )}

      {/* Sanctuary Location & Weekly Worship Times Customizer Modal */}
      {churchInfoModalOpen && (
        <Suspense fallback={<div className={s.lazyFallback}><LoadingShimmer variant="lines" rows={3} className="max-w-md w-full" /></div>}>
          <EditChurchInfoModal
            isOpen={churchInfoModalOpen}
            onClose={() => setChurchInfoModalOpen(false)}
            churchInfo={churchInfo || DEFAULT_CHURCH_INFO}
            onSaved={(updated) => {
              setChurchInfo(updated);
              try { localStorage.setItem('vrc_cached_church_info', JSON.stringify(updated)); } catch {}
            }}
          />
        </Suspense>
      )}

      {/* Header Subtitle Verse Editor Modal */}
      {headerVerseModalOpen && (
        <Suspense fallback={<div className={s.lazyFallback}><LoadingShimmer variant="lines" rows={3} className="max-w-md w-full" /></div>}>
          <EditHeaderVerseModal
            isOpen={headerVerseModalOpen}
            onClose={() => setHeaderVerseModalOpen(false)}
            churchInfo={churchInfo || DEFAULT_CHURCH_INFO}
            onSaveSuccess={loadData}
          />
        </Suspense>
      )}

      {/* Admin Dashboard Modal */}
      {adminPortalOpen && (
        <Suspense fallback={<div className={s.lazyFallback}><LoadingShimmer variant="lines" rows={3} className="max-w-md w-full" /></div>}>
          <AdminPortal
            events={events}
            todayVerse={todayVerse}
            videos={videos}
            announcements={announcements}
            churchInfo={churchInfo}
            initialTab={adminPortalTab}
            focusedMode={adminFocusedMode}
            initialEvent={editingEvent}
            initialVideo={editingVideo}
            onClose={() => {
              setAdminPortalOpen(false);
              setEditingEvent(null);
              setEditingVideo(null);
            }}
            onRefreshData={loadData}
            onOpenSpotlightEditor={() => {
              setAdminPortalOpen(false);
              setSpotlightModalOpen(true);
            }}
            onOpenHeaderVerseEditor={() => {
              setAdminPortalOpen(false);
              setHeaderVerseModalOpen(true);
            }}
          />
        </Suspense>
      )}

      <AppFooter onNavigateTab={setActiveTab} />

      <NotificationToast
        notification={toastNotification}
        onDismiss={() => setToastNotification(null)}
      />

      <PrayerRequestModal
        isOpen={prayerModalOpen}
        onClose={() => setPrayerModalOpen(false)}
      />

      {/* Global Notifications Modal (desktop popup) */}
      <NotificationModal
        isOpen={showNotifModal}
        onClose={() => setShowNotifModal(false)}
        notifications={notifications}
        onRequestPermission={() => NotificationClient.requestPermission()}
        onSelectNotification={handleSelectNotification}
        isAdmin={isAdmin}
        onNotificationAdded={loadData}
        isLoading={isLoading}
        tabBarHeight={tabBarHeight}
        anchorRef={bellButtonRef}
      />

      {/* Event details opened from a notification tap */}
      <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />

      {/* Admin notice opened from a notification tap (no navigation) */}
      <AnnouncementDetailModal
        notification={selectedAnnouncement}
        onClose={() => setSelectedAnnouncement(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ChurchAppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}
