import React, { useEffect, useState } from 'react';
import { BookOpen, Clock, Edit3, Eye, Flame, MapPin, Save, Star, Trash2, Users } from 'lucide-react';
import { ChurchEvent, ChurchInfo } from '../../../types/index.ts';
import { AdminUser } from '../../../types/index.ts';
import { useLanguage } from '../../../context/LanguageContext.tsx';
import { apiUrl, apiHeaders } from '../../../utils/api.ts';
import { NotificationClient } from '../../../services/notificationClient.ts';

interface EventsTabProps {
  events: ChurchEvent[];
  churchInfo?: ChurchInfo | null;
  initialEvent?: ChurchEvent | null;
  adminUser: AdminUser | null;
  // Which tab the parent is showing. The child stays mounted for the
  // whole portal session (returning null when neither event tab is
  // active) so a half-typed form or an in-progress edit survives
  // switching to another tab and back, exactly as before the split.
  activeTab: string;
  getToken: () => string | null;
  showFeedback: (type: 'success' | 'error', message: string) => void;
  onRefreshData: () => void;
  onTabChange: (tab: string) => void;
  // The parent header and the "Add Event" tab label show "Edit Event"
  // vs "Add Event", so the child reports whether it is editing.
  onEditingChange: (editing: boolean) => void;
  // Bumped by the parent when the "Add Event" tab button is tapped
  // while not editing: the child clears a fresh (non-editing) form.
  resetFormSignal: number;
}

