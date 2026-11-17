import React from 'react';
import { CheckCircle2, Clock, MapPin, Star } from 'lucide-react';
import { ChurchEvent, ChurchInfo } from '../../types/index.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { getCategoryLabel, getCategoryTheme } from '../../utils/categoryTheme.ts';
import { getDayNumber, getEventCardWeekday, getMonthText } from '../../utils/dateFormatter.ts';
import {
  AdminActionButtons,
  CalendarButtons,
  DetailCard,
  ZoomButton,
} from '../index.ts';
import { eventCardStyles } from './EventCard.styles.ts';

export interface EventCardProps {
  event: ChurchEvent;
  // 'current' = the Design B tinted card (upcoming); 'past' = the muted
  // card (concluded, no footer, not clickable).
  variant?: 'current' | 'past';
  // Opens the detail modal when the card is tapped. Ignored when
  // variant is 'past'. When absent, the card is not clickable.
  onClick?: () => void;
  // Show the event description under the location (Home's highlight).
  showDescription?: boolean;
  // Admin edit/delete buttons (EventsSection, when isAdmin). Shown when
  // either callback is set.
  onEdit?: () => void;
  onDelete?: () => void;
  // Featured badge: 'auto' (default) shows it only when the event is
  // featured; 'show' always shows it (Home's highlight); 'hide' never
  // shows it. Past cards show the Concluded pill instead, never the
  // featured badge.
  featuredBadge?: 'auto' | 'show' | 'hide';
  // Church info for the Zoom button (meetingId/passcode). The Zoom
  // button renders nothing without a meeting ID.
  churchInfo?: ChurchInfo | null;
}

// The event card (Design B), built on the generic DetailCard: it maps
// the event into the card's slots (date box, badges, title, time /
// location, description, Zoom + calendar footer). One card, used by the
// Events tab (current + past) and the Home highlight — so a fix or a
// design change lands everywhere at once instead of being re-applied
// in three places.
export const EventCard: React.FC<EventCardProps> = ({
  event,
  variant = 'current',
  onClick,
  showDescription = false,
  onEdit,
  onDelete,
  featuredBadge = 'auto',
  churchInfo,
}) => {
  const { language, t } = useLanguage();
  const isPast = variant === 'past';
  const weekday = getEventCardWeekday(event.date, language);
  const monthShort = getMonthText(event.date, language, true);
  const dayNum = getDayNumber(event.date);
  const theme = getCategoryTheme(event.category);
  const CategoryIcon = theme.icon;
  const title =
    language === 'vi'
      ? event.titleVi || event.title || ''
      : event.titleEn || event.title || '';
  const location =
    language === 'vi'
      ? event.locationVi || event.location || ''
      : event.locationEn || event.location || '';
  const description =
    language === 'vi'
      ? event.descriptionVi || event.description || ''
      : event.descriptionEn || event.description || '';
  const showFeaturedBadge =
    !isPast &&
    (featuredBadge === 'show' ||
      (featuredBadge === 'auto' && event.isFeatured));
  const showAdminActions = Boolean(onEdit || onDelete);

  // Leading visual: the calendar date box.
  const leading = isPast ? (
    <div className={eventCardStyles.pastDateBox}>
      <span className={eventCardStyles.pastDateBoxWeekday}>{weekday}</span>
      <span className={eventCardStyles.pastDateBoxDay}>{dayNum}</span>
      <span className={eventCardStyles.pastDateBoxMonth}>{monthShort}</span>
    </div>
  ) : (
    <div className={`${eventCardStyles.dateBoxBase} ${theme.dateBox}`}>
      <span className={eventCardStyles.dateBoxWeekday}>{weekday}</span>
      <span className={eventCardStyles.dateBoxDay}>{dayNum}</span>
      <span className={`${eventCardStyles.dateBoxMonthBase} ${theme.monthText}`}>{monthShort}</span>
    </div>
  );

  // Top-row badges: category pill + featured / concluded pill.
  const badges = (
    <>
      {isPast ? (
        <span className={eventCardStyles.pastCategoryPill}>
          <CategoryIcon className="w-3 h-3 text-stone-500 dark:text-stone-400" />
          <span>{getCategoryLabel(event.category, language, t)}</span>
        </span>
      ) : (
        <span className={`${eventCardStyles.categoryBadgeBase} ${theme.badge}`}>
          <CategoryIcon className="w-3 h-3" />
          <span>{getCategoryLabel(event.category, language, t)}</span>
        </span>
      )}
      {isPast ? (
        <span className={eventCardStyles.concludedPill}>
          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span>{t('eventsConcluded')}</span>
        </span>
      ) : (
        showFeaturedBadge && (
          <span className={eventCardStyles.featuredBadge}>
            <Star className={eventCardStyles.featuredStar} />
            <span>{t('featuredBadge')}</span>
          </span>
        )
      )}
    </>
  );

  // Title + time / location rows (+ description on the Home highlight).
  const titleElement = (
    <h3 className={isPast ? eventCardStyles.pastTitle : eventCardStyles.cardTitle}>{title}</h3>
  );
  const meta = (
    <>
      <div className={isPast ? eventCardStyles.pastTimeRow : eventCardStyles.cardTimeRow}>
        <Clock
          className={
            isPast
              ? 'w-3.5 h-3.5 text-stone-400 dark:text-stone-500 flex-shrink-0'
              : 'w-3.5 h-3.5 text-amber-800 dark:text-amber-400 flex-shrink-0'
          }
        />
        <span>
          {event.startTime}
          {event.endTime ? ` – ${event.endTime}` : ''}
        </span>
      </div>
      {location && (
        <div className={isPast ? eventCardStyles.pastLocationRow : eventCardStyles.cardLocationRow}>
          <MapPin
            className={
              isPast
                ? 'w-3.5 h-3.5 text-stone-400 dark:text-stone-500 flex-shrink-0'
                : 'w-3.5 h-3.5 text-amber-700 dark:text-amber-400 flex-shrink-0'
            }
          />
          <span className="truncate">{location}</span>
        </div>
      )}
    </>
  );
  const descriptionElement =
    !isPast && showDescription && description ? (
      <p className={eventCardStyles.cardDesc}>{description}</p>
    ) : undefined;

  return (
    <DetailCard
      leading={leading}
      badges={badges}
      actions={
        showAdminActions ? (
          <AdminActionButtons onEdit={onEdit} onDelete={onDelete} />
        ) : undefined
      }
      title={titleElement}
      meta={meta}
      description={descriptionElement}
      footer={
        <>
          <ZoomButton
            event={event}
            meetingId={churchInfo?.zoomMeetingId}
            passcode={churchInfo?.zoomPasscode}
            stopPropagation
            className="flex-1 justify-center"
          />
          <CalendarButtons event={event} stopPropagation variant="menu" />
        </>
      }
      onClick={onClick}
      muted={isPast}
      className={theme.cardBg}
    />
  );
};
