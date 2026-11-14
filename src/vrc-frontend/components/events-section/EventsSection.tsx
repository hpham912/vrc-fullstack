import React, { useState } from 'react';
import { ChurchEvent, ChurchInfo } from '../../types/index.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import {
  Calendar,
  Clock,
  MapPin,
  Search,
  Plus,
  CalendarPlus,
  Download,
  Sparkles,
  BookOpen,
  Users,
  Flame,
  Star,
  Heart,
  ChevronDown,
  ChevronUp,
  History,
  CheckCircle2,
  Eye,
  Pencil,
  Trash2,
  Compass,
  Navigation,
  Save,
} from 'lucide-react';
import {
  ConfirmModal,
  CalendarButtons,
  FeaturedStar,
  AdminActionButtons,
  AdminAddButton,
  Button,
  Card,
  EventDetailModal,
  LoadingShimmer,
  ZoomButton,
} from '../../common-component/index.ts';
import { apiUrl, apiHeaders } from '../../utils/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  formatDateLocale,
  getWeekdayName,
  getEventCardWeekday,
  getMonthText,
  getDayNumber,
} from '../../utils/dateFormatter.ts';
import { getCategoryTheme, getCategoryLabel as getCategoryLabelUtil } from '../../utils/categoryTheme.ts';
import { eventsSectionStyles as s } from './EventsSection.styles.ts';

interface EventsSectionProps {
  events: ChurchEvent[];
  churchInfo?: ChurchInfo | null;
  isAdmin: boolean;
  onRefresh?: () => void;
  onOpenAdminPortal?: (tab?: string, eventToEdit?: ChurchEvent | null) => void;
  isLoading?: boolean;
}

const CATEGORIES = [
  { key: 'All', icon: Sparkles },
  { key: 'Worship', icon: Flame },
  { key: 'Youth', icon: Users },
  { key: 'Bible Study', icon: BookOpen },
  { key: 'Special Gathering', icon: Star },
];

