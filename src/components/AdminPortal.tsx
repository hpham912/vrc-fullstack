import React, { useState } from 'react';
import { ChurchEvent, DailyVerse, Announcement, PrayerRequest } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Calendar,
  BookOpen,
  Bell,
  Heart,
  PlusCircle,
  Trash2,
  Edit3,
  Users,
  Sparkles,
  Check,
  AlertCircle,
  X,
  Clock,
  MapPin,
  Save,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface AdminPortalProps {
  events: ChurchEvent[];
  allVerses: DailyVerse[];
  announcements: Announcement[];
  prayers: PrayerRequest[];
  initialTab?: string;
  onClose: () => void;
  onRefreshData: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  events,
  allVerses,
  announcements,
  prayers,
  initialTab = 'create-event',
  onClose,
  onRefreshData,
}) => {
  const { user, getToken } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);

  // Status message
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Event Form State
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventCategory, setEventCategory] = useState('Worship');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventStartTime, setEventStartTime] = useState('10:00 AM');
  const [eventEndTime, setEventEndTime] = useState('11:30 AM');
  const [eventLocation, setEventLocation] = useState('Main Sanctuary');
  const [eventAddress, setEventAddress] = useState('742 Evergreen Terrace');
  const [eventCapacity, setEventCapacity] = useState('200');
  const [eventIsFeatured, setEventIsFeatured] = useState(false);
  const [eventOrganizer, setEventOrganizer] = useState(user?.displayName || 'Church Pastoral Team');
  const [eventOrganizerEmail, setEventOrganizerEmail] = useState(user?.email || 'pastor@gracetruthchurch.org');

  // Selected event for RSVP attendee inspection
  const [inspectingEvent, setInspectingEvent] = useState<ChurchEvent | null>(null);

  // Daily Verse Form State
  const [verseDate, setVerseDate] = useState(new Date().toISOString().split('T')[0]);
  const [verseReference, setVerseReference] = useState('');
  const [verseText, setVerseText] = useState('');
  const [verseTranslation, setVerseTranslation] = useState('NIV');
  const [verseReflection, setVerseReflection] = useState('');
  const [versePrayer, setVersePrayer] = useState('');
  const [verseTheme, setVerseTheme] = useState('Faith & Hope');
  const [generatingAi, setGeneratingAi] = useState(false);

  // Announcement Form State
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceContent, setAnnounceContent] = useState('');
  const [announcePriority, setAnnouncePriority] = useState('normal');
  const [announceLinkUrl, setAnnounceLinkUrl] = useState('');
  const [announceLinkText, setAnnounceLinkText] = useState('');

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Reset event form
  const resetEventForm = () => {
    setEditingEventId(null);
    setEventTitle('');
    setEventDescription('');
    setEventCategory('Worship');
    setEventDate(new Date().toISOString().split('T')[0]);
    setEventStartTime('10:00 AM');
    setEventEndTime('11:30 AM');
    setEventLocation('Main Sanctuary');
    setEventAddress('742 Evergreen Terrace');
    setEventCapacity('200');
    setEventIsFeatured(false);
  };

  // Populate form for editing event
  const handleEditEvent = (evt: ChurchEvent) => {
    setEditingEventId(evt.id);
    setEventTitle(evt.title);
    setEventDescription(evt.description);
    setEventCategory(evt.category);
    setEventDate(evt.date);
    setEventStartTime(evt.startTime);
    setEventEndTime(evt.endTime || '');
    setEventLocation(evt.location);
    setEventAddress(evt.address || '');
    setEventCapacity(evt.maxCapacity ? String(evt.maxCapacity) : '');
    setEventIsFeatured(evt.isFeatured);
    setEventOrganizer(evt.organizerName || '');
    setEventOrganizerEmail(evt.organizerEmail || '');
    setActiveTab('create-event');
  };

  // Submit Event (Create or Update)
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventDescription.trim() || !eventDate || !eventStartTime || !eventLocation) {
      showFeedback('error', 'Please fill in all required event details.');
      return;
    }

    try {
      setSubmitting(true);
      const token = await getToken();
      const payload = {
        title: eventTitle.trim(),
        description: eventDescription.trim(),
        category: eventCategory,
        date: eventDate,
        startTime: eventStartTime,
        endTime: eventEndTime || null,
        location: eventLocation.trim(),
        address: eventAddress.trim() || null,
        maxCapacity: eventCapacity ? Number(eventCapacity) : null,
        isFeatured: eventIsFeatured,
        organizerName: eventOrganizer.trim(),
        organizerEmail: eventOrganizerEmail.trim(),
      };

      const url = editingEventId ? `/api/events/${editingEventId}` : '/api/events';
      const method = editingEventId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save event');
      }

      showFeedback('success', editingEventId ? 'Event updated successfully in PostgreSQL!' : 'New church event posted successfully!');
      resetEventForm();
      onRefreshData();
      setActiveTab('manage-events');
    } catch (err: any) {
      showFeedback('error', err.message || 'Error saving event.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete event
  const handleDeleteEvent = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this event from the church calendar?')) return;

    try {
      const token = await getToken();
      const res = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to delete event');
      showFeedback('success', 'Event successfully removed.');
      onRefreshData();
    } catch (err: any) {
      showFeedback('error', err.message || 'Error deleting event.');
    }
  };

  // Inspect event RSVPs
  const handleInspectRsvps = async (evt: ChurchEvent) => {
    try {
      const res = await fetch(`/api/events/${evt.id}`);
      if (res.ok) {
        const fullEvent = await res.json();
        setInspectingEvent(fullEvent);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Generate devotional draft with AI
  const handleAiDraftDevotional = async () => {
    if (!verseReference.trim()) {
      showFeedback('error', 'Please enter a Scripture reference (e.g. "Romans 8:28" or "Psalm 46:1-3") first.');
      return;
    }

    try {
      setGeneratingAi(true);
      const token = await getToken();
      const res = await fetch('/api/ai/generate-devotional', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          passage: verseReference.trim(),
          theme: verseTheme || 'Grace & Guidance',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'AI generation failed');
      }

      const generated = await res.json();
      if (generated.verseText) setVerseText(generated.verseText);
      if (generated.reflection) setVerseReflection(generated.reflection);
      if (generated.prayer) setVersePrayer(generated.prayer);
      if (generated.theme) setVerseTheme(generated.theme);

      showFeedback('success', 'Devotional draft prepared! Review and save below.');
    } catch (err: any) {
      showFeedback('error', err.message || 'Error generating devotional draft.');
    } finally {
      setGeneratingAi(false);
    }
  };

  // Save Daily Verse
  const handleSaveVerse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verseDate || !verseReference.trim() || !verseText.trim() || !verseReflection.trim()) {
      showFeedback('error', 'Please fill in date, reference, verse text, and reflection.');
      return;
    }

    try {
      setSubmitting(true);
      const token = await getToken();
      const res = await fetch('/api/verses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: verseDate,
          reference: verseReference.trim(),
          verseText: verseText.trim(),
          translation: verseTranslation,
          reflection: verseReflection.trim(),
          prayer: versePrayer.trim() || null,
          theme: verseTheme.trim() || 'Daily Devotion',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save daily verse');
      }

      showFeedback('success', 'Daily Scripture & Devotional saved in PostgreSQL!');
      onRefreshData();
    } catch (err: any) {
      showFeedback('error', err.message || 'Error saving daily verse.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete verse
  const handleDeleteVerse = async (id: number) => {
    if (!window.confirm('Delete this daily devotional from PostgreSQL?')) return;
    try {
      const token = await getToken();
      const res = await fetch(`/api/verses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete verse');
      showFeedback('success', 'Verse deleted.');
      onRefreshData();
    } catch (err: any) {
      showFeedback('error', err.message || 'Error deleting verse');
    }
  };

  // Save Announcement
  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announceTitle.trim() || !announceContent.trim()) {
      showFeedback('error', 'Title and announcement content required.');
      return;
    }

    try {
      setSubmitting(true);
      const token = await getToken();
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: announceTitle.trim(),
          content: announceContent.trim(),
          priority: announcePriority,
          linkUrl: announceLinkUrl.trim() || null,
          linkText: announceLinkText.trim() || null,
        }),
      });

      if (!res.ok) throw new Error('Failed to save announcement');

      showFeedback('success', 'Church announcement published!');
      setAnnounceTitle('');
      setAnnounceContent('');
      setAnnounceLinkUrl('');
      setAnnounceLinkText('');
      onRefreshData();
    } catch (err: any) {
      showFeedback('error', err.message || 'Error publishing announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete announcement
  const handleDeleteAnnouncement = async (id: number) => {
    try {
      const token = await getToken();
      await fetch(`/api/announcements/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      showFeedback('success', 'Announcement removed.');
      onRefreshData();
    } catch (err: any) {
      showFeedback('error', err.message);
    }
  };

  // Update Prayer status
  const handleTogglePrayerAnswered = async (p: PrayerRequest) => {
    try {
      const token = await getToken();
      const newStatus = p.status === 'answered' ? 'active' : 'answered';
      await fetch(`/api/prayers/${p.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      showFeedback('success', `Prayer marked as ${newStatus}!`);
      onRefreshData();
    } catch (err: any) {
      showFeedback('error', err.message);
    }
  };

  // Delete prayer
  const handleDeletePrayer = async (id: number) => {
    if (!window.confirm('Delete this prayer request?')) return;
    try {
      const token = await getToken();
      await fetch(`/api/prayers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      showFeedback('success', 'Prayer request removed.');
      onRefreshData();
    } catch (err: any) {
      showFeedback('error', err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-6 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5 text-stone-950" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-white">
                Church Administrator Portal
              </h2>
              <p className="text-xs text-amber-300">
                Logged in as <span className="font-semibold text-white">{user?.displayName || user?.email}</span> (Admin)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefreshData}
              className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
              aria-label="Close Admin Portal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3 text-xs sm:text-sm font-medium flex items-center gap-2 px-6 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-b border-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 pt-4 border-b border-stone-200 bg-stone-50 overflow-x-auto flex-shrink-0 scrollbar-none">
          <button
            onClick={() => {
              setActiveTab('create-event');
              if (!editingEventId) resetEventForm();
            }}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'create-event'
                ? 'border-amber-600 text-amber-700 bg-white rounded-t-lg'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            {editingEventId ? 'Edit Event' : 'Post New Event'}
          </button>

          <button
            onClick={() => setActiveTab('manage-events')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'manage-events'
                ? 'border-amber-600 text-amber-700 bg-white rounded-t-lg'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Manage Events ({events.length})
          </button>

          <button
            onClick={() => setActiveTab('verses')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'verses'
                ? 'border-amber-600 text-amber-700 bg-white rounded-t-lg'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Daily Scripture & Devotionals
          </button>

          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'announcements'
                ? 'border-amber-600 text-amber-700 bg-white rounded-t-lg'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Bell className="w-4 h-4" />
            Announcements ({announcements.length})
          </button>

          <button
            onClick={() => setActiveTab('prayers')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'prayers'
                ? 'border-amber-600 text-amber-700 bg-white rounded-t-lg'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Heart className="w-4 h-4" />
            Prayer Wall ({prayers.length})
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: CREATE / EDIT EVENT */}
          {activeTab === 'create-event' && (
            <form onSubmit={handleSaveEvent} className="space-y-5 max-w-3xl mx-auto">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <div>
                  <h3 className="text-lg font-serif font-bold text-stone-900">
                    {editingEventId ? 'Edit Church Gathering' : 'Post Church Gathering to Calendar'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Events are stored directly in your Cloud SQL PostgreSQL database.
                  </p>
                </div>
                {editingEventId && (
                  <button
                    type="button"
                    onClick={resetEventForm}
                    className="text-xs text-stone-600 hover:text-stone-900 underline"
                  >
                    Cancel Editing
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sunday Worship Celebration & Fellowship"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide details about the gathering, speaker, theme, child-care availability, or what to bring..."
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Ministry Category *
                  </label>
                  <select
                    value={eventCategory}
                    onChange={(e) => setEventCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                  >
                    <option value="Worship">Worship</option>
                    <option value="Bible Study">Bible Study</option>
                    <option value="Youth">Youth Ministry</option>
                    <option value="Community Outreach">Community Outreach</option>
                    <option value="Prayer">Prayer Vigil</option>
                    <option value="Fellowship">Fellowship & Potluck</option>
                    <option value="Special Event">Special Holiday Event</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Date * (YYYY-MM-DD)
                  </label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10:00 AM"
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    End Time (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 11:45 AM"
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Location / Room *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Main Sanctuary, Fellowship Hall, Zoom"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Street Address (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 742 Evergreen Terrace"
                    value={eventAddress}
                    onChange={(e) => setEventAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Maximum Capacity (Optional)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 250"
                    value={eventCapacity}
                    onChange={(e) => setEventCapacity(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={eventIsFeatured}
                      onChange={(e) => setEventIsFeatured(e.target.checked)}
                      className="rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-xs font-bold text-stone-800">
                      Feature on Home Spotlight Banner
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Organizer Name
                  </label>
                  <input
                    type="text"
                    value={eventOrganizer}
                    onChange={(e) => setEventOrganizer(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Organizer Email
                  </label>
                  <input
                    type="email"
                    value={eventOrganizerEmail}
                    onChange={(e) => setEventOrganizerEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-200">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {submitting ? 'Saving to Database...' : editingEventId ? 'Update Event' : 'Publish Church Event'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: MANAGE EVENTS LIST */}
          {activeTab === 'manage-events' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                <h3 className="font-serif font-bold text-stone-900 text-base">
                  All Scheduled Church Gatherings ({events.length})
                </h3>
                <button
                  onClick={() => {
                    resetEventForm();
                    setActiveTab('create-event');
                  }}
                  className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Add Event
                </button>
              </div>

              {events.length === 0 ? (
                <p className="text-stone-500 text-sm py-8 text-center">No events found in PostgreSQL.</p>
              ) : (
                <div className="divide-y divide-stone-200 border border-stone-200 rounded-xl overflow-hidden bg-white">
                  {events.map((evt) => (
                    <div key={evt.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-stone-900 text-base">
                            {evt.title}
                          </span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                            {evt.category}
                          </span>
                          {evt.isFeatured && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500 text-stone-950">
                              Featured
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-amber-600" />
                            {evt.date} ({evt.startTime})
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-amber-600" />
                            {evt.location}
                          </span>
                          <span>•</span>
                          <span className="font-semibold text-stone-700 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-stone-500" />
                            {evt.rsvpCount} RSVPs
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => handleInspectRsvps(evt)}
                          className="px-3 py-1.5 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg flex items-center gap-1 transition-colors"
                          title="View attendee RSVPs"
                        >
                          <Users className="w-3.5 h-3.5" />
                          View RSVPs
                        </button>
                        <button
                          onClick={() => handleEditEvent(evt)}
                          className="p-2 text-stone-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit Event"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(evt.id)}
                          className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* RSVP inspection drawer modal */}
              {inspectingEvent && (
                <div className="fixed inset-0 z-60 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-stone-200">
                    <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                      <div>
                        <h4 className="font-serif font-bold text-stone-900 text-lg">
                          RSVP List: {inspectingEvent.title}
                        </h4>
                        <p className="text-xs text-stone-500">
                          Total Registered: {inspectingEvent.rsvpCount} attendees
                        </p>
                      </div>
                      <button
                        onClick={() => setInspectingEvent(null)}
                        className="p-1 text-stone-400 hover:text-stone-800"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-stone-100">
                      {inspectingEvent.rsvps && inspectingEvent.rsvps.length > 0 ? (
                        inspectingEvent.rsvps.map((r) => (
                          <div key={r.id} className="py-2.5 flex items-center justify-between text-xs">
                            <div>
                              <p className="font-semibold text-stone-900">{r.userName}</p>
                              <p className="text-stone-500 text-[11px]">
                                Registered: {new Date(r.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <span className="px-2 py-1 bg-stone-100 font-bold text-stone-800 rounded">
                              {r.attendeesCount} guest{r.attendeesCount > 1 ? 's' : ''}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-stone-500 text-xs py-4 text-center">
                          No member RSVPs recorded yet for this gathering.
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-stone-200 text-right">
                      <button
                        onClick={() => setInspectingEvent(null)}
                        className="px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-medium"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DAILY VERSES */}
          {activeTab === 'verses' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Devotional Creation Form */}
              <form onSubmit={handleSaveVerse} className="p-6 bg-stone-50 rounded-2xl border border-stone-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-200">
                  <div>
                    <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-amber-600" />
                      Post or Update Daily Scripture
                    </h3>
                    <p className="text-xs text-stone-500">
                      Draft daily devotionals and reflection prayers for church members.
                    </p>
                  </div>

                  {/* AI Pastoral Writing Assistant */}
                  <button
                    type="button"
                    onClick={handleAiDraftDevotional}
                    disabled={generatingAi}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-60 self-start sm:self-auto"
                    title="Draft reflection with Gemini AI"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                    <span>{generatingAi ? 'Drafting reflection...' : 'AI Devotional Assistant'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={verseDate}
                      onChange={(e) => setVerseDate(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Scripture Reference *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John 14:27 or Romans 8:28"
                      value={verseReference}
                      onChange={(e) => setVerseReference(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Translation
                    </label>
                    <select
                      value={verseTranslation}
                      onChange={(e) => setVerseTranslation(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
                    >
                      <option value="NIV">NIV (New International Version)</option>
                      <option value="ESV">ESV (English Standard Version)</option>
                      <option value="KJV">KJV (King James Version)</option>
                      <option value="NLT">NLT (New Living Translation)</option>
                      <option value="CSB">CSB (Christian Standard Bible)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Theme / Focus Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Peace, Healing, Trust, God's Faithfulness"
                    value={verseTheme}
                    onChange={(e) => setVerseTheme(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Full Scripture Verse Text *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Type or paste the Bible verse passage..."
                    value={verseText}
                    onChange={(e) => setVerseText(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Pastoral Reflection *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide a thoughtful reflection connecting this passage to everyday life..."
                    value={verseReflection}
                    onChange={(e) => setVerseReflection(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Closing Prayer
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief heartfelt closing prayer (e.g. Heavenly Father, grant us courage today...)"
                    value={versePrayer}
                    onChange={(e) => setVersePrayer(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white resize-none"
                  />
                </div>

                <div className="pt-2 text-right">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl shadow-sm transition-all"
                  >
                    {submitting ? 'Saving...' : 'Save Daily Scripture in PostgreSQL'}
                  </button>
                </div>
              </form>

              {/* Existing Verses List */}
              <div className="space-y-3">
                <h4 className="font-serif font-bold text-stone-900 text-sm">
                  Published Daily Verses Archive ({allVerses.length})
                </h4>
                <div className="divide-y divide-stone-200 border border-stone-200 rounded-xl overflow-hidden bg-white">
                  {allVerses.map((v) => (
                    <div key={v.id} className="p-4 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-stone-900 text-sm">
                            {v.reference}
                          </span>
                          <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium">
                            {v.translation}
                          </span>
                          <span className="text-xs text-stone-500 font-mono">
                            {v.date}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 line-clamp-1 mt-1">
                          "{v.verseText}"
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setVerseDate(v.date);
                            setVerseReference(v.reference);
                            setVerseText(v.verseText);
                            setVerseTranslation(v.translation);
                            setVerseReflection(v.reflection);
                            setVersePrayer(v.prayer || '');
                            setVerseTheme(v.theme || '');
                          }}
                          className="px-2.5 py-1 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded transition-colors"
                        >
                          Load in Form
                        </button>
                        <button
                          onClick={() => handleDeleteVerse(v.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors"
                          title="Delete verse"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ANNOUNCEMENTS */}
          {activeTab === 'announcements' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <form onSubmit={handleSaveAnnouncement} className="p-6 bg-stone-50 rounded-2xl border border-stone-200 space-y-4">
                <h3 className="font-serif font-bold text-stone-900 text-base">
                  Publish Banner Announcement
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Christmas Eve Candlelight Service"
                      value={announceTitle}
                      onChange={(e) => setAnnounceTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Priority Alert
                    </label>
                    <select
                      value={announcePriority}
                      onChange={(e) => setAnnouncePriority(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
                    >
                      <option value="normal">Normal Banner</option>
                      <option value="high">High Importance</option>
                      <option value="urgent">Urgent Alert</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Announcement Body *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Short summary of announcement..."
                    value={announceContent}
                    onChange={(e) => setAnnounceContent(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Link URL (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. #events or https://..."
                      value={announceLinkUrl}
                      onChange={(e) => setAnnounceLinkUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Link Button Text (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sign Up, Learn More"
                      value={announceLinkText}
                      onChange={(e) => setAnnounceLinkText(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
                    />
                  </div>
                </div>

                <div className="pt-2 text-right">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl"
                  >
                    Publish Announcement
                  </button>
                </div>
              </form>

              {/* Active Announcements List */}
              <div className="space-y-3">
                <h4 className="font-serif font-bold text-stone-900 text-sm">
                  Active Announcements ({announcements.length})
                </h4>
                <div className="divide-y divide-stone-200 border border-stone-200 rounded-xl overflow-hidden bg-white">
                  {announcements.map((a) => (
                    <div key={a.id} className="p-4 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900 text-sm">{a.title}</span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                            {a.priority}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 mt-1">{a.content}</p>
                      </div>

                      <button
                        onClick={() => handleDeleteAnnouncement(a.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors"
                        title="Delete announcement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PRAYER WALL MODERATION */}
          {activeTab === 'prayers' && (
            <div className="space-y-4 max-w-4xl mx-auto">
              <h3 className="font-serif font-bold text-stone-900 text-base">
                Community Prayer Wall Moderation ({prayers.length})
              </h3>
              <p className="text-xs text-stone-500">
                Mark prayers as answered when members experience breakthrough, or remove entries.
              </p>

              <div className="divide-y divide-stone-200 border border-stone-200 rounded-xl overflow-hidden bg-white">
                {prayers.map((p) => (
                  <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-stone-900 text-sm">
                          {p.title}
                        </span>
                        {p.isPraise ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                            Praise
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                            Prayer
                          </span>
                        )}
                        {p.status === 'answered' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            Answered
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-600 line-clamp-2">"{p.request}"</p>
                      <p className="text-[11px] text-stone-400">
                        By {p.requesterName} • {p.prayerCount} prayers lifted
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => handleTogglePrayerAnswered(p)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                          p.status === 'answered'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        {p.status === 'answered' ? 'Answered' : 'Mark Answered'}
                      </button>

                      <button
                        onClick={() => handleDeletePrayer(p.id)}
                        className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete prayer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
