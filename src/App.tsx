import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { AnnouncementBar } from './components/AnnouncementBar.tsx';
import { DailyVerseCard } from './components/DailyVerseCard.tsx';
import { EventsSection } from './components/EventsSection.tsx';
import { EventRsvpModal } from './components/EventRsvpModal.tsx';
import { PrayerWallSection } from './components/PrayerWallSection.tsx';
import { ChurchInfoSection } from './components/ChurchInfoSection.tsx';
import { AdminPortal } from './components/AdminPortal.tsx';
import { ChurchEvent, DailyVerse, Announcement, PrayerRequest } from './types.ts';
import {
  Church,
  Calendar,
  BookOpen,
  Heart,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  MapPin,
  Clock,
  Phone,
  Mail,
} from 'lucide-react';

function ChurchAppContent() {
  const { user, isAdmin, signInWithGoogle } = useAuth();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState('events');

  // App data state
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [todayVerse, setTodayVerse] = useState<DailyVerse | null>(null);
  const [allVerses, setAllVerses] = useState<DailyVerse[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedEventForRsvp, setSelectedEventForRsvp] = useState<ChurchEvent | null>(null);
  const [adminPortalOpen, setAdminPortalOpen] = useState(false);
  const [adminPortalTab, setAdminPortalTab] = useState('create-event');

  // Load all initial data from PostgreSQL backend
  const loadData = async () => {
    try {
      setLoading(true);

      const [eventsRes, todayVerseRes, versesRes, announcementsRes, prayersRes] =
        await Promise.all([
          fetch('/api/events'),
          fetch('/api/verses/today'),
          fetch('/api/verses'),
          fetch('/api/announcements'),
          fetch('/api/prayers'),
        ]);

      if (eventsRes.ok) setEvents(await eventsRes.json());
      if (todayVerseRes.ok) setTodayVerse(await todayVerseRes.json());
      if (versesRes.ok) setAllVerses(await versesRes.json());
      if (announcementsRes.ok) setAnnouncements(await announcementsRes.json());
      if (prayersRes.ok) setPrayers(await prayersRes.json());
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
    <div className="min-h-screen bg-stone-100/70 text-stone-900 flex flex-col font-sans selection:bg-amber-200 selection:text-amber-900">
      {/* Top Banner Notice */}
      <AnnouncementBar
        announcements={announcements}
        onSelectEvent={(id) => {
          setActiveTab('events');
        }}
      />

      {/* Main Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openAdminPortal={() => openAdminWithTab('create-event')}
      />

      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-b from-stone-900 via-stone-900 to-stone-850 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-stone-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Grace & Truth Community Church</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight text-white leading-tight">
              A Church Rooted in Grace, Living in Truth.
            </h1>
            <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
              Explore our upcoming worship gatherings, be inspired with today's Scripture reflection, and connect with our prayer community.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
              <button
                onClick={() => setActiveTab('events')}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                View Church Events
              </button>
              <button
                onClick={() => setActiveTab('verse')}
                className="px-5 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white font-semibold text-xs sm:text-sm rounded-xl border border-stone-700 transition-colors flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4 text-amber-400" />
                Read Today's Verse
              </button>

              {!isAdmin && (
                <button
                  onClick={signInWithGoogle}
                  className="px-4 py-2.5 text-stone-400 hover:text-amber-300 text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Admin Login
                </button>
              )}
            </div>
          </div>

          {/* Quick Service Times Card in Hero */}
          <div className="bg-stone-800/90 rounded-2xl p-6 border border-stone-700/80 max-w-sm w-full space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-700 pb-2">
              <span className="text-xs uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Sunday Services
              </span>
              <span className="text-[11px] text-stone-400">All Welcome</span>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <p className="font-semibold text-white">Classic Morning Worship</p>
                <p className="text-stone-400">Sundays at 9:00 AM • Sanctuary</p>
              </div>
              <div>
                <p className="font-semibold text-white">Contemporary Celebration & Sunday School</p>
                <p className="text-stone-400">Sundays at 11:00 AM • Sanctuary & Stream</p>
              </div>
              <div className="pt-2 border-t border-stone-700/60">
                <p className="text-stone-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>742 Evergreen Terrace, Springfield</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabbed Content Area */}
      <main className="flex-1">
        {activeTab === 'verse' && (
          <div>
            <DailyVerseCard
              todayVerse={todayVerse}
              allVerses={allVerses}
              isAdmin={isAdmin}
              onOpenAdminPortal={openAdminWithTab}
            />

            {/* Quick Link to Events from Verse Page */}
            <div className="max-w-5xl mx-auto px-4 pb-12">
              <div className="p-6 bg-white rounded-2xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div>
                  <h4 className="font-serif font-bold text-stone-900 text-lg">
                    Looking for upcoming church gatherings?
                  </h4>
                  <p className="text-xs sm:text-sm text-stone-600">
                    See what's happening this week across worship, youth groups, and community outreach.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('events')}
                  className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 self-start sm:self-auto transition-colors"
                >
                  <span>Explore Calendar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <EventsSection
            events={events}
            isAdmin={isAdmin}
            onRsvpClick={(evt) => setSelectedEventForRsvp(evt)}
            onOpenAdminPortal={openAdminWithTab}
          />
        )}

        {activeTab === 'prayers' && (
          <PrayerWallSection
            prayers={prayers}
            onPrayerAdded={loadData}
          />
        )}

        {activeTab === 'about' && <ChurchInfoSection />}
      </main>

      {/* RSVP Modal */}
      {selectedEventForRsvp && (
        <EventRsvpModal
          event={selectedEventForRsvp}
          onClose={() => setSelectedEventForRsvp(null)}
          onRsvpSuccess={loadData}
        />
      )}

      {/* Admin Management Portal Modal */}
      {adminPortalOpen && (
        <AdminPortal
          events={events}
          allVerses={allVerses}
          announcements={announcements}
          prayers={prayers}
          initialTab={adminPortalTab}
          onClose={() => setAdminPortalOpen(false)}
          onRefreshData={loadData}
        />
      )}

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 py-12 px-4 sm:px-6 lg:px-8 border-t border-stone-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5 text-white">
              <Church className="w-6 h-6 text-amber-500" />
              <span className="font-serif text-xl font-bold">
                Grace & Truth Community Church
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-400 max-w-md leading-relaxed">
              Dedicated to sharing the love of God, building authentic disciples of Jesus Christ, and serving our local community with compassion and grace.
            </p>
            <p className="text-xs text-amber-400/90 font-serif italic pt-1">
              "For by grace you have been saved through faith. And this is not your own doing; it is the gift of God." — Ephesians 2:8
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Quick Links
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button
                  onClick={() => setActiveTab('events')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Events Calendar & RSVPs
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('verse')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Daily Scripture & Devotionals
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('prayers')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Prayer Requests & Praise Wall
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('about')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Service Times & Directions
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Administration & Database
            </h4>
            <p className="text-xs text-stone-400">
              Powered by Cloud SQL PostgreSQL and Firebase Auth on Google Cloud.
            </p>
            {isAdmin ? (
              <button
                onClick={() => openAdminWithTab('create-event')}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-lg transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Open Admin Portal
              </button>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs rounded-lg transition-colors border border-stone-700"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                Admin Portal Login
              </button>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-2">
          <p>© {new Date().getFullYear()} Grace & Truth Church. All rights reserved.</p>
          <p>Reliable PostgreSQL Cloud Storage • Free Cloud Run Hosting</p>
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