// Events: add/edit form with live preview + manage list. Owns all event
// form state, save/edit/delete, and its own submitting flag. Prefills
// from initialEvent when the portal is opened to edit an event.
export const EventsTab: React.FC<EventsTabProps> = ({
  events,
  churchInfo,
  initialEvent,
  adminUser,
  activeTab,
  getToken,
  showFeedback,
  onRefreshData,
  onTabChange,
  onEditingChange,
  resetFormSignal,
}) => {
  const { t, language } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [eventTitleVi, setEventTitleVi] = useState('');
  const [eventTitleEn, setEventTitleEn] = useState('');
  const [eventDescriptionVi, setEventDescriptionVi] = useState('');
  const [eventDescriptionEn, setEventDescriptionEn] = useState('');
  const [eventCategory, setEventCategory] = useState('Worship');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventStartTime, setEventStartTime] = useState('03:00 PM');
  const [eventEndTime, setEventEndTime] = useState('05:00 PM');
  const [eventLocation, setEventLocation] = useState('Main Sanctuary');
  const [eventAddress, setEventAddress] = useState('Tempe, Arizona');
  const [eventIsFeatured, setEventIsFeatured] = useState(false);
  const [eventOrganizer, setEventOrganizer] = useState(adminUser?.displayName || 'Pastoral Ministry Team');
  const [eventOrganizerEmail, setEventOrganizerEmail] = useState(adminUser?.email || 'contact@vnrevivalchurch.org');
  const [editingEventAudit, setEditingEventAudit] = useState<{
    createdBy?: string | null;
    createdAt?: string;
    updatedBy?: string | null;
    updatedAt?: string | null;
  } | null>(null);

  const resetEventForm = () => {
    setEditingEventId(null);
    setEventTitleVi('');
    setEventTitleEn('');
    setEventDescriptionVi('');
    setEventDescriptionEn('');
    setEventCategory('Worship');
    setEventDate(new Date().toISOString().split('T')[0]);
    setEventStartTime('03:00 PM');
    setEventEndTime('05:00 PM');
    setEventLocation('Main Sanctuary');
    setEventAddress(churchInfo?.address || 'Tempe, Arizona');
    setEventIsFeatured(false);
    setEditingEventAudit(null);
  };

  const handleEditEvent = (evt: ChurchEvent) => {
    setEditingEventId(evt.id);
    setEventTitleVi(evt.titleVi || evt.title || '');
    setEventTitleEn(evt.titleEn || evt.title || '');
    setEventDescriptionVi(evt.descriptionVi || evt.description || '');
    setEventDescriptionEn(evt.descriptionEn || evt.description || '');
    setEventCategory(evt.category);
    setEventDate(evt.date);
    setEventStartTime(evt.startTime);
    setEventEndTime(evt.endTime || '');
    setEventLocation(evt.location);
    setEventAddress(evt.address || churchInfo?.address || 'Tempe, Arizona');
    setEventIsFeatured(evt.isFeatured);
    setEventOrganizer(evt.organizerName || '');
    setEventOrganizerEmail(evt.organizerEmail || '');
    setEditingEventAudit({
      createdBy: evt.createdBy,
      createdAt: evt.createdAt,
      updatedBy: evt.updatedBy,
      updatedAt: evt.updatedAt,
    });
    onTabChange('create-event');
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitleVi.trim() || !eventTitleEn.trim() || !eventDescriptionVi.trim() || !eventDescriptionEn.trim() || !eventDate || !eventStartTime || !eventLocation) {
      showFeedback('error', t('adminEventFillBoth'));
      return;
    }

    try {
      setSubmitting(true);
      const token = getToken();
      const defaultChurchAddr = (churchInfo?.address || 'Tempe, Arizona').trim();
      const payload = {
        title: eventTitleEn.trim(),
        titleVi: eventTitleVi.trim(),
        titleEn: eventTitleEn.trim(),
        description: eventDescriptionEn.trim(),
        descriptionVi: eventDescriptionVi.trim(),
        descriptionEn: eventDescriptionEn.trim(),
        category: eventCategory,
        date: eventDate,
        startTime: eventStartTime,
        endTime: eventEndTime || null,
        location: eventLocation.trim(),
        address: eventAddress.trim() || defaultChurchAddr,
        isFeatured: eventIsFeatured,
        organizerName: eventOrganizer.trim(),
        organizerEmail: eventOrganizerEmail.trim(),
      };

      const url = editingEventId ? apiUrl(`/api/events/${editingEventId}`) : apiUrl('/api/events');
      const method = editingEventId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: apiHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        }),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errData: any = {};
        try { errData = await res.json(); } catch {}
        throw new Error(errData?.error || `Failed to save event (HTTP ${res.status})`);
      }

      showFeedback('success', editingEventId
        ? t('adminEventUpdated')
        : t('adminEventAdded'));

      // Dispatch local/push notification
      NotificationClient.triggerNotification(
        `New Church Event: ${eventTitleEn.trim()}`,
        `${eventDate} • ${eventStartTime} at ${eventLocation.trim()}`
      );

      resetEventForm();
      onRefreshData();
      onTabChange('manage-events');
    } catch (err: any) {
      showFeedback('error', err.message || 'Error saving event.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (!window.confirm(t('adminEventDeleteConfirm'))) return;
    try {
      const token = getToken();
      const res = await fetch(apiUrl(`/api/events/${id}`), {
        method: 'DELETE',
        headers: apiHeaders({ Authorization: `Bearer ${token}` }),
      });
      if (!res.ok) {
        let errData: any = {};
        try { errData = await res.json(); } catch {}
        throw new Error(errData?.error || `Failed to delete event (HTTP ${res.status})`);
      }
      showFeedback('success', t('adminEventDeleted'));
      onRefreshData();
    } catch (err: any) {
      showFeedback('error', err.message || 'Error deleting event');
    }
  };

  useEffect(() => {
    if (initialEvent) {
      handleEditEvent(initialEvent);
    }
  }, [initialEvent]);

  useEffect(() => {
    onEditingChange(editingEventId !== null);
  }, [editingEventId, onEditingChange]);

  // The parent bumps resetFormSignal when the "Add Event" tab button is
  // tapped while not editing: clear a fresh form (an in-progress edit
  // is never cleared this way — the parent only bumps when not editing).
  useEffect(() => {
    if (resetFormSignal === 0) return;
    if (editingEventId === null) resetEventForm();
  }, [resetFormSignal, editingEventId]);

  // Live preview theme, from the chosen category.
  const previewTheme = (() => {
    const lower = (eventCategory || '').toLowerCase();
    if (lower.includes('youth') || lower.includes('giới trẻ')) {
      return {
        cardBg: 'bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/35 border-emerald-200/90 shadow-xs',
        dateBox: 'bg-emerald-100/90 text-emerald-950 border-emerald-200/90',
        monthText: 'text-emerald-800',
        badge: 'bg-emerald-100/80 text-emerald-900 border-emerald-200/80',
        icon: Users,
      };
    }
    if (lower.includes('worship') || lower.includes('thờ phượng')) {
      return {
        cardBg: 'bg-gradient-to-br from-indigo-50/90 via-white to-indigo-50/35 border-indigo-200/90 shadow-xs',
        dateBox: 'bg-indigo-100/90 text-indigo-950 border-indigo-200/90',
        monthText: 'text-indigo-800',
        badge: 'bg-indigo-100/80 text-indigo-900 border-indigo-200/80',
        icon: Flame,
      };
    }
    if (lower.includes('bible') || lower.includes('kinh thánh')) {
      return {
        cardBg: 'bg-gradient-to-br from-amber-50/90 via-white to-amber-50/35 border-amber-200/90 shadow-xs',
        dateBox: 'bg-amber-100/90 text-amber-950 border-amber-200/90',
        monthText: 'text-amber-800',
        badge: 'bg-amber-100/80 text-amber-900 border-amber-200/80',
        icon: BookOpen,
      };
    }
    return {
      cardBg: 'bg-gradient-to-br from-purple-50/90 via-white to-purple-50/35 border-purple-200/90 shadow-xs',
      dateBox: 'bg-purple-100/90 text-purple-950 border-purple-200/90',
      monthText: 'text-purple-800',
      badge: 'bg-purple-100/80 text-purple-900 border-purple-200/80',
      icon: Star,
    };
  })();
  const PreviewCategoryIcon = previewTheme.icon;

  const previewDateObj = eventDate ? new Date(eventDate + 'T00:00:00') : new Date();
  const previewMonth = isNaN(previewDateObj.getTime())
    ? 'VRC'
    : previewDateObj.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'short' });
  const previewDay = isNaN(previewDateObj.getTime())
    ? '01'
    : previewDateObj.getDate();
  const previewWeekday = isNaN(previewDateObj.getTime())
    ? t('weekdaySunday')
    : previewDateObj.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'short' });

  if (activeTab !== 'create-event' && activeTab !== 'manage-events') return null;

  if (activeTab === 'manage-events') {
    return (
      <div className="space-y-3 max-w-2xl mx-auto">
        {events.length === 0 ? (
          <p className="text-stone-500 text-sm py-8 text-center">{t('adminEventNoEvents')}</p>
        ) : (
          <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden bg-white">
            {events.map((evt) => {
              const todayStr = new Date().toISOString().split('T')[0];
              const isPast = evt.date < todayStr;
              return (
                <div key={evt.id} className="p-4 flex items-center justify-between gap-4 hover:bg-stone-50/60 transition-colors">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-serif font-bold text-stone-900 text-sm truncate">{evt.title}</span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                        {evt.category}
                      </span>
                      {isPast ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                          {t('adminEventPast')}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {t('adminEventUpcoming')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 truncate">
                      {evt.date} • {evt.startTime} • {evt.location}{evt.address && evt.address !== evt.location ? ` • ${evt.address}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
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
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto w-full min-w-0">
      {/* Event Form Card (Exact same design as Daily Verses) */}
      <form onSubmit={handleSaveEvent} className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3.5 w-full min-w-0 box-border">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <h3 className="font-serif font-bold text-stone-900 text-sm">
              {editingEventId
                ? t('adminEventEditFormTitle')
                : t('adminEventFormTitle')}
            </h3>
            {editingEventId && (
              <button
                type="button"
                onClick={resetEventForm}
                className="text-xs text-stone-500 hover:text-stone-800 underline"
              >
                {t('cancelEdit')}
              </button>
            )}
          </div>
        </div>

        {editingEventId && editingEventAudit && (
          <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-stone-700 flex flex-wrap gap-x-4 gap-y-1">
            {editingEventAudit.createdBy && (
              <span>
                <strong>{t('commonCreatedBy')}</strong> {editingEventAudit.createdBy}
                {editingEventAudit.createdAt ? ` (${new Date(editingEventAudit.createdAt).toLocaleString()})` : ''}
              </span>
            )}
            {editingEventAudit.updatedBy && (
              <span>
                <strong>{t('commonUpdatedBy')}</strong> {editingEventAudit.updatedBy}
                {editingEventAudit.updatedAt ? ` (${new Date(editingEventAudit.updatedAt).toLocaleString()})` : ''}
              </span>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
          <div className="w-full min-w-0">
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {t('adminEventTitleVi')}
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Lễ Thờ Phượng Chúa Nhật"
              value={eventTitleVi}
              onChange={(e) => setEventTitleVi(e.target.value)}
              className="w-full max-w-full box-border min-w-0 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>

          <div className="w-full min-w-0">
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {t('adminEventTitleEn')}
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sunday Worship Celebration"
              value={eventTitleEn}
              onChange={(e) => setEventTitleEn(e.target.value)}
              className="w-full max-w-full box-border min-w-0 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
          <div className="w-full min-w-0">
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {t('adminEventDescVi')}
            </label>
            <textarea
              rows={3}
              required
              placeholder="Chủ đề bài giảng, diễn giả, thông tin sinh hoạt..."
              value={eventDescriptionVi}
              onChange={(e) => setEventDescriptionVi(e.target.value)}
              className="w-full max-w-full box-border min-w-0 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 resize-none"
            />
          </div>

          <div className="w-full min-w-0">
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {t('adminEventDescEn')}
            </label>
            <textarea
              rows={3}
              required
              placeholder="Event details, sermon theme, speaker..."
              value={eventDescriptionEn}
              onChange={(e) => setEventDescriptionEn(e.target.value)}
              className="w-full max-w-full box-border min-w-0 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 resize-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full min-w-0">
          <div className="w-full min-w-0">
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {t('adminEventCategory')}
            </label>
            <select
              value={eventCategory}
              onChange={(e) => setEventCategory(e.target.value)}
              className="w-full max-w-full box-border min-w-0 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
            >
              <option value="Worship">Worship (Thờ Phượng)</option>
              <option value="Bible Study">Bible Study (Kinh Thánh)</option>
              <option value="Youth">Youth (Giới Trẻ)</option>
              <option value="Special Gathering">Special Gathering</option>
            </select>
          </div>

          <div className="w-full min-w-0 overflow-hidden">
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {t('adminEventDate')}
            </label>
            <input
              type="date"
              required
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full max-w-full box-border min-w-0 appearance-none px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
            />
          </div>

          <div className="w-full min-w-0">
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {t('eventStartTime')}
            </label>
            <input
              type="text"
              required
              placeholder="03:00 PM"
              value={eventStartTime}
              onChange={(e) => setEventStartTime(e.target.value)}
              className="w-full max-w-full box-border min-w-0 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
          <div className="w-full min-w-0">
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {t('eventEndTime')}
            </label>
            <input
              type="text"
              placeholder="05:00 PM"
              value={eventEndTime}
              onChange={(e) => setEventEndTime(e.target.value)}
              className="w-full max-w-full box-border min-w-0 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
            />
          </div>

          <div className="w-full min-w-0">
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {t('adminEventLocation')}
            </label>
            <input
              type="text"
              required
              placeholder="Main Sanctuary, Fellowship Hall..."
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              className="w-full max-w-full box-border min-w-0 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
            />
          </div>
        </div>

        <div className="w-full min-w-0">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-stone-700">
              {t('adminEventAddress')}
            </label>
            <span className="text-[10px] text-stone-400">
              {t('adminEventAddressHint')}
            </span>
          </div>
          <input
            type="text"
            placeholder={churchInfo?.address || 'Tempe, Arizona'}
            value={eventAddress}
            onChange={(e) => setEventAddress(e.target.value)}
            className="w-full max-w-full box-border min-w-0 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
          />
          <p className="text-[11px] text-stone-500 mt-1">
            {t('adminEventAddressNote', { address: churchInfo?.address || 'Tempe, Arizona' })}
          </p>
        </div>

        <div className="flex items-center pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700">
            <input
              type="checkbox"
              checked={eventIsFeatured}
              onChange={(e) => setEventIsFeatured(e.target.checked)}
              className="rounded border-stone-300 text-stone-900 focus:ring-stone-400"
            />
            <span>{t('adminEventFeatured')}</span>
          </label>
        </div>

        <div className="text-right pt-2 border-t border-stone-200">
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>
              {submitting
                ? t('commonSaving')
                : editingEventId
                ? t('adminEventUpdate')
                : t('eventSave')}
            </span>
          </button>
        </div>
      </form>

      {/* Live Event Preview Card (Rendered cleanly directly below in same width) */}
      <div className="space-y-2 w-full min-w-0">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-stone-500">
          <span className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-amber-600" />
            <span>{t('adminEventPreview')}</span>
          </span>
          <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-semibold">
            {t('adminEventPreviewLive')}
          </span>
        </div>

        <div className={`rounded-2xl border p-4 sm:p-5 transition-all duration-200 space-y-3 w-full min-w-0 box-border ${previewTheme.cardBg}`}>
          {/* Top Row: Category Pill + Featured Pill + Date */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${previewTheme.badge}`}
              >
                <PreviewCategoryIcon className="w-3 h-3" />
                <span>{eventCategory || 'Worship'}</span>
              </span>
              {eventIsFeatured && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-600" />
                  <span>{t('adminEventFeaturedBadge')}</span>
                </span>
              )}
            </div>

            <span className="text-[11px] font-semibold text-stone-500">
              {previewWeekday}{eventDate ? `, ${eventDate}` : ''}
            </span>
          </div>

          {/* Main Content Area */}
          <div className="flex items-start gap-3.5">
            {/* Distinct Calendar Date Card */}
            <div className={`flex-shrink-0 w-14 text-center rounded-xl border p-2 shadow-2xs ${previewTheme.dateBox}`}>
              <span className={`block text-[10px] font-bold uppercase tracking-wider ${previewTheme.monthText}`}>
                {previewMonth}
              </span>
              <span className="block text-xl font-serif font-bold text-stone-950 leading-tight">
                {previewDay}
              </span>
            </div>

            {/* Title, Time, Location */}
            <div className="min-w-0 flex-1 space-y-1">
              <h4 className="text-sm sm:text-base font-serif font-bold text-stone-950 leading-snug line-clamp-2">
                {(language === 'vi' ? (eventTitleVi || eventTitleEn) : (eventTitleEn || eventTitleVi)) || t('adminEventTitlePlaceholder')}
              </h4>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-stone-700 font-medium">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-700 flex-shrink-0" />
                  <span>{eventStartTime || '03:00 PM'}{eventEndTime ? ` - ${eventEndTime}` : ''}</span>
                </span>

                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-700 flex-shrink-0" />
                  <span className="truncate max-w-[240px]">
                    {eventLocation || 'Main Sanctuary'} • {eventAddress.trim() || churchInfo?.address || 'Tempe, AZ'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Description Preview */}
          <p className="text-xs text-stone-800 leading-relaxed bg-white/90 p-2.5 rounded-xl border border-stone-200 line-clamp-3 font-normal">
            {(language === 'vi' ? (eventDescriptionVi || eventDescriptionEn) : (eventDescriptionEn || eventDescriptionVi)) || t('adminEventDescPlaceholder')}
          </p>
        </div>
      </div>
    </div>
  );
};
