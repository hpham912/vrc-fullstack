import React, { useEffect, useState } from 'react';
import { BookOpen, Clock, Edit3, Flame, MapPin, Save, Star, Trash2, Users } from 'lucide-react';
import { ChurchEvent, ChurchInfo } from '../../../../types/index.ts';
import { AdminUser } from '../../../../types/index.ts';
import { useLanguage } from '../../../../context/LanguageContext.tsx';
import { apiUrl, apiHeaders } from '../../../../utils/api.ts';
import { NotificationClient } from '../../../../services/notificationClient.ts';
import { DEFAULT_EVENT_ADDRESS } from '../../../../constants/church.ts';
import { eventsTabStyles as s } from './EventsTab.styles.ts';

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
  // Preview language toggle inside the event preview (same as the
  // header-verse edit preview): the preview follows this, not the app language.
  const [previewLang, setPreviewLang] = useState<'vi' | 'en'>(language);

  // Keep the preview following the app language; the toggle above still lets
  // the admin preview the other language until the app language changes again.
  useEffect(() => {
    setPreviewLang(language);
  }, [language]);
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
  const [eventAddress, setEventAddress] = useState(DEFAULT_EVENT_ADDRESS);
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
    setEventAddress(DEFAULT_EVENT_ADDRESS);
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
    // If the event has no address, or its address is just the church
    // street address (the old default), show the new default instead.
    // A real offsite address is kept as-is.
    const churchAddr = (churchInfo?.address || 'Tempe, Arizona').trim();
    const savedAddr = (evt.address || '').trim();
    setEventAddress(!savedAddr || savedAddr === churchAddr ? DEFAULT_EVENT_ADDRESS : savedAddr);
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
        cardBg: 'bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/35 dark:from-emerald-950/50 dark:via-stone-900 dark:to-emerald-950/25 border-emerald-200/90 dark:border-emerald-800/50 shadow-xs',
        dateBox: 'bg-emerald-100/90 dark:bg-emerald-950/70 text-emerald-950 dark:text-emerald-100 border-emerald-200/90 dark:border-emerald-800/60',
        monthText: 'text-emerald-800 dark:text-emerald-300',
        badge: 'bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60',
        icon: Users,
      };
    }
    if (lower.includes('worship') || lower.includes('thờ phượng')) {
      return {
        cardBg: 'bg-gradient-to-br from-indigo-50/90 via-white to-indigo-50/35 dark:from-indigo-950/50 dark:via-stone-900 dark:to-indigo-950/25 border-indigo-200/90 dark:border-indigo-800/50 shadow-xs',
        dateBox: 'bg-indigo-100/90 dark:bg-indigo-950/70 text-indigo-950 dark:text-indigo-100 border-indigo-200/90 dark:border-indigo-800/60',
        monthText: 'text-indigo-800 dark:text-indigo-300',
        badge: 'bg-indigo-100/80 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60',
        icon: Flame,
      };
    }
    if (lower.includes('bible') || lower.includes('kinh thánh')) {
      return {
        cardBg: 'bg-gradient-to-br from-amber-50/90 via-white to-amber-50/35 dark:from-amber-950/50 dark:via-stone-900 dark:to-amber-950/25 border-amber-200/90 dark:border-amber-800/50 shadow-xs',
        dateBox: 'bg-amber-100/90 dark:bg-amber-950/70 text-amber-950 dark:text-amber-100 border-amber-200/90 dark:border-amber-800/60',
        monthText: 'text-amber-800 dark:text-amber-300',
        badge: 'bg-amber-100/80 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60',
        icon: BookOpen,
      };
    }
    return {
      cardBg: 'bg-gradient-to-br from-purple-50/90 via-white to-purple-50/35 dark:from-purple-950/50 dark:via-stone-900 dark:to-purple-950/25 border-purple-200/90 dark:border-purple-800/50 shadow-xs',
      dateBox: 'bg-purple-100/90 dark:bg-purple-950/70 text-purple-950 dark:text-purple-100 border-purple-200/90 dark:border-purple-800/60',
      monthText: 'text-purple-800 dark:text-purple-300',
      badge: 'bg-purple-100/80 dark:bg-purple-950/60 text-purple-900 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60',
      icon: Star,
    };
  })();
  const PreviewCategoryIcon = previewTheme.icon;

  const previewDateObj = eventDate ? new Date(eventDate + 'T00:00:00') : new Date();
  const previewMonth = isNaN(previewDateObj.getTime())
    ? 'VRC'
    : previewDateObj.toLocaleDateString(previewLang === 'vi' ? 'vi-VN' : 'en-US', { month: 'short' });
  const previewDay = isNaN(previewDateObj.getTime())
    ? '01'
    : previewDateObj.getDate();
  const previewWeekday = isNaN(previewDateObj.getTime())
    ? t('weekdaySunday')
    : previewDateObj.toLocaleDateString(previewLang === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'short' });

  if (activeTab !== 'create-event' && activeTab !== 'manage-events') return null;

  if (activeTab === 'manage-events') {
    return (
      <div className={s.listContainer}>
        {events.length === 0 ? (
          <p className={s.emptyState}>{t('adminEventNoEvents')}</p>
        ) : (
          <div className={s.list}>
            {events.map((evt) => {
              const todayStr = new Date().toISOString().split('T')[0];
              const isPast = evt.date < todayStr;
              return (
                <div key={evt.id} className={s.item}>
                  <div className={s.itemBody}>
                    <div className={s.itemMeta}>
                      <span className={s.itemTitle}>{evt.title}</span>
                      <span className={s.categoryBadge}>
                        {evt.category}
                      </span>
                      {isPast ? (
                        <span className={s.pastBadge}>
                          {t('adminEventPast')}
                        </span>
                      ) : (
                        <span className={s.upcomingBadge}>
                          {t('adminEventUpcoming')}
                        </span>
                      )}
                    </div>
                    <p className={s.itemDetails}>
                      {evt.date} • {evt.startTime} • {evt.location}{evt.address && evt.address !== evt.location ? ` • ${evt.address}` : ''}
                    </p>
                  </div>

                  <div className={s.itemActions}>
                    <button
                      onClick={() => handleEditEvent(evt)}
                      className={s.editBtn}
                      title="Edit"
                    >
                      <Edit3 className={s.actionIcon} />
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(evt.id)}
                      className={s.deleteBtn}
                      title="Delete"
                    >
                      <Trash2 className={s.actionIcon} />
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
    <div className={s.container}>
      {/* Event Form Card (Exact same design as Daily Verses) */}
      <form onSubmit={handleSaveEvent} className={s.form}>
        <div className={s.formHeader}>
          <div className={s.headerGroup}>
            <h3 className={s.formTitle}>
              {editingEventId
                ? t('adminEventEditFormTitle')
                : t('adminEventFormTitle')}
            </h3>
            {editingEventId && (
              <button
                type="button"
                onClick={resetEventForm}
                className={s.cancelEditBtn}
              >
                {t('cancelEdit')}
              </button>
            )}
          </div>
        </div>

        {editingEventId && editingEventAudit && (
          <div className={s.auditBox}>
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

        <div className={s.fieldGrid}>
          <div className={s.field}>
            <label className={s.label}>
              {t('adminEventTitleVi')}
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Lễ Thờ Phượng Chúa Nhật"
              value={eventTitleVi}
              onChange={(e) => setEventTitleVi(e.target.value)}
              className={s.inputFocus}
            />
          </div>

          <div className={s.field}>
            <label className={s.label}>
              {t('adminEventTitleEn')}
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sunday Worship Celebration"
              value={eventTitleEn}
              onChange={(e) => setEventTitleEn(e.target.value)}
              className={s.inputFocus}
            />
          </div>
        </div>

        <div className={s.fieldGrid}>
          <div className={s.field}>
            <label className={s.label}>
              {t('adminEventDescVi')}
            </label>
            <textarea
              rows={3}
              required
              placeholder="Chủ đề bài giảng, diễn giả, thông tin sinh hoạt..."
              value={eventDescriptionVi}
              onChange={(e) => setEventDescriptionVi(e.target.value)}
              className={s.textareaFocus}
            />
          </div>

          <div className={s.field}>
            <label className={s.label}>
              {t('adminEventDescEn')}
            </label>
            <textarea
              rows={3}
              required
              placeholder="Event details, sermon theme, speaker..."
              value={eventDescriptionEn}
              onChange={(e) => setEventDescriptionEn(e.target.value)}
              className={s.textareaFocus}
            />
          </div>
        </div>

        <div className={s.fieldGrid3}>
          <div className={s.field}>
            <label className={s.label}>
              {t('adminEventCategory')}
            </label>
            <select
              value={eventCategory}
              onChange={(e) => setEventCategory(e.target.value)}
              className={s.input}
            >
              <option value="Worship">Worship (Thờ Phượng)</option>
              <option value="Bible Study">Bible Study (Kinh Thánh)</option>
              <option value="Youth">Youth (Giới Trẻ)</option>
              <option value="Special Gathering">Special Gathering</option>
            </select>
          </div>

          <div className={s.fieldOverflow}>
            <label className={s.label}>
              {t('adminEventDate')}
            </label>
            <input
              type="date"
              required
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className={s.inputDate}
            />
          </div>

          <div className={s.field}>
            <label className={s.label}>
              {t('eventStartTime')}
            </label>
            <input
              type="text"
              required
              placeholder="03:00 PM"
              value={eventStartTime}
              onChange={(e) => setEventStartTime(e.target.value)}
              className={s.input}
            />
          </div>
        </div>

        <div className={s.fieldGrid}>
          <div className={s.field}>
            <label className={s.label}>
              {t('eventEndTime')}
            </label>
            <input
              type="text"
              placeholder="05:00 PM"
              value={eventEndTime}
              onChange={(e) => setEventEndTime(e.target.value)}
              className={s.input}
            />
          </div>

          <div className={s.field}>
            <label className={s.label}>
              {t('adminEventLocation')}
            </label>
            <input
              type="text"
              required
              placeholder="Main Sanctuary, Fellowship Hall..."
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              className={s.input}
            />
          </div>
        </div>

        <div className={s.field}>
          <div className={s.addressLabelRow}>
            <label className={s.labelPlain}>
              {t('adminEventAddress')}
            </label>
            <span className={s.hintText}>
              {t('adminEventAddressHint')}
            </span>
          </div>
          <input
            type="text"
            placeholder={churchInfo?.address || 'Tempe, Arizona'}
            value={eventAddress}
            onChange={(e) => setEventAddress(e.target.value)}
            className={s.input}
          />
          <p className={s.noteText}>
            {t('adminEventAddressNote', { address: churchInfo?.address || 'Tempe, Arizona' })}
          </p>
        </div>

        <div className={s.featuredRow}>
          <label className={s.featuredLabel}>
            <input
              type="checkbox"
              checked={eventIsFeatured}
              onChange={(e) => setEventIsFeatured(e.target.checked)}
              className={s.checkbox}
            />
            <span>{t('adminEventFeatured')}</span>
          </label>
        </div>

        <div className={s.submitRow}>
          <button
            type="submit"
            disabled={submitting}
            className={s.saveBtn}
          >
            <Save className={s.saveIcon} />
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
      <div className={s.previewSection}>
        <div className={s.previewHeader}>
          <span>{t('headerVersePreview')}</span>
          <div className={s.previewLangToggle}>
            <button
              type="button"
              onClick={() => setPreviewLang('vi')}
              className={previewLang === 'vi' ? s.previewLangBtnActive : s.previewLangBtnIdle}
            >
              Tiếng Việt
            </button>
            <button
              type="button"
              onClick={() => setPreviewLang('en')}
              className={previewLang === 'en' ? s.previewLangBtnActive : s.previewLangBtnIdle}
            >
              English
            </button>
          </div>
        </div>

        <div className={`${s.previewCard} ${previewTheme.cardBg}`}>
          {/* Top Row: Category Pill + Featured Pill + Date */}
          <div className={s.previewTopRow}>
            <div className={s.previewPills}>
              <span
                className={`${s.categoryPill} ${previewTheme.badge}`}
              >
                <PreviewCategoryIcon className={s.categoryIcon} />
                <span>{eventCategory || 'Worship'}</span>
              </span>
              {eventIsFeatured && (
                <span className={s.featuredBadge}>
                  <Star className={s.featuredStar} />
                  <span>{t('adminEventFeaturedBadge')}</span>
                </span>
              )}
            </div>

            <span className={s.previewDateText}>
              {previewWeekday}{eventDate ? `, ${eventDate}` : ''}
            </span>
          </div>

          {/* Main Content Area */}
          <div className={s.previewMain}>
            {/* Distinct Calendar Date Card */}
            <div className={`${s.dateBox} ${previewTheme.dateBox}`}>
              <span className={`${s.monthText} ${previewTheme.monthText}`}>
                {previewMonth}
              </span>
              <span className={s.previewDay}>
                {previewDay}
              </span>
            </div>

            {/* Title, Time, Location */}
            <div className={s.previewContent}>
              <h4 className={s.previewTitle}>
                {(previewLang === 'vi' ? (eventTitleVi || eventTitleEn) : (eventTitleEn || eventTitleVi)) || t('adminEventTitlePlaceholder')}
              </h4>

              <div className={s.previewMeta}>
                <span className={s.previewMetaItem}>
                  <Clock className={s.previewMetaIcon} />
                  <span>{eventStartTime || '03:00 PM'}{eventEndTime ? ` - ${eventEndTime}` : ''}</span>
                </span>

                <span className={s.previewMetaItem}>
                  <MapPin className={s.previewMetaIcon} />
                  <span className={s.previewLocation}>
                    {eventLocation || 'Main Sanctuary'} • {eventAddress.trim() || churchInfo?.address || 'Tempe, AZ'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Description Preview */}
          <p className={s.previewDesc}>
            {(previewLang === 'vi' ? (eventDescriptionVi || eventDescriptionEn) : (eventDescriptionEn || eventDescriptionVi)) || t('adminEventDescPlaceholder')}
          </p>
        </div>
      </div>
    </div>
  );
};
