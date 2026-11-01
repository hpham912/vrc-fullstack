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
  Star,
  Flame,
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
  { key: 'Bible Study', icon: BookOpen },
  { key: 'Youth', icon: Users },
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
    switch (cat) {
      case 'All':
        return t('catAll');
      case 'Worship':
        return t('catWorship');
      case 'Bible Study':
        return t('catBibleStudy');
      case 'Youth':
        return t('catYouth');
      case 'Special Gathering':
        return t('catSpecial');
      default:
        return cat;
    }
  };

  return (
    <section className="py-5 sm:py-10 px-3.5 sm:px-6 max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* iOS App Navigation Header */}
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

      {/* iOS Style Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-stone-100/90 hover:bg-stone-100 border border-stone-200/70 rounded-2xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:bg-white transition-all"
        />
      </div>

      {/* Redesigned iOS Native Filter Pill Bar */}
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

      {/* Events List Cards (iOS Card Style) */}
      {filteredEvents.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-stone-200/70 p-8 shadow-xs">
          <Calendar className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <p className="font-serif font-bold text-stone-900 text-base">{t('noEvents')}</p>
          <p className="text-stone-500 text-xs mt-1">{t('noEventsSub')}</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredEvents.map((evt) => {
            const eventDate = new Date(evt.date + 'T00:00:00');
            const dateFormatted = eventDate.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <div
                key={evt.id}
                className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200/80 p-4 sm:p-6 shadow-xs transition-all active:scale-[0.99] space-y-3 sm:space-y-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] sm:text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-200/60 px-2.5 py-0.5 rounded-full">
                    {getCategoryLabel(evt.category)}
                  </span>
                  {evt.isFeatured && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-700 bg-stone-100 px-2 py-0.5 rounded-full">
                      {t('featuredBadge')}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base sm:text-xl font-serif font-bold text-stone-950 leading-snug">
                    {evt.title}
                  </h3>
                  <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mt-1">
                    {evt.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-xs text-stone-600 bg-stone-50/80 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-stone-100">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-700 flex-shrink-0" />
                    <span className="font-semibold text-stone-900">{dateFormatted}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-700 flex-shrink-0" />
                    <span>{evt.startTime}{evt.endTime ? ` – ${evt.endTime}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-700 flex-shrink-0" />
                    <span>{evt.location}{evt.address ? ` • ${evt.address}` : ''}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 border-t border-stone-100">
                  {evt.organizerName ? (
                    <p className="text-[11px] text-stone-400">
                      {t('contactLead')}: <span className="text-stone-700 font-medium">{evt.organizerName}</span>
                    </p>
                  ) : <div />}

                  <div className="flex items-center gap-2">
                    <a
                      href={getGoogleCalendarUrl(evt)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-800 rounded-xl text-xs font-semibold transition-all"
                    >
                      <CalendarPlus className="w-3.5 h-3.5 text-amber-700" />
                      <span>{t('addToGoogle')}</span>
                    </a>
                    <button
                      onClick={() => downloadIcsFile(evt)}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-stone-600 hover:text-stone-900 hover:bg-stone-50 active:scale-95 border border-stone-200 rounded-xl text-xs font-semibold transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{t('addToApple')}</span>
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