export const EventsSection: React.FC<EventsSectionProps> = ({
  events,
  churchInfo,
  isAdmin,
  onRefresh,
  onOpenAdminPortal,
  isLoading = false,
}) => {
  const { language, t } = useLanguage();
  const { getToken } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDescId, setExpandedDescId] = useState<number | null>(null);
  const [selectedDetailEvent, setSelectedDetailEvent] = useState<ChurchEvent | null>(null);
  const [deleteTargetEvent, setDeleteTargetEvent] = useState<ChurchEvent | null>(null);
  const [deletingEvent, setDeletingEvent] = useState(false);
  const [deletedIds, setDeletedIds] = useState<Set<number>>(new Set());
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ChurchEvent | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState('Worship');
  const [formDate, setFormDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('03:00 PM');
  const [formEndTime, setFormEndTime] = useState('05:00 PM');
  const [formLocation, setFormLocation] = useState('Main Sanctuary');
  const [formAddress, setFormAddress] = useState('Tempe, Arizona');
  const [formFeatured, setFormFeatured] = useState(false);
  const [savingEvent, setSavingEvent] = useState(false);

  const openCreateModal = () => {
    setEditingEvent(null);
    setFormTitle('');
    setFormDesc('');
    setFormCategory('Worship');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormStartTime('03:00 PM');
    setFormEndTime('05:00 PM');
    setFormLocation('Main Sanctuary');
    setFormAddress('Tempe, Arizona');
    setFormFeatured(false);
    setEditModalOpen(true);
  };

  const openEditModal = (evt: ChurchEvent) => {
    setEditingEvent(evt);
    setFormTitle(evt.title);
    setFormDesc(evt.description);
    setFormCategory(evt.category);
    setFormDate(evt.date);
    setFormStartTime(evt.startTime);
    setFormEndTime(evt.endTime || '');
    setFormLocation(evt.location);
    setFormAddress(evt.address || 'Tempe, Arizona');
    setFormFeatured(evt.isFeatured);
    setEditModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDesc.trim() || !formDate || !formStartTime || !formLocation.trim()) return;
    try {
      setSavingEvent(true);
      const token = getToken();
      const url = editingEvent ? apiUrl(`/api/events/${editingEvent.id}`) : apiUrl('/api/events');
      const res = await fetch(url, {
        method: editingEvent ? 'PUT' : 'POST',
        headers: apiHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        }),
        body: JSON.stringify({
          title: formTitle.trim(),
          description: formDesc.trim(),
          category: formCategory,
          date: formDate,
          startTime: formStartTime,
          endTime: formEndTime || null,
          location: formLocation.trim(),
          address: formAddress.trim() || 'Tempe, Arizona',
          isFeatured: formFeatured,
        }),
      });
      if (res.ok) {
        setEditModalOpen(false);
        onRefresh?.();
      }
    } finally {
      setSavingEvent(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetEvent) return;
    try {
      setDeletingEvent(true);
      const token = getToken();
      const res = await fetch(apiUrl(`/api/events/${deleteTargetEvent.id}`), {
        method: 'DELETE',
        headers: apiHeaders({ Authorization: `Bearer ${token}` }),
      });
      if (res.ok) {
        const deletedId = deleteTargetEvent.id;
        setDeletedIds((prev) => new Set(prev).add(deletedId));
        setDeleteTargetEvent(null);
        onRefresh?.();
      }
    } finally {
      setDeletingEvent(false);
    }
  };

  // Current local date in YYYY-MM-DD
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Current & Upcoming events (today and future)
  const upcomingEvents = events
    .filter((e) => !deletedIds.has(e.id) && e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  // Past events: strictly maintain the 3 most recent concluded events
  const pastEvents = events
    .filter((e) => !deletedIds.has(e.id) && e.date < todayStr)
    .sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime))
    .slice(0, 3);

  // Filter current & upcoming events by category & search
  const filteredUpcomingEvents = upcomingEvents.filter((e) => {
    const matchesCat =
      selectedCategory === 'All' ||
      e.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.address && e.address.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const getCategoryLabel = (cat: string) => {
    return getCategoryLabelUtil(cat, language, t);
  };

  return (
    <section className={s.section}>
      {/* Header */}
      <div className={s.headerRow}>
        <div className="min-w-0">
          <span className={s.headerSubtitle}>
            Tempe, Arizona
          </span>
          <h2 className={s.headerTitle}>
            {t('eventsTitle')}
          </h2>
        </div>

        {isAdmin && onOpenAdminPortal && (
          <AdminAddButton
            onClick={() => onOpenAdminPortal('create-event')}
            title={t('heroAddEvent')}
          />
        )}
      </div>

      {/* iOS Search Bar */}
      <div className={s.searchWrapper}>
        <Search className={s.searchIcon} />
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={s.searchInput}
        />
      </div>

      {/* Filter Category Pills */}
      <div className={s.filterRow}>
        {CATEGORIES.map(({ key, icon: Icon }) => {
          const isSelected = selectedCategory === key;
          return (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`${s.filterPillBase} ${
                isSelected ? s.filterPillActive : s.filterPillInactive
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400' : 'text-stone-600'}`} />
              <span>{getCategoryLabel(key)}</span>
            </button>
          );
        })}
      </div>

      {/* Events List (Current & Upcoming Events) */}
      {isLoading ? (
        <LoadingShimmer variant="card" count={3} />
      ) : filteredUpcomingEvents.length === 0 ? (
        <Card variant="empty" padding="empty">
          <Calendar className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <p className={s.emptyTitle}>{t('noEvents')}</p>
          <p className={s.emptySub}>{t('noEventsSub')}</p>
        </Card>
      ) : (
        <div className={s.listContainer}>
          {filteredUpcomingEvents.map((evt) => {
            const weekday = getEventCardWeekday(evt.date, language);
            const monthShort = getMonthText(evt.date, language, true);
            const dayNum = getDayNumber(evt.date);
            const theme = getCategoryTheme(evt.category);
            const CategoryIcon = theme.icon;

            return (
              <div
                key={evt.id}
                onClick={() => setSelectedDetailEvent(evt)}
                className={`${s.eventCardBase} ${theme.cardBg}`}
              >
                {/* Top Row: Category Pill + Featured Badge + Admin Actions */}
                <div className={s.cardTopRow}>
                  <div className={s.badgeGroup}>
                    <span className={`${s.categoryBadgeBase} ${theme.badge}`}>
                      <CategoryIcon className="w-3 h-3" />
                      <span>{getCategoryLabel(evt.category)}</span>
                    </span>
                    {evt.isFeatured && (
                      <span className={s.featuredBadge}>
                        <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                        <span>{t('featuredBadge')}</span>
                      </span>
                    )}
                  </div>

                  {isAdmin && (
                    <div className={s.adminActionRow} onClick={(e) => e.stopPropagation()}>
                      <AdminActionButtons
                        onEdit={onOpenAdminPortal ? () => onOpenAdminPortal('create-event', evt) : undefined}
                        onDelete={() => setDeleteTargetEvent(evt)}
                      />
                    </div>
                  )}
                </div>

                {/* Main Content Area: Date Box + Title & Timing & Location */}
                <div className={s.cardMainRow}>
                  <div className={`${s.dateBoxBase} ${theme.dateBox}`}>
                    <span className={s.dateBoxWeekday}>
                      {weekday}
                    </span>
                    <span className={s.dateBoxDay}>
                      {dayNum}
                    </span>
                    <span className={`${s.dateBoxMonthBase} ${theme.monthText}`}>
                      {monthShort}
                    </span>
                  </div>

                  {/* Title & Timing & Location (no description, click to see details) */}
                  <div className={s.cardRightCol}>
                    <h3 className={s.cardTitle}>
                      {language === 'vi' ? (evt.titleVi || (evt.title || '')) : (evt.titleEn || (evt.title || ''))}
                    </h3>

                    <div className={s.cardTimeRow}>
                      <Clock className="w-3.5 h-3.5 text-amber-800 dark:text-amber-400 flex-shrink-0" />
                      <span>{evt.startTime}{evt.endTime ? ` – ${evt.endTime}` : ''}</span>
                    </div>

                    {evt.location && (
                      <div className={s.cardLocationRow}>
                        <MapPin className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 flex-shrink-0" />
                        <span className="truncate">
                          {language === 'vi' ? (evt.locationVi || (evt.location || '')) : (evt.locationEn || (evt.location || ''))}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer row: Zoom button next to the calendar button */}
                <div className={s.cardFooterRow}>
                  <ZoomButton event={evt} meetingId={churchInfo?.zoomMeetingId} passcode={churchInfo?.zoomPasscode} stopPropagation className="flex-1 justify-center" />
                  <CalendarButtons event={evt} stopPropagation variant="menu" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Past Events Section */}
      {pastEvents.length > 0 && (
        <div className={s.pastSection}>
          <div className={s.pastHeaderRow}>
            <div className="space-y-0.5 min-w-0">
              <div className={s.pastLabel}>
                <History className="w-4 h-4 text-stone-400 dark:text-stone-500" />
                <span>{t('eventsPastTitle')}</span>
              </div>
              <p className={s.pastSub}>
                <span className={s.labelFull}>{t('eventsPastSub')}</span>
                <span className={s.labelShort}>{t('eventsPastSubShort')}</span>
              </p>
            </div>
            <span className={s.pastCountBadge}>
              {pastEvents.length} {t('eventsUnit')}
            </span>
          </div>

          <div className="space-y-3 w-full min-w-0 max-w-full">
            {pastEvents.map((evt) => {
              const weekday = getEventCardWeekday(evt.date, language);
              const monthShort = getMonthText(evt.date, language, true);
              const dayNum = getDayNumber(evt.date);
              const theme = getCategoryTheme(evt.category);
              const CategoryIcon = theme.icon;

              return (
                <div
                  key={evt.id}
                  className={s.pastCard}
                >
                  {/* Top Row: Category Pill + Concluded Badge + Admin actions */}
                  <div className={s.cardTopRow}>
                    <div className={s.badgeGroup}>
                      <span className={s.pastCategoryPill}>
                        <CategoryIcon className="w-3 h-3 text-stone-500 dark:text-stone-400" />
                        <span>{getCategoryLabel(evt.category)}</span>
                      </span>
                      <span className={s.concludedPill}>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>{t('eventsConcluded')}</span>
                      </span>
                    </div>

                    {isAdmin && (
                      <div className={s.adminActionRow} onClick={(e) => e.stopPropagation()}>
                        <AdminActionButtons
                          onEdit={onOpenAdminPortal ? () => onOpenAdminPortal('create-event', evt) : undefined}
                          onDelete={() => setDeleteTargetEvent(evt)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Main Content Area: Date Box + Title & Time & Location (disabled style) */}
                  <div className={s.cardMainRow}>
                    <div className={s.pastDateBox}>
                      <span className={s.pastDateBoxWeekday}>
                        {weekday}
                      </span>
                      <span className={s.pastDateBoxDay}>
                        {dayNum}
                      </span>
                      <span className={s.pastDateBoxMonth}>
                        {monthShort}
                      </span>
                    </div>

                    <div className={s.cardRightCol}>
                      <h4 className={s.pastTitle}>
                        {language === 'vi' ? (evt.titleVi || (evt.title || '')) : (evt.titleEn || (evt.title || ''))}
                      </h4>

                      <div className={s.pastTimeRow}>
                        <Clock className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 flex-shrink-0" />
                        <span>{evt.startTime}{evt.endTime ? ` – ${evt.endTime}` : ''}</span>
                      </div>

                      {evt.location && (
                        <div className={s.pastLocationRow}>
                          <MapPin className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 flex-shrink-0" />
                          <span className="truncate">
                            {language === 'vi' ? (evt.locationVi || (evt.location || '')) : (evt.locationEn || (evt.location || ''))}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Event Details Popup Modal */}
      <EventDetailModal
        event={selectedDetailEvent}
        zoomMeetingId={churchInfo?.zoomMeetingId}
        zoomPasscode={churchInfo?.zoomPasscode}
        onClose={() => setSelectedDetailEvent(null)}
      />
      {/* Common Confirmation Modal for Delete */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetEvent)}
        title={t('eventsDeleteTitle')}
        message={t('eventsDeleteConfirm', { title: (language === 'vi' ? deleteTargetEvent?.titleVi : deleteTargetEvent?.titleEn) || deleteTargetEvent?.title || '' })}
        confirmText={t('commonDelete')}
        loading={deletingEvent}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetEvent(null)}
      />

      {/* Event Create / Edit Modal */}
      {editModalOpen && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs"
          onClick={() => setEditModalOpen(false)}
        >
          <form
            onSubmit={handleSaveEvent}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#161412] text-stone-900 dark:text-stone-100 rounded-3xl border border-stone-200 dark:border-stone-800 max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-serif font-bold text-stone-950 dark:text-stone-50">
                {editingEvent ? t('eventEditTitle') : t('eventsAddFormTitle')}
              </h3>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="p-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 dark:text-stone-400 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  {t('eventsTitleLabel')}
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    {t('eventsCategory')}
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Worship">Worship</option>
                    <option value="Bible Study">Bible Study</option>
                    <option value="Youth">Youth</option>
                    <option value="Prayer">Prayer</option>
                    <option value="Fellowship">Fellowship</option>
                    <option value="Special Gathering">Special Gathering</option>
                  </select>
                </div>

                <div className="overflow-hidden">
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    {t('eventsDate')}
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="appearance-none min-w-0 w-full max-w-full box-border px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    {t('eventStartTime')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    placeholder="03:00 PM"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    {t('eventEndTime')}
                  </label>
                  <input
                    type="text"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    placeholder="05:00 PM"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    {t('eventsLocation')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    {t('eventsAddress')}
                  </label>
                  <input
                    type="text"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  {t('eventsDescription')}
                </label>
                <textarea
                  rows={3}
                  required
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 dark:text-stone-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formFeatured}
                  onChange={(e) => setFormFeatured(e.target.checked)}
                  className="rounded border-stone-300 dark:border-stone-700 text-amber-600 focus:ring-amber-500"
                />
                <span>{t('eventsFeatured')}</span>
              </label>
            </div>

            <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setEditModalOpen(false)}>
                {t('commonCancel')}
              </Button>
              <Button
                type="submit"
                variant="dark"
                size="md"
                disabled={savingEvent}
                leftIcon={<Save className="w-3.5 h-3.5" />}
              >
                <span>
                  {savingEvent
                    ? t('commonSaving')
                    : editingEvent
                    ? t('commonSaveChanges')
                    : t('commonSave')}
                </span>
              </Button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};
