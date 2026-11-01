import React, { useState } from 'react';
import { ChurchEvent } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import {
  Calendar,
  Clock,
  MapPin,
  Search,
  Plus,
  CalendarPlus,
  Download,
} from 'lucide-react';
import { getGoogleCalendarUrl, downloadIcsFile } from '../utils/calendar.ts';

interface EventsSectionProps {
  events: ChurchEvent[];
  isAdmin: boolean;
  onOpenAdminPortal?: (tab?: string) => void;
}

const CATEGORIES = ['All', 'Worship', 'Bible Study', 'Youth', 'Special Gathering'];

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
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-6 border-b border-stone-200/80">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-amber-700 block mb-1">
            Hội Thánh Phục Hưng Việt Nam • Tempe, Arizona
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 tracking-tight">
            {t('eventsTitle')}
          </h2>
          <p className="text-stone-500 text-sm mt-1 max-w-xl">
            {t('eventsSubtitle')}
          </p>
        </div>

        {isAdmin && onOpenAdminPortal && (
          <button
            onClick={() => onOpenAdminPortal('create-event')}
            className="flex items-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{t('heroAddEvent')}</span>
          </button>
        )}
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-stone-900 text-white'
                  : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200 hover:border-stone-300'
              }`}
            >
              {getCategoryLabel(cat)}
            </button>
          ))}
        </div>

        <div className="relative min-w-[200px] sm:w-64">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-stone-400 transition-colors"
          />
        </div>
      </div>

      {/* Events List / Cards */}
      {filteredEvents.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-stone-200/60 p-8">
          <Calendar className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <p className="font-serif font-bold text-stone-800 text-base">{t('noEvents')}</p>
          <p className="text-stone-500 text-xs mt-1">{t('noEventsSub')}</p>
        </div>
      ) : (
        <div className="space-y-4">
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
                className="bg-white rounded-2xl border border-stone-200/80 p-6 sm:p-7 hover:border-stone-300 transition-all shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Left content */}
                  <div className="space-y-2.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200/60">
                        {getCategoryLabel(evt.category)}
                      </span>
                      {evt.isFeatured && (
                        <span className="text-[11px] font-semibold text-stone-800 bg-stone-100 px-2.5 py-0.5 rounded-md">
                          {t('featuredBadge')}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 leading-snug">
                      {evt.title}
                    </h3>

                    {/* Metadata line */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600 pt-1">
                      <div className="flex items-center gap-1.5 font-medium text-stone-800">
                        <Calendar className="w-4 h-4 text-amber-700" />
                        <span>{dateFormatted}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-700" />
                        <span>{evt.startTime}{evt.endTime ? ` – ${evt.endTime}` : ''}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-amber-700" />
                        <span>{evt.location}{evt.address ? ` (${evt.address})` : ''}</span>
                      </div>
                    </div>

                    <p className="text-stone-600 text-sm leading-relaxed pt-1">
                      {evt.description}
                    </p>

                    {evt.organizerName && (
                      <p className="text-xs text-stone-400">
                        {t('contactLead')}: <span className="text-stone-600 font-medium">{evt.organizerName}</span>
                        {evt.organizerEmail ? ` • ${evt.organizerEmail}` : ''}
                      </p>
                    )}
                  </div>

                  {/* Right: Calendar export action */}
                  <div className="flex sm:flex-col items-center gap-2 pt-2 sm:pt-0 sm:self-center flex-shrink-0">
                    <a
                      href={getGoogleCalendarUrl(evt)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-colors"
                      title="Add to Google Calendar"
                    >
                      <CalendarPlus className="w-3.5 h-3.5 text-amber-700" />
                      <span>{t('addToGoogle')}</span>
                    </a>
                    <button
                      onClick={() => downloadIcsFile(evt)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-stone-500 hover:text-stone-900 rounded-xl text-xs font-medium transition-colors"
                      title="Download .ics file"
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
