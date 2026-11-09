import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './vrc-frontend/context/AuthContext.tsx';
import { LanguageProvider, useLanguage } from './vrc-frontend/context/LanguageContext.tsx';
import { CHURCH_NAME } from './vrc-frontend/constants/church.ts';
import { getHomeBannerSrc } from './vrc-frontend/constants/assets.ts';
import { APP_VERSION, APP_BUILD_DATE } from './vrc-frontend/constants/version.ts';
import { Navbar } from './vrc-frontend/components/nav-bar/Navbar.tsx';
import { IosTabBar } from './vrc-frontend/components/ios-tab-bar/IosTabBar.tsx';
import { HomeDashboard } from './vrc-frontend/components/home-dashboard/HomeDashboard.tsx';
import { EventsSection } from './vrc-frontend/components/events-section/EventsSection.tsx';
import { DailyVerseCard } from './vrc-frontend/components/daily-verse-card/DailyVerseCard.tsx';
import { NotificationsScreen } from './vrc-frontend/components/notifications-screen/NotificationsScreen.tsx';
import { AdminLoginModal } from './vrc-frontend/components/admin-login-modal/AdminLoginModal.tsx';
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
import { CrossIcon } from './vrc-frontend/components/cross-icon/CrossIcon.tsx';
import { Button, LoadingShimmer } from './vrc-frontend/common-component/index.ts';
import { ChurchEvent, DailyVerse, AppNotification, SpotlightBannerConfig, ChurchInfo, DEFAULT_CHURCH_INFO, DEFAULT_SPOTLIGHT, DEFAULT_HEADER_VERSE } from './vrc-frontend/types/index.ts';
import { Plus, ArrowRight, Pencil } from 'lucide-react';
import { apiUrl, apiHeaders } from './vrc-frontend/utils/api.ts';
import { NotificationClient } from './vrc-frontend/services/notificationClient.ts';
import {
  Home,
  Calendar,
  BookOpen,
  ShieldCheck,
  Bell,
  X,
  HeartHandshake,
} from 'lucide-react';
import { appStyles as s } from './App.styles.ts';

