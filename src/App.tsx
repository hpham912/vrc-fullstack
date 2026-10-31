import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { AnnouncementBar } from './components/AnnouncementBar.tsx';
import { DailyVerseCard } from './components/DailyVerseCard.tsx';
import { EventsSection } from './components/EventsSection.tsx';
import { ChurchInfoSection } from './components/ChurchInfoSection.tsx';
import { AdminPortal } from './components/AdminPortal.tsx';
import { ChurchEvent, DailyVerse, Announcement } from './types.ts';
import {
  Calendar,
  BookOpen,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Clock,
  MapPin,
  Plus,
} from 'lucide-react';

function ChurchAppContent() {
  const { user, isAdmin, signInWithGoogle } = useAuth();

  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [todayVerse, setTodayVerse] = useState<DailyVerse | null>(null);
  const [allVerses, setAllVerses] = useState<DailyVerse[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // Admin Modal
  const [adminPortalOpen, setAdminPortalOpen] = useState(false);
  const [adminPortalTab, setAdminPortalTab] = useState('create-event');

  const loadData = async () => {
    try {
      setLoading(true);
      const [eventsRes, todayVerseRes, versesRes, announcementsRes] =
        await Promise.all([
          fetch('/api/events'),
          fetch('/api/verses/today'),
          fetch('/api/verses'),
          fetch('/api/announcements'),
        ]);

      if (eventsRes.ok) setEvents(await eventsRes.json());
      if (todayVerseRes.ok) setTodayVerse(await todayVerseRes.json());
      if (versesRes.ok) setAllVerses(await versesRes.json());
      if (announcementsRes.ok) setAnnouncements(await announcementsRes.json());
    } catch (err) {
      console.error('Error fetching church data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAdminWithTab = (tab = 'create-event') => {
    setAdminPortalTab(tab);
    setAdminPortalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-stone-900 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Top Announcements */}
      <AnnouncementBar announcements={announcements} />

      {/* Main Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openAdminPortal={() => openAdminWithTab('create-event')}
      />

      {/* Modern, Airy Hero Banner */}
      <div className="relative overflow-hidden bg-white border-b border-stone-200/70 py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-800 text-xs font-semibold tracking-wide">
            <span className="text-amber-600 font-serif">✝</span>
            <span>Hội Thánh Phục Hưng Việt Nam</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-stone-900 tracking-tight leading-tight">
            Vietnamese Revival Church
          </h1>

          <p className="text-stone-500 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            A welcoming community of faith, worshipping God, growing together in Scripture, and serving our community.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setActiveTab('events')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'events'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-800 hover:bg-stone-200'
              }`}
            >
              Upcoming Events
            </button>
            <button
              onClick={() => setActiveTab('verse')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'verse'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-800 hover:bg-stone-200'
              }`}
            >
              Daily Scripture
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'about'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-800 hover:bg-stone-200'
              }`}
            >
              Service Times
            </button>

            {isAdmin && (
              <button
                onClick={() => openAdminWithTab('create-event')}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Event
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content View */}
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

            {/* Subtle banner to jump to events */}
            <div className="max-w-4xl mx-auto px-4 pb-16 text-center">
              <button
                onClick={() => setActiveTab('events')}
                className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-900 underline"
              >
                <span>View scheduled worship services & gatherings</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'about' && <ChurchInfoSection />}
      </main>

      {/* Admin Portal Modal */}
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

      {/* Clean Minimalist Footer */}
      <footer className="bg-white border-t border-stone-200/80 py-12 px-4 sm:px-6 lg:px-8 mt-12 text-stone-500 text-xs">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <span className="font-serif text-lg font-bold text-stone-900">
              Vietnamese Revival Church
            </span>
            <span className="text-stone-300">|</span>
            <span className="text-stone-600">Hội Thánh Phục Hưng</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('events')}
              className="hover:text-stone-900 transition-colors"
            >
              Events
            </button>
            <button
              onClick={() => setActiveTab('verse')}
              className="hover:text-stone-900 transition-colors"
            >
              Daily Bread
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className="hover:text-stone-900 transition-colors"
            >
              Services
            </button>
            {isAdmin ? (
              <button
                onClick={() => openAdminWithTab('create-event')}
                className="text-amber-800 font-semibold hover:underline"
              >
                Admin Dashboard
              </button>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="text-stone-600 hover:text-stone-900 font-medium"
              >
                Admin Login
              </button>
            )}
          </div>
        </div>

        <div className="max-w-5xl mx-auto mt-6 pt-6 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-stone-400 text-[11px]">
          <p>© {new Date().getFullYear()} Vietnamese Revival Church. All rights reserved.</p>
          <p>Reliable PostgreSQL Storage • Google Cloud Run</p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ChurchAppContent />
    </AuthProvider>
  );
}
