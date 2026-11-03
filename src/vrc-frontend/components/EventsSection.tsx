import React, { useState } from 'react';
import { ChurchEvent } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
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
} from 'lucide-react';
import { getGoogleCalendarUrl, downloadIcsFile } from '../utils/calendar.ts';

interface EventsSectionProps {
  events: ChurchEvent[];
  isAdmin: boolean;
  onOpenAdminPortal?: (tab?: string) => void;
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
  onOpenAdminPortal,
}) => {
  const { language, t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDescId, setExpandedDescId] = useState<number | null>(null);

  const filteredEvents = events.filter((e) => {
    const matchesCat =
      selectedCategory === 'All' ||
      e.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.location.toLowerCase().includes(searchQuery.toLowerCase());
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
        cardBg: 'bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/35 border-emerald-200/90 shadow-xs hover:border-emerald-300',
        dateBox: 'bg-emerald-100/90 text-emerald-950 border-emerald-200/90',
        monthText: 'text-emerald-800',
        badge: 'bg-emerald-100/80 text-emerald-900 border-emerald-200/80',
        icon: Users,
        iconColor: 'text-emerald-600',
        actionBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      };
    }
    if (lower.includes('worship') || lower.includes('thờ phượng')) {
      return {
        cardBg: 'bg-gradient-to-br from-indigo-50/90 via-white to-indigo-50/35 border-indigo-200/90 shadow-xs hover:border-indigo-300',
        dateBox: 'bg-indigo-100/90 text-indigo-950 border-indigo-200/90',
        monthText: 'text-indigo-800',
        badge: 'bg-indigo-100/80 text-indigo-900 border-indigo-200/80',
        icon: Flame,
        iconColor: 'text-indigo-600',
        actionBtn: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      };
    }
    if (lower.includes('bible') || lower.includes('kinh thánh')) {
      return {
        cardBg: 'bg-gradient-to-br from-amber-50/90 via-white to-amber-50/35 border-amber-200/90 shadow-xs hover:border-amber-300',
        dateBox: 'bg-amber-100/90 text-amber-950 border-amber-200/90',
        monthText: 'text-amber-800',
        badge: 'bg-amber-100/80 text-amber-900 border-amber-200/80',
        icon: BookOpen,
        iconColor: 'text-amber-600',
        actionBtn: 'bg-amber-600 hover:bg-amber-700 text-white',
      };
    }
    if (lower.includes('prayer') || lower.includes('cầu nguyện')) {
      return {
        cardBg: 'bg-gradient-to-br from-sky-50/90 via-white to-sky-50/35 border-sky-200/90 shadow-xs hover:border-sky-300',
        dateBox: 'bg-sky-100/90 text-sky-950 border-sky-200/90',
        monthText: 'text-sky-800',
        badge: 'bg-sky-100/80 text-sky-900 border-sky-200/80',
        icon: Sparkles,
        iconColor: 'text-sky-600',
        actionBtn: 'bg-sky-600 hover:bg-sky-700 text-white',
      };
    }
    if (lower.includes('fellowship') || lower.includes('thông công')) {
      return {
        cardBg: 'bg-gradient-to-br from-rose-50/90 via-white to-rose-50/35 border-rose-200/90 shadow-xs hover:border-rose-300',
        dateBox: 'bg-rose-100/90 text-rose-950 border-rose-200/90',
        monthText: 'text-rose-800',
        badge: 'bg-rose-100/80 text-rose-900 border-rose-200/80',
        icon: Heart,
        iconColor: 'text-rose-600',
        actionBtn: 'bg-rose-600 hover:bg-rose-700 text-white',
      };
    }
    return {
      cardBg: 'bg-gradient-to-br from-purple-50/90 via-white to-purple-50/35 border-purple-200/90 shadow-xs hover:border-purple-300',
      dateBox: 'bg-purple-100/90 text-purple-950 border-purple-200/90',
      monthText: 'text-purple-800',
      badge: 'bg-purple-100/80 text-purple-900 border-purple-200/80',
      icon: Star,
      iconColor: 'text-purple-600',
      actionBtn: 'bg-purple-600 hover:bg-purple-700 text-white',
    };
  };

  return (
    <section className="py-4 sm:py-8 px-3.5 sm:px-6 max-w-4xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-700 block">
            Tempe, Arizona
          </span>
          <h2 className="text-xl sm:text-3xl font-serif font-bold text-stone-950 tracking-tight">
            {t('eventsTitle')}
          </h2>
        </div>

        {isAdmin && onOpenAdminPortal && (
          <button
            onClick={() => onOpenAdminPortal('create-event')}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-stone-950 hover:bg-stone-800 active:scale-95 text-white rounded-xl sm:rounded-2xl text-xs font-semibold shadow-xs transition-all flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{t('heroAddEvent')}</span>
          </button>
        )}
      </div>

      {/* iOS Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-stone-100/90 hover:bg-stone-100 border border-stone-200/70 rounded-2xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:bg-white transition-all shadow-2xs"
        />
      </div>

      {/* Filter Category Pills */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-1 px-0.5 -mx-1">
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

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-stone-200/70 p-8 shadow-xs">
          <Calendar className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <p className="font-serif font-bold text-stone-900 text-base">{t('noEvents')}</p>
          <p className="text-stone-500 text-xs mt-1">{t('noEventsSub')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((evt) => {
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
                className={`rounded-3xl border p-5 sm:p-6 transition-all duration-200 space-y-3.5 ${theme.cardBg}`}
              >
                {/* Top Row: Category Pill + Featured Pill + Date */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${theme.badge}`}
                    >
                      <CategoryIcon className="w-3 h-3" />
                      <span>{getCategoryLabel(evt.category)}</span>
                    </span>
                    {evt.isFeatured && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded-full">
                        {t('featuredBadge')}
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-semibold text-stone-500">
                    {weekday}, {evt.date}
                  </span>
                </div>

                {/* Main Content Area */}
                <div className="flex items-start gap-4">
                  {/* Distinct Calendar Date Card */}
                  <div className={`flex-shrink-0 w-14 sm:w-16 text-center rounded-2xl border p-2 shadow-2xs ${theme.dateBox}`}>
                    <span className={`block text-[10px] font-bold uppercase tracking-wider ${theme.monthText}`}>
                      {monthShort}
                    </span>
                    <span className="block text-xl sm:text-2xl font-serif font-bold text-stone-950 leading-tight">
                      {dayNum}
                    </span>
                  </div>

                  {/* Title & Timing */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <h3 className="text-base sm:text-lg font-serif font-bold text-stone-950 leading-snug">
                      {evt.title}
                    </h3>

                    {/* Time & Location Chips */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600">
                      <div className="flex items-center gap-1.5 font-medium text-stone-800">
                        <Clock className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                        <span>{evt.startTime}{evt.endTime ? ` – ${evt.endTime}` : ''}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-stone-600">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                        <span className="truncate">{evt.location}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description: Spacious, breathable, easily readable */}
                <div className="text-stone-700 text-xs sm:text-sm leading-relaxed pt-1 bg-white/60 p-3.5 rounded-2xl border border-stone-200/50">
                  <p className={isDescExpanded ? '' : 'line-clamp-2'}>
                    {evt.description}
                  </p>
                  {evt.description.length > 110 && (
                    <button
                      onClick={() => setExpandedDescId(isDescExpanded ? null : evt.id)}
                      className="text-[11px] font-bold text-amber-800 hover:text-amber-950 inline-flex items-center gap-0.5 mt-1.5"
                    >
                      <span>{isDescExpanded ? (language === 'vi' ? 'Thu gọn' : 'Show less') : (language === 'vi' ? 'Xem thêm' : 'Read more')}</span>
                      {isDescExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  )}
                </div>

                {/* Footer Actions: Organizer + Calendar buttons */}
                <div className="pt-2 border-t border-stone-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  {evt.organizerName ? (
                    <p className="text-[11px] text-stone-500">
                      {t('contactLead')}: <span className="text-stone-800 font-semibold">{evt.organizerName}</span>
                    </p>
                  ) : <div />}

                  <div className="flex items-center gap-2">
                    <a
                      href={getGoogleCalendarUrl(evt)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-white hover:bg-stone-50 active:scale-95 text-stone-800 border border-stone-200 rounded-xl text-xs font-semibold transition-all shadow-2xs"
                    >
                      <CalendarPlus className="w-3.5 h-3.5 text-amber-700" />
                      <span>{t('addToGoogle')}</span>
                    </a>
                    <button
                      onClick={() => downloadIcsFile(evt)}
                      className="inline-flex items-center justify-center gap-1 px-3 py-1.5 sm:px-3.5 sm:py-2 text-stone-600 hover:text-stone-900 bg-white/70 hover:bg-white active:scale-95 border border-stone-200 rounded-xl text-xs font-semibold transition-all shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5 text-stone-500" />
                      <span>Apple</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
