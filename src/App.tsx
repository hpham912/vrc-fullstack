import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './vrc-frontend/context/AuthContext.tsx';
import { LanguageProvider, useLanguage } from './vrc-frontend/context/LanguageContext.tsx';
import { Navbar } from './vrc-frontend/components/Navbar.tsx';
import { IosTabBar } from './vrc-frontend/components/IosTabBar.tsx';
import { DailyVerseCard } from './vrc-frontend/components/DailyVerseCard.tsx';
import { EventsSection } from './vrc-frontend/components/EventsSection.tsx';
import { ChurchInfoSection } from './vrc-frontend/components/ChurchInfoSection.tsx';
import { AdminPortal } from './vrc-frontend/components/AdminPortal.tsx';
import { AdminLoginModal } from './vrc-frontend/components/AdminLoginModal.tsx';
import { ChurchEvent, DailyVerse, Announcement, AppNotification } from './vrc-frontend/types/index.ts';
import { Plus, ArrowRight } from 'lucide-react';
import { apiUrl } from './vrc-frontend/utils/api.ts';
import { NotificationClient } from './vrc-frontend/services/notificationClient.ts';

function ChurchAppContent() {
  const { adminUser, isAdmin } = useAuth();
  const { language, t } = useLanguage();

  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [todayVerse, setTodayVerse] = useState<DailyVerse | null>(null);
  const [allVerses, setAllVerses] = useState<DailyVerse[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [adminPortalOpen, setAdminPortalOpen] = useState(false);
  const [adminPortalTab, setAdminPortalTab] = useState('create-event');

  const loadData = async () => {
    try {
      setLoading(true);
      const [eventsRes, todayVerseRes, versesRes, announcementsRes, notifs] =
        await Promise.all([
          fetch(apiUrl('/api/events')),
          fetch(apiUrl('/api/verses/today')),
          fetch(apiUrl('/api/verses')),
          fetch(apiUrl('/api/announcements')),
          NotificationClient.fetchRecent(),
        ]);

      if (eventsRes.ok) setEvents(await eventsRes.json());
      if (todayVerseRes.ok) setTodayVerse(await todayVerseRes.json());
      if (versesRes.ok) setAllVerses(await versesRes.json());
      if (announcementsRes.ok) setAnnouncements(await announcementsRes.json());
      setNotifications(notifs);
    } catch (err) {
      console.error('Error fetching church data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    NotificationClient.requestPermission();
  }, []);

  const openAdminWithTab = (tab = 'create-event') => {
    setAdminPortalTab(tab);
    setAdminPortalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-stone-900 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900 pb-20 md:pb-6">
      {/* iOS App Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openAdminPortal={() => openAdminWithTab('create-event')}
        openLoginModal={() => setLoginModalOpen(true)}
        notifications={notifications}
        onRequestNotificationPermission={() => NotificationClient.requestPermission()}
      />

      {/* iOS Hero Card: English Title on Top, Vietnamese at the bottom with smaller font */}
      <div className="bg-white border-b border-stone-200/60 py-6 sm:py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-2.5 sm:space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-700 text-[11px] sm:text-xs font-semibold tracking-wide">
            <span className="text-amber-600 font-serif">✝</span>
            <span>{t('heroLocation')}</span>
          </div>

          <div className="space-y-0.5 sm:space-y-1">
            <h1 className="text-xl sm:text-4xl lg:text-5xl font-serif font-bold text-stone-950 tracking-tight leading-tight">
              Vietnamese Revival Church
            </h1>
            <p className="text-xs sm:text-base font-serif text-amber-800 font-medium tracking-normal opacity-90">
              Hội Thánh Phục Hưng Việt Nam
            </p>
          </div>

          <p className="text-stone-500 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
            {t('heroSubtitle')}
          </p>

          {/* iOS Segmented Quick Action Switcher */}
          <div className="pt-1.5 flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center bg-stone-100/90 p-1 rounded-2xl border border-stone-200/80 shadow-2xs">
              <button
                onClick={() => setActiveTab('events')}
                className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                  activeTab === 'events'
                    ? 'bg-white text-stone-950 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                {t('heroUpcoming')}
              </button>
              <button
                onClick={() => setActiveTab('verse')}
                className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                  activeTab === 'verse'
                    ? 'bg-white text-stone-950 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                {t('heroScripture')}
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                  activeTab === 'about'
                    ? 'bg-white text-stone-950 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                {t('heroSchedule')}
              </button>
            </div>

            {isAdmin && (
              <button
                onClick={() => openAdminWithTab('create-event')}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-2xl text-xs font-semibold flex items-center gap-1 shadow-xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('heroAddEvent')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'events' && (
          <EventsSection
            events={events}
            isAdmin={isAdmin}
            onOpenAdminPortal={openAdminWithTab}
          />
        )}

        {activeTab === 'verse' && (
          <div>
            <DailyVerseCard
              todayVerse={todayVerse}
              allVerses={allVerses}
              isAdmin={isAdmin}
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

        {activeTab === 'about' && <ChurchInfoSection />}
      </main>

      {/* Native iOS Bottom Tab Bar */}
      <IosTabBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openAdminPortal={() => openAdminWithTab('create-event')}
        openLoginModal={() => setLoginModalOpen(true)}
      />

      {/* Admin Login Modal (Direct username/password: admin / Vrc2026) */}
      <AdminLoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={() => openAdminWithTab('create-event')}
      />

      {/* Admin Dashboard Modal */}
      {adminPortalOpen && (
        <AdminPortal
          events={events}
          allVerses={allVerses}
          announcements={announcements}
          initialTab={adminPortalTab}
          onClose={() => setAdminPortalOpen(false)}
          onRefreshData={loadData}
        />
      )}

      {/* Desktop Footer */}
      <footer className="hidden md:block bg-white border-t border-stone-200/80 py-8 px-4 text-stone-500 text-xs">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="font-serif font-bold text-stone-900 text-sm">
              Vietnamese Revival Church
            </span>
            <span className="hidden sm:inline text-stone-300">|</span>
            <span className="text-stone-500 text-xs">Hội Thánh Phục Hưng Việt Nam</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <button onClick={() => setActiveTab('events')} className="hover:text-stone-900 transition-colors">
              {t('navEvents')}
            </button>
            <button onClick={() => setActiveTab('verse')} className="hover:text-stone-900 transition-colors">
              {t('navVerse')}
            </button>
            <button onClick={() => setActiveTab('about')} className="hover:text-stone-900 transition-colors">
              {t('navAbout')}
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto mt-4 pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-stone-400 text-[11px]">
          <p>© {new Date().getFullYear()} Vietnamese Revival Church • Tempe, Arizona</p>
          <p>{t('footerPlatform')}</p>
        </div>
      </footer>
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
