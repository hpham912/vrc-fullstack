import React, { useState } from 'react';
import { ChurchEvent } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAutoTranslate } from '../hooks/useAutoTranslate.ts';
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
} from 'lucide-react';
import { getGoogleCalendarUrl, downloadIcsFile } from '../utils/calendar.ts';
import { ConfirmModal } from '../common-component/ConfirmModal.tsx';
import { Modal } from '../common-component/Modal.tsx';
import { apiUrl } from '../utils/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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
        headers: { Authorization: `Bearer ${token}` },
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
    const lower = cat.toLowerCase();
    if (lower.includes('all')) return t('catAll');
    if (lower.includes('worship') || lower.includes('thờ phượng')) return t('catWorship');
    if (lower.includes('youth') || lower.includes('giới trẻ') || lower.includes('thanh niên')) return t('catYouth');
    if (lower.includes('bible') || lower.includes('kinh thánh')) return t('catBibleStudy');
    if (lower.includes('prayer') || lower.includes('cầu nguyện')) return t('catPrayer');
    if (lower.includes('fellowship') || lower.includes('thông công')) return t('catFellowship');
    if (lower.includes('special') || lower.includes('đặc biệt')) return t('catSpecial');
    return cat;
  };

  // Category Theme Styles: Soft tinted background, border & date box accent (Youth design aesthetic)
  const getCategoryTheme = (cat: string) => {
    const lower = cat.toLowerCase();
    if (lower.includes('youth') || lower.includes('giới trẻ') || lower.includes('thanh niên')) {
      return {
        cardBg: 'bg-gradient-to-br from-emerald-100/85 via-emerald-50/70 to-teal-100/75 border border-stone-900/10 shadow-sm hover:shadow-md',
        dateBox: 'bg-white/95 text-emerald-950 border border-stone-900/10',
        monthText: 'text-emerald-800',
        badge: 'bg-emerald-700 text-white',
        icon: Users,
        iconColor: 'text-emerald-700',
        actionBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      };
    }
    if (lower.includes('worship') || lower.includes('thờ phượng')) {
      return {
        cardBg: 'bg-gradient-to-br from-indigo-100/85 via-indigo-50/70 to-violet-100/75 border border-stone-900/10 shadow-sm hover:shadow-md',
        dateBox: 'bg-white/95 text-indigo-950 border border-stone-900/10',
        monthText: 'text-indigo-800',
        badge: 'bg-indigo-700 text-white',
        icon: Flame,
        iconColor: 'text-indigo-700',
        actionBtn: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      };
    }
    if (lower.includes('bible') || lower.includes('kinh thánh')) {
      return {
        cardBg: 'bg-gradient-to-br from-amber-100/85 via-amber-50/70 to-orange-100/75 border border-stone-900/10 shadow-sm hover:shadow-md',
        dateBox: 'bg-white/95 text-amber-950 border border-stone-900/10',
        monthText: 'text-amber-800',
        badge: 'bg-amber-700 text-white',
        icon: BookOpen,
        iconColor: 'text-amber-700',
        actionBtn: 'bg-amber-600 hover:bg-amber-700 text-white',
      };
    }
    if (lower.includes('prayer') || lower.includes('cầu nguyện')) {
      return {
        cardBg: 'bg-gradient-to-br from-sky-100/85 via-sky-50/70 to-cyan-100/75 border border-stone-900/10 shadow-sm hover:shadow-md',
        dateBox: 'bg-white/95 text-sky-950 border border-stone-900/10',
        monthText: 'text-sky-800',
        badge: 'bg-sky-700 text-white',
        icon: Sparkles,
        iconColor: 'text-sky-700',
        actionBtn: 'bg-sky-600 hover:bg-sky-700 text-white',
      };
    }
    if (lower.includes('fellowship') || lower.includes('thông công')) {
      return {
        cardBg: 'bg-gradient-to-br from-rose-100/85 via-rose-50/70 to-pink-100/75 border border-stone-900/10 shadow-sm hover:shadow-md',
        dateBox: 'bg-white/95 text-rose-950 border border-stone-900/10',
        monthText: 'text-rose-800',
        badge: 'bg-rose-700 text-white',
        icon: Heart,
        iconColor: 'text-rose-700',
        actionBtn: 'bg-rose-600 hover:bg-rose-700 text-white',
      };
    }
    return {
      cardBg: 'bg-gradient-to-br from-purple-100/85 via-purple-50/70 to-fuchsia-100/75 border border-stone-900/10 shadow-sm hover:shadow-md',
      dateBox: 'bg-white/95 text-purple-950 border border-stone-900/10',
      monthText: 'text-purple-800',
      badge: 'bg-purple-700 text-white',
      icon: Star,
      iconColor: 'text-purple-700',
      actionBtn: 'bg-purple-600 hover:bg-purple-700 text-white',
    };
  };

  return (
    <section className="py-4 sm:py-8 px-3.5 sm:px-6 max-w-4xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in duration-300 w-full min-w-0 max-w-full overflow-x-clip box-border">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 min-w-0 w-full">
        <div className="min-w-0">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800 block">
            Tempe, Arizona
          </span>
          <h2 className="text-xl sm:text-3xl font-serif font-bold text-stone-950 tracking-tight truncate">
            {t('eventsTitle')}
          </h2>
        </div>

        {isAdmin && onOpenAdminPortal && (
          <button
            onClick={() => onOpenAdminPortal('create-event')}
            className="w-8 h-8 rounded-xl bg-stone-950 hover:bg-stone-800 active:scale-95 text-amber-400 flex items-center justify-center shadow-xs transition-all flex-shrink-0"
            title={t('heroAddEvent')}
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* iOS Search Bar */}
      <div className="relative w-full min-w-0">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-full box-border pl-10 pr-4 py-2.5 bg-stone-100/90 hover:bg-stone-100 border border-stone-200/70 rounded-2xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:bg-white transition-all shadow-2xs"
        />
      </div>

      {/* Filter Category Pills */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-1 px-0.5 w-full max-w-full">
        {CATEGORIES.map(({ key, icon: Icon }) => {
          const isSelected = selectedCategory === key;
          return (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 flex-shrink-0 ${
                isSelected
                  ? 'bg-stone-950 text-white shadow-xs ring-2 ring-stone-950/20'
                  : 'bg-white text-stone-600 hover:text-stone-950 border border-stone-200/90 shadow-2xs hover:bg-stone-50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400' : 'text-stone-400'}`} />
              <span>{getCategoryLabel(key)}</span>
            </button>
          );
        })}
      </div>

      {/* Events List (Current & Upcoming Events) */}
      {filteredUpcomingEvents.length === 0 ? (
        <div className="py-12 sm:py-16 text-center bg-white rounded-3xl border border-stone-200/70 p-8 shadow-xs">
          <Calendar className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <p className="font-serif font-bold text-stone-900 text-base">{t('noEvents')}</p>
          <p className="text-stone-500 text-xs mt-1">{t('noEventsSub')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredUpcomingEvents.map((evt) => {
            const eventDate = new Date(evt.date + 'T00:00:00');
            const monthShort = eventDate.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'short' });
            const dayNum = eventDate.getDate();
            const weekday = eventDate.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'short' });
            const isDescExpanded = expandedDescId === evt.id;
            const theme = getCategoryTheme(evt.category);
            const CategoryIcon = theme.icon;

            return (
              <div
                key={evt.id}
                onClick={() => setSelectedDetailEvent(evt)}
                className={`rounded-2xl p-3.5 sm:p-4 transition-all duration-150 space-y-2.5 w-full min-w-0 max-w-full overflow-hidden box-border cursor-pointer active:scale-[0.985] active:brightness-95 select-none ${theme.cardBg}`}
              >
                {/* Top Row: Category Pill + Featured Pill + Date */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 min-w-0 w-full">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${theme.badge}`}
                    >
                      <CategoryIcon className="w-3 h-3" />
                      <span>{getCategoryLabel(evt.category)}</span>
                    </span>
                    {evt.isFeatured && (
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-950 bg-amber-200/95 px-2.5 py-0.5 rounded-full">
                        {t('featuredBadge')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-stone-700 whitespace-nowrap">
                      {weekday}, {evt.date}
                    </span>
                    {isAdmin && onOpenAdminPortal && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAdminPortal('create-event', evt);
                        }}
                        className="p-1 rounded-lg bg-white/80 hover:bg-white text-stone-700 transition-colors"
                        title={language === 'vi' ? 'Sửa' : 'Edit'}
                      >
                        <Pencil className="w-3 h-3 text-amber-700" />
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTargetEvent(evt);
                        }}
                        className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                        title={language === 'vi' ? 'Xóa' : 'Delete'}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 w-full max-w-full">
                  {/* Compact Calendar Date Card */}
                  <div className={`flex-shrink-0 w-12 text-center rounded-xl p-1.5 shadow-2xs ${theme.dateBox}`}>
                    <span className={`block text-[10px] font-bold uppercase tracking-wider ${theme.monthText}`}>
                      {monthShort}
                    </span>
                    <span className="block text-base sm:text-lg font-serif font-bold text-stone-950 leading-tight">
                      {dayNum}
                    </span>
                  </div>

                  {/* Title & Timing */}
                  <div className="flex-1 min-w-0 space-y-0.5 max-w-full">
                    <h3 className="text-base sm:text-lg font-serif font-bold text-stone-950 leading-snug break-words">
                      {language === 'vi' ? (evt.titleVi || tr(evt.title)) : (evt.titleEn || tr(evt.title))}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-stone-800">
                      <Clock className="w-3.5 h-3.5 text-amber-800 flex-shrink-0" />
                      <span>{evt.startTime}{evt.endTime ? ` – ${evt.endTime}` : ''}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions: Compact Calendar buttons on one line */}
                <div className="pt-2 border-t border-stone-900/10 flex items-center justify-end gap-2 min-w-0 w-full">
                  <a
                    href={getGoogleCalendarUrl(evt)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-white/95 hover:bg-white active:scale-95 text-stone-900 rounded-lg text-xs font-semibold transition-all shadow-2xs whitespace-nowrap"
                  >
                    <CalendarPlus className="w-3.5 h-3.5 text-amber-800" />
                    <span>GCal</span>
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadIcsFile(evt);
                    }}
                    className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-stone-800 hover:text-stone-950 bg-white/90 hover:bg-white active:scale-95 rounded-lg text-xs font-semibold transition-all shadow-2xs whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5 text-stone-700" />
                    <span>iCal</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Section at the bottom of event tab that shows past events (strictly up to 3 recent past events) */}
      {pastEvents.length > 0 && (
        <div className="pt-8 sm:pt-10 border-t border-stone-200 space-y-4 w-full min-w-0 max-w-full overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 min-w-0 w-full">
            <div className="space-y-0.5 min-w-0">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-600">
                <History className="w-4 h-4 text-stone-400" />
                <span>{language === 'vi' ? 'Sự Kiện Đã Diễn Ra' : 'Past Events'}</span>
              </div>
              <p className="text-xs text-stone-500">
                {language === 'vi'
                  ? 'Lưu trữ 3 sự kiện gần nhất đã hoàn tất'
                  : 'Archive of the 3 most recent concluded gatherings'}
              </p>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 border border-stone-200 whitespace-nowrap">
              {pastEvents.length} {language === 'vi' ? 'sự kiện' : 'events'}
            </span>
          </div>

          <div className="space-y-3 w-full min-w-0 max-w-full">
            {pastEvents.map((evt) => {
              const eventDate = new Date(evt.date + 'T00:00:00');
              const monthShort = eventDate.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'short' });
              const dayNum = eventDate.getDate();
              const weekday = eventDate.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'short' });
              const isDescExpanded = expandedDescId === evt.id;

              return (
                <div
                  key={evt.id}
                  className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4 sm:p-5 space-y-2.5 transition-all opacity-85 hover:opacity-100 hover:bg-stone-50 w-full min-w-0 max-w-full overflow-hidden box-border"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 min-w-0 w-full">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-200 text-stone-700">
                        {getCategoryLabel(evt.category)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{language === 'vi' ? 'Đã Diễn Ra' : 'Concluded'}</span>
                      </span>
                    </div>
                    <span className="text-xs font-medium text-stone-500 whitespace-nowrap">
                      {weekday}, {evt.date}
                    </span>
                  </div>

                  <div className="flex items-start gap-3 sm:gap-3.5 min-w-0 w-full max-w-full">
                    <div className="flex-shrink-0 w-12 text-center rounded-xl border border-stone-200 bg-white p-1.5 shadow-2xs">
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-stone-500">
                        {monthShort}
                      </span>
                      <span className="block text-lg font-serif font-bold text-stone-700 leading-tight">
                        {dayNum}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1 max-w-full">
                      <h4 className="text-sm sm:text-base font-serif font-bold text-stone-800 leading-snug break-words">
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
                    <div className="text-xs text-stone-600 leading-relaxed bg-white/70 p-2.5 rounded-xl border border-stone-200/50 min-w-0 max-w-full overflow-hidden">
                      <p className={`break-words ${isDescExpanded ? '' : 'line-clamp-2'}`}>
                        {language === 'vi' ? (evt.descriptionVi || tr(evt.description)) : (evt.descriptionEn || tr(evt.description))}
                      </p>
                      {evt.description.length > 100 && (
                        <button
                          onClick={() => setExpandedDescId(isDescExpanded ? null : evt.id)}
                          className="text-[11px] font-bold text-amber-800 hover:text-amber-950 inline-flex items-center gap-0.5 mt-1"
                        >
                          <span>{isDescExpanded ? (language === 'vi' ? 'Thu gọn' : 'Show less') : (language === 'vi' ? 'Xem thêm' : 'Read more')}</span>
                          {isDescExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  )}
                </div>
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
          <div className="p-6 space-y-4">
            <div className="space-y-2.5 text-xs sm:text-sm text-stone-700 bg-stone-50 p-4 rounded-2xl border border-stone-200/70">
              <div className="flex items-center gap-2 font-semibold text-stone-900">
                <Calendar className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <span>{selectedDetailEvent.date}</span>
              </div>
              <div className="flex items-center gap-2 font-medium text-stone-800">
                <Clock className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <span>
                  {selectedDetailEvent.startTime}
                  {selectedDetailEvent.endTime ? ` – ${selectedDetailEvent.endTime}` : ''}
                </span>
              </div>
              <div className="flex items-start gap-2 text-stone-700">
                <MapPin className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-stone-900">
                    {language === 'vi'
                      ? (selectedDetailEvent.locationVi || selectedDetailEvent.locationEn || selectedDetailEvent.location)
                      : (selectedDetailEvent.locationEn || selectedDetailEvent.locationVi || selectedDetailEvent.location)}
                  </p>
                  {selectedDetailEvent.address && (
                    <p className="text-xs text-stone-500">{selectedDetailEvent.address}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                {language === 'vi' ? 'Chi Tiết Sự Kiện' : 'Event Details'}
              </h4>
              <p className="text-stone-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                {language === 'vi'
                  ? (selectedDetailEvent.descriptionVi || selectedDetailEvent.descriptionEn || selectedDetailEvent.description)
                  : (selectedDetailEvent.descriptionEn || selectedDetailEvent.descriptionVi || selectedDetailEvent.description)}
              </p>
            </div>

            {/* Footer Actions: Clean 2-column calendar buttons on one line */}
            <div className="pt-3 border-t border-stone-200 grid grid-cols-2 gap-2.5">
              <a
                href={getGoogleCalendarUrl(selectedDetailEvent)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-stone-950 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all"
              >
                <CalendarPlus className="w-3.5 h-3.5 text-amber-400" />
                <span>Google Calendar</span>
              </a>
              <button
                onClick={() => downloadIcsFile(selectedDetailEvent)}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Apple / iCal</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
      {/* Common Confirmation Modal for Delete */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetEvent)}
        title={language === 'vi' ? 'Xóa Sự Kiện?' : 'Delete Event?'}
        message={
          language === 'vi'
            ? `Bạn có chắc chắn muốn xóa sự kiện "${deleteTargetEvent?.titleVi || deleteTargetEvent?.title}"? Hành động này không thể hoàn tác.`
            : `Are you sure you want to delete "${deleteTargetEvent?.titleEn || deleteTargetEvent?.title}"? This action cannot be undone.`
        }
        confirmText={language === 'vi' ? 'Xóa' : 'Delete'}
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
                {editingEvent
                  ? language === 'vi'
                    ? 'Chỉnh Sửa Sự Kiện'
                    : 'Edit Event'
                  : language === 'vi'
                  ? 'Thêm Sự Kiện Mới'
                  : 'Add New Event'}
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
                  {language === 'vi' ? 'Tên Sự Kiện *' : 'Event Title *'}
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
                    {language === 'vi' ? 'Danh Mục' : 'Category'}
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
                    {language === 'vi' ? 'Ngày *' : 'Date *'}
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
                    {language === 'vi' ? 'Giờ Bắt Đầu *' : 'Start Time *'}
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
                    {language === 'vi' ? 'Giờ Kết Thúc' : 'End Time'}
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
                    {language === 'vi' ? 'Địa Điểm *' : 'Location *'}
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
                    {language === 'vi' ? 'Địa Chỉ' : 'Address'}
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
                  {language === 'vi' ? 'Mô Tả *' : 'Description *'}
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
                <span>{language === 'vi' ? 'Đánh dấu Sự Kiện Nổi Bật' : 'Mark as Featured Event'}</span>
              </label>
            </div>

            <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200"
              >
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={savingEvent}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50"
              >
                {savingEvent
                  ? language === 'vi'
                    ? 'Đang lưu...'
                    : 'Saving...'
                  : language === 'vi'
                  ? 'Lưu Sự Kiện'
                  : 'Save Event'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};
