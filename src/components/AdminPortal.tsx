import React, { useState } from 'react';
import { ChurchEvent, DailyVerse, Announcement } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Calendar,
  BookOpen,
  Bell,
  Plus,
  Trash2,
  Edit3,
  Sparkles,
  X,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface AdminPortalProps {
  events: ChurchEvent[];
  allVerses: DailyVerse[];
  announcements: Announcement[];
  initialTab?: string;
  onClose: () => void;
  onRefreshData: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  events,
  allVerses,
  announcements,
  initialTab = 'create-event',
  onClose,
  onRefreshData,
}) => {
  const { user, getToken } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Event Form State
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventCategory, setEventCategory] = useState('Worship');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventStartTime, setEventStartTime] = useState('03:00 PM');
  const [eventEndTime, setEventEndTime] = useState('05:00 PM');
  const [eventLocation, setEventLocation] = useState('Main Sanctuary');
  const [eventAddress, setEventAddress] = useState('Tempe, Arizona');
  const [eventIsFeatured, setEventIsFeatured] = useState(false);
  const [eventOrganizer, setEventOrganizer] = useState(user?.displayName || 'Pastoral Ministry Team');
  const [eventOrganizerEmail, setEventOrganizerEmail] = useState(user?.email || 'contact@vnrevivalchurch.org');

  // Daily Verse Form State
  const [verseDate, setVerseDate] = useState(new Date().toISOString().split('T')[0]);
  const [verseReference, setVerseReference] = useState('');
  const [verseText, setVerseText] = useState('');
  const [verseTranslation, setVerseTranslation] = useState('NIV');
  const [verseReflection, setVerseReflection] = useState('');
  const [versePrayer, setVersePrayer] = useState('');
  const [verseTheme, setVerseTheme] = useState('Revival & Faith');
  const [generatingAi, setGeneratingAi] = useState(false);

  // Announcement Form State
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceContent, setAnnounceContent] = useState('');

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  const resetEventForm = () => {
    setEditingEventId(null);
    setEventTitle('');
    setEventDescription('');
    setEventCategory('Worship');
    setEventDate(new Date().toISOString().split('T')[0]);
    setEventStartTime('10:00 AM');
    setEventEndTime('12:00 PM');
    setEventLocation('Main Sanctuary');
    setEventAddress('');
    setEventIsFeatured(false);
  };

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
    setEventIsFeatured(evt.isFeatured);
    setEventOrganizer(evt.organizerName || '');
    setEventOrganizerEmail(evt.organizerEmail || '');
    setActiveTab('create-event');
  };

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

      showFeedback('success', editingEventId ? 'Event updated successfully!' : 'New event published to Vietnamese Revival Church calendar!');
      resetEventForm();
      onRefreshData();
      setActiveTab('manage-events');
    } catch (err: any) {
      showFeedback('error', err.message || 'Error saving event.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (!window.confirm('Delete this gathering from the calendar?')) return;
    try {
      const token = await getToken();
      const res = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete event');
      showFeedback('success', 'Event removed.');
      onRefreshData();
    } catch (err: any) {
      showFeedback('error', err.message || 'Error deleting event');
    }
  };

  const handleAiDraftDevotional = async () => {
    if (!verseReference.trim()) {
      showFeedback('error', 'Please enter a Scripture reference (e.g. "Romans 8:28" or "Giăng 3:16") first.');
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
          theme: verseTheme || 'Revival & Hope',
        }),
      });

      if (!res.ok) throw new Error('AI generator failed');
      const generated = await res.json();
      if (generated.verseText) setVerseText(generated.verseText);
      if (generated.reflection) setVerseReflection(generated.reflection);
      if (generated.prayer) setVersePrayer(generated.prayer);
      if (generated.theme) setVerseTheme(generated.theme);

      showFeedback('success', 'Devotional draft prepared! Review and save below.');
    } catch (err: any) {
      showFeedback('error', err.message || 'Error generating reflection');
    } finally {
      setGeneratingAi(false);
    }
  };

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

      if (!res.ok) throw new Error('Failed to save verse');
      showFeedback('success', 'Daily scripture saved successfully!');
      onRefreshData();
    } catch (err: any) {
      showFeedback('error', err.message || 'Error saving daily verse');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVerse = async (id: number) => {
    if (!window.confirm('Delete this daily devotional?')) return;
    try {
      const token = await getToken();
      await fetch(`/api/verses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      showFeedback('success', 'Verse deleted.');
      onRefreshData();
    } catch (err: any) {
      showFeedback('error', err.message);
    }
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announceTitle.trim() || !announceContent.trim()) return;

    try {
      setSubmitting(true);
      const token = await getToken();
      await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: announceTitle.trim(),
          content: announceContent.trim(),
          priority: 'normal',
        }),
      });
      showFeedback('success', 'Announcement published!');
      setAnnounceTitle('');
      setAnnounceContent('');
      onRefreshData();
    } catch (err: any) {
      showFeedback('error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800 flex-shrink-0">
          <div>
            <h2 className="text-xl font-serif font-bold text-white">
              Vietnamese Revival Church • Admin Portal
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Logged in as <span className="text-amber-400">{user?.displayName || user?.email}</span>
            </p>
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
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`p-3 text-xs font-medium flex items-center gap-2 px-6 ${
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

        {/* Tab Controls */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-stone-200 bg-stone-50/50 flex-shrink-0">
          <button
            onClick={() => {
              setActiveTab('create-event');
              if (!editingEventId) resetEventForm();
            }}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'create-event'
                ? 'border-stone-900 text-stone-900 bg-white rounded-t-xl'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            {editingEventId ? 'Edit Event' : 'Add New Event'}
          </button>

          <button
            onClick={() => setActiveTab('manage-events')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'manage-events'
                ? 'border-stone-900 text-stone-900 bg-white rounded-t-xl'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Manage Events ({events.length})
          </button>

          <button
            onClick={() => setActiveTab('verses')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'verses'
                ? 'border-stone-900 text-stone-900 bg-white rounded-t-xl'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Daily Scripture ({allVerses.length})
          </button>

          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'announcements'
                ? 'border-stone-900 text-stone-900 bg-white rounded-t-xl'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            Notices ({announcements.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: ADD / EDIT EVENT */}
          {activeTab === 'create-event' && (
            <form onSubmit={handleSaveEvent} className="space-y-4 max-w-2xl mx-auto">
              <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                <h3 className="text-base font-serif font-bold text-stone-900">
                  {editingEventId ? 'Edit Event' : 'Add New Event to Calendar'}
                </h3>
                {editingEventId && (
                  <button
                    type="button"
                    onClick={resetEventForm}
                    className="text-xs text-stone-500 hover:text-stone-800 underline"
                  >
                    Cancel Editing
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lễ Thờ Phượng Chúa Nhật / Sunday Celebration"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Description *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Event details, scripture topic, speaker, or what to expect..."
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Category
                  </label>
                  <select
                    value={eventCategory}
                    onChange={(e) => setEventCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm bg-white"
                  >
                    <option value="Worship">Worship (Thờ Phượng)</option>
                    <option value="Bible Study">Bible Study (Kinh Thánh)</option>
                    <option value="Youth">Youth (Giới Trẻ)</option>
                    <option value="Special Gathering">Special Gathering</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm bg-white"
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
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    End Time (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 12:00 PM"
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm"
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
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700">
                  <input
                    type="checkbox"
                    checked={eventIsFeatured}
                    onChange={(e) => setEventIsFeatured(e.target.checked)}
                    className="rounded border-stone-300 text-stone-900 focus:ring-stone-400"
                  />
                  Mark as Featured Event
                </label>
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  {submitting ? 'Saving...' : editingEventId ? 'Update Event' : 'Publish Event'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: MANAGE EVENTS */}
          {activeTab === 'manage-events' && (
            <div className="space-y-3 max-w-2xl mx-auto">
              {events.length === 0 ? (
                <p className="text-stone-500 text-sm py-8 text-center">No events in database.</p>
              ) : (
                <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden bg-white">
                  {events.map((evt) => (
                    <div key={evt.id} className="p-4 flex items-center justify-between gap-4 hover:bg-stone-50/60 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-stone-900 text-sm">{evt.title}</span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                            {evt.category}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500">
                          {evt.date} • {evt.startTime} • {evt.location}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditEvent(evt)}
                          className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(evt.id)}
                          className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DAILY VERSES */}
          {activeTab === 'verses' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <form onSubmit={handleSaveVerse} className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                  <h3 className="font-serif font-bold text-stone-900 text-sm">
                    Post Scripture & Devotional
                  </h3>
                  <button
                    type="button"
                    onClick={handleAiDraftDevotional}
                    disabled={generatingAi}
                    className="flex items-center gap-1 px-2.5 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>{generatingAi ? 'Drafting...' : 'AI Devotional Assistant'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={verseDate}
                      onChange={(e) => setVerseDate(e.target.value)}
                      className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-stone-700 mb-1">Scripture Reference *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2 Chronicles 7:14 or John 3:16"
                      value={verseReference}
                      onChange={(e) => setVerseReference(e.target.value)}
                      className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Scripture Text *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Enter the full verse text..."
                    value={verseText}
                    onChange={(e) => setVerseText(e.target.value)}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Pastoral Reflection *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Thoughtful pastoral reflection..."
                    value={verseReflection}
                    onChange={(e) => setVerseReflection(e.target.value)}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Prayer (Optional)</label>
                  <input
                    type="text"
                    placeholder="Short prayer (e.g. Chúa ôi, xin ban bình an...)"
                    value={versePrayer}
                    onChange={(e) => setVersePrayer(e.target.value)}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
                  />
                </div>

                <div className="text-right pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold"
                  >
                    {submitting ? 'Saving...' : 'Save Daily Scripture'}
                  </button>
                </div>
              </form>

              {/* Published verses list */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Published Daily Verses ({allVerses.length})
                </h4>
                <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden bg-white">
                  {allVerses.map((v) => (
                    <div key={v.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="font-serif font-bold text-stone-900">{v.reference}</span>
                        <span className="text-stone-400 ml-2">{v.date}</span>
                        <p className="text-stone-500 line-clamp-1 mt-0.5">"{v.verseText}"</p>
                      </div>
                      <button
                        onClick={() => handleDeleteVerse(v.id)}
                        className="p-1 text-stone-400 hover:text-rose-600"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ANNOUNCEMENTS */}
          {activeTab === 'announcements' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <form onSubmit={handleSaveAnnouncement} className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <h3 className="text-sm font-bold text-stone-900">Publish Notice Banner</h3>
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Notice Title (e.g. Special Revival Service)"
                    value={announceTitle}
                    onChange={(e) => setAnnounceTitle(e.target.value)}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
                  />
                </div>
                <div>
                  <textarea
                    rows={2}
                    required
                    placeholder="Short notice text..."
                    value={announceContent}
                    onChange={(e) => setAnnounceContent(e.target.value)}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white resize-none"
                  />
                </div>
                <div className="text-right">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-medium"
                  >
                    Publish
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                {announcements.map((a) => (
                  <div key={a.id} className="p-3 bg-white border border-stone-200 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-stone-900">{a.title}</p>
                      <p className="text-xs text-stone-600">{a.content}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteAnnouncement(a.id)}
                      className="p-1 text-stone-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
