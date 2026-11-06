import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './vrc-frontend/context/AuthContext.tsx';
import { LanguageProvider, useLanguage } from './vrc-frontend/context/LanguageContext.tsx';
import { CHURCH_NAME } from './vrc-frontend/constants/church.ts';
import { APP_VERSION, APP_BUILD_DATE } from './vrc-frontend/constants/version.ts';
import { Navbar } from './vrc-frontend/components/Navbar.tsx';
import { IosTabBar } from './vrc-frontend/components/IosTabBar.tsx';
import { HomeDashboard } from './vrc-frontend/components/HomeDashboard.tsx';
import { EventsSection } from './vrc-frontend/components/EventsSection.tsx';
import { DailyVerseCard } from './vrc-frontend/components/DailyVerseCard.tsx';
import { YouthSection } from './vrc-frontend/components/YouthSection.tsx';
import { AdminPortal } from './vrc-frontend/components/AdminPortal.tsx';
import { AdminLoginModal } from './vrc-frontend/components/AdminLoginModal.tsx';
import { SpotlightBannerModal } from './vrc-frontend/components/SpotlightBannerModal.tsx';
import { EditChurchInfoModal } from './vrc-frontend/components/EditChurchInfoModal.tsx';
import { PrayerRequestModal } from './vrc-frontend/components/PrayerRequestModal.tsx';
import { CrossIcon } from './vrc-frontend/components/CrossIcon.tsx';
import { ChurchEvent, DailyVerse, Announcement, AppNotification, SpotlightBannerConfig, ChurchInfo, DEFAULT_CHURCH_INFO, DEFAULT_SPOTLIGHT } from './vrc-frontend/types/index.ts';
import { Plus, ArrowRight } from 'lucide-react';
import { apiUrl, apiHeaders } from './vrc-frontend/utils/api.ts';
import { NotificationClient } from './vrc-frontend/services/notificationClient.ts';
import {
  Home,
  Calendar,
  BookOpen,
  Flame,
  ShieldCheck,
} from 'lucide-react';

