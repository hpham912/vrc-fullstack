import React, { useState } from 'react';
import { ChurchEvent } from '../../types/index.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useAutoTranslate } from '../../hooks/useAutoTranslate.ts';
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
} from 'lucide-react';
import {
  Modal,
  ConfirmModal,
  DirectionButtons,
  CalendarButtons,
  FeaturedStar,
  AdminActionButtons,
  AdminAddButton,
  Card,
} from '../../common-component/index.ts';
import { apiUrl, apiHeaders } from '../../utils/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  formatDateLocale,
  getWeekdayName,
  getMonthText,
  getDayNumber,
  formatWeekdayAndDate,
} from '../../utils/dateFormatter.ts';
import { getCategoryTheme, getCategoryLabel as getCategoryLabelUtil } from '../../utils/categoryTheme.ts';
import { eventsSectionStyles as s } from './EventsSection.styles.ts';

interface EventsSectionProps {
  events: ChurchEvent[];
  isAdmin: boolean;
  onRefresh?: () => void;
  onOpenAdminPortal?: (tab?: string, eventToEdit?: ChurchEvent | null) => void;
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
  isAdmin,
  onRefresh,
  onOpenAdminPortal,
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

  const { tr } = useAutoTranslate(
    events.flatMap((e) => [e.title, e.description, e.location]),
    language
  );

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
      {filteredUpcomingEvents.length === 0 ? (
        <Card variant="empty" padding="empty">
          <Calendar className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <p className={s.emptyTitle}>{t('noEvents')}</p>
          <p className={s.emptySub}>{t('noEventsSub')}</p>
        </Card>
      ) : (
        <div className={s.listContainer}>
          {filteredUpcomingEvents.map((evt) => {
            const weekday = getWeekdayName(evt.date, language);
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
                {/* Top Row: Category Pill + Admin Actions (Date removed from top right) */}
                <div className={s.cardTopRow}>
                  <div className={s.badgeGroup}>
                    <span className={`${s.categoryBadgeBase} ${theme.badge}`}>
                      <CategoryIcon className="w-3 h-3" />
                      <span>{getCategoryLabel(evt.category)}</span>
                    </span>
                  </div>

                  {isAdmin && (
                    <div className={s.adminActionRow}>
                      <AdminActionButtons
                        onEdit={onOpenAdminPortal ? () => onOpenAdminPortal('create-event', evt) : undefined}
                        onDelete={() => setDeleteTargetEvent(evt)}
                      />
                    </div>
                  )}
                </div>

                {/* Main Content Area: tall date box + title/time + calendar menu */}
                <div className={s.cardMainRow}>
                  {/* Date box stretches the full row height, level with the calendar button */}
                  <div className={`${s.dateBoxBase} ${theme.dateBox}`}>
                    {evt.isFeatured && (
                      <FeaturedStar className={s.dateBoxStarPosition} />
                    )}
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

                  {/* Title & Timing + Calendar Menu */}
                  <div className={s.cardRightCol}>
                    <h3 className={s.cardTitle}>
                      {language === 'vi' ? (evt.titleVi || tr(evt.title)) : (evt.titleEn || tr(evt.title))}
                    </h3>

                    <div className={s.cardTimeRow}>
                      <Clock className="w-3.5 h-3.5 text-amber-800 flex-shrink-0" />
                      <span>{evt.startTime}{evt.endTime ? ` – ${evt.endTime}` : ''}</span>
                    </div>

                    <div className={s.cardMenuRow}>
                      <CalendarButtons event={evt} stopPropagation variant="menu" />
                    </div>
                  </div>
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
                <History className="w-4 h-4 text-stone-400" />
                <span>{t('eventsPastTitle')}</span>
              </div>
              <p className={s.pastSub}>
                {t('eventsPastSub')}
              </p>
            </div>
            <span className={s.pastCountBadge}>
              {pastEvents.length} {t('eventsUnit')}
            </span>
          </div>

          <div className="space-y-3 w-full min-w-0 max-w-full">
            {pastEvents.map((evt) => {
              const weekday = getWeekdayName(evt.date, language);
              const monthShort = getMonthText(evt.date, language, true);
              const dayNum = getDayNumber(evt.date);
              const isDescExpanded = expandedDescId === evt.id;

              return (
                <Card key={evt.id} variant="default" padding="sm" className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 min-w-0 w-full">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className={s.pastCategoryPill}>
                        {getCategoryLabel(evt.category)}
                      </span>
                      <span className={s.concludedPill}>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{t('eventsConcluded')}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 sm:gap-3.5 min-w-0 w-full max-w-full">
                    <div className={s.pastDateBox}>
                      <span className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-stone-600 truncate w-full text-center">
                        {weekday}
                      </span>
                      <span className="block text-xl sm:text-2xl font-bold text-stone-700 leading-none my-0.5 text-center">
                        {dayNum}
                      </span>
                      <span className="block text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-stone-500 leading-tight text-center">
                        {monthShort}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1 max-w-full">
                      <h4 className={s.pastTitle}>
                        {language === 'vi' ? (evt.titleVi || tr(evt.title)) : (evt.titleEn || tr(evt.title))}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-stone-500 min-w-0 max-w-full">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-stone-400" />
                          <span>{evt.startTime}{evt.endTime ? ` – ${evt.endTime}` : ''}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 min-w-0 max-w-full">
                          <MapPin className="w-3 h-3 text-stone-400 flex-shrink-0" />
                          <span className="truncate max-w-[200px] sm:max-w-none">{language === 'vi' ? (evt.locationVi || tr(evt.location)) : (evt.locationEn || tr(evt.location))}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {evt.description && (
                    <div className={s.pastDescBox}>
                      <p className={`break-words ${isDescExpanded ? '' : 'line-clamp-2'}`}>
                        {language === 'vi' ? (evt.descriptionVi || tr(evt.description)) : (evt.descriptionEn || tr(evt.description))}
                      </p>
                      {evt.description.length > 100 && (
                        <button
                          onClick={() => setExpandedDescId(isDescExpanded ? null : evt.id)}
                          className="text-[11px] font-bold text-amber-800 hover:text-amber-950 inline-flex items-center gap-0.5 mt-1"
                        >
                          <span>{isDescExpanded ? t('commonShowLess') : t('commonReadMore')}</span>
                          {isDescExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Event Details Popup Modal */}
      <Modal
        isOpen={Boolean(selectedDetailEvent)}
        onClose={() => setSelectedDetailEvent(null)}
        subtitle={selectedDetailEvent ? getCategoryLabel(selectedDetailEvent.category) : undefined}
        title={
          selectedDetailEvent
            ? language === 'vi'
              ? (selectedDetailEvent.titleVi || selectedDetailEvent.titleEn || selectedDetailEvent.title)
              : (selectedDetailEvent.titleEn || selectedDetailEvent.titleVi || selectedDetailEvent.title)
            : undefined
        }
        maxWidthClass="max-w-md"
      >
        {selectedDetailEvent && (
          <div className={s.detailModalBody}>
            <Card variant="subtle" padding="sm" className="space-y-2 text-xs">
              <div className="flex items-center gap-2 font-semibold text-stone-900">
                <Calendar className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <span>{formatWeekdayAndDate(selectedDetailEvent.date, language)}</span>
              </div>
              <div className="flex items-center gap-2 font-medium text-stone-800">
                <Clock className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <span>
                  {selectedDetailEvent.startTime}
                  {selectedDetailEvent.endTime ? ` – ${selectedDetailEvent.endTime}` : ''}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-stone-700">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-stone-900">
                      {language === 'vi'
                        ? (selectedDetailEvent.locationVi || selectedDetailEvent.locationEn || selectedDetailEvent.location)
                        : (selectedDetailEvent.locationEn || selectedDetailEvent.locationVi || selectedDetailEvent.location)}
                    </p>
                    {selectedDetailEvent.address && (
                      <p className="text-xs text-stone-700 font-medium">{selectedDetailEvent.address}</p>
                    )}
                  </div>
                </div>
                <DirectionButtons
                  address={selectedDetailEvent.address || selectedDetailEvent.location}
                  className="flex-shrink-0"
                />
              </div>
            </Card>

            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                {t('eventsDetailTitle')}
              </h4>
              <p className="text-stone-800 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-medium">
                {language === 'vi'
                  ? (selectedDetailEvent.descriptionVi || selectedDetailEvent.descriptionEn || selectedDetailEvent.description)
                  : (selectedDetailEvent.descriptionEn || selectedDetailEvent.descriptionVi || selectedDetailEvent.description)}
              </p>
            </div>

            <CalendarButtons
              event={selectedDetailEvent}
              variant="full"
            />
          </div>
        )}
      </Modal>
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
            className="bg-white rounded-3xl border border-stone-200 max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-serif font-bold text-stone-950">
                {editingEvent ? t('eventEditTitle') : t('eventsAddFormTitle')}
              </h3>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-500 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {t('eventsTitleLabel')}
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {t('eventsCategory')}
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {t('eventsDate')}
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="appearance-none min-w-0 w-full max-w-full box-border px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {t('eventStartTime')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    placeholder="03:00 PM"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {t('eventEndTime')}
                  </label>
                  <input
                    type="text"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    placeholder="05:00 PM"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {t('eventsLocation')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {t('eventsAddress')}
                  </label>
                  <input
                    type="text"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {t('eventsDescription')}
                </label>
                <textarea
                  rows={3}
                  required
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formFeatured}
                  onChange={(e) => setFormFeatured(e.target.checked)}
                  className="rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                />
                <span>{t('eventsFeatured')}</span>
              </label>
            </div>

            <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200"
              >
                {t('commonCancel')}
              </button>
              <button
                type="submit"
                disabled={savingEvent}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50"
              >
                {savingEvent ? t('commonSaving') : t('eventSave')}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};
