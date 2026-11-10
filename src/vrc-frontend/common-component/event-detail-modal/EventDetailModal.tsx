import React from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { ChurchEvent } from '../../types/index.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { Modal, Card, DirectionButtons, CalendarButtons, ZoomButton } from '../index.ts';
import { formatWeekdayAndDate } from '../../utils/dateFormatter.ts';
import { getCategoryLabel } from '../../utils/categoryTheme.ts';
import { eventDetailModalStyles as s } from './EventDetailModal.styles.ts';

interface EventDetailModalProps {
  event: ChurchEvent | null;
  zoomMeetingId?: string | null;
  zoomPasscode?: string | null;
  onClose: () => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, zoomMeetingId, zoomPasscode, onClose }) => {
  const { language, t } = useLanguage();

  return (
    <Modal
      isOpen={Boolean(event)}
      onClose={onClose}
      subtitle={event ? getCategoryLabel(event.category, language, t) : undefined}
      title={
        event
          ? language === 'vi'
            ? (event.titleVi || event.titleEn || event.title)
            : (event.titleEn || event.titleVi || event.title)
          : undefined
      }
      maxWidthClass="max-w-md"
    >
      {event && (
        <div className={s.detailModalBody}>
          <Card variant="subtle" padding="sm" className={s.detailCard}>
            <div className={s.detailDateRow}>
              <Calendar className={s.detailIcon} />
              <span>{formatWeekdayAndDate(event.date, language)}</span>
            </div>
            <div className={s.detailTimeRow}>
              <Clock className={s.detailIcon} />
              <span>
                {event.startTime}
                {event.endTime ? ` – ${event.endTime}` : ''}
              </span>
            </div>
            <div className={s.detailLocationRow}>
              <div className={s.detailLocationLeft}>
                <MapPin className={s.detailIconTop} />
                <div>
                  <p className={s.detailLocationName}>
                    {language === 'vi'
                      ? (event.locationVi || event.locationEn || event.location)
                      : (event.locationEn || event.locationVi || event.location)}
                  </p>
                  {event.address && (
                    <p className={s.detailAddress}>{event.address}</p>
                  )}
                </div>
              </div>
              <DirectionButtons
                address={event.address || event.location}
                className="flex-shrink-0"
              />
            </div>
          </Card>

          <ZoomButton event={event} meetingId={zoomMeetingId} passcode={zoomPasscode} className="w-full justify-center" />

          <div className={s.detailDescBlock}>
            <h4 className={s.detailDescHeading}>{t('eventsDetailTitle')}</h4>
            <p className={s.detailDescText}>
              {language === 'vi'
                ? (event.descriptionVi || event.descriptionEn || event.description)
                : (event.descriptionEn || event.descriptionVi || event.description)}
            </p>
          </div>

          <CalendarButtons event={event} variant="full" />
        </div>
      )}
    </Modal>
  );
};