function ChurchAppContent() {
  const { isAdmin } = useAuth();
  const { language, t } = useLanguage();

  // Modern Home tab as default landing
  const [activeTab, setActiveTab] = useState('home');
  const [prayerModalOpen, setPrayerModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [todayVerse, setTodayVerse] = useState<DailyVerse | null>(null);
  const [allVerses, setAllVerses] = useState<DailyVerse[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toastNotification, setToastNotification] = useState<{ id?: any; title: string; body: string } | null>(null);

  // Hydrate spotlightConfig and churchInfo immediately from localStorage so edits never revert on refresh
  const [spotlightConfig, setSpotlightConfig] = useState<SpotlightBannerConfig | null>(() => {
    try {
      const cached = localStorage.getItem('vrc_cached_spotlight');
      if (cached) return JSON.parse(cached);
    } catch {}
    return DEFAULT_SPOTLIGHT;
  });

  const [churchInfo, setChurchInfo] = useState<ChurchInfo | null>(() => {
    try {
      const cached = localStorage.getItem('vrc_cached_church_info');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed) {
          if (!parsed.address || parsed.address.toLowerCase().includes('tempe, arizona') || parsed.address.toLowerCase() === 'tempe, az' || parsed.address.toLowerCase() === 'tempe az') {
            parsed.address = CHURCH_NAME.address;
          }
          return parsed;
        }
      }
    } catch {}
    return DEFAULT_CHURCH_INFO;
  });

  // Modals
  const [loginModalOpen, setLoginModalOpen] = useState(false);
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
  const [editingVerse, setEditingVerse] = useState<DailyVerse | null>(null);

  const loadData = async () => {
    try {
      const headers = apiHeaders();
      const [eventsRes, versesRes, spotlightRes, churchInfoRes, notifs] = await Promise.all([
        fetch(apiUrl('/api/events'), { cache: 'no-store', headers }),
        fetch(apiUrl('/api/verses'), { cache: 'no-store', headers }),
        fetch(apiUrl('/api/spotlight'), { cache: 'no-store', headers }),
        fetch(apiUrl('/api/church-info'), { cache: 'no-store', headers }),
        NotificationClient.fetchRecent(),
      ]);

      const safeJson = async (res: Response) => {
        if (!res || !res.ok) return null;
        const text = await res.text();
        if (!text) return null;
        try {
          return JSON.parse(text);
        } catch {
          return null;
        }
      };

      const [rawEvents, rawVerses, spotlightData, churchInfoData] = await Promise.all([
        safeJson(eventsRes),
        safeJson(versesRes),
        safeJson(spotlightRes),
        safeJson(churchInfoRes),
      ]);

      if (Array.isArray(rawEvents)) {
        setEvents(rawEvents);
      }

      if (Array.isArray(rawVerses)) {
        setAllVerses(rawVerses.slice(0, 10));
      }
      // Today's verse is the verse dated today, falling back to the latest
      // verse — the same rule GET /api/verses/today used, computed here from
      // the list we already fetched instead of a second request.
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
        now.getDate()
      ).padStart(2, '0')}`;
      const todayVerse = Array.isArray(rawVerses)
        ? rawVerses.find((verse) => verse.date === todayStr) || rawVerses[0] || null
        : null;
      setTodayVerse(todayVerse);

      if (spotlightData) {
        setSpotlightConfig(spotlightData);
        try { localStorage.setItem('vrc_cached_spotlight', JSON.stringify(spotlightData)); } catch {}
      }
      if (churchInfoData) {
        if (!churchInfoData.address || churchInfoData.address.toLowerCase().includes('tempe, arizona') || churchInfoData.address.toLowerCase() === 'tempe, az' || churchInfoData.address.toLowerCase() === 'tempe az') {
          churchInfoData.address = CHURCH_NAME.address;
        }
        setChurchInfo(churchInfoData);
        try { localStorage.setItem('vrc_cached_church_info', JSON.stringify(churchInfoData)); } catch {}
      }
      setNotifications(notifs);

      // Automatically schedule 1-hour before event reminders for all upcoming events
      if (Array.isArray(rawEvents) && rawEvents.length > 0) {
        NotificationClient.scheduleEventReminders(rawEvents);
      }
    } catch (err) {
      console.error('Error fetching church data from database:', err);
    } finally {
      // First load done — the screens stop showing the shimmer. Refreshes
      // keep showing the data they already have instead of flashing.
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Prompt permission so notifications are enabled by default
    NotificationClient.requestPermission().then((granted) => {
      if (granted && events.length > 0) {
        NotificationClient.scheduleEventReminders(events);
      }
    });

    // Check periodically (every 5 minutes) in case an event reaches the 1-hour reminder window while user is in the app
    const interval = setInterval(() => {
      if (events.length > 0) {
        NotificationClient.scheduleEventReminders(events);
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (events.length > 0) {
      NotificationClient.scheduleEventReminders(events);
    }
  }, [events]);

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

  const openAdminWithTab = (
    tab = 'create-event',
    eventToEdit?: ChurchEvent | null,
    verseToEdit?: DailyVerse | null,
    focused = true
  ) => {
    setAdminPortalTab(tab);
    setEditingEvent(eventToEdit || null);
    setEditingVerse(verseToEdit || null);
    setAdminFocusedMode(focused);
    setAdminPortalOpen(true);
  };

  const desktopNavItems = [
    { id: 'home', label: t('navHome'), icon: Home },
    { id: 'events', label: t('navEvents'), icon: Calendar },
    { id: 'verse', label: t('navVerse'), icon: BookOpen },
  ];

  return (
    <div className={s.pageWrapper}>
      {/* iOS App Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openAdminPortal={() => openAdminWithTab('admin-accounts', null, null, false)}
        openLoginModal={() => setLoginModalOpen(true)}
        notifications={notifications}
        onRequestNotificationPermission={() => NotificationClient.requestPermission()}
        onOpenNotifications={() => {
          setShowNotifModal((prev) => !prev);
          NotificationClient.requestPermission();
        }}
        isNotifOpen={showNotifModal}
      />

      {/* iOS Hero Card: Title with SVG Cross (never shows as iOS emoji) */}
      {/* Nav-only on non-Home tabs for non-admins: just enough top padding
          to clear the fixed header on mobile (no empty gap, nothing cut
          off); the desktop nav still shows on desktop. */}
      <div className={activeTab === 'home' || isAdmin ? s.heroSection : s.heroSectionNavOnly}>
        <div className={s.heroInner}>
          {activeTab === 'home' && (
            <>
          <div className={s.locationPill}>
            <CrossIcon className={s.locationIcon} />
            <span>{t('heroLocation')}</span>
          </div>

          <div className={s.titleWrapper}>
            <img
              src={getHomeBannerSrc(language, 'light')}
              alt={language === 'en' ? CHURCH_NAME.en : CHURCH_NAME.vi}
              className={`${s.homeBannerImg} dark:hidden`}
              onError={(e) => {
                // If the banner file is missing from the deployed build,
                // hide the broken image instead of showing a broken icon.
                e.currentTarget.style.display = 'none';
              }}
            />
            <img
              src={getHomeBannerSrc(language, 'dark')}
              alt={language === 'en' ? CHURCH_NAME.en : CHURCH_NAME.vi}
              className={`${s.homeBannerImg} hidden dark:block`}
              onError={(e) => {
                // If the dark banner file is missing from the deployed
                // build, fall back to the light banner for this language
                // instead of showing a broken image. Only swap once.
                const img = e.currentTarget;
                const fallback = getHomeBannerSrc(language, 'light');
                if (!img.src.endsWith(fallback)) {
                  img.src = fallback;
                } else {
                  img.style.display = 'none';
                }
              }}
            />
          </div>

          {/* Subtitle Scripture Verse chosen by Admin */}
          {(() => {
            const currentHeaderVerse = churchInfo?.headerVerse || DEFAULT_HEADER_VERSE;
            const verseText = language === 'en'
              ? (currentHeaderVerse.verseTextEn || currentHeaderVerse.verseTextVi)
              : (currentHeaderVerse.verseTextVi || currentHeaderVerse.verseTextEn);
            const verseRef = language === 'en'
              ? (currentHeaderVerse.referenceEn || currentHeaderVerse.referenceVi)
              : (currentHeaderVerse.referenceVi || currentHeaderVerse.referenceEn);

            return (
              <div className={s.heroVerseWrapper}>
                <p className={s.heroVerseQuote}>
                  "{verseText}"
                  <span className={s.heroVerseRef}>— {verseRef}</span>
                </p>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setHeaderVerseModalOpen(true)}
                    className={s.heroVerseEditBtn}
                    title={t('headerVerseEditBtn')}
                  >
                    <Pencil className="w-3 h-3" />
                    <span>{t('headerVerseEditBtn')}</span>
                  </button>
                )}
              </div>
            );
          })()}
            </>
          )}

          {/* Admin Dashboard Action Button */}
          {isAdmin && (
            <div className={s.adminBtnWrapper}>
              <Button
                type="button"
                variant="darkAmber"
                size="pillSm"
                onClick={() => openAdminWithTab('manage-events', null, null, false)}
                leftIcon={<ShieldCheck className={s.adminBtnIcon} />}
                title="Admin Dashboard"
              >
                <span>Admin Dashboard</span>
              </Button>
            </div>
          )}

          {/* Quick Segmented Navigation Switcher */}
          <nav className={s.desktopNav}>
            {desktopNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`${s.desktopNavItemBase} ${
                    isActive ? s.desktopNavItemActive : s.desktopNavItemInactive
                  }`}
                >
                  <Icon className={s.desktopNavIcon} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <main className={s.mainContent}>
        {activeTab === 'home' && (
          <HomeDashboard
            events={events}
            todayVerse={todayVerse}
            spotlightConfig={spotlightConfig}
            churchInfo={churchInfo}
            onNavigateTab={setActiveTab}
            onOpenAdminPortal={() => openAdminWithTab('create-event', null, null, true)}
            onOpenSpotlightEditor={() => setSpotlightModalOpen(true)}
            onOpenChurchInfoEditor={() => setChurchInfoModalOpen(true)}
            isAdmin={isAdmin}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'events' && (
          <EventsSection
            events={events}
            isAdmin={isAdmin}
            onRefresh={loadData}
            onOpenAdminPortal={openAdminWithTab}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'verse' && (
          <div>
            <DailyVerseCard
              todayVerse={todayVerse}
              allVerses={allVerses}
              isAdmin={isAdmin}
              onRefresh={loadData}
              onOpenAdminPortal={openAdminWithTab}
              isLoading={isLoading}
            />

            <div className="max-w-4xl mx-auto px-4 pb-12 text-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('events')}
                className="underline"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                <span>{t('appUpcomingHint')}</span>
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <NotificationsScreen
            notifications={notifications}
            onSelectNotification={handleSelectNotification}
            isAdmin={isAdmin}
            onNotificationAdded={loadData}
            isLoading={isLoading}
          />
        )}
      </main>

      {/* Floating Glass Prayer Request Button (Home Only, Sticky Above Bottom Bar) */}
      {activeTab === 'home' && (
        <button
          type="button"
          onClick={() => setPrayerModalOpen(true)}
          className={s.floatingPrayerBtn}
          title={t('prayerRequestTitle')}
          aria-label={t('navPrayer')}
        >
          <div className={s.floatingPrayerIconBox}>
            <HeartHandshake className={s.floatingPrayerIcon} />
          </div>
          <span className={s.floatingPrayerText}>
            {t('navPrayer')}
          </span>
        </button>
      )}

      {/* Native iOS Bottom Tab Bar: Exactly Home, Events, Scripture, Notifications */}
      <IosTabBar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        hasNotifications={notifications.length > 0}
        navRef={tabBarRef}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={() => setLoginModalOpen(false)}
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
            allVerses={allVerses}
            onSaveSuccess={loadData}
          />
        </Suspense>
      )}

      {/* Admin Dashboard Modal */}
      {adminPortalOpen && (
        <Suspense fallback={<div className={s.lazyFallback}><LoadingShimmer variant="lines" rows={3} className="max-w-md w-full" /></div>}>
          <AdminPortal
            events={events}
            allVerses={allVerses}
            churchInfo={churchInfo}
            initialTab={adminPortalTab}
            focusedMode={adminFocusedMode}
            initialEvent={editingEvent}
            initialVerse={editingVerse}
            onClose={() => {
              setAdminPortalOpen(false);
              setEditingEvent(null);
              setEditingVerse(null);
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

      {/* Desktop Footer */}
      <footer className={s.desktopFooter}>
        <div className={s.footerTopRow}>
          <div className={s.footerBrandGroup}>
            <span className={s.footerBrandEn}>
              <CrossIcon className={s.locationIcon} />
              <span>{CHURCH_NAME.en}</span>
            </span>
            <span className={s.footerBrandDivider}>|</span>
            <span className={s.footerBrandVi}>{CHURCH_NAME.vi}</span>
          </div>

          <div className={s.footerLinksGroup}>
            <button onClick={() => setActiveTab('home')} className={s.footerLinkBtn}>
              {t('navHome')}
            </button>
            <button onClick={() => setActiveTab('events')} className={s.footerLinkBtn}>
              {t('navEvents')}
            </button>
            <button onClick={() => setActiveTab('verse')} className={s.footerLinkBtn}>
              {t('navVerse')}
            </button>
          </div>
        </div>

        <div className={s.footerBottomRow}>
          <p>© {new Date().getFullYear()} {CHURCH_NAME.en} • Tempe, Arizona</p>
          <div className={s.footerMetaRight}>
            <p>{t('footerPlatform')}</p>
            <span className={s.footerDot}>•</span>
            <span className={s.footerVersion}>v{APP_VERSION} ({APP_BUILD_DATE})</span>
          </div>
        </div>
      </footer>

      {/* Mobile Subtle Version Indicator */}
      <div className={s.mobileVersionBar}>
        v{APP_VERSION} • {APP_BUILD_DATE}
      </div>

      {/* Real-time In-App Notification Toast for Web/Browser */}
      {toastNotification && (
        <div className="fixed top-4 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-[9999] bg-stone-900/95 backdrop-blur-md text-white border border-amber-500/40 rounded-2xl p-3.5 shadow-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0 mt-0.5">
            <Bell className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-caption font-bold uppercase tracking-wider text-amber-400">
                {t('notifReminderTitle')}
              </span>
              <span className="text-caption text-stone-400">VRC</span>
            </div>
            <h4 className="font-bold text-xs sm:text-sm text-white line-clamp-1 mt-0.5">
              {toastNotification.title}
            </h4>
            <p className="text-xs text-stone-300 line-clamp-2 mt-0.5">
              {toastNotification.body}
            </p>
          </div>
          <button
            onClick={() => setToastNotification(null)}
            className="text-stone-400 hover:text-white p-1 rounded-lg"
            title="Đóng / Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
