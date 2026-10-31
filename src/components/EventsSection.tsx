import React, { useState } from 'react';
import { ChurchEvent } from '../types.ts';
import {
  Calendar,
  Clock,
  MapPin,
  Search,
  Filter,
  Users,
  PlusCircle,
  Share2,
  CalendarPlus,
  Download,
  Sparkles,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { getGoogleCalendarUrl, downloadIcsFile } from '../utils/calendar.ts';

interface EventsSectionProps {
  events: ChurchEvent[];
  isAdmin: boolean;
  onRsvpClick: (event: ChurchEvent) => void;
  onOpenAdminPortal?: (tab?: string) => void;
}

const CATEGORIES = [
  'All',
  'Worship',
  'Bible Study',
  'Youth',
  'Community Outreach',
  'Prayer',
];

export const EventsSection: React.FC<EventsSectionProps> = ({
  events,
  isAdmin,
  onRsvpClick,
  onOpenAdminPortal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter events
  const filteredEvents = events.filter((e) => {
    const matchesCat =
      selectedCategory === 'All' ||
      e.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const featuredEvent = events.find((e) => e.isFeatured) || events[0];

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Church Gatherings & Fellowship
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 mt-2">
            Upcoming Church Events
          </h2>
          <p className="text-stone-600 text-sm mt-1 max-w-xl">
            Join our church family for weekly services, bible studies, youth activities, and community service. Everyone is welcome.
          </p>
        </div>

        {isAdmin && onOpenAdminPortal && (
          <button
            onClick={() => onOpenAdminPortal('create-event')}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            Post New Church Event
          </button>
        )}
      </div>

      {/* Featured Event Hero (if exists) */}
      {featuredEvent && (
        <div className="mb-10 relative overflow-hidden rounded-3xl bg-stone-900 text-white shadow-xl border border-stone-800">
          <div className="p-8 sm:p-10 lg:p-12 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500 text-stone-950">
                  <Sparkles className="w-3.5 h-3.5" />
                  Featured Gathering
                </span>
                <span className="text-xs font-medium bg-stone-800 text-amber-300 px-3 py-1 rounded-full border border-stone-700">
                  {featuredEvent.category}
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-white tracking-tight leading-snug">
                {featuredEvent.title}
              </h3>

              <p className="text-stone-300 text-sm sm:text-base leading-relaxed line-clamp-3">
                {featuredEvent.description}
              </p>

              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-stone-300 pt-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>
                    {new Date(featuredEvent.date + 'T00:00:00').toLocaleDateString(undefined, {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>{featuredEvent.startTime} {featuredEvent.endTime ? `- ${featuredEvent.endTime}` : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span>{featuredEvent.location}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onRsvpClick(featuredEvent)}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  RSVP for Gathering
                </button>
                <a
                  href={getGoogleCalendarUrl(featuredEvent)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white rounded-xl text-sm font-medium border border-stone-700 transition-colors flex items-center gap-2"
                >
                  <CalendarPlus className="w-4 h-4 text-amber-400" />
                  Add to Calendar
                </a>
              </div>
            </div>

            {/* Quick stats / Host badge */}
            <div className="lg:col-span-4 bg-stone-800/80 rounded-2xl p-6 border border-stone-700/80 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-700">
                <span className="text-xs uppercase tracking-wider text-stone-400 font-semibold">
                  Community RSVP
                </span>
                <span className="text-amber-400 font-bold text-sm flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {featuredEvent.rsvpCount} Attending
                </span>
              </div>
              <div>
                <span className="text-xs text-stone-400 block mb-1">Host & Ministry Lead</span>
                <p className="text-sm font-semibold text-white">
                  {featuredEvent.organizerName || 'Grace & Truth Ministry Team'}
                </p>
                {featuredEvent.organizerEmail && (
                  <p className="text-xs text-amber-300 truncate">{featuredEvent.organizerEmail}</p>
                )}
              </div>
              <div className="pt-2">
                <span className="text-xs text-stone-400 block mb-1">Location Details</span>
                <p className="text-xs text-stone-300">
                  {featuredEvent.location} {featuredEvent.address ? `• ${featuredEvent.address}` : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 mb-8 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white hover:bg-stone-200 text-stone-700 border border-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search events or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-stone-200">
          <Calendar className="w-12 h-12 text-stone-400 mx-auto mb-3" />
          <h3 className="font-serif text-lg font-bold text-stone-800">
            No events found
          </h3>
          <p className="text-stone-500 text-xs mt-1">
            Try adjusting your category filter or search query.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt) => {
            const eventDate = new Date(evt.date + 'T00:00:00');
            const monthStr = eventDate.toLocaleDateString(undefined, { month: 'short' });
            const dayStr = eventDate.toLocaleDateString(undefined, { day: 'numeric' });
            const weekdayStr = eventDate.toLocaleDateString(undefined, { weekday: 'short' });

            return (
              <div
                key={evt.id}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="p-6">
                  {/* Date badge & Category */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-13 rounded-xl bg-amber-50 border border-amber-200 flex flex-col items-center justify-center text-center shadow-xs">
                        <span className="text-[10px] font-bold uppercase text-amber-700 tracking-wider">
                          {monthStr}
                        </span>
                        <span className="text-lg font-serif font-bold text-stone-900 leading-none">
                          {dayStr}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide block">
                          {weekdayStr}
                        </span>
                        <span className="text-xs font-medium text-amber-700 bg-amber-50/80 px-2 py-0.5 rounded border border-amber-100">
                          {evt.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-stone-500">
                      <Users className="w-3.5 h-3.5 text-stone-400" />
                      <span>{evt.rsvpCount}</span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h4 className="font-serif text-lg font-bold text-stone-900 group-hover:text-amber-800 transition-colors line-clamp-2 leading-snug">
                    {evt.title}
                  </h4>

                  <p className="text-stone-600 text-xs sm:text-sm line-clamp-3 mt-2 leading-relaxed">
                    {evt.description}
                  </p>

                  {/* Location & Time details */}
                  <div className="mt-4 pt-4 border-t border-stone-100 space-y-1.5 text-xs text-stone-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <span className="font-medium text-stone-700">
                        {evt.startTime} {evt.endTime ? `- ${evt.endTime}` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <span className="truncate">
                        {evt.location} {evt.address ? `• ${evt.address}` : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <a
                      href={getGoogleCalendarUrl(evt)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-white hover:bg-stone-100 text-stone-600 hover:text-amber-700 border border-stone-200 transition-colors"
                      title="Add to Google Calendar"
                    >
                      <CalendarPlus className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => downloadIcsFile(evt)}
                      className="p-2 rounded-lg bg-white hover:bg-stone-100 text-stone-600 hover:text-amber-700 border border-stone-200 transition-colors"
                      title="Download iCal file"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => onRsvpClick(evt)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                  >
                    <span>RSVP / Attend</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