function ChurchAppContent() {
  const { adminUser, isAdmin } = useAuth();
  const { language, t } = useLanguage();

  // Modern Home tab as default landing
  const [activeTab, setActiveTab] = useState('home');
  const [prayerModalOpen, setPrayerModalOpen] = useState(false);
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [todayVerse, setTodayVerse] = useState<DailyVerse | null>(null);
  const [allVerses, setAllVerses] = useState<DailyVerse[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

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

  const [loading, setLoading] = useState(true);

  // Modals
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [adminPortalOpen, setAdminPortalOpen] = useState(false);
  const [spotlightModalOpen, setSpotlightModalOpen] = useState(false);
  const [churchInfoModalOpen, setChurchInfoModalOpen] = useState(false);
  const [adminPortalTab, setAdminPortalTab] = useState('create-event');
  const [adminFocusedMode, setAdminFocusedMode] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ChurchEvent | null>(null);
  const [editingVerse, setEditingVerse] = useState<DailyVerse | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const headers = apiHeaders();
      const [eventsRes, todayVerseRes, versesRes, spotlightRes, churchInfoRes, notifs] =
        await Promise.all([
          fetch(apiUrl('/api/events'), { cache: 'no-store', headers }),
          fetch(apiUrl('/api/verses/today'), { cache: 'no-store', headers }),
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

      const [rawEvents, todayVerseData, rawVerses, spotlightData, churchInfoData] =
        await Promise.all([
          safeJson(eventsRes),
          safeJson(todayVerseRes),
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
      setTodayVerse(todayVerseData || (Array.isArray(rawVerses) ? rawVerses[0] : null));

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
    } catch (err) {
      console.error('Error fetching church data from database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    NotificationClient.requestPermission();
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
    { id: 'youth', label: t('navYouth'), icon: Flame },
  ];

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-stone-900 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900 pb-20 md:pb-6 w-full max-w-full overflow-x-hidden min-w-0">
      {/* iOS App Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openAdminPortal={() => openAdminWithTab('admin-accounts', null, null, false)}
        openLoginModal={() => setLoginModalOpen(true)}
        notifications={notifications}
        onRequestNotificationPermission={() => NotificationClient.requestPermission()}
        onOpenPrayerModal={() => setPrayerModalOpen(true)}
      />

      {/* iOS Hero Card: Title with SVG Cross (never shows as iOS emoji) */}
      <div className="bg-white border-b border-stone-200/60 pt-[calc(4.75rem+env(safe-area-inset-top,0px))] sm:pt-28 pb-6 sm:pb-9 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-3 sm:space-y-3.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-700 text-[11px] sm:text-xs font-semibold tracking-wide">
            <CrossIcon className="w-3.5 h-3.5 text-amber-600" />
            <span>{t('heroLocation')}</span>
          </div>

          <div className="space-y-0.5 sm:space-y-1 pt-0.5">
            <h1 className="text-xl sm:text-4xl lg:text-5xl font-serif font-bold text-stone-950 tracking-tight leading-tight">
              {language === 'en' ? CHURCH_NAME.en : CHURCH_NAME.vi}
            </h1>
          </div>

          <p className="text-stone-700 font-medium text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
            {t('heroSubtitle')}
          </p>

          {/* Admin Dashboard Action Button - Concise with Logged-in Username */}
          {isAdmin && (
            <div className="pt-1.5 sm:pt-2 flex items-center justify-center">
              <button
                onClick={() => openAdminWithTab('manage-events', null, null, false)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
                title="Admin Dashboard"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-200 flex-shrink-0" />
                <span>Admin Dashboard ({adminUser?.displayName || adminUser?.username || 'Admin'})</span>
              </button>
            </div>
          )}

          {/* Quick Segmented Navigation Switcher */}
          <nav className="hidden md:flex items-center w-fit mx-auto bg-stone-100/80 p-1 rounded-2xl border border-stone-200/60 mt-2 sm:mt-3">
            {desktopNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-white text-stone-950 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 opacity-75" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-full overflow-x-clip min-w-0">
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
          />
        )}

        {activeTab === 'events' && (
          <EventsSection
            events={events}
            isAdmin={isAdmin}
            onRefresh={loadData}
            onOpenAdminPortal={openAdminWithTab}
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
            />

            <div className="max-w-4xl mx-auto px-4 pb-12 text-center">
              <button
                onClick={() => setActiveTab('events')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-950 underline active:scale-95 transition-transform"
              >
                <span>{language === 'vi' ? 'Xem các buổi thờ phượng và sinh hoạt sắp tới' : 'View scheduled worship services & gatherings'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'youth' && (
          <YouthSection
            events={events}
            isAdmin={isAdmin}
            onOpenAdminPortal={openAdminWithTab}
          />
        )}
      </main>

      {/* Native iOS Bottom Tab Bar: Exactly Home, Events, Scripture, Youth (no signin button next to schedule) */}
      <IosTabBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={() => setLoginModalOpen(false)}
      />

      {/* Spotlight / Holiday Hero Banner Customizer Modal */}
      {spotlightModalOpen && (
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
      )}

      {/* Sanctuary Location & Weekly Worship Times Customizer Modal */}
      {churchInfoModalOpen && (
        <EditChurchInfoModal
          isOpen={churchInfoModalOpen}
          onClose={() => setChurchInfoModalOpen(false)}
          churchInfo={churchInfo || DEFAULT_CHURCH_INFO}
          onSaved={(updated) => {
            setChurchInfo(updated);
            try { localStorage.setItem('vrc_cached_church_info', JSON.stringify(updated)); } catch {}
          }}
        />
      )}

      {/* Admin Dashboard Modal */}
      {adminPortalOpen && (
        <AdminPortal
          events={events}
          allVerses={allVerses}
          announcements={announcements}
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
        />
      )}

      {/* Desktop Footer */}
      <footer className="hidden md:block bg-white border-t border-stone-200/80 py-8 px-4 text-stone-600 text-xs font-medium">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="font-serif font-bold text-stone-900 text-sm flex items-center gap-1.5">
              <CrossIcon className="w-3.5 h-3.5 text-amber-600" />
              <span>{CHURCH_NAME.en}</span>
            </span>
            <span className="hidden sm:inline text-stone-400">|</span>
            <span className="text-stone-700 text-xs font-semibold">{CHURCH_NAME.vi}</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-stone-700">
            <button onClick={() => setActiveTab('home')} className="hover:text-stone-950 transition-colors">
              {t('navHome')}
            </button>
            <button onClick={() => setActiveTab('events')} className="hover:text-stone-950 transition-colors">
              {t('navEvents')}
            </button>
            <button onClick={() => setActiveTab('verse')} className="hover:text-stone-950 transition-colors">
              {t('navVerse')}
            </button>
            <button onClick={() => setActiveTab('youth')} className="hover:text-stone-950 transition-colors">
              {t('navYouth')}
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto mt-4 pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-stone-600 text-[11px] font-medium">
          <p>© {new Date().getFullYear()} {CHURCH_NAME.en} • Tempe, Arizona</p>
          <div className="flex items-center gap-2">
            <p>{t('footerPlatform')}</p>
            <span className="text-stone-300">•</span>
            <span className="text-stone-500 font-mono text-[10px]">v{APP_VERSION} ({APP_BUILD_DATE})</span>
          </div>
        </div>
      </footer>

      {/* Mobile Subtle Version Indicator */}
      <div className="md:hidden py-3 text-center text-[10px] text-stone-500 font-mono select-none">
        v{APP_VERSION} • {APP_BUILD_DATE}
      </div>

      <PrayerRequestModal
        isOpen={prayerModalOpen}
        onClose={() => setPrayerModalOpen(false)}
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
